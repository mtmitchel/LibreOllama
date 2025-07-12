import { ProcessedGmailMessage, ParsedEmail, EmailAddress, EmailAttachment } from '../types';

/**
 * Converts ProcessedGmailMessage from backend to ParsedEmail for frontend
 */
export function convertProcessedGmailMessage(
  processedMessage: ProcessedGmailMessage,
  accountId: string
): ParsedEmail {
  const { parsed_content, labels, snippet = '', internal_date } = processedMessage;
  
  // Convert backend email addresses to frontend format
  const convertEmailAddress = (backendAddr: any): EmailAddress => ({
    email: backendAddr?.email || '',
    name: backendAddr?.name,
  });

  // Convert backend attachments to frontend format
  const convertAttachments = (backendAttachments: any[]): EmailAttachment[] => {
    return backendAttachments?.map(att => ({
      id: att.id || '',
      filename: att.filename || 'attachment',
      mimeType: att.content_type || 'application/octet-stream',
      size: att.size || 0,
      data: att.data ? Array.from(att.data).map(b => String.fromCharCode(b)).join('') : undefined,
    })) || [];
  };

  return {
    id: processedMessage.id,
    threadId: processedMessage.thread_id,
    accountId,
    subject: parsed_content.subject || '',
    from: convertEmailAddress(parsed_content.from),
    to: (parsed_content.to || []).map(convertEmailAddress),
    cc: (parsed_content.cc || []).map(convertEmailAddress),
    bcc: (parsed_content.bcc || []).map(convertEmailAddress),
    // Parse date robustly: Gmail internal_date is milliseconds since epoch string, but could also be ISO string.
    date: (() => {
      if (!internal_date) return new Date();

      // Attempt to parse as numeric timestamp first (Gmail returns milliseconds since epoch as string)
      const numericTimestamp = Number(internal_date);
      if (!Number.isNaN(numericTimestamp) && numericTimestamp > 0) {
        return new Date(numericTimestamp);
      }

      // Fallback: treat as ISO or other date string
      const isoParsed = new Date(internal_date);
      return Number.isNaN(isoParsed.getTime()) ? new Date() : isoParsed;
    })(),
    body: parsed_content.body_html || parsed_content.body_text || '',
    snippet,
    isRead: !labels.includes('UNREAD'),
    isStarred: labels.includes('STARRED'),
    hasAttachments: (parsed_content.attachments?.length || 0) > 0,
    attachments: convertAttachments(parsed_content.attachments),
    labels,
    importance: labels.includes('IMPORTANT') ? 'high' : 'normal',
    messageId: parsed_content.message_id || processedMessage.id,
    references: [],
    inReplyTo: undefined,
  };
}

/**
 * Batch convert an array of ProcessedGmailMessage to ParsedEmail
 */
export function convertProcessedGmailMessages(
  processedMessages: ProcessedGmailMessage[],
  accountId: string
): ParsedEmail[] {
  return processedMessages.map(msg => convertProcessedGmailMessage(msg, accountId));
} 