/**
 * LazyUIRenderer - Lazy loading infrastructure for heavy UI components
 * Reduces initial bundle size by loading UI components only when needed
 */

import React, { Suspense, lazy } from 'react';

// Lazy load heavy UI components
const PortalColorPicker = lazy(() => import('../toolbar/PortalColorPicker'));

interface LazyUIRendererProps {
  component: 'color-picker';
  props: any;
}

// Loading fallback for UI components
const UILoadingFallback: React.FC = () => (
  <div style={{ 
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    color: '#999',
    fontFamily: 'monospace'
  }}>
    ...
  </div>
);

/**
 * LazyUIRenderer - Renders lazy-loaded UI components with proper fallbacks
 */
export const LazyUIRenderer: React.FC<LazyUIRendererProps> = ({ 
  component, 
  props 
}) => {
  const renderComponent = () => {
    switch (component) {
      case 'color-picker':
        return <PortalColorPicker {...props} />;
      default:
        return null;
    }
  };

  return (
    <Suspense fallback={<UILoadingFallback />}>
      {renderComponent()}
    </Suspense>
  );
};

export default LazyUIRenderer; 