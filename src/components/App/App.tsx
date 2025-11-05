import React from 'react';
import { AppRootProps } from '@grafana/data';
import { StateProvider } from 'components/StateContext';
import  MainPage  from '../../pages/MainPage'

function App(props: AppRootProps) {
  return (
    <StateProvider>
      <MainPage/>
    </StateProvider>
  );
}

export default App;
