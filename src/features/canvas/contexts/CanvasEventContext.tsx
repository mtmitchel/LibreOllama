/**
 * CanvasEventContext - Context-based communication system for canvas events
 * 
 * Replaces global window usage with proper React context-based communication
 * between UnifiedEventHandler and components that need to interact with it.
 */

import React, { createContext, useContext, useCallback, useRef, ReactNode } from 'react';

interface CanvasEventContextValue {
  // Selection protection for text editing
  protectSelection: () => void;
  isSelectionProtected: () => boolean;
  
  // Event delegation system
  registerEventHandler: (type: string, handler: (...args: unknown[]) => void) => void;
  unregisterEventHandler: (type: string) => void;
  triggerEvent: (type: string, ...args: unknown[]) => void;
  
  // Performance metrics
  getEventStats: () => {
    handlerCount: number;
    protectionCount: number;
    lastProtectionTime: number | null;
  };
}

interface CanvasEventProviderProps {
  children: ReactNode;
}

const CanvasEventContext = createContext<CanvasEventContextValue | null>(null);

export const CanvasEventProvider: React.FC<CanvasEventProviderProps> = ({ children }) => {
  // Selection protection state
  const selectionProtected = useRef<boolean>(false);
  const protectionTimeout = useRef<NodeJS.Timeout | null>(null);
  const protectionCount = useRef<number>(0);
  const lastProtectionTime = useRef<number | null>(null);
  
  // Event handlers registry
  const eventHandlers = useRef<Map<string, (...args: unknown[]) => void>>(new Map());
  
  // Selection protection implementation
  const protectSelection = useCallback(() => {
    selectionProtected.current = true;
    protectionCount.current += 1;
    lastProtectionTime.current = Date.now();
    
    // Clear any existing timeout
    if (protectionTimeout.current) {
      clearTimeout(protectionTimeout.current);
    }
    
    // Clear protection after 500ms (longer for text operations)
    protectionTimeout.current = setTimeout(() => {
      selectionProtected.current = false;
      protectionTimeout.current = null;
    }, 500);
  }, []);
  
  const isSelectionProtected = useCallback(() => {
    return selectionProtected.current;
  }, []);
  
  // Event delegation system
  const registerEventHandler = useCallback((type: string, handler: (...args: unknown[]) => void) => {
    eventHandlers.current.set(type, handler);
  }, []);
  
  const unregisterEventHandler = useCallback((type: string) => {
    eventHandlers.current.delete(type);
  }, []);
  
  const triggerEvent = useCallback((type: string, ...args: unknown[]) => {
    const handler = eventHandlers.current.get(type);
    if (handler) {
      handler(...args);
    }
  }, []);
  
  // Performance metrics
  const getEventStats = useCallback(() => ({
    handlerCount: eventHandlers.current.size,
    protectionCount: protectionCount.current,
    lastProtectionTime: lastProtectionTime.current,
  }), []);
  
  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (protectionTimeout.current) {
        clearTimeout(protectionTimeout.current);
      }
      eventHandlers.current.clear();
    };
  }, []);
  
  const value: CanvasEventContextValue = {
    protectSelection,
    isSelectionProtected,
    registerEventHandler,
    unregisterEventHandler,
    triggerEvent,
    getEventStats,
  };
  
  return (
    <CanvasEventContext.Provider value={value}>
      {children}
    </CanvasEventContext.Provider>
  );
};

// Custom hook for consuming the context
export const useCanvasEvents = (): CanvasEventContextValue => {
  const context = useContext(CanvasEventContext);
  if (!context) {
    throw new Error('useCanvasEvents must be used within a CanvasEventProvider');
  }
  return context;
};

// Convenience hook for selection protection
export const useSelectionProtection = () => {
  const { protectSelection, isSelectionProtected } = useCanvasEvents();
  return { protectSelection, isSelectionProtected };
};

// Convenience hook for event delegation
export const useCanvasEventDelegation = () => {
  const { registerEventHandler, unregisterEventHandler, triggerEvent } = useCanvasEvents();
  return { registerEventHandler, unregisterEventHandler, triggerEvent };
};

export default CanvasEventContext;