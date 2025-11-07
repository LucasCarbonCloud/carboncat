import React from 'react';
import clsx from 'clsx';
import { useSharedState } from './StateContext';
import { useTheme2 } from '@grafana/ui';
import { NumberInput, SettingsCheckbox } from './Components';
import { useSettings } from './SettingsContext';

export interface SettingsProps {}

export const Settings: React.FC<SettingsProps> = () => {
  const { appDispatch } = useSharedState();
  const { settingsState, settingsDispatch } = useSettings();
  const theme = useTheme2();

  return (
    <div
      className={clsx(
        'flex absolute inset-0 z-10 justify-center items-center rounded-lg backdrop-blur-[3px]',
        theme.isDark ? 'bg-black/20' : 'bg-white/20'
      )}
    >
      <div className={clsx(
        "flex flex-col p-4 w-1/3 h-80 rounded-lg shadow-2xl border-neutral-300 border-1 justify-between",
        theme.isDark ? 'bg-neutral-800' : 'bg-white'
      )}>
        <div className="flex flex-col">
        <span className="w-full text-lg font-semibold text-neutral-500">SETTINGS</span>
        <div className="flex flex-col gap-2 px-4 pt-4">
          <NumberInput
            name="Table line spacing"
            value={settingsState.tableLineHeight}
            maxValue={50}
            minValue={10}
            step={1}
            hidden={false}
            onChange={(v) => {settingsDispatch({type:"SET_TABLE_LINE_HEIGHT", payload:v})}}
          />
          <SettingsCheckbox
            key="state"
            label="Keep state on reload"
            isChecked={settingsState.saveState}
            onChange={() => {settingsDispatch({type:"TOGGLE_SAVE_STATE"})}}
          />
        </div>
        </div>
        <button
          className={"bg-fuchsia-800 !text-white !font-semibold !rounded-md"}
          onClick={() => {appDispatch({type: "CLOSE_SETTINGS"})}}
        >Close</button>
      </div>
    </div>
  );
};
