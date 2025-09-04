import { DataFrame, DataQueryRequest, Field, TimeRange } from "@grafana/data";
import { ClickHouseQuery } from '../types/clickhouse';
import { getDataSourceSrv } from "@grafana/runtime";
import { lastValueFrom, isObservable } from 'rxjs';
import { generateFilterString, generateHLFilterString } from "./functions";
import { Filter } from "types/filters";


export async function runListApps(dsName: string, timeRange: TimeRange, searchTerm: string, filters: Filter[], setData: (data: string[]) => void): Promise<void> {
  const rawSql= `
SELECT DISTINCT app_materialized AS app
FROM "otel_logs"
WHERE app != '' AND app IS NOT NULL
    AND ( Timestamp >= $__fromTime AND Timestamp <= $__toTime )
    AND (Body ILIKE '%${searchTerm}%')
    AND SeverityText IN ('DEBUG','INFO','WARN','ERROR','FATAL')
    AND ('' = '' OR TraceId = '')
    ${generateFilterString(filters)}
ORDER BY app;
`
  const fields = await runQuery(rawSql, dsName, timeRange);
  if (fields.length > 0) {
    setData(fields[0].values as string[]);
  }
}

export async function runListComponents(dsName: string, timeRange: TimeRange, searchTerm: string, filters: Filter[], apps: string[], setData: (data: string[]) => void): Promise<void> {
  const rawSql= `
SELECT DISTINCT component_materialized AS component
FROM "otel_logs"
WHERE component != '' AND component IS NOT NULL
    AND ( Timestamp >= $__fromTime AND Timestamp <= $__toTime )
    AND (Body ILIKE '%${searchTerm}%')
    AND SeverityText IN ('DEBUG','INFO','WARN','ERROR','FATAL')
    AND ('' = '' OR TraceId = '')
    ${generateHLFilterString("LogAttributes['app']", apps)}
    ${generateFilterString(filters)}
ORDER BY component;
`
  const fields = await runQuery(rawSql, dsName, timeRange);
  if (fields.length > 0) {
    setData(fields[0].values as string[]);
  }
}

export async function runListTeams(dsName: string, timeRange: TimeRange, searchTerm: string, filters: Filter[], setData: (data: string[]) => void): Promise<void> {
  const rawSql= `
SELECT DISTINCT LogAttributes['team'] AS team
FROM "otel_logs"
WHERE team != '' AND team IS NOT NULL
    AND ( Timestamp >= $__fromTime AND Timestamp <= $__toTime )
    AND (Body ILIKE '%${searchTerm}%')
    AND SeverityText IN ('DEBUG','INFO','WARN','ERROR','FATAL')
    AND ('' = '' OR TraceId = '')
    ${generateFilterString(filters)}
ORDER BY team;
`
  const fields = await runQuery(rawSql, dsName, timeRange);
  if (fields.length > 0) {
    setData(fields[0].values as string[]);
  }
}

export async function runLogQuery(dsName: string, timeRange: TimeRange, searchTerm: string, filters: Filter[], apps: string[], logLevels: string[], components: string[], teams: string[], setData: (data: Field[]) => void): Promise<void> {
  const rawSql= `SELECT
    Timestamp as "timestamp",
    Body as "body",
    SeverityText as "level",
    LogAttributes as "labels",
    TraceId as "traceID",
    SpanId as "spanID"
  FROM "otel_logs"
  WHERE
    ( timestamp >= $__fromTime AND timestamp <= $__toTime )
    AND (body ILIKE '%${searchTerm}%')
    AND level IN ('DEBUG','INFO','WARN','ERROR','FATAL')
    AND ('' = '' OR traceID = '')
    ${generateHLFilterString("LogAttributes['app']", apps)}
    ${generateHLFilterString("LogAttributes['component']", components)}
    ${generateHLFilterString("LogAttributes['team']", teams)}
    ${generateHLFilterString("level", logLevels)}
    ${generateFilterString(filters)}

  ORDER BY timestamp DESC LIMIT 10000`

  const fields = await runQuery(rawSql, dsName, timeRange);
  setData(fields);
}

async function runQuery(rawSql: string, dsName: string, timeRange: TimeRange): Promise<Field[]> {
  try {
    const ds = await getDataSourceSrv().get(
      dsName
    );

    const request: DataQueryRequest<ClickHouseQuery> = {
        targets: [
          {
            refId: 'A',
            rawSql: rawSql,
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
        startTime: Date.now(),
      } as DataQueryRequest<ClickHouseQuery>;

    const queryResult = ds.query(request);
    const response = isObservable(queryResult) ? await lastValueFrom(queryResult) : await queryResult;
    const data = response.data as DataFrame[]

    return data[0]?.fields || [];
  } catch (err: any) {
    console.log(err.message || 'Unknown error');
    throw err;
  }
}
