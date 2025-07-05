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

class GmailService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private baseUrl = 'https://gmail.googleapis.com/gmail/v1';

  constructor(private config: GmailAuthConfig) {}

  // Authentication methods
  async authenticate(): Promise<void> {
    try {
      // Create OAuth URL
      const authUrl = this.buildAuthUrl();
      
      // In a real application, you would redirect to this URL
      // For now, we'll simulate the authentication process
      console.log('Authenticate at:', authUrl);
      
      // This would normally be handled by the OAuth flow
      // For development, we'll need to implement the actual OAuth flow
      throw new Error('Authentication not implemented - requires OAuth flow');
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private buildAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<GmailAuthResponse> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.config.redirectUri,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.statusText}`);
      }

      const tokens: GmailAuthResponse = await response.json();
      this.setTokens(tokens.access_token, tokens.refresh_token);
      return tokens;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private setTokens(accessToken: string, refreshToken?: string): void {
    this.accessToken = accessToken;
    if (refreshToken) {
      this.refreshToken = refreshToken;
    }
  }

  async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const tokens: GmailAuthResponse = await response.json();
      this.setTokens(tokens.access_token);
      return tokens.access_token;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // API request methods
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        // Try to refresh token
        await this.refreshAccessToken();
        return this.makeRequest(endpoint, options);
      }

      if (!response.ok) {
        const error: GmailApiError = await response.json();
        throw error;
      }

      return response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Label methods
  async getLabels(): Promise<GmailLabel[]> {
    const response = await this.makeRequest<GmailListResponse<GmailLabel>>('/users/me/labels');
    return response.labels || [];
  }

  // Message methods
  async getMessages(
    labelId: string = GMAIL_LABELS.INBOX,
    query?: string,
    maxResults: number = 50,
    pageToken?: string
  ): Promise<GmailListResponse<{ id: string; threadId: string }>> {
    const params = new URLSearchParams({
      labelIds: labelId,
      maxResults: maxResults.toString(),
    });

    if (query) params.append('q', query);
    if (pageToken) params.append('pageToken', pageToken);

    return this.makeRequest<GmailListResponse<{ id: string; threadId: string }>>(
      `/users/me/messages?${params.toString()}`
    );
  }

  async getMessage(messageId: string): Promise<GmailMessage> {
    return this.makeRequest<GmailMessage>(`/users/me/messages/${messageId}`);
  }

  async getThread(threadId: string): Promise<GmailThread> {
    return this.makeRequest<GmailThread>(`/users/me/threads/${threadId}`);
  }

  // Message operations
  async markAsRead(messageIds: string[]): Promise<void> {
    await this.batchModifyMessages(messageIds, [], [GMAIL_LABELS.UNREAD]);
  }

  async markAsUnread(messageIds: string[]): Promise<void> {
    await this.batchModifyMessages(messageIds, [GMAIL_LABELS.UNREAD], []);
  }

  async starMessages(messageIds: string[]): Promise<void> {
    await this.batchModifyMessages(messageIds, [GMAIL_LABELS.STARRED], []);
  }

  async unstarMessages(messageIds: string[]): Promise<void> {
    await this.batchModifyMessages(messageIds, [], [GMAIL_LABELS.STARRED]);
  }

  async deleteMessages(messageIds: string[]): Promise<void> {
    await this.batchModifyMessages(messageIds, [GMAIL_LABELS.TRASH], []);
  }

  async archiveMessages(messageIds: string[]): Promise<void> {
    await this.batchModifyMessages(messageIds, [], [GMAIL_LABELS.INBOX]);
  }

  private async batchModifyMessages(
    messageIds: string[],
    addLabelIds: string[],
    removeLabelIds: string[]
  ): Promise<void> {
    await this.makeRequest('/users/me/messages/batchModify', {
      method: 'POST',
      body: JSON.stringify({
        ids: messageIds,
        addLabelIds,
        removeLabelIds,
      }),
    });
  }

  // Send email
  async sendEmail(email: ComposeEmail): Promise<GmailMessage> {
    const rawMessage = this.createRawMessage(email);
    
    return this.makeRequest<GmailMessage>('/users/me/messages/send', {
      method: 'POST',
      body: JSON.stringify({
        raw: rawMessage,
      }),
    });
  }

  private createRawMessage(email: ComposeEmail): string {
    const boundary = `----boundary_${Date.now()}`;
    
    let message = '';
    message += `To: ${email.to.map(addr => this.formatEmailAddress(addr)).join(', ')}\r\n`;
    
    if (email.cc && email.cc.length > 0) {
      message += `Cc: ${email.cc.map(addr => this.formatEmailAddress(addr)).join(', ')}\r\n`;
    }
    
    if (email.bcc && email.bcc.length > 0) {
      message += `Bcc: ${email.bcc.map(addr => this.formatEmailAddress(addr)).join(', ')}\r\n`;
    }
    
    message += `Subject: ${email.subject}\r\n`;
    message += `MIME-Version: 1.0\r\n`;
    
    if (email.attachments && email.attachments.length > 0) {
      message += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;
      message += `--${boundary}\r\n`;
    }
    
    message += `Content-Type: text/plain; charset="UTF-8"\r\n\r\n`;
    message += `${email.body}\r\n`;
    
    // Handle attachments (simplified - would need proper implementation)
    if (email.attachments && email.attachments.length > 0) {
      for (const attachment of email.attachments) {
        message += `--${boundary}\r\n`;
        message += `Content-Type: application/octet-stream\r\n`;
        message += `Content-Transfer-Encoding: base64\r\n`;
        message += `Content-Disposition: attachment; filename="${attachment.name}"\r\n\r\n`;
        // Would need to convert file to base64
        message += `[BASE64_ENCODED_FILE]\r\n`;
      }
      message += `--${boundary}--\r\n`;
    }
    
    return btoa(message).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  private formatEmailAddress(address: EmailAddress): string {
    return address.name ? `${address.name} <${address.email}>` : address.email;
  }

  // Parsing methods
  parseMessage(gmailMessage: GmailMessage): ParsedEmail {
    const headers = gmailMessage.payload.headers;
    const getHeader = (name: string) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    return {
      id: gmailMessage.id,
      threadId: gmailMessage.threadId,
      from: this.parseEmailAddress(getHeader('From')),
      to: this.parseEmailAddresses(getHeader('To')),
      cc: this.parseEmailAddresses(getHeader('Cc')),
      bcc: this.parseEmailAddresses(getHeader('Bcc')),
      subject: getHeader('Subject'),
      body: this.extractBody(gmailMessage.payload),
      htmlBody: this.extractBody(gmailMessage.payload, 'text/html'),
      attachments: this.extractAttachments(gmailMessage.payload),
      date: new Date(parseInt(gmailMessage.internalDate)),
      isRead: !gmailMessage.labelIds.includes(GMAIL_LABELS.UNREAD),
      isStarred: gmailMessage.labelIds.includes(GMAIL_LABELS.STARRED),
      labels: gmailMessage.labelIds,
      snippet: gmailMessage.snippet,
    };
  }

  parseThread(gmailThread: GmailThread): EmailThread {
    const messages = gmailThread.messages.map(msg => this.parseMessage(msg));
    const lastMessage = messages[messages.length - 1];
    const participants = this.extractParticipants(messages);

    return {
      id: gmailThread.id,
      subject: lastMessage.subject,
      participants,
      messages,
      lastMessage,
      isRead: messages.every(msg => msg.isRead),
      isStarred: messages.some(msg => msg.isStarred),
      labels: [...new Set(messages.flatMap(msg => msg.labels))],
      messageCount: messages.length,
      date: lastMessage.date,
    };
  }

  private parseEmailAddress(addressString: string): EmailAddress {
    const match = addressString.match(/^(.+?)\s*<(.+)>$/) || addressString.match(/^(.+)$/);
    if (!match) return { email: addressString };
    
    if (match.length === 3) {
      return { name: match[1].trim(), email: match[2].trim() };
    } else {
      return { email: match[1].trim() };
    }
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
        id: payload.body.attachmentId,
        filename: payload.filename,
        mimeType: payload.mimeType,
        size: payload.body.size,
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
    const participants = new Map<string, EmailAddress>();
    
    for (const message of messages) {
      participants.set(message.from.email, message.from);
      message.to.forEach(addr => participants.set(addr.email, addr));
      message.cc?.forEach(addr => participants.set(addr.email, addr));
    }
    
    return Array.from(participants.values());
  }

  private handleError(error: any): Error {
    if (error.code && error.message) {
      // Gmail API error
      return new Error(`Gmail API Error ${error.code}: ${error.message}`);
    }
    
    if (error instanceof Error) {
      return error;
    }
    
    return new Error('Unknown error occurred');
  }

  // Utility methods
  signOut(): void {
    this.accessToken = null;
    this.refreshToken = null;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getUserEmail(): string | null {
    // This would typically be extracted from the token or fetched from the profile
    return null;
  }
}

// Export singleton instance
export const gmailService = new GmailService({
  clientId: import.meta.env.VITE_GMAIL_CLIENT_ID || '',
  clientSecret: import.meta.env.VITE_GMAIL_CLIENT_SECRET || '',
  redirectUri: import.meta.env.VITE_GMAIL_REDIRECT_URI || 'http://localhost:3000/auth/callback',
  scopes: GMAIL_SCOPES as unknown as string[],
});

export default GmailService; 