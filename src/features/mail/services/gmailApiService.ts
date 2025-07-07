import { invoke } from '@tauri-apps/api/core';
import { handleGmailError } from './gmailErrorHandler';
import type { 
  GmailMessage, 
  GmailLabel, 
  GmailThread, 
  GmailListResponse, 
  ParsedEmail,
  EmailAddress,
  GmailTokens,
  GmailAccount
} from '../types';

export class GmailApiService {
  private static BASE_URL = 'https://www.googleapis.com/gmail/v1';
  
  constructor(private accountId: string) {}

  /**
   * Get stored tokens for the account
   */
  private async getTokens(): Promise<GmailTokens> {
    try {
      const tokens = await invoke<GmailTokens>('get_gmail_tokens_secure', {
        accountId: this.accountId
      });
      
      if (!tokens) {
        throw new Error('No tokens found for account');
      }
      
      return tokens;
    } catch (error) {
      console.error('❌ [API] Failed to get tokens:', error);
      throw error;
    }
  }

  /**
   * Make authenticated API request to Gmail
   */
  private async makeApiRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const tokens = await this.getTokens();
      
      const url = `${GmailApiService.BASE_URL}${endpoint}`;
      const headers = {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      };

      console.log(`🌐 [API] Making request to: ${endpoint}`);
      
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        // Token expired, attempt refresh
        console.log('🔄 [API] Token expired, attempting refresh...');
        await this.refreshTokens();
        
        // Retry with new token
        const newTokens = await this.getTokens();
        const retryResponse = await fetch(url, {
          ...options,
          headers: {
            ...headers,
            'Authorization': `Bearer ${newTokens.access_token}`,
          },
        });
        
        if (!retryResponse.ok) {
          throw new Error(`API request failed: ${retryResponse.status} ${retryResponse.statusText}`);
        }
        
