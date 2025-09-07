import React, { ReactNode } from 'react';
import { MailErrorBoundary } from './MailErrorBoundary';

interface MailLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  contextPanel?: ReactNode;
  className?: string;
  showContextPanel?: boolean;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export function MailLayout({
  children,
  sidebar,
  contextPanel,
  className = '',
  showContextPanel = false,
  onError
}: MailLayoutProps) {
  return (
    <MailErrorBoundary onError={onError}>
      <div className={`flex h-full bg-canvas ${className}`}>
        {/* Sidebar */}
        {sidebar && (
          <div className="border-border-default w-80 shrink-0 border-r bg-sidebar">
            <MailErrorBoundary>
              {sidebar}
            </MailErrorBoundary>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex min-w-0 flex-1 flex-col" data-mail-main>
          <MailErrorBoundary>
            {children}
          </MailErrorBoundary>
        </div>

        {/* Context Panel */}
        {showContextPanel && contextPanel && (
          <div className="border-border-default w-80 shrink-0 border-l bg-sidebar" data-mail-context>
            <MailErrorBoundary>
              {contextPanel}
            </MailErrorBoundary>
          </div>
        )}
      </div>
    </MailErrorBoundary>
  );
}

// Layout variants for common mail interface patterns
export function MailSidebarLayout({
  sidebar,
  children,
  className = '',
  onError
}: {
  sidebar: ReactNode;
  children: ReactNode;
  className?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}) {
  return (
    <MailLayout
      sidebar={sidebar}
      className={className}
      onError={onError}
    >
      {children}
    </MailLayout>
  );
}

export function MailThreeColumnLayout({
  sidebar,
  children,
  contextPanel,
  className = '',
  onError
}: {
  sidebar: ReactNode;
  children: ReactNode;
  contextPanel: ReactNode;
  className?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}) {
  return (
    <MailLayout
      sidebar={sidebar}
      contextPanel={contextPanel}
      showContextPanel={true}
      className={className}
      onError={onError}
    >
      {children}
    </MailLayout>
  );
}

// Full-width layout for compose or single message view
export function MailFullLayout({
  children,
  className = '',
  onError
}: {
  children: ReactNode;
  className?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}) {
  return (
    <MailLayout
      className={className}
      onError={onError}
    >
      {children}
    </MailLayout>
  );
} 
