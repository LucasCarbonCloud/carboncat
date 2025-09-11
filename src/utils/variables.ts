import { DateTime, isDateTime, rangeUtil, TimeRange } from "@grafana/data";
import { locationService } from "@grafana/runtime";
import { Filter } from "types/filters";
import { ToggleOption } from 'types/components';
import { faSackDollar, faServer } from '@fortawesome/free-solid-svg-icons';

export const DATASOURCES: ToggleOption[] = [
  { value: "datasource-clickhouse-apps", label: "App Logs", icon: faSackDollar },
  { value: "datasource-clickhouse-platform", label: "Platform Logs", icon: faServer },
];


type PluginVars = {
  from: string;
  to: string;
  tableLineHeight: number;
  searchTerm: string;
  filters: Filter[];
  fields: string[];
  labels: string[];
};

const DEFAULT_VARS: PluginVars = {
  from: "now-5m",
  to: "now",
  tableLineHeight: 35,
  searchTerm: "",
  filters: [],
  fields:['level', 'timestamp', 'traceID', 'spanID', 'body'],
  labels:["labels.app", "labels.component", "labels.team"],
};


function formatValue<K extends keyof PluginVars>(name: K, value: string): PluginVars[K] {
  if (name === "filters" || name === "fields" || name === "labels") {
    try {
      return JSON.parse(value) as PluginVars[K];
    } catch {
      return DEFAULT_VARS.filters as PluginVars[K];
    }
  } else if (name === "tableLineHeight") {
    try {
      return Number(value) as PluginVars[K];
    } catch {
      return DEFAULT_VARS.tableLineHeight as PluginVars[K];
    }
  }

  return value as PluginVars[K];
}

export function getQVar<K extends keyof PluginVars>(name: K): PluginVars[K] {
  const urlParams = new URLSearchParams(window.location.search);
  const value = urlParams.get(name);

  if (value === null) {
    return DEFAULT_VARS[name];
  }

  return formatValue(name, value)
}

export function setQVar<K extends keyof PluginVars>(name: K, value: PluginVars[K]) {
  if (name === "filters" || name === "fields" || name === "labels") {
    locationService.partial({ [name]: JSON.stringify(value) }, true);
  } else {
    locationService.partial({ [name]: String(value) }, true);
  }
}

export function getQVarTimeRange(): TimeRange {
  const from = getQVar("from")
  const to = getQVar("to")

  return makeTimeRange(from, to)
}

export function setQVarTimeRange(t: TimeRange) {
  if (isDateTime(t.raw.from)) {
    setQVar("from", (t.raw.from as DateTime).format())
  } else {
    setQVar("from", t.raw.from as string)
  }

  if (isDateTime(t.raw.to)) {
    setQVar("to", (t.raw.to as DateTime).format())
  } else {
    setQVar("to", t.raw.to as string)
  }
}

export function makeTimeRange(from: string, to: string): TimeRange {
  return rangeUtil.convertRawToRange({ from, to });
}

export function getLocalStorage<K extends keyof PluginVars>(name: K): PluginVars[K] {
  const value = localStorage.getItem("carboncat." + name) || null;;

  if (value === null) {
    return DEFAULT_VARS[name];
  }

  return formatValue(name, value)
}

export function setLocalStorage<K extends keyof PluginVars>(name: K, value: PluginVars[K]) {
  if (name === "tableLineHeight") {
    localStorage.setItem("carboncat." + name, value as string)
  } else if (name === "filters" || name === "fields" || name === "labels") {
    localStorage.setItem("carboncat." + name, JSON.stringify(value));
  } else {
    localStorage.setItem("carboncat." + name, value as string)
  }
}


export function getQVarOrLs<K extends keyof PluginVars>(name: K): PluginVars[K] {
  if (qVarExists(name)) {
    return getQVar(name)
  } else {
    return getLocalStorage(name)
  }
}


function qVarExists<K extends keyof PluginVars>(name: K): boolean {
  const urlParams = new URLSearchParams(window.location.search);
  const value = urlParams.get(name);

  return value !== null
}


export function setQVarAndLs<K extends keyof PluginVars>(name: K, value: PluginVars[K]) {
  setQVar(name, value)
  setLocalStorage(name, value)
}
