import { useState, useCallback, useEffect } from 'react';
import { useHeader } from '../../../app/contexts/HeaderContext';

interface ToastMessage {
    id: string;
    variant: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
}

export function useKanbanUI() {
    const { setHeaderProps, clearHeaderProps } = useHeader();
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
    const [error, setError] = useState<string | null>(null);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    useEffect(() => {
        setHeaderProps({ title: "Tasks" });
        return () => clearHeaderProps();
    }, [setHeaderProps, clearHeaderProps]);
    
    const addToast = useCallback((variant: ToastMessage['variant'], title: string, message: string) => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, variant, title, message }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    return {
        viewMode,
        setViewMode,
        error,
        setError,
        toasts,
        addToast,
        removeToast,
        setHasInitialized: useState(false)[1] // We only need the setter
    };
} 