import React, { useState } from 'react';
import clsx from 'clsx';
import { useSharedState } from './StateContext';
import { useTheme2 } from '@grafana/ui';
import { useSettings } from './SettingsContext';
import { faSave } from '@fortawesome/free-solid-svg-icons';

export interface SaveViewProps {}

export const SaveView: React.FC<SaveViewProps> = () => {
  const { appDispatch, userState } = useSharedState();
  const { settingsDispatch } = useSettings();
  const theme = useTheme2();

  const [inputValue, setInputValue] = useState("");

  return (
    <div
      className={clsx(
        'flex absolute inset-0 z-10 justify-center items-center rounded-lg backdrop-blur-[3px]',
        theme.isDark ? 'bg-black/20' : 'bg-white/20'
      )}
    >
      <div
        className={clsx(
          'flex flex-col p-4 w-1/3 gap-20 rounded-lg shadow-2xl border-1 justify-between',
          theme.isDark ? 'bg-black border-neutral-700' : 'bg-white border-neutral-300'
        )}
      >
        <div className="flex flex-col">
          <span className="w-full text-lg font-semibold text-neutral-500">SAVE VIEW</span>
          <div className="flex flex-col gap-2 px-4 pt-4">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter View Name"
              className="!p-2 !rounded-xl !border !border-gray-300 !focus:ring !focus:ring-blue-300 !focus:outline-none"
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            className={'bg-fuchsia-800 !text-white !font-semibold !rounded-md px-4 py-2'}
            onClick={() => {
              appDispatch({ type: 'CLOSE_SAVE_VIEW' });
            }}
          >
            Close
          </button>
          <button
            className={'bg-green-800 !text-white !font-semibold !rounded-md px-4 py-2'}
            onClick={() => {
              if (!inputValue) {
                return
              }
              settingsDispatch({ type:"SAVE_VIEW", payload: {name:inputValue, state: userState}})
              appDispatch({ type: 'CLOSE_SAVE_VIEW' });
              appDispatch({type:"SET_NOTIFICATION", payload:{icon: faSave, message: `Current view has been saved as ${inputValue}!`}})
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
