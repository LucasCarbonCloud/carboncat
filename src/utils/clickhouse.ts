import { DataFrame, DataQueryRequest, Field, TimeRange } from "@grafana/data";
import { ClickHouseQuery } from '../types/clickhouse';
import { getDataSourceSrv } from "@grafana/runtime";
import { lastValueFrom, isObservable, Observable } from 'rxjs';
import { generateFilterString, generateHLFilterString } from "./functions";
import { Filter } from "types/filters";


// const keysToRemoveFromDistinct = ["spanID", "traceID", "body"];

const keyMap: Record<string, string> = {
  spanID: "SpanId",
  traceID: "TraceId",
  body: "Body",
};


export function generateLogQuery(searchTerm: string, filters: Filter[], logLevels: string[]): string {
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
    ${generateHLFilterString("level", logLevels)}
    ${generateFilterString(filters)}
  ORDER BY timestamp DESC LIMIT 20000`

  return rawSql
}

export async function runLogQuery(dsName: string, timeRange: TimeRange, rawSql: string, setData: (data: Field[]) => void): Promise<void> {
  const fields = await runQuery(rawSql, dsName, timeRange);
  setData(fields);
}

export function runLogQueryStreaming(dsName: string, timeRange: TimeRange, rawSql: string, setData: (data: Field[], isComplete: boolean) => void, chunkSize = 500): Observable<Field[]> {
  return runQueryStreaming(rawSql, dsName, timeRange, setData, chunkSize);
}


export async function runBars(dsName: string, timeRange: TimeRange, rawSql: string, setData: (data: Field[]) => void): Promise<void> {
const wrappedSql = `
WITH
  $__toTime - $__fromTime AS total_time,
  CASE
      WHEN total_time < 10 THEN total_time / 1
      WHEN total_time < 60 THEN total_time / 5
      WHEN total_time < 120 THEN total_time / 50
      ELSE total_time / 100
  END AS slot_duration,
  filtered_logs AS (
    ${rawSql}
  )
SELECT
  toStartOfInterval(timestamp, INTERVAL slot_duration SECOND) AS time,
  countIf(level = 'DEBUG') AS DEBUG,
  countIf(level = 'INFO') AS INFO,
  countIf(level = 'WARN') AS WARN,
  countIf(level = 'ERROR') AS ERROR,
  countIf(level = 'FATAL') AS FATAL
FROM filtered_logs
GROUP BY time
ORDER BY time;
`;
  const fields = await runQuery(wrappedSql, dsName, timeRange);
  setData(fields);
}

export async function runBars2(dsName: string, timeRange: TimeRange, searchTerm: string, filters: Filter[], apps: string[], logLevels: string[], components: string[], teams: string[], setData: (data: Field[]) => void): Promise<void> {
  const updatedFilters = filters
    .map(f => ({
      ...f,
      key: keyMap[f.key] || f.key, // if key exists in map, use mapped value; otherwise, keep original
    }));

  const rawSql= `WITH
    $__toTime - $__fromTime AS total_time, -- Total duration of the timespan "A"
    CASE
        WHEN total_time < 10 THEN total_time / 1
        WHEN total_time < 60 THEN total_time / 5
        WHEN total_time < 120 THEN total_time / 50 -- If total_time is less than 2 minutes
        ELSE total_time / 100 -- Otherwise
    END AS slot_duration -- Duration of each slot based on the condition

SELECT
    --toStartOfInterval(Timestamp, INTERVAL 30 second) AS time,
    toStartOfInterval(Timestamp, INTERVAL slot_duration SECOND) AS time,
    --toStartOfInterval(Timestamp, INTERVAL slot_duration SECOND) + slot_duration AS end_time, -- Calculate end time

    countIf(SeverityText = 'DEBUG') AS DEBUG,
    countIf(SeverityText = 'INFO') AS INFO,
    countIf(SeverityText = 'WARN') AS WARN,
    countIf(SeverityText = 'ERROR') AS ERROR,
    countIf(SeverityText = 'FATAL') AS FATAL
FROM "otel_logs"
 WHERE ( time >= $__fromTime AND time <= $__toTime )
    AND (Body ILIKE '%${searchTerm}%')
    AND SeverityText IN ('DEBUG','INFO','WARN','ERROR','FATAL')
    AND ('' = '' OR TraceId = '')
    ${generateHLFilterString("LogAttributes['app']", apps)}
    ${generateHLFilterString("LogAttributes['component']", components)}
    ${generateHLFilterString("LogAttributes['team']", teams)}
    ${generateHLFilterString("SeverityText", logLevels)}
    ${generateFilterString(updatedFilters)}
GROUP BY time
ORDER BY time;

  `

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
    
    // Check for errors in the response
    if (Array.isArray(response.errors) && response.errors.length > 0) {
      const errorMessage = response.errors[0]?.message || 'Query failed';
      throw new Error(errorMessage);
    }
    
    const data = response.data as DataFrame[]
    
    // Check if we have valid data
    if (!data || data.length === 0) {
      return [];
    }

    return data[0]?.fields || [];
  } catch (err: any) {
    console.log(err.message || 'Unknown error');
    throw err;
  }
}

function runQueryStreaming(rawSql: string, dsName: string, timeRange: TimeRange, onDataUpdate: (fields: Field[], isComplete: boolean) => void, chunkSize = 500): Observable<Field[]> {
  return new Observable(observer => {
    let cancelled = false;
    let offset = 0;
    let accumulatedFields: Field[] = [];

    const executeChunk = async () => {
      try {
        const ds = await getDataSourceSrv().get(dsName);
        
        // Replace existing LIMIT clause or add new one with OFFSET (ClickHouse syntax)
        let chunkedSql = rawSql;
        
        // Remove existing LIMIT clause if it exists
        chunkedSql = chunkedSql.replace(/\s+LIMIT\s+\d+\s*$/i, '');
        
        // Add new LIMIT with offset
        chunkedSql = `${chunkedSql} LIMIT ${offset}, ${chunkSize}`;
        
        const request: DataQueryRequest<ClickHouseQuery> = {
          targets: [
            {
              refId: 'A',
              rawSql: chunkedSql,
              format: 2,
            },
          ],
          range: timeRange,
          interval: '1m',
          intervalMs: 60_000,
          maxDataPoints: chunkSize,
          scopedVars: {},
          timezone: 'browser',
          app: 'panel-editor',
          startTime: Date.now(),
        } as DataQueryRequest<ClickHouseQuery>;

        const queryResult = ds.query(request);
        const response = isObservable(queryResult) ? await lastValueFrom(queryResult) : await queryResult;
        
        // Check for errors
        if (Array.isArray(response.errors) && response.errors.length > 0) {
          const errorMessage = response.errors[0]?.message || 'Query failed';
          throw new Error(errorMessage);
        }
        
        const data = response.data as DataFrame[];
        
        if (!data || data.length === 0 || !data[0]?.fields) {
          // No more data, complete the stream
          onDataUpdate(accumulatedFields, true);
          observer.next(accumulatedFields);
          observer.complete();
          return;
        }

        const chunkFields = data[0].fields;
        const chunkRowCount = chunkFields[0]?.values?.length || 0;

        if (chunkRowCount === 0) {
          // No rows in this chunk, complete the stream
          onDataUpdate(accumulatedFields, true);
          observer.next(accumulatedFields);
          observer.complete();
          return;
        }

        // Merge fields with accumulated data
        if (accumulatedFields.length === 0) {
          // First chunk - initialize accumulated fields
          accumulatedFields = chunkFields.map(field => ({
            ...field,
            values: [...field.values]
          }));
        } else {
          // Subsequent chunks - append values to existing fields
          chunkFields.forEach((field, index) => {
            if (accumulatedFields[index]) {
              accumulatedFields[index].values = [
                ...accumulatedFields[index].values,
                ...field.values
              ];
            }
          });
        }

        // Update UI with current accumulated data
        const isComplete = chunkRowCount < chunkSize;
        onDataUpdate([...accumulatedFields], isComplete);
        observer.next([...accumulatedFields]);

        if (cancelled) {
          observer.complete();
          return;
        }

        if (isComplete) {
          // This was the last chunk
          observer.complete();
        } else {
          // Schedule next chunk with a small delay to prevent overwhelming the UI
          offset += chunkSize;
          setTimeout(() => {
            if (!cancelled) {
              executeChunk();
            }
          }, 10);
        }

      } catch (err: any) {
        console.log(err.message || 'Unknown error');
        observer.error(err);
      }
    };

    // Start the first chunk
    executeChunk();

    // Return cleanup function
    return () => {
      cancelled = true;
    };
  });
}
