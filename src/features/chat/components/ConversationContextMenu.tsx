/**
 * Conversation Context Menu - Phase 2 Extension
 * 
 * Right-click context menu for chat conversations with quick actions.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "../../../components/ui";
import { 
  Pin, PinOff, Edit3, Archive, Trash2, Download, AlertTriangle 
} from 'lucide-react';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import type { ChatConversation } from "../stores/chatStore";

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
}

interface ContextMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action?: () => void;
  shortcut?: string;
  disabled?: boolean;
  destructive?: boolean;
  separator?: boolean;
  submenu?: ContextMenuItem[];
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
}: ConversationContextMenuProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
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

  const handleExport = useCallback(async (format: 'txt' | 'json' | 'md' | 'pdf') => {
    try {
      // TODO: Fetch messages from chatStore for this conversation
      // For now, use placeholder data
      const messages: Array<{role: string; content: string}> = [];
      const model = 'Unknown';
      
      let exportContent: string;
      let extension: string;
      
      if (format === 'txt') {
        // Plain text format
        exportContent = `Conversation: ${conversation.title}\n` +
          `Date: ${new Date(conversation.timestamp).toLocaleString()}\n` +
          `Model: ${model}\n` +
          `\n${'='.repeat(50)}\n\n` +
          messages.map(msg => 
            `${msg.role.toUpperCase()}:\n${msg.content}\n\n`
          ).join('');
        extension = 'txt';
      } else if (format === 'md') {
        // Markdown format
        exportContent = `# ${conversation.title}\n\n` +
          `**Date:** ${new Date(conversation.timestamp).toLocaleString()}\n` +
          `**Model:** ${model}\n\n` +
          `---\n\n` +
          messages.map(msg => 
            `## ${msg.role === 'user' ? '👤 User' : '🤖 Assistant'}\n\n${msg.content}\n\n`
          ).join('');
        extension = 'md';
      } else if (format === 'pdf') {
        // PDF format - create HTML first
        const htmlContent = `
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; padding: 40px; }
                h1 { color: #333; }
                .meta { color: #666; margin-bottom: 20px; }
                .message { margin-bottom: 20px; padding: 15px; border-radius: 8px; }
                .user { background-color: #f0f0f0; }
                .assistant { background-color: #e3f2fd; }
                .role { font-weight: bold; margin-bottom: 5px; }
              </style>
            </head>
            <body>
              <h1>${conversation.title}</h1>
              <div class="meta">
                <p>Date: ${new Date(conversation.timestamp).toLocaleString()}</p>
                <p>Model: ${model}</p>
              </div>
              <hr>
              ${messages.map(msg => `
                <div class="message ${msg.role}">
                  <div class="role">${msg.role === 'user' ? '👤 User' : '🤖 Assistant'}</div>
                  <div>${msg.content.replace(/\n/g, '<br>')}</div>
                </div>
              `).join('')}
            </body>
          </html>
        `;
        
        // For PDF, we'll export as HTML and let the user convert it
        // (Full PDF generation would require additional dependencies)
        exportContent = htmlContent;
        extension = 'html'; // Export as HTML for now
      } else {
        // JSON format
        exportContent = JSON.stringify({
          title: conversation.title,
          date: conversation.timestamp,
          model: model,
          messages: messages
        }, null, 2);
        extension = 'json';
      }
      
      // Suggest filename
      const suggestedFilename = `${conversation.title.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.${extension}`;
      
      // Open save dialog
      const filePath = await save({
        defaultPath: suggestedFilename,
        filters: [{ name: extension.toUpperCase(), extensions: [extension] }]
      });
      
      if (filePath) {
        await writeTextFile(filePath, exportContent);
        console.log(`Conversation exported as ${format.toUpperCase()} successfully`);
      }
    } catch (error) {
      console.error('Failed to export conversation:', error);
    }
    
    onExport?.(conversation.id);
    onAction?.('export', conversation.id);
    onClose();
  }, [conversation, onExport, onAction, onClose]);


  // Create menu items
  const menuItems: ContextMenuItem[] = [
    {
      id: 'pin_toggle',
      label: conversation.isPinned ? 'Unpin' : 'Pin',
      icon: conversation.isPinned ? <PinOff size={16} /> : <Pin size={16} />,
      action: handlePinToggle,
      shortcut: 'Ctrl+P'
    },
    {
      id: 'rename',
      label: 'Rename',
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
      label: 'Export',
      icon: <Download size={16} />,
      shortcut: 'Ctrl+E',
      submenu: [
        {
          id: 'export_txt',
          label: 'Plain Text (.txt)',
          icon: null,
          action: () => handleExport('txt')
        },
        {
          id: 'export_md',
          label: 'Markdown (.md)',
          icon: null,
          action: () => handleExport('md')
        },
        {
          id: 'export_json',
          label: 'JSON (.json)',
          icon: null,
          action: () => handleExport('json')
        },
        {
          id: 'export_pdf',
          label: 'PDF (.pdf)',
          icon: null,
          action: () => handleExport('pdf')
        }
      ]
    },
    {
      id: 'archive',
      label: 'Archive',
      icon: <Archive size={16} />,
      action: handleArchive,
      shortcut: 'Ctrl+A'
    },
    {
      id: 'separator2',
      label: '',
      icon: null,
      action: () => {},
      separator: true
    },
    {
      id: 'delete',
      label: 'Delete',
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
        className="border-border-default fixed z-50 min-w-[220px] rounded-lg border bg-white shadow-lg dark:bg-gray-900"
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
                  className="border-border-default my-1 border-t"
                  role="separator"
                />
              );
            }

            if (item.submenu) {
              return (
                <div 
                  key={item.id} 
                  className="relative"
                  onMouseLeave={() => {
                    // Add a small delay before hiding submenu to allow cursor to move to it
                    setTimeout(() => {
                      if (activeSubmenu === item.id) {
                        setActiveSubmenu(null);
                      }
                    }, 100);
                  }}
                >
                  <button
                    onMouseEnter={() => setActiveSubmenu(item.id)}
                    className={`
                      flex w-full items-center justify-between px-3 py-2 text-left text-sm text-primary
                      transition-colors hover:bg-hover hover:text-primary
                    `}
                    role="menuitem"
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
                    <div 
                      className="border-border-default absolute left-full top-0 -ml-px min-w-[180px] rounded-lg border bg-white shadow-lg dark:bg-gray-900"
                      onMouseEnter={() => setActiveSubmenu(item.id)}
                      onMouseLeave={() => setActiveSubmenu(null)}
                    >
                      <div className="py-1">
                        {item.submenu.map((subItem) => (
                          <button
                            key={subItem.id}
                            onClick={() => {
                              subItem.action?.();
                              setActiveSubmenu(null);
                            }}
                            className="flex w-full items-center px-3 py-2 text-left text-sm text-primary transition-colors hover:bg-hover hover:text-primary"
                          >
                            {subItem.label}
                          </button>
                        ))}
                      </div>
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
        <div className="bg-overlay/50 fixed inset-0 z-[60] flex items-center justify-center">
          <div className="border-border-default w-full max-w-md rounded-lg border bg-surface p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
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