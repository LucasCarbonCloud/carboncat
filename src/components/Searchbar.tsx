import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useTheme2 } from '@grafana/ui';
import clsx from 'clsx';
import { Field } from '@grafana/data';
import { Filter, FilterOperation } from 'types/filters';

const tokenRegex = /#([A-Za-z0-9_.-]+)(!?=)([^#]+)#/g;
const keyRegex = /#([A-Za-z0-9_.-]*)/g;
const fullRegex = /#([A-Za-z0-9_.-=!]*)/g;
const valueRegex = /#([A-Za-z0-9_.-]+)(!?=)([^#]*)/g;

export interface SearchbarProps {
  searchTerm: string;
  fields: Field[];
  labels: string[];
  onChange: (field: string) => void;
  selectedFilters: Filter[];
  setSelectedFilters: (key: string, operation: FilterOperation, value: any, op: 'add' | 'rm') => void;
}

export const Searchbar: React.FC<SearchbarProps> = ({
  searchTerm,
  fields,
  labels,
  onChange,
  selectedFilters,
  setSelectedFilters,
}) => {
  const [localValue, setLocalValue] = useState(searchTerm);
  const [filteredValues, setFilteredValues] = useState<string[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [toDeleteFilterIdx, setToDeleteFilterIdx] = useState(-1);

  const theme = useTheme2();

  const filterAvailVals: { [key: string]: string[] } = {};

  fields.forEach((f: Field) => {
    if (f.name === 'labels') {
      f.values.forEach((o: any) => {
        for (const k in o) {
          const lk = 'labels.' + k;
          if (lk in filterAvailVals) {
            if (!filterAvailVals[lk].includes(o[k])) {
              filterAvailVals[lk].push(o[k]);
            }
          } else {
            filterAvailVals[lk] = [o[k]];
          }
        }
      });
    } else {
      const uvals = new Set(f.values);
      filterAvailVals[f.name] = [...uvals];
    }
  });

  useEffect(() => {
    setLocalValue(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [localValue, onChange]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && localValue === '') {
      if (toDeleteFilterIdx > -1) {
        const f = selectedFilters[toDeleteFilterIdx];
        setSelectedFilters(f.key, f.operation, f.value, 'rm');
        setToDeleteFilterIdx(-1);
      } else {
        setToDeleteFilterIdx(selectedFilters.length - 1);
      }
      return;
    }

    setToDeleteFilterIdx(-1);

    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        if (selectedIdx > 0) {
          setSelectedIdx(selectedIdx - 1);
        }
      } else {
        if (selectedIdx + 1 < filteredValues.length) {
          setSelectedIdx(selectedIdx + 1);
        }
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      fillFilter();
    }
  };

  const fillFilter = () => {
    fullRegex.lastIndex = 0;
    const match = fullRegex.exec(localValue);
    if (match != null && filteredValues[selectedIdx] !== undefined) {
      const newLocalValue = localValue.replace('#' + match[1], '#' + filteredValues[selectedIdx])
      if (localValue === newLocalValue) {
        setLocalValue(newLocalValue + "# ");
        valueChange(newLocalValue + "#")
      } else {
        setLocalValue(newLocalValue);
      }
    }
  };

  const valueChange = (s: string) => {
    let st = s;
    const found = st.match(tokenRegex) || [];
    found.forEach((v: string) => {
      tokenRegex.lastIndex = 0;
      const match = tokenRegex.exec(v);
      st = st.replaceAll(v, '');
      if (match != null) {
        setSelectedFilters(match[1], match[2] as FilterOperation, match[3], 'add');
      }
    });

    valueRegex.lastIndex = 0;
    const valMatch = valueRegex.exec(st);
    if (valMatch) {
      let filtered: string[] = [];
      if (filterAvailVals[valMatch[1]]) {
        filtered = filterAvailVals[valMatch[1]]
          .filter((s) => s.includes(valMatch[3]))
          .map((v: string) => {
            return valMatch[1] + valMatch[2] + v;
          });
      }
      setFilteredValues(filtered);
    }

    const match = keyRegex.exec(st);
    if (valMatch == null && match) {
      const key = match[1]; // this will be "" if only "@" was typed

      const filtered =
        key === ''
          ? labels // user only typed "@"
          : labels.filter((s) => s.includes(key));

      setFilteredValues(filtered);
    }

    if (!st.includes('#')) {
      setFilteredValues([]);
    }

    setSelectedIdx(0);
    setLocalValue(st);
  };

  return (
    <div
      className={clsx(
        'flex items-center w-full rounded-lg border-1 focus-within:ring-2 focus-within:ring-blue-500',
        theme.isDark ? 'border-neutral-200/20 bg-neutral-200/20' : 'border-neutral-200 bg-neutral-200'
      )}
    >
      <div
        className={clsx(
          'flex px-4 rounded-l-lg ',
          theme.isDark ? 'bg-neutral-200/20' : 'bg-neutral-200'
        )}
      >
          <FontAwesomeIcon icon={faMagnifyingGlass} />
      </div>
      <div className={`relative w-full flex items-center bg-white rounded-r-lg`}>
        {selectedFilters.length > 0 && (
          <div className={clsx(`text-xs pl-2 flex gap-1 font-bold`)}>
            {selectedFilters.map((f: Filter, idx: number) => (
              <div
                key={`${f.key}-${f.value}`}
                className={clsx(
                  `text-white px-2 rounded-sm py-1 select-none flex items-center shadow-sm`,
                  idx === toDeleteFilterIdx ? 'border-2 border-red-500 bg-teal-500' : 'bg-teal-700'
                )}
                title={`${f.key} ${f.operation} ${f.value}`}
              >
                <span>
                  {f.key} {f.operation} {truncate(f.value, 20)}
                </span>
                <FontAwesomeIcon
                  icon={faXmark}
                  className="pl-1 cursor-pointer hover:text-neutral-300"
                  onClick={() => {
                    setToDeleteFilterIdx(-1);
                    setSelectedFilters(f.key, f.operation, f.value, 'rm');
                  }}
                />
              </div>
            ))}
          </div>
        )}

        <input
          className="flex-grow p-3 bg-red-400 rounded-lg outline-none"
          style={{ borderTopRightRadius: '0.5rem', borderBottomRightRadius: '0.5rem' }}
          type="text"
          placeholder="Filter your logs. Add filters with #key[!=/=]value#. Free text search the message."
          value={localValue}
          onChange={(e) => valueChange(e.target.value)}
          onKeyDown={(e) => onKeyDown(e)}
        />
        {filteredValues.length > 0 && (
          <div
            className={clsx(
              `absolute left-0 top-full z-50 flex flex-col p-2 rounded-md border-1 shadow-lg cursor-pointer`,
               theme.isDark ? 'bg-neutral-800 border-neutral-600' : 'bg-neutral-50 border-neutral-200'
            )}
          >
            {filteredValues.map((v: string, idx: number) => (
              <div
                key={'filterVals' + idx}
              className={clsx(``, selectedIdx === idx ? (theme.isDark ? 'bg-neutral-50/10' : 'bg-black/10') : '')}
                onMouseEnter={() => setSelectedIdx(idx)}
                onClick={fillFilter}
              >
                {v}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const truncate = (str: string, max = 5): string => {
  return str.length > max ? str.slice(0, max) + '…' : str;
};
