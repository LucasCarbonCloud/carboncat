import React, { useEffect } from 'react';
import clsx from 'clsx';
import { useSharedState } from './StateContext';
import { useTheme2 } from '@grafana/ui';
import { AnimatePresence, motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export interface NotificationViewProps{}

export const NotificationView: React.FC<NotificationViewProps> = () => {
  const { appState, appDispatch } = useSharedState();
  const theme = useTheme2();

  useEffect(() => {
    if (appState.notification != null) {
      const timer = setTimeout(() => {
        appDispatch({type:'CLEAR_NOTIFICATION'})
      }, 3000);

      return () => clearTimeout(timer);
    }
    return
  }, [appState.notification]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AnimatePresence>
    { appState.notification &&
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -40 }}
        transition={{ duration: 0.2 }}
        className={clsx(
            'flex absolute inset-0 top-2 left-1/2 transform -translate-x-1/2 z-10 justify-center items-center rounded-sm shadow-xl py-2 px-4 gap-3 border-1 w-80 h-min select-none cursor-normal',
             theme.isDark ? 'bg-black border-neutral-700' : 'bg-white border-neutral-200'
        )}
        onClick={() => {
          appDispatch({ type: 'CLEAR_NOTIFICATION' });
        }}
      >
        <div
          className={clsx(
            "flex justify-center items-center h-full min-h-full border-r-1",
            theme.isDark ? "border-neutral-700 text-white" : "border-neutral-200 text-neutral-400"
          )}
        >
          <FontAwesomeIcon icon={appState.notification.icon} className={clsx("text-2xl pr-3")}/>
        </div>
        <span className="text-sm">{appState.notification.message}</span>
      </motion.div>
    }
    </AnimatePresence>
  );
};
