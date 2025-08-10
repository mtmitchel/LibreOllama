/**
 * Message Context Menu - Updated to match Gmail
 * 
 * Right-click context menu for individual email messages with Gmail-style actions.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Reply, 
  ReplyAll, 
  Forward, 
  Archive, 
  Trash2, 
  Mail,
  Clock,
  CheckSquare,
  FolderOpen,
  Tag,
  VolumeX,
  Search,
  ExternalLink
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
  submenu?: ContextMenuItem[];
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
    currentAccountId,
    startCompose
  } = useMailStore();

  const menuRef = useRef<HTMLDivElement>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

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
  const handleReply = useCallback(() => {
    startCompose({
      to: [message.from],
      subject: message.subject.startsWith('Re: ') 
        ? message.subject 
        : `Re: ${message.subject}`,
      replyToMessageId: message.id,
    });
    onClose();
  }, [message, startCompose, onClose]);

  const handleReplyAll = useCallback(() => {
    const allRecipients = [
      message.from,
      ...message.to,
      ...(message.cc || [])
    ].filter((addr, index, self) => 
      index === self.findIndex(a => a.email === addr.email)
    );

    startCompose({
      to: allRecipients,
      subject: message.subject.startsWith('Re: ') 
        ? message.subject 
        : `Re: ${message.subject}`,
      replyToMessageId: message.id,
    });
    onClose();
  }, [message, startCompose, onClose]);

  const handleForward = useCallback(() => {
    startCompose({
      to: [],
      subject: message.subject.startsWith('Fwd: ') 
        ? message.subject 
        : `Fwd: ${message.subject}`,
      body: `\n\n---------- Forwarded message ---------\nFrom: ${message.from.name || message.from.email}\nDate: ${message.date.toLocaleString()}\nSubject: ${message.subject}\nTo: ${message.to.map(addr => addr.email).join(', ')}\n\n${message.body}`,
    });
    onClose();
  }, [message, startCompose, onClose]);

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

  const handleMarkAsRead = useCallback(async () => {
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

  // Create menu items matching Gmail
  const menuItems: ContextMenuItem[] = [
    {
      id: 'reply',
      label: 'Reply',
      icon: <Reply size={16} />,
      action: handleReply
    },
    {
      id: 'reply_all',
      label: 'Reply all',
      icon: <ReplyAll size={16} />,
      action: handleReplyAll
    },
    {
      id: 'forward',
      label: 'Forward',
      icon: <Forward size={16} />,
      action: handleForward
    },
    {
      id: 'forward_attachment',
      label: 'Forward as attachment',
      icon: <Forward size={16} />,
      action: () => {
        console.log('Forward as attachment');
        onClose();
      },
      disabled: true
    },
    {
      id: 'separator1',
      label: '',
      icon: null,
      action: () => {},
      separator: true
    },
    {
      id: 'archive',
      label: 'Archive',
      icon: <Archive size={16} />,
      action: handleArchive
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 size={16} />,
      action: handleDelete
    },
    {
      id: 'mark_as_read',
      label: message.isRead ? 'Mark as unread' : 'Mark as read',
      icon: <Mail size={16} />,
      action: handleMarkAsRead
    },
    {
      id: 'snooze',
      label: 'Snooze',
      icon: <Clock size={16} />,
      action: () => {
        console.log('Snooze');
        onClose();
      }
    },
    {
      id: 'add_to_tasks',
      label: 'Add to Tasks',
      icon: <CheckSquare size={16} />,
      action: () => {
        console.log('Add to Tasks');
        onClose();
      }
    },
    {
      id: 'separator2',
      label: '',
      icon: null,
      action: () => {},
      separator: true
    },
    {
      id: 'move_to',
      label: 'Move to',
      icon: <FolderOpen size={16} />,
      action: () => {},
      submenu: [
        { id: 'inbox', label: 'Inbox', icon: null, action: () => console.log('Move to Inbox') },
        { id: 'starred', label: 'Starred', icon: null, action: () => console.log('Move to Starred') },
        { id: 'important', label: 'Important', icon: null, action: () => console.log('Move to Important') },
      ]
    },
    {
      id: 'label_as',
      label: 'Label as',
      icon: <Tag size={16} />,
      action: () => {},
      submenu: [
        { id: 'work', label: 'Work', icon: null, action: () => console.log('Label as Work') },
        { id: 'personal', label: 'Personal', icon: null, action: () => console.log('Label as Personal') },
        { id: 'receipts', label: 'Receipts', icon: null, action: () => console.log('Label as Receipts') },
      ]
    },
    {
      id: 'mute',
      label: 'Mute',
      icon: <VolumeX size={16} />,
      action: () => {
        console.log('Mute conversation');
        onClose();
      }
    },
    {
      id: 'separator3',
      label: '',
      icon: null,
      action: () => {},
      separator: true
    },
    {
      id: 'find_emails',
      label: `Find emails from ${message.from.name || message.from.email}`,
      icon: <Search size={16} />,
      action: () => {
        console.log('Find emails from sender');
        onClose();
      }
    },
    {
      id: 'separator4',
      label: '',
      icon: null,
      action: () => {},
      separator: true
    },
    {
      id: 'open_new_window',
      label: 'Open in new window',
      icon: <ExternalLink size={16} />,
      action: () => {
        console.log('Open in new window');
        onClose();
      }
    }
  ];

  if (!isOpen) return null;

  const menuPosition = getMenuPosition();

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-64 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
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
              className="my-1 h-px bg-gray-200"
            />
          );
        }

        if (item.submenu) {
          return (
            <div
              key={item.id}
              className="relative"
              onMouseEnter={() => setActiveSubmenu(item.id)}
              onMouseLeave={() => setActiveSubmenu(null)}
            >
              <button
                className="flex w-full items-center justify-between px-4 py-2 asana-text-sm text-gray-700 hover:bg-gray-100"
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              {activeSubmenu === item.id && (
                <div className="absolute left-full top-0 ml-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  {item.submenu.map((subItem) => (
                    <button
                      key={subItem.id}
                      onClick={() => {
                        subItem.action();
                        onClose();
                      }}
                      className="flex w-full items-center px-4 py-2 asana-text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {subItem.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        }

        return (
          <button
            key={item.id}
            onClick={item.action}
            disabled={item.disabled}
            className={`flex w-full items-center gap-3 px-4 py-2 asana-text-sm ${
              item.disabled
                ? 'cursor-not-allowed text-gray-400'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default MessageContextMenu;