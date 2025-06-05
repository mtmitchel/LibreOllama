import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

interface ModelInfo {
  name: string;
  size?: number;
  digest?: string;
  modified_at?: string;
  format?: string;
  family?: string;
  families?: string[];
  parameter_size?: string;
  quantization_level?: string;
}

interface ProcessInfo {
  pid?: number;
  cpu_usage: number;
  memory_usage: number;
  is_sidecar: boolean;
}

interface OllamaHealthResponse {
  status: string;
  message: string;
  process_info?: ProcessInfo;
}

interface StreamEvent {
  stream_id: string;
  content: string;
  full_content: string;
  done: boolean;
}

interface PullProgress {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
}

interface UseOllamaOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseOllamaResult {
  // Status
  health: OllamaHealthResponse | null;
  models: ModelInfo[];
  loading: boolean;
  error: string | null;
  
  // Actions
  refresh: () => Promise<void>;
  startSidecar: () => Promise<void>;
  stopSidecar: () => Promise<void>;
  
  // Model management
  pullModel: (modelName: string) => Promise<void>;
  deleteModel: (modelName: string) => Promise<void>;
  getModelInfo: (modelName: string) => Promise<any>;
  
  // Streaming chat
  startStream: (messages: any[], model: string, onChunk?: (chunk: string, fullContent: string) => void) => Promise<string>;
  cancelStream: () => void;
  isStreaming: boolean;
  
  // Pull progress
  pullProgress: PullProgress | null;
  isPulling: boolean;
}

