import { useState, useCallback } from 'react';

export interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

interface Toast extends ToastProps {
  id: string;
  createdAt: number;
}

// Simple toast hook for Tauri app
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(({ title, description, variant = 'default', duration = 5000 }: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = {
      id,
      title,
      description,
      variant,
      duration,
      createdAt: Date.now(),
    };

    // For now, just log to console
    console.log(`Toast: ${title}${description ? ` - ${description}` : ''}`);
    
    setToasts((prev) => [...prev, newToast]);

    // Auto-remove toast after duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);

    return {
      id,
      dismiss: () => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      },
    };
  }, []);

  const dismiss = useCallback((toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  return {
    toast,
    dismiss,
    toasts,
  };
}