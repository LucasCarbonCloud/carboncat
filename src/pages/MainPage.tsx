import React, { useEffect, useState } from 'react';
import { Field, TimeRange } from '@grafana/data';
import { TimeRangePicker } from '@grafana/ui';
// import { prefixRoute } from '../utils/utils.routing';
// import { ROUTES } from '../constants';
// import { testIds } from '../components/testIds';
import '../style.js';
import { runListApps, runListComponents, runListTeams, runLogQuery} from 'utils/clickhouse';
import { Filter, FilterOperation, HighLevelFilter, SimpleOptions } from 'types/filters';
import { getFieldNames } from 'utils/functions';
import clsx from 'clsx';
import { Table } from 'components/Table';
import { LogDetails } from 'components/LogDetails';
import { Overview } from 'components/Overview';
import { Settings } from 'components/Settings';
import { Searchbar } from 'components/Searchbar';
import { getQVar, getQVarTimeRange, setQVar, setQVarTimeRange } from 'utils/variables';

function PageOne() {
  // const s = useStyles2(getStyles);

  const keys = ['level', 'timestamp', 'traceID', 'spanID', 'body'];

  const [fields, setFields] = useState<Field[]>([]);
  const [logLevels, setLogLevels] = useState<string[]>([]);
  const [availableApps, setAvailableApps] = useState<string[]>([]);
  const [apps, setApps] = useState<string[]>([]);
  const [availableComponents, setAvailableComponents] = useState<string[]>([]);
  const [components, setComponents] = useState<string[]>([]);
  const [availableTeams, setAvailableTeams] = useState<string[]>([]);
  const [teams, setTeams] = useState<string[]>([]);


  const [selectedLabels, setSelectedLabels] = useState<string[]>(getQVar('labels'));
  const [selectedFields, setSelectedFields] = useState<string[]>(getQVar('fields'));
  const [selectedFilters, setSelectedFilters] = useState<Filter[]>(getQVar("filters"));
  // const [showLevel, setShowLevel] = useState<boolean>(false);
  const [tableLineHeight, setTableLineHeight] = useState<number>(35);
  const [searchTerm, setSearchTerm] = useState<string>(getQVar("searchTerm"));
  const [filteredSearchTerm, setFilteredSearchTerm] = useState<string>(getQVar("searchTerm"));
  const [logDetails, setLogDetails] = useState<number | undefined>(undefined);
  const [timeRange, setTimeRange] = useState<TimeRange>(getQVarTimeRange());

  useEffect(() => {
    runLogQuery('clickhousetest', timeRange, filteredSearchTerm, selectedFilters, apps, logLevels, components, teams, setFields);
    runListApps('clickhousetest', timeRange, filteredSearchTerm, selectedFilters, setAvailableApps)
    runListComponents('clickhousetest', timeRange, filteredSearchTerm, selectedFilters, apps, setAvailableComponents)
    runListTeams('clickhousetest', timeRange, filteredSearchTerm, selectedFilters, setAvailableTeams)
  }, [timeRange, filteredSearchTerm, selectedFilters, apps, logLevels, components, teams])



  const handleFieldChange = (value: string[], type: string) => {
    if (type === 'label') {
      setSelectedLabels(value);
      setQVar('labels', value)
    } else if (type === 'field') {
      setSelectedFields(value);
      setQVar("fields", value)
    }
  };

  const handleSearchTermChange = (value: string) => {
    setSearchTerm(value);
    // remove #... tokens (and trailing space if any)
    const filteredVal = value.replace(/#\S*\s?/g, "").trim();
    setFilteredSearchTerm(filteredVal)
    setQVar("searchTerm", filteredVal)
  };

  const handleTimeRangeChange = (value: TimeRange) => {
    setTimeRange(value)
    setQVarTimeRange(value)
  };

  const handleTableLineHeight= (value: number) => {
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

      if ( op === "only" ) {
        return [{ key, operation, value }]
      }

      const exists = prevFilters.some((f) => f.key === key && f.operation === operation && f.value === value);

      if (exists) {
        return prevFilters.filter((f) => !(f.key === key && f.operation === operation && f.value === value));
      } else {
        return [...prevFilters, { key, operation, value }];
      }
    };
    const newFilters = filters(selectedFilters)
    setSelectedFilters(newFilters)
    setQVar("filters", newFilters)
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
  traceUrl:"",
  text:"",
}

  const hlFilters: HighLevelFilter = {
    availableLogLevels: ["DEBUG", "INFO", "WARN", "ERROR", "FATAL"],
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
    setTeams:setTeams,
  }

  return (
    <div className={`flex h-full w-full gap-2 px-2 pt-4 relative max-h-[calc(100dvh-50px)] `}>
      <div className={clsx('flex flex-col gap-4 pl-2 m-2 min-h-0 h-full pb-4')}>
        <Overview fields={fields} />
        <Settings
          fields={keys}
          selectedFields={selectedFields}
          labels={labels}
          selectedLabels={selectedLabels}
          // showLevel={showLevel}
          // setShowLevel={setShowLevel}
          highLevelFilters={hlFilters}
          tableLineHeight={tableLineHeight}
          setTableLineHeight={handleTableLineHeight}
          onChange={handleFieldChange}
        />
      </div>
      <div className="flex flex-col flex-grow gap-4 pr-2 m-2">
        <div className="flex items-center">
        <Searchbar
          searchTerm={searchTerm}
          fields={fields}
          labels={[...keys, ...labels]}
          onChange={handleSearchTermChange}
          selectedFilters={selectedFilters}
          setSelectedFilters={handleSetFilterTerm}
        />
        <TimeRangePicker
          value={timeRange}
          onChange={handleTimeRangeChange}
          onChangeTimeZone={() => {}}
          onMoveBackward={() => {}}
          onMoveForward={() => {}}
          onZoom={() => {}}
        />
        </div>
        <Table
          options={options}
          fields={fields}
          keys={fieldsList}
          // showLevel={showLevel}
          lineHeight={tableLineHeight}
          searchTerm={filteredSearchTerm}
          setSelectedFilters={handleSetFilterTerm}
          setLogDetails={handleSetLogDetails}
        />
      </div>
      {logDetails !== undefined && <LogDetails options={options} fields={fields} rowIndex={logDetails} setLogDetails={handleSetLogDetails} />}
    </div>
  );
}

export default PageOne;

