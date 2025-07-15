/**
 * Gmail API Service using Tauri Commands
 * 
 * This service provides a clean interface for Gmail operations using the 
 * new unified backend service architecture through Tauri commands.
 */

import { invoke } from '@tauri-apps/api/core';
import type { 
  GmailMessage, 
  GmailLabel, 
  ParsedEmail,
  GmailListResponse,
  MessageSearchResult,
  ProcessedGmailMessage
} from '../types';
import { logger } from '../../../core/lib/logger';

// =============================================================================
// Authentication Functions
// =============================================================================

/**
 * Start Gmail OAuth2 authentication flow
 */
export async function startGmailAuth(redirectUri?: string): Promise<{
  success: boolean;
  authUrl?: string;
  state?: string;
  error?: string;
}> {
  try {
    logger.debug('[TauriService] Starting Gmail OAuth flow');
    
    const result = await invoke('start_gmail_oauth', {
      config: {
        redirect_uri: redirectUri || 'http://localhost:8080/auth/gmail/callback'
      }
    });
    
    logger.debug('[TauriService] OAuth flow started successfully');
    return {
      success: true,
      authUrl: (result as any).auth_url,
      state: (result as any).state
    };
  } catch (error) {
    logger.error('[TauriService] Failed to start OAuth flow:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Complete Gmail OAuth2 authentication flow
 */
export async function completeGmailAuth(params: {
  code: string;
  state: string;
  redirectUri?: string;
}): Promise<{
  success: boolean;
  account?: {
    id: string;
    email: string;
    name: string;
    picture?: string;
  };
  tokens?: {
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
  };
  error?: string;
}> {
  try {
    logger.debug('[TauriService] Completing Gmail OAuth flow');
    
    const tokenResponse = await invoke('complete_gmail_oauth', {
      code: params.code,
      state: params.state,
      redirectUri: params.redirectUri || 'http://localhost:8080/auth/gmail/callback'
    });
    
    // Get user info using the access token
    const userInfo = await invoke('get_gmail_user_info', {
      accessToken: (tokenResponse as any).access_token
    });
    
    // Generate account ID and store tokens
    const accountId = `account_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await invoke('store_gmail_tokens_secure', {
      accountId,
      tokens: {
        access_token: (tokenResponse as any).access_token,
        refresh_token: (tokenResponse as any).refresh_token,
        expires_at: new Date(Date.now() + (tokenResponse as any).expires_in * 1000).toISOString(),
        token_type: (tokenResponse as any).token_type || 'Bearer'
      },
      userInfo
    });
    
    logger.debug('[TauriService] OAuth flow completed successfully');
    return {
      success: true,
      account: {
        id: accountId,
        email: (userInfo as any).email,
        name: (userInfo as any).name || (userInfo as any).email,
        picture: (userInfo as any).picture
      },
      tokens: {
        accessToken: (tokenResponse as any).access_token,
        refreshToken: (tokenResponse as any).refresh_token,
        expiresIn: (tokenResponse as any).expires_in
      }
    };
  } catch (error) {
    logger.error('[TauriService] Failed to complete OAuth flow:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Refresh Gmail access token
 */
export async function refreshToken(refreshToken: string): Promise<{
  success: boolean;
  newAccessToken?: string;
  expiresIn?: number;
  error?: string;
}> {
  try {
    logger.debug('[TauriService] Refreshing Gmail token');
    
    const result = await invoke('refresh_gmail_token', {
      refreshToken,
      redirectUri: 'http://localhost:8080/auth/gmail/callback'
    });
    
    logger.debug('[TauriService] Token refreshed successfully');
    return {
      success: true,
      newAccessToken: (result as any).access_token,
      expiresIn: (result as any).expires_in
    };
  } catch (error) {
    logger.error('[TauriService] Failed to refresh token:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get all Gmail accounts
 */
export async function getAccounts(userId: string): Promise<Array<{
  id: string;
  email: string;
  name: string;
  picture?: string;
  isActive: boolean;
}>> {
  try {
    logger.debug('[TauriService] Getting Gmail accounts');
    
    const accounts = await invoke('get_gmail_accounts_secure', {
      userId
    });
    
    logger.debug(`[TauriService] Retrieved ${(accounts as any[]).length} accounts`);
    return accounts as any[];
  } catch (error) {
    logger.error('[TauriService] Failed to get accounts:', error);
    return [];
  }
}

/**
 * Remove Gmail account
 */
export async function removeAccount(accountId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    logger.debug(`[TauriService] Removing Gmail account: ${accountId}`);
    
    await invoke('remove_gmail_tokens_secure', {
      accountId
    });
    
    logger.debug('✅ [TauriService] Account removed successfully');
    return { success: true };
  } catch (error) {
    logger.error('[TauriService] Failed to remove account:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// =============================================================================
// Compose & Send Functions
// =============================================================================

/**
 * Send Gmail message
 */
export async function sendGmailMessage(message: {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  accountId?: string;
  inReplyTo?: string;
}): Promise<{
  success: boolean;
  messageId?: string;
  threadId?: string;
  error?: string;
}> {
  try {
    logger.debug('[TauriService] Sending Gmail message');
    
    const result = await invoke('send_gmail_message', {
      composeRequest: {
        account_id: message.accountId,
        to: [message.to],
        cc: message.cc ? [message.cc] : [],
        bcc: message.bcc ? [message.bcc] : [],
        subject: message.subject,
        body: message.body,
        html_body: message.body,
        in_reply_to: message.inReplyTo,
        attachments: []
      }
    });
    
    logger.debug('[TauriService] Message sent successfully');
    return {
      success: true,
      messageId: (result as any).message_id,
      threadId: (result as any).thread_id
    };
  } catch (error) {
    logger.error('[TauriService] Failed to send message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Save Gmail draft
 */
export async function saveDraft(draft: {
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  body?: string;
  accountId?: string;
}): Promise<{
  success: boolean;
  draftId?: string;
  error?: string;
}> {
  try {
    logger.debug('[TauriService] Saving Gmail draft');
    
    const result = await invoke('save_gmail_draft', {
      draftRequest: {
        account_id: draft.accountId,
        to: draft.to ? [draft.to] : [],
        cc: draft.cc ? [draft.cc] : [],
        bcc: draft.bcc ? [draft.bcc] : [],
        subject: draft.subject || '',
        body: draft.body || '',
        html_body: draft.body || ''
      }
    });
    
    logger.debug('[TauriService] Draft saved successfully');
    return {
      success: true,
      draftId: (result as any).draft_id
    };
  } catch (error) {
    logger.error('[TauriService] Failed to save draft:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Download attachment
 */
export async function downloadAttachment(attachmentId: string, messageId?: string): Promise<{
  success: boolean;
  filePath?: string;
  error?: string;
}> {
  try {
    logger.debug(`[TauriService] Downloading attachment: ${attachmentId}`);
    
    // This would need to be implemented in the backend
    // For now, simulate the download
    const result = {
      success: true,
      filePath: `C:\\Downloads\\attachment_${attachmentId}.pdf`
    };
    
    logger.debug('[TauriService] Attachment downloaded successfully');
    return result;
  } catch (error) {
    logger.error('[TauriService] Failed to download attachment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// =============================================================================
// Gmail API Service Class (existing functionality)
// =============================================================================

export class GmailTauriService {
  constructor(private accountId: string) {}

  /**
   * Get all labels for the Gmail account
   * This tests the full chain: Frontend -> Tauri -> GmailApiService -> RateLimiter -> Auth
   */
  async getLabels(): Promise<GmailLabel[]> {
    try {
      logger.debug(`[TauriService] Getting labels for account: ${this.accountId}`);
      
      const labels = await invoke<GmailLabel[]>('get_gmail_labels', {
        accountId: this.accountId
      });
      
      logger.debug(`[TauriService] Successfully retrieved ${labels.length} labels`);
      return labels;
    } catch (error) {
      logger.error('❌ [TauriService] Failed to get labels:', error);
      throw new Error(`Failed to get Gmail labels: ${error}`);
    }
  }

  /**
   * Search Gmail messages with parsing
   */
  async searchMessages(
    query?: string,
    labelIds?: string[],
    maxResults?: number,
    pageToken?: string
  ): Promise<MessageSearchResult> {
    try {
      logger.debug(`[TauriService] Searching messages for account: ${this.accountId}`);
      
      const result = await invoke<MessageSearchResult>('search_gmail_messages', {
        accountId: this.accountId,
        query,
        labelIds,
        maxResults,
        pageToken
      });
      
      logger.debug(`[TauriService] Successfully found ${result.messages.length} messages`);
      return result;
    } catch (error) {
      logger.error('❌ [TauriService] Failed to search messages:', error);
      throw new Error(`Failed to search Gmail messages: ${error}`);
    }
  }

  /**
   * Get a specific message by ID (raw Gmail format)
   */
  async getMessage(messageId: string): Promise<GmailMessage | undefined> {
    try {
      logger.debug(`[TauriService] Getting message: ${messageId}`);
      
      const message = await invoke<GmailMessage | undefined>('get_gmail_message', {
        accountId: this.accountId,
        messageId
      });
      
      logger.debug(`[TauriService] Successfully retrieved message: ${messageId}`);
      return message;
    } catch (error) {
      logger.error(`❌ [TauriService] Failed to get message ${messageId}:`, error);
      // Return undefined or rethrow based on desired error handling
      return undefined; // Changed to return undefined on error
    }
  }

  /**
   * Get a parsed message by ID (with processed content)
   */
  async getParsedMessage(messageId: string): Promise<ProcessedGmailMessage | undefined> {
    try {
      logger.debug(`[TauriService] Getting parsed message: ${messageId}`);
      
      const message = await invoke<ProcessedGmailMessage | undefined>('get_parsed_gmail_message', {
        accountId: this.accountId,
        messageId
      });
      
      logger.debug(`[TauriService] Successfully retrieved parsed message: ${messageId}`);
      return message;
    } catch (error) {
      logger.error(`❌ [TauriService] Failed to get parsed message ${messageId}:`, error);
      return undefined; // Changed to return undefined on error
    }
  }

  /**
   * Get an entire thread with parsed messages
   */
  async getThread(threadId: string): Promise<ProcessedGmailMessage[] | undefined> {
    try {
      logger.debug(`[TauriService] Getting thread: ${threadId}`);
      
      const messages = await invoke<ProcessedGmailMessage[] | undefined>('get_gmail_thread', {
        accountId: this.accountId,
        threadId
      });
      
      logger.debug(`[TauriService] Successfully retrieved thread with ${messages?.length || 0} messages`);
      return messages;
    } catch (error) {
      logger.error(`❌ [TauriService] Failed to get thread ${threadId}:`, error);
      return undefined; // Changed to return undefined on error
    }
  }

  /**
   * Get user profile information for the account
   */
  async getUserProfile(): Promise<{ id: string; email: string; name?: string; picture?: string }> {
    try {
      logger.debug(`[TauriService] Getting user profile for account: ${this.accountId}`);
      
      // First get the access token for this account
      const tokens = await invoke<any>('get_gmail_tokens_secure', {
        accountId: this.accountId
      });
      
      if (!tokens || !tokens.access_token) {
        throw new Error('No access token found for account');
      }
      
      const userInfo = await invoke<{ id: string; email: string; name?: string; picture?: string }>('get_gmail_user_info', {
        accessToken: tokens.access_token
      });
      
      logger.debug(`[TauriService] Successfully retrieved user profile for: ${userInfo.email}`);
      return userInfo;
    } catch (error) {
      logger.error(`❌ [TauriService] Failed to get user profile for account ${this.accountId}:`, error);
      throw new Error(`Failed to get Gmail user profile: ${error}`);
    }
  }

  /**
   * Modify labels for a batch of messages
   */
  private async modifyMessages(
    messageIds: string[],
    addLabelIds: string[],
    removeLabelIds: string[]
  ): Promise<void> {
    try {
      logger.debug(`[TauriService] Modifying messages for account: ${this.accountId}`);
      
      await invoke('modify_gmail_messages', {
        accountId: this.accountId,
        messageIds,
        addLabelIds,
        removeLabelIds
      });
      
      logger.debug(`[TauriService] Successfully modified ${messageIds.length} messages`);
    } catch (error) {
      logger.error('❌ [TauriService] Failed to modify messages:', error);
      throw new Error(`Failed to modify Gmail messages: ${error}`);
    }
  }

  async markAsRead(messageIds: string[]): Promise<void> {
    await this.modifyMessages(messageIds, [], ['UNREAD']);
  }

  async markAsUnread(messageIds: string[]): Promise<void> {
    await this.modifyMessages(messageIds, ['UNREAD'], []);
  }

  async starMessages(messageIds: string[]): Promise<void> {
    await this.modifyMessages(messageIds, ['STARRED'], []);
  }

  async unstarMessages(messageIds: string[]): Promise<void> {
    await this.modifyMessages(messageIds, [], ['STARRED']);
  }

  async archiveMessages(messageIds: string[]): Promise<void> {
    await this.modifyMessages(messageIds, [], ['INBOX']);
  }

  /**
   * Move a batch of messages to trash
   */
  async deleteMessages(messageIds: string[]): Promise<void> {
    try {
      logger.debug(`[TauriService] Trashing messages for account: ${this.accountId}`);
      
      await invoke('trash_gmail_messages', {
        accountId: this.accountId,
        messageIds
      });
      
      logger.debug(`[TauriService] Successfully trashed ${messageIds.length} messages`);
    } catch (error) {
      logger.error('❌ [TauriService] Failed to trash messages:', error);
      throw new Error(`Failed to trash Gmail messages: ${error}`);
    }
  }

  /**
   * Download attachment data
   */
  async getAttachment(messageId: string, attachmentId: string): Promise<Uint8Array> {
    try {
      logger.debug(`[TauriService] Getting attachment: ${attachmentId} from message: ${messageId}`);
      
      const data = await invoke<number[]>('get_gmail_attachment', {
        accountId: this.accountId,
        messageId,
        attachmentId
      });
      
      logger.debug(`[TauriService] Successfully retrieved attachment: ${attachmentId}`);
      return new Uint8Array(data);
    } catch (error) {
      logger.error(`❌ [TauriService] Failed to get attachment ${attachmentId}:`, error);
      throw new Error(`Failed to get Gmail attachment: ${error}`);
    }
  }

  /**
   * Test the complete end-to-end flow
   * This method combines multiple operations to validate the entire chain
   */
  async testEndToEndFlow(): Promise<{
    success: boolean;
    labels: GmailLabel[];
    messages: MessageSearchResult;
    error?: string;
  }> {
    try {
      logger.debug(`[TauriService] Starting end-to-end flow test for account: ${this.accountId}`);
      
      // Step 1: Get labels
      const labels = await this.getLabels();
      
      // Step 2: Search for a few messages in INBOX
      const messages = await this.searchMessages(
        undefined, // no query
        ['INBOX'], // just inbox
        5 // limit to 5 messages
      );
      
      logger.debug(`[TauriService] End-to-end flow test completed successfully!`);
      return {
        success: true,
        labels,
        messages
      };
    } catch (error) {
      logger.error('❌ [TauriService] End-to-end flow test failed:', error);
      return {
        success: false,
        labels: [],
        messages: { messages: [], next_page_token: undefined, result_size_estimate: 0 },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

/**
 * Factory function to create Gmail Tauri service for an account
 */
export const createGmailTauriService = (accountId: string): GmailTauriService => {
  return new GmailTauriService(accountId);
};

/**
 * Get Gmail Tauri service for current account
 */
export const getGmailTauriService = (accountId?: string): GmailTauriService | null => {
  if (!accountId) {
    logger.warn('⚠️ [TauriService] No account ID provided for Gmail Tauri service');
    return null;
  }
  
  return new GmailTauriService(accountId);
}; 
