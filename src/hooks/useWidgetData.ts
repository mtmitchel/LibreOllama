import { useState, useEffect } from 'react';

interface UseWidgetDataOptions {
  refreshInterval?: number;
  retryCount?: number;
}

interface WidgetDataState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
}

/**
 * Custom hook for managing widget data with loading states, error handling, and auto-refresh
 */
export function useWidgetData<T>(
  fetchFn: () => Promise<T> | T,
  dependencies: any[] = [],
  options: UseWidgetDataOptions = {}
): WidgetDataState<T> & { refetch: () => void } {
  const { refreshInterval, retryCount = 3 } = options;
  
  const [state, setState] = useState<WidgetDataState<T>>({
    data: null,
    isLoading: true,
    error: null,
    lastUpdated: null
  });

  const [retries, setRetries] = useState(0);

  const fetchData = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await Promise.resolve(fetchFn());
      
      setState({
        data: result,
        isLoading: false,
        error: null,
        lastUpdated: new Date()
      });
      
      setRetries(0); // Reset retry count on successful fetch
    } catch (error) {
      console.error('Widget data fetch error:', error);
      
      if (retries < retryCount) {
        setRetries(prev => prev + 1);
        // Exponential backoff
        setTimeout(fetchData, Math.pow(2, retries) * 1000);
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error : new Error('Unknown error')
        }));
      }
    }
  };

  const refetch = () => {
    setRetries(0);
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, dependencies);

  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, ...dependencies]);

  return {
    ...state,
    refetch
  };
}
