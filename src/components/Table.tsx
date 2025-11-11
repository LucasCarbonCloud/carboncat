import React, { useState, useMemo, useEffect } from 'react';
import { Field } from '@grafana/data';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlassPlus, faMagnifyingGlassMinus, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { useTheme2 } from '@grafana/ui';
import clsx from 'clsx';
import { SimpleOptions } from 'types/filters';
import { prettifyHeaderNames } from 'utils/functions';
import { useSharedState } from './StateContext';

export interface TableProps {
  options: SimpleOptions;
  fields: Field[];
  keys: string[];
  lineHeight: number;
  searchTerm: string;
  setLogDetails: (idx: number | undefined) => void;
}

interface CellContentProps {
  options: SimpleOptions;
  columnName: string;
  value: any;
  searchTerm: string;
  theme: any;
}

const CellContent: React.FC<CellContentProps> = ({
  options,
  columnName,
  value,
  searchTerm,
  theme,
}) => {
  let displayValue = value;
  const dateFormat = 'MMM DD HH:mm:ss.SSS';

  const { userDispatch } = useSharedState();

  if (columnName === 'timestamp') {
    displayValue = dayjs(value).format(dateFormat);
  } else if (columnName === 'level') {
    let color;
    switch (value) {
      case 'DEBUG':
        color = 'bg-blue-500';
        break;
      case 'INFO':
        color = 'bg-green-500';
        break;
      case 'WARN':
        color = 'bg-yellow-500';
        break;
      case 'ERROR':
        color = 'bg-red-500';
        break;
      case 'FATAL':
        color = 'bg-purple-500';
        break;
      default:
        color = 'bg-gray-500';
    }
    return <div className={`w-1.5 h-6 ${color} rounded-full`} />;
  } else if (columnName === 'body') {
    // const searchTerm = getTemplateSrv().replace('$searchTerm');
    if (searchTerm !== '' && searchTerm.length > 1) {
      const partsLowerCase = value.toLowerCase().split(searchTerm.toLowerCase());
      let gIdx = 0;
      let searchTerms: string[] = [];
      const parts = partsLowerCase.map((s: string) => {
        const retval = value.substring(gIdx, gIdx + s.length);
        searchTerms.push(value.substring(gIdx + s.length, gIdx + s.length + searchTerm.length));
        gIdx += s.length + searchTerm.length;
        return retval;
      });

      return (
        <div className="flex overflow-hidden relative items-center font-mono text-sm truncate group">
          <div className="truncate">
            {parts.map((part: string, idx: number) => {
              if (idx === parts.length - 1) {
                return <span key={idx}>{part}</span>;
              }
              return (
                <React.Fragment key={idx}>
                  <span>{part}</span>
                  <span
                    className={clsx(
                      'px-1 bg-fuchsia-200 rounded-lg',
                      theme.isDark ? 'bg-fuchsia-900' : 'bg-fuchsia-200'
                    )}
                  >
                    {searchTerms[idx]}
                  </span>
                </React.Fragment>
              );
            })}
          </div>
          <div
            className={clsx(
              'group-hover:flex hidden gap-1 absolute right-0 top-0 bg-gradient-to-l pl-20 pr-1 justify-end',
              theme.isDark ? 'from-neutral-800' : 'from-neutral-100 text-neutral-400'
            )}
          >
            <FontAwesomeIcon
              className="cursor-pointer hover:text-neutral-600"
              icon={faMagnifyingGlassPlus}
              role="button"
              title="Add label to filter"
              onClick={(e) => {
                e.stopPropagation();
                userDispatch({type:"FILTER_ADD", payload:{key:columnName, operation:'=', value:displayValue}})
              }}
            />
            <FontAwesomeIcon
              className="cursor-pointer hover:text-neutral-600"
              role="button"
              icon={faMagnifyingGlassMinus}
              title="Remove label from filter"
              onClick={(e) => {
                e.stopPropagation();
                userDispatch({type:"FILTER_ADD", payload:{key:columnName, operation:'!=', value:displayValue}})
              }}
            />
            <FontAwesomeIcon
              className="cursor-pointer hover:text-neutral-600"
              role="button"
              icon={faMagnifyingGlass}
              title="View only this label"
              onClick={(e) => {
                e.stopPropagation();
                userDispatch({type:"FILTER_ONLY", payload:{key:columnName, operation:'=', value:displayValue}})
              }}
            />
          </div>
        </div>
      );
    }
  } else if (columnName.startsWith('labels.')) {
    displayValue = value[columnName.replace(/^labels\./, '')];
    if (displayValue === undefined) {
      displayValue = '';
    }
  }

  if (columnName === 'traceID') {
    return (
      <div className="relative font-mono text-sm hover:underline truncate group">
        { displayValue &&
          <a href={options.traceUrl.replace('{{ traceID }}', displayValue)} target="_blank" rel="noreferrer">
            <span className="block truncate">{displayValue}</span>
          </a>
        }
        <div
          className={clsx(
            'group-hover:flex hidden gap-1 absolute right-0 top-0 bg-gradient-to-l pl-20 pr-1 justify-end',
            theme.isDark ? 'from-neutral-800' : 'from-neutral-100 text-neutral-400'
          )}
        >
          <FontAwesomeIcon
            className="cursor-pointer hover:text-neutral-600"
            role="button"
            icon={faMagnifyingGlassPlus}
            title="Add label to filter"
            onClick={(e) => {
              e.stopPropagation();
              userDispatch({type:"FILTER_ADD", payload:{key:columnName, operation:'=', value:displayValue}})
            }}
          />
          <FontAwesomeIcon
            className="cursor-pointer hover:text-neutral-600"
            role="button"
            icon={faMagnifyingGlassMinus}
            title="Remove label from filter"
            onClick={(e) => {
              e.stopPropagation();
              userDispatch({type:"FILTER_ADD", payload:{key:columnName, operation:'!=', value:displayValue}})
            }}
          />
          <FontAwesomeIcon
            className="cursor-pointer hover:text-neutral-600"
            role="button"
            icon={faMagnifyingGlass}
            title="View only this label"
            onClick={(e) => {
              e.stopPropagation();
              userDispatch({type:"FILTER_ONLY", payload:{key:columnName, operation:'=', value:displayValue}})
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative font-mono text-sm truncate group">
      <span className="block truncate">{displayValue}</span>
      <div
        className={clsx(
          'group-hover:flex hidden gap-1 absolute right-0 top-0 bg-gradient-to-l pl-20 pr-1 justify-end',
          theme.isDark ? 'from-neutral-800' : 'from-neutral-100 text-neutral-400'
        )}
      >
        <FontAwesomeIcon
          className="cursor-pointer hover:text-neutral-600"
          role="button"
          icon={faMagnifyingGlassPlus}
          title="Add label to filter"
          onClick={(e) => {
            e.stopPropagation();
            userDispatch({type:"FILTER_ADD", payload:{key:columnName, operation:'=', value:displayValue}})
          }}
        />
        <FontAwesomeIcon
          className="cursor-pointer hover:text-neutral-600"
          role="button"
          icon={faMagnifyingGlassMinus}
          title="Remove label from filter"
          onClick={(e) => {
            e.stopPropagation();
            userDispatch({type:"FILTER_ADD", payload:{key:columnName, operation:'!=', value:displayValue}})
          }}
        />
        <FontAwesomeIcon
          className="cursor-pointer hover:text-neutral-600"
          role="button"
          icon={faMagnifyingGlass}
          title="View only this label"
          onClick={(e) => {
            e.stopPropagation();
            userDispatch({type:"FILTER_ONLY", payload:{key:columnName, operation:'=', value:displayValue}})
          }}
        />
      </div>
    </div>
  );
};

export const Table: React.FC<TableProps> = ({
  options,
  fields,
  keys,
  // showLevel,
  lineHeight,
  searchTerm,
  setLogDetails,
}) => {
  const theme = useTheme2();

  const [sortField, setSortField] = useState<string>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  let rowCount = 0
  if (fields.length > 0) {
  rowCount = fields[0].values.length;
  }
  // const rowCount = fields[0].values.length;

  // Calculate column widths - body column gets most space
  const [columnWidths, setColumnWidths] = useState<{ [key: string]: string }>(() => {
    const widths: { [key: string]: string } = {};
    keys.forEach((key) => {
      if (key === 'timestamp') { widths[key] = '180px';}
      else if (key === 'level') { widths[key] = '10px';}
      else if (key === 'traceID') { widths[key] = '200px';}
      else if (key === 'body') { widths[key] = 'minmax(300px, 1fr)';} // fills remaining space
      else { widths[key] = '150px';}
    });
    return widths;
  });

  useEffect(() => {
    setColumnWidths((prev) => {
      const newWidths: { [key: string]: string } = { ...prev };

      keys.forEach((key) => {
        if (!(key in newWidths)) {
          // default width logic
          if (key === 'timestamp') { newWidths[key] = '180px';}
          else if (key === 'level') { newWidths[key] = '10px';}
          else if (key === 'traceID') { newWidths[key] = '200px';}
          else if (key === 'body') { newWidths[key] = 'minmax(300px, 1fr)';}
          else { newWidths[key] = '150px';}
        }
      });

      return newWidths;
    });
  }, [keys]);

  const handleMouseDown = (key: string, e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;

    // get starting width in px
    const startWidth =
      columnWidths[key].endsWith('fr') || columnWidths[key].startsWith('minmax')
        ? (e.currentTarget.parentElement?.getBoundingClientRect().width || 300)
        : parseInt(columnWidths[key]);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      setColumnWidths((prev) => ({
        ...prev,
        [key]: `${Math.max(50, startWidth + deltaX)}px`,
      }));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const gridTemplateColumns = keys.map((k) => columnWidths[k]).join(' ');

  const sortedRowIndices = useMemo(() => {
    const keyIndexMap = fields.reduce((acc, field, idx) => {
      acc[field.name] = idx;
      return acc;
    }, {} as { [key: string]: number });

    const indices = Array.from({ length: rowCount }, (_, i) => i);

    return indices.sort((a, b) => {
      let aValue, bValue;

      if (sortField.startsWith('labels.')) {
        const labelKey = sortField.substring(7);
        const labelsFieldIndex = keyIndexMap['labels'];
        if (labelsFieldIndex !== undefined) {
          const aLabels = fields[labelsFieldIndex].values[a] || {};
          const bLabels = fields[labelsFieldIndex].values[b] || {};
          aValue = aLabels[labelKey] || '';
          bValue = bLabels[labelKey] || '';
        } else {
          aValue = '';
          bValue = '';
        }
      } else {
        const sortFieldIndex = keyIndexMap[sortField];
        if (sortFieldIndex === undefined) {
          return 0;
        }
        aValue = fields[sortFieldIndex].values[a];
        bValue = fields[sortFieldIndex].values[b];
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [fields, sortField, sortDirection, rowCount]);

  // const TableRowWithKeys = createTableRow(options, keys, fields, setSelectedFilters);

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const rowIndex = sortedRowIndices[index];
    const rowData = keys.map((key: string) => {
      const keyIndexMap = fields.reduce((acc, field, idx) => {
        acc[field.name] = idx;
        return acc;
      }, {} as { [key: string]: number });

      if (key.startsWith('labels.')) {
        const colIdx = keyIndexMap['labels'];
        return fields[colIdx].values[rowIndex];
      }
      const colIdx = keyIndexMap[key];
      return fields[colIdx].values[rowIndex];
    });

    return (
      <div
        style={{
          ...style,
          display: 'grid',
          gridTemplateColumns,
          gap: '0.75rem',
          alignItems: 'center',
          paddingLeft: '0.75rem',
          paddingRight: '0.75rem',
        }}
        role="button"
        onClick={() => setLogDetails(rowIndex)}
        className={clsx(
          'cursor-pointer border-b-1 text-sm',
          theme.isDark ? 'border-b-neutral-200/20 hover:bg-neutral-600 bg-neutral-800' : 'border-b-neutral-200 hover:bg-neutral-50'
        )}
      >
        {rowData.map((value, idx) => {
          const key = keys[idx];
          let displayValue = value;

          if (key === 'timestamp') {
            displayValue = value; // Let TableData handle formatting
          } else if (key.startsWith('labels.')) {
            displayValue = value[key.replace(/^labels\./, '')];
            if (displayValue === undefined) {
              displayValue = '';
            }
          }

          return (
            <CellContent
              key={key}
              options={options}
              columnName={key}
              value={value}
              // displayLevel={showLevel}
              searchTerm={searchTerm}
              theme={theme}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div
      className={clsx(
        'flex flex-col w-full h-full rounded-lg border-1 ',
        theme.isDark ? 'border-neutral-100/20 bg-neutral-800' : 'border-neutral-200 bg-white'
      )}
      style={{ contain: 'strict' }}
    >
      {/* Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns,
          gap: '0.75rem',
          paddingLeft: '0.75rem',
          paddingRight: '0.75rem',
        }}
        className={clsx(
          'sticky top-0 z-10 w-full uppercase border-b-1',
          theme.isDark ? 'bg-[#111217] border-neutral-300/20' : 'bg-white border-neutral-300'
        )}
      >
        {keys.map((key) => (
          <div
            key={key}
            className={clsx(
              'cursor-pointer select-none overflow-hidden flex justify-between gap-3',
              theme.isDark ? 'hover:bg-gray-50/20' : 'hover:bg-gray-50'
            )}
          >
            <div
              className="flex flex-grow justify-start items-center py-3 px-2 truncate"
              onClick={() => {
                if (key === sortField) {
                  setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortField(key);
                  setSortDirection('asc');
                }
              }}
            >
              {sortField === key && <span className="mr-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
              <span className="truncate">{prettifyHeaderNames(key, false)}</span>
            </div>
            <div
              className="pl-4 w-0.5 hover:border-r-2 cursor-ew-resize hover:border-neutral-300"
              onMouseDown={(e) => handleMouseDown(key, e)}
            />
          </div>
        ))}
      </div>

      {/* Virtualized Rows */}
      <div className="flex-1">
        <AutoSizer>
          {({ height, width }) => (
            <List height={height} width={width} itemCount={rowCount} itemSize={lineHeight}>
              {Row}
            </List>
          )}
        </AutoSizer>
      </div>
    </div>
  );
};
