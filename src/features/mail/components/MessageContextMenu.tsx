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
    console.log('Reply to message:', message.id);
    onAction?.('reply', message.id);
    onClose();
  }, [message, onAction, onClose]);

  const handleReplyAll = useCallback(() => {
    // TODO: Implement reply all functionality
    console.log('Reply all to message:', message.id);
    onAction?.('reply_all', message.id);
    onClose();
  }, [message, onAction, onClose]);

  const handleForward = useCallback(() => {
    // TODO: Implement forward functionality
    console.log('Forward message:', message.id);
    onAction?.('forward', message.id);
    onClose();
  }, [message, onAction, onClose]);

  const handleCopyLink = useCallback(() => {
    // Copy Gmail URL to clipboard
    const gmailUrl = `https://mail.google.com/mail/u/0/#inbox/${message.id}`;
    navigator.clipboard.writeText(gmailUrl).then(() => {
      console.log('Gmail link copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy link:', err);
    });
    onClose();
  }, [message.id, onClose]);

  const handlePrint = useCallback(() => {
    // TODO: Implement print functionality
    console.log('Print message:', message.id);
    onAction?.('print', message.id);
    onClose();
  }, [message, onAction, onClose]);

  const handleMarkImportant = useCallback(() => {
    // TODO: Implement mark as important functionality
    console.log('Mark as important:', message.id);
    onAction?.('mark_important', message.id);
    onClose();
  }, [message, onAction, onClose]);

  const handleManageLabels = useCallback(() => {
    // TODO: Implement label management
    console.log('Manage labels for:', message.id);
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
        className="fixed bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-md shadow-lg z-50 py-1 min-w-[200px]"
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
                className="h-px bg-[var(--border-default)] my-1 mx-2"
              />
            );
          }

          return (
            <button
              key={item.id}
              onClick={item.action}
              disabled={item.disabled}
              className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left transition-colors ${
                item.disabled
                  ? 'text-[var(--text-tertiary)] cursor-not-allowed'
                  : item.destructive
                  ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
                  : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.shortcut && (
                <span className="text-xs text-[var(--text-tertiary)]">
                  {item.shortcut}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-start gap-4 mb-4">
              <AlertTriangle size={24} className="text-yellow-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                  Confirm Delete
                </h3>
                <p className="text-[var(--text-secondary)]">
                  Are you sure you want to delete this message? This action cannot be undone.
                </p>
                <div className="mt-2 p-3 bg-[var(--bg-tertiary)] rounded-md">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {message.subject}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] truncate">
                    From: {message.from.name || message.from.email}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDelete();
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
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