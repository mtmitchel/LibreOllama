/**
 * Message Context Menu - Phase 2.2
 * 
 * Right-click context menu for individual email messages with quick actions.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mail, 
  MailOpen, 
  Star, 
  StarOff, 
  Archive, 
  Trash2, 
  Reply, 
  ReplyAll, 
  Forward, 
  Tag, 
  Copy,
  ExternalLink,
  Printer,
  Flag,
  AlertTriangle
} from 'lucide-react';
import { ParsedEmail } from '../types';
import { useMailStore } from '../stores/mailStore';
import { logger } from '../../../core/lib/logger';

interface MessageContextMenuProps {
  message: ParsedEmail;
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onAction?: (action: string, messageId: string) => void;
}

interface ContextMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
  disabled?: boolean;
  destructive?: boolean;
  separator?: boolean;
}

export function MessageContextMenu({
  message,
  isOpen,
  position,
  onClose,
  onAction
}: MessageContextMenuProps) {
  const { 
    markAsRead, 
    markAsUnread, 
    starMessages, 
    unstarMessages, 
    archiveMessages, 
    deleteMessages,
    currentAccountId 
  } = useMailStore();

  const menuRef = useRef<HTMLDivElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  // Position menu to stay within viewport
  const getMenuPosition = useCallback(() => {
    if (!menuRef.current) return { x: position.x, y: position.y };

    const rect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = position.x;
    let y = position.y;

    // Adjust horizontal position if menu would overflow
    if (x + rect.width > viewportWidth) {
      x = viewportWidth - rect.width - 10;
    }

    // Adjust vertical position if menu would overflow
    if (y + rect.height > viewportHeight) {
      y = viewportHeight - rect.height - 10;
    }

    return { x: Math.max(10, x), y: Math.max(10, y) };
  }, [position]);

  // Action handlers
  const handleReadToggle = useCallback(async () => {
    if (!currentAccountId) return;
    
    try {
      if (message.isRead) {
        await markAsUnread([message.id], currentAccountId);
      } else {
        await markAsRead([message.id], currentAccountId);
      }
      onAction?.('read_toggle', message.id);
    } catch (error) {
      console.error('Failed to toggle read status:', error);
    }
    onClose();
  }, [message, markAsRead, markAsUnread, currentAccountId, onAction, onClose]);

  const handleStarToggle = useCallback(async () => {
    if (!currentAccountId) return;
    
    try {
      if (message.isStarred) {
        await unstarMessages([message.id], currentAccountId);
      } else {
        await starMessages([message.id], currentAccountId);
      }
      onAction?.('star_toggle', message.id);
    } catch (error) {
      console.error('Failed to toggle star:', error);
    }
    onClose();
  }, [message, starMessages, unstarMessages, currentAccountId, onAction, onClose]);

  const handleArchive = useCallback(async () => {
    if (!currentAccountId) return;
    
    try {
      await archiveMessages([message.id], currentAccountId);
      onAction?.('archive', message.id);
    } catch (error) {
      console.error('Failed to archive message:', error);
    }
    onClose();
  }, [message, archiveMessages, currentAccountId, onAction, onClose]);

  const handleDelete = useCallback(async () => {
    if (!currentAccountId) return;
    
    try {
      await deleteMessages([message.id], currentAccountId);
      onAction?.('delete', message.id);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
    onClose();
  }, [message, deleteMessages, currentAccountId, onAction, onClose]);

  const handleReply = useCallback(() => {
    // TODO: Implement reply functionality
          logger.log('Reply to message:', message.id);
    onAction?.('reply', message.id);
    onClose();
  }, [message, onAction, onClose]);

  const handleReplyAll = useCallback(() => {
    // TODO: Implement reply all functionality
    logger.log('Reply all to message:', message.id);
    onAction?.('reply_all', message.id);
    onClose();
  }, [message, onAction, onClose]);

  const handleForward = useCallback(() => {
    // TODO: Implement forward functionality
    logger.log('Forward message:', message.id);
    onAction?.('forward', message.id);
    onClose();
  }, [message, onAction, onClose]);

  const handleCopyLink = useCallback(() => {
    // Copy Gmail URL to clipboard
    const gmailUrl = `https://mail.google.com/mail/u/0/#inbox/${message.id}`;
    navigator.clipboard.writeText(gmailUrl).then(() => {
      logger.log('Gmail link copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy link:', err);
    });
    onClose();
  }, [message.id, onClose]);

  const handlePrint = useCallback(() => {
    // TODO: Implement print functionality
    logger.log('Print message:', message.id);
    onAction?.('print', message.id);
    onClose();
  }, [message, onAction, onClose]);

  const handleMarkImportant = useCallback(() => {
    // TODO: Implement mark as important functionality
    logger.log('Mark as important:', message.id);
    onAction?.('mark_important', message.id);
    onClose();
  }, [message, onAction, onClose]);

  const handleManageLabels = useCallback(() => {
    // TODO: Implement label management
    logger.log('Manage labels for:', message.id);
    onAction?.('manage_labels', message.id);
    onClose();
  }, [message, onAction, onClose]);

  // Create menu items
  const menuItems: ContextMenuItem[] = [
    {
      id: 'read_toggle',
      label: message.isRead ? 'Mark as unread' : 'Mark as read',
      icon: message.isRead ? <Mail size={16} /> : <MailOpen size={16} />,
      action: handleReadToggle,
      shortcut: 'U'
    },
    {
      id: 'star_toggle',
      label: message.isStarred ? 'Remove star' : 'Add star',
      icon: message.isStarred ? <StarOff size={16} /> : <Star size={16} />,
      action: handleStarToggle,
      shortcut: 'S'
    },
    {
      id: 'separator1',
      label: '',
      icon: null,
      action: () => {},
      separator: true
    },
    {
      id: 'reply',
      label: 'Reply',
      icon: <Reply size={16} />,
      action: handleReply,
      shortcut: 'R'
    },
    {
      id: 'reply_all',
      label: 'Reply all',
      icon: <ReplyAll size={16} />,
      action: handleReplyAll,
      shortcut: 'Shift+R'
    },
    {
      id: 'forward',
      label: 'Forward',
      icon: <Forward size={16} />,
      action: handleForward,
      shortcut: 'F'
    },
    {
      id: 'separator2',
      label: '',
      icon: null,
      action: () => {},
      separator: true
    },
    {
      id: 'archive',
      label: 'Archive',
      icon: <Archive size={16} />,
      action: handleArchive,
      shortcut: 'A'
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 size={16} />,
      action: () => setShowDeleteConfirm(true),
      shortcut: 'Shift+Del',
      destructive: true
    },
    {
      id: 'separator3',
      label: '',
      icon: null,
      action: () => {},
      separator: true
    },
    {
      id: 'mark_important',
      label: 'Mark as important',
      icon: <Flag size={16} />,
      action: handleMarkImportant
    },
    {
      id: 'manage_labels',
      label: 'Labels',
      icon: <Tag size={16} />,
      action: handleManageLabels,
      shortcut: 'L'
    },
    {
      id: 'separator4',
      label: '',
      icon: null,
      action: () => {},
      separator: true
    },
    {
      id: 'copy_link',
      label: 'Copy Gmail link',
      icon: <Copy size={16} />,
      action: handleCopyLink
    },
    {
      id: 'open_gmail',
      label: 'Open in Gmail',
      icon: <ExternalLink size={16} />,
      action: () => {
        const gmailUrl = `https://mail.google.com/mail/u/0/#inbox/${message.id}`;
        window.open(gmailUrl, '_blank');
        onClose();
      }
    },
    {
      id: 'print',
      label: 'Print',
      icon: <Printer size={16} />,
      action: handlePrint,
      shortcut: 'Ctrl+P'
    }
  ];

  if (!isOpen) return null;

  const menuPosition = getMenuPosition();

  return (
    <>
      <div
        ref={menuRef}
        className="border-border-default fixed z-50 min-w-[200px] rounded-md border bg-primary py-1 shadow-lg"
        style={{
          left: menuPosition.x,
          top: menuPosition.y
        }}
      >
        {menuItems.map((item) => {
          if (item.separator) {
            return (
              <div
                key={item.id}
                className="bg-border-default mx-2 my-1 h-px"
              />
            );
          }

          return (
            <button
              key={item.id}
              onClick={item.action}
              disabled={item.disabled}
              className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors ${
                item.disabled
                  ? 'cursor-not-allowed text-muted'
                  : item.destructive
                  ? 'text-error hover:bg-error-ghost hover:text-error'
                  : 'text-primary hover:bg-secondary'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.shortcut && (
                <span className="text-xs text-muted">
                  {item.shortcut}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="bg-bg-overlay z-60 fixed inset-0 flex items-center justify-center backdrop-blur-sm">
          <div className="border-border-default mx-4 w-full max-w-md rounded-lg border bg-primary p-6 shadow-xl">
            <div className="mb-4 flex items-start gap-4">
              <AlertTriangle size={24} className="mt-1 shrink-0 text-warning" />
              <div>
                <h3 className="mb-2 text-lg font-semibold text-primary">
                  Confirm Delete
                </h3>
                <p className="text-secondary">
                  Are you sure you want to delete this message? This action cannot be undone.
                </p>
                <div className="mt-2 rounded-md bg-tertiary p-3">
                  <p className="truncate text-sm font-medium text-primary">
                    {message.subject}
                  </p>
                  <p className="truncate text-xs text-secondary">
                    From: {message.from.name || message.from.email}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm text-secondary transition-colors hover:text-primary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDelete();
                  setShowDeleteConfirm(false);
                }}
                className="hover:bg-error-fg rounded-md bg-error px-4 py-2 text-sm text-white transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default MessageContextMenu; 
