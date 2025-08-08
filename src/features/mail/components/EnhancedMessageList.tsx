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
import { logger } from '../../../core/lib/logger';
import './mail-scrollbar.css';

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

  // Load messages on mount if none exist
  useEffect(() => {
    if (messages.length === 0 && !isLoadingMessages && currentAccountId) {
      logger.debug('[EnhancedMessageList] No messages loaded, fetching...');
      useMailStore.getState().fetchMessages(undefined, undefined, undefined, currentAccountId);
    }
  }, [currentAccountId]); // Only depend on account ID to avoid re-fetching

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
        case 'date': {
          comparison = a.date.getTime() - b.date.getTime();
          break;
        }
        case 'sender': {
          const senderA = a.from.name || a.from.email;
          const senderB = b.from.name || b.from.email;
          comparison = senderA.localeCompare(senderB);
          break;
        }
        case 'subject': {
          comparison = a.subject.localeCompare(b.subject);
          break;
        }
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [messages, sortBy, sortOrder, filterUnread]);

  // Handle message selection
  const handleMessageSelect = useCallback((messageId: string, isSelected: boolean) => {
    selectMessage(messageId, isSelected);
  }, [selectMessage]);

  // Handle message click
  const handleMessageClick = useCallback(async (message: ParsedEmail) => {
    logger.debug('🔍 [ENHANCED_LIST] Email clicked:', {
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
      
      logger.debug('🚀 [ENHANCED_LIST] Set message immediately from list data');
      
      // Try to fetch full message details in the background
      try {
        await executeFetchOperation(
          () => fetchMessage(message.id),
          'message details'
        );
        
        logger.debug('✅ [ENHANCED_LIST] Full message details fetched successfully');
      } catch (fetchError) {
        logger.warn('⚠️ [ENHANCED_LIST] Full message fetch failed, using list data:', fetchError);
      }
      
      // Call optional callback
      onMessageSelect?.(message);
      
    } catch (error) {
      logger.error('❌ [ENHANCED_LIST] Message click failed:', error);
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
        logger.error('Failed to load next page:', error);
      }
    }
  }, [nextPageToken, isLoadingMessages, nextPage]);

  const handlePrevPage = useCallback(async () => {
    if (currentPage > 1 && !isLoadingMessages) {
      try {
        await prevPage();
      } catch (error) {
        logger.error('Failed to load previous page:', error);
      }
    }
  }, [currentPage, isLoadingMessages, prevPage]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    if (!isLoadingMessages && currentAccountId) {
      try {
        await useMailStore.getState().fetchMessages(undefined, undefined, undefined, currentAccountId);
      } catch (error) {
        logger.error('Failed to refresh messages:', error);
      }
    }
  }, [isLoadingMessages, currentAccountId]);

  // Loading state
  if (isLoadingMessages && messages.length === 0) {
    return (
      <div className={`flex h-full w-full flex-col items-center justify-center ${className}`}>
        <RefreshCw size={32} className="mb-4 animate-spin text-accent-primary" />
        <Text size="sm" variant="secondary">Loading messages...</Text>
      </div>
    );
  }

  // Error state
  if (error && messages.length === 0) {
    // Parse error to provide better user experience
    const isAuthError = error.toLowerCase().includes('authentication failed') || 
                       error.toLowerCase().includes('no refresh token');
    
    return (
      <div className={`flex h-full w-full flex-col items-center justify-center ${className}`}>
        <AlertCircle size={32} className="mb-4 text-error" />
        <Text size="lg" weight="medium" className="mb-2">
          {isAuthError ? 'Connection expired' : 'Unable to load messages'}
        </Text>
        <div className="flex gap-2">
          {isAuthError ? (
            <Button 
              variant="primary" 
              onClick={() => {
                // Open settings to reconnect account
                window.location.href = '/settings?tab=account';
              }}
            >
              Reconnect account
            </Button>
          ) : (
            <Button variant="outline" onClick={handleRefresh}>
              Try again
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Empty state
  if (processedMessages.length === 0) {
    return (
      <div className={`flex h-64 flex-col items-center justify-center ${className}`}>
        <Inbox size={48} className="mb-4 text-muted" />
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
    <div className={`flex h-full flex-col ${className}`}>
      {/* Action Bar - Only show when messages are selected */}
      {showActionBar && localSelectedMessages.length > 0 && (
        <EmailActionBar
          selectedMessages={localSelectedMessages}
          onClearSelection={clearSelection}
          compactMode={compactMode}
        />
      )}


      {/* Message List */}
      <div className="mail-scrollbar flex-1 overflow-y-auto overflow-x-hidden bg-content">
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
            <RefreshCw size={20} className="mr-2 animate-spin text-accent-primary" />
            <Text size="sm" variant="secondary">Loading more messages...</Text>
          </div>
        )}
      </div>

      {/* Pagination */}
      {(currentPage > 1 || nextPageToken) && (
        <div className="border-border-default flex items-center justify-between border-t bg-tertiary px-4 py-3">
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
