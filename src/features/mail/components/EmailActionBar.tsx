/**
 * Email Action Bar - Phase 2.2
 * 
 * Comprehensive email action interface with support for single and bulk operations,
 * keyboard shortcuts, and confirmation dialogs for destructive actions.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { 
  Archive, 
  Trash2, 
  Mail, 
  MailOpen, 
  Star, 
  StarOff, 
  Tag, 
  Forward, 
  Reply, 
  ReplyAll,
  MoreHorizontal,
  Check,
  Square,
  MinusSquare,
  AlertTriangle
} from 'lucide-react';
import { Button, Text } from '../../../components/ui';
import { useMailStore } from '../stores/mailStore';
import { ParsedEmail } from '../types';

interface EmailActionBarProps {
  selectedMessages: string[];
  onClearSelection: () => void;
  className?: string;
  showBulkActions?: boolean;
  compactMode?: boolean;
}

interface ActionConfirmation {
  isOpen: boolean;
  type: 'delete' | 'archive' | 'bulk_delete' | null;
  messageCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function EmailActionBar({ 
  selectedMessages, 
  onClearSelection,
  className = '',
  showBulkActions = true,
  compactMode = false
}: EmailActionBarProps) {
  const { 
    markAsRead, 
    markAsUnread, 
    deleteMessages, 
    archiveMessages, 
    starMessages, 
    unstarMessages,
    getMessages,
    currentAccountId,
    isLoadingMessages 
  } = useMailStore();

  const [confirmation, setConfirmation] = useState<ActionConfirmation>({
    isOpen: false,
    type: null,
    messageCount: 0,
    onConfirm: () => {},
    onCancel: () => {}
  });
  
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const messages = getMessages();
  const selectedCount = selectedMessages.length;
  const allMessages = messages;
  const allSelected = selectedCount > 0 && selectedCount === allMessages.length;
  const someSelected = selectedCount > 0 && selectedCount < allMessages.length;

  // Get selected message objects
  const selectedMessageObjects = messages.filter(msg => selectedMessages.includes(msg.id));
  
  // Calculate action availability
  const hasUnreadSelected = selectedMessageObjects.some(msg => !msg.isRead);
  const hasReadSelected = selectedMessageObjects.some(msg => msg.isRead);
  const hasStarredSelected = selectedMessageObjects.some(msg => msg.isStarred);
  const hasUnstarredSelected = selectedMessageObjects.some(msg => !msg.isStarred);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when messages are selected and not in input fields
      if (selectedCount === 0 || (event.target as HTMLElement)?.tagName === 'INPUT') return;

      switch (event.key.toLowerCase()) {
        case 'a':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            handleSelectAll();
          } else {
            event.preventDefault();
            handleArchive();
          }
          break;
        case 'delete':
        case 'backspace':
          if (event.shiftKey) {
            event.preventDefault();
            handleDelete();
          }
          break;
        case 'u':
          event.preventDefault();
          handleMarkAsUnread();
          break;
        case 'r':
          event.preventDefault();
          handleMarkAsRead();
          break;
        case 's':
          event.preventDefault();
          handleToggleStar();
          break;
        case 'escape':
          event.preventDefault();
          onClearSelection();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCount, selectedMessageObjects]);

  // Action handlers
  const executeAction = useCallback(async (actionType: string, actionFn: () => Promise<void>) => {
    if (!currentAccountId || actionInProgress) return;
    
    setActionInProgress(actionType);
    try {
      await actionFn();
      if (actionType === 'delete' || actionType === 'archive') {
        onClearSelection();
      }
    } catch (error) {
      console.error(`Failed to ${actionType}:`, error);
    } finally {
      setActionInProgress(null);
    }
  }, [currentAccountId, actionInProgress, onClearSelection]);

  const handleMarkAsRead = useCallback(() => {
    if (hasUnreadSelected) {
      const unreadMessages = selectedMessageObjects.filter(msg => !msg.isRead).map(msg => msg.id);
      executeAction('mark_read', () => markAsRead(unreadMessages, currentAccountId || undefined));
    }
  }, [hasUnreadSelected, selectedMessageObjects, executeAction, markAsRead, currentAccountId]);

  const handleMarkAsUnread = useCallback(() => {
    if (hasReadSelected) {
      const readMessages = selectedMessageObjects.filter(msg => msg.isRead).map(msg => msg.id);
      executeAction('mark_unread', () => markAsUnread(readMessages, currentAccountId || undefined));
    }
  }, [hasReadSelected, selectedMessageObjects, executeAction, markAsUnread, currentAccountId]);

  const handleToggleStar = useCallback(() => {
    if (hasUnstarredSelected) {
      const unstarredMessages = selectedMessageObjects.filter(msg => !msg.isStarred).map(msg => msg.id);
      executeAction('star', () => starMessages(unstarredMessages, currentAccountId || undefined));
    } else if (hasStarredSelected) {
      const starredMessages = selectedMessageObjects.filter(msg => msg.isStarred).map(msg => msg.id);
      executeAction('unstar', () => unstarMessages(starredMessages, currentAccountId || undefined));
    }
  }, [hasUnstarredSelected, hasStarredSelected, selectedMessageObjects, executeAction, starMessages, unstarMessages, currentAccountId]);

  const handleArchive = useCallback(() => {
    if (selectedCount > 5) {
      // Show confirmation for bulk archive
      setConfirmation({
        isOpen: true,
        type: 'archive',
        messageCount: selectedCount,
        onConfirm: () => {
          executeAction('archive', () => archiveMessages(selectedMessages, currentAccountId || undefined));
          setConfirmation(prev => ({ ...prev, isOpen: false }));
        },
        onCancel: () => setConfirmation(prev => ({ ...prev, isOpen: false }))
      });
    } else {
      executeAction('archive', () => archiveMessages(selectedMessages, currentAccountId || undefined));
    }
  }, [selectedCount, selectedMessages, executeAction, archiveMessages, currentAccountId]);

  const handleDelete = useCallback(() => {
    // Always show confirmation for delete
    setConfirmation({
      isOpen: true,
      type: selectedCount > 1 ? 'bulk_delete' : 'delete',
      messageCount: selectedCount,
      onConfirm: () => {
        executeAction('delete', () => deleteMessages(selectedMessages, currentAccountId || undefined));
        setConfirmation(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => setConfirmation(prev => ({ ...prev, isOpen: false }))
    });
  }, [selectedCount, selectedMessages, executeAction, deleteMessages, currentAccountId]);

  const handleSelectAll = useCallback(() => {
    const selectAllAction = useMailStore.getState().selectAllMessages;
    selectAllAction(!allSelected);
  }, [allSelected]);

  // Single message actions (for context menu or when one message is selected)
  const canReply = selectedCount === 1;
  const canForward = selectedCount >= 1;

  if (selectedCount === 0 && !showBulkActions) {
    return null;
  }

  return (
    <>
      <div className={`border-border-default border-b bg-secondary ${className}`}>
        <div className={`flex items-center justify-between px-4 ${compactMode ? 'py-2' : 'py-3'}`}>
          {/* Selection Info */}
          <div className="flex items-center gap-4">
            {/* Select All Checkbox */}
            <button
              onClick={handleSelectAll}
              className="border-border-default flex size-6 items-center justify-center rounded border transition-colors hover:bg-tertiary"
              title={allSelected ? 'Deselect all' : 'Select all'}
            >
              {allSelected ? (
                <Check size={14} className="text-accent-primary" />
              ) : someSelected ? (
                <MinusSquare size={14} className="text-accent-primary" />
              ) : (
                <Square size={14} className="text-secondary" />
              )}
            </button>
            
            {/* Selection Count */}
            <Text size="sm" variant="secondary">
              {selectedCount === 0 
                ? `${allMessages.length} messages` 
                : `${selectedCount} selected`
              }
            </Text>

            {/* Clear Selection */}
            {selectedCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                className="text-secondary hover:text-primary"
              >
                Clear selection
              </Button>
            )}
          </div>

          {/* Action Buttons */}
          {selectedCount > 0 && (
            <div className="flex items-center gap-2">
              {/* Read/Unread Actions */}
              {hasUnreadSelected && (
                <Button
                  variant="ghost"
                  size={compactMode ? "sm" : "default"}
                  onClick={handleMarkAsRead}
                  disabled={actionInProgress === 'mark_read' || isLoadingMessages}
                  title="Mark as read (R)"
                  className="text-secondary hover:text-primary"
                >
                  <MailOpen size={compactMode ? 16 : 18} />
                  {!compactMode && <span className="ml-2">Mark read</span>}
                </Button>
              )}

              {hasReadSelected && (
                <Button
                  variant="ghost"
                  size={compactMode ? "sm" : "default"}
                  onClick={handleMarkAsUnread}
                  disabled={actionInProgress === 'mark_unread' || isLoadingMessages}
                  title="Mark as unread (U)"
                  className="text-secondary hover:text-primary"
                >
                  <Mail size={compactMode ? 16 : 18} />
                  {!compactMode && <span className="ml-2">Mark unread</span>}
                </Button>
              )}

              {/* Star/Unstar Action */}
              <Button
                variant="ghost"
                size={compactMode ? "sm" : "default"}
                onClick={handleToggleStar}
                disabled={actionInProgress === 'star' || actionInProgress === 'unstar' || isLoadingMessages}
                title={hasUnstarredSelected ? "Add star (S)" : "Remove star (S)"}
                className="text-secondary hover:text-primary"
              >
                {hasUnstarredSelected ? (
                  <Star size={compactMode ? 16 : 18} />
                ) : (
                  <StarOff size={compactMode ? 16 : 18} />
                )}
                {!compactMode && (
                  <span className="ml-2">
                    {hasUnstarredSelected ? 'Star' : 'Unstar'}
                  </span>
                )}
              </Button>

              {/* Archive Action */}
              <Button
                variant="ghost"
                size={compactMode ? "sm" : "default"}
                onClick={handleArchive}
                disabled={actionInProgress === 'archive' || isLoadingMessages}
                title="Archive (A)"
                className="text-secondary hover:text-primary"
              >
                <Archive size={compactMode ? 16 : 18} />
                {!compactMode && <span className="ml-2">Archive</span>}
              </Button>

              {/* Delete Action */}
              <Button
                variant="ghost"
                size={compactMode ? "sm" : "default"}
                onClick={handleDelete}
                disabled={actionInProgress === 'delete' || isLoadingMessages}
                title="Delete (Shift+Delete)"
                className="text-secondary hover:text-error"
              >
                <Trash2 size={compactMode ? 16 : 18} />
                {!compactMode && <span className="ml-2">Delete</span>}
              </Button>

              {/* More Actions Menu */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size={compactMode ? "sm" : "default"}
                  onClick={() => setIsActionsMenuOpen(!isActionsMenuOpen)}
                  title="More actions"
                  className="text-secondary hover:text-primary"
                >
                  <MoreHorizontal size={compactMode ? 16 : 18} />
                </Button>

                {/* Actions Dropdown */}
                {isActionsMenuOpen && (
                  <div className="border-border-default absolute right-0 top-full z-50 mt-1 w-48 rounded-md border bg-primary shadow-lg">
                    <div className="py-1">
                      {canReply && (
                        <>
                          <button
                            className="flex w-full items-center gap-3 px-4 py-2 text-sm text-primary transition-colors hover:bg-secondary"
                            onClick={() => {
                              // Future Enhancement: Implement reply functionality (Phase 3.x)
                              setIsActionsMenuOpen(false);
                            }}
                          >
                            <Reply size={16} />
                            Reply
                          </button>
                          <button
                            className="flex w-full items-center gap-3 px-4 py-2 text-sm text-primary transition-colors hover:bg-secondary"
                            onClick={() => {
                              // Future Enhancement: Implement reply all functionality (Phase 3.x)
                              setIsActionsMenuOpen(false);
                            }}
                          >
                            <ReplyAll size={16} />
                            Reply all
                          </button>
                        </>
                      )}
                      
                      {canForward && (
                        <button
                          className="flex w-full items-center gap-3 px-4 py-2 text-sm text-primary transition-colors hover:bg-secondary"
                          onClick={() => {
                            // Future Enhancement: Implement forward functionality (Phase 3.x)
                            setIsActionsMenuOpen(false);
                          }}
                        >
                          <Forward size={16} />
                          Forward
                        </button>
                      )}
                      
                      <button
                        className="flex w-full items-center gap-3 px-4 py-2 text-sm text-primary transition-colors hover:bg-secondary"
                        onClick={() => {
                          // Future Enhancement: Implement label management functionality (Phase 3.x)
                          setIsActionsMenuOpen(false);
                        }}
                      >
                        <Tag size={16} />
                        Labels
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Keyboard Shortcuts Help */}
        {selectedCount > 0 && !compactMode && (
          <div className="px-4 pb-2 text-xs text-muted">
            Shortcuts: R (read), U (unread), S (star), A (archive), Shift+Del (delete), Esc (clear)
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {confirmation.isOpen && (
        <div className="bg-bg-overlay fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="border-border-default mx-4 w-full max-w-md rounded-lg border bg-primary p-6 shadow-xl">
            <div className="mb-4 flex items-start gap-4">
              <AlertTriangle size={24} className="mt-1 shrink-0 text-warning" />
              <div>
                <h3 className="mb-2 text-lg font-semibold text-primary">
                  {confirmation.type === 'delete' || confirmation.type === 'bulk_delete' 
                    ? 'Confirm Delete' 
                    : 'Confirm Archive'
                  }
                </h3>
                <p className="text-secondary">
                  {confirmation.type === 'delete' 
                    ? 'Are you sure you want to delete this message? This action cannot be undone.'
                    : confirmation.type === 'bulk_delete'
                    ? `Are you sure you want to delete ${confirmation.messageCount} messages? This action cannot be undone.`
                    : `Are you sure you want to archive ${confirmation.messageCount} messages?`
                  }
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={confirmation.onCancel}
              >
                Cancel
              </Button>
              <Button
                variant={confirmation.type?.includes('delete') ? 'destructive' : 'default'}
                onClick={confirmation.onConfirm}
              >
                {confirmation.type?.includes('delete') ? 'Delete' : 'Archive'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close actions menu */}
      {isActionsMenuOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsActionsMenuOpen(false)}
        />
      )}
    </>
  );
}

export default EmailActionBar;
