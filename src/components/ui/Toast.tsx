import React, { useState, useEffect } from 'react';
import { Check, X, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'info', 
  duration = 3000,
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300); // Wait for animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <Check size={16} />,
    error: <X size={16} />,
    warning: <AlertCircle size={16} />,
    info: <Info size={16} />
  };

  const colors = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200'
  };

  return (
    <div
      className={`
        fixed bottom-4 right-4 flex items-center gap-2 px-4 py-3 rounded-lg border shadow-lg
        transition-all duration-300 z-[10000]
        ${colors[type]}
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}
    >
      <span>{icons[type]}</span>
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

// Toast manager for easy usage
let toastTimeout: NodeJS.Timeout;

export const showToast = (message: string, type: ToastType = 'info', duration = 3000) => {
  // Clear any existing toast
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  // Remove any existing toast elements
  const existingToast = document.getElementById('toast-container');
  if (existingToast) {
    existingToast.remove();
  }

  // Create new toast container
  const container = document.createElement('div');
  container.id = 'toast-container';
  document.body.appendChild(container);

  // Render toast
  const root = (window as any).createRoot ? 
    (window as any).createRoot(container) : 
    { render: (element: React.ReactElement) => (window as any).ReactDOM.render(element, container) };
    
  root.render(
    <Toast 
      message={message} 
      type={type} 
      duration={duration}
      onClose={() => {
        container.remove();
      }}
    />
  );

  // Cleanup after duration
  toastTimeout = setTimeout(() => {
    container.remove();
  }, duration + 500);
};