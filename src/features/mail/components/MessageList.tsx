import React from 'react';
import { Star, Paperclip } from 'lucide-react';
import { Text, Card } from '../../../components/ui';
import { useMailStore } from '../stores/mailStore';
import { useMailOperation } from '../hooks';
import { ParsedEmail } from '../types';
import { MailPagination } from './MailPagination';

interface MessageItemProps {
  message: ParsedEmail;
  isSelected: boolean;
  onSelect: (messageId: string, isSelected: boolean) => void;
  onMessageClick: (message: ParsedEmail) => void;
}

function MessageItem({ message, isSelected, onSelect, onMessageClick }: MessageItemProps) {
  const { starMessages, unstarMessages } = useMailStore();
  const { executeMessageOperation } = useMailOperation();

  const handleStarClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
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
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelect(message.id, e.target.checked);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isThisYear = date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (isThisYear) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div
      className={`cursor-pointer transition-colors duration-150 border-b border-[var(--border-default)] ${
        !message.isRead ? 'bg-[var(--bg-tertiary)] font-medium' : 'bg-[var(--bg-tertiary)]'
      } ${isSelected ? 'bg-[var(--accent-soft)]' : ''} hover:bg-[var(--bg-secondary)]`}
      onClick={() => onMessageClick(message)}
    >
      <div 
        className="flex items-center overflow-hidden w-full"
        style={{ 
          padding: 'var(--space-2) var(--space-3)',
          gap: 'var(--space-2)'
        }}
      >
        {/* Checkbox */}
        <div className="flex-shrink-0 w-3 flex items-center justify-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleCheckboxChange}
            className="w-3 h-3 text-[var(--accent-primary)] bg-transparent border-[var(--border-default)] rounded-none focus:ring-[var(--accent-primary)] focus:ring-1 focus:ring-offset-0 cursor-pointer"
            style={{ transform: 'scale(0.5)' }}
          />
        </div>

        {/* Star */}
        <div className="flex-shrink-0">
          <button
            onClick={handleStarClick}
            className="p-1 hover:bg-[var(--bg-tertiary)] rounded transition-colors duration-150"
          >
            <Star
              size={16}
              className={`${
                message.isStarred 
                  ? 'text-yellow-500 fill-yellow-500' 
                  : 'text-[var(--border-default)] hover:text-[var(--text-secondary)]'
              } transition-colors duration-150`}
            />
          </button>
        </div>

        {/* Sender */}
        <div className="flex-shrink-0 w-28 min-w-0">
          <Text 
            size="sm" 
            weight={!message.isRead ? 'semibold' : 'normal'}
            variant={!message.isRead ? 'body' : 'secondary'}
            className="truncate"
          >
            {message.from.name || message.from.email}
          </Text>
        </div>

        {/* Subject and Snippet */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-baseline min-w-0" style={{ gap: 'var(--space-1)' }}>
            <Text 
              size="sm" 
              weight={!message.isRead ? 'semibold' : 'normal'}
              variant="body"
              className="truncate flex-shrink-0"
              style={{ maxWidth: '180px' }}
            >
              {truncateText(message.subject || '(no subject)', 35)}
            </Text>
            <Text 
              size="sm" 
              variant="secondary"
              className="truncate flex-1 min-w-0"
            >
              — {truncateText(message.snippet, 60)}
            </Text>
          </div>
        </div>

        {/* Attachments */}
        {message.attachments.length > 0 && (
          <div className="flex-shrink-0">
            <Paperclip size={14} className="text-[var(--text-secondary)]" />
          </div>
        )}

        {/* Date */}
        <div className="flex-shrink-0 w-12 text-right min-w-0">
          <Text 
            size="xs" 
            weight={!message.isRead ? 'semibold' : 'normal'}
            variant={!message.isRead ? 'body' : 'secondary'}
            className="truncate"
          >
            {formatDate(message.date)}
          </Text>
        </div>
      </div>
    </div>
  );
}

export function MessageList() {
  const { 
    getMessages, 
    selectedMessages, 
    selectMessage, 
    fetchMessage,
    isLoadingMessages,
    error 
  } = useMailStore();
  const { executeFetchOperation } = useMailOperation();

  const messages = getMessages();

  const handleMessageClick = async (message: ParsedEmail) => {
    await executeFetchOperation(
      () => fetchMessage(message.id),
      'message details'
    );
  };

  const handleSelect = (messageId: string, isSelected: boolean) => {
    selectMessage(messageId, isSelected);
  };

  if (error) {
    const handleRetry = async () => {
      // Use standardized error handling for retry
      await executeFetchOperation(
        () => useMailStore.getState().fetchMessages(),
        'messages'
      );
    };

    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Text size="lg" variant="body" style={{ marginBottom: 'var(--space-2)' }}>
            Unable to load messages
          </Text>
          <Text size="sm" variant="secondary" style={{ marginBottom: 'var(--space-3)' }}>
            {error}
          </Text>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded hover:bg-[var(--accent-primary-hover)] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoadingMessages) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Text size="lg" variant="secondary">
            Loading messages...
          </Text>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Text size="lg" variant="body" style={{ marginBottom: 'var(--space-2)' }}>
            No messages found
          </Text>
          <Text size="sm" variant="secondary">
            Your inbox is empty or try a different search.
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="min-h-full">
          {messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              isSelected={selectedMessages.includes(message.id)}
              onSelect={handleSelect}
              onMessageClick={handleMessageClick}
            />
          ))}
        </div>
      </div>
      
      {/* Pagination */}
      <div className="flex-shrink-0">
        <MailPagination />
      </div>
    </div>
  );
} 