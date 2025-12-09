import { Field, rangeUtil, TimeRange } from "@grafana/data";
import React, { createContext, useContext, useReducer, ReactNode, Dispatch, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter } from "types/filters";
import { Mode } from "types/state";
import { parseTimeRangeRaw } from "utils/functions";
import { GenerateURLParams } from "utils/url";
import { DATASOURCES } from "utils/variables";
import { useSettings } from "./SettingsContext";
import { Notification } from "types/types";

export interface UserState {
  mode: Mode;
  sqlEditorOpen: boolean;
  sqlExpression: string|null;
  searchTerm: string;
  filters: Filter[];
  timeFrom: string;
  timeTo: string;
  datasource: string;
  logLevels: string[];
  refreshInterval: string;
  logDetails: number | null;
  selectedFields: string[];
  selectedLabels: string[];
  streamingMode: boolean;
}

const initialUserState: UserState = {
  mode: "normal",
  sqlEditorOpen: false,
  sqlExpression: null,
  searchTerm: "",
  filters: [],
  timeFrom: "now-5m",
  timeTo: "now",
  datasource: DATASOURCES[0].value,
  logLevels: ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'],
  refreshInterval: "",
  logDetails: null,
  selectedFields: ['level', 'timestamp', 'traceID', 'spanID', 'body'],
  selectedLabels: ["labels.app", "labels.component", "labels.team"],
  streamingMode: false,
};


interface AppState {
  sqlExpression: string;
  isLoading: boolean;
  logFields: Field[];
  levelFields: Field[];
  error: string | null;
  settingsOpen: boolean;
  saveViewOpen: boolean;
  absoluteTimeRange: TimeRange | null;
  notification: Notification | null;
  currentView: string;
}

