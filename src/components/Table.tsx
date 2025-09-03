import React, { useState, useMemo } from 'react';
import { Field } from '@grafana/data';
// import { createTableRow } from './TableRow';
// import { TableHeader } from './TableHeader';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlassPlus, faMagnifyingGlassMinus, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

import { useTheme2 } from '@grafana/ui';
import clsx from 'clsx';
import { FilterOperation, SimpleOptions } from 'types/filters';
import { prettifyHeaderNames } from 'utils/functions';

export interface TableProps {
  options: SimpleOptions;
  fields: Field[];
  keys: string[];
  // showLevel: boolean;
  lineHeight: number;
  searchTerm: string;
  setSelectedFilters: (key: string, operation: FilterOperation, value: any, op: 'add' | 'rm' | 'only') => void;
  setLogDetails: (idx: number | undefined) => void;
}

interface CellContentProps {
  options: SimpleOptions;
  columnName: string;
  value: any;
  // displayLevel: boolean;
  searchTerm: string;
  setSelectedFilters: (key: string, operation: FilterOperation, value: any, op: 'add' | 'rm' | 'only') => void;
  theme: any;
}

const CellContent: React.FC<CellContentProps> = ({
  options,
  columnName,
  value,
  // displayLevel,
  searchTerm,
  setSelectedFilters,
  theme,
}) => {
  let displayValue = value;
  const dateFormat = 'MMM DD HH:mm:ss.SSS';

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
              title="Add label to filter"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFilters(columnName, '=', displayValue, 'add');
              }}
            />
            <FontAwesomeIcon
              className="cursor-pointer hover:text-neutral-600"
              icon={faMagnifyingGlassMinus}
              title="Remove label from filter"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFilters(columnName, '!=', displayValue, 'add');
              }}
            />
            <FontAwesomeIcon
              className="cursor-pointer hover:text-neutral-600"
              icon={faMagnifyingGlass}
              title="View only this label"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFilters(columnName, '=', displayValue, 'only');
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
        <a href={options.traceUrl.replace('{{ traceID }}', displayValue)} target="_blank" rel="noreferrer">
          <span className="block truncate">{displayValue}</span>
        </a>
        <div
          className={clsx(
            'group-hover:flex hidden gap-1 absolute right-0 top-0 bg-gradient-to-l pl-20 pr-1 justify-end',
            theme.isDark ? 'from-neutral-800' : 'from-neutral-100 text-neutral-400'
          )}
        >
          <FontAwesomeIcon
            className="cursor-pointer hover:text-neutral-600"
            icon={faMagnifyingGlassPlus}
            title="Add label to filter"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFilters(columnName, '=', displayValue, 'add');
            }}
          />
          <FontAwesomeIcon
            className="cursor-pointer hover:text-neutral-600"
            icon={faMagnifyingGlassMinus}
            title="Remove label from filter"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFilters(columnName, '!=', displayValue, 'add');
            }}
          />
          <FontAwesomeIcon
            className="cursor-pointer hover:text-neutral-600"
            icon={faMagnifyingGlass}
            title="View only this label"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFilters(columnName, '=', displayValue, 'only');
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
          icon={faMagnifyingGlassPlus}
          title="Add label to filter"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedFilters(columnName, '=', displayValue, 'add');
          }}
        />
        <FontAwesomeIcon
          className="cursor-pointer hover:text-neutral-600"
          icon={faMagnifyingGlassMinus}
          title="Remove label from filter"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedFilters(columnName, '!=', displayValue, 'add');
          }}
        />
        <FontAwesomeIcon
          className="cursor-pointer hover:text-neutral-600"
          icon={faMagnifyingGlass}
          title="View only this label"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedFilters(columnName, '=', displayValue, 'only');
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
  setSelectedFilters,
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
  const columnWidths = useMemo(() => {
    const widths: { [key: string]: string } = {};
    keys.forEach((key) => {
      if (key === 'body') {
        widths[key] = 'minmax(300px, 1fr)'; // Body gets remaining space
      } else if (key === 'timestamp') {
        widths[key] = '180px'; // Fixed width for timestamp
      } else if (key === 'level') {
        widths[key] = '10px'; // Fixed width for level
      } else if (key === 'traceID') {
        widths[key] = '200px'; // Fixed width for traceID
      } else {
        widths[key] = '150px'; // Default width for other columns
      }
    });
    return widths;
  }, [keys]);

  const gridTemplateColumns = keys.map((key) => columnWidths[key]).join(' ');

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
        onClick={() => setLogDetails(rowIndex)}
        className={clsx(
          'cursor-pointer border-b-1 hover:bg-neutral-50 text-sm',
          theme.isDark ? 'border-b-neutral-200/20 hover:bg-neutral-50/20' : 'border-b-neutral-200 hover:bg-neutral-50'
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
              setSelectedFilters={setSelectedFilters}
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
        'flex flex-col w-full h-full rounded-lg border-1 bg-white',
        theme.isDark ? 'border-neutral-100/20' : 'border-neutral-200'
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
              'cursor-pointer select-none py-3 px-2 overflow-hidden',
              theme.isDark ? 'hover:bg-gray-50/20' : 'hover:bg-gray-50'
            )}
            onClick={() => {
              if (key === sortField) {
                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
              } else {
                setSortField(key);
                setSortDirection('asc');
              }
            }}
          >
            <div className="flex justify-start items-center truncate">
              {sortField === key && <span className="mr-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
          <span className="truncate">{prettifyHeaderNames(key, false)}</span>
            </div>
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
