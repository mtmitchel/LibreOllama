import React from 'react';
import { 
  Star, 
  Reply, 
  ReplyAll, 
  Forward, 
  MoreHorizontal, 
  Paperclip,
  ChevronDown,
  ChevronUp,
  Printer,
  Archive,
  Trash2,
  X
} from 'lucide-react';
import { Button, Text, Card } from '../../../components/ui';
import { useMailStore } from '../stores/mailStore';
import { ParsedEmail, EmailAddress } from '../types';

interface MessageHeaderProps {
  message: ParsedEmail;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

function MessageHeader({ message, isExpanded, onToggleExpanded }: MessageHeaderProps) {
  const { starMessages, unstarMessages, clearCurrentMessage } = useMailStore();

  const handleStarClick = () => {
    if (message.isStarred) {
      unstarMessages([message.id]);
    } else {
      starMessages([message.id]);
    }
  };

  const handleCloseEmail = () => {
    clearCurrentMessage();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }) + ' at ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatEmailAddresses = (addresses: EmailAddress[]) => {
    return addresses.map(addr => addr.name || addr.email).join(', ');
  };

  return (
    <div className="border-b border-[var(--border-default)] bg-[var(--bg-tertiary)]">
      {/* Main Header - Optimized for compact space */}
      <div 
        className="flex flex-col"
        style={{ padding: 'var(--space-3)' }}
      >
        {/* Subject Line */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0 pr-2">
            <Text size="lg" weight="semibold" variant="body" className="leading-tight">
              {message.subject || '(no subject)'}
            </Text>
          </div>
          
          {/* Action buttons - more compact */}
          <div 
            className="flex items-center flex-shrink-0"
            style={{ gap: 'var(--space-1)' }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCloseEmail}
              className="h-6 w-6 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[var(--radius-sm)]"
              title="Close email"
            >
              <X size={12} />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleStarClick}
              className="h-6 w-6 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[var(--radius-sm)]"
            >
              <Star
                size={12}
                className={`${
                  message.isStarred 
                    ? 'text-yellow-500 fill-yellow-500' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleExpanded}
              className="h-6 w-6 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[var(--radius-sm)]"
            >
              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[var(--radius-sm)]"
            >
              <MoreHorizontal size={12} />
            </Button>
          </div>
        </div>

        {/* Sender and Date Info - Stacked for better space usage */}
        <div className="flex flex-col gap-1">
          {/* Sender Info */}
          <div className="flex items-center min-w-0">
            <Text size="sm" weight="medium" variant="body" className="truncate">
              {message.from.name || message.from.email}
            </Text>
            <Text size="xs" variant="secondary" className="ml-1 truncate">
              &lt;{message.from.email}&gt;
            </Text>
          </div>
          
          {/* Recipient and Date */}
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <Text size="xs" variant="secondary" className="truncate flex-1 min-w-0">
              to {formatEmailAddresses(message.to)}
            </Text>
            <Text size="xs" variant="secondary" className="ml-2 flex-shrink-0">
              {formatDate(message.date)}
            </Text>
          </div>
        </div>
      </div>

      {/* Expanded Header Details */}
      {isExpanded && (
        <div 
          className="text-sm border-t border-[var(--border-default)] bg-[var(--bg-secondary)] rounded-[var(--radius-sm)] mx-[var(--space-2)] mb-[var(--space-2)]"
          style={{ 
            padding: 'var(--space-3)'
          }}
        >
          <div className="space-y-1">
            <div className="flex">
              <Text size="sm" variant="secondary" className="w-12 text-right mr-2 flex-shrink-0">
                from:
              </Text>
              <Text size="sm" variant="secondary" className="truncate">
                {message.from.name || message.from.email} &lt;{message.from.email}&gt;
              </Text>
            </div>
            <div className="flex">
              <Text size="sm" variant="secondary" className="w-12 text-right mr-2 flex-shrink-0">
                to:
              </Text>
              <Text size="sm" variant="secondary" className="truncate">
                {formatEmailAddresses(message.to)}
              </Text>
            </div>
            {message.cc && message.cc.length > 0 && (
              <div className="flex">
                <Text size="sm" variant="secondary" className="w-12 text-right mr-2 flex-shrink-0">
                  cc:
                </Text>
                <Text size="sm" variant="secondary" className="truncate">
                  {formatEmailAddresses(message.cc)}
                </Text>
              </div>
            )}
            <div className="flex">
              <Text size="sm" variant="secondary" className="w-12 text-right mr-2 flex-shrink-0">
                date:
              </Text>
              <Text size="sm" variant="secondary" className="truncate">
                {formatDate(message.date)}
              </Text>
            </div>
            <div className="flex">
              <Text size="sm" variant="secondary" className="w-12 text-right mr-2 flex-shrink-0">
                subject:
              </Text>
              <Text size="sm" variant="secondary" className="truncate">
                {message.subject || '(no subject)'}
              </Text>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface AttachmentListProps {
  attachments: any[];
}

function AttachmentList({ attachments }: AttachmentListProps) {
  if (attachments.length === 0) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div 
      className="border-b border-[var(--border-default)] bg-[var(--bg-secondary)] rounded-[var(--radius-sm)] mx-[var(--space-2)] mb-[var(--space-2)]"
      style={{ padding: 'var(--space-3)' }}
    >
      <div 
        className="flex items-center"
        style={{ 
          marginBottom: 'var(--space-2)',
          gap: 'var(--space-2)'
        }}
      >
        <Paperclip size={16} className="text-[var(--text-secondary)]" />
        <Text size="sm" variant="secondary">
          {attachments.length} attachment{attachments.length > 1 ? 's' : ''}
        </Text>
      </div>
      <div 
        className="grid grid-cols-1"
        style={{ gap: 'var(--space-2)' }}
      >
        {attachments.map((attachment, index) => (
          <Card
            key={index}
            padding="sm"
            className="flex items-center justify-between bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[var(--radius-md)] hover:bg-[var(--bg-surface)] transition-colors"
          >
            <div 
              className="flex items-center"
              style={{ gap: 'var(--space-2)' }}
            >
              <Paperclip size={14} className="text-[var(--text-secondary)]" />
              <div>
                <Text size="sm" variant="body">
                  {attachment.filename}
                </Text>
                <Text size="xs" variant="secondary">
                  {formatFileSize(attachment.size)}
                </Text>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[var(--radius-sm)]"
            >
              Download
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function MessageView() {
  const { currentMessage, startCompose } = useMailStore();
  const [isHeaderExpanded, setIsHeaderExpanded] = React.useState(false);

  if (!currentMessage) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-tertiary)] rounded-[var(--radius-lg)] m-[var(--space-2)]">
        <div className="text-center">
          <Text size="lg" variant="secondary">
            Select a message to view
          </Text>
        </div>
      </div>
    );
  }

  const handleReply = () => {
    startCompose({
      to: [currentMessage.from],
      subject: currentMessage.subject.startsWith('Re: ') 
        ? currentMessage.subject 
        : `Re: ${currentMessage.subject}`,
      replyToMessageId: currentMessage.id,
    });
  };

  const handleReplyAll = () => {
    const allRecipients = [
      currentMessage.from,
      ...currentMessage.to,
      ...(currentMessage.cc || [])
    ].filter((addr, index, self) => 
      index === self.findIndex(a => a.email === addr.email)
    );

    startCompose({
      to: allRecipients,
      subject: currentMessage.subject.startsWith('Re: ') 
        ? currentMessage.subject 
        : `Re: ${currentMessage.subject}`,
      replyToMessageId: currentMessage.id,
    });
  };

  const handleForward = () => {
    startCompose({
      to: [],
      subject: currentMessage.subject.startsWith('Fwd: ') 
        ? currentMessage.subject 
        : `Fwd: ${currentMessage.subject}`,
      body: `\n\n---------- Forwarded message ---------\nFrom: ${currentMessage.from.name || currentMessage.from.email}\nDate: ${currentMessage.date.toLocaleString()}\nSubject: ${currentMessage.subject}\nTo: ${currentMessage.to.map(addr => addr.email).join(', ')}\n\n${currentMessage.body}`,
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-tertiary)] rounded-[var(--radius-lg)] m-[var(--space-2)] overflow-hidden shadow-sm border border-[var(--border-default)]">
      {/* Message Header */}
      <div className="bg-[var(--bg-tertiary)] rounded-t-[var(--radius-lg)]">
        <MessageHeader
          message={currentMessage}
          isExpanded={isHeaderExpanded}
          onToggleExpanded={() => setIsHeaderExpanded(!isHeaderExpanded)}
        />
      </div>

      {/* Attachments */}
      <AttachmentList attachments={currentMessage.attachments} />

      {/* Message Content */}
      <div className="flex-1 overflow-y-auto bg-[var(--bg-tertiary)]">
        <div style={{ padding: 'var(--space-4)' }}>
          {/* Email Content with Better Formatting */}
          <div className="email-content">
            {currentMessage.body ? (
              <div 
                className="email-html-content"
                dangerouslySetInnerHTML={{ __html: currentMessage.body }}
                style={{
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: 'var(--text-primary)',
                  maxWidth: '100%',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word'
                }}
              />
            ) : currentMessage.snippet ? (
              <div className="email-text-content">
                <pre 
                  className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-[var(--text-primary)] bg-transparent border-0 p-0 m-0"
                  style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    maxWidth: '100%',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word'
                  }}
                >
                  {currentMessage.snippet}
                </pre>
              </div>
            ) : (
              <div className="text-center py-8">
                <Text size="sm" variant="secondary">
                  No content available
                </Text>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .email-content {
          max-width: 100%;
        }
        
        .email-html-content * {
          max-width: 100% !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
        }
        
        .email-html-content img {
          max-width: 100% !important;
          height: auto !important;
          border-radius: 6px;
          margin: 8px 0;
        }
        
        .email-html-content table {
          max-width: 100% !important;
          border-collapse: collapse;
          margin: 8px 0;
        }
        
        .email-html-content blockquote {
          border-left: 3px solid var(--border-default);
          padding-left: 12px;
          margin: 16px 0;
          font-style: italic;
          color: var(--text-secondary);
        }
        
        .email-html-content a {
          color: var(--accent-primary);
          text-decoration: underline;
        }
        
        .email-html-content a:hover {
          color: var(--accent-primary-hover);
        }
        
        .email-html-content p {
          margin: 8px 0;
          line-height: 1.6;
        }
        
        .email-html-content ul, .email-html-content ol {
          margin: 8px 0;
          padding-left: 20px;
        }
        
        .email-html-content li {
          margin: 4px 0;
          line-height: 1.5;
        }
        
        .email-html-content h1, .email-html-content h2, .email-html-content h3, 
        .email-html-content h4, .email-html-content h5, .email-html-content h6 {
          margin: 16px 0 8px 0;
          font-weight: 600;
          line-height: 1.4;
          color: var(--text-primary);
        }
        
        .email-html-content code {
          background: var(--bg-secondary);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
          font-size: 13px;
        }
        
        .email-html-content pre {
          background: var(--bg-secondary);
          padding: 12px;
          border-radius: 6px;
          overflow-x: auto;
          margin: 12px 0;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
          font-size: 13px;
          line-height: 1.4;
        }
      `}</style>

      {/* Action Buttons */}
      <div 
        className="border-t border-[var(--border-default)] bg-[var(--bg-secondary)] rounded-b-[var(--radius-lg)]"
        style={{ padding: 'var(--space-2) var(--space-3)' }}
      >
        <div className="flex items-center justify-between">
          {/* Primary actions - more compact */}
          <div 
            className="flex items-center"
            style={{ gap: 'var(--space-1)' }}
          >
            <Button 
              onClick={handleReply}
              variant="primary"
              size="sm"
              className="h-8 rounded-[var(--radius-md)]"
            >
              <Reply size={14} />
              Reply
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleReplyAll}
              size="sm"
              className="h-8 rounded-[var(--radius-md)]"
            >
              <ReplyAll size={14} />
              Reply all
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleForward}
              size="sm"
              className="h-8 rounded-[var(--radius-md)]"
            >
              <Forward size={14} />
              Forward
            </Button>
          </div>

          {/* Secondary actions - compact icons */}
          <div 
            className="flex items-center"
            style={{ gap: 'var(--space-1)' }}
          >
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[var(--radius-md)]"
              title="Archive"
            >
              <Archive size={14} />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[var(--radius-md)]"
              title="Delete"
            >
              <Trash2 size={14} />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[var(--radius-md)]"
              title="Print"
            >
              <Printer size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 