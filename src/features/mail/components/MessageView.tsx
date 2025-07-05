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
  Trash2
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
  const { starMessages, unstarMessages } = useMailStore();

  const handleStarClick = () => {
    if (message.isStarred) {
      unstarMessages([message.id]);
    } else {
      starMessages([message.id]);
    }
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
    <div className="border-b border-[var(--border-default)]">
      {/* Main Header */}
      <div 
        className="flex items-start"
        style={{ padding: 'var(--space-4)' }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <Text size="lg" weight="semibold" variant="body" style={{ marginBottom: 'var(--space-1)' }}>
                {message.subject || '(no subject)'}
              </Text>
              <div 
                className="flex items-center text-sm"
                style={{ gap: 'var(--space-2)' }}
              >
                <Text size="sm" weight="medium" variant="body">
                  {message.from.name || message.from.email}
                </Text>
                <Text size="sm" variant="secondary">
                  &lt;{message.from.email}&gt;
                </Text>
              </div>
              <Text size="xs" variant="secondary" style={{ marginTop: 'var(--space-1)' }}>
                to {formatEmailAddresses(message.to)}
              </Text>
            </div>
            
            <div 
              className="flex items-center ml-4"
              style={{ gap: 'var(--space-1)' }}
            >
              <Text size="xs" variant="secondary" style={{ marginRight: 'var(--space-2)' }}>
                {formatDate(message.date)}
              </Text>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleStarClick}
                className="h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <Star
                  size={16}
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
                className="h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <MoreHorizontal size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Header Details */}
      {isExpanded && (
        <div 
          className="text-sm"
          style={{ 
            paddingLeft: 'var(--space-4)',
            paddingRight: 'var(--space-4)',
            paddingBottom: 'var(--space-4)'
          }}
        >
          <div className="space-y-1">
            <div className="flex">
              <Text size="sm" variant="secondary" className="w-16 text-right mr-2">
                from:
              </Text>
              <Text size="sm" variant="secondary">
                {message.from.name || message.from.email} &lt;{message.from.email}&gt;
              </Text>
            </div>
            <div className="flex">
              <Text size="sm" variant="secondary" className="w-16 text-right mr-2">
                to:
              </Text>
              <Text size="sm" variant="secondary">
                {formatEmailAddresses(message.to)}
              </Text>
            </div>
            {message.cc && message.cc.length > 0 && (
              <div className="flex">
                <Text size="sm" variant="secondary" className="w-16 text-right mr-2">
                  cc:
                </Text>
                <Text size="sm" variant="secondary">
                  {formatEmailAddresses(message.cc)}
                </Text>
              </div>
            )}
            <div className="flex">
              <Text size="sm" variant="secondary" className="w-16 text-right mr-2">
                date:
              </Text>
              <Text size="sm" variant="secondary">
                {formatDate(message.date)}
              </Text>
            </div>
            <div className="flex">
              <Text size="sm" variant="secondary" className="w-16 text-right mr-2">
                subject:
              </Text>
              <Text size="sm" variant="secondary">
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
      className="border-b border-[var(--border-default)]"
      style={{ padding: 'var(--space-4)' }}
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
            className="flex items-center justify-between bg-[var(--bg-secondary)] border border-[var(--border-default)]"
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
            <Button variant="ghost" size="sm" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
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
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-tertiary)]">
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
    <div className="flex-1 flex flex-col bg-[var(--bg-tertiary)]">
      {/* Message Header */}
      <MessageHeader
        message={currentMessage}
        isExpanded={isHeaderExpanded}
        onToggleExpanded={() => setIsHeaderExpanded(!isHeaderExpanded)}
      />

      {/* Attachments */}
      <AttachmentList attachments={currentMessage.attachments} />

      {/* Message Content */}
      <div className="flex-1 overflow-y-auto">
        <div style={{ padding: 'var(--space-4)' }}>
          <div className="prose prose-sm max-w-none text-[var(--text-primary)]">
            {currentMessage.htmlBody ? (
              <div dangerouslySetInnerHTML={{ __html: currentMessage.htmlBody }} />
            ) : (
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {currentMessage.body}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div 
        className="border-t border-[var(--border-default)]"
        style={{ padding: 'var(--space-4)' }}
      >
        <div 
          className="flex items-center"
          style={{ gap: 'var(--space-2)' }}
        >
          <Button 
            onClick={handleReply}
            variant="primary"
          >
            <Reply size={16} />
            Reply
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleReplyAll}
          >
            <ReplyAll size={16} />
            Reply all
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleForward}
          >
            <Forward size={16} />
            Forward
          </Button>

          <div className="flex-1" />

          <Button 
            variant="ghost" 
            size="icon"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            title="Archive"
          >
            <Archive size={16} />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            title="Delete"
          >
            <Trash2 size={16} />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            title="Print"
          >
            <Printer size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
} 