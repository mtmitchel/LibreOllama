import React, { useEffect } from 'react';
import { Button } from '../../../components/ui/design-system/Button';
import { SelectDropdown } from '../../../components/ui/design-system';
import { RefreshCw } from 'lucide-react';
import { useChatStore } from '../stores/chatStore';

interface Props {
  conversationId?: string;
}

export function ModelSelector({ conversationId }: Props) {
  const {
    availableModels,
    selectedModel,
    isLoadingModels,
    isHydrated,
    fetchAvailableModels,
    setSelectedModel,
    setConversationModel,
    error
  } = useChatStore();

  // Fetch models on component mount
  useEffect(() => {
    fetchAvailableModels();
  }, [fetchAvailableModels]);

  const handleModelSelect = async (modelName: string) => {
    if (conversationId && setConversationModel) {
      setConversationModel(conversationId, modelName);
    } else {
      await setSelectedModel(modelName);
    }
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

  // Wait for hydration to avoid flash of wrong value
  if (!isHydrated) {
    return (
      <div className="flex items-center gap-2 text-secondary">
        <span className="asana-text-sm">Loading...</span>
        <RefreshCw size={14} className="animate-spin" />
      </div>
    );
  }

  return (
    <SelectDropdown
      options={availableModels.map((model) => ({
        value: model.id || model.name,
        label: model.name,
      }))}
      value={selectedModel || undefined}
      onChange={handleModelSelect}
      placeholder="Select Model"
      className="min-w-[180px]"
    />
  );
} 