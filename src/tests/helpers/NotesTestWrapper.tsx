import React from 'react';
import { ToastProvider } from '@tests/helpers/ToastProvider.testshim';

export const NotesTestWrapper: React.FC<{ children: React.ReactNode }>= ({ children }) => {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
};
