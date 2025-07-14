import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Star, Paperclip, Loader2 } from 'lucide-react';
import { Text } from '../../../components/ui';
import { useMailStore } from '../stores/mailStore';
import { useMailOperation } from '../hooks';
import { ParsedEmail } from '../types';

interface InfiniteScrollMessageListProps {
  className?: string;
  onMessageSelect?: (message: ParsedEmail) => void;
  itemHeight?: number;
  overscan?: number;
  loadThreshold?: number; // Load more when this many items from bottom
}

interface MessageItemProps {
  message: ParsedEmail;
  isSelected: boolean;
  onSelect: (messageId: string, isSelected: boolean) => void;
  onMessageClick: (message: ParsedEmail) => void;
  style?: React.CSSProperties;
}

function MessageItem({ message, isSelected, onSelect, onMessageClick, style }: MessageItemProps) {
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
      style={style}
      className={`border-border-primary border-b transition-colors duration-150 ${
        !message.isRead ? 'bg-bg-tertiary font-medium' : 'bg-bg-tertiary'
      } ${isSelected ? 'bg-accent-bg' : ''} hover:bg-bg-secondary`}
    >
      <div className="flex w-full items-center gap-2 overflow-hidden p-2 px-3">
        {/* Checkbox */}
        <div className="flex w-3 shrink-0 items-center justify-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleCheckboxChange}
            className="border-border-primary focus:ring-accent-primary size-3 scale-50 cursor-pointer rounded-none bg-transparent text-accent-primary focus:ring-1 focus:ring-offset-0"
          />
        </div>

        {/* Star */}
        <div className="shrink-0">
          <button
            onClick={handleStarClick}
            className="hover:bg-bg-tertiary rounded p-1 transition-colors duration-150"
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

function LoadingItem({ style }: { style?: React.CSSProperties }) {
  return (
    <div 
      style={style}
      className="border-border-default flex items-center justify-center border-b py-4"
    >
      <Loader2 size={20} className="animate-spin text-secondary" />
    </div>
  );
}

export function InfiniteScrollMessageList({ 
  className = '', 
  onMessageSelect,
  itemHeight = 72,
  overscan = 5,
  loadThreshold = 3
}: InfiniteScrollMessageListProps) {
  const { 
    getMessages, 
    selectedMessages, 
    selectMessage, 
    fetchMessage,
    isLoadingMessages,
    error,
    nextPage,
    nextPageToken,
    totalMessages,
    messagesLoadedSoFar
  } = useMailStore();
  
  const { executeFetchOperation } = useMailOperation();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [allMessages, setAllMessages] = useState<ParsedEmail[]>([]);
  
  const messages = getMessages();
  const parentRef = useRef<HTMLDivElement>(null);

  // Update local messages when store messages change
  useEffect(() => {
    setAllMessages(messages);
  }, [messages]);

  // Add loading item at the end if we have more pages
  const items = useMemo(() => {
    if (nextPageToken && !isLoadingMore) {
      return [...allMessages, null]; // null represents loading item
    }
    return allMessages;
  }, [allMessages, nextPageToken, isLoadingMore]);

  // Virtualization with react-virtual
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  const handleMessageClick = async (message: ParsedEmail) => {
    console.log('🔍 [DEBUG] Email clicked:', {
      messageId: message.id,
      subject: message.subject,
      currentMessage: useMailStore.getState().currentMessage?.id
    });
    
    try {
      // Immediate fallback: Set the message directly from the list data
      useMailStore.setState({ 
        currentMessage: message,
        isLoading: false,
        error: null 
      });
      
      console.log('🚀 [DEBUG] Set message immediately from list data');
      
      // Try to fetch full message details in the background
      try {
        await executeFetchOperation(
          () => fetchMessage(message.id),
          'message details'
        );
        
        console.log('✅ [DEBUG] Full message details fetched successfully');
      } catch (fetchError) {
        console.warn('⚠️ [DEBUG] Full message fetch failed, using list data:', fetchError);
      }
      
      // Call optional callback
      if (onMessageSelect) {
        onMessageSelect(message);
      }
      
    } catch (error) {
      console.error('❌ [DEBUG] Message click failed completely:', error);
      useMailStore.setState({ 
        error: `Failed to open email: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isLoading: false 
      });
    }
  };

  const handleSelect = (messageId: string, isSelected: boolean) => {
    selectMessage(messageId, isSelected);
  };

  const loadMoreMessages = useCallback(async () => {
    if (!nextPageToken || isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      await nextPage();
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextPageToken, isLoadingMore, nextPage]);

  // Handle infinite scroll
  useEffect(() => {
    const [lastItem] = [...virtualItems].reverse();
    
    if (!lastItem || !nextPageToken || isLoadingMore) return;
    
    // Check if we're near the end
    if (lastItem.index >= items.length - 1 - loadThreshold) {
      loadMoreMessages();
    }
  }, [virtualItems, items.length, loadThreshold, loadMoreMessages, nextPageToken, isLoadingMore]);

  if (error) {
    const handleRetry = async () => {
      await executeFetchOperation(
        () => useMailStore.getState().fetchMessages(),
        'messages'
      );
    };

    return (
      <div className={`flex flex-1 items-center justify-center ${className}`}>
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

  if (isLoadingMessages && allMessages.length === 0) {
    return (
      <div className={`flex flex-1 items-center justify-center ${className}`}>
        <div className="text-center">
          <Loader2 size={24} className="mb-2 animate-spin" />
          <Text size="lg" variant="secondary">
            Loading messages...
          </Text>
        </div>
      </div>
    );
  }

  if (allMessages.length === 0) {
    return (
      <div className={`flex flex-1 items-center justify-center ${className}`}>
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
    <div className={`flex flex-1 flex-col ${className}`}>
      {/* Status bar */}
      <div className="border-border-default border-b bg-secondary px-4 py-2">
        <Text size="sm" variant="secondary">
          {messagesLoadedSoFar} of {totalMessages} messages loaded
          {nextPageToken && <span className="ml-2 text-accent-primary">• Loading more...</span>}
        </Text>
      </div>

      {/* Virtualized List */}
      <div 
        ref={parentRef}
        className="flex-1 overflow-auto"
        style={{ 
          contain: 'strict',
          height: '100%',
          width: '100%'
        }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualItem) => {
            const item = items[virtualItem.index];
            
            // Loading item
            if (item === null) {
              return (
                <LoadingItem
                  key={`loading-${virtualItem.index}`}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                />
              );
            }
            
            // Message item
            return (
              <MessageItem
                key={item.id}
                message={item}
                isSelected={selectedMessages.includes(item.id)}
                onSelect={handleSelect}
                onMessageClick={handleMessageClick}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
} 