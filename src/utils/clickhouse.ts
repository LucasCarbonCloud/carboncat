import { DataFrame, DataQueryRequest,  dateTime, Field, RawTimeRange, TimeRange } from "@grafana/data";
import { ClickHouseQuery } from '../types/clickhouse';
import { getDataSourceSrv } from "@grafana/runtime";
import { lastValueFrom, isObservable } from 'rxjs';

export async function runQuery(dsName: string, timeRange: TimeRange, setData: (data: Field[]) => void) {
  try {
    const ds = await getDataSourceSrv().get(
      dsName
    );

    const request: DataQueryRequest<ClickHouseQuery> = {
        targets: [
          {
            refId: 'A',
            rawSql: `SELECT
  Timestamp as "timestamp",
  Body as "body",
  SeverityText as "level",
  LogAttributes as "labels",
  TraceId as "traceID",
  SpanId as "spanID"
FROM "otel_logs"
WHERE
  ( timestamp >= $__fromTime AND timestamp <= $__toTime )
  AND (body ILIKE '%%')
  AND level IN ('DEBUG','INFO','WARN','ERROR','FATAL')
  AND ('' = '' OR traceID = '')

ORDER BY timestamp DESC LIMIT 1000`,
            // Logdata
            format: 2,
          },
        ],
        range: timeRange,
        interval: '1m',
        intervalMs: 60_000,
        maxDataPoints: 1000,
        scopedVars: {},
        timezone: 'browser',
        app: 'panel-editor',
        requestId: 'Q100',
        startTime: Date.now(),
      } as DataQueryRequest<ClickHouseQuery>;

    const queryResult = ds.query(request);
    const response = isObservable(queryResult) ? await lastValueFrom(queryResult) : await queryResult;
    const data = response.data as DataFrame[]

    setData(data[0].fields)
  } catch (err: any) {
    console.log(err.message || 'Unknown error');
  } finally {
    // setLoading(false);
  }
}
