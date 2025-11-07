export function GenerateURLParams(userState: any, appState: any, absoluteTimeRange: boolean): URLSearchParams {
  const params = new URLSearchParams();

  if (userState.searchTerm) {params.set("search", userState.searchTerm)};
  if (userState.sqlExpression) {params.set("sql", btoa(userState.sqlExpression))};
  params.set("mode", userState.mode);
  if (userState.filters?.length) {params.set("filters", btoa(JSON.stringify(userState.filters)))};
    if (absoluteTimeRange) {
      params.set("from", appState.absoluteTimeRange.from.toISOString());
      params.set("to", appState.absoluteTimeRange.to.toISOString());
    } else {
      params.set("from", userState.timeFrom);
      params.set("to", userState.timeTo);
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

