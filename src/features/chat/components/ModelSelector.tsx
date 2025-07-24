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

  const handleModelSelect = async (modelName: string) => {
    await setSelectedModel(modelName);
  };

  const handleRefreshModels = (e: React.MouseEvent) => {
    e.stopPropagation();
    fetchAvailableModels();
  };

  if (error) {
    return (
      <div className="text-destructive flex items-center gap-2">
        <span className="text-sm">Failed to load models</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefreshModels}
          className="size-6"
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
          className="size-6"
          title="Refresh models"
        >
          <RefreshCw size={14} />
        </Button>
      </div>
    );
  }

  const currentModel = availableModels.find(model => (model.id || model.name) === selectedModel);
  const displayName = currentModel?.name || 'Select Model';

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 items-center gap-2 px-3 text-sm font-medium"
          title={`Current model: ${displayName}`}
        >
          <span className="max-w-32 truncate">{displayName}</span>
          <ChevronDown size={14} />
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content className="w-64">
        <div className="border-border-default flex items-center justify-between border-b px-2 py-1.5 text-xs font-medium text-secondary">
          <span>Available Models</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefreshModels}
            className="size-5"
            title="Refresh models"
          >
            <RefreshCw size={12} />
          </Button>
        </div>
        
        {availableModels.map((model, index) => (
          <DropdownMenu.Item
            key={`${model.provider}-${model.id || model.name}-${index}`}
            onSelect={() => handleModelSelect(model.id || model.name)}
            className={`${
              selectedModel === (model.id || model.name)
                ? 'bg-accent text-accent-foreground' 
                : ''
            }`}
          >
            <div className="flex w-full flex-col items-start gap-1">
              <div className="flex w-full items-center justify-between">
                <span className="truncate font-medium">{model.name}</span>
                {selectedModel === (model.id || model.name) && (
                  <div className="size-2 rounded-full bg-primary" />
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