const initialAppState: AppState = {
  sqlExpression: "",
  isLoading: false,
  logFields: [],
  levelFields: [],
  error: "",
  settingsOpen: false,
  saveViewOpen: false,
  absoluteTimeRange: null,
  notification: null,
  currentView: "default",
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
  | { type: "CLOSE_SQL_EDITOR" }
  | { type: "SET_STREAMING_MODE"; payload: boolean }
  | { type: "SET_STATE"; payload: UserState};

type AppAction =
  | { type: "SET_SQL"; payload: string }
  | { type: "SET_LOG_FIELDS"; payload: Field[]}
  | { type: "SET_LEVEL_FIELDS"; payload: Field[]}
  | { type: "LOADING" }
  | { type: "NOT_LOADING" }
  | { type: "SET_ERROR"; payload: string }
  | { type: "SET_CURRENT_VIEW"; payload: string }
  | { type: "CLEAR_ERROR" }
  | { type: "SET_NOTIFICATION"; payload: Notification }
  | { type: "CLEAR_NOTIFICATION" }
  | { type: "SET_ABSOLUTE_TIMERANGE"; payload: {from: string, to: string }}
  | { type: "OPEN_SETTINGS" }
  | { type: "CLOSE_SETTINGS" }
  | { type: "OPEN_SAVE_VIEW" }
  | { type: "CLOSE_SAVE_VIEW" };


function userReducer(state: UserState, action: UserAction): UserState {
  switch (action.type) {
    case "SET_SEARCHTERM":
      return { ...state, searchTerm: action.payload };
    case "SET_SQL":
      return { ...state, sqlExpression: action.payload };
    case "CLEAR_SQL":
      return { ...state, sqlExpression: null };
    case "SQLMODE":
      return {...state, mode: action.payload ? "sql" : "normal" }
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
      return {...state, timeFrom: parseTimeRangeRaw(action.payload.raw.from), timeTo: parseTimeRangeRaw(action.payload.raw.to)};
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
    case "SET_STREAMING_MODE":
      return {...state, streamingMode: action.payload};
    case "SET_STATE":
      return { ...state, ...action.payload };
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
    case "SET_NOTIFICATION":
      return {...state, notification: action.payload}
    case "CLEAR_NOTIFICATION":
      return {...state, notification: null}
    case "SET_CURRENT_VIEW":
      return {...state, currentView: action.payload}
    case "OPEN_SETTINGS":
      return {...state, settingsOpen: true}
    case "CLOSE_SETTINGS":
      return {...state, settingsOpen: false}
    case "OPEN_SAVE_VIEW":
      return {...state, saveViewOpen: true}
    case "CLOSE_SAVE_VIEW":
      return {...state, saveViewOpen: false}
    case "SET_ABSOLUTE_TIMERANGE":
      return {...state, absoluteTimeRange: rangeUtil.convertRawToRange({ from:action.payload.from, to:action.payload.to })}
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
  const [searchParams, setSearchParams] = useSearchParams()

  const { settingsState } = useSettings()

  const [userState, userDispatch] = useReducer(userReducer, userStateFromQueryParams(searchParams, settingsState.saveState));
  const [appState, appDispatch] = useReducer(appReducer, initialAppState);

  useEffect(() => {
    const params = GenerateURLParams(userState, appState, false)
    setSearchParams(params, { replace: true });

    if (appState.currentView === "default") {
      localStorage.setItem("carboncat.lastDefaultUserState", JSON.stringify(userState));
    }

    if (settingsState.saveState) {
      localStorage.setItem("carboncat.userState", JSON.stringify(userState));
    }

  }, [userState, setSearchParams, settingsState.saveState]); // eslint-disable-line react-hooks/exhaustive-deps


  useEffect(() => {
    appDispatch({type:"SET_ABSOLUTE_TIMERANGE", payload:{from:userState.timeFrom, to:userState.timeTo}})
  }, [userState.timeFrom, userState.timeTo]);

  useEffect(() => {
    if (!appState.currentView) {
      return
    }

    if (appState.currentView === "default") {
      const savedState =  localStorage.getItem("carboncat.lastDefaultUserState");
      if (savedState) {
        userDispatch({type:"SET_STATE", payload:JSON.parse(savedState)})
        return
      } else  {
        return
      }
    }
    userDispatch({type:"SET_STATE", payload:settingsState.savedViews[appState.currentView]})
  }, [appState.currentView, settingsState.savedViews]);

  return <StateContext.Provider value={{ userState, userDispatch, appState, appDispatch }}>{children}</StateContext.Provider>;
}

export function useSharedState(): StateContextType {
  const context = useContext(StateContext);
  if (!context) {
    throw new Error("useSharedState must be used within a StateProvider");
  }
  return context;
}


function getUserState(): UserState{
  const savedState =  localStorage.getItem("carboncat.userState");
  return savedState ? JSON.parse(savedState) : initialUserState
}

const userStateFromQueryParams = (u: URLSearchParams, persistantUserState: boolean): UserState => {
  let us = persistantUserState ? getUserState() : initialUserState

  if (u.get("search"))     { us.searchTerm = u.get("search") as string }
  if (u.get("sql"))        { us.sqlExpression = atob(u.get("sql") as string) }
  if (u.get("mode"))       { us.mode = u.get("mode") as Mode }
  if (u.get("filters"))    { us.filters = JSON.parse(atob(u.get("filters") as string)) }
  if (u.get("from") && u.get("to")) {
    us.timeFrom = u.get("from") as string
    us.timeTo = u.get("to") as string
  }
  if (u.get("ds"))         { us.datasource = u.get("ds") as string }
  if (u.get("logLevels"))  { us.logLevels = JSON.parse(atob(u.get("logLevels") as string)) }
  if (u.get("refresh"))    { us.refreshInterval = u.get("refresh") as string }
  if (u.get("logDetails")) { us.logDetails = JSON.parse(u.get("logDetails") as string) }
  if (u.get("fields"))     { us.selectedFields = JSON.parse(atob(u.get("fields") as string)) }
  if (u.get("labels"))     { us.selectedLabels = JSON.parse(atob(u.get("labels") as string)) }


  // Special flags
  if (u.get("app")) { us.filters = [...us.filters, {key:"labels.app", operation:"=", value:u.get("app") as string}]}
  if (u.get("team")) { us.filters = [...us.filters, {key:"labels.team", operation:"=", value:u.get("team") as string}]}

  return us
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
