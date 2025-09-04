import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {  faPlusCircle, faMinusCircle } from '@fortawesome/free-solid-svg-icons';
import clsx from 'clsx';
import { prettifyHeaderNames } from 'utils/functions';
import { ToggleOption } from 'types/components';

export interface FieldSelectorProps {
  field: string;
  isChecked: boolean;
  hidden: boolean;
  onChange: (field: string) => void;
}

export const FieldSelector: React.FC<FieldSelectorProps> = ({ field, isChecked, hidden, onChange }) => {
  return (
    <div className={`w-full flex gap-2 ${hidden && `hidden`}`}>
      <input type="checkbox" value={field} checked={isChecked} onChange={() => onChange(field)} />
      <label key={field}>{prettifyHeaderNames(field, true)}</label>
    </div>
  );
};

export interface NumberInputProps {
  name: string;
  value: number;
  maxValue: number;
  minValue: number;
  step: number;
  hidden: boolean;
  onChange: (value: number) => void;
}

export const NumberInput: React.FC<NumberInputProps> = ({ name, value, maxValue, minValue, step, hidden, onChange }) => {
  const handleValueChange = (op: string) => {
    let v = value;
    if (op === "+") {
      v = v+step
    } else {
      v = v-step
    }

    if (v < minValue || v > maxValue) {
      return
    }

    onChange(v)
  };

  return (
    <div className={`w-full flex gap-2 justify-between ${hidden && `hidden`}`}>
      <span>{name}</span>
    <div className={`flex gap-2 items-center`}>
        <span>{value}</span>
        <div className={clsx(
          `text-neutral-300 flex gap-1 items-center`
           )}>
          <FontAwesomeIcon icon={faMinusCircle} className={clsx(
            `hover:text-neutral-500`
           )} onClick={() => handleValueChange("-")}/>
          <FontAwesomeIcon icon={faPlusCircle} className={clsx(
            `hover:text-neutral-500`
           )} onClick={() => handleValueChange("+")} />
        </div>
      </div>
    </div>
  );
};

interface ToggleButtonGroupProps {
  options: ToggleOption[];
  defaultValue?: string;
  onChange?: (value: string) => void;
}

export default function ToggleButtonGroup({
  options,
  defaultValue,
  onChange,
}: ToggleButtonGroupProps) {
  const [selected, setSelected] = useState(defaultValue || options[0].value);

  const handleClick = (value: string, disabled?: boolean) => {
    if (disabled) { return };
    setSelected(value);
    onChange?.(value);
  };

return (
    <div className="inline-flex mx-4 rounded-lg border border-gray-300">
     {options.map((option, idx) => (
        <div
          key={option.value}
          title={option.label}
          onClick={() => handleClick(option.value, option.disabled)}
          className={[
            "flex items-center justify-center px-3 py-2 text-sm transition-colors",
            "hover:bg-gray-100",
            idx === 0 ? "rounded-l-lg" : "",
            idx === options.length - 1 ? "rounded-r-lg" : "",
            option.disabled ? "opacity-50 cursor-not-allowed" : "",
            selected === option.value
              ? "bg-gray-200 text-gray-900"
              : "bg-white text-gray-600",
          ].join(" ")}
        >
          {option.icon && (
            <FontAwesomeIcon icon={option.icon} className="w-4 h-4" />
          )}
        </div>
      ))}
    </div>
  );
}
