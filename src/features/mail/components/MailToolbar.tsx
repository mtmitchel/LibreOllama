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
import { Tooltip } from '../../../components/ui/Tooltip';
import { Check } from 'lucide-react';
import { useMailStore } from '../stores/mailStore';
import { logger } from '../../../core/lib/logger';
import { useShallow } from 'zustand/react/shallow';

export function MailToolbar() {
  // Use stable selectors to prevent infinite re-renders
  const selectedMessages = useMailStore(useShallow(state => state.selectedMessages));
  const { 
    selectAllMessages,
    clearSelection,
    archiveMessages,
    deleteMessages,
    markAsRead,
    markAsUnread,
    starMessages,
    fetchMessages,
    isLoadingMessages,
    resetPagination,
    getMessages, // Import getMessages selector
  } = useMailStore(useShallow(state => ({
    selectAllMessages: state.selectAllMessages,
    clearSelection: state.clearSelection,
    archiveMessages: state.archiveMessages,
    deleteMessages: state.deleteMessages,
    markAsRead: state.markAsRead,
    markAsUnread: state.markAsUnread,
    starMessages: state.starMessages,
    fetchMessages: state.fetchMessages,
    isLoadingMessages: state.isLoadingMessages,
    resetPagination: state.resetPagination,
    getMessages: state.getMessages, // Add getMessages to the selector
  })));
  
  const {
    totalMessages,
    totalUnreadMessages,
    currentPage,
    currentPageStartIndex,
    messagesLoadedSoFar,
    nextPageToken,
    isHydrated,
    prevPage,
    nextPage,
    isNavigatingBackwards,
    currentView,
    currentLabel,
    getLabels,
    lastSyncTime,
  } = useMailStore(useShallow(state => ({
    totalMessages: state.totalMessages || 0,
    totalUnreadMessages: state.totalUnreadMessages || 0,
    currentPage: state.currentPage,
    currentPageStartIndex: state.currentPageStartIndex,
    messagesLoadedSoFar: state.messagesLoadedSoFar,
    nextPageToken: state.nextPageToken,
    isHydrated: state.isHydrated,
    prevPage: state.prevPage,
    nextPage: state.nextPage,
    isNavigatingBackwards: state.isNavigatingBackwards,
    currentView: state.currentView,
    currentLabel: state.currentLabel,
    getLabels: state.getLabels,
    lastSyncTime: state.lastSyncTime,
  })));
  
  const labels = getLabels();

  const messages = getMessages(); // Use the getMessages selector
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

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Never synced';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="flex items-center justify-between gap-2 bg-tertiary px-4 py-3">
      {/* Left Side - Selection and Actions */}
      <div className="flex items-center gap-2">
        {/* Select All Checkbox */}
        <div className="relative flex size-5 items-center justify-center">
          <input
            type="checkbox"
            checked={isAllSelected}
            ref={(input) => {
              if (input) input.indeterminate = isPartiallySelected;
            }}
            onChange={handleSelectAll}
            className="border-border-default focus:ring-accent-primary size-4 cursor-pointer rounded bg-transparent text-accent-primary focus:ring-1 focus:ring-offset-0"
          />
        </div>

        {/* Refresh Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={isLoadingMessages}
          className="size-8 text-secondary hover:text-primary"
          title="Refresh"
        >
          <RefreshCw size={16} className={isLoadingMessages ? 'animate-spin' : ''} />
        </Button>

        {/* Sync Status Indicator */}
        <Tooltip content={`Last sync: ${formatLastSync(lastSyncTime)}`} position="bottom" delay={100}>
          <div className="flex items-center text-success">
            <Check size={16} />
          </div>
        </Tooltip>

        {/* Action Buttons - Only show when messages are selected */}
        {selectedCount > 0 && (
          <>
            <div className="bg-border-default mx-1 h-6 w-px" />
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleArchive}
              className="size-8 text-secondary hover:text-primary"
              title="Archive"
            >
              <Archive size={16} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="size-8 text-secondary hover:text-primary"
              title="Delete"
            >
              <Trash2 size={16} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleMarkAsRead}
              className="size-8 text-secondary hover:text-primary"
              title="Mark as read"
            >
              <MailOpen size={16} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleMarkAsUnread}
              className="size-8 text-secondary hover:text-primary"
              title="Mark as unread"
            >
              <Mail size={16} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleStar}
              className="size-8 text-secondary hover:text-primary"
              title="Add star"
            >
              <Star size={16} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-secondary hover:text-primary"
              title="Snooze"
            >
              <Clock size={16} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-secondary hover:text-primary"
              title="More"
            >
              <MoreHorizontal size={16} />
            </Button>

            <div className="bg-border-default mx-1 h-6 w-px" />
            
            <Text size="sm" variant="secondary">
              {selectedCount} selected
            </Text>
          </>
        )}
      </div>

      {/* Right Side - Pagination */}
      <div className="flex items-center gap-2">
        {/* Pagination Display */}
        <Text size="sm" variant="secondary">
          {(() => {
            if (messages.length === 0) {
              return `0-0 of ${totalMessages || 0}`;
            }
            
            const start = messagesLoadedSoFar + 1;
            const end = messagesLoadedSoFar + messages.length;
            
            // For INBOX, show the unread thread count
            // For other labels/views, show the total messages
            let displayTotal: string | number;
            
            // Debug logging to understand the issue
            console.log('🔍 [MAIL_TOOLBAR] Pagination Debug:', {
              currentView,
              currentLabel,
              totalMessages,
              totalUnreadMessages,
              labelsCount: labels?.length || 0,
              inboxLabel: labels?.find(label => label.id === 'INBOX'),
            });
            
            // Determine which label/view is currently selected
            const selectedLabelId = currentLabel || currentView;
            
            // IMPORTANT: The pagination should show different counts based on the view
            // - For INBOX: Show threadsUnread (conversations with unread messages)
            // - For other labels: Show messagesTotal (total messages in that label)
            // - For currentLabel (user labels): Use the label's count
            
            if (selectedLabelId === 'INBOX') {
              // Get the INBOX label to access its counts
              const inboxLabel = labels.find(label => label.id === 'INBOX');
              
              // For INBOX, we want to show threadsUnread (unread conversations)
              // NOT messagesTotal (total messages)
              displayTotal = inboxLabel?.threadsUnread || totalUnreadMessages || 0;
              
              console.log('📊 [MAIL_TOOLBAR] INBOX displayTotal calculation:', {
                selectedLabelId,
                inboxLabel,
                threadsUnread: inboxLabel?.threadsUnread,
                messagesTotal: inboxLabel?.messagesTotal,
                totalUnreadMessages,
                totalMessages,
                displayTotal,
                decision: `Using threadsUnread: ${inboxLabel?.threadsUnread}`
              });
            } else if (currentLabel) {
              // For user-selected labels, show that label's total
              const selectedLabel = labels.find(label => label.id === currentLabel);
              displayTotal = selectedLabel?.messagesTotal || totalMessages;
              console.log('📊 [MAIL_TOOLBAR] User label displayTotal:', {
                currentLabel,
                selectedLabel,
                messagesTotal: selectedLabel?.messagesTotal,
                displayTotal
              });
            } else {
              // For other system views (SENT, DRAFT, etc.), use totalMessages
              displayTotal = totalMessages;
              console.log('📊 [MAIL_TOOLBAR] System view displayTotal:', {
                selectedLabelId,
                totalMessages,
                displayTotal
              });
            }
            
            // Fallback logic if displayTotal is not available
            if (!displayTotal || displayTotal <= 0) {
              displayTotal = nextPageToken ? `${end}+` : end.toString();
            }
            
            console.log('🎯 [MAIL_TOOLBAR] Final pagination display:', {
              start,
              end,
              displayTotal,
              returnValue: `${start}-${end} of ${displayTotal}`
            });
            
            return `${start}-${end} of ${displayTotal}`;
          })()}
        </Text>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePreviousPage}
          disabled={!isHydrated || messagesLoadedSoFar === 0 || isLoadingMessages}
          className="size-8 text-secondary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          title={!isHydrated ? "Loading..." : "Previous page"}
        >
          <ChevronLeft size={16} />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextPage}
          disabled={!isHydrated || !nextPageToken || isLoadingMessages}
          className="size-8 text-secondary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          title={!isHydrated ? "Loading..." : "Next page"}
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
} 
