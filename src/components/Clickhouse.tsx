import { useEffect, useRef } from "react";
import { useSharedState } from "./StateContext";
import { generateLogQuery, runBars, runLogQuery } from "utils/clickhouse";
import { Field, rangeUtil } from "@grafana/data";

export function useClickHouse()  {
  const {userState, appState, appDispatch } = useSharedState();

  const setLogFields = (f: Field[]) => {
    appDispatch({type:"SET_LOG_FIELDS", payload: f})
  }

  const setLevelFields = (f: Field[]) => {
    appDispatch({type:"SET_LEVEL_FIELDS", payload: f})
  }

// 1️⃣ Generate and dispatch SQL whenever userState changes
useEffect(() => {
  const sqlExpr =
    userState.mode === "sql"
      ? (userState.sqlExpression as string)
      : generateLogQuery(
          userState.searchTerm,
          userState.filters,
          userState.logLevels
        );

  appDispatch({ type: "SET_SQL", payload: sqlExpr });
}, [
  userState.mode,
  userState.sqlExpression,
  userState.searchTerm,
  userState.filters,
  userState.logLevels,
]);


// 2️⃣ Refresh data whenever SQL or time/datasource changes
const lastRequestRef = useRef<string | null>(null);

useEffect(() => {
  const { sqlExpression } = appState;
  const { datasource, timeFrom, timeTo } = userState;
  if (!sqlExpression || !datasource || !timeFrom || !timeTo) return;

  // Build a composite signature of the request context
  const requestKey = JSON.stringify({ sqlExpression, datasource, timeFrom, timeTo });

  // Skip only if *exactly* the same request context as last time
  if (lastRequestRef.current === requestKey) return;
  lastRequestRef.current = requestKey;

  console.log("run", sqlExpression);
  refreshSqlData();
}, [
  appState.sqlExpression,
  userState.datasource,
  userState.timeFrom,
  userState.timeTo,
]);

  const refreshSqlData = () => {
    if (!appState.sqlExpression) {
      return
    }

    appDispatch({type:"LOADING"})
    Promise.all([
      runLogQuery(
        userState.datasource,
        rangeUtil.convertRawToRange({ from:userState.timeFrom, to:userState.timeTo }),
        appState.sqlExpression,
        setLogFields
      ),
      runBars(
         userState.datasource,
         rangeUtil.convertRawToRange({ from:userState.timeFrom, to:userState.timeTo }),
         appState.sqlExpression,
         setLevelFields
       )
    ])
      .catch((r: any) => {
        appDispatch({type:"SET_ERROR", payload:r.message})
      })
      .finally(() => {
        appDispatch({type:"NOT_LOADING"})
      });
  };

  useEffect(() => {
    if (!userState.refreshInterval) { return };

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

    const intervalMs = parseInterval(userState.refreshInterval);
    if (intervalMs === 0) { return };

    const timer = setInterval(() => {
      refreshSqlData();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [userState.refreshInterval, userState.timeFrom, userState.timeTo, appState.sqlExpression]); // eslint-disable-line react-hooks/exhaustive-deps

  return refreshSqlData
}
