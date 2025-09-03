import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import { Field, GrafanaTheme2, TimeRange, dateTime } from '@grafana/data';
import { TimeRangePicker } from '@grafana/ui';
// import { prefixRoute } from '../utils/utils.routing';
// import { ROUTES } from '../constants';
// import { testIds } from '../components/testIds';
import '../style.js';
import { runQuery} from 'utils/clickhouse';
import { Filter, FilterOperation, SimpleOptions } from 'types/filters';
import { getFieldNames } from 'utils/functions';
import clsx from 'clsx';
import { Table } from 'components/Table';
import { LogDetails } from 'components/LogDetails';
import { Overview } from 'components/Overview';
import { Settings } from 'components/Settings';
import { Searchbar } from 'components/Searchbar';
import { getQVarTimeRange, setQVarTimeRange } from 'utils/variables';

function PageOne() {
  // const s = useStyles2(getStyles);

  const keys = ['level', 'timestamp', 'traceID', 'spanID', 'body'];

  const [fields, setFields] = useState<Field[]>([]);


  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>(keys);
  const [selectedFilters, setSelectedFilters] = useState<Filter[]>([]);
  const [showLevel, setShowLevel] = useState<boolean>(false);
  const [tableLineHeight, setTableLineHeight] = useState<number>(35);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [logDetails, setLogDetails] = useState<number | undefined>(undefined);
  const [timeRange, setTimeRange] = useState<TimeRange>(getQVarTimeRange());

  useEffect(() => {
    runQuery('clickhousetest', timeRange, setFields);
    console.log("ehk")
  }, [timeRange])


  // useEffect(() => {
  //   const filterString = generateFilterString(selectedFilters);
  //   locationService.partial({ 'var-filter_conditions': filterString }, true);
  // }, [selectedFilters]);


  const handleFieldChange = (value: string[], type: string) => {
    if (type === 'label') {
      setSelectedLabels(value);
      // locationService.partial({ 'var-selectedLabels': value.join(",") }, true);
    } else if (type === 'field') {
      setSelectedFields(value);
      // locationService.partial({ 'var-selectedKeys': value.join(",") }, true);
    }
  };

  const handleSearchTermChange = (value: string) => {
    setSearchTerm(value);
    // remove @... tokens (and trailing space if any)
    // const filteredVal = value.replace(/#\S*\s?/g, "").trim();

    // locationService.partial({ "var-searchTerm": filteredVal }, true);
  };

  const handleTimeRangeChange = (value: TimeRange) => {
    setTimeRange(value)
    setQVarTimeRange(value)
    console.log(value)
    // remove @... tokens (and trailing space if any)
    // const filteredVal = value.replace(/#\S*\s?/g, "").trim();

    // locationService.partial({ "var-searchTerm": filteredVal }, true);
  };

  const handleTableLineHeight= (value: number) => {
    setTableLineHeight(value);
    // locationService.partial({ 'var-tableLineHeight': value }, true);
  };

  const handleSetLogDetails = (row: number | undefined) => {
    console.log(row)
    if (logDetails === row) {
      setLogDetails(undefined);
      return;
    }
    setLogDetails(row);
  };

  const handleSetFilterTerm = (key: string, operation: FilterOperation, value: any, op: 'add' | 'rm' | 'only') => {
    setSelectedFilters((prevFilters) => {
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
    });
  };


  let labels: string[] = [];
  console.log("fields", fields)
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

  const options:SimpleOptions = {
  traceUrl:"",
  text:"",
}

  return (
    <div className={`flex h-full w-full gap-4 px-2 pt-4 relative max-h-[calc(100dvh-50px)] `}>
      <div className={clsx('flex flex-col gap-4 px-2 m-2 min-h-0 h-full pb-4')}>
        <Overview fields={fields} />
        <Settings
          fields={keys}
          selectedFields={selectedFields}
          labels={labels}
          selectedLabels={selectedLabels}
          showLevel={showLevel}
          setShowLevel={setShowLevel}
          tableLineHeight={tableLineHeight}
          setTableLineHeight={handleTableLineHeight}
          onChange={handleFieldChange}
        />
      </div>
      <div className="flex flex-col flex-grow gap-4 px-2 m-2">
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
          showLevel={showLevel}
          lineHeight={tableLineHeight}
          setSelectedFilters={handleSetFilterTerm}
          setLogDetails={handleSetLogDetails}
        />
      </div>
      {logDetails !== undefined && <LogDetails options={options} fields={fields} rowIndex={logDetails} setLogDetails={handleSetLogDetails} />}
    </div>
  );
}

export default PageOne;

const getStyles = (theme: GrafanaTheme2) => ({
  marginTop: css`
    margin-top: ${theme.spacing(2)};
  `,
});
