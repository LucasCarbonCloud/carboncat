import React, { createContext, useContext, useReducer, ReactNode, Dispatch, useEffect } from 'react';
import { UserState } from './StateContext';

interface SettingsState {
  tableLineHeight: number;
  sidebarOpen: boolean;
  saveState: boolean;
  savedViews: Record<string, UserState>;
}

const initialSettingsState: SettingsState = {
  tableLineHeight: 35,
  sidebarOpen: true,
  saveState: true,
  savedViews: {},
};

type SettingsAction =
  | { type: 'SET_TABLE_LINE_HEIGHT'; payload: number; }
  | { type: 'SAVE_VIEW'; payload: {name: string; state: UserState}; }
  | { type: 'DELETE_VIEW'; payload: string; }
  | { type: 'TOGGLE_SAVE_STATE'; }
  | { type: 'TOGGLE_SIDEBAR' };


function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    case 'SET_TABLE_LINE_HEIGHT':
      return { ...state, tableLineHeight: action.payload };
    case 'SAVE_VIEW':
      return { ...state, savedViews: {
        ...state.savedViews,
        [action.payload.name]: action.payload.state,
      }}
    case 'DELETE_VIEW':
      const sv = state.savedViews
      delete sv[action.payload]
      return { ...state, savedViews: {
        ...sv,
      }}
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'TOGGLE_SAVE_STATE':
      return { ...state, saveState: !state.saveState};
    default:
      return state;
  }
}

interface SettingsContextType {
  settingsState: SettingsState;
  settingsDispatch: Dispatch<SettingsAction>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settingsState, settingsDispatch] = useReducer(settingsReducer, getSettings());

  useEffect(() => {
    localStorage.setItem("carboncat.settings", JSON.stringify(settingsState));
  }, [settingsState]);

  return (
    <SettingsContext.Provider value={{ settingsState, settingsDispatch }}>{children}</SettingsContext.Provider>
  );
}

function getSettings(): SettingsState {
  const savedSettings = localStorage.getItem("carboncat.settings");
  return savedSettings ? JSON.parse(savedSettings) : initialSettingsState
}

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSharedState must be used within a StateProvider');
  }
  return context;
}

