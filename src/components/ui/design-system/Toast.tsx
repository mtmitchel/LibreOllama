import React, { useState, useEffect, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, AlertCircle, Info, AlertTriangle } from 'lucide-react';

/**
 * Design System Toast Component
 * 
 * DLS Compliant Toast notifications following Asana patterns
 * - Non-intrusive notifications
 * - Auto-dismiss with manual close option
 * - Stacking support for multiple toasts
 */

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  title?: string;
  description: string;
  variant?: ToastVariant;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastItemProps extends ToastData {
  onClose: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({
  id,
  title,
  description,
  variant = 'default',
  duration = 5000,
  action,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    // Auto-dismiss
    const timer = duration > 0 ? setTimeout(() => {
      handleClose();
    }, duration) : null;

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(id);
    }, 200); // Match animation duration
  };

  const icons = {
    default: null,
    success: <Check className="text-[var(--semantic-success)]" size={16} />,
    error: <X className="text-[var(--semantic-error)]" size={16} />,
    warning: <AlertTriangle className="text-[var(--semantic-warning)]" size={16} />,
    info: <Info className="text-[var(--brand-primary)]" size={16} />,
  };

  const variantClasses = {
    default: 'bg-[var(--bg-primary)] border-[var(--border-default)]',
    success: 'bg-[var(--semantic-success-bg)] border-[var(--semantic-success)]',
    error: 'bg-[var(--semantic-error-bg)] border-[var(--semantic-error)]',
    warning: 'bg-[var(--semantic-warning-bg)] border-[var(--semantic-warning)]',
    info: 'bg-[var(--brand-subtle)] border-[var(--brand-primary)]',
  };

  return (
    <div
      className={`
        relative flex items-start gap-[var(--space-2)]
        min-w-[300px] max-w-[500px]
        p-[var(--space-3)]
        bg-[var(--bg-primary)]
        border border-[var(--border-default)]
        rounded-[var(--radius-md)]
        shadow-[var(--shadow-elevated)]
        transition-all duration-200
        ${variantClasses[variant]}
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      {icons[variant] && (
        <div className="flex-shrink-0 mt-[2px]">
          {icons[variant]}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        {title && (
          <div className="text-[var(--text-body)] font-medium text-[var(--text-primary)] mb-[2px]">
            {title}
          </div>
        )}
        <div className="text-[var(--text-small)] text-[var(--text-secondary)]">
          {description}
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className={`
              mt-[var(--space-1)]
              text-[var(--text-small)]
              text-[var(--brand-primary)]
              hover:text-[var(--brand-hover)]
              font-medium
              transition-colors
              duration-[var(--transition-duration)]
            `}
          >
            {action.label}
          </button>
        )}
      </div>
      
      <button
        onClick={handleClose}
        className={`
          flex-shrink-0
          p-[var(--space-0-5)]
          rounded-[var(--radius-sm)]
          text-[var(--text-secondary)]
          hover:bg-[var(--bg-secondary)]
          hover:text-[var(--text-primary)]
          transition-[var(--transition-property)]
          duration-[var(--transition-duration)]
        `}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
};

/**
 * Toast Container - Manages multiple toasts
 */
interface ToastContainerProps {
  toasts: ToastData[];
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onClose,
  position = 'bottom-right',
}) => {
  const positionClasses = {
    'top-right': 'top-[var(--space-4)] right-[var(--space-4)] items-end',
    'top-left': 'top-[var(--space-4)] left-[var(--space-4)] items-start',
    'bottom-right': 'bottom-[var(--space-4)] right-[var(--space-4)] items-end',
    'bottom-left': 'bottom-[var(--space-4)] left-[var(--space-4)] items-start',
    'top-center': 'top-[var(--space-4)] left-1/2 -translate-x-1/2 items-center',
    'bottom-center': 'bottom-[var(--space-4)] left-1/2 -translate-x-1/2 items-center',
  };

  if (toasts.length === 0) return null;

  return createPortal(
    <div
      className={`
        fixed z-[var(--z-toast)]
        flex flex-col gap-[var(--space-2)]
        ${positionClasses[position]}
      `}
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>,
    document.body
  );
};

/**
 * Toast Context and Provider
 */
interface ToastContextValue {
  addToast: (toast: Omit<ToastData, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export interface ToastProviderProps {
  children: React.ReactNode;
  position?: ToastContainerProps['position'];
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ 
  children, 
  position = 'bottom-right' 
}) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = (toast: Omit<ToastData, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearToasts = () => {
    setToasts([]);
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast, clearToasts }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} position={position} />
    </ToastContext.Provider>
  );
};

/**
 * Convenience functions for common toast types
 */
export const toast = {
  success: (description: string, options?: Partial<ToastData>) => ({
    ...options,
    description,
    variant: 'success' as const,
  }),
  error: (description: string, options?: Partial<ToastData>) => ({
    ...options,
    description,
    variant: 'error' as const,
  }),
  warning: (description: string, options?: Partial<ToastData>) => ({
    ...options,
    description,
    variant: 'warning' as const,
  }),
  info: (description: string, options?: Partial<ToastData>) => ({
    ...options,
    description,
    variant: 'info' as const,
  }),
  default: (description: string, options?: Partial<ToastData>) => ({
    ...options,
    description,
    variant: 'default' as const,
  }),
};

/**
 * Standalone toast function (requires ToastProvider to be in the component tree)
 */
let globalToastFunction: ((toast: Omit<ToastData, 'id'>) => void) | null = null;

export const showToast = (description: string, variant: ToastVariant = 'default', options?: Partial<ToastData>) => {
  if (globalToastFunction) {
    globalToastFunction({
      ...options,
      description,
      variant,
    });
  } else {
    console.warn('ToastProvider not found. Please wrap your app with ToastProvider to use showToast.');
  }
};

// Hook to register the global toast function
export const useRegisterGlobalToast = (addToast: (toast: Omit<ToastData, 'id'>) => void) => {
  useEffect(() => {
    globalToastFunction = addToast;
    return () => {
      globalToastFunction = null;
    };
  }, [addToast]);
};