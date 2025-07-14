import React, { useState } from 'react';
import { 
  Reply, 
  ReplyAll, 
  Forward, 
  Star, 
  Archive, 
  Trash2, 
  Mail,
  MailOpen,
  Copy,
  Flag,
  Download,
  Tag
} from 'lucide-react';
import { Button } from '../../../components/ui';
import { useMailStore } from '../stores/mailStore';
import { useMailOperation } from '../hooks';
import { ParsedEmail } from '../types';

interface EnhancedMessageActionsProps {
  message: ParsedEmail;
  className?: string;
  showAllActions?: boolean;
  onReply?: () => void;
  onReplyAll?: () => void;
  onForward?: () => void;
}

interface ActionButtonProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md';
}

function ActionButton({ 
  icon: Icon, 
  label, 
  onClick, 
  isActive = false, 
  isLoading = false,
  variant = 'secondary',
  size = 'sm'
}: ActionButtonProps) {
  const baseClasses = "flex items-center gap-1 transition-all duration-200";
  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm';
  
  const variantClasses = {
    primary: isActive 
      ? 'bg-accent-primary text-white hover:bg-accent-secondary'
      : 'bg-bg-secondary hover:bg-accent-primary hover:text-white text-text-primary',
    secondary: isActive
      ? 'bg-accent-bg text-accent-primary border-accent-primary'
      : 'bg-bg-secondary hover:bg-bg-tertiary text-text-secondary hover:text-text-primary',
    danger: 'bg-error-ghost hover:bg-error-ghost text-error hover:text-error dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400'
  };

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={onClick}
      disabled={isLoading}
      className={`${baseClasses} ${sizeClasses} ${variantClasses[variant]} border-border-primary rounded-md border`}
      title={label}
    >
      <Icon size={size === 'sm' ? 14 : 16} />
      <span className="hidden sm:inline">{label}</span>
      {isLoading && (
        <div className="ml-1 size-3 animate-spin rounded-full border border-current border-t-transparent" />
      )}
    </Button>
  );
}

