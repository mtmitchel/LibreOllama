import React from 'react';
import { Star, Paperclip } from 'lucide-react';
import { Text, Card } from '../../../components/ui';
import { useMailStore } from '../stores/mailStore';
import { useMailOperation } from '../hooks';
import { ParsedEmail } from '../types';
import { logger } from '../../../core/lib/logger';

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
      className={`border-b border-default transition-colors duration-150 ${
        !message.isRead ? 'bg-tertiary font-medium' : 'bg-tertiary'
      } ${isSelected ? 'bg-accent-soft' : ''} hover:bg-secondary`}
    >
      <div 
        className="flex w-full items-center gap-2 overflow-hidden px-3 py-2"
      >
        {/* Checkbox */}
        <div className="flex w-3 shrink-0 items-center justify-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleCheckboxChange}
            className="focus:ring-accent-primary size-3 cursor-pointer rounded-none border-default bg-transparent text-accent-primary focus:ring-1 focus:ring-offset-0"
            style={{ transform: 'scale(0.5)' }}
          />
        </div>

        {/* Star */}
        <div className="shrink-0">
          <button
            onClick={handleStarClick}
            className="rounded p-1 transition-colors duration-150 hover:bg-tertiary"
          >
            <Star
              size={16}
              className={`${
                message.isStarred 
                  ? 'fill-warning text-warning' 
                  : 'text-border-primary hover:text-text-secondary'
              } transition-colors duration-150`}
            />
          </button>
        </div>

        {/* Sender */}
        <div 
          className="w-28 min-w-0 shrink-0 cursor-pointer"
          onClick={() => onMessageClick(message)}
        >
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
        <div 
          className="min-w-0 flex-1 cursor-pointer overflow-hidden"
          onClick={() => onMessageClick(message)}
        >
                        <div className="flex min-w-0 items-baseline gap-1">
            <Text 
              size="sm" 
              weight={!message.isRead ? 'semibold' : 'normal'}
              variant="body"
              className="shrink-0 truncate"
              style={{ maxWidth: '180px' }}
            >
              {truncateText(message.subject || '(no subject)', 35)}
            </Text>
            <Text 
              size="sm" 
              variant="secondary"
              className="min-w-0 flex-1 truncate"
            >
              — {truncateText(message.snippet, 60)}
            </Text>
          </div>
        </div>

        {/* Attachments */}
        {message.attachments.length > 0 && (
          <div className="shrink-0">
            <Paperclip size={14} className="text-secondary" />
          </div>
        )}

        {/* Date */}
        <div className="w-12 min-w-0 shrink-0 text-right">
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
    logger.debug('🔍 [DEBUG] Email clicked:', {
      messageId: message.id,
      subject: message.subject,
      currentMessage: useMailStore.getState().currentMessage?.id
    });
    
    try {
      // Immediate fallback: Set the message directly from the list data
      // This ensures emails open instantly while we try to fetch full details
      useMailStore.setState({ 
        currentMessage: message,
        isLoading: false,
        error: null 
      });
      
      logger.debug('🚀 [DEBUG] Set message immediately from list data');
      
      // Try to fetch full message details in the background
      try {
        await executeFetchOperation(
          () => fetchMessage(message.id),
          'message details'
        );
        
        logger.debug('✅ [DEBUG] Full message details fetched successfully');
      } catch (fetchError) {
        logger.warn('⚠️ [DEBUG] Full message fetch failed, using list data:', fetchError);
        // Keep the message from list data - it's better than nothing
      }
      
    } catch (error) {
      logger.error('❌ [DEBUG] Message click failed completely:', error);
      useMailStore.setState({ 
        error: `Failed to open email: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isLoading: false 
      });
    }
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
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <Text size="lg" variant="body" className="mb-2">
            Unable to load messages
          </Text>
          <Text size="sm" variant="secondary" className="mb-3">
            {error}
          </Text>
          <button
            onClick={handleRetry}
            className="hover:bg-accent-primary-hover rounded bg-accent-primary px-4 py-2 text-white transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoadingMessages) {
    return (
      <div className="flex flex-1 items-center justify-center">
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
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <Text size="lg" variant="body" className="mb-2">
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
    <div className="flex flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
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
    </div>
  );
} 
