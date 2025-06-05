// Gmail API Service for LibreOllama

import { GoogleAuthService } from './google-auth';
import {
  GmailProfile,
  GmailMessage,
  GmailThread,
  GmailLabel,
  GmailMessagesResponse,
  GmailThreadsResponse
} from './google-types';

export class GmailService {
  private authService: GoogleAuthService;
  private baseUrl = 'https://www.googleapis.com/gmail/v1';

  constructor(authService: GoogleAuthService) {
    this.authService = authService;
  }

  /**
   * Get user's Gmail profile
   */
  async getProfile(): Promise<GmailProfile> {
    try {
      const response = await this.authService.makeAuthenticatedRequest<GmailProfile>(
        `${this.baseUrl}/users/me/profile`
      );

      return response;
    } catch (error) {
      console.error('Failed to fetch Gmail profile:', error);
      throw error;
    }
  }

  /**
   * Get list of labels
   */
  async getLabels(): Promise<GmailLabel[]> {
    try {
      const response = await this.authService.makeAuthenticatedRequest<{ labels: GmailLabel[] }>(
        `${this.baseUrl}/users/me/labels`
      );

      return response.labels || [];
    } catch (error) {
      console.error('Failed to fetch Gmail labels:', error);
      throw error;
    }
  }

  /**
   * Get messages list with optional query
   */
  async getMessages(options: {
    q?: string; // Search query
    labelIds?: string[];
    maxResults?: number;
    pageToken?: string;
    includeSpamTrash?: boolean;
  } = {}): Promise<GmailMessagesResponse> {
    try {
      const params = new URLSearchParams();
      
      if (options.q) params.set('q', options.q);
      if (options.maxResults) params.set('maxResults', options.maxResults.toString());
      if (options.pageToken) params.set('pageToken', options.pageToken);
      if (options.includeSpamTrash !== undefined) params.set('includeSpamTrash', options.includeSpamTrash.toString());
      if (options.labelIds?.length) {
        options.labelIds.forEach(labelId => params.append('labelIds', labelId));
      }

      const url = `${this.baseUrl}/users/me/messages`;
      const fullUrl = params.toString() ? `${url}?${params.toString()}` : url;

      const response = await this.authService.makeAuthenticatedRequest<GmailMessagesResponse>(fullUrl);

      return response;
    } catch (error) {
      console.error('Failed to fetch Gmail messages:', error);
      throw error;
    }
  }

  /**
   * Get a specific message by ID
   */
  async getMessage(messageId: string, format: 'minimal' | 'full' | 'raw' | 'metadata' = 'full'): Promise<GmailMessage> {
    try {
      const params = new URLSearchParams();
      params.set('format', format);

      const response = await this.authService.makeAuthenticatedRequest<GmailMessage>(
        `${this.baseUrl}/users/me/messages/${encodeURIComponent(messageId)}?${params.toString()}`
      );

      return response;
    } catch (error) {
      console.error(`Failed to fetch message ${messageId}:`, error);
      throw error;
    }
  }

  /**
   * Get multiple messages by IDs
   */
  async getMultipleMessages(messageIds: string[], format: 'minimal' | 'full' | 'metadata' = 'metadata'): Promise<GmailMessage[]> {
    try {
      const messagePromises = messageIds.map(id => 
        this.getMessage(id, format).catch(error => {
          console.warn(`Failed to fetch message ${id}:`, error);
          return null;
        })
      );

      const messages = await Promise.all(messagePromises);
      return messages.filter((msg): msg is GmailMessage => msg !== null);
    } catch (error) {
      console.error('Failed to fetch multiple messages:', error);
      throw error;
    }
  }

  /**
   * Get unread messages
   */
  async getUnreadMessages(maxResults: number = 50): Promise<GmailMessage[]> {
    try {
      const messagesResponse = await this.getMessages({
        q: 'is:unread',
        maxResults
      });

      if (!messagesResponse.messages?.length) {
        return [];
      }

      const messageIds = messagesResponse.messages.map(msg => msg.id);
      return this.getMultipleMessages(messageIds, 'metadata');
    } catch (error) {
      console.error('Failed to fetch unread messages:', error);
      throw error;
    }
  }

