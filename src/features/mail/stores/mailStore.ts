import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  MailStore, 
  MailState, 
  ParsedEmail, 
  EmailThread, 
  GmailLabel, 
  ComposeEmail,
  GMAIL_LABELS 
} from '../types';
import { gmailService } from '../services/gmailService';

// Mock data for testing
const mockEmails: ParsedEmail[] = [
  {
    id: '1',
    threadId: 'thread1',
    from: { email: 'hello@gardenstatecandles.com', name: 'Garden State Candles' },
    to: [{ email: 'me@example.com', name: 'Me' }],
    cc: [],
    bcc: [],
    subject: 'Your Endless Summer Starts Here 🌅☀️',
    body: 'Picnics, Drinks & All New Picks Just for You! Our new summer collection is here to make your picnic bag dance with joy.',
    htmlBody: '<p>Picnics, Drinks & All New Picks Just for You! Our new summer collection is here to make your picnic bag dance with joy.</p>',
    snippet: 'Picnics, Drinks & All New Picks Just for You! Our new summer collection is here to make your picnic bag dance with joy.',
    date: new Date('2024-07-03T18:59:00'),
    isRead: false,
    isStarred: false,
    labels: ['INBOX'],
    attachments: [],
    importance: 'normal'
  },
  {
    id: '2',
    threadId: 'thread2',
    from: { email: 'eric@genspark.com', name: 'Eric at Genspark' },
    to: [{ email: 'me@example.com', name: 'Me' }],
    cc: [],
    bcc: [],
    subject: 'Genspark AI Docs - The World\'s Most Advanced AI Documentation',
    body: 'Hey there! Today, we\'re excited to share our latest AI documentation platform that will revolutionize how you work with AI.',
    htmlBody: '<p>Hey there! Today, we\'re excited to share our latest AI documentation platform that will revolutionize how you work with AI.</p>',
    snippet: 'Hey there! Today, we\'re excited to share our latest AI documentation platform that will revolutionize how you work with AI.',
    date: new Date('2024-07-02T10:30:00'),
    isRead: true,
    isStarred: true,
    labels: ['INBOX'],
    attachments: [],
    importance: 'normal'
  },
  {
    id: '3',
    threadId: 'thread3',
    from: { email: 'service@paypal.de', name: 'PayPal' },
    to: [{ email: 'me@example.com', name: 'Me' }],
    cc: [],
    bcc: [],
    subject: 'You authorized a payment to Telekom Deutschland GmbH',
    body: 'Mason Mitchell, thanks for using PayPal to pay Telekom Deutschland GmbH. We wanted to let you know that your payment has been processed.',
    htmlBody: '<p>Mason Mitchell, thanks for using PayPal to pay Telekom Deutschland GmbH. We wanted to let you know that your payment has been processed.</p>',
    snippet: 'Mason Mitchell, thanks for using PayPal to pay Telekom Deutschland GmbH. We wanted to let you know that your payment has been processed.',
    date: new Date('2024-07-02T09:15:00'),
    isRead: true,
    isStarred: false,
    labels: ['INBOX'],
    attachments: [],
    importance: 'normal'
  },
  {
    id: '4',
    threadId: 'thread4',
    from: { email: 'support@anthropic.com', name: 'Anthropic Support' },
    to: [{ email: 'me@example.com', name: 'Me' }],
    cc: [],
    bcc: [],
    subject: 'Your receipt from Anthropic, PBC #22834',
    body: 'Your receipt from Anthropic, PBC #22834. Thank you for your purchase. Here are the details of your transaction.',
    htmlBody: '<p>Your receipt from Anthropic, PBC #22834. Thank you for your purchase. Here are the details of your transaction.</p>',
    snippet: 'Your receipt from Anthropic, PBC #22834. Thank you for your purchase. Here are the details of your transaction.',
    date: new Date('2024-06-27T14:20:00'),
    isRead: true,
    isStarred: false,
    labels: ['INBOX'],
    attachments: [
      { filename: 'receipt.pdf', size: 54332, mimeType: 'application/pdf' }
    ],
    importance: 'normal'
  },
  {
    id: '5',
    threadId: 'thread5',
    from: { email: 'billing@anthropic.com', name: 'Anthropic Billing' },
    to: [{ email: 'me@example.com', name: 'Me' }],
    cc: [],
    bcc: [],
    subject: 'Welcome to the Pro plan',
    body: 'Thanks for starting your Pro subscription! You now have access to all Pro features including priority support and advanced analytics.',
    htmlBody: '<p>Thanks for starting your Pro subscription! You now have access to all Pro features including priority support and advanced analytics.</p>',
    snippet: 'Thanks for starting your Pro subscription! You now have access to all Pro features including priority support and advanced analytics.',
    date: new Date('2024-06-27T13:45:00'),
    isRead: false,
    isStarred: false,
    labels: ['INBOX'],
    attachments: [],
    importance: 'normal'
  }
];

