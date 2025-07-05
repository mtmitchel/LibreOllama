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

// Mock data for development
const mockMessages: ParsedEmail[] = [
  {
    id: '1',
    threadId: 'thread1',
    from: { name: 'John Doe', email: 'john@example.com' },
    to: [{ name: 'You', email: 'you@example.com' }],
    cc: [],
    bcc: [],
    subject: 'Welcome to LibreOllama!',
    body: 'Thanks for joining us. Here\'s everything you need to know...',
    htmlBody: '<p>Thanks for joining us. Here\'s everything you need to know...</p>',
    attachments: [],
    date: new Date('2024-01-15T10:30:00'),
    isRead: false,
    isStarred: false,
    labels: ['INBOX', 'UNREAD'],
    snippet: 'Thanks for joining us. Here\'s everything you need to know...',
  },
  {
    id: '2',
    threadId: 'thread2',
    from: { name: 'Support Team', email: 'support@company.com' },
    to: [{ name: 'You', email: 'you@example.com' }],
    cc: [],
    bcc: [],
    subject: 'Your account has been verified',
    body: 'Great news! Your account verification is complete.',
    htmlBody: '<p>Great news! Your account verification is complete.</p>',
    attachments: [],
    date: new Date('2024-01-14T14:20:00'),
    isRead: true,
    isStarred: true,
    labels: ['INBOX', 'STARRED'],
    snippet: 'Great news! Your account verification is complete.',
  },
  {
    id: '3',
    threadId: 'thread3',
    from: { name: 'Project Manager', email: 'pm@company.com' },
    to: [{ name: 'You', email: 'you@example.com' }],
    cc: [{ name: 'Team Lead', email: 'lead@company.com' }],
    bcc: [],
    subject: 'Project Update - Q1 2024',
    body: 'Here\'s the latest update on our Q1 projects...',
    htmlBody: '<p>Here\'s the latest update on our Q1 projects...</p>',
    attachments: [
      { id: 'att1', filename: 'project-report.pdf', size: 245760, mimeType: 'application/pdf' },
      { id: 'att2', filename: 'budget-sheet.xlsx', size: 89456, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      { id: 'att3', filename: 'timeline.png', size: 156789, mimeType: 'image/png' }
    ],
    date: new Date('2024-01-13T09:15:00'),
    isRead: false,
    isStarred: false,
    labels: ['INBOX', 'UNREAD', 'WORK'],
    snippet: 'Here\'s the latest update on our Q1 projects...',
  },
  {
    id: '4',
    threadId: 'thread4',
    from: { name: 'Finance Department', email: 'finance@company.com' },
    to: [{ name: 'You', email: 'you@example.com' }],
    cc: [],
    bcc: [],
    subject: 'Monthly Expense Report',
    body: 'Please find your monthly expense report attached.',
    htmlBody: '<p>Please find your monthly expense report attached.</p>',
    attachments: [
      { id: 'att4', filename: 'receipt.pdf', size: 54332, mimeType: 'application/pdf' }
    ],
    date: new Date('2024-01-12T16:45:00'),
    isRead: true,
    isStarred: false,
    labels: ['INBOX'],
    snippet: 'Please find your monthly expense report attached.',
  }
];

const mockLabels: GmailLabel[] = [
  { id: 'INBOX', name: 'Inbox', messageListVisibility: 'show', labelListVisibility: 'labelShow', type: 'system', messagesTotal: 25, messagesUnread: 3, threadsTotal: 20, threadsUnread: 3 },
  { id: 'STARRED', name: 'Starred', messageListVisibility: 'show', labelListVisibility: 'labelShow', type: 'system', messagesTotal: 5, messagesUnread: 0, threadsTotal: 5, threadsUnread: 0 },
  { id: 'SENT', name: 'Sent', messageListVisibility: 'show', labelListVisibility: 'labelShow', type: 'system', messagesTotal: 15, messagesUnread: 0, threadsTotal: 12, threadsUnread: 0 },
  { id: 'DRAFTS', name: 'Drafts', messageListVisibility: 'show', labelListVisibility: 'labelShow', type: 'system', messagesTotal: 3, messagesUnread: 0, threadsTotal: 3, threadsUnread: 0 },
  { id: 'WORK', name: 'Work', messageListVisibility: 'show', labelListVisibility: 'labelShow', type: 'user', messagesTotal: 8, messagesUnread: 2, threadsTotal: 6, threadsUnread: 2 },
  { id: 'PERSONAL', name: 'Personal', messageListVisibility: 'show', labelListVisibility: 'labelShow', type: 'user', messagesTotal: 12, messagesUnread: 1, threadsTotal: 10, threadsUnread: 1 }
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
  messages: mockMessages,
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
      authenticate: async () => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        
        try {
          // This would integrate with the actual OAuth flow
          // For now, just simulate authentication
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          set((state) => {
            state.isAuthenticated = true;
            state.userEmail = 'user@example.com';
            state.accessToken = 'mock-token';
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Authentication failed';
            state.isLoading = false;
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
      fetchMessages: async (labelId?: string, query?: string, pageToken?: string) => {
        set((state) => {
          state.isLoadingMessages = true;
          state.error = null;
        });
        
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Filter messages based on labelId
          let filteredMessages = mockMessages;
          if (labelId) {
            filteredMessages = mockMessages.filter(msg => msg.labels.includes(labelId));
          }

          set((state) => {
            state.messages = filteredMessages;
            state.isLoadingMessages = false;
            state.hasMoreMessages = false; // Simplified for mock
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to fetch messages';
            state.isLoadingMessages = false;
          });
        }
      },

      fetchMessage: async (messageId: string) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 300));
          
          const message = mockMessages.find(msg => msg.id === messageId);
          if (!message) {
            throw new Error('Message not found');
          }

          set((state) => {
            state.currentMessage = message;
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to fetch message';
            state.isLoading = false;
          });
        }
      },

      fetchThread: async (threadId: string) => {
        set((state) => {
          state.isLoadingThreads = true;
          state.error = null;
        });
        
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 300));
          
          const threadMessages = mockMessages.filter(msg => msg.threadId === threadId);
          if (threadMessages.length === 0) {
            throw new Error('Thread not found');
          }

          const thread: EmailThread = {
            id: threadId,
            subject: threadMessages[0].subject,
            participants: Array.from(new Set([
              ...threadMessages.flatMap(msg => [msg.from, ...msg.to, ...(msg.cc || []), ...(msg.bcc || [])])
            ])),
            messages: threadMessages,
            lastMessageDate: threadMessages[threadMessages.length - 1].date,
            isRead: threadMessages.every(msg => msg.isRead),
            isStarred: threadMessages.some(msg => msg.isStarred),
            labels: Array.from(new Set(threadMessages.flatMap(msg => msg.labels))),
            messageCount: threadMessages.length,
          };

          set((state) => {
            state.currentThread = thread;
            state.isLoadingThreads = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to fetch thread';
            state.isLoadingThreads = false;
          });
        }
      },

      markAsRead: async (messageIds: string[]) => {
        // Implementation for marking messages as read
      },

      markAsUnread: async (messageIds: string[]) => {
        // Implementation for marking messages as unread
      },

      deleteMessages: async (messageIds: string[]) => {
        // Implementation for deleting messages
      },

      archiveMessages: async (messageIds: string[]) => {
        // Implementation for archiving messages
      },

      starMessages: async (messageIds: string[]) => {
        set((state) => {
          messageIds.forEach(id => {
            const message = state.messages.find(msg => msg.id === id);
            if (message) {
              message.isStarred = true;
              if (!message.labels.includes('STARRED')) {
                message.labels.push('STARRED');
              }
            }
          });
        });
      },

      unstarMessages: async (messageIds: string[]) => {
        set((state) => {
          messageIds.forEach(id => {
            const message = state.messages.find(msg => msg.id === id);
            if (message) {
              message.isStarred = false;
              message.labels = message.labels.filter(label => label !== 'STARRED');
            }
          });
        });
      },

      // Label actions
      fetchLabels: async () => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 300));
          
          set((state) => {
            state.labels = mockLabels;
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to fetch labels';
            state.isLoading = false;
          });
        }
      },

      addLabel: async (messageIds: string[], labelId: string) => {
        // Implementation for adding labels
      },

      removeLabel: async (messageIds: string[], labelId: string) => {
        // Implementation for removing labels
      },

      // Compose actions
      startCompose: (draft?: Partial<ComposeEmail>) => {
        set((state) => {
          state.isComposing = true;
          state.composeDraft = {
            to: [],
            cc: [],
            bcc: [],
            subject: '',
            body: '',
            htmlBody: '',
            attachments: [],
            ...draft,
          };
        });
      },

      updateCompose: (updates: Partial<ComposeEmail>) => {
        set((state) => {
          if (state.composeDraft) {
            Object.assign(state.composeDraft, updates);
          }
        });
      },

      sendEmail: async (email: ComposeEmail) => {
        set((state) => {
          state.isSending = true;
          state.error = null;
        });
        
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          set((state) => {
            state.isSending = false;
            state.isComposing = false;
            state.composeDraft = null;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to send email';
            state.isSending = false;
          });
        }
      },

      saveDraft: async (email: ComposeEmail) => {
        // Implementation for saving drafts
      },

      cancelCompose: () => {
        set((state) => {
          state.isComposing = false;
          state.composeDraft = null;
        });
      },

      // Search actions
      searchMessages: async (query: string) => {
        set((state) => {
          state.searchQuery = query;
          state.isLoadingMessages = true;
          state.error = null;
        });
        
        try {
          // Simulate API call with search
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const filteredMessages = mockMessages.filter(msg => 
            msg.subject.toLowerCase().includes(query.toLowerCase()) ||
            msg.body.toLowerCase().includes(query.toLowerCase()) ||
            msg.from.email.toLowerCase().includes(query.toLowerCase())
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
          state.messages = mockMessages;
        });
      },

      // UI actions
      setCurrentView: (view: MailState['currentView']) => {
        set((state) => {
          state.currentView = view;
        });
        
        // Auto-fetch messages for the new view
        const labelId = view === 'inbox' ? 'INBOX' : 
                      view === 'sent' ? 'SENT' : 
                      view === 'drafts' ? 'DRAFTS' : 
                      view === 'starred' ? 'STARRED' : null;
        
        if (labelId) {
          get().fetchMessages(labelId);
        }
      },

      setCurrentLabel: (labelId: string | null) => {
        set((state) => {
          state.currentLabel = labelId;
        });
      },

      selectMessage: (messageId: string, isSelected: boolean) => {
        set((state) => {
          if (isSelected) {
            if (!state.selectedMessages.includes(messageId)) {
              state.selectedMessages.push(messageId);
            }
          } else {
            state.selectedMessages = state.selectedMessages.filter(id => id !== messageId);
          }
        });
      },

      selectAllMessages: (isSelected: boolean) => {
        set((state) => {
          if (isSelected) {
            state.selectedMessages = state.messages.map(msg => msg.id);
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
      fetchThread: async (threadId: string) => {
        // Implementation for fetching thread
      },

      createLabel: async (name: string) => {
        // Implementation for creating labels
      },

      deleteLabel: async (labelId: string) => {
        // Implementation for deleting labels
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