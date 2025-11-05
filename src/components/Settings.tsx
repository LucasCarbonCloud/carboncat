import React from 'react';
import { FieldSelector, NumberInput } from './Components';
import { Filter as FilterCmp } from './Filter';
import { useTheme2 } from '@grafana/ui';
import clsx from 'clsx';
import { MenuItemWrapper } from './Menu';
import { useSharedState } from './StateContext';


export interface SettingsProps {
  fields: string[];
  labels: string[];
  tableLineHeight: number;
  setTableLineHeight: (value: number) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  fields,
  labels,
  tableLineHeight,
  setTableLineHeight,
}) => {
  const theme = useTheme2();

  const { userState, userDispatch } = useSharedState();

  const handleLabelChange = (value: string) => {
    userDispatch({type:"TOGGLE_LABEL", payload: value})
  };

  const handleFieldChange = (value: string) => {
    userDispatch({type:"TOGGLE_FIELD", payload: value})
  };

  return (
    <div
     className={clsx(
       'h-full overflow-y-scroll flex flex-col border-1 rounded-lg p-3',
       theme.isDark ? 'border-neutral-200/20' : 'border-neutral-200 bg-white'
     )}
    >
      <FilterCmp
       field={'logLevel'}
       selected={userState.logLevels}
       setFunc={(ll: string[]) => {userDispatch({type:"SET_LOGLEVELS", payload: ll})}}
       options={['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']}
       showName="Log Level"
       isOpen={true}
      />

      <p
        className={clsx(
          'h-2 font-semibold uppercase pb-5 pt-10',
          theme.isDark ? 'text-neutral-400' : 'text-neutral-700'
        )}
      >Layout</p>
      <div
        className={clsx(
          'flex flex-col border-b-1',
          theme.isDark ? 'border-neutral-200/20' : 'border-neutral-200'
        )}
      >
        <MenuItemWrapper title='Columns' isOpen={true}>
          <p
           className={clsx(
              'h-2 font-semibold uppercase pt-5 pb-3',
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

        <MenuItemWrapper title='Settings' isOpen={false}>
          <NumberInput name="Line spacing" value={tableLineHeight} maxValue={50} minValue={10} step={1} hidden={false} onChange={setTableLineHeight}/>
        </MenuItemWrapper>
      </div>
    </div>
  );
};
