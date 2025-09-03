import { useTheme2 } from '@grafana/ui';
import clsx from 'clsx';
import React, { useState } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';

type WrapperProps = {
  title: string;
  isOpen: boolean;
  children: React.ReactElement | React.ReactElement[];
};

export function MenuItemWrapper({ title, isOpen, children }: WrapperProps) {
  const theme = useTheme2();

  const [open, setOpen] = useState<boolean>(isOpen);

  const onClick = () => {
    setOpen(!open);
  };

  return (
    <div
     className={clsx(
       'flex flex-col py-2 select-none border-t-1',
       theme.isDark ? 'border-neutral-200/20' : 'border-neutral-200'
     )}
    >
      <div className={`w-full flex items-center justify-between`}>
        <div className="cursor-pointer" onClick={() => onClick()}>
          <FontAwesomeIcon className="w-6" icon={open ? faChevronDown : faChevronRight} />
          <span className="font-semibold uppercase">{title}</span>
        </div>
      </div>
      {open && (
        <div className="flex flex-col gap-1 mx-4 mt-2">{children}</div>
      )}
    </div>
  );
}
