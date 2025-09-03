
export type FilterOperation = '=' | '!='

export interface SimpleOptions {
  traceUrl: string;
  text: string;
}

export interface Filter {
  key: string;
  operation: FilterOperation;
  value: any;
}

export interface HighLevelFilter {
  availableLogLevels: string[];
  logLevels: string[];
  setLogLevels: (value: string[]) => void;
  availableApps: string[];
  apps: string[];
  setApps: (value: string[]) => void;
  availableComponents: string[];
  components: string[];
  setComponents: (value: string[]) => void;
  availableTeams: string[];
  teams: string[];
  setTeams: (value: string[]) => void;
}
