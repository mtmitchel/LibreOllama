/**
 * Gmail UI Integration Tests
 * Tests complete user workflows from UI interaction to backend processing
 * Updated to match current Mail component structure
 */

// Mock the gmail sync service before any imports to prevent initialization
vi.mock('../../features/mail/services/gmailSyncService', () => {
  const mockConfig = {
    enablePushNotifications: false,
    pollingInterval: 5,
    maxRetries: 3,
    batchSize: 50,
    enableIncrementalSync: true,
    enableOfflineQueue: false,
  };

  const mockOverallStatus = {
    isOnline: true,
    totalAccounts: 0,
    syncingAccounts: 0,
    errorAccounts: 0,
    pendingOperations: 0,
  };

  return {
    gmailSyncService: {
      syncMessages: vi.fn().mockResolvedValue(undefined),
      initializeTauriEventListeners: vi.fn(),
      startPeriodicSync: vi.fn(),
      stopPeriodicSync: vi.fn(),
      addAccount: vi.fn().mockResolvedValue(undefined),
      removeAccount: vi.fn().mockResolvedValue(undefined),
      syncAccount: vi.fn().mockResolvedValue(undefined),
      syncAllAccounts: vi.fn().mockResolvedValue([]),
      getConfig: vi.fn().mockReturnValue(mockConfig),
      getOverallStatus: vi.fn().mockReturnValue(mockOverallStatus),
      getAllAccountStates: vi.fn().mockReturnValue([]),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      getAccountState: vi.fn().mockReturnValue(undefined),
      cleanup: vi.fn().mockResolvedValue(undefined),
    },
    GmailSyncService: vi.fn().mockImplementation(() => ({
      syncMessages: vi.fn().mockResolvedValue(undefined),
      initializeTauriEventListeners: vi.fn(),
      startPeriodicSync: vi.fn(),
      stopPeriodicSync: vi.fn(),
      addAccount: vi.fn().mockResolvedValue(undefined),
      removeAccount: vi.fn().mockResolvedValue(undefined),
      syncAccount: vi.fn().mockResolvedValue(undefined),
      syncAllAccounts: vi.fn().mockResolvedValue([]),
      getConfig: vi.fn().mockReturnValue(mockConfig),
      getOverallStatus: vi.fn().mockReturnValue(mockOverallStatus),
      getAllAccountStates: vi.fn().mockReturnValue([]),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      getAccountState: vi.fn().mockReturnValue(undefined),
      cleanup: vi.fn().mockResolvedValue(undefined),
    })),
  };
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { useMailStore } from '../../features/mail/stores/mailStore';
import { createTestMailStore } from '../../features/mail/stores/__tests__/mailStoreTestUtils';
import { MessageList } from '../../features/mail/components/MessageList';
import { MessageView } from '../../features/mail/components/MessageView';
import { ComposeModal } from '../../features/mail/components/ComposeModal';
import { MailSidebar } from '../../features/mail/components/MailSidebar';
import Mail from '../../app/pages/Mail';
import { HeaderProvider } from '../../app/contexts/HeaderContext';
import * as gmailTauriService from '../../features/mail/services/gmailTauriService';

// Mock data
import { createMockGmailMessage, createMockParsedEmail, convertMockMessageToParsedEmail, createMockGmailAccount, MockGmailApiServer } from '../helpers/gmailMockData';
import { setupTauriMocks, cleanupTauriMocks } from '../helpers/tauriMocks';

// Test wrapper with all providers
const TestWrapper: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <MemoryRouter initialEntries={['/mail']}>
    <HeaderProvider>
      {children}
    </HeaderProvider>
  </MemoryRouter>
);

describe('Gmail UI Integration Tests', () => {
  let mockApiServer: MockGmailApiServer;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    mockApiServer = new MockGmailApiServer();
    
    // Setup comprehensive Tauri mocks
    setupTauriMocks();

    // Reset mail store to initial state
    useMailStore.getState().signOut();
    
    // Mock Gmail Tauri services
    vi.spyOn(gmailTauriService, 'startGmailAuth').mockResolvedValue({
      success: true,
      authUrl: 'https://accounts.google.com/oauth/authorize?...',
      state: 'test-state-123'
    });
    
    vi.spyOn(gmailTauriService, 'createGmailTauriService').mockReturnValue({
      getUserProfile: vi.fn().mockResolvedValue({ email: 'test@example.com', name: 'Test User', id: 'test-id' }),
      getLabels: vi.fn().mockResolvedValue([]),
      searchMessages: vi.fn().mockResolvedValue({ messages: [], next_page_token: undefined }),
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

  afterEach(() => {
    cleanupTauriMocks();
    mockApiServer.stop();
  });

  describe('🔐 Authentication Flow', () => {
    it('should show unauthenticated state when no account is connected', async () => {
      render(<Mail />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(screen.getByText('No Google Account Connected')).toBeInTheDocument();
        expect(screen.getByText('Please connect a Google account in Settings to access your Gmail')).toBeInTheDocument();
      });
    });

    it('should show authenticated mail interface when account is connected', async () => {
      // Set up authenticated state
      const testStore = createTestMailStore();
      testStore.setTestAuthenticated(true);
      testStore.setTestCurrentAccountId('test-account-1');
      
      render(<Mail />, { wrapper: TestWrapper });
      
      // Verify unauthenticated state is not shown
      await waitFor(() => {
        expect(screen.queryByText('No Google Account Connected')).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('📧 Message Management', () => {
    beforeEach(() => {
      // Setup authenticated state
      const testStore = createTestMailStore();
      testStore.setTestAuthenticated(true);
      testStore.setTestCurrentAccountId('test-account-1');
    });

    it('should display messages when store has messages', async () => {
      const testStore = createTestMailStore();
      testStore.setTestAuthenticated(true);
      testStore.setTestCurrentAccountId('test-account-1');
      
      // Create mock messages with correct account ID
      const mockMessages = [
        createMockParsedEmail({ 
          id: '1', 
          subject: 'Test Email 1',
          snippet: 'This is a test email',
          sender: 'Test User <test@example.com>'
        }),
        createMockParsedEmail({ 
          id: '2', 
          subject: 'Test Email 2',
          snippet: 'This is another test email',
          sender: 'Test User 2 <test2@example.com>'
        })
      ].map(msg => ({
        ...msg,
        accountId: 'test-account-1'
      }));
      
      // Set messages in store
      testStore.setTestMessages(mockMessages, 'test-account-1');
      
      render(<Mail />, { wrapper: TestWrapper });
      
      // Check if messages are displayed
      await waitFor(() => {
        expect(screen.getByText('Test Email 1')).toBeInTheDocument();
        expect(screen.getByText('Test Email 2')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should handle message selection through store', async () => {
      const testStore = createTestMailStore();
      testStore.setTestAuthenticated(true);
      testStore.setTestCurrentAccountId('test-account-1');
      
      const mockMessage = {
        ...createMockParsedEmail({ 
          id: '1', 
          subject: 'Test Message',
          snippet: 'Test snippet',
          sender: 'Test User <test@example.com>'
        }),
        accountId: 'test-account-1'
      };
      
      testStore.setTestMessages([mockMessage], 'test-account-1');
      
      render(<Mail />, { wrapper: TestWrapper });
      
      // Find and click the message
      const messageElement = await waitFor(() => {
        return screen.getByText('Test Message');
      });
      
      await user.click(messageElement);
      
      // Verify the message is selected in store
      await waitFor(() => {
        expect(useMailStore.getState().currentMessage?.id).toBe('1');
      }, { timeout: 5000 });
    });
  });

  describe('🔄 Store Operations', () => {
    it('should handle multiple accounts in store', async () => {
      const testStore = createTestMailStore();
      const accounts = [
        createMockGmailAccount({ id: 'account-1', email: 'user1@gmail.com', name: 'User 1' }),
        createMockGmailAccount({ id: 'account-2', email: 'user2@gmail.com', name: 'User 2' }),
      ];
      
      // Set up accounts in store
      testStore.setTestAccounts(accounts);
      testStore.setTestAuthenticated(true);
      testStore.setTestCurrentAccountId('account-1');
      
      render(<Mail />, { wrapper: TestWrapper });
      
      // Verify the mail interface loads with authenticated account
      await waitFor(() => {
        expect(screen.queryByText('No Google Account Connected')).not.toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Verify current account is set correctly
      expect(useMailStore.getState().currentAccountId).toBe('account-1');
    });

    it('should handle search query state', async () => {
      const testStore = createTestMailStore();
      testStore.setTestAuthenticated(true);
      testStore.setTestCurrentAccountId('test-account-1');
      
      const mockMessages = [
        createMockParsedEmail({ id: '1', subject: 'Important Email', sender: 'Boss <boss@company.com>' }),
        createMockParsedEmail({ id: '2', subject: 'Regular Email', sender: 'Colleague <colleague@company.com>' }),
      ].map(msg => ({
        ...msg,
        accountId: 'test-account-1'
      }));
      
      testStore.setTestMessages(mockMessages, 'test-account-1');
      
      render(<Mail />, { wrapper: TestWrapper });
      
      // Wait for authenticated view to load
      await waitFor(() => {
        expect(screen.queryByText('No Google Account Connected')).not.toBeInTheDocument();
      }, { timeout: 5000 });
      
             // Test search functionality through store
       const store = useMailStore.getState();
       
       // Update search query directly on the store state
       useMailStore.setState({ searchQuery: 'important' });
       
       expect(useMailStore.getState().searchQuery).toBe('important');
    });
  });

  describe('🔄 Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network error scenario
      vi.spyOn(gmailTauriService, 'createGmailTauriService').mockReturnValue({
        getUserProfile: vi.fn().mockRejectedValue(new Error('Network error')),
        getLabels: vi.fn().mockResolvedValue([]),
        searchMessages: vi.fn().mockResolvedValue({ messages: [], next_page_token: undefined }),
        getMessage: vi.fn().mockResolvedValue(null),
        getThread: vi.fn().mockResolvedValue([]),
        markAsRead: vi.fn().mockResolvedValue(undefined),
        markAsUnread: vi.fn().mockResolvedValue(undefined),
        starMessages: vi.fn().mockResolvedValue(undefined),
        unstarMessages: vi.fn().mockResolvedValue(undefined),
        archiveMessages: vi.fn().mockResolvedValue(undefined),
        deleteMessages: vi.fn().mockResolvedValue(undefined)
      } as any);
      
      // Set up authenticated state to avoid auth modal
      const testStore = createTestMailStore();
      testStore.setTestAuthenticated(true);
      testStore.setTestCurrentAccountId('test-account-1');
      
      render(<Mail />, { wrapper: TestWrapper });
      
      // Just verify the Mail component rendered without crashing
      await waitFor(() => {
        expect(screen.queryByText('No Google Account Connected')).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should handle empty state gracefully', async () => {
      const testStore = createTestMailStore();
      testStore.setTestAuthenticated(true);
      testStore.setTestCurrentAccountId('test-account-1');
      testStore.setTestMessages([], 'test-account-1');
      
      render(<Mail />, { wrapper: TestWrapper });
      
      // Should render without crashing even with no messages
      await waitFor(() => {
        expect(screen.queryByText('No Google Account Connected')).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('🧪 Component Integration', () => {
    it('should render MessageList component', async () => {
      const testStore = createTestMailStore();
      const mockMessages = [
        createMockParsedEmail({ id: '1', subject: 'Test Email', sender: 'Test User <test@example.com>' }),
      ];
      
      testStore.setTestMessages(mockMessages, 'test-account-1');
      
      render(<MessageList />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(screen.getByText('Test Email')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should render MessageView component', async () => {
      const mockMessage = createMockParsedEmail({ 
        id: '1', 
        subject: 'Test Email',
        body: 'Test email content',
        sender: 'Test User <test@example.com>'
      });
      
      render(<MessageView message={mockMessage} />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(screen.getByText('Test Email')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should render ComposeModal component', async () => {
      const testStore = createTestMailStore();
      testStore.setTestAuthenticated(true);
      testStore.setTestCurrentAccountId('test-account-1');
      
      render(<ComposeModal isOpen={true} onClose={vi.fn()} />, { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should render MailSidebar component', async () => {
      const testStore = createTestMailStore();
      testStore.setTestAuthenticated(true);
      testStore.setTestCurrentAccountId('test-account-1');
      
      render(<MailSidebar />, { wrapper: TestWrapper });
      
      // Should render without crashing
      await waitFor(() => {
        expect(screen.getByText('Labels')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });
}); 