export function useOllama(options: UseOllamaOptions = {}): UseOllamaResult {
  const { autoRefresh = true, refreshInterval = 30000 } = options;
  
  // State
  const [health, setHealth] = useState<OllamaHealthResponse | null>(null);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [pullProgress, setPullProgress] = useState<PullProgress | null>(null);
  const [isPulling, setIsPulling] = useState(false);
  
  // Refs for cleanup
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamIdRef = useRef<string | null>(null);
  const currentStreamCallbackRef = useRef<((chunk: string, fullContent: string) => void) | null>(null);

  // Check Ollama status
  const checkHealth = useCallback(async () => {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Ollama health check timeout')), 5000)
      );
      
      const healthPromise = invoke<OllamaHealthResponse>('ollama_get_status');
      const healthResponse = await Promise.race([healthPromise, timeoutPromise]) as OllamaHealthResponse;
      
      setHealth(healthResponse);
      setError(null);
      return healthResponse;
    } catch (err: any) {
      const errorMsg = err.toString();
      if (errorMsg.includes('timeout')) {
        setError('Ollama service unavailable');
        setHealth({ status: 'error', message: 'Ollama service unavailable' });
      } else {
        setError(errorMsg);
        setHealth({ status: 'error', message: errorMsg });
      }
      throw err;
    }
  }, []);

  // Load available models
  const loadModels = useCallback(async () => {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Models list timeout')), 5000)
      );
      
      const modelsPromise = invoke<ModelInfo[]>('ollama_list_models');
      const modelsList = await Promise.race([modelsPromise, timeoutPromise]) as ModelInfo[];
      
      setModels(modelsList);
      return modelsList;
    } catch (err: any) {
      console.error('Failed to load models:', err);
      if (err.message?.includes('timeout')) {
        console.warn('Models list unavailable - Ollama service may be down');
        setModels([]);
      } else {
        setModels([]);
      }
      throw err;
    }
  }, []);

  // Refresh all data
  const refresh = useCallback(async () => {
    try {
      setError(null);
      const [healthData] = await Promise.allSettled([
        checkHealth(),
        loadModels()
      ]);
      
      // Only throw if health check fails, models can fail silently
      if (healthData.status === 'rejected') {
        throw healthData.reason;
      }
    } catch (err: any) {
      console.error('Refresh failed:', err);
      setError(err.toString());
    }
  }, [checkHealth, loadModels]);

  // Sidecar management
  const startSidecar = useCallback(async () => {
    try {
      setError(null);
      const result = await invoke<string>('ollama_start_sidecar');
      console.log(result);
      
      // Wait a moment and refresh status
      setTimeout(() => {
        checkHealth();
      }, 2000);
    } catch (err: any) {
      const errorMsg = `Failed to start sidecar: ${err}`;
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [checkHealth]);

  const stopSidecar = useCallback(async () => {
    try {
      setError(null);
      const result = await invoke<string>('ollama_stop_sidecar');
      console.log(result);
      await checkHealth();
    } catch (err: any) {
      const errorMsg = `Failed to stop sidecar: ${err}`;
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [checkHealth]);

  // Model management
  const pullModel = useCallback(async (modelName: string) => {
    if (!modelName.trim()) {
      throw new Error('Model name is required');
    }
    
    setIsPulling(true);
    setPullProgress(null);
    setError(null);
    
    try {
      await invoke('ollama_pull_model', { model: modelName });
      // Refresh models list after successful pull
      await loadModels();
    } catch (err: any) {
      const errorMsg = `Failed to pull model: ${err}`;
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsPulling(false);
      setPullProgress(null);
    }
  }, [loadModels]);

  const deleteModel = useCallback(async (modelName: string) => {
    if (!modelName.trim()) {
      throw new Error('Model name is required');
    }
    
    try {
      setError(null);
      await invoke('ollama_delete_model', { modelName });
      await loadModels(); // Refresh models list
    } catch (err: any) {
      const errorMsg = `Failed to delete model: ${err}`;
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [loadModels]);

  const getModelInfo = useCallback(async (modelName: string) => {
    if (!modelName.trim()) {
      throw new Error('Model name is required');
    }
    
    try {
      const modelDetails = await invoke('ollama_get_model_info', { modelName });
      return modelDetails;
    } catch (err: any) {
      const errorMsg = `Failed to get model info: ${err}`;
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  // Streaming chat
  const startStream = useCallback(async (
    messages: any[], 
    model: string,
    onChunk?: (chunk: string, fullContent: string) => void
  ): Promise<string> => {
    if (isStreaming) {
      throw new Error('A stream is already in progress');
    }
    
    if (!messages || messages.length === 0) {
      throw new Error('Messages are required');
    }
    
    if (!model.trim()) {
      throw new Error('Model is required');
    }
    
    setIsStreaming(true);
    setError(null);
    
    const streamId = `stream-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    streamIdRef.current = streamId;
    currentStreamCallbackRef.current = onChunk || null;
    
    try {
      const fullResponse = await invoke<string>('ollama_chat_stream', {
        messages,
        model,
        streamId
      });
      
      return fullResponse;
    } catch (err: any) {
      const errorMsg = `Streaming failed: ${err}`;
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsStreaming(false);
      streamIdRef.current = null;
      currentStreamCallbackRef.current = null;
    }
  }, [isStreaming]);

  const cancelStream = useCallback(() => {
    if (streamIdRef.current) {
      // Note: We would need to implement stream cancellation in the backend
      // For now, we just reset the local state
      setIsStreaming(false);
      streamIdRef.current = null;
      currentStreamCallbackRef.current = null;
    }
  }, []);

  // Setup event listeners
  useEffect(() => {
    // Listen for pull progress events
    const unlistenPullProgress = listen('ollama_pull_progress', (event: any) => {
      const progress = event.payload as PullProgress;
      setPullProgress(progress);
    });

    // Listen for streaming events
    const unlistenStream = listen('ollama_chat_stream', (event: any) => {
      const streamEvent = event.payload as StreamEvent;
      
      if (streamEvent.stream_id === streamIdRef.current && currentStreamCallbackRef.current) {
        currentStreamCallbackRef.current(streamEvent.content, streamEvent.full_content);
      }
    });

    return () => {
      unlistenPullProgress.then(fn => fn());
      unlistenStream.then(fn => fn());
    };
  }, []);

  // Initial load and auto-refresh setup
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      try {
        await refresh();
      } finally {
        setLoading(false);
      }
    };    initialize();
  }, [refresh]);

  // Auto-refresh effect with visibility checks
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const startRefreshInterval = () => {
        refreshIntervalRef.current = setInterval(() => {
          // Only refresh if not streaming, not pulling, and tab is visible
          if (!isStreaming && !isPulling && !document.hidden) {
            refresh();
          }
        }, Math.max(refreshInterval, 30000)); // Minimum 30 seconds to reduce CPU load
      };

      const handleVisibilityChange = () => {
        if (document.hidden) {
          // Pause refresh when tab is not visible
          if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
          }
        } else {
          // Resume refresh when tab becomes visible
          startRefreshInterval();
        }
      };

      startRefreshInterval();
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [refresh, autoRefresh, refreshInterval, isStreaming, isPulling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      
      // Cancel any ongoing stream
      cancelStream();
    };
  }, [cancelStream]);

  return {
    // Status
    health,
    models,
    loading,
    error,
    
    // Actions
    refresh,
    startSidecar,
    stopSidecar,
    
    // Model management
    pullModel,
    deleteModel,
    getModelInfo,
    
    // Streaming
    startStream,
    cancelStream,
    isStreaming,
    
    // Pull progress
    pullProgress,
    isPulling,
  };
}