import React from 'react';
import clsx from 'clsx';
import { useSharedState } from './StateContext';
import { useTheme2 } from '@grafana/ui';

export interface SettingsProps {}

export const Settings: React.FC<SettingsProps> = () => {
  const { appState, appDispatch } = useSharedState();
  const theme = useTheme2();

  return (
    <div
      className={clsx(
        'flex absolute inset-0 z-10 justify-center items-center rounded-lg backdrop-blur-[3px]',
        theme.isDark ? 'bg-black/20' : 'bg-white/20'
      )}
    >
      <div className="flex flex-col p-4 w-1/2 h-80 font-semibold text-white bg-red-700 rounded-lg shadow-md border-natural-800 border-1">
        <span className="w-full text-lg text-red-300 border-red-300 border-b-1">ERROR</span>
        <span className="pt-4">{appState.error}</span>
      </div>
    </div>
  );
};
