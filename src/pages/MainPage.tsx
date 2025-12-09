import React, { useEffect, useRef, useState } from 'react';
import { Field, rangeUtil, TimeRange } from '@grafana/data';
import { RefreshPicker, TimeRangePicker, useTheme2 } from '@grafana/ui';
import '../style.js';
import { SimpleOptions } from 'types/filters';
import { getFieldNames } from 'utils/functions';
import clsx from 'clsx';
import { Table } from 'components/Table';
import { LogDetails } from 'components/LogDetails';
import { Overview } from 'components/Overview';
import { Searchbar } from 'components/Searchbar';
import { DATASOURCES } from 'utils/variables';
import { Button, ToggleButtonGroup } from 'components/Components';
import { TimeSeriesBars } from 'components/TimeSeriesBars';
import { SqlEditor } from 'components/SqlEditor';
import { useSharedState } from 'components/StateContext';
import { Error } from 'components/Error';
import { useClickHouse } from 'components/Clickhouse';
import { GenerateURLParams } from 'utils/url';
import {
  faArrowUpRightFromSquare,
  faCopy,
  faSave,
  faStop,
  faTowerBroadcast,
  faLayerGroup,
} from '@fortawesome/free-solid-svg-icons';
import { useSettings } from 'components/SettingsContext';
import { SideMenu } from 'components/SideMenu';
import { Settings } from 'components/Settings';
import { NotificationView } from 'components/NotificationView';
import { SaveView } from 'components/SaveView';
import { ReleaseMessage } from 'components/ReleaseMessage';

function PageOne() {
  const theme = useTheme2();

  const keys = ['level', 'timestamp', 'traceID', 'spanID', 'body'];

  const [chartWidth, setChartWidth] = useState<number>(200);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const { settingsState } = useSettings();
  const { userState, userDispatch, appState, appDispatch } = useSharedState();
  const { refreshSqlData, cancelQuery } = useClickHouse();

  useEffect(() => {
    if (!chartContainerRef.current) {
      return;
    }

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
    userDispatch({ type: 'SET_TIMERANGE', payload: value });
  };

  const handleSetLogDetails = (row: number | undefined) => {
    if (userState.logDetails === row) {
      userDispatch({ type: 'CLOSE_LOG_DETAILS' });
      return;
    } else if (row === undefined) {
      userDispatch({ type: 'CLOSE_LOG_DETAILS' });
      return;
    }
    userDispatch({ type: 'SET_LOG_DETAILS', payload: row });
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
      labels.push(l);
    }
  });

  const fieldsList = getFieldNames(keys, userState.selectedFields, userState.selectedLabels);
  labels = labels.sort();

  const options: SimpleOptions = {
    traceUrl: 'd/cc-trace-viewer/trace-viewer?var-traceID={{ traceID }}',
    text: '',
  };

  return (
    <div className={`flex flex-col h-[calc(100dvh-50px)] w-full gap-4 px-4 pt-4 relative max-h-[calc(100dvh-50px)] `}>
      {appState.error && <Error />}
      {appState.settingsOpen && <Settings />}
      {appState.saveViewOpen && <SaveView />}
      <NotificationView />
      <SqlEditor />
      <ReleaseMessage />

      <div className="flex gap-12 items-center">
        <Overview fields={appState.logFields} />
        <div className="w-full min-w-0" ref={chartContainerRef}>
          {TimeSeriesBars({
            chartWidth,
            timeRange: rangeUtil.convertRawToRange({ from: userState.timeFrom, to: userState.timeTo }),
            fields: appState.levelFields,
            onChangeTimeRange: handleTimeRangeChange,
          })}
        </div>
      </div>

      <div className="flex items-center">
        <Searchbar fields={appState.logFields} labels={[...keys, ...labels]} />
        <ToggleButtonGroup
          defaultValue={userState.datasource}
          options={DATASOURCES}
          onChange={(d: string) => {
            userDispatch({ type: 'SET_DATASOURCE', payload: d });
          }}
        />
        <Button
          className="mr-2"
          options={{ label: 'Share link', disabled: false, icon: faArrowUpRightFromSquare }}
          onClick={async () => {
            const params = GenerateURLParams(userState, appState, true);
            await navigator.clipboard.writeText(
              `${window.location.origin}${window.location.pathname}?${params.toString()}`
            );
            appDispatch({
              type: 'SET_NOTIFICATION',
              payload: { icon: faCopy, message: 'URL has been copied to your clipboard' },
            });
          }}
        />
        <Button
          className="mr-2"
          options={{ label: 'Save View', disabled: false, icon: faSave }}
          onClick={async () => {
            appDispatch({ type: 'OPEN_SAVE_VIEW' });
          }}
        />
        <TimeRangePicker
          value={rangeUtil.convertRawToRange({ from: userState.timeFrom, to: userState.timeTo })}
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
          onIntervalChanged={(ri: string) => {
            userDispatch({ type: 'SET_REFRESH_INTERVAL', payload: ri });
          }}
        />
        <Button
          options={{
            label: userState.streamingMode ? 'Streaming' : 'Batch',
            disabled: false,
            icon: userState.streamingMode ? faTowerBroadcast : faLayerGroup,
          }}
          className="mr-2"
          onClick={() => userDispatch({ type: 'SET_STREAMING_MODE', payload: !userState.streamingMode })}
        />
        {userState.streamingMode && (
          <Button
            options={{
              label: 'Cancel',
              icon: faStop,
              disabled: !(appState.isLoading && userState.streamingMode),
            }}
            onClick={cancelQuery}
            className="mr-2"
          />
        )}
      </div>

      <div className="flex flex-grow gap-2 min-h-0 max-h-full">
        <SideMenu fields={keys} labels={labels} />
        <div className="relative flex-grow">
          <Table
            options={options}
            fields={appState.logFields}
            keys={fieldsList}
            lineHeight={settingsState.tableLineHeight}
            searchTerm={userState.searchTerm}
            setLogDetails={handleSetLogDetails}
          />
          {appState.isLoading && !userState.streamingMode && (
            <div
              className={clsx(
                'flex absolute inset-0 z-10 justify-center items-center rounded-lg backdrop-blur-[3px]',
                theme.isDark ? 'bg-black/20' : 'bg-white/20'
              )}
            >
              <div className="w-12 h-12 rounded-full border-4 animate-spin border-[#28A0A6] border-t-transparent"></div>
            </div>
          )}
          <LogDetails
            options={options}
            fields={appState.logFields}
            rowIndex={userState.logDetails}
            setLogDetails={handleSetLogDetails}
          />
        </div>
      </div>
    </div>
  );
}

export default PageOne;
