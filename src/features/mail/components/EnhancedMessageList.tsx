/**
 * Enhanced Message List - Phase 2.2
 * 
 * Advanced message list with comprehensive email actions, selection management,
 * bulk operations, and enhanced user interface components.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { AlertCircle, RefreshCw, Inbox } from 'lucide-react';
import { useMailStore } from '../stores/mailStore';
import { EmailActionBar } from './EmailActionBar';
import { EnhancedMessageItem } from './EnhancedMessageItem';
import { useMailOperation } from '../hooks';
import { Text, Button } from '../../../components/ui';
import { ParsedEmail } from '../types';

interface EnhancedMessageListProps {
  compactMode?: boolean;
  showActionBar?: boolean;
  className?: string;
  onMessageSelect?: (message: ParsedEmail) => void;
}

export function EnhancedMessageList({
  compactMode = false,
  showActionBar = true,
  className = '',
  onMessageSelect
}: EnhancedMessageListProps) {
  const { 
    getMessages, 
    selectedMessages, 
    selectMessage, 
    selectAllMessages,
    clearSelection,
    fetchMessage,
    isLoadingMessages,
    error,
    currentMessage,
    nextPage,
    prevPage,
    nextPageToken,
    currentPage,
    totalMessages,
    currentAccountId
  } = useMailStore();

  const { executeFetchOperation } = useMailOperation();
  const [localSelectedMessages, setLocalSelectedMessages] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'sender' | 'subject'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterUnread, setFilterUnread] = useState(false);

  const messages = getMessages();

  // Sync local selection with store
  useEffect(() => {
    setLocalSelectedMessages(selectedMessages);
  }, [selectedMessages]);

  // Filter and sort messages
  const processedMessages = useMemo(() => {
    let filtered = [...messages];

    // Apply unread filter
    if (filterUnread) {
      filtered = filtered.filter(msg => !msg.isRead);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = a.date.getTime() - b.date.getTime();
          break;
        case 'sender':
          const senderA = a.from.name || a.from.email;
          const senderB = b.from.name || b.from.email;
          comparison = senderA.localeCompare(senderB);
          break;
        case 'subject':
          comparison = a.subject.localeCompare(b.subject);
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [messages, sortBy, sortOrder, filterUnread]);

  // Handle message selection
  const handleMessageSelect = useCallback((messageId: string, isSelected: boolean) => {
    selectMessage(messageId, isSelected);
  }, [selectMessage]);

  // Handle select all
  const handleSelectAll = useCallback((isSelected: boolean) => {
    selectAllMessages(isSelected);
  }, [selectAllMessages]);

  // Handle message click
  const handleMessageClick = useCallback(async (message: ParsedEmail) => {
    console.log('🔍 [ENHANCED_LIST] Email clicked:', {
      messageId: message.id,
      subject: message.subject,
      currentMessage: currentMessage?.id
    });
    
    try {
      // Set the message immediately for instant response
      useMailStore.setState({ 
        currentMessage: message,
        isLoading: false,
        error: null 
      });
      
      console.log('🚀 [ENHANCED_LIST] Set message immediately from list data');
      
      // Try to fetch full message details in the background
      try {
        await executeFetchOperation(
          () => fetchMessage(message.id),
          'message details'
        );
        
        console.log('✅ [ENHANCED_LIST] Full message details fetched successfully');
      } catch (fetchError) {
        console.warn('⚠️ [ENHANCED_LIST] Full message fetch failed, using list data:', fetchError);
      }
      
      // Call optional callback
      onMessageSelect?.(message);
      
    } catch (error) {
      console.error('❌ [ENHANCED_LIST] Message click failed:', error);
      useMailStore.setState({ 
        error: `Failed to open email: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isLoading: false 
      });
    }
  }, [currentMessage, executeFetchOperation, fetchMessage, onMessageSelect]);

  // Handle pagination
  const handleNextPage = useCallback(async () => {
    if (nextPageToken && !isLoadingMessages) {
      try {
        await nextPage();
      } catch (error) {
        console.error('Failed to load next page:', error);
      }
    }
  }, [nextPageToken, isLoadingMessages, nextPage]);

  const handlePrevPage = useCallback(async () => {
    if (currentPage > 1 && !isLoadingMessages) {
      try {
        await prevPage();
      } catch (error) {
        console.error('Failed to load previous page:', error);
      }
    }
  }, [currentPage, isLoadingMessages, prevPage]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    if (!isLoadingMessages && currentAccountId) {
      try {
        await useMailStore.getState().fetchMessages(undefined, undefined, undefined, currentAccountId);
      } catch (error) {
        console.error('Failed to refresh messages:', error);
      }
    }
  }, [isLoadingMessages, currentAccountId]);

  // Loading state
  if (isLoadingMessages && messages.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center h-64 ${className}`}>
        <RefreshCw size={32} className="animate-spin text-[var(--accent-primary)] mb-4" />
        <Text size="sm" variant="secondary">Loading messages...</Text>
      </div>
    );
  }

  // Error state
  if (error && messages.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center h-64 ${className}`}>
        <AlertCircle size={32} className="text-red-500 mb-4" />
        <Text size="sm" variant="secondary" className="mb-4">
          {error}
        </Text>
        <Button variant="outline" onClick={handleRefresh}>
          Try Again
        </Button>
      </div>
    );
  }

  // Empty state
  if (processedMessages.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center h-64 ${className}`}>
        <Inbox size={48} className="text-[var(--text-tertiary)] mb-4" />
        <Text size="lg" weight="medium" className="mb-2">
          {filterUnread ? 'No unread messages' : 'No messages'}
        </Text>
        <Text size="sm" variant="secondary" className="mb-4">
          {filterUnread 
            ? 'All your messages have been read'
            : 'Your inbox is empty'
          }
        </Text>
        {filterUnread && (
          <Button variant="outline" onClick={() => setFilterUnread(false)}>
            Show all messages
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Action Bar */}
      {showActionBar && (
        <EmailActionBar
          selectedMessages={localSelectedMessages}
          onClearSelection={clearSelection}
          compactMode={compactMode}
        />
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-tertiary)] border-b border-[var(--border-default)]">
        {/* Sort and Filter Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Text size="xs" variant="secondary">Sort by:</Text>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'sender' | 'subject')}
              className="px-2 py-1 text-xs bg-[var(--bg-primary)] border border-[var(--border-default)] rounded"
            >
              <option value="date">Date</option>
              <option value="sender">Sender</option>
              <option value="subject">Subject</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-2 py-1 text-xs bg-[var(--bg-primary)] border border-[var(--border-default)] rounded hover:bg-[var(--bg-secondary)]"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filterUnread}
              onChange={(e) => setFilterUnread(e.target.checked)}
              className="w-4 h-4"
            />
            <Text size="xs" variant="secondary">Unread only</Text>
          </label>
        </div>

        {/* Message Count and Refresh */}
        <div className="flex items-center gap-4">
          <Text size="xs" variant="secondary">
            {processedMessages.length} of {totalMessages} messages
          </Text>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoadingMessages}
            className="p-1"
          >
            <RefreshCw size={16} className={isLoadingMessages ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto bg-[var(--bg-primary)]">
        {processedMessages.map((message) => (
          <EnhancedMessageItem
            key={message.id}
            message={message}
            isSelected={localSelectedMessages.includes(message.id)}
            onSelect={handleMessageSelect}
            onClick={handleMessageClick}
            compactMode={compactMode}
          />
        ))}

        {/* Loading More Indicator */}
        {isLoadingMessages && messages.length > 0 && (
          <div className="flex items-center justify-center py-4">
            <RefreshCw size={20} className="animate-spin text-[var(--accent-primary)] mr-2" />
            <Text size="sm" variant="secondary">Loading more messages...</Text>
          </div>
        )}
      </div>

      {/* Pagination */}
      {(currentPage > 1 || nextPageToken) && (
        <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-tertiary)] border-t border-[var(--border-default)]">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage <= 1 || isLoadingMessages}
          >
            Previous
          </Button>
          
          <Text size="sm" variant="secondary">
            Page {currentPage}
          </Text>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={!nextPageToken || isLoadingMessages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

export default EnhancedMessageList; 