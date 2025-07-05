/**
 * Ladle Components Provider
 * 
 * This file provides global context and styling for all stories,
 * ensuring they have access to the design system and proper theming.
 */
import React from 'react';
import type { GlobalProvider } from '@ladle/react';
import '../src/core/design-system/globals.css';

export const Provider: GlobalProvider = ({ children, globalState }) => {
  // Apply theme class to the document
  React.useEffect(() => {
    const theme = globalState.theme === 'dark' ? 'dark' : 'light';
    document.documentElement.className = theme;
    document.body.className = theme;
  }, [globalState.theme]);

  return (
    <div 
      className={`design-system-provider ${globalState.theme}`}
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        padding: '1rem',
      }}
    >
      {children}
    </div>
  );
}; 