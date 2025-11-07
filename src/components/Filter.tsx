import React, {  useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronRight, faFilter, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { FieldSelector } from './Components';
import { useTheme2 } from '@grafana/ui';
import clsx from 'clsx';

export interface FilterProps {
  field: string;
  showName: string;
  isOpen: boolean;
  options: string[];
  selected: string[];
  setFunc: (value: string[]) => void;
  // onChange: (field: string) => void;
}

export const Filter: React.FC<FilterProps> = ({ field, showName, isOpen, options, selected, setFunc }) => {
  const theme = useTheme2();



  // const options = getOptionsForVariable(field);
  // const selected = getValuesForVariable(field);

  const [open, setOpen] = useState<boolean>(isOpen);
  const [selectedOptions, setSelectedOptions] = useState<string[]>(selected);
  // const [options, setOptions] = useState<string[]>(selected);

  const onClick = () => {
    setOpen(!open);
  };

  const handleFieldChange = (value: string, op?: string) => {
    if (op === 'only') {
      setSelectedOptions([value]);
      setFunc([value])
      return;
    }
    const newSelected = selectedOptions.includes(value)
      ? selectedOptions.filter((v) => v !== value)
      : [...selectedOptions, value];
    setSelectedOptions(newSelected);
    setFunc(newSelected)
  };

  const resetOptions = () => {
    setSelectedOptions([]);
    setFunc([])
    // locationService.partial({ [`var-${field}`]: ['All'] }, true);
  };

  return (
    <div
     className={clsx(
       'flex flex-col py-2 select-none',
       theme.isDark ? 'border-neutral-200/20' : 'border-neutral-200'
     )}
    >
      <div className={`w-full flex items-center justify-between`}>
        <div className="cursor-pointer" onClick={() => onClick()}>
          <FontAwesomeIcon className="w-6" icon={open ? faChevronDown : faChevronRight} />
          <span className="font-semibold uppercase">{showName}</span>
        </div>
        {selectedOptions.length > 0 && (
          <div className="flex items-center text-neutral-400">
            <span>
              {selectedOptions.length} of {options.length}
            </span>
            <FontAwesomeIcon
              className="p-2 cursor-pointer text-neutral-300"
              icon={faCircleXmark}
              onClick={resetOptions}
            />
          </div>
        )}
      </div>
      {open && (
        <FilterContent options={options} selectedOptions={selectedOptions} handleFieldChange={handleFieldChange} />
      )}
    </div>
  );
};

interface FilterContentProps {
  options: string[];
  selectedOptions: string[];
  handleFieldChange: (option: string, op?: string) => void;
  // field: string;
  // isChecked: boolean;
  // onChange: (field: string) => void;
}

const FilterContent: React.FC<FilterContentProps> = ({ options, selectedOptions, handleFieldChange }) => {
  const theme = useTheme2();

  const [searchTerm, setSearchTerm] = useState<string>('');
  // const [open, setOpen] = useState<boolean>(false);

  const resetSearchTerm = () => {
    setSearchTerm('');
  };

  return (
    <div className={`w-full flex flex-col mt-2`}>
      <div
        className={clsx(
          'flex relative items-center mb-2 rounded-md border-1',
          theme.isDark ? 'border-neutral-200/20' : 'border-neutral-200'
        )}

      >
        <div className="flex items-center px-2 h-full rounded-l-lg text-neutral-400">
          <FontAwesomeIcon icon={faFilter} />
        </div>
        <input
          className="flex-grow p-1 pr-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ borderTopRightRadius: '0.375rem', borderBottomRightRadius: '0.375rem' }}
        />
        <FontAwesomeIcon
          className="absolute right-0 p-2 cursor-pointer text-neutral-300"
          icon={faCircleXmark}
          onClick={resetSearchTerm}
        />
      </div>
      <div>
        {options.map((o) => {
          return (
            <div
              key={o}
              className={clsx(
                'w-full flex',
                theme.isDark ? 'hover:bg-neutral-100/20' : 'hover:bg-neutral-100',
                searchTerm !== '' && !o.toLowerCase().startsWith(searchTerm.toLowerCase()) && `hidden`
              )}
            >

              <FieldSelector
                field={o}
                isChecked={selectedOptions.includes(o)}
                hidden={searchTerm !== '' && !o.toLowerCase().startsWith(searchTerm.toLowerCase())}
                onChange={handleFieldChange}
              />
              <div
                onClick={() => handleFieldChange(o, 'only')}
                className={clsx(
                  "flex items-center px-1 text-xs align-middle rounded-xl cursor-pointer text-neutral-400",
                  theme.isDark ? 'hover:bg-neutral-800' : 'hover:bg-neutral-200'
                )}
              >
                <span>only</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
