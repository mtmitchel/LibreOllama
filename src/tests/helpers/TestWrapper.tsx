import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HeaderProvider } from '../../app/contexts/HeaderContext';

// Create a new QueryClient for each test to avoid pollution
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
});

interface TestWrapperProps {
  children: React.ReactNode;
}

export const TestWrapper: React.FC<TestWrapperProps> = ({ children }) => {
  const queryClient = createQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <HeaderProvider>
        {children}
      </HeaderProvider>
    </QueryClientProvider>
  );
};

export default TestWrapper; 