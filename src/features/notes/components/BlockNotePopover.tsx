import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { BlockNoteEditor } from '@blocknote/core';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Quote,
  Highlighter,
  Link,
  IndentIncrease,
  IndentDecrease,
  RefreshCw,
  FileText,
  Languages,
  CheckCircle,
  Lightbulb,
  ListTodo,
  Key,
  Image,
  Table,
  Sparkles,
  Send,
  CodeSquare,
  Minus,
  Smile
} from 'lucide-react';
import { cn } from '../../../core/lib/utils';

interface BlockNotePopoverProps {
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; left: number };
  editor: BlockNoteEditor;
}

type TabType = 'format' | 'ai' | 'insert';

export function BlockNotePopover({ isOpen, onClose, position, editor }: BlockNotePopoverProps) {
  const [activeTab, setActiveTab] = useState<TabType>('format');
  const [aiQuestion, setAiQuestion] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);
  
  // Check if we have text selected vs block selected
  const selectedText = editor.getSelectedText();
  const currentBlock = editor.getTextCursorPosition().block;
  const isImageBlock = currentBlock?.type === 'image';
  const hasTextSelection = selectedText && selectedText.trim().length > 0;

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFormatting = (format: string) => {
    // Don't close the popover - just apply formatting
    switch (format) {
      case 'bold':
        editor.toggleStyles({ bold: true });
        break;
      case 'italic':
        editor.toggleStyles({ italic: true });
        break;
      case 'underline':
        editor.toggleStyles({ underline: true });
        break;
      case 'strikethrough':
        editor.toggleStyles({ strike: true });
        break;
      case 'code':
        editor.toggleStyles({ code: true });
        break;
      case 'highlight':
        editor.toggleStyles({ backgroundColor: 'yellow' });
        break;
      case 'align-left':
        editor.updateBlock(editor.getTextCursorPosition().block, { 
          props: { textAlignment: 'left' } 
        });
        break;
      case 'align-center':
        editor.updateBlock(editor.getTextCursorPosition().block, { 
          props: { textAlignment: 'center' } 
        });
        break;
      case 'align-right':
        editor.updateBlock(editor.getTextCursorPosition().block, { 
          props: { textAlignment: 'right' } 
        });
        break;
      case 'indent':
        editor.nestBlock();
        break;
      case 'outdent':
        editor.unnestBlock();
        break;
    }
    // Keep focus on editor to maintain selection
    editor.focus();
  };

  const handleBlockType = (blockType: string) => {
    editor.updateBlock(editor.getTextCursorPosition().block, {
      type: blockType as any
    });
    // Keep focus on editor
    editor.focus();
  };

  const handleAIAction = (action: string, customQuestion?: string) => {
    const selectedText = editor.getSelectedText();
    const currentBlock = editor.getTextCursorPosition().block;
    
    // For image blocks, handle differently
    if (currentBlock?.type === 'image' && !selectedText) {
      // For now, we'll skip AI actions on images
      // In the future, could add image-specific AI features
      return;
    }
    
    if (!selectedText && action !== 'ask-custom') return;
    
    // Mock AI responses for demonstration
    const mockResponses: Record<string, string> = {
      'rewrite-professional': `I trust this message finds you well. ${selectedText}`,
      'rewrite-friendly': `Hey there! ${selectedText} 😊`,
      'rewrite-concise': selectedText.split(' ').slice(0, Math.ceil(selectedText.split(' ').length / 2)).join(' '),
      'rewrite-expanded': `${selectedText} Furthermore, this point warrants additional consideration and analysis.`,
      'proofread': selectedText.charAt(0).toUpperCase() + selectedText.slice(1),
      'summarize': `Summary: ${selectedText.substring(0, 50)}...`,
      'translate': `[Translated] ${selectedText}`,
      'explain': `This means: ${selectedText}`,
      'create-list': `• ${selectedText.split('.').filter(s => s.trim()).join('\n• ')}`,
      'key-points': `Key points:\n• ${selectedText.split('.').filter(s => s.trim()).slice(0, 3).join('\n• ')}`,
      'ask-custom': `Response to "${customQuestion}" about: ${selectedText}`
    };
    
    const newText = mockResponses[action] || selectedText;
    
    // Use document.execCommand for BlockNote compatibility
    setTimeout(() => {
      document.execCommand('insertText', false, newText);
      onClose();
    }, 100);
  };

  const handleInsert = (type: string) => {
    switch (type) {
      case 'link':
        // Create a custom modal instead of using prompt
        const linkModal = document.createElement('div');
        linkModal.className = 'fixed inset-0 z-[200] flex items-center justify-center';
        linkModal.innerHTML = `
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick="this.parentElement.remove()"></div>
          <div class="relative bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-96 animate-in fade-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-800">
            <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Insert Link</h3>
            <input 
              type="url" 
              placeholder="https://example.com" 
              class="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              id="link-url-input"
              autofocus
            />
            <div class="flex justify-end gap-2 mt-4">
              <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">Cancel</button>
              <button onclick="window.handleLinkInsert()" class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">Insert</button>
            </div>
          </div>
        `;
        document.body.appendChild(linkModal);
        
        // Focus the input
        setTimeout(() => {
          const input = document.getElementById('link-url-input') as HTMLInputElement;
          input?.focus();
          
          // Handle enter key
          input?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              (window as any).handleLinkInsert();
            }
          });
        }, 50);
        
        // Define the handler
        (window as any).handleLinkInsert = () => {
          const input = document.getElementById('link-url-input') as HTMLInputElement;
          const url = input?.value;
          if (url) {
            editor.createLink(url);
            onClose();
          }
          linkModal.remove();
          delete (window as any).handleLinkInsert;
        };
        break;
        
      case 'image':
        // Create a file input for image upload
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            try {
              // Convert file to base64 data URL
              const reader = new FileReader();
              reader.onload = (e) => {
                const dataUrl = e.target?.result;
                if (typeof dataUrl === 'string') {
                  editor.insertBlocks([{
                    type: 'image',
                    props: { url: dataUrl }
                  }], editor.getTextCursorPosition().block, 'after');
                  onClose();
                }
              };
              reader.onerror = () => {
                console.error('Failed to read file');
              };
              reader.readAsDataURL(file);
            } catch (error) {
              console.error('Failed to upload image:', error);
            }
          }
          fileInput.remove();
        });
        
        document.body.appendChild(fileInput);
        fileInput.click();
        break;
      case 'table':
        editor.insertBlocks([{
          type: 'table',
          content: {
            type: 'tableContent',
            rows: [
              { cells: ['', '', ''] },
              { cells: ['', '', ''] }
            ]
          }
        }], editor.getTextCursorPosition().block, 'after');
        // Close after table insertion
        onClose();
        break;
      case 'codeblock':
        editor.insertBlocks([{
          type: 'codeBlock',
          props: { language: 'javascript' }
        }], editor.getTextCursorPosition().block, 'after');
        onClose();
        break;
      case 'divider':
        // BlockNote doesn't have a built-in divider, so we'll use a paragraph with a horizontal rule
        editor.insertBlocks([{
          type: 'paragraph',
          content: '---'
        }], editor.getTextCursorPosition().block, 'after');
        onClose();
        break;
      case 'emoji':
        // Create a simple emoji picker modal
        const emojiModal = document.createElement('div');
        emojiModal.className = 'fixed inset-0 z-[200] flex items-center justify-center';
        const commonEmojis = ['😊', '👍', '❤️', '🎉', '✨', '🔥', '💯', '👏', '😂', '🤔', '👌', '✅', '🚀', '💡', '📌', '⭐'];
        emojiModal.innerHTML = `
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick="this.parentElement.remove()"></div>
          <div class="relative bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-80 animate-in fade-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-800">
            <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Insert Emoji</h3>
            <div class="grid grid-cols-8 gap-2">
              ${commonEmojis.map(emoji => `
                <button 
                  onclick="window.handleEmojiInsert('${emoji}')"
                  class="text-2xl p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                >${emoji}</button>
              `).join('')}
            </div>
          </div>
        `;
        document.body.appendChild(emojiModal);
        
        // Define the handler
        (window as any).handleEmojiInsert = (emoji: string) => {
          document.execCommand('insertText', false, emoji);
          emojiModal.remove();
          delete (window as any).handleEmojiInsert;
        };
        break;
    }
  };

  const tabs = [
    { id: 'format' as TabType, label: 'Format', icon: <Type size={14} /> },
    { id: 'ai' as TabType, label: 'AI', icon: <Sparkles size={14} /> },
    { id: 'insert' as TabType, label: 'Insert', icon: <FileText size={14} /> }
  ];

  return createPortal(
    <div
      ref={popoverRef}
      className="fixed z-[100]"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className="animate-in fade-in slide-in-from-left-2 rounded-lg border border-gray-200 bg-white p-3 shadow-lg duration-200 dark:border-gray-800 dark:bg-gray-900" style={{ minWidth: '340px' }}>
        {/* Tab Navigation */}
        <div className="border-border-subtle mb-2 flex items-center gap-1 border-b pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                activeTab === tab.id 
                  ? "bg-accent-primary text-white shadow-sm" 
                  : "text-secondary hover:bg-hover hover:text-primary"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Format Tab */}
        {activeTab === 'format' && (
          <div className="space-y-2">
            {/* Block Types */}
            <div className="flex items-center gap-1">
              <button onClick={() => handleBlockType('paragraph')} className="group relative rounded-md p-1.5 transition-colors hover:bg-hover" title="Paragraph">
                <Type size={16} className="group-hover:text-primary" />
                <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">Paragraph</span>
              </button>
              <button onClick={() => handleBlockType('heading')} className="group relative rounded-md p-1.5 transition-colors hover:bg-hover" title="Heading 1">
                <Heading1 size={16} className="group-hover:text-primary" />
                <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">Heading 1</span>
              </button>
              <button onClick={() => handleBlockType('heading2')} className="group relative rounded-md p-1.5 transition-colors hover:bg-hover" title="Heading 2">
                <Heading2 size={16} className="group-hover:text-primary" />
                <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">Heading 2</span>
              </button>
              <button onClick={() => handleBlockType('heading3')} className="group relative rounded-md p-1.5 transition-colors hover:bg-hover" title="Heading 3">
                <Heading3 size={16} className="group-hover:text-primary" />
                <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">Heading 3</span>
              </button>
              <div className="bg-border-subtle mx-1 h-5 w-px"></div>
              <button onClick={() => handleBlockType('bulletListItem')} className="group relative rounded-md p-1.5 transition-colors hover:bg-hover" title="Bullet List">
                <List size={16} className="group-hover:text-primary" />
                <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">Bullet List</span>
              </button>
              <button onClick={() => handleBlockType('numberedListItem')} className="group relative rounded-md p-1.5 transition-colors hover:bg-hover" title="Numbered List">
                <ListOrdered size={16} className="group-hover:text-primary" />
                <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">Numbered List</span>
              </button>
              <button onClick={() => handleBlockType('quote')} className="group relative rounded-md p-1.5 transition-colors hover:bg-hover" title="Quote">
                <Quote size={16} className="group-hover:text-primary" />
                <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">Quote</span>
              </button>
            </div>

            {/* Text Formatting */}
            <div className="flex items-center gap-1">
              <button onClick={() => handleFormatting('bold')} className="group relative rounded-md p-1.5 transition-colors hover:bg-hover" title="Bold (Ctrl+B)">
                <Bold size={16} className="group-hover:text-primary" />
                <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">Bold (Ctrl+B)</span>
              </button>
              <button onClick={() => handleFormatting('italic')} className="group relative rounded-md p-1.5 transition-colors hover:bg-hover" title="Italic (Ctrl+I)">
                <Italic size={16} className="group-hover:text-primary" />
                <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">Italic (Ctrl+I)</span>
              </button>
              <button onClick={() => handleFormatting('underline')} className="group relative rounded-md p-1.5 transition-colors hover:bg-hover" title="Underline (Ctrl+U)">
                <Underline size={16} className="group-hover:text-primary" />
                <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">Underline (Ctrl+U)</span>
              </button>
              <button onClick={() => handleFormatting('strikethrough')} className="group relative rounded-md p-1.5 transition-colors hover:bg-hover" title="Strikethrough">
                <Strikethrough size={16} className="group-hover:text-primary" />
                <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">Strikethrough</span>
              </button>
              <div className="bg-border-subtle mx-1 h-5 w-px"></div>
              <button onClick={() => handleFormatting('code')} className="group relative rounded-md p-1.5 transition-colors hover:bg-hover" title="Code">
                <Code size={16} className="group-hover:text-primary" />
                <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">Code</span>
              </button>
              <button onClick={() => handleFormatting('highlight')} className="group relative rounded-md p-1.5 transition-colors hover:bg-hover" title="Highlight">
                <Highlighter size={16} className="group-hover:text-primary" />
                <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">Highlight</span>
              </button>
            </div>

            {/* Alignment & Indentation */}
            <div className="flex items-center gap-1">
              <button onClick={() => handleFormatting('align-left')} className="group relative rounded-md p-1.5 transition-colors hover:bg-hover" title="Align Left">
                <AlignLeft size={16} className="group-hover:text-primary" />
                <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">Align Left</span>
              </button>
              <button onClick={() => handleFormatting('align-center')} className="group relative rounded-md p-1.5 transition-colors hover:bg-hover" title="Align Center">
                <AlignCenter size={16} className="group-hover:text-primary" />
                <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">Align Center</span>
              </button>
              <button onClick={() => handleFormatting('align-right')} className="group relative rounded-md p-1.5 transition-colors hover:bg-hover" title="Align Right">
                <AlignRight size={16} className="group-hover:text-primary" />
                <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">Align Right</span>
              </button>
              <div className="bg-border-subtle mx-1 h-5 w-px"></div>
              <button onClick={() => handleFormatting('outdent')} className="group relative rounded-md p-1.5 transition-colors hover:bg-hover" title="Decrease Indent">
                <IndentDecrease size={16} className="group-hover:text-primary" />
                <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">Outdent</span>
              </button>
              <button onClick={() => handleFormatting('indent')} className="group relative rounded-md p-1.5 transition-colors hover:bg-hover" title="Increase Indent">
                <IndentIncrease size={16} className="group-hover:text-primary" />
                <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">Indent</span>
              </button>
            </div>
          </div>
        )}

        {/* AI Tab */}
        {activeTab === 'ai' && (
          <div className="space-y-1">
            <button onClick={() => handleAIAction('rewrite-professional')} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-hover">
              <RefreshCw size={16} className="text-purple-600" />
              <span className="text-sm">Make professional</span>
            </button>
            <button onClick={() => handleAIAction('rewrite-friendly')} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-hover">
              <RefreshCw size={16} className="text-purple-600" />
              <span className="text-sm">Make friendly</span>
            </button>
            <button onClick={() => handleAIAction('rewrite-concise')} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-hover">
              <RefreshCw size={16} className="text-purple-600" />
              <span className="text-sm">Make concise</span>
            </button>
            <button onClick={() => handleAIAction('proofread')} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-hover">
              <CheckCircle size={16} className="text-purple-600" />
              <span className="text-sm">Proofread</span>
            </button>
            <button onClick={() => handleAIAction('summarize')} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-hover">
              <FileText size={16} className="text-purple-600" />
              <span className="text-sm">Summarize</span>
            </button>
            <button onClick={() => handleAIAction('translate')} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-hover">
              <Languages size={16} className="text-purple-600" />
              <span className="text-sm">Translate</span>
            </button>
            <button onClick={() => handleAIAction('explain')} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-hover">
              <Lightbulb size={16} className="text-purple-600" />
              <span className="text-sm">Explain</span>
            </button>
            <button onClick={() => handleAIAction('create-list')} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-hover">
              <ListTodo size={16} className="text-purple-600" />
              <span className="text-sm">Create list</span>
            </button>
            <button onClick={() => handleAIAction('key-points')} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-hover">
              <Key size={16} className="text-purple-600" />
              <span className="text-sm">Extract key points</span>
            </button>

            <div className="border-border-subtle my-2 border-t pt-2">
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (aiQuestion.trim()) {
                        handleAIAction('ask-custom', aiQuestion);
                        setAiQuestion('');
                      }
                    }
                  }}
                  placeholder="Ask AI anything..."
                  className="border-border-subtle flex-1 rounded border bg-transparent px-2 py-1 text-sm focus:border-accent-primary focus:outline-none focus:placeholder:text-secondary"
                  onFocus={(e) => {
                    if (!aiQuestion) {
                      e.target.placeholder = "e.g., 'Make it more persuasive' or 'Add examples'";
                    }
                  }}
                  onBlur={(e) => {
                    e.target.placeholder = "Ask AI anything...";
                  }}
                />
                <button
                  onClick={() => {
                    if (aiQuestion.trim()) {
                      handleAIAction('ask-custom', aiQuestion);
                      setAiQuestion('');
                    }
                  }}
                  className="rounded p-1.5 hover:bg-hover"
                  title="Send"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Insert Tab */}
        {activeTab === 'insert' && (
          <div className="space-y-1">
            <button onClick={() => handleInsert('link')} className="group flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-hover">
              <Link size={16} className="text-purple-600" />
              <span className="text-sm">Insert link</span>
            </button>
            <button onClick={() => handleInsert('image')} className="group flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-hover">
              <Image size={16} className="text-purple-600" />
              <span className="text-sm">Insert image</span>
            </button>
            <button onClick={() => handleInsert('table')} className="group flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-hover">
              <Table size={16} className="text-purple-600" />
              <span className="text-sm">Insert table</span>
            </button>
            <button onClick={() => handleInsert('codeblock')} className="group flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-hover">
              <CodeSquare size={16} className="text-purple-600" />
              <span className="text-sm">Insert code block</span>
            </button>
            <button onClick={() => handleInsert('divider')} className="group flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-hover">
              <Minus size={16} className="text-purple-600" />
              <span className="text-sm">Insert divider</span>
            </button>
            <button onClick={() => handleInsert('emoji')} className="group flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-hover">
              <Smile size={16} className="text-purple-600" />
              <span className="text-sm">Insert emoji</span>
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}