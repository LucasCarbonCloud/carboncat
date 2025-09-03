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