        const data = await retryResponse.json();
        console.log(`✅ [API] Request successful (after refresh): ${endpoint}`);
        return data;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [API] Request failed: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ [API] Request successful: ${endpoint}`);
      return data;
    } catch (error) {
      console.error(`❌ [API] Error in ${endpoint}:`, error);
      throw handleGmailError(error, {
        operation: 'api_request',
        accountId: this.accountId,
      });
    }
  }

  /**
   * Refresh access token
   */
  private async refreshTokens(): Promise<void> {
    try {
      const tokens = await this.getTokens();
      
      if (!tokens.refresh_token) {
        throw new Error('No refresh token available');
      }

      console.log('🔄 [API] Refreshing tokens...');
      
      const newTokens = await invoke<GmailTokens>('refresh_gmail_token', {
        refreshToken: tokens.refresh_token,
        redirectUri: 'http://localhost:8080/auth/gmail/callback',
      });

      // Store the refreshed tokens
      await invoke('store_gmail_tokens_secure', {
        accountId: this.accountId,
        tokens: newTokens,
        userInfo: {
          email: '', // Email will be fetched if needed
          name: '',
          picture: '',
        },
      });

      console.log('✅ [API] Tokens refreshed successfully');
    } catch (error) {
      console.error('❌ [API] Failed to refresh tokens:', error);
      throw error;
    }
  }

  /**
   * Fetch user profile information
   */
  async getUserProfile(): Promise<{ email: string; name?: string; picture?: string; id: string }> {
    try {
      const tokens = await this.getTokens();
      
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user profile: ${response.status}`);
      }

      const profile = await response.json();
      console.log('✅ [API] User profile fetched:', profile.email);
      
      return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
      };
    } catch (error) {
      console.error('❌ [API] Failed to get user profile:', error);
      throw error;
    }
  }

  /**
   * Fetch Gmail labels
   */
  async getLabels(): Promise<GmailLabel[]> {
    try {
      const data = await this.makeApiRequest<GmailListResponse<GmailLabel>>('/users/me/labels');
      return data.labels || [];
    } catch (error) {
      console.error('❌ [API] Failed to fetch labels:', error);
      throw error;
    }
  }

  /**
   * Fetch messages from a specific label
   */
  async getMessages(
    labelIds: string[] = ['INBOX'],
    maxResults: number = 50,
    pageToken?: string,
    query?: string
  ): Promise<{ messages: ParsedEmail[]; nextPageToken?: string }> {
    try {
      // Build query parameters
      const params = new URLSearchParams({
        maxResults: maxResults.toString(),
        labelIds: labelIds.join(','),
      });
      
      if (pageToken) params.append('pageToken', pageToken);
      if (query) params.append('q', query);

      console.log(`🔍 [API] Fetching messages with labels: ${labelIds.join(', ')}`);
      
      // First, get list of message IDs
      const listData = await this.makeApiRequest<GmailListResponse<{ id: string; threadId: string }>>(`/users/me/messages?${params}`);
      
      if (!listData.messages || listData.messages.length === 0) {
        console.log('📭 [API] No messages found');
        return { messages: [], nextPageToken: listData.nextPageToken };
      }

      console.log(`📨 [API] Found ${listData.messages.length} messages, fetching details...`);
      
      // Fetch detailed information for each message
      const messagePromises = listData.messages.map(msg => 
        this.getMessage(msg.id)
      );
      
      const messages = await Promise.all(messagePromises);
      
      console.log(`✅ [API] Successfully parsed ${messages.length} messages`);
      
      return {
        messages: messages.filter(msg => msg !== null) as ParsedEmail[],
        nextPageToken: listData.nextPageToken,
      };
    } catch (error) {
      console.error('❌ [API] Failed to fetch messages:', error);
      throw error;
    }
  }

  /**
   * Fetch a specific message by ID
   */
  async getMessage(messageId: string): Promise<ParsedEmail | null> {
    try {
      const data = await this.makeApiRequest<GmailMessage>(`/users/me/messages/${messageId}`);
      return this.parseGmailMessage(data);
    } catch (error) {
      console.error(`❌ [API] Failed to fetch message ${messageId}:`, error);
      return null;
    }
  }

  /**
   * Fetch a thread by ID
   */
  async getThread(threadId: string): Promise<{ messages: ParsedEmail[] }> {
    try {
      const data = await this.makeApiRequest<GmailThread>(`/users/me/threads/${threadId}`);
      
      const messages = data.messages
        .map(msg => this.parseGmailMessage(msg))
        .filter(msg => msg !== null) as ParsedEmail[];
      
      return { messages };
    } catch (error) {
      console.error(`❌ [API] Failed to fetch thread ${threadId}:`, error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  async markAsRead(messageIds: string[]): Promise<void> {
    try {
      await this.makeApiRequest(`/users/me/messages/batchModify`, {
        method: 'POST',
        body: JSON.stringify({
          ids: messageIds,
          removeLabelIds: ['UNREAD'],
        }),
      });
      
      console.log(`✅ [API] Marked ${messageIds.length} messages as read`);
    } catch (error) {
      console.error('❌ [API] Failed to mark messages as read:', error);
      throw error;
    }
  }

  /**
   * Mark messages as unread
   */
  async markAsUnread(messageIds: string[]): Promise<void> {
    try {
      await this.makeApiRequest(`/users/me/messages/batchModify`, {
        method: 'POST',
        body: JSON.stringify({
          ids: messageIds,
          addLabelIds: ['UNREAD'],
        }),
      });
      
      console.log(`✅ [API] Marked ${messageIds.length} messages as unread`);
    } catch (error) {
      console.error('❌ [API] Failed to mark messages as unread:', error);
      throw error;
    }
  }

  /**
   * Star messages
   */
  async starMessages(messageIds: string[]): Promise<void> {
    try {
      await this.makeApiRequest(`/users/me/messages/batchModify`, {
        method: 'POST',
        body: JSON.stringify({
          ids: messageIds,
          addLabelIds: ['STARRED'],
        }),
      });
      
      console.log(`✅ [API] Starred ${messageIds.length} messages`);
    } catch (error) {
      console.error('❌ [API] Failed to star messages:', error);
      throw error;
    }
  }

  /**
   * Unstar messages
   */
  async unstarMessages(messageIds: string[]): Promise<void> {
    try {
      await this.makeApiRequest(`/users/me/messages/batchModify`, {
        method: 'POST',
        body: JSON.stringify({
          ids: messageIds,
          removeLabelIds: ['STARRED'],
        }),
      });
      
      console.log(`✅ [API] Unstarred ${messageIds.length} messages`);
    } catch (error) {
      console.error('❌ [API] Failed to unstar messages:', error);
      throw error;
    }
  }

  /**
   * Archive messages (remove from INBOX)
   */
  async archiveMessages(messageIds: string[]): Promise<void> {
    try {
      await this.makeApiRequest(`/users/me/messages/batchModify`, {
        method: 'POST',
        body: JSON.stringify({
          ids: messageIds,
          removeLabelIds: ['INBOX'],
        }),
      });
      
      console.log(`✅ [API] Archived ${messageIds.length} messages`);
    } catch (error) {
      console.error('❌ [API] Failed to archive messages:', error);
      throw error;
    }
  }

  /**
   * Delete messages (move to trash)
   */
  async deleteMessages(messageIds: string[]): Promise<void> {
    try {
      const deletePromises = messageIds.map(id =>
        this.makeApiRequest(`/users/me/messages/${id}/trash`, { method: 'POST' })
      );
      
      await Promise.all(deletePromises);
      
      console.log(`✅ [API] Deleted ${messageIds.length} messages`);
    } catch (error) {
      console.error('❌ [API] Failed to delete messages:', error);
      throw error;
    }
  }

  /**
   * Parse Gmail message to our internal format
   */
  private parseGmailMessage(gmailMessage: GmailMessage): ParsedEmail | null {
    try {
      const headers = gmailMessage.payload.headers;
      const getHeader = (name: string) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';
      
      const parseEmailAddress = (address: string): EmailAddress => {
        const match = address.match(/^(.+?)\s*<(.+?)>$/) || address.match(/^(.+)$/);
        if (match && match[2]) {
          return { name: match[1].trim(), email: match[2].trim() };
        }
        return { email: match ? match[1].trim() : address };
      };

      const parseEmailList = (addressString: string): EmailAddress[] => {
        if (!addressString) return [];
        return addressString.split(',').map(addr => parseEmailAddress(addr.trim()));
      };

      // Extract body content
      const extractBody = (payload: any): string => {
        if (payload.body && payload.body.data) {
          return atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        }
        
        if (payload.parts) {
          for (const part of payload.parts) {
            if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
              const body = extractBody(part);
              if (body) return body;
            }
          }
          
          // If no text parts found, try recursively
          for (const part of payload.parts) {
            const body = extractBody(part);
            if (body) return body;
          }
        }
        
        return '';
      };

      const body = extractBody(gmailMessage.payload);
      
      // Check for attachments
      const hasAttachments = (payload: any): boolean => {
        if (payload.filename && payload.filename.length > 0) {
          return true;
        }
        if (payload.parts) {
          return payload.parts.some((part: any) => hasAttachments(part));
        }
        return false;
      };

      const parsedMessage: ParsedEmail = {
        id: gmailMessage.id,
        threadId: gmailMessage.threadId,
        accountId: this.accountId,
        subject: getHeader('Subject'),
        from: parseEmailAddress(getHeader('From')),
        to: parseEmailList(getHeader('To')),
        cc: parseEmailList(getHeader('Cc')),
        bcc: parseEmailList(getHeader('Bcc')),
        date: new Date(parseInt(gmailMessage.internalDate || '0')),
        body: body,
        snippet: gmailMessage.snippet || '',
        isRead: !gmailMessage.labelIds.includes('UNREAD'),
        isStarred: gmailMessage.labelIds.includes('STARRED'),
        hasAttachments: hasAttachments(gmailMessage.payload),
        attachments: [], // TODO: Parse attachments
        labels: gmailMessage.labelIds,
        importance: gmailMessage.labelIds.includes('IMPORTANT') ? 'high' : 'normal',
        messageId: getHeader('Message-ID'),
        references: getHeader('References') ? getHeader('References').split(' ') : undefined,
        inReplyTo: getHeader('In-Reply-To') || undefined,
      };

      return parsedMessage;
    } catch (error) {
      console.error('❌ [API] Failed to parse Gmail message:', error);
      return null;
    }
  }
}

/**
 * Factory function to create Gmail API service for an account
 */
export const createGmailApiService = (accountId: string): GmailApiService => {
  return new GmailApiService(accountId);
};

/**
 * Get Gmail API service for current account
 */
export const getGmailApiService = (accountId?: string): GmailApiService | null => {
  if (!accountId) {
    console.warn('⚠️ [API] No account ID provided for Gmail API service');
    return null;
  }
  
  return new GmailApiService(accountId);
}; 