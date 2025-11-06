import { DateTime, isDateTime } from "@grafana/data";


export function GenerateURLParams(userState: any, absoluteTimeRange: boolean): URLSearchParams {
  const params = new URLSearchParams();

  if (userState.searchTerm) {params.set("search", userState.searchTerm)};
  if (userState.sqlExpression) {params.set("sql", btoa(userState.sqlExpression))};
  params.set("mode", userState.mode);
  if (userState.filters?.length) {params.set("filters", btoa(JSON.stringify(userState.filters)))};
  if (userState.timeRange) {
    if (absoluteTimeRange) {
      params.set("from", userState.timeRange.from.toISOString());
      params.set("to", userState.timeRange.to.toISOString());
    } else {
      params.set("from", makeTimePart(userState.timeRange.raw.from));
      params.set("to", makeTimePart(userState.timeRange.raw.to));
    }
  }
  if (userState.datasource) {params.set("ds", userState.datasource)};
  if (userState.logLevels?.length) {
    params.set("logLevels", btoa(JSON.stringify(userState.logLevels)));
  }
  if (userState.refreshInterval) {
    params.set("refresh", userState.refreshInterval);
  }
  if (userState.logDetails) {
    params.set("logDetails", JSON.stringify(userState.logDetails));
  }
  if (userState.selectedFields?.length) {
    params.set("fields", btoa(JSON.stringify(userState.selectedFields)));
  }
  if (userState.selectedLabels?.length) {
    params.set("labels", btoa(JSON.stringify(userState.selectedLabels)));
  }

  return params
}


const makeTimePart = (t: string | DateTime): string => {
  if (isDateTime(t)) {
    return (t as DateTime).format()
  } else {
    return t as string
  }
}
