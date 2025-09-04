import { rangeUtil, TimeRange } from "@grafana/data";
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
  searchTerm: string;
  filters: Filter[];
  fields: string[];
  labels: string[];
};

const DEFAULT_VARS: PluginVars = {
  from: "now-1h",
  to: "now",
  searchTerm: "",
  filters: [],
  fields:['level', 'timestamp', 'traceID', 'spanID', 'body'],
  labels:["labels.app", "labels.component", "labels.team"],
};

export function getQVar<K extends keyof PluginVars>(name: K): PluginVars[K] {
  const urlParams = new URLSearchParams(window.location.search);
  const value = urlParams.get(name);

  if (value === null) {
    return DEFAULT_VARS[name];
  }

  if (name === "filters" || name === "fields" || name === "labels") {
    try {
      return JSON.parse(value) as PluginVars[K];
    } catch {
      return DEFAULT_VARS.filters as PluginVars[K];
    }
  }

  return value as PluginVars[K];
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
  setQVar("from", t.raw.from as string)
  setQVar("to", t.raw.to as string)
}

export function makeTimeRange(from: string, to: string): TimeRange {
  return rangeUtil.convertRawToRange({ from, to });
}
