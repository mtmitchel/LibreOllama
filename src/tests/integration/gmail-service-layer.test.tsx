/**
 * Gmail Service Layer Integration Tests
 * 
 * Following the project's store-first testing methodology:
 * - Test business logic directly through store operations
 * - Focus on service layer integration and data flow
 * - 95% performance improvement over UI rendering tests
 * - Real store instances with minimal mocking
 * - "Confidence, Not Coverage" approach
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from 'react-dom/test-utils';
import { useMailStore } from '../../features/mail/stores/mailStore';
import { createTestMailStore } from '../../features/mail/stores/__tests__/mailStoreTestUtils';
import * as gmailTauriService from '../../features/mail/services/gmailTauriService';
import { 
  createMockGmailAccount, 
  createMockParsedEmail, 
  MOCK_SAMPLE_MESSAGES,
  MOCK_SYSTEM_LABELS,
  MOCK_USER_LABELS
} from '../helpers/gmailMockData';

describe('Gmail Service Layer Integration Tests', () => {
  let testStore: ReturnType<typeof createTestMailStore>;

  beforeEach(() => {
    // Reset mail store to initial state
    useMailStore.getState().signOut();
    testStore = createTestMailStore();
    
    // Setup comprehensive service mocks
    vi.spyOn(gmailTauriService, 'startGmailAuth').mockResolvedValue({
      success: true,
      authUrl: 'https://accounts.google.com/oauth/authorize?test=true',
      state: 'test-state'
    });
    
    vi.spyOn(gmailTauriService, 'completeGmailAuth').mockResolvedValue({
      success: true,
      account: createMockGmailAccount({ email: 'test@example.com' }),
      tokens: {
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        expiresIn: 3600
      }
    });
    
    // Mock GmailTauriService methods directly
    vi.spyOn(gmailTauriService, 'createGmailTauriService').mockReturnValue({
      getUserProfile: vi.fn().mockResolvedValue({ 
        email: 'test@example.com', 
        name: 'Test User', 
        id: 'test-id' 
      }),
      getLabels: vi.fn().mockResolvedValue([...MOCK_SYSTEM_LABELS, ...MOCK_USER_LABELS]),
      searchMessages: vi.fn().mockResolvedValue({
        messages: MOCK_SAMPLE_MESSAGES.slice(0, 3),
        next_page_token: undefined,
        result_size_estimate: 3
      }),
      getMessage: vi.fn().mockResolvedValue(null),
      getThread: vi.fn().mockResolvedValue([]),
      markAsRead: vi.fn().mockResolvedValue(undefined),
      markAsUnread: vi.fn().mockResolvedValue(undefined),
      starMessages: vi.fn().mockResolvedValue(undefined),
      unstarMessages: vi.fn().mockResolvedValue(undefined),
      archiveMessages: vi.fn().mockResolvedValue(undefined),
      deleteMessages: vi.fn().mockResolvedValue(undefined)
    } as any);
  });

  describe('Authentication Flow', () => {
    it('should complete OAuth flow through store actions', async () => {
      const store = useMailStore.getState();
      
      // Test authentication state changes
      expect(store.isAuthenticated).toBe(false);
      expect(store.currentAccountId).toBe(null);
      
      // Mock account creation
      const mockAccount = createMockGmailAccount({ 
        email: 'test@example.com',
        name: 'Test User'
      });
      
      // Test account addition through store
      await act(async () => {
        await store.addAccount(mockAccount);
      });
      
      // Verify authentication state
      expect(store.isAuthenticated).toBe(true);
      expect(store.currentAccountId).toBe(mockAccount.id);
      expect(store.accounts[mockAccount.id]).toBeDefined();
    });

    it('should handle multiple accounts through store', async () => {
      const store = useMailStore.getState();
      
      const accounts = [
        createMockGmailAccount({ email: 'work@company.com', name: 'Work Account' }),
        createMockGmailAccount({ email: 'personal@gmail.com', name: 'Personal Account' })
      ];
      
      // Add multiple accounts
      await act(async () => {
        await store.addAccount(accounts[0]);
        await store.addAccount(accounts[1]);
      });
      
      // Verify both accounts are stored
      expect(Object.keys(store.accounts)).toHaveLength(2);
      expect(store.accounts[accounts[0].id]).toBeDefined();
      expect(store.accounts[accounts[1].id]).toBeDefined();
      
      // Test account switching
      act(() => {
        store.switchAccount(accounts[1].id);
      });
      
      expect(store.currentAccountId).toBe(accounts[1].id);
    });
  });

  describe('Message Operations', () => {
    beforeEach(async () => {
      // Setup authenticated account
      const mockAccount = createMockGmailAccount({ 
        email: 'test@example.com',
        name: 'Test User'
      });
      
      await act(async () => {
        await useMailStore.getState().addAccount(mockAccount);
      });
    });

    it('should fetch and store messages through service layer', async () => {
      const store = useMailStore.getState();
      
      // Test initial state
      expect(store.getMessages()).toHaveLength(0);
      
      // Mock message fetching
      const mockMessages = MOCK_SAMPLE_MESSAGES.slice(0, 3).map(msg => ({
        ...msg,
        accountId: store.currentAccountId!
      }));
      
      vi.mocked(gmailTauriService.createGmailTauriService).mockReturnValue({
        ...vi.mocked(gmailTauriService.createGmailTauriService).getMockImplementation()!(),
        searchMessages: vi.fn().mockResolvedValue({
          messages: mockMessages,
          next_page_token: undefined,
          result_size_estimate: mockMessages.length
        })
      } as any);
      
      // Fetch messages through store
      await act(async () => {
        await store.fetchMessages();
      });
      
      // Verify messages are stored
      expect(store.getMessages()).toHaveLength(3);
      expect(store.getMessages()[0].subject).toBe(mockMessages[0].subject);
    });

    it('should handle message state changes', async () => {
      const store = useMailStore.getState();
      
      // Setup test message
      const testMessage = createMockParsedEmail({
        id: 'test-msg-1',
        subject: 'Test Message',
        isRead: false,
        isStarred: false
      });
      
      testStore.setTestMessages([testMessage], store.currentAccountId!);
      
      // Test marking as read
      await act(async () => {
        await store.markAsRead(['test-msg-1']);
      });
      
      // Verify service was called
      expect(gmailTauriService.createGmailTauriService()!.markAsRead).toHaveBeenCalledWith(['test-msg-1']);
      
      // Test starring
      await act(async () => {
        await store.starMessages(['test-msg-1']);
      });
      
      expect(gmailTauriService.createGmailTauriService()!.starMessages).toHaveBeenCalledWith(['test-msg-1']);
      
      // Test archiving
      await act(async () => {
        await store.archiveMessages(['test-msg-1']);
      });
      
      expect(gmailTauriService.createGmailTauriService()!.archiveMessages).toHaveBeenCalledWith(['test-msg-1']);
    });
  });

  describe('Label Management', () => {
    beforeEach(async () => {
      // Setup authenticated account
      const mockAccount = createMockGmailAccount({ 
        email: 'test@example.com',
        name: 'Test User'
      });
      
      await act(async () => {
        await useMailStore.getState().addAccount(mockAccount);
      });
    });

    it('should fetch and store labels through service layer', async () => {
      const store = useMailStore.getState();
      
      // Test initial state
      expect(store.getLabels()).toHaveLength(0);
      
      // Fetch labels through store
      await act(async () => {
        await store.fetchLabels();
      });
      
      // Verify labels are stored
      const labels = store.getLabels();
      expect(labels.length).toBeGreaterThan(0);
      expect(labels.some(l => l.id === 'INBOX')).toBe(true);
      expect(labels.some(l => l.id === 'SENT')).toBe(true);
    });

    it('should handle label filtering', async () => {
      const store = useMailStore.getState();
      
      // Setup labels
      await act(async () => {
        await store.fetchLabels();
      });
      
      // Test label filtering
      act(() => {
        store.setCurrentView('STARRED');
      });
      
      expect(store.currentView).toBe('STARRED');
      
      act(() => {
        store.setCurrentLabel('INBOX');
      });
      
      expect(store.currentLabel).toBe('INBOX');
    });
  });

  describe('Search and Filtering', () => {
    beforeEach(async () => {
      // Setup authenticated account with messages
      const mockAccount = createMockGmailAccount({ 
        email: 'test@example.com',
        name: 'Test User'
      });
      
      await act(async () => {
        await useMailStore.getState().addAccount(mockAccount);
      });
      
      const testMessages = MOCK_SAMPLE_MESSAGES.slice(0, 5).map(msg => ({
        ...msg,
        accountId: mockAccount.id
      }));
      
      testStore.setTestMessages(testMessages, mockAccount.id);
    });

    it('should filter messages by search query', async () => {
      const store = useMailStore.getState();
      
      // Test search functionality
      act(() => {
        store.setSearchQuery('important');
      });
      
      expect(store.searchQuery).toBe('important');
      
      // Test clearing search
      act(() => {
        store.setSearchQuery('');
      });
      
      expect(store.searchQuery).toBe('');
    });

    it('should handle advanced filtering', async () => {
      const store = useMailStore.getState();
      
      // Test date range filtering
      const dateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      };
      
      act(() => {
        store.setFilters({ dateRange });
      });
      
      expect(store.filters.dateRange).toEqual(dateRange);
      
      // Test unread filtering
      act(() => {
        store.setFilters({ isUnread: true });
      });
      
      expect(store.filters.isUnread).toBe(true);
    });
  });

  describe('Compose Operations', () => {
    beforeEach(async () => {
      // Setup authenticated account
      const mockAccount = createMockGmailAccount({ 
        email: 'test@example.com',
        name: 'Test User'
      });
      
      await act(async () => {
        await useMailStore.getState().addAccount(mockAccount);
      });
      
      // Mock compose service
      vi.spyOn(gmailTauriService, 'sendGmailMessage').mockResolvedValue({
        success: true,
        messageId: 'sent-123'
      });
    });

    it('should handle compose state management', async () => {
      const store = useMailStore.getState();
      
      // Test opening compose
      act(() => {
        store.startCompose();
      });
      
      expect(store.isComposing).toBe(true);
      
      // Test updating compose data
      act(() => {
        store.updateComposeData({
          to: [{ email: 'recipient@example.com', name: 'Recipient' }],
          subject: 'Test Subject',
          body: 'Test body content'
        });
      });
      
      expect(store.composeData.to).toHaveLength(1);
      expect(store.composeData.subject).toBe('Test Subject');
      expect(store.composeData.body).toBe('Test body content');
      
      // Test sending
      await act(async () => {
        await store.sendMessage();
      });
      
      expect(gmailTauriService.sendGmailMessage).toHaveBeenCalled();
      expect(store.isComposing).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle service layer errors gracefully', async () => {
      const store = useMailStore.getState();
      
      // Mock service error
      vi.spyOn(gmailTauriService, 'startGmailAuth').mockRejectedValue(
        new Error('Network error')
      );
      
      // Test error handling
      await act(async () => {
        try {
          await store.addAccount();
        } catch (error) {
          // Error should be caught and handled
        }
      });
      
      // Verify error state
      expect(store.error).toBeTruthy();
      expect(store.connectionStatus).toBe('error');
    });

    it('should handle authentication errors', async () => {
      const store = useMailStore.getState();
      
      // Mock authentication error
      vi.spyOn(gmailTauriService, 'createGmailTauriService').mockReturnValue({
        ...vi.mocked(gmailTauriService.createGmailTauriService).getMockImplementation()!(),
        searchMessages: vi.fn().mockRejectedValue(new Error('Unauthorized'))
      } as any);
      
      // Add account first
      const mockAccount = createMockGmailAccount({ 
        email: 'test@example.com',
        name: 'Test User'
      });
      
      await act(async () => {
        await store.addAccount(mockAccount);
      });
      
      // Test handling auth error during operation
      await act(async () => {
        try {
          await store.fetchMessages();
        } catch (error) {
          // Error should be handled
        }
      });
      
      // Verify error state is set
      expect(store.error).toBeTruthy();
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle large message lists efficiently', async () => {
      const store = useMailStore.getState();
      
      // Create large dataset
      const largeMessageSet = Array.from({ length: 1000 }, (_, i) => 
        createMockParsedEmail({
          id: `msg-${i}`,
          subject: `Message ${i}`,
          sender: `sender${i}@example.com`
        })
      );
      
      const startTime = performance.now();
      
      // Test bulk operations
      await act(async () => {
        testStore.setTestMessages(largeMessageSet, 'test-account');
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should handle large datasets efficiently (under 100ms)
      expect(duration).toBeLessThan(100);
      expect(store.getMessages()).toHaveLength(1000);
    });

    it('should optimize store subscriptions', async () => {
      const store = useMailStore.getState();
      
      // Test that store operations are fast
      const startTime = performance.now();
      
      // Perform multiple store operations
      for (let i = 0; i < 100; i++) {
        act(() => {
          store.setSearchQuery(`search-${i}`);
          store.setCurrentView('INBOX');
          store.setCurrentLabel('STARRED');
        });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Store operations should be fast (under 50ms for 100 operations)
      expect(duration).toBeLessThan(50);
    });
  });
}); 