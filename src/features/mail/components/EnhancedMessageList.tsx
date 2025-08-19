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

interface ErrorBannerProps {
  error: string | null;
  onRefresh: () => void | Promise<void>;
  onReconnect?: () => void;
}

function ErrorBanner({ error, onRefresh, onReconnect }: ErrorBannerProps) {
  const [showBanner, setShowBanner] = React.useState<boolean>(!!error);
  const [fading, setFading] = React.useState<boolean>(false);
  const [lastError, setLastError] = React.useState<string | null>(error || null);
  const [lastErrorAt, setLastErrorAt] = React.useState<number | null>(error ? Date.now() : null);

  useEffect(() => {
    if (error) {
      setLastError(error);
      setLastErrorAt(Date.now());
      setFading(false);
      setShowBanner(true);
    } else if (showBanner) {
      setFading(true);
      const t = setTimeout(() => setShowBanner(false), 200);
      return () => clearTimeout(t);
    }
  }, [error]);

  if (!showBanner || !lastError) return null;
  const isAuthError = lastError.toLowerCase().includes('authentication failed') || lastError.toLowerCase().includes('no refresh token');
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const recentAuthError = isAuthError && lastErrorAt !== null && Date.now() - lastErrorAt < 60000;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`mb-3 rounded-md border px-3 py-2 shadow-sm transition-opacity duration-200 ${fading ? 'opacity-0' : 'opacity-100'} bg-error/10 border-error/40`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-error shrink-0"><AlertCircle size={16} /></span>
          <Text as="div" size="sm" weight="semibold" className="text-error truncate">
            {isAuthError ? 'Connection expired' : 'Unable to load messages'}
          </Text>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isAuthError && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (onReconnect) {
                  onReconnect();
                } else {
                  window.location.href = '/settings?tab=account&reconnect=1';
                }
              }}
            >
              Reconnect
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            disabled={!isOnline || recentAuthError}
            onClick={() => { void onRefresh(); }}
            title={!isOnline ? 'You are offline' : recentAuthError ? 'Please sign in again to continue' : 'Try again'}
          >
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}

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

  const handleReconnect = useCallback(() => {
    window.location.href = '/settings?tab=account&reconnect=1';
  }, []);

  // Loading state
  if (isLoadingMessages && messages.length === 0) {
    return (
      <div className={`flex h-full w-full flex-col items-center justify-center ${className}`}>
        <RefreshCw size={32} className="mb-4 animate-spin text-accent-primary" />
        <Text size="sm" variant="secondary">Loading messages...</Text>
      </div>
    );
  }

  // Empty state
  if (processedMessages.length === 0) {
    return (
      <div className={`flex h-full flex-col ${className}`}>
        <ErrorBanner error={error} onRefresh={handleRefresh} onReconnect={handleReconnect} />
        <div className="flex h-64 flex-col items-center justify-center">
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
      </div>
    );
  }

  return (
    <div className={`flex h-full flex-col ${className}`}>
      <ErrorBanner error={error} onRefresh={handleRefresh} onReconnect={handleReconnect} />
      {/* List header removed (redundant with toolbar) */}
      {/* Action Bar - Only show when messages are selected */}
      {showActionBar && localSelectedMessages.length > 0 && (
        <EmailActionBar
          selectedMessages={localSelectedMessages}
          onClearSelection={clearSelection}
          compactMode={compactMode}
        />
      )}


      {/* Message List */}
      <div className="mail-scrollbar flex-1 overflow-y-auto overflow-x-hidden bg-[var(--bg-primary)]">
        <div className="mail-list-container">
          {processedMessages.map((message) => (
            <EnhancedMessageItem
              key={message.id}
              message={message}
              isSelected={localSelectedMessages.includes(message.id)}
              onSelect={handleMessageSelect}
              onClick={handleMessageClick}
              compactMode={true}
            />
          ))}
        </div>

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
