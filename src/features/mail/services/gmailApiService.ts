import { invoke } from '@tauri-apps/api/core';
import { handleGmailError } from './gmailErrorHandler';
import { gmailThrottler } from '../utils/apiThrottle';
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
  private refreshAttempted = false;
  
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
      
      // If decryption failed, clear the corrupted tokens
      if (error instanceof Error && error.message.includes('Decryption failed')) {
        console.log('🧹 [API] Clearing corrupted tokens for account:', this.accountId);
        try {
          await invoke('clear_gmail_tokens', { accountId: this.accountId });
          console.log('✅ [API] Corrupted tokens cleared, user needs to re-authenticate');
        } catch (clearError) {
          console.warn('⚠️ [API] Failed to clear corrupted tokens:', clearError);
        }
        throw new Error('Authentication tokens are corrupted - please sign out and sign in again');
      }
      
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
        // Token expired, attempt refresh (but only once per service instance)
        if (this.refreshAttempted) {
          throw new Error('Authentication failed - already attempted token refresh. User needs to re-authenticate.');
        }
        
        console.log('🔄 [API] Token expired, attempting refresh...');
        this.refreshAttempted = true;
        
        try {
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
            throw new Error(`API request failed after token refresh: ${retryResponse.status} ${retryResponse.statusText}`);
          }
          
          const data = await retryResponse.json();
          console.log(`✅ [API] Request successful (after refresh): ${endpoint}`);
          // Reset the flag on successful refresh
          this.refreshAttempted = false;
          return data;
        } catch (refreshError) {
          console.error('❌ [API] Token refresh failed:', refreshError);
          throw new Error('Authentication failed - token refresh unsuccessful. User needs to re-authenticate.');
        }
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
        throw new Error('No refresh token available - user needs to re-authenticate');
      }

      console.log('🔄 [API] Refreshing tokens...');
      
      const newTokens = await invoke<GmailTokens>('refresh_gmail_token', {
        refreshToken: tokens.refresh_token,
        redirectUri: 'http://localhost:8080/auth/gmail/callback',
      });

      if (!newTokens || !newTokens.access_token) {
        throw new Error('Failed to get new access token - refresh token may be invalid');
      }

      // Get the account email before storing tokens
      let accountEmail = '';
      try {
        // Try to get email from user profile using the new tokens directly
        const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            Authorization: `Bearer ${newTokens.access_token}`,
          },
        });
        
        if (profileResponse.ok) {
          const profile = await profileResponse.json();
          accountEmail = profile.email;
        } else {
          throw new Error('Failed to fetch profile');
        }
      } catch (profileError) {
        console.warn('⚠️ [API] Could not fetch user profile, using account ID as email fallback');
        accountEmail = this.accountId; // Use account ID as fallback
      }

      // Store the refreshed tokens
      await invoke('store_gmail_tokens_secure', {
        accountId: this.accountId,
        tokens: newTokens,
        userInfo: {
          email: accountEmail,
          name: '',
          picture: '',
        },
      });

      console.log('✅ [API] Tokens refreshed successfully');
    } catch (error) {
      console.error('❌ [API] Failed to refresh tokens:', error);
      
      // If refresh fails, the user likely needs to re-authenticate
      if (error instanceof Error && (
        error.message.includes('Invalid input') ||
        error.message.includes('invalid_grant') ||
        error.message.includes('refresh token')
      )) {
        console.error('🔐 [API] Refresh token is invalid - user needs to re-authenticate');
        // Clear invalid tokens to prevent retry loops
        try {
          await invoke('clear_gmail_tokens', { accountId: this.accountId });
        } catch (clearError) {
          console.warn('⚠️ [API] Failed to clear invalid tokens:', clearError);
        }
      }
      
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
      // First get the list of labels
      const listData = await gmailThrottler.throttle(() =>
        this.makeApiRequest<GmailListResponse<GmailLabel>>('/users/me/labels')
      );
      const labelIds = listData.labels || [];
      
      if (labelIds.length === 0) {
        return [];
      }
      
      console.log(`🏷️ [API] Got ${labelIds.length} labels, fetching details for system labels only...`);
      
      // Only fetch details for important system labels to avoid rate limiting
      const systemLabelsToFetch = ['INBOX', 'SENT', 'DRAFT', 'STARRED', 'SPAM', 'TRASH'];
      const detailedLabels = [...labelIds];
      
      // Fetch details sequentially with throttling for system labels only
      for (const labelId of systemLabelsToFetch) {
        const basicLabel = labelIds.find(l => l.id === labelId);
        if (basicLabel) {
          try {
            const detailed = await gmailThrottler.throttle(() =>
              this.makeApiRequest<GmailLabel>(`/users/me/labels/${labelId}`)
            );
            const index = detailedLabels.findIndex(l => l.id === labelId);
            if (index >= 0) {
              detailedLabels[index] = detailed;
            }
          } catch (err) {
            console.warn(`⚠️ [API] Failed to fetch details for label ${labelId}:`, err);
          }
        }
      }
      
      // Log INBOX label info specifically for debugging
      const inboxLabel = detailedLabels.find(label => label.id === 'INBOX');
      if (inboxLabel) {
        console.log(`📧 [API] INBOX label stats - Total: ${inboxLabel.messagesTotal}, Unread: ${inboxLabel.messagesUnread}`);
      }
      
      return detailedLabels;
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
  ): Promise<{ messages: ParsedEmail[]; nextPageToken?: string; resultSizeEstimate?: number }> {
    try {
      // Build query parameters
      const params = new URLSearchParams({
        maxResults: maxResults.toString(),
      });
      
      // Only add labelIds if they are valid
      const validLabelIds = labelIds.filter(id => id && id !== 'undefined');
      if (validLabelIds.length > 0) {
        params.append('labelIds', validLabelIds.join(','));
      }
      
      if (pageToken) params.append('pageToken', pageToken);
      if (query) params.append('q', query);

      console.log(`🔍 [API] Fetching messages with labels: ${validLabelIds.join(', ')}`);
      
      // First, get list of message IDs (throttled)
      const listData = await gmailThrottler.throttle(() =>
        this.makeApiRequest<GmailListResponse<{ id: string; threadId: string }>>(`/users/me/messages?${params}`)
      );
      
      if (!listData.messages || listData.messages.length === 0) {
        console.log('📭 [API] No messages found');
        return { 
          messages: [], 
          nextPageToken: listData.nextPageToken,
          resultSizeEstimate: listData.resultSizeEstimate || 0
        };
      }

      console.log(`📨 [API] Found ${listData.messages.length} messages (estimated total: ${listData.resultSizeEstimate}), fetching details sequentially...`);
      
      // Fetch messages sequentially with throttling to avoid rate limits
      const messages: ParsedEmail[] = [];
      for (const msgRef of listData.messages) {
        try {
          const message = await gmailThrottler.throttle(() =>
            this.getMessage(msgRef.id)
          );
          if (message) {
            messages.push(message);
          }
        } catch (error) {
          console.warn(`⚠️ [API] Failed to fetch message ${msgRef.id}:`, error);
          // Continue with other messages instead of failing entirely
        }
      }
      
      console.log(`✅ [API] Successfully parsed ${messages.length} messages`);
      
      return {
        messages,
        nextPageToken: listData.nextPageToken,
        resultSizeEstimate: listData.resultSizeEstimate,
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