import { Field, rangeUtil, TimeRange } from "@grafana/data";
import React, { createContext, useContext, useReducer, ReactNode, Dispatch } from "react";
import { Filter } from "types/filters";
import { DATASOURCES } from "utils/variables";

interface UserState {
  sqlMode: boolean;
  sqlEditorOpen: boolean;
  sqlExpression: string|null;
  searchTerm: string;
  filters: Filter[];
  timeRange: TimeRange;
  datasource: string;
  logLevels: string[];
  refreshInterval: string;
  logDetails: number | null;
  selectedFields: string[];
  selectedLabels: string[];
}

const initialUserState: UserState = {
  sqlMode: false,
  sqlEditorOpen: false,
  sqlExpression: null,
  searchTerm: "",
  filters: [],
  timeRange: rangeUtil.convertRawToRange({ from:"now-5m", to:"now" }),
  datasource: DATASOURCES[0].value,
  logLevels: ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'],
  refreshInterval: "",
  logDetails: null,
  selectedFields: ['level', 'timestamp', 'traceID', 'spanID', 'body'],
  selectedLabels: ["labels.app", "labels.component", "labels.team"],
};


interface AppState {
  sqlExpression: string;
  isLoading: boolean;
  logFields: Field[];
  levelFields: Field[];
  error: string | null;
}

const initialAppState: AppState = {
  sqlExpression: "",
  isLoading: false,
  logFields: [],
  levelFields: [],
  error: "",
};

type UserAction =
  | { type: "SET_SEARCHTERM"; payload: string }
  | { type: "SET_SQL"; payload: string }
  | { type: "CLEAR_SQL" }
  | { type: "SQLMODE"; payload: boolean }
  | { type: "FILTER_RM"; payload: Filter}
  | { type: "FILTER_ADD"; payload: Filter}
  | { type: "FILTER_ONLY"; payload: Filter}
  | { type: "SET_TIMERANGE"; payload: TimeRange}
  | { type: "SET_DATASOURCE"; payload: string}
  | { type: "SET_LOGLEVELS"; payload: string[]}
  | { type: "SET_REFRESH_INTERVAL"; payload: string}
  | { type: "SET_LOG_DETAILS"; payload: number}
  | { type: "CLOSE_LOG_DETAILS" }
  | { type: "TOGGLE_LABEL"; payload: string}
  | { type: "TOGGLE_FIELD"; payload: string}
  | { type: "OPEN_SQL_EDITOR" }
  | { type: "CLOSE_SQL_EDITOR" };

type AppAction =
  | { type: "SET_SQL"; payload: string }
  | { type: "SET_LOG_FIELDS"; payload: Field[]}
  | { type: "SET_LEVEL_FIELDS"; payload: Field[]}
  | { type: "LOADING" }
  | { type: "NOT_LOADING" }
  | { type: "SET_ERROR"; payload: string }
  | { type: "CLEAR_ERROR" };


function userReducer(state: UserState, action: UserAction): UserState {
  switch (action.type) {
    case "SET_SEARCHTERM":
      return { ...state, searchTerm: action.payload };
    case "SET_SQL":
      return { ...state, sqlExpression: action.payload };
    case "CLEAR_SQL":
      return { ...state, sqlExpression: null };
    case "SQLMODE":
      return {...state, sqlMode: action.payload}
    case "OPEN_SQL_EDITOR":
      return {...state, sqlEditorOpen: true};
    case "CLOSE_SQL_EDITOR":
      return {...state, sqlEditorOpen: false};
    case "FILTER_RM":
      return {...state, filters: handleFilterChange(state.filters, action.payload, "rm")};
    case "FILTER_ADD":
      return {...state, filters: handleFilterChange(state.filters, action.payload, "add")};
    case "FILTER_ONLY":
      return {...state, filters: handleFilterChange(state.filters, action.payload, "only")};
    case "SET_TIMERANGE":
      return {...state, timeRange: action.payload};
    case "SET_DATASOURCE":
      return {...state, datasource: action.payload};
    case "SET_LOGLEVELS":
      return {...state, logLevels: action.payload};
    case "SET_REFRESH_INTERVAL":
      return {...state, refreshInterval: action.payload};
    case "SET_LOG_DETAILS":
      return {...state, logDetails: action.payload};
    case "CLOSE_LOG_DETAILS":
      return {...state, logDetails: null};
    case "TOGGLE_LABEL":
      return {...state, selectedLabels: state.selectedLabels.includes(action.payload)
              ? state.selectedLabels.filter((v) => v !== action.payload)
              : [...state.selectedLabels, action.payload]};
    case "TOGGLE_FIELD":
      return {...state, selectedFields: state.selectedFields.includes(action.payload)
              ? state.selectedFields.filter((v) => v !== action.payload)
              : [...state.selectedFields, action.payload]};
    default:
      return state;
  }
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_SQL":
      return { ...state, sqlExpression: action.payload };
    case "SET_LOG_FIELDS":
      return { ...state, logFields: action.payload };
    case "SET_LEVEL_FIELDS":
      return { ...state, levelFields: action.payload };
    case "LOADING":
      return {...state, isLoading: true}
    case "NOT_LOADING":
      return {...state, isLoading: false}
    case "SET_ERROR":
      return {...state, error: action.payload}
    case "CLEAR_ERROR":
      return {...state, error: null}
    default:
      return state;
  }
}

interface StateContextType {
  userState: UserState;
  userDispatch: Dispatch<UserAction>;
  appState: AppState;
  appDispatch: Dispatch<AppAction>;
}

const StateContext = createContext<StateContextType | undefined>(undefined);

export function StateProvider({ children }: { children: ReactNode }) {
  const [userState, userDispatch] = useReducer(userReducer, initialUserState);
  const [appState, appDispatch] = useReducer(appReducer, initialAppState);
  return <StateContext.Provider value={{ userState, userDispatch, appState, appDispatch }}>{children}</StateContext.Provider>;
}

export function useSharedState(): StateContextType {
  const context = useContext(StateContext);
  if (!context) {
    throw new Error("useSharedState must be used within a StateProvider");
  }
  return context;
}


const handleFilterChange = (prevFilters: Filter[], filter: Filter, op: 'add' | 'rm' | 'only'): Filter[] => {
  const filters = (prevFilters: Filter[]) => {
    if (filter.key === 'timestamp') {
      return prevFilters;
    }

    if (op === 'only') {
      return [ filter ];
    }

    const exists = prevFilters.some((f) => f.key === filter.key && f.operation === filter.operation && f.value === filter.value);

    if (exists) {
      return prevFilters.filter((f) => !(f.key === filter.key && f.operation === filter.operation && f.value === filter.value));
    } else {
      return [...prevFilters, filter ];
    }
  };
  const newFilters = filters(prevFilters);
  return newFilters
};
