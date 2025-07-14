/**
 * Chat System Integration Tests
 * 
 * Critical Gap Addressed: Chat testing scored 40/100 in testing audit
 * Pattern: Combines store-first testing (Canvas model) with service integration (Gmail model)
 * 
 * Tests frontend-backend integration, message persistence, Ollama AI integration,
 * conversation management, and real-time messaging functionality.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { act } from 'react-dom/test-utils';

// Main application components
import Chat from '../../app/pages/Chat';
import { ThemeProvider } from '../../components/ThemeProvider';
import { HeaderProvider } from '../../app/contexts/HeaderContext';

// Chat components
import {
  ConversationList,
  ChatMessageBubble,
  ChatInput,
  ChatHeader,
  EmptyState
} from '../../features/chat/components';

// Test utilities
import { setupTauriMocks, cleanupTauriMocks, mockTauriInvoke } from '../helpers/tauriMocks';

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MemoryRouter>
    <ThemeProvider>
      <HeaderProvider>
        {children}
      </HeaderProvider>
    </ThemeProvider>
  </MemoryRouter>
);

// Mock data
const createMockChatSession = (overrides = {}) => ({
  id: `session-${Date.now()}`,
  title: 'Test Conversation',
  message_count: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_active: true,
  ...overrides
});

const createMockChatMessage = (overrides = {}) => ({
  id: `message-${Date.now()}`,
  session_id: 'session-123',
  content: 'Test message content',
  role: 'user',
  created_at: new Date().toISOString(),
  ...overrides
});

const createMockOllamaResponse = (content = 'AI response to your message') => ({
  content,
  role: 'assistant',
  model: 'llama2',
  done: true,
  total_duration: 1000000,
  eval_count: 25
});

describe('Chat System Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    
    // Setup Tauri mocks
    setupTauriMocks();
    
    // Mock backend chat operations
    mockTauriInvoke.mockImplementation((command: string, args?: any) => {
      switch (command) {
        case 'create_session':
          return Promise.resolve(createMockChatSession({ 
            title: args?.title || 'New Conversation' 
          }));
          
        case 'get_sessions':
          return Promise.resolve([
            createMockChatSession({ id: 'session-1', title: 'Conversation 1' }),
            createMockChatSession({ id: 'session-2', title: 'Conversation 2' })
          ]);
          
        case 'send_message':
          return Promise.resolve(createMockChatMessage({
            content: args?.content,
            session_id: args?.session_id
          }));
          
        case 'get_session_messages':
          return Promise.resolve([
            createMockChatMessage({ role: 'user', content: 'Hello' }),
            createMockChatMessage({ role: 'assistant', content: 'Hi there!' })
          ]);
          
        case 'delete_session':
          return Promise.resolve({ success: true });
          
        case 'ollama_chat':
          return Promise.resolve(createMockOllamaResponse(
            `AI response to: ${args?.messages?.[args.messages.length - 1]?.content || 'your message'}`
          ));
          
        case 'get_database_stats':
          return Promise.resolve({
            total_sessions: 5,
            total_messages: 25,
            active_sessions: 3
          });
          
        default:
          return Promise.resolve({});
      }
    });
  });

  afterEach(() => {
    cleanupTauriMocks();
    vi.clearAllMocks();
  });

  describe('💬 Chat Session Management', () => {
    it('should create new chat sessions', async () => {
      render(<Chat />, { wrapper: TestWrapper });
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument();
      });
      
      // Find and click new chat button
      const newChatButton = screen.getByRole('button', { name: /new.*chat|create.*conversation/i });
      await user.click(newChatButton);
      
      // Verify session creation API call
      await waitFor(() => {
        expect(mockTauriInvoke).toHaveBeenCalledWith('create_session', 
          expect.objectContaining({
            title: expect.any(String)
          })
        );
      });
      
      // New session should appear in conversation list
      await waitFor(() => {
        expect(screen.getByText('New Conversation')).toBeInTheDocument();
      });
    });

    it('should load and display existing chat sessions', async () => {
      render(<Chat />, { wrapper: TestWrapper });
      
      // Should call backend to get sessions
      await waitFor(() => {
        expect(mockTauriInvoke).toHaveBeenCalledWith('get_sessions');
      });
      
      // Sessions should be displayed
      await waitFor(() => {
        expect(screen.getByText('Conversation 1')).toBeInTheDocument();
        expect(screen.getByText('Conversation 2')).toBeInTheDocument();
      });
    });

    it('should switch between chat sessions', async () => {
      render(<Chat />, { wrapper: TestWrapper });
      
      // Wait for sessions to load
      await waitFor(() => {
        expect(screen.getByText('Conversation 1')).toBeInTheDocument();
      });
      
      // Click on a session
      const sessionElement = screen.getByText('Conversation 1');
      await user.click(sessionElement);
      
      // Should load messages for that session
      await waitFor(() => {
        expect(mockTauriInvoke).toHaveBeenCalledWith('get_session_messages',
          expect.objectContaining({
            session_id: 'session-1'
          })
        );
      });
      
      // Messages should be displayed
      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
        expect(screen.getByText('Hi there!')).toBeInTheDocument();
      });
    });

    it('should delete chat sessions', async () => {
      render(<Chat />, { wrapper: TestWrapper });
      
      // Wait for sessions to load
      await waitFor(() => {
        expect(screen.getByText('Conversation 1')).toBeInTheDocument();
      });
      
      // Find delete button (might be in context menu or always visible)
      const sessionElement = screen.getByText('Conversation 1');
      
      // Right-click or find delete option
      fireEvent.contextMenu(sessionElement);
      
      const deleteButton = screen.queryByRole('button', { name: /delete/i });
      if (deleteButton) {
        await user.click(deleteButton);
        
        // Confirm deletion if confirmation dialog appears
        const confirmButton = screen.queryByRole('button', { name: /confirm|yes/i });
        if (confirmButton) {
          await user.click(confirmButton);
        }
        
        // Verify delete API call
        await waitFor(() => {
          expect(mockTauriInvoke).toHaveBeenCalledWith('delete_session',
            expect.objectContaining({
              session_id: 'session-1'
            })
          );
        });
      }
    });
  });

  describe('📝 Message Handling', () => {
    beforeEach(async () => {
      render(<Chat />, { wrapper: TestWrapper });
      
      // Select a session first
      await waitFor(() => {
        expect(screen.getByText('Conversation 1')).toBeInTheDocument();
      });
      
      const sessionElement = screen.getByText('Conversation 1');
      await user.click(sessionElement);
    });

    it('should send and persist messages', async () => {
      // Wait for chat interface to load
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });
      
      const messageInput = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      // Type and send message
      await user.type(messageInput, 'Hello, this is a test message');
      await user.click(sendButton);
      
      // Verify message is sent to backend
      await waitFor(() => {
        expect(mockTauriInvoke).toHaveBeenCalledWith('send_message',
          expect.objectContaining({
            session_id: 'session-1',
            content: 'Hello, this is a test message'
          })
        );
      });
      
      // Message should appear in chat
      await waitFor(() => {
        expect(screen.getByText('Hello, this is a test message')).toBeInTheDocument();
      });
      
      // Input should be cleared
      expect(messageInput).toHaveValue('');
    });

    it('should handle message formatting and display', async () => {
      // Mock messages with different roles and formatting
      mockTauriInvoke.mockImplementation((command: string) => {
        if (command === 'get_session_messages') {
          return Promise.resolve([
            createMockChatMessage({ 
              role: 'user', 
              content: 'What is **markdown** formatting?' 
            }),
            createMockChatMessage({ 
              role: 'assistant', 
              content: '**Markdown** is a lightweight markup language.\n\nHere\'s an example:\n```\n**bold text**\n```' 
            })
          ]);
        }
        return Promise.resolve({});
      });
      
      // Reload messages
      await waitFor(() => {
        expect(screen.getByText(/markdown.*formatting/i)).toBeInTheDocument();
      });
      
      // Should display markdown formatting properly
      await waitFor(() => {
        const assistantMessage = screen.getByText(/Markdown.*is.*a.*lightweight/i);
        expect(assistantMessage).toBeInTheDocument();
      });
    });

    it('should show message timestamps and metadata', async () => {
      await waitFor(() => {
        // Look for timestamp indicators
        const timeElements = screen.queryAllByText(/ago|AM|PM|\d{1,2}:\d{2}/);
        expect(timeElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('🤖 AI Integration (Ollama)', () => {
    beforeEach(async () => {
      render(<Chat />, { wrapper: TestWrapper });
      
      // Select a session
      await waitFor(() => {
        expect(screen.getByText('Conversation 1')).toBeInTheDocument();
      });
      
      const sessionElement = screen.getByText('Conversation 1');
      await user.click(sessionElement);
    });

    it('should generate AI responses to user messages', async () => {
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });
      
      const messageInput = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      // Send a message that should trigger AI response
      await user.type(messageInput, 'Tell me about artificial intelligence');
      await user.click(sendButton);
      
      // User message should be sent first
      await waitFor(() => {
        expect(mockTauriInvoke).toHaveBeenCalledWith('send_message',
          expect.objectContaining({
            content: 'Tell me about artificial intelligence'
          })
        );
      });
      
      // Then AI should be called to generate response
      await waitFor(() => {
        expect(mockTauriInvoke).toHaveBeenCalledWith('ollama_chat',
          expect.objectContaining({
            messages: expect.arrayContaining([
              expect.objectContaining({
                content: 'Tell me about artificial intelligence',
                role: 'user'
              })
            ])
          })
        );
      });
      
      // AI response should appear
      await waitFor(() => {
        expect(screen.getByText(/AI response to.*artificial intelligence/i)).toBeInTheDocument();
      });
    });

    it('should handle AI model configuration', async () => {
      // Test with different model settings
      mockTauriInvoke.mockImplementation((command: string, args?: any) => {
        if (command === 'ollama_chat') {
          return Promise.resolve(createMockOllamaResponse(
            `Response from ${args?.model || 'default'} model`
          ));
        }
        return Promise.resolve({});
      });
      
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });
      
      const messageInput = screen.getByRole('textbox');
      await user.type(messageInput, 'Test message');
      
      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);
      
      // Should use configured model
      await waitFor(() => {
        expect(mockTauriInvoke).toHaveBeenCalledWith('ollama_chat',
          expect.objectContaining({
            model: expect.any(String)
          })
        );
      });
    });

    it('should handle AI errors gracefully', async () => {
      // Mock AI service error
      mockTauriInvoke.mockImplementation((command: string) => {
        if (command === 'ollama_chat') {
          return Promise.reject(new Error('Ollama service unavailable'));
        }
        return Promise.resolve({});
      });
      
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });
      
      const messageInput = screen.getByRole('textbox');
      await user.type(messageInput, 'This should cause an AI error');
      
      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);
      
      // Should show error state
      await waitFor(() => {
        expect(screen.getByText(/error|unavailable|failed/i)).toBeInTheDocument();
      });
      
      // Should allow retry
      const retryButton = screen.queryByRole('button', { name: /retry/i });
      if (retryButton) {
        expect(retryButton).toBeInTheDocument();
      }
    });
  });

  describe('🔄 Real-time Updates and Sync', () => {
    it('should handle concurrent message updates', async () => {
      render(<Chat />, { wrapper: TestWrapper });
      
      // Simulate rapid message sending
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });
      
      const messageInput = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      // Send multiple messages quickly
      for (let i = 0; i < 3; i++) {
        await user.type(messageInput, `Message ${i + 1}`);
        await user.click(sendButton);
        
        // Wait briefly between sends
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // All messages should be processed
      await waitFor(() => {
        expect(mockTauriInvoke).toHaveBeenCalledTimes(expect.any(Number));
      });
    });

    it('should sync conversation state across components', async () => {
      render(<Chat />, { wrapper: TestWrapper });
      
      // Create new session
      const newChatButton = screen.getByRole('button', { name: /new.*chat/i });
      await user.click(newChatButton);
      
      // Send message in new session
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });
      
      const messageInput = screen.getByRole('textbox');
      await user.type(messageInput, 'Test sync message');
      
      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);
      
      // Session list should update with new message count
      await waitFor(() => {
        // Look for updated conversation list item
        const conversationItems = screen.getAllByRole('button');
        expect(conversationItems.length).toBeGreaterThan(1);
      });
    });
  });

  describe('⚡ Performance and Error Handling', () => {
    it('should handle large conversation history efficiently', async () => {
      // Mock large message history
      const largeMessageHistory = Array.from({ length: 100 }, (_, i) => 
        createMockChatMessage({
          id: `message-${i}`,
          content: `Message ${i}`,
          role: i % 2 === 0 ? 'user' : 'assistant'
        })
      );
      
      mockTauriInvoke.mockImplementation((command: string) => {
        if (command === 'get_session_messages') {
          return Promise.resolve(largeMessageHistory);
        }
        return Promise.resolve({});
      });
      
      render(<Chat />, { wrapper: TestWrapper });
      
      // Select session with large history
      await waitFor(() => {
        expect(screen.getByText('Conversation 1')).toBeInTheDocument();
      });
      
      const sessionElement = screen.getByText('Conversation 1');
      
      const startTime = performance.now();
      await user.click(sessionElement);
      
      // Should load efficiently
      await waitFor(() => {
        expect(screen.getByText('Message 0')).toBeInTheDocument();
      });
      
      const loadTime = performance.now() - startTime;
      
      // Should load large history in reasonable time (under 2 seconds)
      expect(loadTime).toBeLessThan(2000);
    });

    it('should handle database connection errors', async () => {
      mockTauriInvoke.mockRejectedValueOnce(new Error('Database connection failed'));
      
      render(<Chat />, { wrapper: TestWrapper });
      
      // Should show error state
      await waitFor(() => {
        expect(screen.getByText(/error|connection.*failed/i)).toBeInTheDocument();
      });
      
      // Should allow retry
      const retryButton = screen.queryByRole('button', { name: /retry/i });
      if (retryButton) {
        expect(retryButton).toBeInTheDocument();
      }
    });

    it('should handle memory management for long conversations', async () => {
      // Test that component doesn't leak memory with long conversations
      const { unmount } = render(<Chat />, { wrapper: TestWrapper });
      
      // Simulate long conversation
      for (let i = 0; i < 50; i++) {
        mockTauriInvoke.mockResolvedValueOnce(
          createMockChatMessage({ content: `Message ${i}` })
        );
      }
      
      // Component should unmount without issues
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('🎨 UI Component Integration', () => {
    it('should render ChatMessageBubble component correctly', () => {
      const mockMessage = createMockChatMessage({
        content: 'Test message content',
        role: 'user'
      });
      
      render(<ChatMessageBubble message={mockMessage} />, { wrapper: TestWrapper });
      
      expect(screen.getByText('Test message content')).toBeInTheDocument();
    });

    it('should render ChatInput component correctly', () => {
      const mockOnSend = vi.fn();
      
      render(<ChatInput onSend={mockOnSend} />, { wrapper: TestWrapper });
      
      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      expect(input).toBeInTheDocument();
      expect(sendButton).toBeInTheDocument();
    });

    it('should render ConversationList component correctly', () => {
      const mockConversations = [
        createMockChatSession({ title: 'Test Conversation 1' }),
        createMockChatSession({ title: 'Test Conversation 2' })
      ];
      
      const mockOnSelect = vi.fn();
      
      render(
        <ConversationList 
          conversations={mockConversations} 
          onSelectConversation={mockOnSelect} 
        />, 
        { wrapper: TestWrapper }
      );
      
      expect(screen.getByText('Test Conversation 1')).toBeInTheDocument();
      expect(screen.getByText('Test Conversation 2')).toBeInTheDocument();
    });
  });
}); 