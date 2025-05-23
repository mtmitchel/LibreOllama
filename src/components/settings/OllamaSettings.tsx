"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Download, 
  Trash2, 
  RefreshCw,
  Server,
  HardDrive,
  Cpu,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { OllamaModel, OllamaResponse, ValidModel } from '@/ai/types';
import { MODEL_INFO, VALID_MODELS } from '@/ai/types';

interface OllamaSettingsProps {
  className?: string;
}

export default function OllamaSettings({ className }: OllamaSettingsProps) {
  const [ollamaUrl, setOllamaUrl] = useState('http://127.0.0.1:11434');
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [availableModels, setAvailableModels] = useState<ValidModel[]>([]);
  const [pullingModel, setPullingModel] = useState<string | null>(null);
  const [deletingModel, setDeletingModel] = useState<string | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    // Load saved URL from localStorage
    const savedUrl = localStorage.getItem('ollama_url');
    if (savedUrl) {
      setOllamaUrl(savedUrl);
    }
    
    // Test connection on mount
    testConnection();
  }, []);

  const testConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${ollamaUrl}/api/tags`);
      
      if (response.ok) {
        const data: OllamaResponse = await response.json();
        setIsConnected(true);
        setModels(data.models || []);
        
        // Determine which models are available to pull
        const installedModelNames = data.models.map(m => m.name);
        const notInstalled = VALID_MODELS.filter(model => 
          !installedModelNames.includes(model)
        );
        setAvailableModels(notInstalled);
        
        toast({
          title: 'Connection successful',
          description: `Connected to Ollama. Found ${data.models.length} models.`,
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      setIsConnected(false);
      setModels([]);
      console.error('Ollama connection failed:', error);
      toast({
        title: 'Connection failed',
        description: 'Could not connect to Ollama. Make sure it\'s running.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveUrl = () => {
    localStorage.setItem('ollama_url', ollamaUrl);
    testConnection();
  };

  const pullModel = async (modelName: ValidModel) => {
    setPullingModel(modelName);
    try {
      const response = await fetch(`${ollamaUrl}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: modelName,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Model download started',
          description: `Downloading ${modelName}. This may take a while.`,
        });
        
        // Refresh models list after a delay
        setTimeout(() => {
          testConnection();
        }, 2000);
      } else {
        throw new Error(`Failed to pull model: ${response.status}`);
      }
    } catch (error) {
      console.error('Error pulling model:', error);
      toast({
        title: 'Download failed',
        description: `Failed to download ${modelName}.`,
        variant: 'destructive',
      });
    } finally {
      setPullingModel(null);
    }
  };

  const deleteModel = async (modelName: string) => {
    if (!confirm(`Are you sure you want to delete ${modelName}?`)) {
      return;
    }

    setDeletingModel(modelName);
    try {
      const response = await fetch(`${ollamaUrl}/api/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: modelName,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Model deleted',
          description: `${modelName} has been removed.`,
        });
        
        // Refresh models list
        testConnection();
      } else {
        throw new Error(`Failed to delete model: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting model:', error);
      toast({
        title: 'Deletion failed',
        description: `Failed to delete ${modelName}.`,
        variant: 'destructive',
      });
    } finally {
      setDeletingModel(null);
    }
  };

  const formatSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getModelInfo = (modelName: string) => {
    const key = modelName as ValidModel;
    return MODEL_INFO[key] || {
      name: modelName,
      displayName: modelName,
      description: 'Custom model',
      capabilities: ['chat'],
    };
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Ollama Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection Settings */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ollama API URL</label>
              <div className="flex gap-2">
                <Input
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  placeholder="http://127.0.0.1:11434"
                  className="flex-1"
                />
                <Button onClick={saveUrl} disabled={isLoading}>
                  Save & Test
                </Button>
              </div>
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Testing connection...</span>
                </>
              ) : isConnected === true ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">Connected to Ollama</span>
                </>
              ) : isConnected === false ? (
                <>
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-600">Connection failed</span>
                </>
              ) : null}
              
              {isConnected && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={testConnection}
                  className="ml-auto"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Installed Models */}
          {isConnected && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Installed Models</h3>
                <Badge variant="secondary">
                  {models.length} model{models.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              {models.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
                  <p>No models installed</p>
                  <p className="text-sm">Pull a model from the available models below</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {models.map((model) => {
                      const info = getModelInfo(model.name);
                      return (
                        <Card key={model.name} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium">{info.displayName}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {model.details?.parameter_size || 'Unknown size'}
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-muted-foreground mb-2">
                                {info.description}
                              </p>
                              
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <HardDrive className="h-3 w-3" />
                                  {formatSize(model.size)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Cpu className="h-3 w-3" />
                                  {model.details?.family || 'Unknown'}
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap gap-1 mt-2">
                                {info.capabilities.map((cap) => (
                                  <Badge key={cap} variant="secondary" className="text-xs">
                                    {cap}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteModel(model.name)}
                              disabled={deletingModel === model.name}
                              className="text-destructive hover:text-destructive"
                            >
                              {deletingModel === model.name ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}

          {/* Available Models to Pull */}
          {isConnected && availableModels.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Available Models</h3>
                  <Badge variant="outline">
                    {availableModels.length} available
                  </Badge>
                </div>

                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {availableModels.map((modelName) => {
                      const info = getModelInfo(modelName);
                      return (
                        <Card key={modelName} className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm">{info.displayName}</h4>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {info.description}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {info.capabilities.slice(0, 3).map((cap) => (
                                  <Badge key={cap} variant="secondary" className="text-xs">
                                    {cap}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            <Button
                              size="sm"
                              onClick={() => pullModel(modelName)}
                              disabled={pullingModel === modelName}
                            >
                              {pullingModel === modelName ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Pulling...
                                </>
                              ) : (
                                <>
                                  <Download className="h-3 w-3 mr-1" />
                                  Pull
                                </>
                              )}
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}

          {/* Help Text */}
          {!isConnected && (
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Getting Started with Ollama
              </h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>1. Install Ollama from <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ollama.ai</a></p>
                <p>2. Start Ollama service</p>
                <p>3. Test the connection above</p>
                <p>4. Pull your first model to get started</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 