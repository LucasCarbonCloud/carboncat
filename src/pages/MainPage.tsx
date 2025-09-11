import React, { useEffect, useRef, useState } from 'react';
import { Field, rangeUtil, TimeRange } from '@grafana/data';
import { RefreshPicker, TimeRangePicker, useTheme2 } from '@grafana/ui';
import '../style.js';
import { runBars, runListApps, runListComponents, runListTeams, runLogQuery } from 'utils/clickhouse';
import { Filter, FilterOperation, HighLevelFilter, SimpleOptions } from 'types/filters';
import { getFieldNames } from 'utils/functions';
import clsx from 'clsx';
import { Table } from 'components/Table';
import { LogDetails } from 'components/LogDetails';
import { Overview } from 'components/Overview';
import { Settings } from 'components/Settings';
import { Searchbar } from 'components/Searchbar';
import { DATASOURCES, getQVar, getQVarTimeRange, setQVar, setQVarTimeRange } from 'utils/variables';
import ToggleButtonGroup from 'components/Components';
import { TimeSeriesBars } from 'components/TimeSeriesBars';


function PageOne() {
  const theme = useTheme2();

  const keys = ['level', 'timestamp', 'traceID', 'spanID', 'body'];

  const [fields, setFields] = useState<Field[]>([]);
  const [levelFields, setLevelFields] = useState<Field[]>([]);
  const [logLevels, setLogLevels] = useState<string[]>([]);
  const [availableApps, setAvailableApps] = useState<string[]>([]);
  const [apps, setApps] = useState<string[]>([]);
  const [availableComponents, setAvailableComponents] = useState<string[]>([]);
  const [components, setComponents] = useState<string[]>([]);
  const [availableTeams, setAvailableTeams] = useState<string[]>([]);
  const [teams, setTeams] = useState<string[]>([]);

  const [datasource, setDatasource] = useState<string>(DATASOURCES[0].value);

  const [selectedLabels, setSelectedLabels] = useState<string[]>(getQVar('labels'));
  const [selectedFields, setSelectedFields] = useState<string[]>(getQVar('fields'));
  const [selectedFilters, setSelectedFilters] = useState<Filter[]>(getQVar('filters'));
  // const [showLevel, setShowLevel] = useState<boolean>(false);
  const [tableLineHeight, setTableLineHeight] = useState<number>(35);
  const [searchTerm, setSearchTerm] = useState<string>(getQVar('searchTerm'));
  const [filteredSearchTerm, setFilteredSearchTerm] = useState<string>(getQVar('searchTerm'));
  const [logDetails, setLogDetails] = useState<number | undefined>(undefined);
  const [timeRange, setTimeRange] = useState<TimeRange>(getQVarTimeRange());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [refreshInterval, setRefreshInterval] = useState<string>('');

  const [chartWidth, setChartWidth] = useState<number>(200);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const refreshData = () => {
    setIsLoading(true);
    Promise.all([
      runLogQuery(
        datasource,
        rangeUtil.convertRawToRange(timeRange.raw),
        filteredSearchTerm,
        selectedFilters,
        apps,
        logLevels,
        components,
        teams,
        setFields
      ),
      runBars(
        datasource,
        rangeUtil.convertRawToRange(timeRange.raw),
        filteredSearchTerm,
        selectedFilters,
        apps,
        logLevels,
        components,
        teams,
        setLevelFields
      ),
      runListApps(datasource, rangeUtil.convertRawToRange(timeRange.raw), filteredSearchTerm, selectedFilters, setAvailableApps),
      runListComponents(datasource, rangeUtil.convertRawToRange(timeRange.raw), filteredSearchTerm, selectedFilters, apps, setAvailableComponents),
      runListTeams(datasource, rangeUtil.convertRawToRange(timeRange.raw), filteredSearchTerm, selectedFilters, setAvailableTeams),
    ])
      .catch((r: any) => {
        setErrorMessage(r.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    refreshData();
  }, [datasource, timeRange, filteredSearchTerm, selectedFilters, apps, logLevels, components, teams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!refreshInterval) { return };
    
    const parseInterval = (interval: string): number => {
      const match = interval.match(/^(\d+)([smhd])$/);
      if (!match) { return 0 };
      
      const value = parseInt(match[1]);
      const unit = match[2];
      
      switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return 0;
      }
    };
    
    const intervalMs = parseInterval(refreshInterval);
    if (intervalMs === 0) { return };
    
    const timer = setInterval(() => {
      refreshData();
    }, intervalMs);
    
    return () => clearInterval(timer);
  }, [refreshInterval, datasource, timeRange, filteredSearchTerm, selectedFilters, apps, logLevels, components, teams]); // eslint-disable-line react-hooks/exhaustive-deps


  useEffect(() => {
    if (!chartContainerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setChartWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const handleFieldChange = (value: string[], type: string) => {
    if (type === 'label') {
      setSelectedLabels(value);
      setQVar('labels', value);
    } else if (type === 'field') {
      setSelectedFields(value);
      setQVar('fields', value);
    }
  };

  const handleSearchTermChange = (value: string) => {
    setSearchTerm(value);
    // remove #... tokens (and trailing space if any)
    const filteredVal = value.replace(/#\S*\s?/g, '').trim();
    setFilteredSearchTerm(filteredVal);
    setQVar('searchTerm', filteredVal);
  };

  const handleTimeRangeChange = (value: TimeRange) => {
    console.log(timeRange)
    setTimeRange(value);
    setQVarTimeRange(value);
  };

  const handleTableLineHeight = (value: number) => {
    setTableLineHeight(value);
    // locationService.partial({ 'var-tableLineHeight': value }, true);
  };

  const handleSetLogDetails = (row: number | undefined) => {
    if (logDetails === row) {
      setLogDetails(undefined);
      return;
    }
    setLogDetails(row);
  };

  const handleSetFilterTerm = (key: string, operation: FilterOperation, value: any, op: 'add' | 'rm' | 'only') => {
    const filters = (prevFilters: Filter[]) => {
      if (key === 'timestamp') {
        return prevFilters;
      }

      if (op === 'only') {
        return [{ key, operation, value }];
      }

      const exists = prevFilters.some((f) => f.key === key && f.operation === operation && f.value === value);

      if (exists) {
        return prevFilters.filter((f) => !(f.key === key && f.operation === operation && f.value === value));
      } else {
        return [...prevFilters, { key, operation, value }];
      }
    };
    const newFilters = filters(selectedFilters);
    setSelectedFilters(newFilters);
    setQVar('filters', newFilters);
  };

  let labels: string[] = [];

  fields.forEach((field: Field) => {
    if (field.name === 'labels') {
      field.values.forEach((v) => {
        Object.keys(v).forEach((k: string) => {
          const fullK = 'labels.' + k;
          if (!labels.includes(fullK)) {
            labels.push(fullK);
          }
        });
      });
    }
  });

  const fieldsList = getFieldNames(keys, selectedFields, selectedLabels);
  labels = labels.sort();

  const options: SimpleOptions = {
    traceUrl: 'd/cc-trace-viewer/trace-viewer?var-traceID={{ traceID }}',
    text: '',
  };

  const hlFilters: HighLevelFilter = {
    availableLogLevels: ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'],
    logLevels: logLevels,
    setLogLevels: setLogLevels,
    availableApps: availableApps,
    apps: apps,
    setApps: setApps,
    availableComponents: availableComponents,
    components: components,
    setComponents: setComponents,
    availableTeams: availableTeams,
    teams: teams,
    setTeams: setTeams,
  };


  return (
    <div className={`flex h-full w-full gap-2 px-2 pt-4 relative max-h-[calc(100dvh-50px)] `}>
      <div className={clsx('flex flex-col gap-4 pl-2 m-2 min-h-0 h-full pb-4')}>
        <Overview fields={fields} />
        <Settings
          fields={keys}
          selectedFields={selectedFields}
          labels={labels}
          selectedLabels={selectedLabels}
          highLevelFilters={hlFilters}
          tableLineHeight={tableLineHeight}
          setTableLineHeight={handleTableLineHeight}
          onChange={handleFieldChange}
        />
      </div>
      <div className="flex flex-col flex-grow gap-4 pr-2 m-2">
        <div className="w-full min-w-0" ref={chartContainerRef}>
          {TimeSeriesBars({chartWidth, timeRange, fields:levelFields, onChangeTimeRange:handleTimeRangeChange})}
        </div>

        <div className="flex items-center">
          <Searchbar
            searchTerm={searchTerm}
            fields={fields}
            labels={[...keys, ...labels]}
            onChange={handleSearchTermChange}
            selectedFilters={selectedFilters}
            setSelectedFilters={handleSetFilterTerm}
          />
          <ToggleButtonGroup defaultValue={DATASOURCES[0].value} options={DATASOURCES} onChange={setDatasource} />
          <TimeRangePicker
            value={timeRange}
            onChange={handleTimeRangeChange}
            onChangeTimeZone={() => {}}
            onMoveBackward={() => {}}
            onMoveForward={() => {}}
            onZoom={() => {}}
          />
          <RefreshPicker
            value={refreshInterval}
            intervals={['5s', '10s', '30s', '1m', '2m', '5m']}
            onRefresh={refreshData}
            onIntervalChanged={setRefreshInterval}
          />
        </div>

        <div className="relative flex-grow">
          <Table
            options={options}
            fields={fields}
            keys={fieldsList}
            lineHeight={tableLineHeight}
            searchTerm={filteredSearchTerm}
            setSelectedFilters={handleSetFilterTerm}
            setLogDetails={handleSetLogDetails}
          />
          {isLoading && (
            <div
              className={clsx(
                'flex absolute inset-0 z-10 justify-center items-center rounded-lg backdrop-blur-[3px]',
                theme.isDark ? 'bg-black/20' : 'bg-white/20'
              )}
            >
              <div className="w-12 h-12 rounded-full border-4 animate-spin border-[#28A0A6] border-t-transparent"></div>
            </div>
          )}
          {errorMessage !== undefined && (
            <div
              className={clsx(
                'flex absolute inset-0 z-10 justify-center items-center rounded-lg backdrop-blur-[3px]',
                theme.isDark ? 'bg-black/20' : 'bg-white/20'
              )}
            >
              <div className="p-4 w-1/2 h-80 font-semibold text-white bg-red-700 rounded-lg shadow-md">
                {errorMessage}
              </div>
            </div>
          )}
        </div>
      </div>
      {logDetails !== undefined && (
        <LogDetails options={options} fields={fields} rowIndex={logDetails} setLogDetails={handleSetLogDetails} />
      )}
    </div>
  );
}

export default PageOne;
