import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faXmark, faCode, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { useTheme2 } from '@grafana/ui';
import clsx from 'clsx';
import { Field } from '@grafana/data';
import { Filter, FilterOperation } from 'types/filters';
import { useSharedState } from './StateContext';

const tokenRegex = /#([A-Za-z0-9_.-]+)(!?=|~)([^#]+)#/g;
const keyRegex = /#([A-Za-z0-9_.-]*)/g;
const fullRegex = /#([A-Za-z0-9_.-=!]*)/g;
const valueRegex = /#([A-Za-z0-9_.-]+)(!?=|~)([^#]*)/g;

export interface SearchbarProps {
  fields: Field[];
  labels: string[];
}

export const Searchbar: React.FC<SearchbarProps> = ({ fields, labels }) => {
  const { userState, userDispatch, appState } = useSharedState();

  const [localValue, setLocalValue] = useState(userState.searchTerm);
  const [filteredValues, setFilteredValues] = useState<string[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [toDeleteFilterIdx, setToDeleteFilterIdx] = useState(-1);

  const skipLocalValueEffect = useRef(false);

  const theme = useTheme2();

  const filterAvailVals = useMemo(() => {
    const vals: { [key: string]: string[] } = {};

    fields.forEach((f: Field) => {
      if (f.name === 'labels') {
        f.values.forEach((o: any) => {
          for (const k in o) {
            const lk = 'labels.' + k;
            if (lk in vals) {
              if (!vals[lk].includes(o[k])) {
                vals[lk].push(o[k]);
              }
            } else {
              vals[lk] = [o[k]];
            }
          }
        });
      } else {
        const uvals = new Set(f.values);
        vals[f.name] = [...uvals];
      }
    });

    return vals;
  }, [fields]);

  useEffect(() => {
    skipLocalValueEffect.current = true;
    const timer = setTimeout(() => {
      const filteredVal = localValue.replace(/#\S*\s?/g, '').trim();
      userDispatch({ type: 'SET_SEARCHTERM', payload: filteredVal });
      skipLocalValueEffect.current = false;
    }, 500);

    return () => clearTimeout(timer);
  }, [localValue]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (skipLocalValueEffect.current) {
      return;
    }
    setLocalValue(userState.searchTerm);
  }, [userState.searchTerm]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && localValue === '') {
      if (toDeleteFilterIdx > -1) {
        const f = userState.filters[toDeleteFilterIdx];
        userDispatch({ type: 'FILTER_RM', payload: f });
        setToDeleteFilterIdx(-1);
      } else {
        setToDeleteFilterIdx(userState.filters.length - 1);
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
      const newLocalValue = localValue.replace('#' + match[1], '#' + filteredValues[selectedIdx]);
      if (localValue === newLocalValue) {
        setLocalValue(newLocalValue + '# ');
        valueChange(newLocalValue + '#');
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
        userDispatch({
          type: 'FILTER_ADD',
          payload: { key: match[1], operation: match[2] as FilterOperation, value: match[3] },
        });
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
      <div className={clsx('flex px-4 rounded-l-lg ')}>
        <FontAwesomeIcon icon={faMagnifyingGlass} />
      </div>
      <div
        className={clsx(
          `relative w-full flex items-center rounded-r-lg`,
          userState.mode === 'sql'
            ? theme.isDark
              ? 'bg-neutral-500'
              : 'bg-gray-100'
            : theme.isDark
            ? 'bg-neutral-900'
            : 'bg-white'
        )}
      >
        {userState.filters.length > 0 && (
          <div className={clsx(`text-xs pl-2 flex gap-1 font-bold`)}>
            {userState.filters.map((f: Filter, idx: number) => (
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
                  role="button"
                  onClick={() => {
                    setToDeleteFilterIdx(-1);
                    userDispatch({ type: 'FILTER_RM', payload: f });
                  }}
                />
              </div>
            ))}
          </div>
        )}

        <input
          className="flex-grow p-3 rounded-lg outline-none"
          style={{ borderTopRightRadius: '0.5rem', borderBottomRightRadius: '0.5rem', background: 'none' }}
          type="text"
          placeholder="Filter your logs. Add filters with #key[!=/=/~]value#. Free text search the message."
          value={localValue}
          onChange={(e) => valueChange(e.target.value)}
          onKeyDown={(e) => onKeyDown(e)}
          disabled={userState.mode === 'sql'}
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
        <div className="flex items-center pr-3">
          {appState.isLoading && userState.streamingMode && (
            <div className="mr-2 w-6 h-6 rounded-full animate-spin border-3 border-[#28A0A6] border-t-transparent"></div>
          )}
          {userState.mode === 'sql' && (
            <FontAwesomeIcon
              title={'Open SQL Editor'}
              icon={faPenToSquare}
              role="button"
              className={`text-lg cursor-pointer hover:text-neutral-300 pr-2`}
              onClick={() => {
                userDispatch({ type: 'OPEN_SQL_EDITOR' });
              }}
            />
          )}
          <FontAwesomeIcon
            title={userState.mode === 'sql' ? 'Exit SQL-Mode' : 'Enter SQL-Mode'}
            icon={faCode}
            role="button"
            className={`text-lg cursor-pointer hover:text-neutral-300 ${
              userState.mode === 'sql' ? 'text-fuchsia-600 drop-shadow drop-shadow-fuchsia-600/80' : ''
            }`}
            onClick={() => {
              if (userState.mode !== 'sql') {
                userDispatch({ type: 'SET_SQL', payload: appState.sqlExpression });
                userDispatch({ type: 'OPEN_SQL_EDITOR' });
              } else {
                userDispatch({ type: 'CLEAR_SQL' });
              }
              userDispatch({ type: 'SQLMODE', payload: userState.mode !== 'sql' });
            }}
          />
        </div>
      </div>
    </div>
  );
};

const truncate = (str: string, max = 5): string => {
  return str.length > max ? str.slice(0, max) + '…' : str;
};
