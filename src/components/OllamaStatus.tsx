import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Server, 
  Play, 
  Square, 
  Download, 
  Trash2,
  Info,
  Activity
} from 'lucide-react';

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

interface PullProgress {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
}

export function OllamaStatus() {
  const [health, setHealth] = useState<OllamaHealthResponse | null>(null);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidecarLoading, setSidecarLoading] = useState(false);
  const [pullProgress, setPullProgress] = useState<{ [key: string]: PullProgress }>({});
  const [newModelName, setNewModelName] = useState('');
  const [pullingModel, setPullingModel] = useState<string | null>(null);

  const checkStatus = async () => {
    try {
      const statusResponse = await invoke<OllamaHealthResponse>('ollama_get_status');
      setHealth(statusResponse);
      setError(null);
    } catch (err: any) {
      setError(err.toString());
      setHealth({ status: 'error', message: err.toString() });
    }
  };

  const loadModels = async () => {
    try {
      const modelsList = await invoke<ModelInfo[]>('ollama_list_models');
      setModels(modelsList);
    } catch (err: any) {
      console.error('Failed to load models:', err);
      setModels([]);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([checkStatus(), loadModels()]);
    setRefreshing(false);
  };

  const startSidecar = async () => {
    setSidecarLoading(true);
    try {
      const result = await invoke<string>('ollama_start_sidecar');
      console.log(result);
      // Wait a moment and refresh status
      setTimeout(() => {
        checkStatus();
      }, 2000);
    } catch (err: any) {
      setError(`Failed to start sidecar: ${err}`);
    } finally {
      setSidecarLoading(false);
    }
  };

  const stopSidecar = async () => {
    setSidecarLoading(true);
    try {
      const result = await invoke<string>('ollama_stop_sidecar');
      console.log(result);
      checkStatus();
    } catch (err: any) {
      setError(`Failed to stop sidecar: ${err}`);
    } finally {
      setSidecarLoading(false);
    }
  };

  const pullModel = async (modelName: string) => {
    if (!modelName.trim()) return;
    
    setPullingModel(modelName);
    try {
      await invoke('ollama_pull_model', { model: modelName });
      // Refresh models list after successful pull
      loadModels();
    } catch (err: any) {
      setError(`Failed to pull model: ${err}`);
    } finally {
      setPullingModel(null);
      setPullProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[modelName];
        return newProgress;
      });
    }
  };

  const deleteModel = async (modelName: string) => {
    try {
      await invoke('ollama_delete_model', { modelName });
      loadModels(); // Refresh models list
    } catch (err: any) {
      setError(`Failed to delete model: ${err}`);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await Promise.all([checkStatus(), loadModels()]);
      setLoading(false);
    };

    initialize();

    // Listen for pull progress events
    const unlistenPullProgress = listen('ollama_pull_progress', (event: any) => {
      const progress = event.payload as PullProgress;
      if (pullingModel) {
        setPullProgress(prev => ({
          ...prev,
          [pullingModel]: progress
        }));
      }
    });

    return () => {
      unlistenPullProgress.then(fn => fn());
    };
  }, [pullingModel]);

  const getStatusIcon = () => {
    if (loading || refreshing) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }

    switch (health?.status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
      case 'unreachable':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (health?.status) {
      case 'healthy':
        return 'bg-green-500';
      case 'error':
      case 'unreachable':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatModelSize = (size?: number) => {
    if (!size) return 'Unknown size';
    const gb = size / (1024 * 1024 * 1024);
    return gb > 1 ? `${gb.toFixed(1)} GB` : `${(size / (1024 * 1024)).toFixed(0)} MB`;
  };

  const formatMemory = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return mb > 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(0)} MB`;
  };

  const renderPullProgress = (modelName: string) => {
    const progress = pullProgress[modelName];
    if (!progress) return null;

    const percentage = progress.total && progress.completed 
      ? (progress.completed / progress.total) * 100 
      : 0;

    return (
      <div className="mt-2 space-y-1">
        <div className="flex justify-between text-xs">
          <span>{progress.status}</span>
          {percentage > 0 && <span>{percentage.toFixed(1)}%</span>}
        </div>
        {percentage > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Server className="h-5 w-5" />
            Ollama Status
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={loading || refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            {health?.status !== 'healthy' ? (
              <Button
                variant="default"
                size="sm"
                onClick={startSidecar}
                disabled={sidecarLoading}
              >
                {sidecarLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Start
              </Button>
            ) : (
              <Button
                variant="destructive"
                size="sm"
                onClick={stopSidecar}
                disabled={sidecarLoading}
              >
                {sidecarLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                Stop
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">Connection</span>
              <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
            </div>
            <p className="text-sm text-muted-foreground">
              {health?.message || 'Checking connection...'}
            </p>
          </div>
          <Badge variant={health?.status === 'healthy' ? 'default' : 'destructive'}>
            {health?.status || 'Unknown'}
          </Badge>
        </div>

        {/* Process Info */}
        {health?.process_info && (
          <div className="bg-muted/50 p-3 rounded-md space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="font-medium text-sm">Process Information</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">PID:</span> {health.process_info.pid || 'N/A'}
              </div>
              <div>
                <span className="text-muted-foreground">CPU:</span> {health.process_info.cpu_usage.toFixed(1)}%
              </div>
              <div>
                <span className="text-muted-foreground">Memory:</span> {formatMemory(health.process_info.memory_usage)}
              </div>
              <div>
                <span className="text-muted-foreground">Type:</span> {health.process_info.is_sidecar ? 'Sidecar' : 'External'}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Model Management */}
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            Available Models
            <Badge variant="secondary">{models.length}</Badge>
          </h4>

          {/* Add Model */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Enter model name (e.g., llama2, codellama)"
              value={newModelName}
              onChange={(e) => setNewModelName(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md text-sm"
              disabled={pullingModel !== null}
            />
            <Button
              size="sm"
              onClick={() => {
                pullModel(newModelName);
                setNewModelName('');
              }}
              disabled={!newModelName.trim() || pullingModel !== null}
            >
              <Download className="h-4 w-4" />
              Pull
            </Button>
          </div>

          {/* Pulling Progress */}
          {pullingModel && (
            <div className="mb-3 p-3 bg-blue-50 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="font-medium text-sm">Pulling {pullingModel}...</span>
              </div>
              {renderPullProgress(pullingModel)}
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading models...
            </div>
          ) : models.length === 0 ? (
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
              {health?.status === 'healthy' 
                ? 'No models installed. Pull a model using the form above.'
                : 'Cannot load models - Ollama connection required'
              }
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {models.map((model, index) => (
                <div
                  key={`${model.name}-${index}`}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{model.name}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                      {model.modified_at && (
                        <span>Modified: {new Date(model.modified_at).toLocaleDateString()}</span>
                      )}
                      {model.parameter_size && (
                        <span>Parameters: {model.parameter_size}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {formatModelSize(model.size)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteModel(model.name)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {health?.status === 'healthy' && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Ollama is running on localhost:11434
              {health.process_info?.is_sidecar && ' (managed by LibreOllama)'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}