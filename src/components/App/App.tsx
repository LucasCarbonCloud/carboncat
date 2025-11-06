import React from 'react';
import { AppRootProps } from '@grafana/data';
import { StateProvider } from 'components/StateContext';
import  MainPage  from '../../pages/MainPage'
import { SettingsProvider } from 'components/SettingsContext';

function App(props: AppRootProps) {
  return (
    <SettingsProvider>
      <StateProvider>
        <MainPage/>
      </StateProvider>
    </SettingsProvider>
  );
}

export default App;
