/**
 * Loading Overlay Components for Canvas Operations
 * 
 * Provides visual feedback for loading states:
 * - Global canvas loading overlay
 * - Element-specific loading indicators
 * - Progress bars and spinners
 * - Operation-specific messaging
 */

import React from 'react';
import { LoadingOperation } from '../hooks/useLoadingStates';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div
      className={`animate-spin rounded-full border-2 border-primary-500 border-t-transparent ${sizeClasses[size]} ${className}`}
      role="progressbar"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

interface ProgressBarProps {
  progress: number;
  className?: string;
  showPercentage?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, className = '', showPercentage = false }) => {
  return (
    <div className={`w-full bg-surface-200 rounded-full h-2 ${className}`}>
      <div
        className="bg-primary-500 h-2 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
      />
      {showPercentage && (
        <div className="mt-1 text-xs text-text-secondary text-center">
          {Math.round(progress)}%
        </div>
      )}
    </div>
  );
};

interface GlobalLoadingOverlayProps {
  isLoading: boolean;
  message: string;
  progress?: number;
  operation?: LoadingOperation | null;
  onCancel?: () => void;
}

export const GlobalLoadingOverlay: React.FC<GlobalLoadingOverlayProps> = ({
  isLoading,
  message,
  progress = 0,
  operation,
  onCancel
}) => {
  if (!isLoading) return null;

  const getOperationIcon = (op: LoadingOperation | null) => {
    switch (op) {
      case 'file-save':
      case 'file-load':
        return '💾';
      case 'image-load':
        return '🖼️';
      case 'canvas-export':
        return '📤';
      case 'element-create':
      case 'element-update':
        return '✏️';
      case 'bulk-operation':
        return '⚡';
      default:
        return '⏳';
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Loading"
    >
      <div className="bg-surface-100 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getOperationIcon(operation || null)}</span>
            <LoadingSpinner size="lg" />
          </div>
          
          <div className="text-center">
            <h3 className="text-lg font-medium text-text-primary mb-2">
              {message}
            </h3>
            
            {operation && (
              <p className="text-sm text-text-secondary">
                {getOperationDisplayName(operation)}
              </p>
            )}
          </div>

          {progress > 0 && (
            <div className="w-full">
              <ProgressBar progress={progress} showPercentage />
            </div>
          )}

          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface InlineLoadingProps {
  isLoading: boolean;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  isLoading,
  message,
  size = 'md',
  className = ''
}) => {
  if (!isLoading) return null;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <LoadingSpinner size={size} />
      {message && (
        <span className="text-sm text-text-secondary">
          {message}
        </span>
      )}
    </div>
  );
};

interface ElementLoadingIndicatorProps {
  isLoading: boolean;
  x: number;
  y: number;
  size?: number;
}

export const ElementLoadingIndicator: React.FC<ElementLoadingIndicatorProps> = ({
  isLoading,
  x,
  y,
  size = 24
}) => {
  if (!isLoading) return null;

  return (
    <div
      className="absolute pointer-events-none z-10"
      style={{
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size
      }}
    >
      <div className="w-full h-full bg-primary-500 bg-opacity-20 rounded-full flex items-center justify-center">
        <LoadingSpinner size="sm" className="border-primary-600" />
      </div>
    </div>
  );
};

interface LoadingStateBarProps {
  loadingStates: Array<{
    id: string;
    operation: LoadingOperation;
    message: string;
    progress: number;
    isLoading: boolean;
  }>;
  className?: string;
}

export const LoadingStateBar: React.FC<LoadingStateBarProps> = ({
  loadingStates,
  className = ''
}) => {
  const activeStates = loadingStates.filter(state => state.isLoading);

  if (activeStates.length === 0) return null;

  return (
    <div className={`bg-surface-100 border-t border-border-200 p-3 ${className}`}>
      <div className="space-y-2">
        {activeStates.map((state) => (
          <div key={state.id} className="flex items-center space-x-3">
            <LoadingSpinner size="sm" />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-text-primary truncate">
                {state.message}
              </div>
              <div className="text-xs text-text-secondary">
                {getOperationDisplayName(state.operation)}
              </div>
            </div>
            {state.progress > 0 && (
              <div className="w-20">
                <ProgressBar progress={state.progress} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper function to get user-friendly operation names
function getOperationDisplayName(operation: LoadingOperation): string {
  const displayNames: Record<LoadingOperation, string> = {
    'element-create': 'Creating element',
    'element-update': 'Updating element',
    'element-delete': 'Deleting element',
    'store-save': 'Saving canvas',
    'store-load': 'Loading canvas',
    'image-load': 'Loading image',
    'font-load': 'Loading fonts',
    'file-save': 'Saving file',
    'file-load': 'Loading file',
    'canvas-export': 'Exporting canvas',
    'bulk-operation': 'Processing multiple items'
  };

  return displayNames[operation] || 'Processing';
}

export { LoadingSpinner, ProgressBar };