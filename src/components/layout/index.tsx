// Layout Components using LibreOllama Design System
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

// App Layout - Main container
export function AppLayout({ children, className = '' }: LayoutProps) {
  return <div className={`app-layout ${className}`.trim()}>{children}</div>;
}

// Sidebar Component
export function Sidebar({ children, className = '' }: LayoutProps) {
  return <div className={`sidebar ${className}`.trim()}>{children}</div>;
}

// Main Content Wrapper
export function MainContent({ children, className = '' }: LayoutProps) {
  return <div className={`main-content-wrapper ${className}`.trim()}>{children}</div>;
}

// Top Bar Component
export function TopBar({ children, className = '' }: LayoutProps) {
  return <div className={`top-bar ${className}`.trim()}>{children}</div>;
}

// Content Area
export function ContentArea({ children, className = '' }: LayoutProps) {
  return <div className={`content-area ${className}`.trim()}>{children}</div>;
}

// Sidebar Header
export function SidebarHeader({ children, className = '' }: LayoutProps) {
  return <div className={`sidebar-header ${className}`.trim()}>{children}</div>;
}

// Sidebar Navigation
export function SidebarContent({ children, className = '' }: LayoutProps) {
  return <div className={`sidebar-nav ${className}`.trim()}>{children}</div>;
}

// Sidebar Footer
export function SidebarFooter({ children, className = '' }: LayoutProps) {
  return <div className={`sidebar-footer ${className}`.trim()}>{children}</div>;
}
