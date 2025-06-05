import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { 
  Download, 
  Trash2, 
  RefreshCw, 
  HardDrive, 
  Calendar,
  Info,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Search,
  Plus,
  X
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

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

interface ModelDetails {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
  modelfile?: string;
  template?: string;
  details?: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

interface PullProgress {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
}

export function ModelManager() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newModelName, setNewModelName] = useState('');
  const [pullingModel, setPullingModel] = useState<string | null>(null);
  const [pullProgress, setPullProgress] = useState<PullProgress | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; model: string | null }>({
    open: false,
    model: null
  });
  const [selectedModel, setSelectedModel] = useState<ModelDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Popular models suggestions
  const popularModels = [
    'llama3.2:3b',
    'llama3.2:1b',
    'codellama:7b',
    'mistral:7b',
    'gemma2:2b',
    'phi3:mini',
    'qwen2.5:7b',
    'deepseek-coder:6.7b'
  ];

  const loadModels = async () => {
    try {
      setError(null);
      const modelsList = await invoke<ModelInfo[]>('ollama_list_models');
      setModels(modelsList);
    } catch (err: any) {
      console.error('Failed to load models:', err);
      setError(err.toString());
      setModels([]);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await loadModels();
    setRefreshing(false);
  };

  const pullModel = async (modelName: string) => {
    if (!modelName.trim()) return;
    
    setPullingModel(modelName);
    setPullProgress(null);
    setError(null);
    
    try {
      await invoke('ollama_pull_model', { model: modelName });
      // Refresh models list after successful pull
      await loadModels();
    } catch (err: any) {
      setError(`Failed to pull model: ${err}`);
    } finally {
      setPullingModel(null);
      setPullProgress(null);
    }
  };

  const deleteModel = async (modelName: string) => {
    try {
      await invoke('ollama_delete_model', { modelName });
      await loadModels(); // Refresh models list
      setDeleteDialog({ open: false, model: null });
    } catch (err: any) {
      setError(`Failed to delete model: ${err}`);
    }
  };

  const getModelDetails = async (modelName: string) => {
    setDetailsLoading(true);
    try {
      const details = await invoke<ModelDetails>('ollama_get_model_info', { modelName });
      setSelectedModel(details);
    } catch (err: any) {
      console.error('Failed to get model details:', err);
      setError(`Failed to get model details: ${err}`);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    loadModels().then(() => setLoading(false));

    // Listen for pull progress events
    const unlistenPullProgress = listen('ollama_pull_progress', (event: any) => {
      const progress = event.payload as PullProgress;
      setPullProgress(progress);
    });

    return () => {
      unlistenPullProgress.then(fn => fn());
    };
  }, []);

  const formatModelSize = (size?: number) => {
    if (!size) return 'Unknown size';
    const gb = size / (1024 * 1024 * 1024);
    return gb > 1 ? `${gb.toFixed(1)} GB` : `${(size / (1024 * 1024)).toFixed(0)} MB`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

  const getPullProgress = () => {
    if (!pullProgress) return 0;
    if (!pullProgress.total || !pullProgress.completed) return 0;
    return (pullProgress.completed / pullProgress.total) * 100;
  };

  const filteredModels = models.filter(model =>
    model.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSize = models.reduce((sum, model) => sum + (model.size || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Model Manager</h2>
          <p className="text-muted-foreground">
            Manage your Ollama models - download, view details, and remove models
          </p>
        </div>
        <Button
          variant="outline"
          onClick={refresh}
          disabled={loading || refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Storage Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <HardDrive className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Models</p>
                <p className="text-2xl font-bold">{models.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <HardDrive className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Size</p>
                <p className="text-2xl font-bold">{formatModelSize(totalSize)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-sm text-green-600">Ready</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Download Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Download Models
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Manual model download */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter model name (e.g., llama3.2:3b, codellama:7b)"
              value={newModelName}
              onChange={(e) => setNewModelName(e.target.value)}
              className="flex-1"
              disabled={pullingModel !== null}
            />
            <Button
              onClick={() => {
                pullModel(newModelName);
                setNewModelName('');
              }}
              disabled={!newModelName.trim() || pullingModel !== null}
            >
              <Download className="h-4 w-4 mr-2" />
              Pull
            </Button>
          </div>

          {/* Popular models */}
          <div>
            <p className="text-sm font-medium mb-2">Popular Models:</p>
            <div className="flex flex-wrap gap-2">
              {popularModels.map((model) => (
                <Button
                  key={model}
                  variant="outline"
                  size="sm"
                  onClick={() => setNewModelName(model)}
                  disabled={pullingModel !== null}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {model}
                </Button>
              ))}
            </div>
          </div>

          {/* Pull progress */}
          {pullingModel && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-md space-y-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="font-medium text-sm">Downloading {pullingModel}...</span>
              </div>
              
              {pullProgress && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>{pullProgress.status}</span>
                    <span>{getPullProgress().toFixed(1)}%</span>
                  </div>
                  <Progress value={getPullProgress()} className="w-full" />
                  {pullProgress.total && pullProgress.completed && (
                    <div className="text-xs text-muted-foreground">
                      {formatModelSize(pullProgress.completed)} / {formatModelSize(pullProgress.total)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Models List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Installed Models
              <Badge variant="secondary">{filteredModels.length}</Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search models..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 rounded-md flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading models...
            </div>
          ) : filteredModels.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {models.length === 0 ? (
                <div>
                  <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No models installed</p>
                  <p className="text-sm">Download your first model to get started</p>
                </div>
              ) : (
                <div>
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No models found</p>
                  <p className="text-sm">Try adjusting your search terms</p>
                </div>
              )}
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {filteredModels.map((model, index) => (
                  <div
                    key={`${model.name}-${index}`}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-base truncate">{model.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {formatModelSize(model.size)}
                        </Badge>
                        {model.parameter_size && (
                          <Badge variant="secondary" className="text-xs">
                            {model.parameter_size}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {model.modified_at && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Modified: {formatDate(model.modified_at)}</span>
                          </div>
                        )}
                        {model.family && (
                          <div className="flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            <span>Family: {model.family}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => getModelDetails(model.name)}
                        disabled={detailsLoading}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteDialog({ open: true, model: model.name })}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Model Details */}
      {selectedModel && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Model Details: {selectedModel.name}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedModel(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Basic Information</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Name:</strong> {selectedModel.name}</div>
                  <div><strong>Size:</strong> {formatModelSize(selectedModel.size)}</div>
                  <div><strong>Modified:</strong> {formatDate(selectedModel.modified_at)}</div>
                  <div><strong>Digest:</strong> <code className="text-xs">{selectedModel.digest.substring(0, 16)}...</code></div>
                </div>
              </div>
              
              {selectedModel.details && (
                <div>
                  <h4 className="font-medium mb-2">Technical Details</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Format:</strong> {selectedModel.details.format}</div>
                    <div><strong>Family:</strong> {selectedModel.details.family}</div>
                    <div><strong>Parameters:</strong> {selectedModel.details.parameter_size}</div>
                    <div><strong>Quantization:</strong> {selectedModel.details.quantization_level}</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={deleteDialog.open} 
        onOpenChange={(open) => setDeleteDialog({ open, model: deleteDialog.model })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Model</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the model "{deleteDialog.model}"? 
              This action cannot be undone and you'll need to download it again to use it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog.model && deleteModel(deleteDialog.model)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}