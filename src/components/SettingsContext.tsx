import React, { createContext, useContext, useReducer, ReactNode, Dispatch, useEffect } from 'react';

interface SettingsState {
  tableLineHeight: number;
}

const initialSettingsState: SettingsState = {
  tableLineHeight: 35,
};

type SettingsAction =
  | { type: 'SET_TABLE_LINE_HEIGHT'; payload: number }
  | { type: 'CLOSE_SQL_EDITOR' };

function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    case 'SET_TABLE_LINE_HEIGHT':
      return { ...state, tableLineHeight: action.payload };
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

