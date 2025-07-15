/**
 * Conversation Context Menu - Phase 2 Extension
 * 
 * Right-click context menu for chat conversations with quick actions.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "../../../components/ui";
import { 
  Pin, PinOff, Edit3, Archive, Trash2, MoreHorizontal, Copy, Link,
  Settings, Download, Share, AlertTriangle 
} from 'lucide-react';
import { ChatConversation } from "../../../core/lib/chatMockData";

interface ConversationContextMenuProps {
  conversation: ChatConversation;
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onAction?: (action: string, conversationId: string) => void;
  onRename?: (conversationId: string) => void;
  onPin?: (conversationId: string) => void;
  onUnpin?: (conversationId: string) => void;
  onDelete?: (conversationId: string) => void;
  onArchive?: (conversationId: string) => void;
  onExport?: (conversationId: string) => void;
  onShare?: (conversationId: string) => void;
  onCopyLink?: (conversationId: string) => void;
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

export function ConversationContextMenu({
  conversation,
  isOpen,
  position,
  onClose,
  onAction,
  onRename,
  onPin,
  onUnpin,
  onDelete,
  onArchive,
  onExport,
  onShare,
  onCopyLink,
}: ConversationContextMenuProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Debug when confirmation dialog is shown
  useEffect(() => {
    if (showDeleteConfirm) {
      console.log('🔴 CONFIRMATION DIALOG SHOWN for conversation:', conversation.id);
    }
  }, [showDeleteConfirm, conversation.id]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDeleteConfirm) return; // keep modal open when confirming deletion
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
  }, [isOpen, onClose, showDeleteConfirm]);

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
  const handlePinToggle = useCallback(() => {
    if (conversation.isPinned) {
      onUnpin?.(conversation.id);
    } else {
      onPin?.(conversation.id);
    }
    onAction?.('pin_toggle', conversation.id);
    onClose();
  }, [conversation, onPin, onUnpin, onAction, onClose]);

  const handleRename = useCallback(() => {
    onRename?.(conversation.id);
    onAction?.('rename', conversation.id);
    onClose();
  }, [conversation.id, onRename, onAction, onClose]);

  const handleArchive = useCallback(() => {
    onArchive?.(conversation.id);
    onAction?.('archive', conversation.id);
    onClose();
  }, [conversation.id, onArchive, onAction, onClose]);

  const handleDelete = useCallback(() => {
    onDelete?.(conversation.id);
    onAction?.('delete', conversation.id);
    onClose();
  }, [conversation.id, onDelete, onAction, onClose]);

  const handleExport = useCallback(() => {
    onExport?.(conversation.id);
    onAction?.('export', conversation.id);
    onClose();
  }, [conversation.id, onExport, onAction, onClose]);

  const handleShare = useCallback(() => {
    onShare?.(conversation.id);
    onAction?.('share', conversation.id);
    onClose();
  }, [conversation.id, onShare, onAction, onClose]);

  const handleCopyLink = useCallback(() => {
    const conversationUrl = `${window.location.origin}/chat/${conversation.id}`;
    navigator.clipboard.writeText(conversationUrl).then(() => {
      console.log('Conversation link copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy link:', err);
    });
    onCopyLink?.(conversation.id);
    onAction?.('copy_link', conversation.id);
    onClose();
  }, [conversation.id, onCopyLink, onAction, onClose]);

  // Create menu items
  const menuItems: ContextMenuItem[] = [
    {
      id: 'pin_toggle',
      label: conversation.isPinned ? 'Unpin conversation' : 'Pin conversation',
      icon: conversation.isPinned ? <PinOff size={16} /> : <Pin size={16} />,
      action: handlePinToggle,
      shortcut: 'Ctrl+P'
    },
    {
      id: 'rename',
      label: 'Rename conversation',
      icon: <Edit3 size={16} />,
      action: handleRename,
      shortcut: 'F2'
    },
    {
      id: 'separator1',
      label: '',
      icon: null,
      action: () => {},
      separator: true
    },
    {
      id: 'export',
      label: 'Export conversation',
      icon: <Download size={16} />,
      action: handleExport,
      shortcut: 'Ctrl+E'
    },
    {
      id: 'share',
      label: 'Share conversation',
      icon: <Share size={16} />,
      action: handleShare,
      shortcut: 'Ctrl+Shift+S'
    },
    {
      id: 'copy_link',
      label: 'Copy conversation link',
      icon: <Copy size={16} />,
      action: handleCopyLink,
      shortcut: 'Ctrl+Shift+C'
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
      label: 'Archive conversation',
      icon: <Archive size={16} />,
      action: handleArchive,
      shortcut: 'Ctrl+A'
    },
    {
      id: 'delete',
      label: 'Delete conversation',
      icon: <Trash2 size={16} />,
      action: () => {
        console.log('🗂️ DELETE MENU ITEM CLICKED for conversation:', conversation.id);
        setShowDeleteConfirm(true);
      },
      shortcut: 'Delete',
      destructive: true
    }
  ];

  if (!isOpen) return null;

  const menuPosition = getMenuPosition();

  return (
    <>
      {/* Context Menu */}
      <div
        ref={menuRef}
        className="fixed z-50 min-w-[220px] rounded-lg border border-border-default bg-surface shadow-lg"
        style={{
          left: `${menuPosition.x}px`,
          top: `${menuPosition.y}px`,
        }}
        role="menu"
        aria-label="Conversation actions"
      >
        <div className="py-1">
          {menuItems.map((item) => {
            if (item.separator) {
              return (
                <div
                  key={item.id}
                  className="my-1 border-t border-border-default"
                  role="separator"
                />
              );
            }

            return (
              <button
                key={item.id}
                onClick={item.action}
                disabled={item.disabled}
                className={`
                  flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors
                  ${item.disabled 
                    ? 'cursor-not-allowed text-muted' 
                    : item.destructive
                      ? 'text-error hover:bg-error-ghost hover:text-error'
                      : 'text-primary hover:bg-hover hover:text-primary'
                  }
                `}
                role="menuitem"
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.shortcut && (
                  <span className="ml-2 text-xs text-muted">
                    {item.shortcut}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-overlay/50">
          <div className="w-full max-w-md rounded-lg border border-border-default bg-surface p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex size-10 items-center justify-center rounded-full bg-error-ghost">
                <AlertTriangle className="size-5 text-error" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary">Delete conversation</h3>
                <p className="text-sm text-secondary">This action cannot be undone.</p>
              </div>
            </div>
            
            <p className="mb-6 text-sm text-secondary">
              Are you sure you want to delete "{conversation.title}"? This will permanently remove the conversation and all its messages.
            </p>
            
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  console.log('❌ CANCEL BUTTON CLICKED');
                  setShowDeleteConfirm(false);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete?.(conversation.id);
                  onAction?.('delete', conversation.id);
                  setShowDeleteConfirm(false);
                  onClose();
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 