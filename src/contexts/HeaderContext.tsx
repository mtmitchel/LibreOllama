import React, { createContext, useContext, useState, ReactNode } from 'react';

// Type definitions for header props (matching UnifiedHeader interface)
export interface BreadcrumbItem {
  path: string;
  label: string;
}

export interface PrimaryAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

export interface SecondaryAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode; // Added icon property
  variant?: 'ghost' | 'secondary';
}

export interface HeaderProps {
  title?: string;
  breadcrumb?: BreadcrumbItem[];
  primaryAction?: PrimaryAction;
  viewSwitcher?: React.ReactNode;
  secondaryActions?: SecondaryAction[];
}

interface HeaderContextType {
  headerProps: HeaderProps;
  setHeaderProps: (props: HeaderProps) => void;
  clearHeaderProps: () => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export const HeaderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [headerProps, setHeaderProps] = useState<HeaderProps>({});

  const clearHeaderProps = () => {
    setHeaderProps({});
  };

  return (
    <HeaderContext.Provider value={{ headerProps, setHeaderProps, clearHeaderProps }}>
      {children}
    </HeaderContext.Provider>
  );
};

export const useHeader = () => {
  const context = useContext(HeaderContext);
  if (context === undefined) {
    throw new Error('useHeader must be used within a HeaderProvider');
  }
  return context;
};