import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {  faPlusCircle, faMinusCircle } from '@fortawesome/free-solid-svg-icons';
import clsx from 'clsx';
import { prettifyHeaderNames } from 'utils/functions';

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
