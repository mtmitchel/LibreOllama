import React from 'react';
import { 
  Archive, 
  Trash2, 
  MailOpen, 
  Mail, 
  Star, 
  Clock, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  FolderPlus
} from 'lucide-react';
import { Button, Text } from '../../../components/ui';
import { Popover } from '../../../components/ui/design-system/Popover';
import { Tooltip } from '../../../components/ui/design-system';
import { Check } from 'lucide-react';
import { useMailStore } from '../stores/mailStore';
import { logger } from '../../../core/lib/logger';
import { useShallow } from 'zustand/react/shallow';

export default function MailToolbar() {
  // Use stable selectors to prevent infinite re-renders
  const selectedMessages = useMailStore(useShallow(state => state.selectedMessages));
  const { 
    selectAllMessages,
    clearSelection,
    selectMessage,
    archiveMessages,
    deleteMessages,
    markAsRead,
    markAsUnread,
    starMessages,
    addLabelsToMessages,
    fetchMessages,
    isLoadingMessages,
    resetPagination,
    getMessages, // Import getMessages selector
  } = useMailStore(useShallow(state => ({
    selectAllMessages: state.selectAllMessages,
    clearSelection: state.clearSelection,
    selectMessage: state.selectMessage,
    archiveMessages: state.archiveMessages,
    deleteMessages: state.deleteMessages,
    markAsRead: state.markAsRead,
    markAsUnread: state.markAsUnread,
    starMessages: state.starMessages,
    addLabelsToMessages: state.addLabelsToMessages,
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

  const [selectMenuOpen, setSelectMenuOpen] = React.useState(false);
  const [moveMenuOpen, setMoveMenuOpen] = React.useState(false);

  const applySelectFilter = (type: 'all' | 'none' | 'read' | 'unread' | 'starred' | 'unstarred') => {
    const msgs = getMessages();
    switch (type) {
      case 'all':
        selectAllMessages(true);
        break;
      case 'none':
        clearSelection();
        break;
      case 'read':
        setTimeout(() => {
          const ids = msgs.filter(m => m.isRead).map(m => m.id);
          clearSelection();
          ids.forEach(id => selectMessage(id, true));
        }, 0);
        break;
      case 'unread':
        setTimeout(() => {
          const ids = msgs.filter(m => !m.isRead).map(m => m.id);
          clearSelection();
          ids.forEach(id => selectMessage(id, true));
        }, 0);
        break;
      case 'starred':
        setTimeout(() => {
          const ids = msgs.filter(m => m.isStarred).map(m => m.id);
          clearSelection();
          ids.forEach(id => selectMessage(id, true));
        }, 0);
        break;
      case 'unstarred':
        setTimeout(() => {
          const ids = msgs.filter(m => !m.isStarred).map(m => m.id);
          clearSelection();
          ids.forEach(id => selectMessage(id, true));
        }, 0);
        break;
    }
    setSelectMenuOpen(false);
  };

  return (
    <div className="grid grid-cols-[40px_40px_1fr_auto] items-center gap-0 bg-primary border-b border-[var(--border-subtle)] h-12 rounded-t-md">
      {/* Checkbox Column */}
      <div className="col-start-1 flex items-center justify-center h-full">
        <input
          type="checkbox"
          checked={isAllSelected}
          ref={(input) => {
            if (input) input.indeterminate = isPartiallySelected;
          }}
          onChange={handleSelectAll}
          className="size-4 cursor-pointer rounded border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] focus:ring-1 focus:ring-offset-0"
          title={isAllSelected ? 'Deselect all' : 'Select all'}
        />
      </div>

      {/* Dropdown Column */}
      <div className="col-start-2 flex items-center justify-center h-full">
        <Popover
          open={selectMenuOpen}
          onOpenChange={setSelectMenuOpen}
          placement="bottom-start"
          contentClassName="rounded-[12px]"
          offset={6}
          showArrow={false}
          content={(
            <div role="menu" className="min-w-[180px] w-auto py-1 px-1 z-[10000]">
              {['All','None','Read','Unread','Starred','Unstarred'].map((label) => (
                <button
                  key={label}
                  role="menuitem"
                  className="block w-full rounded-[8px] px-3 py-1.5 text-left asana-text-base leading-snug hover:bg-[var(--bg-secondary)] focus:bg-[var(--bg-secondary)]"
                  onClick={() => applySelectFilter(label.toLowerCase() as any)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        >
          <Button variant="ghost" size="icon" className="p-0 text-secondary" onClick={() => setSelectMenuOpen(!selectMenuOpen)} title="Selection options" aria-haspopup="menu" aria-expanded={selectMenuOpen} style={{ width: 16, height: 16, borderRadius: 4 }}>
            <ChevronDown size={12} />
          </Button>
        </Popover>
      </div>

      {/* Actions Column */}
      <div className="col-start-3 flex items-center gap-2 px-2">

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
        <Tooltip content={`Last sync: ${formatLastSync(lastSyncTime)}`} placement="bottom" delay={100}>
          <div className="flex items-center text-success">
            <Check size={16} />
          </div>
        </Tooltip>

        {/* Action Buttons - Only show when messages are selected */}
        {selectedCount > 0 && (
          <>
            <div className="bg-border-default mx-1 h-6 w-px" />
            
            <Tooltip content="Archive" placement="bottom" delay={100}>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleArchive}
                className="size-8 text-secondary hover:text-primary"
                aria-label="Archive"
                title="Archive"
              >
                <Archive size={16} />
              </Button>
            </Tooltip>

            <Tooltip content="Delete" placement="bottom" delay={100}>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="size-8 text-secondary hover:text-primary"
                aria-label="Delete"
                title="Delete"
              >
                <Trash2 size={16} />
              </Button>
            </Tooltip>

            <Tooltip content="Mark as read" placement="bottom" delay={100}>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleMarkAsRead}
                className="size-8 text-secondary hover:text-primary"
                aria-label="Mark as read"
                title="Mark as read"
              >
                <MailOpen size={16} />
              </Button>
            </Tooltip>

            <Tooltip content="Mark as unread" placement="bottom" delay={100}>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleMarkAsUnread}
                className="size-8 text-secondary hover:text-primary"
                aria-label="Mark as unread"
                title="Mark as unread"
              >
                <Mail size={16} />
              </Button>
            </Tooltip>

            <Tooltip content="Star" placement="bottom" delay={100}>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleStar}
                className="size-8 text-secondary hover:text-primary"
                aria-label="Star"
                title="Star"
              >
                <Star size={16} />
              </Button>
            </Tooltip>

            {/* Move To */}
            <Popover
              open={moveMenuOpen}
              onOpenChange={setMoveMenuOpen}
              placement="bottom-start"
              contentClassName="rounded-[12px]"
              offset={6}
              showArrow={false}
              content={(
                <div role="menu" className="min-w-[220px] w-auto py-1 px-1 z-[10000]">
                  {labels
                    .filter(l => l.type === 'user')
                    .map(label => (
                      <button
                        key={label.id}
                        role="menuitem"
                        className="block w-full rounded-[8px] px-3 py-1.5 text-left asana-text-base leading-snug hover:bg-[var(--bg-secondary)] focus:bg-[var(--bg-secondary)]"
                        onClick={async () => {
                          await addLabelsToMessages(selectedMessages, [label.id]);
                          // If currently viewing INBOX, remove INBOX by archiving
                          if (currentLabel === 'INBOX' || currentView === 'INBOX') {
                            await archiveMessages(selectedMessages);
                          }
                          setMoveMenuOpen(false);
                        }}
                      >
                        {label.name}
                      </button>
                    ))}
                </div>
              )}
            >
              <Tooltip content="Move to" placement="bottom" delay={100}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-secondary hover:text-primary"
                  aria-label="Move to"
                  title="Move to"
                >
                  <FolderPlus size={16} />
                </Button>
              </Tooltip>
            </Popover>

            <Tooltip content="Snooze" placement="bottom" delay={100}>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-secondary hover:text-primary"
                aria-label="Snooze"
                title="Snooze"
              >
                <Clock size={16} />
              </Button>
            </Tooltip>

            {/* Removed overflow menu as all required actions are present */}

            <div className="bg-border-default mx-1 h-6 w-px" />
            
            <Text size="sm" variant="secondary">
              {selectedCount} selected
            </Text>
          </>
        )}
      </div>

      {/* Right Side - Pagination */}
      <div className="col-start-4 flex items-center gap-2 px-3">
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