const mockLabels: GmailLabel[] = [
  { id: 'INBOX', name: 'Inbox', messagesTotal: 25, messagesUnread: 3, threadsTotal: 20, threadsUnread: 3 },
  { id: 'STARRED', name: 'Starred', messagesTotal: 5, messagesUnread: 0, threadsTotal: 5, threadsUnread: 0 },
  { id: 'SENT', name: 'Sent', messagesTotal: 15, messagesUnread: 0, threadsTotal: 12, threadsUnread: 0 },
  { id: 'DRAFTS', name: 'Drafts', messagesTotal: 3, messagesUnread: 0, threadsTotal: 3, threadsUnread: 0 },
  { id: 'WORK', name: 'Work', messagesTotal: 8, messagesUnread: 2, threadsTotal: 6, threadsUnread: 2 },
  { id: 'PERSONAL', name: 'Personal', messagesTotal: 12, messagesUnread: 1, threadsTotal: 10, threadsUnread: 1 }
];

const initialState: MailState = {
  // Authentication
  isAuthenticated: false,
  userEmail: null,
  accessToken: null,
  
  // Loading states
  isLoading: false,
  isLoadingMessages: false,
  isLoadingThreads: false,
  isSending: false,
  
  // Data
  messages: mockEmails,
  threads: [],
  labels: mockLabels,
  currentThread: null,
  currentMessage: null,
  
  // UI State
  selectedMessages: [],
  currentView: 'inbox',
  searchQuery: '',
  currentLabel: null,
  
  // Compose
  isComposing: false,
  composeDraft: null,
  
  // Pagination
  nextPageToken: null,
  hasMoreMessages: true,
  
  // Error state
  error: null,
  connectionStatus: 'disconnected'
};

