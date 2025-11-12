import React from 'react';
import { FieldSelector } from './Components';
import { LogFilter } from './LogFilter';
import { useTheme2 } from '@grafana/ui';
import clsx from 'clsx';
import { MenuItemWrapper } from './Menu';
import { useSharedState } from './StateContext';
import { faBars, faCog, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useSettings } from './SettingsContext';
import { motion } from 'framer-motion';

export interface SideMenuProps {
  fields: string[];
  labels: string[];
}

export const SideMenu: React.FC<SideMenuProps> = ({ fields, labels }) => {
  const theme = useTheme2();

  const { userState, userDispatch, appDispatch, appState } = useSharedState();
  const { settingsState, settingsDispatch } = useSettings();

  const handleLabelChange = (value: string) => {
    userDispatch({ type: 'TOGGLE_LABEL', payload: value });
  };

  const handleFieldChange = (value: string) => {
    userDispatch({ type: 'TOGGLE_FIELD', payload: value });
  };

  return (
    <div
      className={clsx(
        'max-h-full max-w-80 overflow-y-scroll flex flex-col border-1 rounded-lg p-3',
        theme.isDark ? 'border-neutral-200/20' : 'border-neutral-200 bg-white'
      )}
    >
      <div
        className={clsx('flex justify-between gap-4 pb-4', settingsState.sidebarOpen ? 'flex-row-reverse' : 'flex-col')}
      >
        <FontAwesomeIcon
          icon={faBars}
          className="cursor-pointer text-neutral-500 hover:text-neutral-400"
          title={settingsState.sidebarOpen ? 'Close Menu' : 'Open Menu'}
          role="button"
          onClick={() => {
            settingsDispatch({ type: 'TOGGLE_SIDEBAR' });
          }}
        />
        <div
          className={clsx('flex justify-between gap-4', settingsState.sidebarOpen ? 'flex-row' : 'flex-col')}
        >
          <FontAwesomeIcon
            icon={faCog}
            className="cursor-pointer text-neutral-500 hover:text-neutral-400"
            title="Settings"
            role="button"
            onClick={() => {
              appDispatch({ type: 'OPEN_SETTINGS' });
            }}
          />
          <FontAwesomeIcon
            icon={faTrashCan}
            className={clsx(
              appState.currentView === "default" ? theme.isDark ? "cursor-not-allowed text-neutral-800"  : "cursor-not-allowed text-neutral-200" : "cursor-pointer text-neutral-500 hover:text-neutral-400",
            )}
            title="Delete Current View"
            role={appState.currentView === "default" ? "":"button"}
            onClick={() => {
              if (appState.currentView === "default") {
                return
              }

              const v = appState.currentView
              settingsDispatch({ type: 'DELETE_VIEW', payload: appState.currentView });
              appDispatch({ type:"SET_CURRENT_VIEW", payload:"default" })
              appDispatch({ type:"SET_NOTIFICATION", payload:{ icon:faTrashCan, message: `Deleted view ${v}` } })
            }}
          />
        </div>
      </div>

      <div
        className={`flex ${
          settingsState.sidebarOpen ? 'flex-row' : 'flex-col'
        } gap-2 pt-4 pb-2 flex-wrap border-t-1 ${theme.isDark? "border-neutral-200/20" : "border-neutral-200"}`}
      >
        <SavedView isSelected={appState.currentView === 'default'} name="default" />
        {Object.entries(settingsState.savedViews).map(([name]) => (
          <SavedView key={name} isSelected={appState.currentView === name} name={name} />
        ))}
      </div>

      {settingsState.sidebarOpen && (
        <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
          <LogFilter
            showName="Log Level"
          />

          <div className={clsx('flex flex-col pt-2', theme.isDark ? 'border-neutral-200/20' : 'border-neutral-200')}>
            <MenuItemWrapper title="Columns" isOpen={true}>
              <p
                className={clsx(
                  'h-2 font-semibold uppercase pt-1 pb-3',
                  theme.isDark ? 'text-neutral-400' : 'text-neutral-700'
                )}
              >
                Fields
              </p>
              <div className={`gap-1`}>
                {fields.map((field) => {
                  return (
                    <FieldSelector
                      key={field}
                      field={field}
                      isChecked={userState.selectedFields.includes(field)}
                      hidden={false}
                      onChange={handleFieldChange}
                    />
                  );
                })}
              </div>
              <p
                className={clsx(
                  'h-2 font-semibold uppercase pt-5 pb-3',
                  theme.isDark ? 'text-neutral-400' : 'text-neutral-700'
                )}
              >
                Labels
              </p>
              <div className={`gap-1`}>
                {labels.map((field) => {
                  return (
                    <FieldSelector
                      key={field}
                      field={field}
                      isChecked={userState.selectedLabels.includes(field)}
                      hidden={false}
                      onChange={handleLabelChange}
                    />
                  );
                })}
              </div>
            </MenuItemWrapper>
          </div>
        </motion.div>
      )}
    </div>
  );
};

interface SavedViewProps {
  name: string;
  isSelected: boolean;
}

const SavedView: React.FC<SavedViewProps> = ({ name, isSelected }) => {
  const { appDispatch } = useSharedState();

  const theme = useTheme2();

  return (
    <div
      className={clsx(
        `flex justify-center items-center w-6 h-6 font-mono text-sm rounded-md border cursor-pointer select-none`,
        isSelected ?
          theme.isDark ? "bg-fuchsia-700 border-fuchsia-900 font-bold" : 'bg-fuchsia-300 border-fuchsia-500 font-bold'
        : theme.isDark ? 'bg-neutral-700 border-neutral-500' : 'bg-neutral-300 border-neutral-500',
        theme.isDark ? "hover:bg-fuchsia-500" : "hover:bg-fuchsia-200",
      )}
      role="button"
      onClick={() => {
        appDispatch({ type: 'SET_CURRENT_VIEW', payload: name });
      }}
    >
      <span title={name} className="uppercase">
        {name[0]}
      </span>
    </div>
  );
};