  /**
   * Get recent messages (from today)
   */
  async getRecentMessages(maxResults: number = 50): Promise<GmailMessage[]> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const timestamp = Math.floor(startOfDay.getTime() / 1000);

      const messagesResponse = await this.getMessages({
        q: `after:${timestamp}`,
        maxResults
      });

      if (!messagesResponse.messages?.length) {
        return [];
      }

      const messageIds = messagesResponse.messages.map(msg => msg.id);
      return this.getMultipleMessages(messageIds, 'metadata');
    } catch (error) {
      console.error('Failed to fetch recent messages:', error);
      throw error;
    }
  }

  /**
   * Get messages from specific sender
   */
  async getMessagesFromSender(senderEmail: string, maxResults: number = 50): Promise<GmailMessage[]> {
    try {
      const messagesResponse = await this.getMessages({
        q: `from:${senderEmail}`,
        maxResults
      });

      if (!messagesResponse.messages?.length) {
        return [];
      }

      const messageIds = messagesResponse.messages.map(msg => msg.id);
      return this.getMultipleMessages(messageIds, 'metadata');
    } catch (error) {
      console.error(`Failed to fetch messages from ${senderEmail}:`, error);
      throw error;
    }
  }

  /**
   * Get messages with specific label
   */
  async getMessagesWithLabel(labelId: string, maxResults: number = 50): Promise<GmailMessage[]> {
    try {
      const messagesResponse = await this.getMessages({
        labelIds: [labelId],
        maxResults
      });

      if (!messagesResponse.messages?.length) {
        return [];
      }

      const messageIds = messagesResponse.messages.map(msg => msg.id);
      return this.getMultipleMessages(messageIds, 'metadata');
    } catch (error) {
      console.error(`Failed to fetch messages with label ${labelId}:`, error);
      throw error;
    }
  }

  /**
   * Search messages
   */
  async searchMessages(query: string, maxResults: number = 50): Promise<GmailMessage[]> {
    try {
      const messagesResponse = await this.getMessages({
        q: query,
        maxResults
      });

      if (!messagesResponse.messages?.length) {
        return [];
      }

      const messageIds = messagesResponse.messages.map(msg => msg.id);
      return this.getMultipleMessages(messageIds, 'metadata');
    } catch (error) {
      console.error(`Failed to search messages with query "${query}":`, error);
      throw error;
    }
  }

  /**
   * Get threads list
   */
  async getThreads(options: {
    q?: string;
    labelIds?: string[];
    maxResults?: number;
    pageToken?: string;
    includeSpamTrash?: boolean;
  } = {}): Promise<GmailThreadsResponse> {
    try {
      const params = new URLSearchParams();
      
      if (options.q) params.set('q', options.q);
      if (options.maxResults) params.set('maxResults', options.maxResults.toString());
      if (options.pageToken) params.set('pageToken', options.pageToken);
      if (options.includeSpamTrash !== undefined) params.set('includeSpamTrash', options.includeSpamTrash.toString());
      if (options.labelIds?.length) {
        options.labelIds.forEach(labelId => params.append('labelIds', labelId));
      }

      const url = `${this.baseUrl}/users/me/threads`;
      const fullUrl = params.toString() ? `${url}?${params.toString()}` : url;

      const response = await this.authService.makeAuthenticatedRequest<GmailThreadsResponse>(fullUrl);

      return response;
    } catch (error) {
      console.error('Failed to fetch Gmail threads:', error);
      throw error;
    }
  }

  /**
   * Get a specific thread by ID
   */
  async getThread(threadId: string, format: 'minimal' | 'full' | 'metadata' = 'full'): Promise<GmailThread> {
    try {
      const params = new URLSearchParams();
      params.set('format', format);

      const response = await this.authService.makeAuthenticatedRequest<GmailThread>(
        `${this.baseUrl}/users/me/threads/${encodeURIComponent(threadId)}?${params.toString()}`
      );

      return response;
    } catch (error) {
      console.error(`Failed to fetch thread ${threadId}:`, error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  async markAsRead(messageIds: string[]): Promise<void> {
    try {
      await this.authService.makeAuthenticatedRequest(
        `${this.baseUrl}/users/me/messages/batchModify`,
        {
          method: 'POST',
          body: JSON.stringify({
            ids: messageIds,
            removeLabelIds: ['UNREAD']
          })
        }
      );
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
      throw error;
    }
  }

  /**
   * Mark messages as unread
   */
  async markAsUnread(messageIds: string[]): Promise<void> {
    try {
      await this.authService.makeAuthenticatedRequest(
        `${this.baseUrl}/users/me/messages/batchModify`,
        {
          method: 'POST',
          body: JSON.stringify({
            ids: messageIds,
            addLabelIds: ['UNREAD']
          })
        }
      );
    } catch (error) {
      console.error('Failed to mark messages as unread:', error);
      throw error;
    }
  }

  /**
   * Add labels to messages
   */
  async addLabels(messageIds: string[], labelIds: string[]): Promise<void> {
    try {
      await this.authService.makeAuthenticatedRequest(
        `${this.baseUrl}/users/me/messages/batchModify`,
        {
          method: 'POST',
          body: JSON.stringify({
            ids: messageIds,
            addLabelIds: labelIds
          })
        }
      );
    } catch (error) {
      console.error('Failed to add labels to messages:', error);
      throw error;
    }
  }

  /**
   * Remove labels from messages
   */
  async removeLabels(messageIds: string[], labelIds: string[]): Promise<void> {
    try {
      await this.authService.makeAuthenticatedRequest(
        `${this.baseUrl}/users/me/messages/batchModify`,
        {
          method: 'POST',
          body: JSON.stringify({
            ids: messageIds,
            removeLabelIds: labelIds
          })
        }
      );
    } catch (error) {
      console.error('Failed to remove labels from messages:', error);
      throw error;
    }
  }

  /**
   * Get message statistics
   */
  async getEmailStatistics(): Promise<{
    totalMessages: number;
    totalThreads: number;
    unreadCount: number;
    inboxCount: number;
    sentCount: number;
    importantCount: number;
    spamCount: number;
    trashCount: number;
  }> {
    try {
      const [profile, labels] = await Promise.all([
        this.getProfile(),
        this.getLabels()
      ]);

      // Get counts for specific labels
      const inboxLabel = labels.find(label => label.id === 'INBOX');
      const sentLabel = labels.find(label => label.id === 'SENT');
      const importantLabel = labels.find(label => label.id === 'IMPORTANT');
      const spamLabel = labels.find(label => label.id === 'SPAM');
      const trashLabel = labels.find(label => label.id === 'TRASH');

      // Get unread count
      const unreadMessages = await this.getMessages({ q: 'is:unread', maxResults: 1 });

      return {
        totalMessages: profile.messagesTotal,
        totalThreads: profile.threadsTotal,
        unreadCount: unreadMessages.resultSizeEstimate,
        inboxCount: inboxLabel?.messagesTotal || 0,
        sentCount: sentLabel?.messagesTotal || 0,
        importantCount: importantLabel?.messagesTotal || 0,
        spamCount: spamLabel?.messagesTotal || 0,
        trashCount: trashLabel?.messagesTotal || 0
      };
    } catch (error) {
      console.error('Failed to get email statistics:', error);
      throw error;
    }
  }

  /**
   * Extract email address from message header
   */
  extractEmailFromHeader(headerValue: string): string {
    const emailMatch = headerValue.match(/<([^>]+)>/);
    return emailMatch ? emailMatch[1] : headerValue;
  }

  /**
   * Get header value from message
   */
  getHeaderValue(message: GmailMessage, headerName: string): string {
    const header = message.payload.headers.find(h => h.name.toLowerCase() === headerName.toLowerCase());
    return header ? header.value : '';
  }

  /**
   * Convert Gmail message to LibreOllama format
   */
  convertToLibreOllamaFormat(message: GmailMessage): any {
    const subject = this.getHeaderValue(message, 'Subject');
    const from = this.getHeaderValue(message, 'From');
    const to = this.getHeaderValue(message, 'To');
    const date = this.getHeaderValue(message, 'Date');
    
    const isUnread = message.labelIds.includes('UNREAD');
    const isImportant = message.labelIds.includes('IMPORTANT');
    const isInInbox = message.labelIds.includes('INBOX');

    return {
      id: message.id,
      threadId: message.threadId,
      subject: subject || 'No Subject',
      from: {
        email: this.extractEmailFromHeader(from),
        name: from.replace(/<[^>]+>/, '').trim()
      },
      to: to ? this.extractEmailFromHeader(to) : '',
      date: date ? new Date(date).toISOString() : new Date(parseInt(message.internalDate)).toISOString(),
      snippet: message.snippet,
      isUnread,
      isImportant,
      isInInbox,
      hasAttachments: this.hasAttachments(message),
      labelIds: message.labelIds,
      size: message.sizeEstimate,
      source: 'gmail',
      googleMessageId: message.id,
      historyId: message.historyId
    };
  }

  /**
   * Check if message has attachments
   */
  private hasAttachments(message: GmailMessage): boolean {
    const checkParts = (parts: any[]): boolean => {
      return parts.some(part => {
        if (part.filename && part.filename.length > 0) {
          return true;
        }
        if (part.parts) {
          return checkParts(part.parts);
        }
        return false;
      });
    };

    if (message.payload.parts) {
      return checkParts(message.payload.parts);
    }

    return false;
  }

  /**
   * Get productivity insights from email data
   */
  async getProductivityInsights(): Promise<{
    todayReceived: number;
    todaySent: number;
    unreadCount: number;
    mostActiveSender: string;
    averageResponseTime: number; // hours
    emailsByHour: { hour: number; count: number }[];
  }> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const timestamp = Math.floor(startOfDay.getTime() / 1000);

      // Get today's received emails
      const [receivedToday, sentToday, unreadMessages] = await Promise.all([
        this.getMessages({ q: `in:inbox after:${timestamp}`, maxResults: 100 }),
        this.getMessages({ q: `in:sent after:${timestamp}`, maxResults: 100 }),
        this.getMessages({ q: 'is:unread', maxResults: 1 })
      ]);

      // Get detailed messages for analysis
      const receivedIds = receivedToday.messages?.map(m => m.id) || [];
      const receivedDetails = receivedIds.length > 0 ? await this.getMultipleMessages(receivedIds, 'metadata') : [];

      // Calculate sender frequency
      const senderCount: Record<string, number> = {};
      receivedDetails.forEach(msg => {
        const from = this.getHeaderValue(msg, 'From');
        const email = this.extractEmailFromHeader(from);
        senderCount[email] = (senderCount[email] || 0) + 1;
      });

      const mostActiveSender = Object.entries(senderCount)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

      // Calculate emails by hour
      const emailsByHour = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
      receivedDetails.forEach(msg => {
        const date = new Date(parseInt(msg.internalDate));
        const hour = date.getHours();
        emailsByHour[hour].count++;
      });

      return {
        todayReceived: receivedToday.resultSizeEstimate,
        todaySent: sentToday.resultSizeEstimate,
        unreadCount: unreadMessages.resultSizeEstimate,
        mostActiveSender,
        averageResponseTime: 0, // Would need more complex analysis
        emailsByHour
      };
    } catch (error) {
      console.error('Failed to get productivity insights:', error);
      throw error;
    }
  }
}