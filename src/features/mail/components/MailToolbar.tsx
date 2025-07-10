import React from 'react';
import { 
  Archive, 
  Trash2, 
  MailOpen, 
  Mail, 
  Star, 
  Clock, 
  MoreHorizontal,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { Button, Text } from '../../../components/ui';
import { useMailStore } from '../stores/mailStore';

export function MailToolbar() {
  const { 
    selectedMessages, 
    getMessages,
    selectAllMessages,
    clearSelection,
    archiveMessages,
    deleteMessages,
    markAsRead,
    markAsUnread,
    starMessages,
    fetchMessages,
    isLoadingMessages,
    // Token-based pagination
    totalMessages,
    totalUnreadMessages,
    messagesLoadedSoFar,
    nextPageToken,
    isHydrated,
    prevPage,
    nextPage,
    resetPagination
  } = useMailStore();

  const messages = getMessages();
  const selectedCount = selectedMessages.length;
  const isAllSelected = messages.length > 0 && selectedMessages.length === messages.length;
  const isPartiallySelected = selectedMessages.length > 0 && selectedMessages.length < messages.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      clearSelection();
    } else {
      selectAllMessages(true);
    }
  };

  const handleArchive = () => {
    if (selectedCount > 0) {
      archiveMessages(selectedMessages);
    }
  };

  const handleDelete = () => {
    if (selectedCount > 0) {
      deleteMessages(selectedMessages);
    }
  };

  const handleMarkAsRead = () => {
    if (selectedCount > 0) {
      markAsRead(selectedMessages);
    }
  };

  const handleMarkAsUnread = () => {
    if (selectedCount > 0) {
      markAsUnread(selectedMessages);
    }
  };

  const handleStar = () => {
    if (selectedCount > 0) {
      starMessages(selectedMessages);
    }
  };

  const handleRefresh = () => {
    // Reset pagination state and fetch messages from beginning
    resetPagination();
    fetchMessages();
  };

  const handlePreviousPage = async () => {
    if (isHydrated && messagesLoadedSoFar > 0 && !isLoadingMessages) {
      await prevPage();
    }
  };

  const handleNextPage = async () => {
    if (isHydrated && nextPageToken && !isLoadingMessages) {
      await nextPage();
    }
  };

  return (
    <div 
      className="flex items-center justify-between bg-[var(--bg-tertiary)]"
      style={{ 
        padding: 'var(--space-3) var(--space-4)',
        gap: 'var(--space-2)'
      }}
    >
      {/* Left Side - Selection and Actions */}
      <div className="flex items-center" style={{ gap: 'var(--space-2)' }}>
        {/* Select All Checkbox */}
        <div className="relative w-3 flex items-center justify-center">
          <input
            type="checkbox"
            checked={isAllSelected}
            ref={(input) => {
              if (input) input.indeterminate = isPartiallySelected;
            }}
            onChange={handleSelectAll}
            className="w-3 h-3 text-[var(--accent-primary)] bg-transparent border-[var(--border-default)] rounded-none focus:ring-[var(--accent-primary)] focus:ring-1 focus:ring-offset-0 cursor-pointer"
            style={{ transform: 'scale(0.5)' }}
          />
        </div>

        {/* Refresh Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={isLoadingMessages}
          className="h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          title="Refresh"
        >
          <RefreshCw size={16} className={isLoadingMessages ? 'animate-spin' : ''} />
        </Button>

        {/* Action Buttons - Only show when messages are selected */}
        {selectedCount > 0 && (
          <>
            <div className="w-px h-6 bg-[var(--border-default)] mx-1" />
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleArchive}
              className="h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              title="Archive"
            >
              <Archive size={16} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              title="Delete"
            >
              <Trash2 size={16} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleMarkAsRead}
              className="h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              title="Mark as read"
            >
              <MailOpen size={16} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleMarkAsUnread}
              className="h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              title="Mark as unread"
            >
              <Mail size={16} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleStar}
              className="h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              title="Add star"
            >
              <Star size={16} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              title="Snooze"
            >
              <Clock size={16} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              title="More"
            >
              <MoreHorizontal size={16} />
            </Button>

            <div className="w-px h-6 bg-[var(--border-default)] mx-1" />
            
            <Text size="sm" variant="secondary">
              {selectedCount} selected
            </Text>
          </>
        )}
      </div>

      {/* Right Side - Pagination */}
      <div className="flex items-center" style={{ gap: 'var(--space-2)' }}>
        {/* Pagination Display */}
        <Text size="sm" variant="secondary">
          {(() => {
            if (messages.length === 0) {
              return `0-0 of ${totalMessages || 0}`;
            }
            
            const start = messagesLoadedSoFar + 1;
            const end = messagesLoadedSoFar + messages.length;
            
            // CLARIFIED LOGIC: Always use totalMessages for "of X" to represent the total count being paginated
            // This should represent the total messages in the current view/label, not unread count
            let displayTotal = totalMessages;
            
            // Fallback logic if totalMessages is not available
            if (!displayTotal || displayTotal <= 0) {
              displayTotal = nextPageToken ? `${end}+` : end;
            }
            
            console.log(`📄 [TOOLBAR] PAGINATION DISPLAY - START: ${start}, END: ${end}, TOTAL: ${displayTotal}`, {
              start,
              end,
              totalMessages,
              totalUnreadMessages, // Still track but don't use in main display
              messagesLoadedSoFar,
              currentPageMessages: messages.length,
              displayTotal
            });
            
            return `${start}-${end} of ${displayTotal}`;
          })()}
        </Text>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePreviousPage}
          disabled={!isHydrated || messagesLoadedSoFar === 0 || isLoadingMessages}
          className="h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
          title={!isHydrated ? "Loading..." : "Previous page"}
        >
          <ChevronLeft size={16} />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextPage}
          disabled={!isHydrated || !nextPageToken || isLoadingMessages}
          className="h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
          title={!isHydrated ? "Loading..." : "Next page"}
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
} 