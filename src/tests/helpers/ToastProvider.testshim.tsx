import React, { createContext, useContext } from 'react';

type Toast = { id: string; title: string; description?: string };

const ToastContext = createContext<{ add: (t: Toast) => void } | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }>= ({ children }) => {
  const add = (_t: Toast) => {};
  return (
    <ToastContext.Provider value={{ add }}>
      {children}
    </ToastContext.Provider>
  );
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

