import React from 'react';
import { ToastProvider } from '@/features/canvas/components/ui/ToastProvider.testshim';

export const NotesTestWrapper: React.FC<{ children: React.ReactNode }>= ({ children }) => {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
};
