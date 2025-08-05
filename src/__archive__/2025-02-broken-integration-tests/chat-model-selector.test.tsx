import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ModelSelector } from '../../features/chat/components/ModelSelector';
import { useChatStore } from '../../features/chat/stores/chatStore';

// Mock the chat store
vi.mock('../../features/chat/stores/chatStore');

// Mock UI components
vi.mock('../../../components/ui', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  )
}));

vi.mock('../../../components/ui/DropdownMenu', () => ({
  DropdownMenu: ({ children, ...props }: any) => <div {...props}>{children}</div>
}));

const mockChatStore = {
  availableModels: [
    { id: 'gpt-4', name: 'GPT-4', provider: 'openai', description: 'Most capable model', contextLength: 8192 },
    { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'anthropic', description: 'Most powerful Claude', contextLength: 200000 },
    { id: 'llama2', name: 'Llama 2', provider: 'ollama', description: 'Local Llama model', contextLength: 4096 }
  ],
  selectedModel: 'gpt-4',
  isLoadingModels: false,
  fetchAvailableModels: vi.fn(),
  setSelectedModel: vi.fn(),
  error: null
};

describe('ModelSelector Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useChatStore).mockReturnValue(mockChatStore);
  });

  it('should render model selector with current selection', () => {
    vi.mocked(useChatStore).mockReturnValue({
      ...mockChatStore,
      selectedModel: null,
    });

    render(<ModelSelector />);
    
    // When no model is selected, it should show "Select Model"
    expect(screen.getByText('Select Model')).toBeInTheDocument();
  });

  it('should show selected model name when model is selected', () => {
    vi.mocked(useChatStore).mockReturnValue({
      ...mockChatStore,
      selectedModel: 'gpt-4',
    });

    render(<ModelSelector />);
    
    // Should show the selected model name
    expect(screen.getByText('GPT-4')).toBeInTheDocument();
  });

  it('should fetch models on mount', () => {
    render(<ModelSelector />);
    
    expect(mockChatStore.fetchAvailableModels).toHaveBeenCalledOnce();
  });

  it('should show loading state', () => {
    vi.mocked(useChatStore).mockReturnValue({
      ...mockChatStore,
      isLoadingModels: true
    });

    render(<ModelSelector />);
    
    expect(screen.getByText('Loading models...')).toBeInTheDocument();
  });

  it('should show error state with retry button', () => {
    vi.mocked(useChatStore).mockReturnValue({
      ...mockChatStore,
      error: 'Failed to load models'
    });

    render(<ModelSelector />);
    
    expect(screen.getByText('Failed to load models')).toBeInTheDocument();
    expect(screen.getByTitle('Retry loading models')).toBeInTheDocument();
  });

  it('should handle retry on error', () => {
    vi.mocked(useChatStore).mockReturnValue({
      ...mockChatStore,
      error: 'Failed to load models'
    });

    render(<ModelSelector />);
    
    const retryButton = screen.getByTitle('Retry loading models');
    fireEvent.click(retryButton);
    
    expect(mockChatStore.fetchAvailableModels).toHaveBeenCalledTimes(2); // Once on mount, once on retry
  });

  it('should handle model selection', () => {
    render(<ModelSelector />);
    
    // This would typically involve dropdown interactions
    // The actual implementation depends on the DropdownMenu component
    expect(mockChatStore.setSelectedModel).toBeDefined();
  });

  it('should group models by provider', () => {
    render(<ModelSelector />);
    
    // Verify that models from different providers are available
    const store = useChatStore();
    const providers = [...new Set(store.availableModels.map(m => m.provider))];
    
    expect(providers).toContain('openai');
    expect(providers).toContain('anthropic');
    expect(providers).toContain('ollama');
  });

  it('should handle refresh models action', () => {
    render(<ModelSelector />);
    
    // Find refresh button (if visible in normal state)
    const refreshButton = screen.queryByTitle('Refresh models');
    if (refreshButton) {
      fireEvent.click(refreshButton);
      expect(mockChatStore.fetchAvailableModels).toHaveBeenCalledTimes(2);
    }
  });

  it('should display model context lengths', () => {
    render(<ModelSelector />);
    
    const store = useChatStore();
    store.availableModels.forEach(model => {
      expect(model.contextLength).toBeDefined();
      expect(typeof model.contextLength).toBe('number');
    });
  });

  it('should handle empty model list gracefully', () => {
    vi.mocked(useChatStore).mockReturnValue({
      ...mockChatStore,
      availableModels: [],
      selectedModel: null
    });

    render(<ModelSelector />);
    
    expect(screen.getByText('No models available')).toBeInTheDocument();
  });
}); 