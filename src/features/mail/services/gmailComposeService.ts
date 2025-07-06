import { invoke } from '@tauri-apps/api/core';
import { 
  handleGmailError, 
  retryGmailOperation, 
  GmailError, 
  GmailErrorType,
  ErrorContext 
} from './gmailErrorHandler';

// Type definitions for compose functionality
export interface EmailAddress {
  email: string;
  name?: string;
}

export interface ComposeAttachment {
  filename: string;
  contentType: string;
  contentId?: string;
  data: string; // Base64 encoded content
  size: number;
  isInline: boolean;
}

export enum MessageImportance {
  Low = 'Low',
  Normal = 'Normal',
  High = 'High'
}

export interface ComposeRequest {
  accountId: string;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  attachments?: ComposeAttachment[];
  replyToMessageId?: string;
  threadId?: string;
  importance: MessageImportance;
  deliveryReceipt: boolean;
  readReceipt: boolean;
  scheduleSend?: string; // ISO 8601 timestamp
}

export enum SendStatus {
  Sent = 'Sent',
  Queued = 'Queued',
  Failed = 'Failed',
  Scheduled = 'Scheduled'
}

export interface SendResponse {
  messageId: string;
  threadId: string;
  labelIds: string[];
  sentAt: string;
  sizeEstimate: number;
  status: SendStatus;
  deliveryInfo?: DeliveryInfo;
}

export interface DeliveryInfo {
  deliveredTo: string[];
  failedRecipients: FailedRecipient[];
  deliveryDelayMs: number;
}

export interface FailedRecipient {
  email: string;
  errorCode: string;
  errorMessage: string;
}

export interface DraftSaveRequest {
  accountId: string;
  draftId?: string; // None for new draft, Some for updating existing
  composeData: ComposeRequest;
}

export interface DraftResponse {
  draftId: string;
  messageId: string;
  savedAt: string;
  autoSave: boolean;
}

export interface MessageTemplate {
  templateId: string;
  name: string;
  subjectTemplate: string;
  bodyTemplate: string;
  variables: TemplateVariable[];
}

export interface TemplateVariable {
  name: string;
  description: string;
  defaultValue?: string;
  required: boolean;
}

// Re-export GmailError for backward compatibility
export type GmailComposeError = GmailError;

/**
 * Service for Gmail compose, send, and draft functionality
 */
export class GmailComposeService {
  /**
   * Send an email through Gmail API
   */
  static async sendMessage(composeRequest: ComposeRequest): Promise<SendResponse> {
    const context: ErrorContext = {
      operation: 'send_message',
      accountId: composeRequest.accountId,
      threadId: composeRequest.threadId
    };

    return retryGmailOperation(
      async () => {
        // Validate request before sending
        const validationErrors = this.validateComposeRequest(composeRequest);
        if (validationErrors.length > 0) {
          throw handleGmailError(validationErrors.join('; '), context);
        }

        // Check message size
        if (this.isMessageTooLarge(composeRequest)) {
          throw handleGmailError('Message size exceeds 25MB limit', context);
        }

        return await invoke<SendResponse>('send_gmail_message', {
          composeRequest
        });
      },
      context,
      { maxRetries: 2 } // Reduce retries for send operations
    );
  }

  /**
   * Save email as draft
   */
  static async saveDraft(draftRequest: DraftSaveRequest): Promise<DraftResponse> {
    const context: ErrorContext = {
      operation: 'save_draft',
      accountId: draftRequest.accountId
    };

    return retryGmailOperation(
      async () => {
        // Validate compose data before saving
        const validationErrors = this.validateComposeRequest(draftRequest.composeData);
        if (validationErrors.length > 0) {
          throw handleGmailError(validationErrors.join('; '), context);
        }

        return await invoke<DraftResponse>('save_gmail_draft', {
          draftRequest
        });
      },
      context
    );
  }

  /**
   * Get drafts for an account
   */
  static async getDrafts(
    accountId: string,
    maxResults?: number,
    pageToken?: string
  ): Promise<DraftResponse[]> {
    const context: ErrorContext = {
      operation: 'get_drafts',
      accountId
    };

    return retryGmailOperation(
      async () => {
        return await invoke<DraftResponse[]>('get_gmail_drafts', {
          accountId,
          maxResults,
          pageToken
        });
      },
      context
    );
  }

  /**
   * Delete a draft
   */
  static async deleteDraft(accountId: string, draftId: string): Promise<boolean> {
    const context: ErrorContext = {
      operation: 'delete_draft',
      accountId
    };

    return retryGmailOperation(
      async () => {
        return await invoke<boolean>('delete_gmail_draft', {
          accountId,
          draftId
        });
      },
      context,
      { maxRetries: 1 } // Reduce retries for delete operations
    );
  }

  /**
   * Schedule an email to be sent at a specific time
   */
  static async scheduleMessage(
    composeRequest: ComposeRequest,
    scheduleTime: string
  ): Promise<SendResponse> {
    const context: ErrorContext = {
      operation: 'schedule_message',
      accountId: composeRequest.accountId,
      threadId: composeRequest.threadId
    };

    return retryGmailOperation(
      async () => {
        // Validate schedule time
        const scheduleDate = new Date(scheduleTime);
        if (scheduleDate <= new Date()) {
          throw handleGmailError('Scheduled send time must be in the future', context);
        }

        // Validate request
        const validationErrors = this.validateComposeRequest(composeRequest);
        if (validationErrors.length > 0) {
          throw handleGmailError(validationErrors.join('; '), context);
        }

        return await invoke<SendResponse>('schedule_gmail_message', {
          composeRequest,
          scheduleTime
        });
      },
      context,
      { maxRetries: 2 }
    );
  }

