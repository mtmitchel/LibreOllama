import { invoke } from '@tauri-apps/api/core';

export interface ParsedEmailMessage {
  message_id?: string;
  thread_id?: string;
  subject?: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc: EmailAddress[];
  bcc: EmailAddress[];
  reply_to?: EmailAddress;
  date?: string;
  body_text?: string;
  body_html?: string;
  attachments: EmailAttachment[];
  headers: { [key: string]: string };
  is_multipart: boolean;
  content_type: string;
  size_estimate?: number;
}

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  id: string;
  filename?: string;
  content_type: string;
  size?: number;
  content_id?: string;
  is_inline: boolean;
  data?: Uint8Array;
}

export interface ProcessedGmailMessage {
  id: string;
  thread_id: string;
  parsed_content: ParsedEmailMessage;
  labels: string[];
  snippet?: string;
  internal_date?: string;
  size_estimate?: number;
}

export interface EmailSyncResult {
  messages_processed: number;
  messages_failed: number;
  errors: string[];
  last_history_id?: string;
}

export interface EmailSearchQuery {
  account_id: string;
  query?: string;
  label_ids?: string[];
  max_results?: number;
  page_token?: string;
}

export interface EmailSearchResult {
  messages: ProcessedGmailMessage[];
  next_page_token?: string;
  result_size_estimate?: number;
}

export class GmailParsingService {
  /**
   * Parse a specific Gmail message with full MIME parsing
   */
  static async parseGmailMessage(
    accountId: string,
    messageId: string
  ): Promise<ProcessedGmailMessage> {
    try {
      const result = await invoke<ProcessedGmailMessage>('parse_gmail_message', {
        accountId,
        messageId,
      });
      return result;
    } catch (error) {
      console.error('Failed to parse Gmail message:', error);
      throw new Error(`Failed to parse Gmail message: ${error}`);
    }
  }

  /**
   * Parse all messages in a Gmail thread
   */
  static async parseGmailThread(
    accountId: string,
    threadId: string
  ): Promise<ProcessedGmailMessage[]> {
    try {
      const result = await invoke<ProcessedGmailMessage[]>('parse_gmail_thread', {
        accountId,
        threadId,
      });
      return result;
    } catch (error) {
      console.error('Failed to parse Gmail thread:', error);
      throw new Error(`Failed to parse Gmail thread: ${error}`);
    }
  }

  /**
   * Search and parse Gmail messages with advanced filtering
   */
  static async searchAndParseGmailMessages(
    searchQuery: EmailSearchQuery
  ): Promise<EmailSearchResult> {
    try {
      const result = await invoke<EmailSearchResult>('search_and_parse_gmail_messages', {
        searchQuery,
      });
      return result;
    } catch (error) {
      console.error('Failed to search and parse Gmail messages:', error);
      throw new Error(`Failed to search and parse Gmail messages: ${error}`);
    }
  }

  /**
   * Extract plain text from HTML email content
   */
  static async extractTextFromHtml(htmlContent: string): Promise<string> {
    try {
      const result = await invoke<string>('extract_text_from_html', {
        htmlContent,
      });
      return result;
    } catch (error) {
      console.error('Failed to extract text from HTML:', error);
      throw new Error(`Failed to extract text from HTML: ${error}`);
    }
  }

  /**
   * Sync Gmail messages to local database
   */
  static async syncGmailMessages(
    accountId: string,
    labelId?: string,
    maxMessages?: number
  ): Promise<EmailSyncResult> {
    try {
      const result = await invoke<EmailSyncResult>('sync_gmail_messages', {
        accountId,
        labelId,
        maxMessages,
      });
      return result;
    } catch (error) {
      console.error('Failed to sync Gmail messages:', error);
      throw new Error(`Failed to sync Gmail messages: ${error}`);
    }
  }

  /**
   * Get attachment content from Gmail API
   */
  static async getGmailAttachment(
    accountId: string,
    messageId: string,
    attachmentId: string
  ): Promise<Uint8Array> {
    try {
      const result = await invoke<number[]>('get_gmail_attachment', {
        accountId,
        messageId,
        attachmentId,
      });
      return new Uint8Array(result);
    } catch (error) {
      console.error('Failed to get Gmail attachment:', error);
      throw new Error(`Failed to get Gmail attachment: ${error}`);
    }
  }

  /**
   * Get parsed message content with fallback to basic parsing
   */
  static async getMessageContent(
    accountId: string,
    messageId: string
  ): Promise<{
    subject: string;
    from: EmailAddress;
    to: EmailAddress[];
    body_text?: string;
    body_html?: string;
    attachments: EmailAttachment[];
    date?: string;
  }> {
    try {
      const message = await this.parseGmailMessage(accountId, messageId);
      
      return {
        subject: message.parsed_content.subject || 'No Subject',
        from: message.parsed_content.from,
        to: message.parsed_content.to,
        body_text: message.parsed_content.body_text,
        body_html: message.parsed_content.body_html,
        attachments: message.parsed_content.attachments,
        date: message.parsed_content.date,
      };
    } catch (error) {
      console.error('Failed to get message content:', error);
      throw error;
    }
  }

