import { invoke } from '@tauri-apps/api/core';
import { 
  GmailMessage, 
  GmailThread, 
  GmailLabel, 
  GmailListResponse, 
  GmailAuthConfig, 
  GmailAuthResponse, 
  GmailApiError, 
  ParsedEmail, 
  EmailThread, 
  ComposeEmail, 
  EmailAddress,
  GMAIL_SCOPES,
  GMAIL_LABELS 
} from '../types';

// Backend types for Tauri commands
interface BackendGmailConfig {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
}

interface BackendGmailTokens {
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  token_type: string;
}

interface BackendGmailMessage {
  id: string;
  thread_id: string;
  label_ids: string[];
  snippet: string;
  payload: BackendGmailPayload;
  size_estimate?: number;
  history_id?: string;
  internal_date?: string;
}

interface BackendGmailPayload {
  part_id?: string;
  mime_type: string;
  filename?: string;
  headers: BackendGmailHeader[];
  body?: BackendGmailBody;
  parts?: BackendGmailPayload[];
}

interface BackendGmailHeader {
  name: string;
  value: string;
}

interface BackendGmailBody {
  attachment_id?: string;
  size?: number;
  data?: string;
}

interface BackendSendEmailRequest {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  html_body?: string;
}

class GmailService {
  private config: BackendGmailConfig;
  private tokens: BackendGmailTokens | null = null;

  constructor(config: GmailAuthConfig) {
    this.config = {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
    };
  }