  /**
   * Get message templates
   */
  static async getMessageTemplates(accountId: string): Promise<MessageTemplate[]> {
    const context: ErrorContext = {
      operation: 'get_message_templates',
      accountId
    };

    return retryGmailOperation(
      async () => {
        return await invoke<MessageTemplate[]>('get_message_templates', {
          accountId
        });
      },
      context
    );
  }

  /**
   * Format reply or forward message
   */
  static async formatReplyMessage(
    accountId: string,
    originalMessageId: string,
    replyType: 'reply' | 'reply_all' | 'forward',
    additionalRecipients?: EmailAddress[]
  ): Promise<ComposeRequest> {
    const context: ErrorContext = {
      operation: 'format_reply_message',
      accountId,
      messageId: originalMessageId
    };

    return retryGmailOperation(
      async () => {
        return await invoke<ComposeRequest>('format_reply_message', {
          accountId,
          originalMessageId,
          replyType,
          additionalRecipients
        });
      },
      context
    );
  }

  /**
   * Auto-save draft functionality
   */
  static async autoSaveDraft(
    composeRequest: ComposeRequest,
    draftId?: string,
    debounceMs: number = 2000
  ): Promise<DraftResponse> {
    // Implement debouncing to avoid excessive API calls
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(async () => {
        try {
          const draftRequest: DraftSaveRequest = {
            accountId: composeRequest.accountId,
            draftId,
            composeData: composeRequest
          };
          
          const response = await this.saveDraft(draftRequest);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      }, debounceMs);

      // Store timeout ID for potential cancellation
      (window as any).autoSaveTimeoutId = timeoutId;
    });
  }

  /**
   * Cancel auto-save if user is actively typing
   */
  static cancelAutoSave(): void {
    if ((window as any).autoSaveTimeoutId) {
      clearTimeout((window as any).autoSaveTimeoutId);
      (window as any).autoSaveTimeoutId = null;
    }
  }

  /**
   * Validate email addresses
   */
  static validateEmailAddresses(addresses: EmailAddress[]): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return addresses.every(addr => emailRegex.test(addr.email));
  }

  /**
   * Validate compose request
   */
  static validateComposeRequest(request: ComposeRequest): string[] {
    const errors: string[] = [];

    if (!request.to || request.to.length === 0) {
      errors.push('At least one recipient is required');
    }

    if (request.to && !this.validateEmailAddresses(request.to)) {
      errors.push('Invalid email address in To field');
    }

    if (request.cc && !this.validateEmailAddresses(request.cc)) {
      errors.push('Invalid email address in CC field');
    }

    if (request.bcc && !this.validateEmailAddresses(request.bcc)) {
      errors.push('Invalid email address in BCC field');
    }

    if (!request.subject || request.subject.trim().length === 0) {
      errors.push('Subject is required');
    }

    if (!request.bodyText && !request.bodyHtml) {
      errors.push('Message body is required');
    }

    if (request.scheduleSend) {
      const scheduleDate = new Date(request.scheduleSend);
      if (scheduleDate <= new Date()) {
        errors.push('Scheduled send time must be in the future');
      }
    }

    // Check message size
    if (this.isMessageTooLarge(request)) {
      errors.push('Message size exceeds the 25MB limit');
    }

    return errors;
  }

  /**
   * Convert plain text to HTML
   */
  static textToHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')
      .replace(/\s{2,}/g, (match) => '&nbsp;'.repeat(match.length));
  }

  /**
   * Convert HTML to plain text
   */
  static htmlToText(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  /**
   * Apply email template with variables
   */
  static applyTemplate(template: MessageTemplate, variables: Record<string, string>): {
    subject: string;
    body: string;
  } {
    let subject = template.subjectTemplate;
    let body = template.bodyTemplate;

    // Replace template variables
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, value);
      body = body.replace(regex, value);
    });

    return { subject, body };
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
   * Parse email address from string
   */
  static parseEmailAddress(addressString: string): EmailAddress {
    const match = addressString.match(/(.+)\s*<(.+)>/);
    if (match) {
      return {
        name: match[1].trim(),
        email: match[2].trim()
      };
    }
    return {
      email: addressString.trim()
    };
  }

  /**
   * Estimate message size in bytes
   */
  static estimateMessageSize(compose: ComposeRequest): number {
    let size = 0;
    
    size += compose.subject.length;
    size += compose.bodyText?.length || 0;
    size += compose.bodyHtml?.length || 0;
    
    if (compose.attachments) {
      compose.attachments.forEach(attachment => {
        size += attachment.size;
      });
    }
    
    size += 1024; // Estimated header overhead
    return size;
  }

  /**
   * Check if message is too large (Gmail limit is 25MB)
   */
  static isMessageTooLarge(compose: ComposeRequest): boolean {
    const maxSize = 25 * 1024 * 1024; // 25MB in bytes
    return this.estimateMessageSize(compose) > maxSize;
  }


}

// Export utility functions for use in components
export const gmailComposeUtils = {
  validateEmailAddresses: GmailComposeService.validateEmailAddresses,
  validateComposeRequest: GmailComposeService.validateComposeRequest,
  textToHtml: GmailComposeService.textToHtml,
  htmlToText: GmailComposeService.htmlToText,
  applyTemplate: GmailComposeService.applyTemplate,
  formatEmailAddress: GmailComposeService.formatEmailAddress,
  parseEmailAddress: GmailComposeService.parseEmailAddress,
  estimateMessageSize: GmailComposeService.estimateMessageSize,
  isMessageTooLarge: GmailComposeService.isMessageTooLarge,
}; 