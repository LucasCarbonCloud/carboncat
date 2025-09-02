import { DataFrame, DataQueryRequest,  dateTime, Field, RawTimeRange, TimeRange } from "@grafana/data";
import { ClickHouseQuery } from '../types/clickhouse';
import { getDataSourceSrv } from "@grafana/runtime";
import { lastValueFrom, isObservable } from 'rxjs';

export async function runQuery(dsName: string, setData: (data: Field[]) => void) {
  try {
    const ds = await getDataSourceSrv().get(
      dsName
    );

    const now = dateTime();
    const fiveMinutesAgo = now.subtract(5, 'minute');
         const range: TimeRange = {
      from: fiveMinutesAgo,
      to: now,
      raw: {
        from: 'now-5m',
        to: 'now',
      } as RawTimeRange
    };

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
  ( timestamp >= 1756819528 AND timestamp <= 1756819928 )
  AND (body ILIKE '%%')
  AND level IN ('DEBUG','INFO','WARN','ERROR','FATAL')
  AND ('' = '' OR traceID = '')

ORDER BY timestamp ASC LIMIT 1000`,
            format: 0,
          },
        ],
        range: range,
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
