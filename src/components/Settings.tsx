import React from 'react';
import { FieldSelector, NumberInput } from './Components';
import { Filter as FilterCmp } from './Filter';
import { useTheme2 } from '@grafana/ui';
import clsx from 'clsx';
import { MenuItemWrapper } from './Menu';
import { HighLevelFilter } from 'types/filters';


export interface SettingsProps {
  fields: string[];
  selectedFields: string[];
  labels: string[];
  selectedLabels: string[];
  // showLevel: boolean;
  // setShowLevel: (showLevel: boolean) => void;
  highLevelFilters: HighLevelFilter;
  tableLineHeight: number;
  setTableLineHeight: (value: number) => void;
  onChange: (selected: string[], changeType: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  fields,
  selectedFields,
  labels,
  selectedLabels,
  // showLevel,
  // setShowLevel,
  highLevelFilters,
  tableLineHeight,
  setTableLineHeight,
  onChange,
}) => {
  const theme = useTheme2();

  const handleLabelChange = (value: string) => {
    const newSelected = selectedLabels.includes(value)
      ? selectedLabels.filter((v) => v !== value)
      : [...selectedLabels, value];
    onChange(newSelected, 'label');
  };

  const handleFieldChange = (value: string) => {
    const newSelected = selectedFields.includes(value)
      ? selectedFields.filter((v) => v !== value)
      : [...selectedFields, value];
    onChange(newSelected, 'field');
  };

  // const handleShowLevelChange = (value: string) => {
  //   setShowLevel(!showLevel);
  // };

  return (
    <div
     className={clsx(
       'h-full overflow-y-scroll flex flex-col border-1 rounded-lg p-3',
       theme.isDark ? 'border-neutral-200/20' : 'border-neutral-200 bg-white'
     )}
    >
      <p
        className={clsx(
          'h-2 font-semibold uppercase pb-5',
          theme.isDark ? 'text-neutral-400' : 'text-neutral-700'
        )}
      >Filters</p>
      <div
        className={clsx(
          'flex flex-col border-b-1',
          theme.isDark ? 'border-neutral-200/20' : 'border-neutral-200'
        )}
      >
        <FilterCmp field={'logLevel'} selected={highLevelFilters.logLevels} setFunc={highLevelFilters.setLogLevels} options={highLevelFilters.availableLogLevels} showName="Log Level" isOpen={true} />
        <FilterCmp field={'app'} selected={highLevelFilters.apps} setFunc={highLevelFilters.setApps} options={highLevelFilters.availableApps} showName="app" isOpen={false} />
        <FilterCmp field={'component'} selected={highLevelFilters.components} setFunc={highLevelFilters.setComponents} options={highLevelFilters.availableComponents} showName="component" isOpen={false} />
        <FilterCmp field={'team'} selected={highLevelFilters.teams} setFunc={highLevelFilters.setTeams} options={highLevelFilters.availableTeams} showName="team" isOpen={false} />
      </div>

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
                  isChecked={selectedFields.includes(field)}
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
                  isChecked={selectedLabels.includes(field)}
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
