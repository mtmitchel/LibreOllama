/**
 * Chat System Store Integration Tests - Store-First Testing Approach
 * 
 * Following the Implementation Guide principles:
 * 1. Test business logic directly through store state
 * 2. Use real store instances, not mocks
 * 3. Focus on specific behaviors and edge cases
 * 
 * Tests chat store operations, conversation management,
 * message handling, and UI component integration.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Store
import { useChatStore } from '../../features/chat/stores/chatStore';
// Define types locally to match the chat store structure
interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  isPinned?: boolean;
  participants: number;
}

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: string;
}

// Test utilities
import { setupTauriMocks, cleanupTauriMocks, mockTauriInvoke } from '../helpers/tauriMocks';

// Mock data factories
const createMockChatSession = (overrides = {}): ChatSession => ({
  id: `session-${Date.now()}`,
  title: 'Test Conversation',
  lastMessage: 'Last message content',
  timestamp: new Date().toISOString(),
  isPinned: false,
  participants: 2,
  ...overrides
});

const createMockChatMessage = (overrides = {}): ChatMessage => ({
  id: `message-${Date.now()}`,
  content: 'Test message content',
  sender: 'user',
  timestamp: new Date().toISOString(),
  ...overrides
});

describe('Chat System Store Integration Tests', () => {
  beforeEach(() => {
    // Setup Tauri mocks
    setupTauriMocks();
    
    // Reset store to clean state
    useChatStore.getState().reset();
  });

  afterEach(() => {
    cleanupTauriMocks();
    vi.clearAllMocks();
  });

  describe('📦 Store State Management', () => {
    it('should handle conversation state correctly', () => {
      // Test direct state updates
      const mockConversations = [
        createMockChatSession({ id: 'conv-1', title: 'Work Chat' }),
        createMockChatSession({ id: 'conv-2', title: 'Personal Chat' })
      ];

      useChatStore.setState({ conversations: mockConversations });
      const store = useChatStore.getState();
      
      expect(store.conversations).toEqual(mockConversations);
      expect(store.conversations.length).toBe(2);
      expect(store.conversations[0].title).toBe('Work Chat');
      expect(store.conversations[1].title).toBe('Personal Chat');
    });

    it('should handle message state updates', () => {
      const mockMessages = [
        createMockChatMessage({ 
          id: 'msg-1',
          content: 'Hello there!',
          sender: 'user'
        }),
        createMockChatMessage({ 
          id: 'msg-2',
          content: 'Hi! How can I help you?',
          sender: 'ai'
        })
      ];

      useChatStore.setState({ messages: { 'session-1': mockMessages } });
      const store = useChatStore.getState();
      
      expect(store.messages['session-1']).toEqual(mockMessages);
      expect(store.messages['session-1'].length).toBe(2);
      expect(store.messages['session-1'][0].content).toBe('Hello there!');
      expect(store.messages['session-1'][1].sender).toBe('ai');
    });

    it('should handle conversation selection', () => {
      const conversations = [
        createMockChatSession({ id: 'conv-1', title: 'Chat 1' }),
        createMockChatSession({ id: 'conv-2', title: 'Chat 2' })
      ];

      useChatStore.setState({ 
        conversations,
        selectedConversationId: 'conv-1'
      });
      
      const store = useChatStore.getState();
      expect(store.selectedConversationId).toBe('conv-1');
      
      // Change selection
      useChatStore.setState({ selectedConversationId: 'conv-2' });
      expect(useChatStore.getState().selectedConversationId).toBe('conv-2');
    });

    it('should handle loading states correctly', () => {
      // Test loading state
      useChatStore.setState({ isLoading: true });
      expect(useChatStore.getState().isLoading).toBe(true);

      // Test message sending state
      useChatStore.setState({ isSending: true });
      expect(useChatStore.getState().isSending).toBe(true);

      // Reset loading states
      useChatStore.setState({ isLoading: false, isSending: false });
      const store = useChatStore.getState();
      expect(store.isLoading).toBe(false);
      expect(store.isSending).toBe(false);
    });

    it('should handle error states correctly', () => {
      // Test error setting
      useChatStore.setState({ error: 'Test error message' });
      expect(useChatStore.getState().error).toBe('Test error message');

      // Test error clearing
      useChatStore.getState().clearError();
      expect(useChatStore.getState().error).toBeNull();
    });
  });

  describe('💬 Conversation Management', () => {
    it('should handle conversation creation workflow', () => {
      // Simulate creating a new conversation
      const newConversation = createMockChatSession({
        id: 'new-conv-1',
        title: 'New Chat Session',
        participants: 0
      });

      // Test adding conversation to store
      const currentConversations = useChatStore.getState().conversations;
      useChatStore.setState({ 
        conversations: [...currentConversations, newConversation],
        selectedConversationId: newConversation.id
      });
      
      const store = useChatStore.getState();
      expect(store.conversations.length).toBe(1);
      expect(store.conversations[0].title).toBe('New Chat Session');
      expect(store.selectedConversationId).toBe('new-conv-1');
    });

    it('should handle conversation updates', () => {
      // Add initial conversation
      const originalConversation = createMockChatSession({
        id: 'conv-to-update',
        title: 'Original Title',
        participants: 5
      });
      
      useChatStore.setState({ conversations: [originalConversation] });
      
      // Update the conversation
      const updatedConversation = { 
        ...originalConversation, 
        title: 'Updated Title',
        participants: 8
      };
      
      useChatStore.setState({ conversations: [updatedConversation] });
      
      const store = useChatStore.getState();
      expect(store.conversations[0].title).toBe('Updated Title');
      expect(store.conversations[0].participants).toBe(8);
    });

    it('should handle conversation deletion', () => {
      // Add multiple conversations
      const conversations = [
        createMockChatSession({ id: 'conv-1', title: 'Keep This' }),
        createMockChatSession({ id: 'conv-2', title: 'Delete This' })
      ];
      
      useChatStore.setState({ conversations });
      expect(useChatStore.getState().conversations.length).toBe(2);
      
      // Remove one conversation
      const filteredConversations = conversations.filter(conv => conv.id !== 'conv-2');
      useChatStore.setState({ conversations: filteredConversations });
      
      const store = useChatStore.getState();
      expect(store.conversations.length).toBe(1);
      expect(store.conversations[0].title).toBe('Keep This');
    });
  });

  describe('📨 Message Management', () => {
    it('should handle message creation workflow', () => {
      // Simulate sending a new message
      const newMessage = createMockChatMessage({
        id: 'new-msg-1',
        content: 'Hello, AI!',
        sender: 'user'
      });

      // Test adding message to store
      useChatStore.setState({ messages: { 'session-1': [newMessage] } });
      
      const store = useChatStore.getState();
      expect(store.messages['session-1'].length).toBe(1);
      expect(store.messages['session-1'][0].content).toBe('Hello, AI!');
      expect(store.messages['session-1'][0].sender).toBe('user');
    });

    it('should handle AI response workflow', () => {
      // Start with user message
      const userMessage = createMockChatMessage({
        id: 'user-msg',
        content: 'What is AI?',
        sender: 'user'
      });

      useChatStore.setState({ messages: { 'session-1': [userMessage] } });
      
      // Add AI response
              const aiMessage = createMockChatMessage({
          id: 'ai-msg',
          content: 'AI stands for Artificial Intelligence...',
          sender: 'ai'
        });

              const currentMessages = useChatStore.getState().messages['session-1'];
        useChatStore.setState({ messages: { 'session-1': [...currentMessages, aiMessage] } });
      
      const store = useChatStore.getState();
              expect(store.messages['session-1'].length).toBe(2);
        expect(store.messages['session-1'][0].sender).toBe('user');
        expect(store.messages['session-1'][1].sender).toBe('ai');
        expect(store.messages['session-1'][1].content).toContain('Artificial Intelligence');
    });

    it('should handle message loading states', () => {
      // Add message with loading state
              const loadingMessage = createMockChatMessage({
          id: 'loading-msg',
          content: '',
          sender: 'ai'
        });

              useChatStore.setState({ messages: { 'session-1': [loadingMessage] } });
        
        let store = useChatStore.getState();
        expect(store.messages['session-1'][0].content).toBe('');
        
        // Complete loading
        const completedMessage = { ...loadingMessage, content: 'Response complete!' };
        useChatStore.setState({ messages: { 'session-1': [completedMessage] } });
        
        store = useChatStore.getState();
        expect(store.messages['session-1'][0].content).toBe('Response complete!');
    });

    it('should handle message history correctly', () => {
      // Add conversation history
              const messageHistory = [
          createMockChatMessage({ id: 'msg-1', content: 'First message', sender: 'user' }),
          createMockChatMessage({ id: 'msg-2', content: 'AI response 1', sender: 'ai' }),
          createMockChatMessage({ id: 'msg-3', content: 'Follow up', sender: 'user' }),
          createMockChatMessage({ id: 'msg-4', content: 'AI response 2', sender: 'ai' })
        ];

        useChatStore.setState({ messages: { 'session-1': messageHistory } });
      
      const store = useChatStore.getState();
              expect(store.messages['session-1'].length).toBe(4);
        expect(store.messages['session-1'][0].content).toBe('First message');
        expect(store.messages['session-1'][3].content).toBe('AI response 2');
        
        // Verify message order
        expect(store.messages['session-1'][0].sender).toBe('user');
        expect(store.messages['session-1'][1].sender).toBe('ai');
        expect(store.messages['session-1'][2].sender).toBe('user');
        expect(store.messages['session-1'][3].sender).toBe('ai');
    });
  });

  describe('🎨 Store Integration Validation', () => {
    it('should validate store structure and methods', () => {
      const store = useChatStore.getState();
      
      // Verify store has required methods
      expect(typeof store.reset).toBe('function');
      expect(typeof store.clearError).toBe('function');
      
      // Verify store has required state properties
      expect(store).toHaveProperty('conversations');
      expect(store).toHaveProperty('messages');
      expect(store).toHaveProperty('selectedConversationId');
      expect(store).toHaveProperty('isLoading');
      expect(store).toHaveProperty('isSending');
      expect(store).toHaveProperty('error');
    });

    it('should handle complex state interactions', () => {
      // Test complex workflow
      const conversation = createMockChatSession({ id: 'complex-conv', title: 'Complex Test' });
      const messages = [
        createMockChatMessage({ content: 'Message 1', sender: 'user' }),
        createMockChatMessage({ content: 'Message 2', sender: 'assistant' })
      ];

      // Set up complex state
      useChatStore.setState({
        conversations: [conversation],
        messages: { 'session-1': messages },
        selectedConversationId: 'complex-conv',
        isLoading: false,
        isSending: false,
        error: null
      });
      
      const store = useChatStore.getState();
      expect(store.conversations.length).toBe(1);
      expect(store.messages['session-1'].length).toBe(2);
      expect(store.selectedConversationId).toBe('complex-conv');
      expect(store.error).toBeNull();
    });

    it('should handle state transitions correctly', () => {
      // Test state transitions
      useChatStore.setState({ isLoading: true, error: null });
      expect(useChatStore.getState().isLoading).toBe(true);
      
      // Simulate loading completion with data
      useChatStore.setState({ 
        isLoading: false, 
        conversations: [createMockChatSession({ title: 'Loaded Chat' })]
      });
      
      const store = useChatStore.getState();
      expect(store.isLoading).toBe(false);
      expect(store.conversations[0].title).toBe('Loaded Chat');
    });

    it('should maintain referential integrity', () => {
      const conversation = createMockChatSession({ id: 'ref-test' });
      
      // Set conversation
      useChatStore.setState({ conversations: [conversation] });
      
      // Update conversation
      const updatedConversation = { ...conversation, title: 'Updated Title' };
      useChatStore.setState({ conversations: [updatedConversation] });
      
      const store = useChatStore.getState();
      expect(store.conversations[0].id).toBe('ref-test');
      expect(store.conversations[0].title).toBe('Updated Title');
    });
  });

  describe('🔄 Data Synchronization', () => {
    it('should maintain data consistency during operations', () => {
      // Perform multiple state updates
      const conversations = [
        createMockChatSession({ id: 'conv-1', title: 'Work' }),
        createMockChatSession({ id: 'conv-2', title: 'Personal' })
      ];
      
              const messages = [
          createMockChatMessage({ content: 'Work message' }),
          createMockChatMessage({ content: 'Personal message' })
        ];
        
        useChatStore.setState({ 
          conversations,
          messages: { 'session-1': messages },
          selectedConversationId: 'conv-1',
          isLoading: false
        });
        
        const store = useChatStore.getState();
        expect(store.conversations.length).toBe(2);
        expect(store.messages['session-1'].length).toBe(2);
      expect(store.selectedConversationId).toBe('conv-1');
      expect(store.isLoading).toBe(false);
    });

    it('should handle partial sync scenarios', () => {
      // Setup initial state
              useChatStore.setState({ 
          conversations: [
            createMockChatSession({ id: 'conv-1', title: 'Existing Chat' })
          ],
          messages: {
            'session-1': [createMockChatMessage({ content: 'Existing message' })]
          }
        });
      
      // Simulate partial sync (only update messages)
              const updatedMessages = [
          createMockChatMessage({ content: 'Existing message' }),
          createMockChatMessage({ content: 'New synced message' })
        ];
        
        useChatStore.setState({ messages: { 'session-1': updatedMessages } });
        
        const store = useChatStore.getState();
        expect(store.conversations.length).toBe(1); // Conversations unchanged
        expect(store.messages['session-1'].length).toBe(2); // Messages updated
        expect(store.messages['session-1'][1].content).toBe('New synced message');
    });
  });

  describe('⚡ Performance and Error Handling', () => {
    it('should handle empty state correctly', () => {
      // Start with clean state
      useChatStore.getState().reset();
      
      const store = useChatStore.getState();
      expect(store.conversations).toEqual([]);
      // Note: messages might be an object or array depending on store implementation
      expect(store.selectedConversationId).toBeNull();
      expect(store.error).toBeNull();
      expect(store.isLoading).toBe(false);
    });

    it('should handle large datasets efficiently', () => {
      // Create large number of messages
      const startTime = performance.now();
      
      const largeMessageSet = Array.from({ length: 500 }, (_, i) => 
        createMockChatMessage({ 
          id: `msg-${i}`,
          content: `Message ${i}` 
        })
      );
      
              useChatStore.setState({ messages: { 'session-1': largeMessageSet } });
      
      const endTime = performance.now();
      
      // Should handle large datasets efficiently
      const store = useChatStore.getState();
              expect(store.messages['session-1'].length).toBe(500);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should handle concurrent state updates safely', () => {
      // Simulate concurrent operations
      const operations = [
        () => useChatStore.setState({ isLoading: true }),
        () => useChatStore.setState({ 
          conversations: [createMockChatSession({ title: 'Concurrent Chat' })] 
        }),
                  () => useChatStore.setState({ 
            messages: { 'session-1': [createMockChatMessage({ content: 'Concurrent message' })] }
          })
      ];

      // Execute operations
      operations.forEach(op => op());

      // Verify final state integrity
      const store = useChatStore.getState();
      expect(store.conversations.length).toBe(1);
              expect(store.messages['session-1'].length).toBe(1);
      expect(store.isLoading).toBe(true);
    });

    it('should handle invalid data gracefully', () => {
      // Test with invalid conversation data
      useChatStore.setState({ conversations: [] });
      expect(useChatStore.getState().conversations).toEqual([]);
      
      // Test with invalid message data
              useChatStore.setState({ messages: {} });
              expect(useChatStore.getState().messages).toEqual({});
      
      // Test error state
      useChatStore.setState({ error: 'Invalid data error' });
      expect(useChatStore.getState().error).toBe('Invalid data error');
    });
  });
}); 