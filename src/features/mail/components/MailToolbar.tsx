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
    messagesLoadedSoFar,
    nextPageToken,
    prevPage,
    nextPage
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
    fetchMessages();
  };

  const handlePreviousPage = async () => {
    if (messagesLoadedSoFar > 0 && !isLoadingMessages) {
      await prevPage();
    }
  };

  const handleNextPage = async () => {
    if (nextPageToken && !isLoadingMessages) {
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
        <Text size="sm" variant="secondary">
          {(() => {
            if (messages.length === 0) {
              return `0-0 of ${totalMessages}`;
            }
            
            const start = messagesLoadedSoFar + 1;
            const end = messagesLoadedSoFar + messages.length;
            
            console.log(`📄 [TOOLBAR] Token-based pagination display:`, {
              start,
              end,
              totalMessages,
              messagesLoadedSoFar,
              currentPageMessages: messages.length
            });
            
            const safeTotal = typeof totalMessages === 'number' && !isNaN(totalMessages) && totalMessages > 0 
              ? totalMessages 
              : (nextPageToken ? `${end}+` : end);
            
            return `${start}-${end} of ${safeTotal}`;
          })()}
        </Text>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePreviousPage}
          disabled={messagesLoadedSoFar === 0 || isLoadingMessages}
          className="h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
          title="Previous page"
        >
          <ChevronLeft size={16} />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextPage}
          disabled={!nextPageToken || isLoadingMessages}
          className="h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
          title="Next page"
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
} 