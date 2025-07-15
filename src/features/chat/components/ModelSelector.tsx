import React, { useEffect } from 'react';
import { Button } from '../../../components/ui';
import { DropdownMenu } from '../../../components/ui/DropdownMenu';
import { ChevronDown, RefreshCw } from 'lucide-react';
import { useChatStore } from '../stores/chatStore';

export function ModelSelector() {
  const {
    availableModels,
    selectedModel,
    isLoadingModels,
    fetchAvailableModels,
    setSelectedModel,
    error
  } = useChatStore();

  // Fetch models on component mount
  useEffect(() => {
    fetchAvailableModels();
  }, [fetchAvailableModels]);

  const handleModelSelect = (modelName: string) => {
    setSelectedModel(modelName);
  };

  const handleRefreshModels = (e: React.MouseEvent) => {
    e.stopPropagation();
    fetchAvailableModels();
  };

  if (error) {
    return (
      <div className="flex items-center gap-2 text-destructive">
        <span className="text-sm">Failed to load models</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefreshModels}
          className="h-6 w-6"
          title="Retry loading models"
        >
          <RefreshCw size={14} />
        </Button>
      </div>
    );
  }

  if (isLoadingModels) {
    return (
      <div className="flex items-center gap-2 text-secondary">
        <span className="text-sm">Loading models...</span>
        <RefreshCw size={14} className="animate-spin" />
      </div>
    );
  }

  if (availableModels.length === 0) {
    return (
      <div className="flex items-center gap-2 text-secondary">
        <span className="text-sm">No models available</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefreshModels}
          className="h-6 w-6"
          title="Refresh models"
        >
          <RefreshCw size={14} />
        </Button>
      </div>
    );
  }

  const currentModel = availableModels.find(model => model.name === selectedModel);
  const displayName = currentModel?.name || 'Select Model';

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 h-8 px-3 text-sm font-medium"
          title={`Current model: ${displayName}`}
        >
          <span className="max-w-32 truncate">{displayName}</span>
          <ChevronDown size={14} />
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content className="w-64">
        <div className="flex items-center justify-between px-2 py-1.5 text-xs font-medium text-secondary border-b border-border-default">
          <span>Available Models</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefreshModels}
            className="h-5 w-5"
            title="Refresh models"
          >
            <RefreshCw size={12} />
          </Button>
        </div>
        
        {availableModels.map((model) => (
          <DropdownMenu.Item
            key={model.name}
            onSelect={() => handleModelSelect(model.name)}
            className={`${
              selectedModel === model.name 
                ? 'bg-accent text-accent-foreground' 
                : ''
            }`}
          >
            <div className="flex flex-col items-start gap-1 w-full">
              <div className="flex items-center justify-between w-full">
                <span className="font-medium truncate">{model.name}</span>
                {selectedModel === model.name && (
                  <div className="w-2 h-2 bg-primary rounded-full" />
                )}
              </div>
              {model.parameter_size && (
                <span className="text-xs text-secondary">
                  {model.parameter_size}
                </span>
              )}
            </div>
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu>
  );
} 