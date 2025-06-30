import React from 'react';
import { UnifiedHeader } from './UnifiedHeader';

// Define a clear interface for the header's props
interface BreadcrumbItem {
  path: string;
  label: string;
}

interface PrimaryAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

interface SecondaryAction {
  label: string;
  onClick: () => void;
  variant?: 'ghost' | 'secondary';
}

interface PageHeaderProps {
  title: string;
  primaryAction?: PrimaryAction;
  viewSwitcher?: React.ReactNode;
  secondaryActions?: SecondaryAction[];
  breadcrumb?: BreadcrumbItem[];
}

interface PageLayoutProps {
  headerProps: PageHeaderProps;
  children: React.ReactNode;
}

export const PageLayout: React.FC<PageLayoutProps> = ({ headerProps, children }) => {
  return (
    <div className="flex flex-col h-full w-full bg-background">
      <UnifiedHeader {...headerProps} />
      {/* This <main> tag now enforces consistent padding for all pages */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
};