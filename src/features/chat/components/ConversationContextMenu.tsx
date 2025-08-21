/**
 * Conversation Context Menu - Phase 2 Extension
 * 
 * Right-click context menu for chat conversations with quick actions.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useChatStore } from '../stores/chatStore';
import { 
  Pin, PinOff, Edit, Trash2, FileDown 
} from 'lucide-react';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import type { ChatConversation } from "../stores/chatStore";
import { useToast, toast } from '../../../components/ui/design-system';

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
  onExport,
}: ConversationContextMenuProps) {
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  // Close menu when clicking outside (use 'click' to avoid racing item onClick)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        // Defer close to allow any pending item handlers in the same tick to run
        setTimeout(() => onClose(), 0);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        document.removeEventListener('click', handleClickOutside);
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

  const handleDelete = useCallback(() => {
    onDelete?.(conversation.id);
    onAction?.('delete', conversation.id);
    onClose();
  }, [conversation.id, onDelete, onAction, onClose]);

  // Map export format to friendly label
  const getFormatLabel = (format: 'txt' | 'json' | 'md' | 'pdf') =>
    format === 'txt' ? 'Text' : format === 'md' ? 'Markdown' : format === 'json' ? 'JSON' : 'PDF';

  const handleExport = useCallback(async (format: 'txt' | 'json' | 'md' | 'pdf') => {
    try {
      const formatLabel = getFormatLabel(format);
      // Prefer backend export; fall back to client store when unavailable
      let exportContent = '' as string;
      let extension = '' as string;
      let model = 'Unknown';
      let messages: Array<{ role: string; content: string }> = [];
      let sessionTitle = conversation.title;
      let sessionDate = conversation.timestamp;

      let backendOk = false;
      try {
        if (format === 'md') {
          const md = await invoke<string>('export_chat_session_markdown', { sessionId: conversation.id });
          exportContent = md;
          extension = 'md';
          backendOk = true;
        } else {
          const data: any = await invoke('export_chat_session', { sessionId: conversation.id });
          // data.session has session_name, created_at, updated_at
          sessionTitle = data?.session?.session_name || sessionTitle;
          sessionDate = data?.session?.updated_at || sessionDate;
          messages = (data?.messages || []).map((m: any) => ({ role: m.role, content: m.content }));
          backendOk = true;
        }
      } catch (_) {
        backendOk = false;
      }

      if (!backendOk) {
        const store = useChatStore.getState();
        const messagesForConv = store.messages[conversation.id] || [];
        model = store.availableModels.find(m => m.id === store.selectedModel)?.name || store.selectedModel || 'Unknown';
        messages = messagesForConv.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.content }));
      }
      
      if (format === 'txt') {
        // Plain text format
        exportContent = `Conversation: ${sessionTitle}\n` +
          `Date: ${new Date(sessionDate).toLocaleString()}\n` +
          `Model: ${model}\n` +
          `\n${'='.repeat(50)}\n\n` +
          messages.map(msg => 
            `${msg.role.toUpperCase()}:\n${msg.content}\n\n`
          ).join('');
        extension = 'txt';
      } else if (format === 'md') {
        // Markdown format
        if (!exportContent) {
          exportContent = `# ${sessionTitle}\n\n` +
          `**Date:** ${new Date(sessionDate).toLocaleString()}\n` +
          `**Model:** ${model}\n\n` +
          `---\n\n` +
          messages.map(msg => 
            `## ${msg.role === 'user' ? '👤 User' : '🤖 Assistant'}\n\n${msg.content}\n\n`
          ).join('');
        }
        extension = 'md';
      } else if (format === 'pdf') {
        // Use backend to generate real PDF
        const suggestedFilenameNoExt = `${conversation.title.replace(/[^a-z0-9-_]/gi, '_')}_${new Date().toISOString().split('T')[0]}`;
        let filePath = '';
        try {
          const dialogMod = await import('@tauri-apps/plugin-dialog').catch(() => null as any);
          const tauriSave = dialogMod?.save || save;
          if (tauriSave) {
            filePath = await tauriSave({ 
              defaultPath: `${suggestedFilenameNoExt}.pdf`, 
              filters: [{ name: 'PDF', extensions: ['pdf'] }] 
            });
            console.log('PDF Export: Save dialog returned path:', filePath);
          }
        } catch (err) {
          console.error('PDF Export: Failed to open save dialog:', err);
        }
        
        if (filePath) {
          try {
            console.log('PDF Export: Calling backend with path:', filePath);
            console.log('PDF Export: Conversation ID:', conversation.id);
            await invoke('export_chat_session_pdf', { 
              sessionId: conversation.id, 
              outputPath: filePath 
            });
            console.log('PDF Export: Backend call successful');
            
            // DLS toast
            addToast(toast.success(`${formatLabel} export saved`));
            
            onClose();
            return;
          } catch (err) {
            console.error('PDF Export: Backend error:', err);
            addToast(toast.error(`Failed to export ${formatLabel}: ${String(err)}`));
            onClose();
            return;
          }
        } else {
          addToast(toast.info('PDF export requires the desktop app. Use Markdown/Text/JSON in browser.'));
          onClose();
          return;
        }
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
      const suggestedFilename = `${conversation.title.replace(/[^a-z0-9-_]/gi, '_')}_${new Date().toISOString().split('T')[0]}.${extension}`;

      const downloadFallback = (content: string, filename: string, mime: string) => {
        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      };

      let saved = false;
      try {
        // Prefer dynamic import to avoid runtime issues when plugins are unavailable
        const dialogMod = await import('@tauri-apps/plugin-dialog').catch(() => null as any);
        const fsMod = await import('@tauri-apps/plugin-fs').catch(() => null as any);
        const tauriSave = dialogMod?.save || save;
        const tauriWrite = fsMod?.writeTextFile || writeTextFile;
        if (tauriSave && tauriWrite) {
          const filePath = await tauriSave({
        defaultPath: suggestedFilename,
        filters: [{ name: extension.toUpperCase(), extensions: [extension] }]
      });
          if (filePath) {
            await tauriWrite(filePath, exportContent);
            saved = true;
            // DLS toast
            addToast(toast.success(`${formatLabel} export saved`));
          }
        }
      } catch (e) {
        // fall back to browser download
        console.warn('Save dialog failed, using browser download fallback:', e);
      }

      if (!saved) {
        const mime = extension === 'json' ? 'application/json'
          : extension === 'md' ? 'text/markdown'
          : extension === 'html' ? 'text/html'
          : 'text/plain';
        // Mark anchor so LinkPreviewProvider ignores it
        const blob = new Blob([exportContent], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = suggestedFilename;
        a.setAttribute('data-no-preview', 'true');
        a.rel = 'noopener';
        a.style.display = 'none';
        a.addEventListener('click', (e) => e.stopPropagation(), true);
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          a.remove();
          URL.revokeObjectURL(url);
        }, 50);
      }
    } catch (error) {
      console.error('Failed to export conversation:', error);
      const formatLabel = getFormatLabel(format);
      addToast(toast.error(`Failed to export ${formatLabel}`));
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
      action: handlePinToggle
    },
    {
      id: 'rename',
      label: 'Rename',
      icon: <Edit size={16} />,
      action: handleRename
    },
    {
      id: 'separator1',
      label: '',
      icon: null,
      action: () => {},
      separator: true
    },
    {
      id: 'export_txt',
      label: 'Export as Text',
      icon: <FileDown size={16} />,
          action: () => handleExport('txt')
        },
        {
          id: 'export_md',
      label: 'Export as Markdown',
      icon: <FileDown size={16} />,
          action: () => handleExport('md')
        },
        {
          id: 'export_json',
      label: 'Export as JSON',
      icon: <FileDown size={16} />,
          action: () => handleExport('json')
        },
        {
          id: 'export_pdf',
      label: 'Export as PDF',
      icon: <FileDown size={16} />,
          action: () => handleExport('pdf')
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
      action: handleDelete,
      destructive: true
    }
  ];

  if (!isOpen) return null;

  const menuPosition = getMenuPosition();

  return (
    <>
      {/* Context Menu (DS-styled) */}
      {isOpen && (
      <div
        ref={menuRef}
          className="fixed z-[10000] min-w-[220px] rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-primary)] py-[var(--space-0-5)] px-[var(--space-1)] shadow-[var(--shadow-popover)] animate-in fade-in-0 zoom-in-95"
          style={{ left: `${menuPosition.x}px`, top: `${menuPosition.y}px` }}
        role="menu"
        aria-label="Conversation actions"
      >
          {menuItems.map((item) => {
            if (item.separator) {
              return (
                <div key={item.id} className="my-[var(--space-0-5)] h-px bg-[var(--border-default)]" role="separator" />
              );
            }

            if (item.submenu) {
              return (
                <div 
                  key={item.id} 
                  className="relative"
                  onMouseLeave={() => {
                    setTimeout(() => {
                      if (activeSubmenu === item.id) setActiveSubmenu(null);
                    }, 100);
                  }}
                >
                  <button
                    onMouseEnter={() => setActiveSubmenu(item.id)}
                    className="flex h-8 w-full items-center justify-between rounded-[var(--radius-md)] px-[var(--space-2)] text-left asana-text-base text-[color:var(--text-primary)] transition-colors hover:bg-[var(--bg-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--border-focus)]"
                    role="menuitem"
                  >
                    <div className="flex items-center gap-[var(--space-2)]">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  {activeSubmenu === item.id && (
                    <div className="absolute left-full top-0 -ml-px min-w-[180px] rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-primary)] shadow-[var(--shadow-popover)]"
                      onMouseEnter={() => setActiveSubmenu(item.id)}
                      onMouseLeave={() => setActiveSubmenu(null)}
                    >
                      <div className="py-[var(--space-0-5)] px-[var(--space-1)]">
                        {item.submenu.map((subItem) => (
                          <button
                            key={subItem.id}
                            onClick={() => {
                              subItem.action?.();
                              setActiveSubmenu(null);
                            }}
                            className="flex w-full items-center rounded-[var(--radius-md)] px-[var(--space-1-5)] py-[var(--space-1)] text-left asana-text-base text-[color:var(--text-primary)] transition-colors hover:bg-[var(--bg-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--border-focus)]"
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
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  item.action?.();
                  // Close menu for actions that don't handle it themselves
                  const specialActions = ['delete', 'rename'];
                  if (!specialActions.includes(item.id)) {
                    setTimeout(() => onClose(), 0);
                  }
                }}
                disabled={item.disabled}
                className={`flex w-full items-center justify-between rounded-[var(--radius-md)] px-[var(--space-1-5)] py-[var(--space-1)] text-left asana-text-base transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--border-focus)] ${
                  item.disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : item.destructive
                      ? 'text-[var(--semantic-error)] hover:bg-red-50 hover:text-[var(--semantic-error)]'
                      : 'text-[color:var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                }`}
                role="menuitem"
              >
                <div className="flex items-center gap-[var(--space-2)]">
                  <span className="text-current">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.shortcut && (
                  <span className="ml-2 font-mono asana-text-sm text-[color:var(--text-muted)]">{item.shortcut}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
} 