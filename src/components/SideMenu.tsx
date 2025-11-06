import React from 'react';
import { FieldSelector } from './Components';
import { Filter as FilterCmp } from './Filter';
import { useTheme2 } from '@grafana/ui';
import clsx from 'clsx';
import { MenuItemWrapper } from './Menu';
import { useSharedState } from './StateContext';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useSettings } from './SettingsContext';
import { motion } from "framer-motion";


export interface SideMenuProps {
  fields: string[];
  labels: string[];
}

export const SideMenu: React.FC<SideMenuProps> = ({
  fields,
  labels,
}) => {
  const theme = useTheme2();

  const { userState, userDispatch } = useSharedState();
  const { settingsState, settingsDispatch } = useSettings();

  const handleLabelChange = (value: string) => {
    userDispatch({type:"TOGGLE_LABEL", payload: value})
  };

  const handleFieldChange = (value: string) => {
    userDispatch({type:"TOGGLE_FIELD", payload: value})
  };

  return (
    <div
     className={clsx(
       'max-h-full overflow-y-scroll flex flex-col border-1 rounded-lg p-3',
       theme.isDark ? 'border-neutral-200/20' : 'border-neutral-200 bg-white'
     )}
    >
      <div className="flex justify-end cursor-pointer text-neutral-500 hover:text-neutral-400" title={settingsState.sidebarOpen? "Close Menu" : "Open Menu"}>
        <FontAwesomeIcon icon={faBars} onClick={() => {settingsDispatch({ type: "TOGGLE_SIDEBAR" })}} />
      </div>
    { settingsState.sidebarOpen && (
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <FilterCmp
         field={'logLevel'}
         selected={userState.logLevels}
         setFunc={(ll: string[]) => {userDispatch({type:"SET_LOGLEVELS", payload: ll})}}
         options={['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']}
         showName="Log Level"
         isOpen={true}
        />
        <div
          className={clsx(
            'flex flex-col pt-2',
            theme.isDark ? 'border-neutral-200/20' : 'border-neutral-200'
          )}
        >
          <MenuItemWrapper title='Columns' isOpen={true}>
            <p
             className={clsx(
                'h-2 font-semibold uppercase pt-1 pb-3',
                theme.isDark ? 'text-neutral-400' : 'text-neutral-700'
              )}
            >Fields</p>
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
            >Labels</p>
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
