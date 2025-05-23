import { useState, useEffect } from 'react';
import { MODEL_COMPATIBILITY, getModelCompatibility, type ModelCompatibilityLevel } from '@/ai/model-compatibility';

export interface OllamaModel {
  id: string;          // Full ID with prefix (e.g., 'ollama/qwen3:8b')
  name: string;        // Raw name from Ollama API (e.g., 'qwen3:8b')
  displayName: string; // Formatted name for display (e.g., 'Qwen3 8b')
  modified: string;    // Last modified timestamp
  size: number;        // Model size in bytes
  toolCompatible: boolean; // Whether the model likely supports tool calls
  compatibilityLevel: ModelCompatibilityLevel; // Level of tool compatibility
  details?: {
    format: string;
    family: string;
    families?: string[];
    parameter_size: string;
    quantization_level?: string;
  };
}

interface OllamaModelsResponse {
  models: OllamaModel[];
  error?: string;
}

/**
 * Hook to fetch and manage Ollama models
 */
export function useOllamaModels() {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Function to fetch models
  const fetchModels = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ollama/models');
      const data: OllamaModelsResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch models');
      }
      
      if (data.models) {
        setModels(data.models);
        setLastUpdated(new Date());
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching Ollama models:', err);
      setError(err instanceof Error ? err.message : String(err));
      // Keep the old models list if there was an error
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch models on initial load
  useEffect(() => {
    fetchModels();
  }, []);

  return {
    models,
    isLoading,
    error,
    lastUpdated,
    refresh: fetchModels,
    
    // Filtered model getters - now all these return all models without filtering by default
    getAllModels: () => models, // Return all models without filtering
    getToolCompatibleModels: () => models, // Return all models (no filtering)
    getFullCompatibilityModels: () => models.filter(m => m.compatibilityLevel === 'full'),
    getPartialCompatibilityModels: () => models.filter(m => m.compatibilityLevel === 'partial'),
    getNoCompatibilityModels: () => models.filter(m => m.compatibilityLevel === 'none'),
    getModelById: (id: string) => models.find(m => m.id === id),
    
    // Helper to check if a model is available locally
    isModelAvailable: (id: string) => models.some(m => m.id === id),
    
    // Get compatibility info for a model (even if not in local list)
    getCompatibilityLevel: (id: string): ModelCompatibilityLevel => {
      // Check if it's in our local models first
      const localModel = models.find(m => m.id === id);
      if (localModel) return localModel.compatibilityLevel;
      
      // Otherwise, use the shared compatibility checker
      return getModelCompatibility(id);
    }
  };
} 