  // Authentication methods
  async authenticate(): Promise<void> {
    try {
      const authUrl = await invoke<string>('gmail_generate_auth_url', { 
        config: this.config 
      });
      
      // For now, we'll open the auth URL in the user's browser
      // In a production app, you'd want to handle this more elegantly
      console.log('Please visit this URL to authenticate:', authUrl);
      
      // This would need to be replaced with a proper OAuth flow
      // For example, opening a window and listening for the callback
      throw new Error('Authentication flow needs to be completed - please implement OAuth callback handling');
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async exchangeCodeForTokens(code: string, stateToken: string): Promise<GmailAuthResponse> {
    try {
      const tokens = await invoke<BackendGmailTokens>('gmail_exchange_code', {
        config: this.config,
        code,
        stateToken
      });

      this.tokens = tokens;
      
      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || '',
        expires_in: tokens.expires_at ? this.calculateExpiresIn(tokens.expires_at) : 0,
        token_type: tokens.token_type,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private calculateExpiresIn(expiresAt: string): number {
    const expiryTime = new Date(expiresAt);
    const now = new Date();
    return Math.max(0, Math.floor((expiryTime.getTime() - now.getTime()) / 1000));
  }

  setTokens(accessToken: string, refreshToken?: string): void {
    this.tokens = {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
    };
  }

  async refreshAccessToken(): Promise<string> {
    if (!this.tokens?.refresh_token) {
      throw new Error('No refresh token available');
    }

    try {
      // The backend handles token refresh automatically in API calls
      // This method is kept for compatibility but may not be needed
      throw new Error('Token refresh is handled automatically by the backend');
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Label methods
  async getLabels(): Promise<GmailLabel[]> {
    if (!this.tokens) {
      throw new Error('Not authenticated');
    }

    try {
      const labels = await invoke<GmailLabel[]>('gmail_get_labels', {
        config: this.config,
        tokens: this.tokens,
      });

      return labels;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Message methods
  async getMessages(
    labelId: string = GMAIL_LABELS.INBOX,
    query?: string,
    maxResults: number = 50,
    pageToken?: string
  ): Promise<GmailListResponse<{ id: string; threadId: string }>> {
    if (!this.tokens) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await invoke<GmailListResponse<any>>('gmail_get_messages', {
        config: this.config,
        tokens: this.tokens,
        labelId: labelId,
        maxResults: maxResults,
      });

      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getMessage(messageId: string): Promise<GmailMessage> {
    if (!this.tokens) {
      throw new Error('Not authenticated');
    }

    try {
      const message = await invoke<BackendGmailMessage>('gmail_get_message', {
        config: this.config,
        tokens: this.tokens,
        messageId,
      });

      // Convert backend format to frontend format
      return this.convertBackendMessage(message);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getThread(threadId: string): Promise<GmailThread> {
    // For now, get individual messages - thread support can be added later
    throw new Error('Thread support not yet implemented - use getMessage instead');
  }

  // Message operations
  async markAsRead(messageIds: string[]): Promise<void> {
    // These operations will need to be implemented in the backend
    throw new Error('Message operations not yet implemented in backend');
  }

  async markAsUnread(messageIds: string[]): Promise<void> {
    throw new Error('Message operations not yet implemented in backend');
  }

  async starMessages(messageIds: string[]): Promise<void> {
    throw new Error('Message operations not yet implemented in backend');
  }

  async unstarMessages(messageIds: string[]): Promise<void> {
    throw new Error('Message operations not yet implemented in backend');
  }

  async deleteMessages(messageIds: string[]): Promise<void> {
    throw new Error('Message operations not yet implemented in backend');
  }

  async archiveMessages(messageIds: string[]): Promise<void> {
    throw new Error('Message operations not yet implemented in backend');
  }

  async sendEmail(email: ComposeEmail): Promise<GmailMessage> {
    if (!this.tokens) {
      throw new Error('Not authenticated');
    }

    try {
      const sendRequest: BackendSendEmailRequest = {
        to: email.to.map(addr => this.formatEmailAddress(addr)),
        cc: email.cc?.map(addr => this.formatEmailAddress(addr)),
        bcc: email.bcc?.map(addr => this.formatEmailAddress(addr)),
        subject: email.subject,
        body: email.body,
        html_body: email.htmlBody,
      };

      const sentMessage = await invoke<BackendGmailMessage>('gmail_send_email', {
        config: this.config,
        tokens: this.tokens,
        email: sendRequest,
      });

      return this.convertBackendMessage(sentMessage);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private formatEmailAddress(address: EmailAddress): string {
    if (address.name) {
      return `${address.name} <${address.email}>`;
    }
    return address.email;
  }

  private convertBackendMessage(backendMessage: BackendGmailMessage): GmailMessage {
    return {
      id: backendMessage.id,
      threadId: backendMessage.thread_id,
      labelIds: backendMessage.label_ids,
      snippet: backendMessage.snippet,
      payload: this.convertBackendPayload(backendMessage.payload),
      sizeEstimate: backendMessage.size_estimate,
      historyId: backendMessage.history_id,
      internalDate: backendMessage.internal_date,
    };
  }

  private convertBackendPayload(backendPayload: BackendGmailPayload): any {
    return {
      partId: backendPayload.part_id,
      mimeType: backendPayload.mime_type,
      filename: backendPayload.filename,
      headers: backendPayload.headers.map(h => ({
        name: h.name,
        value: h.value,
      })),
      body: backendPayload.body ? {
        attachmentId: backendPayload.body.attachment_id,
        size: backendPayload.body.size,
        data: backendPayload.body.data,
      } : undefined,
      parts: backendPayload.parts?.map(p => this.convertBackendPayload(p)),
    };
  }

  parseMessage(gmailMessage: GmailMessage): ParsedEmail {
    const headers = gmailMessage.payload.headers || [];
    const getHeader = (name: string) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';
    
    return {
      id: gmailMessage.id,
      threadId: gmailMessage.threadId,
      from: this.parseEmailAddress(getHeader('from')),
      to: this.parseEmailAddresses(getHeader('to')),
      cc: this.parseEmailAddresses(getHeader('cc')),
      bcc: this.parseEmailAddresses(getHeader('bcc')),
      subject: getHeader('subject'),
      body: this.extractBody(gmailMessage.payload, 'text/plain'),
      htmlBody: this.extractBody(gmailMessage.payload, 'text/html'),
      snippet: gmailMessage.snippet,
      date: new Date(gmailMessage.internalDate ? parseInt(gmailMessage.internalDate) : Date.now()),
      isRead: !gmailMessage.labelIds.includes(GMAIL_LABELS.UNREAD),
      isStarred: gmailMessage.labelIds.includes(GMAIL_LABELS.STARRED),
      labels: gmailMessage.labelIds,
      attachments: this.extractAttachments(gmailMessage.payload),
    };
  }

  parseThread(gmailThread: GmailThread): EmailThread {
    const messages = gmailThread.messages?.map(msg => this.parseMessage(msg)) || [];
    
    return {
      id: gmailThread.id,
      messages,
      participants: this.extractParticipants(messages),
      subject: messages[0]?.subject || '',
      lastMessageDate: messages[messages.length - 1]?.date || new Date(),
      isRead: messages.every(msg => msg.isRead),
      isStarred: messages.some(msg => msg.isStarred),
      labels: Array.from(new Set(messages.flatMap(msg => msg.labels))),
      messageCount: messages.length,
    };
  }

  private parseEmailAddress(addressString: string): EmailAddress {
    if (!addressString) return { email: '', name: undefined };
    
    const match = addressString.match(/^(.+?)\s*<(.+?)>$/) || addressString.match(/^(.+)$/);
    if (match) {
      if (match[2]) {
        return { name: match[1].trim().replace(/^"|"$/g, ''), email: match[2].trim() };
      } else {
        return { email: match[1].trim(), name: undefined };
      }
    }
    return { email: addressString, name: undefined };
  }

  private parseEmailAddresses(addressString: string): EmailAddress[] {
    if (!addressString) return [];
    return addressString.split(',').map(addr => this.parseEmailAddress(addr.trim()));
  }

  private extractBody(payload: any, mimeType: string = 'text/plain'): string {
    if (payload.mimeType === mimeType && payload.body?.data) {
      return atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    }
    
    if (payload.parts) {
      for (const part of payload.parts) {
        const body = this.extractBody(part, mimeType);
        if (body) return body;
      }
    }
    
    return '';
  }

  private extractAttachments(payload: any): any[] {
    const attachments: any[] = [];
    
    if (payload.filename && payload.body?.attachmentId) {
      attachments.push({
        filename: payload.filename,
        mimeType: payload.mimeType,
        size: payload.body.size,
        attachmentId: payload.body.attachmentId,
      });
    }
    
    if (payload.parts) {
      for (const part of payload.parts) {
        attachments.push(...this.extractAttachments(part));
      }
    }
    
    return attachments;
  }

  private extractParticipants(messages: ParsedEmail[]): EmailAddress[] {
    const participantMap = new Map<string, EmailAddress>();
    
    messages.forEach(message => {
      const allAddresses = [
        message.from,
        ...message.to,
        ...(message.cc || []),
        ...(message.bcc || [])
      ];
      
      allAddresses.forEach(addr => {
        if (addr.email) {
          participantMap.set(addr.email, addr);
        }
      });
    });
    
    return Array.from(participantMap.values());
  }

  private handleError(error: any): Error {
    console.error('Gmail service error:', error);
    
    if (typeof error === 'string') {
      return new Error(error);
    }
    
    if (error instanceof Error) {
      return error;
    }
    
    return new Error('An unexpected error occurred');
  }

  signOut(): void {
    this.tokens = null;
  }

  isAuthenticated(): boolean {
    return !!this.tokens;
  }

  getUserEmail(): string | null {
    // This would need to be stored separately or extracted from token
    return null;
  }
}

// Create a default service instance with placeholder config
// In a real app, these would come from environment variables or user input
const defaultConfig: GmailAuthConfig = {
  clientId: process.env.GMAIL_CLIENT_ID || '',
  clientSecret: process.env.GMAIL_CLIENT_SECRET || '',
  redirectUri: process.env.GMAIL_REDIRECT_URI || 'http://localhost:8080/auth/gmail/callback',
  scopes: [...GMAIL_SCOPES],
};

export const gmailService = new GmailService(defaultConfig); 