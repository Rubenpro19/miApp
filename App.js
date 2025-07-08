import * as React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import Router from './routers/router';
import { UserProvider } from './context/UserContext';

export default function App() {
  return (
    <UserProvider>
      <PaperProvider>
        <Router />
      </PaperProvider>
    </UserProvider>
  );
}