export const useMailStore = create<MailStore>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      // Authentication actions
      authenticate: async (config) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        
        try {
          await gmailService.authenticate();
          set((state) => {
            state.isAuthenticated = true;
            state.isLoading = false;
            state.connectionStatus = 'connected';
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Authentication failed';
            state.isLoading = false;
            state.connectionStatus = 'error';
          });
        }
      },

      disconnect: () => {
        set((state) => {
          state.isAuthenticated = false;
          state.userEmail = null;
          state.accessToken = null;
          state.connectionStatus = 'disconnected';
        });
      },

      // Message actions
      fetchMessages: async (labelId = 'INBOX') => {
        set((state) => {
          state.isLoadingMessages = true;
          state.error = null;
        });
        
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          set((state) => {
            state.messages = mockEmails.filter(email => 
              email.labels.includes(labelId) || labelId === 'all'
            );
            state.isLoadingMessages = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to fetch messages';
            state.isLoadingMessages = false;
          });
        }
      },

      fetchMessage: async (messageId) => {
        const message = get().messages.find(m => m.id === messageId);
        if (message) {
          set((state) => {
            state.currentMessage = message;
            // Mark as read
            const messageIndex = state.messages.findIndex(m => m.id === messageId);
            if (messageIndex >= 0) {
              state.messages[messageIndex].isRead = true;
            }
          });
        }
      },

      fetchThread: async (threadId) => {
        // Implementation for fetching thread
      },

      markAsRead: async (messageIds) => {
        set((state) => {
          messageIds.forEach(id => {
            const message = state.messages.find(m => m.id === id);
            if (message) {
              message.isRead = true;
            }
          });
        });
      },

      markAsUnread: async (messageIds) => {
        set((state) => {
          messageIds.forEach(id => {
            const message = state.messages.find(m => m.id === id);
            if (message) {
              message.isRead = false;
            }
          });
        });
      },

      deleteMessages: async (messageIds) => {
        set((state) => {
          state.messages = state.messages.filter(m => !messageIds.includes(m.id));
          state.selectedMessages = [];
        });
      },

      archiveMessages: async (messageIds) => {
        set((state) => {
          state.messages = state.messages.filter(m => !messageIds.includes(m.id));
          state.selectedMessages = [];
        });
      },

      starMessages: async (messageIds) => {
        set((state) => {
          messageIds.forEach(id => {
            const message = state.messages.find(m => m.id === id);
            if (message) {
              message.isStarred = true;
            }
          });
        });
      },

      unstarMessages: async (messageIds) => {
        set((state) => {
          messageIds.forEach(id => {
            const message = state.messages.find(m => m.id === id);
            if (message) {
              message.isStarred = false;
            }
          });
        });
      },

      // Label actions
      fetchLabels: async () => {
        set((state) => {
          state.labels = mockLabels;
        });
      },

      addLabel: async (messageIds: string[], labelId: string) => {
        try {
          // This would need to be implemented in the Gmail service
          console.warn('addLabel not implemented yet');
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to add label';
          });
        }
      },

      removeLabel: async (messageIds: string[], labelId: string) => {
        try {
          // This would need to be implemented in the Gmail service
          console.warn('removeLabel not implemented yet');
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to remove label';
          });
        }
      },

      // Compose actions
      startCompose: (draft) => {
        set((state) => {
          state.isComposing = true;
          state.composeDraft = {
            to: [],
            cc: [],
            bcc: [],
            subject: '',
            body: '',
            ...draft
          };
        });
      },

      updateCompose: (updates) => {
        set((state) => {
          if (state.composeDraft) {
            Object.assign(state.composeDraft, updates);
          }
        });
      },

      sendEmail: async (draft) => {
        set((state) => {
          state.isSending = true;
        });
        
        try {
          // Simulate sending
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          set((state) => {
            state.isComposing = false;
            state.composeDraft = null;
            state.isSending = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to send email';
            state.isSending = false;
          });
        }
      },

      saveDraft: async (email: ComposeEmail) => {
        try {
          // This would need to be implemented in the Gmail service
          console.warn('saveDraft not implemented yet');
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to save draft';
          });
        }
      },

      cancelCompose: () => {
        set((state) => {
          state.isComposing = false;
          state.composeDraft = null;
        });
      },

      // Search actions
      searchMessages: async (query) => {
        set((state) => {
          state.searchQuery = query;
          state.isLoadingMessages = true;
        });
        
        try {
          // Simulate search
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const filteredMessages = mockEmails.filter(email => 
            email.subject.toLowerCase().includes(query.toLowerCase()) ||
            email.body.toLowerCase().includes(query.toLowerCase()) ||
            email.from.email.toLowerCase().includes(query.toLowerCase()) ||
            (email.from.name && email.from.name.toLowerCase().includes(query.toLowerCase()))
          );
          
          set((state) => {
            state.messages = filteredMessages;
            state.isLoadingMessages = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Search failed';
            state.isLoadingMessages = false;
          });
        }
      },

      clearSearch: () => {
        set((state) => {
          state.searchQuery = '';
          state.messages = mockEmails;
        });
      },

      // UI actions
      setCurrentView: (view) => {
        set((state) => {
          state.currentView = view;
          state.currentMessage = null;
        });
        get().fetchMessages(view === 'inbox' ? 'INBOX' : view.toUpperCase());
      },

      setCurrentLabel: (labelId) => {
        set((state) => {
          state.currentLabel = labelId;
        });
        get().fetchMessages(labelId);
      },

      selectMessage: (messageId, isSelected) => {
        set((state) => {
          if (isSelected) {
            if (!state.selectedMessages.includes(messageId)) {
              state.selectedMessages.push(messageId);
            }
          } else {
            const index = state.selectedMessages.indexOf(messageId);
            if (index > -1) {
              state.selectedMessages.splice(index, 1);
            }
          }
        });
      },

      selectAllMessages: (isSelected) => {
        set((state) => {
          if (isSelected) {
            state.selectedMessages = state.messages.map(m => m.id);
          } else {
            state.selectedMessages = [];
          }
        });
      },

      clearSelection: () => {
        set((state) => {
          state.selectedMessages = [];
        });
      },

      // Error handling
      setError: (error: string | null) => {
        set((state) => {
          state.error = error;
        });
      },

      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },

      // Thread actions
      fetchThread: async (threadId) => {
        // Implementation for fetching thread
      },

      createLabel: async (name) => {
        // Implementation for creating label
      },

      deleteLabel: async (labelId) => {
        // Implementation for deleting label
      },

      // Sync actions
      syncMessages: async () => {
        // Implementation for syncing messages
      },
    })),
    {
      name: 'mail-store',
    }
  )
);

export default useMailStore; 