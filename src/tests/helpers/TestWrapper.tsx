import React from 'react';
import { HeaderProvider } from '../../app/contexts/HeaderContext';

// Simple test wrapper without react-query dependency
interface TestWrapperProps {
  children: React.ReactNode;
}

export const TestWrapper: React.FC<TestWrapperProps> = ({ children }) => {
  return (
    <HeaderProvider>
      {children}
    </HeaderProvider>
  );
};

export default TestWrapper; 