  /**
   * Get thread messages with full parsing
   */
  static async getThreadMessages(
    accountId: string,
    threadId: string
  ): Promise<ProcessedGmailMessage[]> {
    try {
      const messages = await this.parseGmailThread(accountId, threadId);
      
      // Sort by date if available
      messages.sort((a, b) => {
        const dateA = a.parsed_content.date ? new Date(a.parsed_content.date).getTime() : 0;
        const dateB = b.parsed_content.date ? new Date(b.parsed_content.date).getTime() : 0;
        return dateA - dateB;
      });
      
      return messages;
    } catch (error) {
      console.error('Failed to get thread messages:', error);
      throw error;
    }
  }

  /**
   * Search emails with parsing and filtering
   */
  static async searchEmails(
    accountId: string,
    query?: string,
    labelIds?: string[],
    maxResults: number = 25
  ): Promise<ProcessedGmailMessage[]> {
    try {
      const searchQuery: EmailSearchQuery = {
        account_id: accountId,
        query,
        label_ids: labelIds,
        max_results: maxResults,
      };
      
      const result = await this.searchAndParseGmailMessages(searchQuery);
      return result.messages;
    } catch (error) {
      console.error('Failed to search emails:', error);
      throw error;
    }
  }

  /**
   * Get inbox messages with parsing
   */
  static async getInboxMessages(
    accountId: string,
    maxResults: number = 25
  ): Promise<ProcessedGmailMessage[]> {
    return this.searchEmails(accountId, undefined, ['INBOX'], maxResults);
  }

  /**
   * Get sent messages with parsing
   */
  static async getSentMessages(
    accountId: string,
    maxResults: number = 25
  ): Promise<ProcessedGmailMessage[]> {
    return this.searchEmails(accountId, undefined, ['SENT'], maxResults);
  }

  /**
   * Get unread messages with parsing
   */
  static async getUnreadMessages(
    accountId: string,
    maxResults: number = 25
  ): Promise<ProcessedGmailMessage[]> {
    return this.searchEmails(accountId, 'is:unread', undefined, maxResults);
  }

  /**
   * Get starred messages with parsing
   */
  static async getStarredMessages(
    accountId: string,
    maxResults: number = 25
  ): Promise<ProcessedGmailMessage[]> {
    return this.searchEmails(accountId, 'is:starred', undefined, maxResults);
  }

  /**
   * Download and save attachment
   */
  static async downloadAttachment(
    accountId: string,
    messageId: string,
    attachment: EmailAttachment
  ): Promise<Blob> {
    try {
      const data = await this.getGmailAttachment(accountId, messageId, attachment.id);
      
      return new Blob([data], {
        type: attachment.content_type || 'application/octet-stream',
      });
    } catch (error) {
      console.error('Failed to download attachment:', error);
      throw error;
    }
  }

  /**
   * Get message preview (first 200 chars of text content)
   */
  static async getMessagePreview(
    accountId: string,
    messageId: string
  ): Promise<string> {
    try {
      const message = await this.parseGmailMessage(accountId, messageId);
      
      // Try to get text content first
      if (message.parsed_content.body_text) {
        return message.parsed_content.body_text.substring(0, 200);
      }
      
      // If no text, try to convert HTML
      if (message.parsed_content.body_html) {
        const text = await this.extractTextFromHtml(message.parsed_content.body_html);
        return text.substring(0, 200);
      }
      
      return 'No content available';
    } catch (error) {
      console.error('Failed to get message preview:', error);
      return 'Preview unavailable';
    }
  }

  /**
   * Check if message has attachments
   */
  static hasAttachments(message: ProcessedGmailMessage): boolean {
    return message.parsed_content.attachments.length > 0;
  }

  /**
   * Get message thread count
   */
  static async getThreadCount(accountId: string, threadId: string): Promise<number> {
    try {
      const messages = await this.parseGmailThread(accountId, threadId);
      return messages.length;
    } catch (error) {
      console.error('Failed to get thread count:', error);
      return 0;
    }
  }

  /**
   * Format email address for display
   */
  static formatEmailAddress(address: EmailAddress): string {
    if (address.name) {
      return `${address.name} <${address.email}>`;
    }
    return address.email;
  }

  /**
   * Format email address list for display
   */
  static formatEmailAddressList(addresses: EmailAddress[]): string {
    return addresses.map(addr => this.formatEmailAddress(addr)).join(', ');
  }
}

export default GmailParsingService; 
