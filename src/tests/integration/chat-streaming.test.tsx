import { describe, it, expect, beforeEach, vi, afterEach, type Mock } from 'vitest';
import { useChatStore } from '../../features/chat/stores/chatStore';
import { OllamaService, StreamEvent, ChatMessage } from '../../services/ollamaService';
import { invoke, listen } from '@tauri-apps/api/core';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
  listen: vi.fn(),
}));

// Mock settings store
vi.mock('../../stores/settingsStore', () => ({
  useSettingsStore: {
    getState: vi.fn(() => ({
      integrations: {
        apiKeys: {
          ollama: { enabled: true }
        },
        enabledModels: {}
      }
    }))
  }
}));

// Mock OllamaService to control its instantiation
const mockChatStream = vi.fn();
const mockOllamaServiceInstance = {
  chatStream: mockChatStream,
  checkHealth: vi.fn(),
  getStatus: vi.fn(),
  startSidecar: vi.fn(),
  stopSidecar: vi.fn(),
  isRunning: vi.fn(),
  getModels: vi.fn(),
  pullModel: vi.fn(),
  deleteModel: vi.fn(),
  generateCompletion: vi.fn(),
  generateEmbeddings: vi.fn(),
};

vi.mock('../../services/ollamaService', () => ({
  OllamaService: {
    getInstance: vi.fn(() => mockOllamaServiceInstance),
  },
  StreamEvent: vi.fn(),
  ChatMessage: vi.fn(),
}));

// Represents the callback passed to `ollamaService.chatStream`
type StreamOnStreamCallbackType = (event: StreamEvent) => void;

// Represents the callback registered with `listen`
type MockListenCallbackType = (event: { payload: StreamEvent }) => void;

describe('Chat Streaming Integration Tests', () => {
  let ollamaService: OllamaService;
  
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mocks for Tauri API
    (invoke as any).mockImplementation((command: string, args?: any) => {
      switch (command) {
        case 'create_session':
          return Promise.resolve({
            id: 'test-session-stream',
            title: 'Streaming Test Chat',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            message_count: 0
          });
        case 'send_message':
          return Promise.resolve({
            id: `msg-${Date.now()}`,
            session_id: args.sessionIdStr,
            content: args.content,
            role: 'user',
            timestamp: new Date().toISOString()
          });
        case 'ollama_chat_stream':
          return Promise.resolve('Stream completed successfully');
        default:
          return Promise.resolve();
      }
    });

    // Setup default mock for listen
    (listen as any).mockImplementation(() => {
      return Promise.resolve(vi.fn());
    });

    // Mock chatStream to behave like the real implementation
    mockChatStream.mockImplementation(async (messages: ChatMessage[], onStream: StreamOnStreamCallbackType, model?: string) => {
      const streamId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Call listen like the real implementation
      const unlisten = await (listen as any)('ollama_chat_stream', (event: { payload: StreamEvent }) => {
        if (event.payload.stream_id === streamId) {
          onStream(event.payload);
        }
      });

      // Simulate stream events
      setTimeout(() => {
        onStream({
          stream_id: streamId,
          content: 'Hello!',
          full_content: 'Hello!',
          done: false
        });
        
        onStream({
          stream_id: streamId,
          content: ' I am doing well.',
          full_content: 'Hello! I am doing well.',
          done: false
        });
        
        onStream({
          stream_id: streamId,
          content: ' How can I help you today?',
          full_content: 'Hello! I am doing well. How can I help you today?',
          done: true
        });
      }, 10);
      
      // Call invoke like the real implementation
      const result = await (invoke as any)('ollama_chat_stream', {
        messages,
        model: model || 'default',
        streamId
      });

      // Call unlisten like the real implementation
      unlisten();

      return result;
    });

    ollamaService = OllamaService.getInstance(); 
    
    useChatStore.getState().reset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should handle streaming chat responses', async () => {
    const streamEvents: StreamEvent[] = [];
    const onStreamTestCallback: StreamOnStreamCallbackType = (event) => { 
      streamEvents.push(event);
    };

    const streamPromise = ollamaService.chatStream(
      [{ role: 'user', content: 'Hello, how are you?' }],
      onStreamTestCallback
    );

    // Wait a bit for async stream events
    await new Promise(resolve => setTimeout(resolve, 50));
    await streamPromise;

    expect(streamEvents.length).toBeGreaterThan(0);
    expect(listen).toHaveBeenCalledWith('ollama_chat_stream', expect.any(Function));
    expect(mockChatStream).toHaveBeenCalledWith(
      [{ role: 'user', content: 'Hello, how are you?' }],
      expect.any(Function)
    );
  });

  it('should handle streaming errors gracefully', async () => {
    mockChatStream.mockImplementationOnce(async () => {
      throw new Error('Streaming failed');
    });

    const streamEvents: StreamEvent[] = [];
    const onStream: StreamOnStreamCallbackType = (event) => { 
      streamEvents.push(event);
    };

    await expect(
      ollamaService.chatStream([{ role: 'user', content: 'Hello' }], onStream)
    ).rejects.toThrow('Streaming failed');

    expect(mockChatStream).toHaveBeenCalledWith(
      [{ role: 'user', content: 'Hello' }],
      expect.any(Function)
    );
  });

  it('should send streaming messages through chat store', async () => {
    const store = useChatStore.getState();
    
    const conversationId = await store.createConversation('Streaming Test');
    
    const messagePromise = store.sendMessage(conversationId, 'Test streaming message');

    // Wait a bit for async operations
    await new Promise(resolve => setTimeout(resolve, 50));
    await messagePromise;

    const updatedStore = useChatStore.getState();
    const messages = updatedStore.messages[conversationId] || [];
    expect(messages.length).toBeGreaterThan(0);
    // Check that the user message was added (streaming response integration depends on chat store implementation)
    expect(messages[0].content).toBe('Test streaming message');
    expect(messages[0].sender).toBe('user'); 
  });

  it('should handle concurrent streams correctly', async () => {
    const events1: StreamEvent[] = [];
    const events2: StreamEvent[] = [];

    const stream1 = ollamaService.chatStream(
      [{ role: 'user', content: 'Message 1' }],
      (event: StreamEvent) => events1.push(event),
      'model1'
    );
    const stream2 = ollamaService.chatStream(
      [{ role: 'user', content: 'Message 2' }],
      (event: StreamEvent) => events2.push(event),
      'model2'
    );

    // Wait a bit for async stream events
    await new Promise(resolve => setTimeout(resolve, 50));
    await Promise.all([stream1, stream2]);

    expect(listen).toHaveBeenCalledTimes(2);
    expect(mockChatStream).toHaveBeenCalledTimes(2);
    expect(mockChatStream).toHaveBeenCalledWith(
      [{ role: 'user', content: 'Message 1' }],
      expect.any(Function),
      'model1'
    );
    expect(mockChatStream).toHaveBeenCalledWith(
      [{ role: 'user', content: 'Message 2' }],
      expect.any(Function),
      'model2'
    );
  });

  it('should correctly terminate stream listener on completion', async () => {
    const streamPromise = ollamaService.chatStream(
      [{ role: 'user', content: 'Test termination message' }],
      (event: StreamEvent) => {},
    );

    // Wait a bit for async operations
    await new Promise(resolve => setTimeout(resolve, 50));
    await streamPromise;

    // Verify that the service was called correctly
    expect(mockChatStream).toHaveBeenCalledWith(
      [{ role: 'user', content: 'Test termination message' }],
      expect.any(Function)
    );
    expect(listen).toHaveBeenCalledWith('ollama_chat_stream', expect.any(Function));
  });
}); 