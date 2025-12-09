import { useEffect, useRef } from "react";
import { useSharedState } from "./StateContext";
import { generateLogQuery, runBars, runLogQuery, runLogQueryStreaming } from "utils/clickhouse";
import { Field, rangeUtil } from "@grafana/data";
import { Subscription } from "rxjs";

export function useClickHouse()  {
  const {userState, appState, appDispatch } = useSharedState();

  const lastRequestRef = useRef<string | null>(null);
  const streamingSubscriptionRef = useRef<Subscription | null>(null);

  const setLogFields = (f: Field[]) => {
    appDispatch({type:"SET_LOG_FIELDS", payload: f})
  }

  const setLogFieldsStreaming = (f: Field[], isComplete: boolean) => {
    appDispatch({type:"SET_LOG_FIELDS", payload: f})
    if (isComplete) {
      appDispatch({type:"NOT_LOADING"})
    }
  }

  const setLevelFields = (f: Field[]) => {
    appDispatch({type:"SET_LEVEL_FIELDS", payload: f})
  }

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
  }, [userState.mode, userState.sqlExpression, userState.searchTerm, userState.filters, userState.logLevels]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const { sqlExpression } = appState;
    const { datasource, timeFrom, timeTo } = userState;
    if (!sqlExpression || !datasource || !timeFrom || !timeTo) { return };

    const requestKey = JSON.stringify({ sqlExpression, datasource, timeFrom, timeTo });

    if (lastRequestRef.current === requestKey) { return };
    lastRequestRef.current = requestKey;

    refreshSqlData();
  }, [appState.sqlExpression, userState.datasource, userState.timeFrom, userState.timeTo]); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshSqlData = () => {
    if (!appState.sqlExpression) {
      return
    }

    if (userState.streamingMode) {
      refreshSqlDataStreaming();
      return;
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

  const refreshSqlDataStreaming = (chunkSize = 500) => {
    if (!appState.sqlExpression) {
      return
    }

    // Cancel any existing streaming query
    if (streamingSubscriptionRef.current) {
      streamingSubscriptionRef.current.unsubscribe();
      streamingSubscriptionRef.current = null;
    }

    appDispatch({type:"LOADING"})
    
    const subscription = runLogQueryStreaming(
      userState.datasource,
      rangeUtil.convertRawToRange({ from:userState.timeFrom, to:userState.timeTo }),
      appState.sqlExpression,
      setLogFieldsStreaming,
      chunkSize
    ).subscribe({
      error: (error: any) => {
        appDispatch({type:"SET_ERROR", payload: error.message})
        appDispatch({type:"NOT_LOADING"})
        streamingSubscriptionRef.current = null;
      },
      complete: () => {
        streamingSubscriptionRef.current = null;
      }
    });

    // Store the subscription for potential cancellation
    streamingSubscriptionRef.current = subscription;

    // Also run bars query in parallel (not streamed)
    runBars(
      userState.datasource,
      rangeUtil.convertRawToRange({ from:userState.timeFrom, to:userState.timeTo }),
      appState.sqlExpression,
      setLevelFields
    ).catch((r: any) => {
      appDispatch({type:"SET_ERROR", payload: r.message})
    });

    return subscription;
  };

  const cancelQuery = () => {
    if (streamingSubscriptionRef.current) {
      streamingSubscriptionRef.current.unsubscribe();
      streamingSubscriptionRef.current = null;
      appDispatch({type:"NOT_LOADING"});
    }
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

  return {
    refreshSqlData,
    refreshSqlDataStreaming,
    cancelQuery
  }
}