export function EnhancedMessageActions({ 
  message, 
  className = '', 
  showAllActions = false,
  onReply,
  onReplyAll,
  onForward
}: EnhancedMessageActionsProps) {
  const { 
    startCompose, 
    markAsRead, 
    markAsUnread, 
    starMessages, 
    unstarMessages,
    archiveMessages,
    deleteMessages 
  } = useMailStore();
  
  const { executeMessageOperation } = useMailOperation();
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});

  const setOperationLoading = (operation: string, loading: boolean) => {
    setIsProcessing(prev => ({ ...prev, [operation]: loading }));
  };

  const handleReadToggle = async () => {
    setOperationLoading('read', true);
    try {
      if (message.isRead) {
        await executeMessageOperation(
          () => markAsUnread([message.id]),
          [message.id],
          'mark as unread'
        );
      } else {
        await executeMessageOperation(
          () => markAsRead([message.id]),
          [message.id],
          'mark as read'
        );
      }
    } finally {
      setOperationLoading('read', false);
    }
  };

  const handleStarToggle = async () => {
    setOperationLoading('star', true);
    try {
      if (message.isStarred) {
        await executeMessageOperation(
          () => unstarMessages([message.id]),
          [message.id],
          'unstar'
        );
      } else {
        await executeMessageOperation(
          () => starMessages([message.id]),
          [message.id],
          'star'
        );
      }
    } finally {
      setOperationLoading('star', false);
    }
  };

  const handleArchive = async () => {
    setOperationLoading('archive', true);
    try {
      await executeMessageOperation(
        () => archiveMessages([message.id]),
        [message.id],
        'archive'
      );
    } finally {
      setOperationLoading('archive', false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this message?')) {
      return;
    }
    
    setOperationLoading('delete', true);
    try {
      await executeMessageOperation(
        () => deleteMessages([message.id]),
        [message.id],
        'delete'
      );
    } finally {
      setOperationLoading('delete', false);
    }
  };

  const handleReply = () => {
    if (onReply) {
      onReply();
      return;
    }

    startCompose({
      to: [message.from],
      subject: message.subject.startsWith('Re: ') 
        ? message.subject 
        : `Re: ${message.subject}`,
      replyToMessageId: message.id,
      body: `\n\n--- Original Message ---\nFrom: ${message.from.name || message.from.email}\nDate: ${message.date.toLocaleString()}\nSubject: ${message.subject}\n\n${message.body || message.snippet}`,
    });
  };

  const handleReplyAll = () => {
    if (onReplyAll) {
      onReplyAll();
      return;
    }

    const allRecipients = [
      message.from,
      ...message.to,
      ...(message.cc || [])
    ].filter((addr, index, self) => 
      index === self.findIndex(a => a.email === addr.email)
    );

    startCompose({
      to: allRecipients,
      subject: message.subject.startsWith('Re: ') 
        ? message.subject 
        : `Re: ${message.subject}`,
      replyToMessageId: message.id,
      body: `\n\n--- Original Message ---\nFrom: ${message.from.name || message.from.email}\nDate: ${message.date.toLocaleString()}\nSubject: ${message.subject}\nTo: ${message.to.map(addr => addr.email).join(', ')}\n\n${message.body || message.snippet}`,
    });
  };

  const handleForward = () => {
    if (onForward) {
      onForward();
      return;
    }

    startCompose({
      to: [],
      subject: message.subject.startsWith('Fwd: ') 
        ? message.subject 
        : `Fwd: ${message.subject}`,
      body: `\n\n---------- Forwarded message ---------\nFrom: ${message.from.name || message.from.email}\nDate: ${message.date.toLocaleString()}\nSubject: ${message.subject}\nTo: ${message.to.map(addr => addr.email).join(', ')}\n\n${message.body || message.snippet}`,
    });
  };

  const handleCopyMessageId = () => {
    navigator.clipboard.writeText(message.id).then(() => {
      console.log('Message ID copied to clipboard');
    });
  };

  const handleCopyContent = () => {
    const content = message.body || message.snippet || '';
    navigator.clipboard.writeText(content).then(() => {
      console.log('Message content copied to clipboard');
    });
  };

  return (
    <div className={`enhanced-message-actions ${className}`}>
      {/* Primary Actions */}
      <div className="mb-3 flex items-center gap-2">
        <ActionButton
          icon={Reply}
          label="Reply"
          onClick={handleReply}
          variant="primary"
        />
        
        <ActionButton
          icon={ReplyAll}
                      label="Reply all"
          onClick={handleReplyAll}
          variant="primary"
        />
        
        <ActionButton
          icon={Forward}
          label="Forward"
          onClick={handleForward}
          variant="primary"
        />
        
        <div className="bg-border-default mx-1 h-6 w-px" />
        
        <ActionButton
          icon={message.isRead ? Mail : MailOpen}
                        label={message.isRead ? 'Mark unread' : 'Mark read'}
          onClick={handleReadToggle}
          isActive={!message.isRead}
          isLoading={isProcessing.read}
        />
        
        <ActionButton
          icon={Star}
          label={message.isStarred ? 'Unstar' : 'Star'}
          onClick={handleStarToggle}
          isActive={message.isStarred}
          isLoading={isProcessing.star}
        />
      </div>

      {/* Secondary Actions */}
      {showAllActions && (
        <div className="flex flex-wrap items-center gap-2">
          <ActionButton
            icon={Archive}
            label="Archive"
            onClick={handleArchive}
            isLoading={isProcessing.archive}
          />
          
          <ActionButton
            icon={Trash2}
            label="Delete"
            onClick={handleDelete}
            variant="danger"
            isLoading={isProcessing.delete}
          />
          
          <ActionButton
            icon={Copy}
            label="Copy content"
            onClick={handleCopyContent}
          />
          
          <ActionButton
            icon={Tag}
            label="Copy ID"
            onClick={handleCopyMessageId}
          />
          
          {message.attachments.length > 0 && (
            <ActionButton
              icon={Download}
              label={`${message.attachments.length} Attachment${message.attachments.length > 1 ? 's' : ''}`}
              onClick={() => console.log('Download attachments')}
            />
          )}
        </div>
      )}

      {/* Message Metadata */}
      <div className="border-border-default mt-4 border-t pt-3">
        <div className="flex items-center justify-between text-xs text-secondary">
          <div className="flex items-center gap-4">
            <span>
              Labels: {message.labels.length > 0 
                ? message.labels.filter(l => !['INBOX', 'UNREAD', 'STARRED'].includes(l)).join(', ') || 'System labels only'
                : 'None'
              }
            </span>
            <span>Thread: {message.threadId}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span>
              Size: ~{Math.ceil((message.body?.length || message.snippet.length) / 1000)}KB
            </span>
            <span>
              ID: {message.id.substring(0, 8)}...
            </span>
          </div>
        </div>
      </div>

      {/* Importance indicator */}
      {message.importance && message.importance !== 'normal' && (
        <div className={`mt-2 inline-flex items-center gap-1 rounded px-2 py-1 text-xs ${
          message.importance === 'high' 
            ? 'bg-error-ghost text-error dark:bg-red-900/20 dark:text-red-400'
            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
        }`}>
          <Flag size={12} />
          {message.importance === 'high' ? 'High Priority' : 'Low Priority'}
        </div>
      )}
    </div>
  );
} 