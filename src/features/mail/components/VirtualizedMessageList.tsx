import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Star, Paperclip, ChevronDown, Loader2 } from 'lucide-react';
import { Text, Button } from '../../../components/ui';
import { useMailStore } from '../stores/mailStore';
import { useMailOperation } from '../hooks';
import { ParsedEmail } from '../types';

interface VirtualizedMessageListProps {
  className?: string;
  onMessageSelect?: (message: ParsedEmail) => void;
  itemHeight?: number;
  overscan?: number;
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
      className={`transition-colors duration-150 border-b border-[var(--border-default)] ${
        !message.isRead ? 'bg-[var(--bg-tertiary)] font-medium' : 'bg-[var(--bg-tertiary)]'
      } ${isSelected ? 'bg-[var(--accent-soft)]' : ''} hover:bg-[var(--bg-secondary)]`}
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
        <div 
          className="flex-shrink-0 w-28 min-w-0 cursor-pointer"
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
          className="flex-1 min-w-0 overflow-hidden cursor-pointer"
          onClick={() => onMessageClick(message)}
        >
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

interface PaginationControlsProps {
  onLoadMore: () => void;
  onLoadPrevious: () => void;
  isLoadingMore: boolean;
  hasMorePages: boolean;
  hasPreviousPages: boolean;
  currentPage: number;
  totalMessages: number;
  messagesLoadedSoFar: number;
  pageSize: number;
}

function PaginationControls({
  onLoadMore,
  onLoadPrevious,
  isLoadingMore,
  hasMorePages,
  hasPreviousPages,
  currentPage,
  totalMessages,
  messagesLoadedSoFar,
  pageSize
}: PaginationControlsProps) {
  const startIndex = messagesLoadedSoFar - pageSize + 1;
  const endIndex = Math.min(messagesLoadedSoFar, totalMessages);
  
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-secondary)] border-t border-[var(--border-default)]">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onLoadPrevious}
          disabled={!hasPreviousPages || isLoadingMore}
          className="flex items-center gap-1"
        >
          <ChevronDown size={16} className="transform rotate-90" />
          Previous
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onLoadMore}
          disabled={!hasMorePages || isLoadingMore}
          className="flex items-center gap-1"
        >
          {isLoadingMore ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              Next
              <ChevronDown size={16} className="transform -rotate-90" />
            </>
          )}
        </Button>
      </div>
      
      <div className="flex items-center gap-4">
        <Text size="sm" variant="secondary">
          {totalMessages > 0 ? `${Math.max(startIndex, 1)}-${endIndex} of ${totalMessages}` : 'No messages'}
        </Text>
        <Text size="sm" variant="secondary">
          Page {currentPage}
        </Text>
      </div>
    </div>
  );
}

export function VirtualizedMessageList({ 
  className = '', 
  onMessageSelect,
  itemHeight = 72,
  overscan = 5 
}: VirtualizedMessageListProps) {
  const { 
    getMessages, 
    selectedMessages, 
    selectMessage, 
    fetchMessage,
    isLoadingMessages,
    error,
    nextPage,
    prevPage,
    nextPageToken,
    pageTokens,
    totalMessages,
    messagesLoadedSoFar,
    pageSize,
    currentPage
  } = useMailStore();
  
  const { executeFetchOperation } = useMailOperation();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const messages = getMessages();
  const parentRef = useRef<HTMLDivElement>(null);

  // Virtualization with react-virtual
  const rowVirtualizer = useVirtualizer({
    count: messages.length,
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

  const handleLoadMore = async () => {
    if (!nextPageToken || isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      await nextPage();
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleLoadPrevious = async () => {
    if (pageTokens.length === 0 || isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      await prevPage();
    } catch (error) {
      console.error('Failed to load previous messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Auto-scroll to top when messages change (new page loaded)
  useEffect(() => {
    if (parentRef.current) {
      rowVirtualizer.scrollToIndex(0, { align: 'start' });
    }
  }, [currentPage, rowVirtualizer]);

  if (error) {
    const handleRetry = async () => {
      await executeFetchOperation(
        () => useMailStore.getState().fetchMessages(),
        'messages'
      );
    };

    return (
      <div className={`flex-1 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <Text size="lg" variant="body" style={{ marginBottom: 'var(--space-2)' }}>
            Unable to load messages
          </Text>
          <Text size="sm" variant="secondary" style={{ marginBottom: 'var(--space-3)' }}>
            {error}
          </Text>
          <Button onClick={handleRetry} variant="default">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (isLoadingMessages && messages.length === 0) {
    return (
      <div className={`flex-1 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <Loader2 size={24} className="animate-spin mb-2" />
          <Text size="lg" variant="secondary">
            Loading messages...
          </Text>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className={`flex-1 flex flex-col ${className}`}>
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
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col ${className}`}>
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
            const message = messages[virtualItem.index];
            
            return (
              <MessageItem
                key={message.id}
                message={message}
                isSelected={selectedMessages.includes(message.id)}
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

      {/* Pagination Controls */}
      <PaginationControls
        onLoadMore={handleLoadMore}
        onLoadPrevious={handleLoadPrevious}
        isLoadingMore={isLoadingMore}
        hasMorePages={!!nextPageToken}
        hasPreviousPages={pageTokens.length > 0}
        currentPage={currentPage}
        totalMessages={totalMessages}
        messagesLoadedSoFar={messagesLoadedSoFar}
        pageSize={pageSize}
      />
    </div>
  );
} 