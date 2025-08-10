import React from 'react';

export interface PageProps {
  children: React.ReactNode;
  full?: boolean;
  className?: string;
}

export const Page: React.FC<PageProps> = ({ children, full = false, className = '' }) => {
  const layoutClass = full ? 'asana-app-layout-full' : 'asana-app-layout';
  return <div className={`${layoutClass} ${className}`.trim()}>{children}</div>;
};

export interface PageContentProps {
  children: React.ReactNode;
  className?: string;
}

export const PageContent: React.FC<PageContentProps> = ({ children, className = '' }) => {
  return <div className={`asana-content ${className}`.trim()}>{children}</div>;
};

export interface PageCardProps {
  children: React.ReactNode;
  className?: string;
}

export const PageCard: React.FC<PageCardProps> = ({ children, className = '' }) => {
  return <div className={`asana-content-card ${className}`.trim()}>{children}</div>;
};

export interface PageBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const PageBody: React.FC<PageBodyProps> = ({ children, className = '' }) => {
  return <div className={`asana-content-body ${className}`.trim()}>{children}</div>;
};

export default Page;


