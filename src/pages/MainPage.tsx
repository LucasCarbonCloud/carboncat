import React, { useEffect, useRef, useState } from 'react';
import { Field, TimeRange } from '@grafana/data';
import { RefreshPicker, TimeRangePicker, useTheme2 } from '@grafana/ui';
import '../style.js';
import { SimpleOptions } from 'types/filters';
import { getFieldNames } from 'utils/functions';
import clsx from 'clsx';
import { Table } from 'components/Table';
import { LogDetails } from 'components/LogDetails';
import { Overview } from 'components/Overview';
import { Settings } from 'components/Settings';
import { Searchbar } from 'components/Searchbar';
import { DATASOURCES, getLocalStorage, setLocalStorage } from 'utils/variables';
import { Button, ToggleButtonGroup } from 'components/Components';
import { TimeSeriesBars } from 'components/TimeSeriesBars';
import { SqlEditor } from 'components/SqlEditor';
import { useSharedState } from 'components/StateContext';
import { Error } from 'components/Error';
import { useClickHouse } from 'components/Clickhouse';
import { GenerateURLParams } from 'utils/url';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';


function PageOne() {
  const theme = useTheme2();

  const keys = ['level', 'timestamp', 'traceID', 'spanID', 'body'];

  const [tableLineHeight, setTableLineHeight] = useState<number>(getLocalStorage("tableLineHeight"));

  const [chartWidth, setChartWidth] = useState<number>(200);
  const chartContainerRef = useRef<HTMLDivElement>(null);


  const {userState, userDispatch, appState } = useSharedState();
  const refreshSqlData = useClickHouse()

  useEffect(() => {
    if (!chartContainerRef.current) { return };

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

  const handleTimeRangeChange = (value: TimeRange) => {
    userDispatch({type:"SET_TIMERANGE", payload:value})
  };

  const handleTableLineHeight = (value: number) => {
    setTableLineHeight(value);
    setLocalStorage("tableLineHeight", value)
  };

  const handleSetLogDetails = (row: number | undefined) => {
    if (userState.logDetails === row) {
      userDispatch({type:"CLOSE_LOG_DETAILS"})
      return;
    } else if (row === undefined) {
      userDispatch({type:"CLOSE_LOG_DETAILS"})
      return;
    }
    userDispatch({type:"SET_LOG_DETAILS", payload: row})
  };


  let labels: string[] = [];

  appState.logFields.forEach((field: Field) => {
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

  userState.selectedLabels.forEach((l: string) => {
    if (!labels.includes(l)) {
      labels.push(l)
    }
  })

  const fieldsList = getFieldNames(keys, userState.selectedFields, userState.selectedLabels);
  labels = labels.sort();

  const options: SimpleOptions = {
    traceUrl: 'd/cc-trace-viewer/trace-viewer?var-traceID={{ traceID }}',
    text: '',
  };

  return (
    <div className={`flex h-full w-full gap-2 px-2 pt-4 relative max-h-[calc(100dvh-50px)] `}>
      { appState.error && (
        <Error/>
      )}
      <SqlEditor/>
      <div className={clsx('flex flex-col gap-4 pl-2 m-2 min-h-0 h-full pb-4')}>
        <Overview fields={appState.logFields} />
        <Settings
          fields={keys}
          labels={labels}
          tableLineHeight={tableLineHeight}
          setTableLineHeight={handleTableLineHeight}
        />
      </div>
      <div className="flex flex-col flex-grow gap-4 pr-2 m-2">
        <div className="w-full min-w-0" ref={chartContainerRef}>
          {TimeSeriesBars({chartWidth, timeRange:userState.timeRange, fields:appState.levelFields, onChangeTimeRange:handleTimeRangeChange})}
        </div>

        <div className="flex items-center">
          <Searchbar
            fields={appState.logFields}
            labels={[...keys, ...labels]}
          />
          <ToggleButtonGroup
            defaultValue={userState.datasource}
            options={DATASOURCES}
            onChange={(d: string) => {userDispatch({type:'SET_DATASOURCE', payload:d})}}
          />
          <Button
            className='mr-2'
            options={{label: "Share link", disabled: false, icon:faArrowUpRightFromSquare}}
            onClick={async () => {
              const params = GenerateURLParams(userState, true)
              await navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?${params.toString()}`);
            }}
          />
          <TimeRangePicker
            value={userState.timeRange}
            onChange={handleTimeRangeChange}
            onChangeTimeZone={() => {}}
            onMoveBackward={() => {}}
            onMoveForward={() => {}}
            onZoom={() => {}}
          />
          <RefreshPicker
            value={userState.refreshInterval}
            intervals={['5s', '10s', '30s', '1m', '2m', '5m']}
            onRefresh={refreshSqlData}
            onIntervalChanged={(ri: string) => {userDispatch({type:"SET_REFRESH_INTERVAL", payload:ri})}}
          />
        </div>

        <div className="relative flex-grow">
          <Table
            options={options}
            fields={appState.logFields}
            keys={fieldsList}
            lineHeight={tableLineHeight}
            searchTerm={userState.searchTerm}
            setLogDetails={handleSetLogDetails}
          />
          {appState.isLoading && (
            <div
              className={clsx(
                'flex absolute inset-0 z-10 justify-center items-center rounded-lg backdrop-blur-[3px]',
                theme.isDark ? 'bg-black/20' : 'bg-white/20'
              )}
            >
              <div className="w-12 h-12 rounded-full border-4 animate-spin border-[#28A0A6] border-t-transparent"></div>
            </div>
          )}
          {userState.logDetails !== null && (
            <LogDetails options={options} fields={appState.logFields} rowIndex={userState.logDetails} setLogDetails={handleSetLogDetails} />
          )}
        </div>
      </div>
    </div>
  );
}

export default PageOne;
