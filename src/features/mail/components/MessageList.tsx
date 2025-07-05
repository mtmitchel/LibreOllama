import React from 'react';
import { Star, Paperclip } from 'lucide-react';
import { Text, Card } from '../../../components/ui';
import { useMailStore } from '../stores/mailStore';
import { ParsedEmail } from '../types';

interface MessageItemProps {
  message: ParsedEmail;
  isSelected: boolean;
  onSelect: (messageId: string, isSelected: boolean) => void;
  onMessageClick: (message: ParsedEmail) => void;
}

function MessageItem({ message, isSelected, onSelect, onMessageClick }: MessageItemProps) {
  const { starMessages, unstarMessages } = useMailStore();

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (message.isStarred) {
      unstarMessages([message.id]);
    } else {
      starMessages([message.id]);
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
        className="flex items-center"
        style={{ 
          padding: 'var(--space-3) var(--space-4)',
          gap: 'var(--space-3)'
        }}
      >
        {/* Checkbox */}
        <div className="flex-shrink-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleCheckboxChange}
            className="w-4 h-4 text-[var(--accent-primary)] bg-transparent border-[var(--border-default)] rounded focus:ring-[var(--accent-primary)] focus:ring-2"
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
        <div className="flex-shrink-0 w-48">
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
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline" style={{ gap: 'var(--space-2)' }}>
            <Text 
              size="sm" 
              weight={!message.isRead ? 'semibold' : 'normal'}
              variant="body"
              className="truncate"
            >
              {truncateText(message.subject || '(no subject)', 50)}
            </Text>
            <Text 
              size="sm" 
              variant="secondary"
              className="truncate"
            >
              — {truncateText(message.snippet, 100)}
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
        <div className="flex-shrink-0 w-20 text-right">
          <Text 
            size="xs" 
            weight={!message.isRead ? 'semibold' : 'normal'}
            variant={!message.isRead ? 'body' : 'secondary'}
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
    messages, 
    selectedMessages, 
    selectMessage, 
    fetchMessage,
    isLoadingMessages,
    error 
  } = useMailStore();

  const handleMessageClick = (message: ParsedEmail) => {
    fetchMessage(message.id);
  };

  const handleSelect = (messageId: string, isSelected: boolean) => {
    selectMessage(messageId, isSelected);
  };

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Text size="lg" variant="body" style={{ marginBottom: 'var(--space-2)' }}>
            Unable to load messages
          </Text>
          <Text size="sm" variant="secondary">
            {error}
          </Text>
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
    <div className="flex-1 overflow-y-auto">
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
  );
} 