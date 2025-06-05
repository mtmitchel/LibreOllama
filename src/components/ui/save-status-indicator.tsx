/**
 * Save Status Indicator Component
 * 
 * Displays subtle save status indicators with appropriate icons and messages.
 * Supports different states: idle, saving, saved, error, conflict, offline.
 * 
 * Features:
 * - Non-intrusive visual feedback
 * - Appropriate icons for each state
 * - Fade-out animation for success states
 * - Error state with retry option
 * - Offline indicator with sync status
 */

import React, { useEffect, useState } from 'react';
import { Check, Save, AlertCircle, Wifi, WifiOff, RefreshCw, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import type { SaveStatus } from '../../lib/auto-save-system';

export interface SaveStatusIndicatorProps {
  status: SaveStatus;
  onRetry?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export function SaveStatusIndicator({
  status,
  onRetry,
  className = '',
  size = 'sm',
  showText = false,
  autoHide = true,
  autoHideDelay = 2000
}: SaveStatusIndicatorProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [shouldShow, setShouldShow] = useState(false);

  // Determine if indicator should be shown
  useEffect(() => {
    const shouldDisplay = status.status !== 'idle' || !status.isOnline;
    setShouldShow(shouldDisplay);
    
    if (shouldDisplay) {
      setIsVisible(true);
    }
  }, [status.status, status.isOnline]);

  // Auto-hide for success states
  useEffect(() => {
    if (autoHide && status.status === 'saved') {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, autoHideDelay);
      
      return () => clearTimeout(timer);
    }
  }, [status.status, autoHide, autoHideDelay]);

  // Don't render if not needed
  if (!shouldShow || !isVisible) {
    return null;
  }

  const getStatusConfig = () => {
    switch (status.status) {
      case 'saving':
        return {
          icon: <RefreshCw className={cn('animate-spin', getSizeClass())} />,
          text: 'Saving...',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      
      case 'saved':
        return {
          icon: <Check className={getSizeClass()} />,
          text: 'Saved',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      
      case 'error':
        return {
          icon: <AlertCircle className={getSizeClass()} />,
          text: 'Save failed',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      
      case 'conflict':
        return {
          icon: <AlertCircle className={getSizeClass()} />,
          text: 'Conflict detected',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200'
        };
      
      case 'offline':
        return {
          icon: <WifiOff className={getSizeClass()} />,
          text: 'Offline - will sync',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
      
      default:
        if (!status.isOnline) {
          return {
            icon: <WifiOff className={getSizeClass()} />,
            text: 'Offline',
            color: 'text-gray-600',
            bgColor: 'bg-gray-50',
            borderColor: 'border-gray-200'
          };
        }
        return {
          icon: <Save className={getSizeClass()} />,
          text: 'Ready',
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'h-3 w-3';
      case 'md': return 'h-4 w-4';
      case 'lg': return 'h-5 w-5';
      default: return 'h-3 w-3';
    }
  };

  const getContainerSizeClass = () => {
    switch (size) {
      case 'sm': return 'px-2 py-1 text-xs';
      case 'md': return 'px-3 py-1.5 text-sm';
      case 'lg': return 'px-4 py-2 text-base';
      default: return 'px-2 py-1 text-xs';
    }
  };

  const config = getStatusConfig();
  
  const getTooltipContent = () => {
    const baseInfo = `Status: ${status.status}`;
    const lastSaved = status.lastSaved ? 
      `\nLast saved: ${new Date(status.lastSaved).toLocaleTimeString()}` : '';
    const error = status.error ? `\nError: ${status.error}` : '';
    const retryInfo = status.retryCount > 0 ? `\nRetries: ${status.retryCount}` : '';
    
    return baseInfo + lastSaved + error + retryInfo;
  };

  const indicator = (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border transition-all duration-200',
        config.color,
        config.bgColor,
        config.borderColor,
        getContainerSizeClass(),
        className
      )}
    >
      {config.icon}
      {showText && (
        <span className="font-medium">{config.text}</span>
      )}
      {(status.status === 'error' || status.status === 'conflict') && onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className={cn(
            'h-auto p-0 ml-1',
            config.color,
            'hover:bg-transparent hover:opacity-70'
          )}
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {indicator}
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs whitespace-pre-line">
            {getTooltipContent()}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Compact save status indicator for tight spaces
 */
export function CompactSaveStatusIndicator({
  status,
  onRetry,
  className = ''
}: Pick<SaveStatusIndicatorProps, 'status' | 'onRetry' | 'className'>) {
  return (
    <SaveStatusIndicator
      status={status}
      onRetry={onRetry}
      className={className}
      size="sm"
      showText={false}
      autoHide={true}
    />
  );
}

/**
 * Detailed save status indicator with text
 */
export function DetailedSaveStatusIndicator({
  status,
  onRetry,
  className = ''
}: Pick<SaveStatusIndicatorProps, 'status' | 'onRetry' | 'className'>) {
  return (
    <SaveStatusIndicator
      status={status}
      onRetry={onRetry}
      className={className}
      size="md"
      showText={true}
      autoHide={true}
    />
  );
}

/**
 * Save status badge for headers and toolbars
 */
export function SaveStatusBadge({
  status,
  onRetry,
  className = ''
}: Pick<SaveStatusIndicatorProps, 'status' | 'onRetry' | 'className'>) {
  // Only show for non-idle states
  if (status.status === 'idle' && status.isOnline) {
    return null;
  }

  return (
    <div className={cn('flex items-center', className)}>
      <SaveStatusIndicator
        status={status}
        onRetry={onRetry}
        size="sm"
        showText={false}
        autoHide={false}
      />
    </div>
  );
}

/**
 * Hook to get appropriate save status message
 */
export function useSaveStatusMessage(status: SaveStatus): string {
  switch (status.status) {
    case 'saving':
      return 'Saving your changes...';
    case 'saved':
      return status.lastSaved ? 
        `Saved at ${new Date(status.lastSaved).toLocaleTimeString()}` : 
        'Changes saved';
    case 'error':
      return status.error || 'Failed to save changes';
    case 'conflict':
      return 'Conflict detected - manual resolution needed';
    case 'offline':
      return 'Working offline - changes will sync when connected';
    default:
      return status.isOnline ? 'Ready' : 'Offline';
  }
}

/**
 * Hook to get save status color theme
 */
export function useSaveStatusTheme(status: SaveStatus) {
  switch (status.status) {
    case 'saving':
      return {
        primary: 'text-blue-600',
        background: 'bg-blue-50',
        border: 'border-blue-200'
      };
    case 'saved':
      return {
        primary: 'text-green-600',
        background: 'bg-green-50',
        border: 'border-green-200'
      };
    case 'error':
    case 'conflict':
      return {
        primary: 'text-red-600',
        background: 'bg-red-50',
        border: 'border-red-200'
      };
    case 'offline':
      return {
        primary: 'text-gray-600',
        background: 'bg-gray-50',
        border: 'border-gray-200'
      };
    default:
      return {
        primary: 'text-gray-500',
        background: 'bg-gray-50',
        border: 'border-gray-200'
      };
  }
}