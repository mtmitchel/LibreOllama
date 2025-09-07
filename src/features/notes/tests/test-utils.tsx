import React, { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { HeaderProvider } from '../../../app/contexts/HeaderContext';
import { MantineProvider } from '@mantine/core';
import { ThemeProvider } from '../../../components/ThemeProvider';
import { ToastProvider } from '@tests/helpers/ToastProvider.testshim';

export const TestWrapper = ({ children }: { children: ReactNode }) => (
  <BrowserRouter>
    <ThemeProvider>
      <MantineProvider>
        <HeaderProvider><ToastProvider>{children}</ToastProvider></HeaderProvider>
      </MantineProvider>
    </ThemeProvider>
  </BrowserRouter>
);
