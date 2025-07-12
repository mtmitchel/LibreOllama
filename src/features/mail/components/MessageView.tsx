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
import { EnhancedMessageRenderer } from './EnhancedMessageRenderer';
import { EnhancedMessageActions } from './EnhancedMessageActions';

interface MessageHeaderProps {
  message: ParsedEmail;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

function MessageHeader({ message, isExpanded, onToggleExpanded }: MessageHeaderProps) {
  const { starMessages, unstarMessages } = useMailStore();
  const clearCurrentMessage = useMailStore(state => state.clearCurrentMessage);

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

      {/* Enhanced Message Content */}
      <div className="flex-1 overflow-y-auto bg-[var(--bg-tertiary)]">
        <div style={{ padding: 'var(--space-4)' }}>
          <EnhancedMessageRenderer 
            message={currentMessage}
            enableImageLoading={false} // Security: images blocked by default
            enableLinkPreview={false}
            showRawSource={false}
          />
        </div>
      </div>

      {/* Enhanced Action Buttons */}
      <div 
        className="border-t border-[var(--border-default)] bg-[var(--bg-secondary)] rounded-b-[var(--radius-lg)]"
        style={{ padding: 'var(--space-3)' }}
      >
        <EnhancedMessageActions 
          message={currentMessage}
          showAllActions={true}
          onReply={handleReply}
          onReplyAll={handleReplyAll}
          onForward={handleForward}
        />
      </div>
    </div>
  );
} 