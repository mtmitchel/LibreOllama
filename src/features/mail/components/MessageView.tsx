import React from 'react';
import { 
  Star, 
  Reply, 
  ReplyAll, 
  Forward, 
  Paperclip,
  Printer,
  Archive,
  Trash2,
  X
} from 'lucide-react';
import { Button, Text, Card } from '../../../components/ui';
import { useMailStore } from '../stores/mailStore';
import { ParsedEmail, EmailAddress } from '../types';
import { EnhancedMessageRenderer } from './EnhancedMessageRenderer';
import { EmailRenderer } from './EmailRenderer';
import { EnhancedMessageActions } from './EnhancedMessageActions';
import { safeDecodeHtmlEntities } from '../utils/htmlDecode';
import { InlineReply } from './InlineReply';
import './mail-scrollbar.css';

interface MessageHeaderProps {
  message: ParsedEmail;
}

function MessageHeader({ message }: MessageHeaderProps) {
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
    <div className="border-border-default border-b bg-white">
      <div className="px-6 py-5">
        {/* Subject Line with action buttons */}
        <div className="mb-4">
          <div className="flex items-start justify-between gap-4">
            <h1 className="asana-text-2xl font-semibold leading-tight text-primary">
              {safeDecodeHtmlEntities(message.subject || '(no subject)')}
            </h1>
            
            {/* Action buttons - simplified */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleStarClick}
                className="text-secondary hover:text-primary"
                title={message.isStarred ? 'Remove star' : 'Add star'}
              >
                <Star
                  size={20}
                  className={message.isStarred ? 'fill-warning text-warning' : ''}
                />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseEmail}
                className="text-secondary hover:text-primary"
                title="Close"
              >
                <X size={20} />
              </Button>
            </div>
          </div>
        </div>

        {/* Metadata in a more compact, readable format */}
        <div className="asana-text-sm text-secondary">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {/* From */}
            <div className="flex items-center gap-1">
              <span className="font-medium">From:</span>
              <span className="text-primary">
                {message.from.name || message.from.email}
              </span>
              <span className="text-[11px] text-tertiary">
                &lt;{message.from.email}&gt;
              </span>
            </div>
            
            {/* To - inline when short */}
            {message.to.length === 1 && (
              <div className="flex items-center gap-1">
                <span className="font-medium">To:</span>
                <span className="text-primary">
                  {message.to[0].name || message.to[0].email}
                </span>
              </div>
            )}
            
            {/* Date */}
            <div className="flex items-center gap-1">
              <span className="font-medium">Date:</span>
              <span className="text-primary">
                {formatDate(message.date)}
              </span>
            </div>
          </div>
          
          {/* To - on new line when multiple recipients */}
          {message.to.length > 1 && (
            <div className="mt-1 flex items-start gap-1">
              <span className="font-medium">To:</span>
              <span className="text-primary">
                {formatEmailAddresses(message.to)}
              </span>
            </div>
          )}
        </div>
      </div>
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
    <div className="border-border-default border-b bg-gray-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Paperclip size={16} className="text-secondary" />
        <Text size="sm" weight="medium" variant="body">
          {attachments.length} attachment{attachments.length > 1 ? 's' : ''}
        </Text>
      </div>
      <div className="space-y-2">
        {attachments.map((attachment, index) => (
          <div
            key={index}
            className="border-border-default flex items-center justify-between rounded-lg border bg-white p-3 transition-colors hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-100 p-2">
                <Paperclip size={16} className="text-secondary" />
              </div>
              <div>
                <Text size="sm" weight="medium" variant="body">
                  {attachment.filename}
                </Text>
                <Text size="xs" variant="secondary">
                  {formatFileSize(attachment.size)}
                </Text>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
            >
              Download
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MessageView() {
  const { currentMessage } = useMailStore();
  const settings = useMailStore(state => state.settings);
  const [showImages, setShowImages] = React.useState(settings.mailAlwaysShowImages);
  const [replyMode, setReplyMode] = React.useState<'reply' | 'reply_all' | 'forward' | null>(null);

  if (!currentMessage) {
    return (
      <div className="m-2 flex flex-1 items-center justify-center rounded-lg bg-tertiary">
        <div className="text-center">
          <Text size="lg" variant="secondary">
            Select a message to view
          </Text>
        </div>
      </div>
    );
  }

  const handleReply = () => {
    setReplyMode('reply');
  };

  const handleReplyAll = () => {
    setReplyMode('reply_all');
  };

  const handleForward = () => {
    setReplyMode('forward');
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      {/* Message Header */}
      <div className="shrink-0">
        <MessageHeader
          message={currentMessage}
        />
      </div>

      {/* Attachments */}
      {currentMessage.attachments && currentMessage.attachments.length > 0 && (
        <div className="shrink-0">
          <AttachmentList attachments={currentMessage.attachments} />
        </div>
      )}


      {/* Message Content - Scrollable */}
      <div className="mail-scrollbar flex-1 overflow-y-auto overflow-x-hidden bg-white px-6 py-4">
        {settings.mailUseReactLetterRenderer ? (
          <EmailRenderer 
            message={currentMessage}
            showRawSource={false}
          />
        ) : (
          <EnhancedMessageRenderer 
            message={currentMessage}
            enableImageLoading={showImages}
            enableLinkPreview={false}
            showRawSource={false}
          />
        )}
      </div>

      {/* Action Buttons - Only show if not in reply mode */}
      {!replyMode && (
        <div className="border-border-default shrink-0 border-t bg-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="primary" size="sm" onClick={handleReply}>
                <Reply size={16} className="mr-2" />
                Reply
              </Button>
              <Button variant="outline" size="sm" onClick={handleReplyAll}>
                <ReplyAll size={16} className="mr-2" />
                Reply all
              </Button>
              <Button variant="outline" size="sm" onClick={handleForward}>
                <Forward size={16} className="mr-2" />
                Forward
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-secondary hover:text-primary" title="Print">
                <Printer size={18} />
              </Button>
              <Button variant="ghost" size="icon" className="text-secondary hover:text-primary" title="Archive">
                <Archive size={18} />
              </Button>
              <Button variant="ghost" size="icon" className="text-secondary hover:text-primary" title="Delete">
                <Trash2 size={18} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Reply Section */}
      {replyMode && (
        <InlineReply
          originalMessage={currentMessage}
          replyType={replyMode}
          onClose={() => setReplyMode(null)}
        />
      )}
    </div>
  );
} 
