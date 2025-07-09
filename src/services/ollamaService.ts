import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';
import { useSettingsStore } from '../stores/settingsStore';

// Types for Ollama responses
export interface ModelInfo {
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

export interface OllamaHealthResponse {
  status: string;
  message: string;
  process_info?: {
    pid?: number;
    cpu_usage: number;
    memory_usage: number;
    is_sidecar: boolean;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface PullProgress {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
}

export interface StreamEvent {
  stream_id: string;
  content: string;
  full_content: string;
  done: boolean;
}

// Ollama Service Class
export class OllamaService {
  private static instance: OllamaService;
  
  public static getInstance(): OllamaService {
    if (!OllamaService.instance) {
      OllamaService.instance = new OllamaService();
    }
    return OllamaService.instance;
  }

  private constructor() {}

  // Get current endpoint from settings
  private getEndpoint(): string {
    return useSettingsStore.getState().ollama.endpoint;
  }

  // Get current default model from settings
  private getDefaultModel(): string {
    return useSettingsStore.getState().ollama.defaultModel;
  }

  // Health and Status
  async checkHealth(): Promise<OllamaHealthResponse> {
    try {
      return await invoke<OllamaHealthResponse>('ollama_health_check');
    } catch (error) {
      throw new Error(`Failed to check Ollama health: ${error}`);
    }
  }

  async getStatus(): Promise<OllamaHealthResponse> {
    try {
      return await invoke<OllamaHealthResponse>('ollama_get_status');
    } catch (error) {
      throw new Error(`Failed to get Ollama status: ${error}`);
    }
  }

  // Sidecar Management
  async startSidecar(): Promise<string> {
    try {
      return await invoke<string>('ollama_start_sidecar');
    } catch (error) {
      throw new Error(`Failed to start Ollama sidecar: ${error}`);
    }
  }

  async stopSidecar(): Promise<string> {
    try {
      return await invoke<string>('ollama_stop_sidecar');
    } catch (error) {
      throw new Error(`Failed to stop Ollama sidecar: ${error}`);
    }
  }

  // Model Management
  async listModels(): Promise<ModelInfo[]> {
    try {
      return await invoke<ModelInfo[]>('ollama_list_models');
    } catch (error) {
      throw new Error(`Failed to list models: ${error}`);
    }
  }

  async getModelInfo(modelName: string): Promise<any> {
    try {
      return await invoke('ollama_get_model_info', { modelName });
    } catch (error) {
      throw new Error(`Failed to get model info for ${modelName}: ${error}`);
    }
  }

  async deleteModel(modelName: string): Promise<string> {
    try {
      return await invoke<string>('ollama_delete_model', { modelName });
    } catch (error) {
      throw new Error(`Failed to delete model ${modelName}: ${error}`);
    }
  }

  async pullModel(
    modelName: string, 
    onProgress?: (progress: PullProgress) => void
  ): Promise<string> {
    try {
      // Set up progress listener if callback provided
      let unlisten: (() => void) | undefined;
      
      if (onProgress) {
        unlisten = await listen<PullProgress>('ollama_pull_progress', (event) => {
          onProgress(event.payload);
        });
      }

      const result = await invoke<string>('ollama_pull_model', { 
        model: modelName 
      });

      // Clean up listener
      if (unlisten) {
        unlisten();
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to pull model ${modelName}: ${error}`);
    }
  }

  // Chat Functions
  async chat(messages: ChatMessage[], model?: string): Promise<string> {
    try {
      const modelToUse = model || this.getDefaultModel();
      return await invoke<string>('ollama_chat', {
        messages,
        model: modelToUse
      });
    } catch (error) {
      throw new Error(`Failed to chat with model: ${error}`);
    }
  }

  async chatStream(
    messages: ChatMessage[],
    onStream: (event: StreamEvent) => void,
    model?: string
  ): Promise<string> {
    try {
      const modelToUse = model || this.getDefaultModel();
      const streamId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Set up stream listener
      const unlisten = await listen<StreamEvent>('ollama_chat_stream', (event) => {
        if (event.payload.stream_id === streamId) {
          onStream(event.payload);
        }
      });

      const result = await invoke<string>('ollama_chat_stream', {
        messages,
        model: modelToUse,
        streamId
      });

      // Clean up listener
      unlisten();

      return result;
    } catch (error) {
      throw new Error(`Failed to stream chat with model: ${error}`);
    }
  }

  async generate(prompt: string, model?: string): Promise<string> {
    try {
      const modelToUse = model || this.getDefaultModel();
      return await invoke<string>('ollama_generate', {
        prompt,
        model: modelToUse
      });
    } catch (error) {
      throw new Error(`Failed to generate with model: ${error}`);
    }
  }

  // Utility Functions
  async isAvailable(): Promise<boolean> {
    try {
      const health = await this.checkHealth();
      return health.status === 'healthy';
    } catch {
      return false;
    }
  }

  async ensureModelAvailable(modelName: string): Promise<boolean> {
    try {
      const models = await this.listModels();
      return models.some(model => model.name === modelName);
    } catch {
      return false;
    }
  }

  // Settings Integration
  async testConnection(endpoint?: string): Promise<boolean> {
    try {
      // If endpoint is provided, temporarily update settings to test
      if (endpoint) {
        const currentEndpoint = this.getEndpoint();
        useSettingsStore.getState().setOllamaEndpoint(endpoint);
        
        try {
          const health = await this.checkHealth();
          const isHealthy = health.status === 'healthy';
          
          // Restore original endpoint if test failed
          if (!isHealthy) {
            useSettingsStore.getState().setOllamaEndpoint(currentEndpoint);
          }
          
          return isHealthy;
        } catch {
          // Restore original endpoint on error
          useSettingsStore.getState().setOllamaEndpoint(currentEndpoint);
          return false;
        }
      } else {
        return await this.isAvailable();
      }
    } catch {
      return false;
    }
  }

  // Get current configuration from settings
  getConfig() {
    const settings = useSettingsStore.getState().ollama;
    return {
      endpoint: settings.endpoint,
      timeout: settings.timeout,
      maxRetries: settings.maxRetries,
      defaultModel: settings.defaultModel,
    };
  }
}

// Export singleton instance
export const ollamaService = OllamaService.getInstance();

// Export default
export default ollamaService; 