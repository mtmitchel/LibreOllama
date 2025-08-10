import React, { useEffect } from 'react';
import { Button } from '../../../components/ui/design-system/Button';
import { Dropdown } from '../../../components/ui/design-system';
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
        <span className="asana-text-sm">Failed to load models</span>
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
        <span className="asana-text-sm">Loading models...</span>
        <RefreshCw size={14} className="animate-spin" />
      </div>
    );
  }

  if (availableModels.length === 0) {
    return (
      <div className="flex items-center gap-2 text-secondary">
        <span className="asana-text-sm">No models available</span>
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
    <Dropdown
      items={availableModels.map((model, index) => ({
        value: model.id || model.name,
        label: model.name,
      }))}
      onSelect={(value) => handleModelSelect(value)}
      placement="bottom-start"
      trigger={(
        <Button
          variant="ghost"
          className="flex h-8 items-center gap-2 px-3 asana-text-sm font-medium"
          title={`Current model: ${displayName}`}
        >
          <span className="max-w-32 truncate">{displayName}</span>
          <ChevronDown size={14} />
        </Button>
      )}
    />
  );
} 