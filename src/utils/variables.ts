import { rangeUtil, TimeRange } from "@grafana/data";
import { locationService } from "@grafana/runtime";

type PluginVars = {
  from: string;
  to: string;
  searchTerm: string;
};

const DEFAULT_VARS: PluginVars = {
  from: "now-1h",
  to: "now",
  searchTerm: "",
};

export function getQVar(name: keyof PluginVars): string {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name) || DEFAULT_VARS[name];
}

export function setQVar(name: keyof PluginVars, value: string) {
  locationService.partial({ [name]: value }, true);
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
