import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { BlockNoteEditor } from '@blocknote/core';
import { useChatStore } from '../../../features/chat/stores/chatStore';
import { useSettingsStore } from '../../../stores/settingsStore';
import { LLMProviderManager, type LLMMessage } from '../../../services/llmProviders';
import { AIOutputModalPro } from '../../../components/ai/AIOutputModalPro';
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
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState<{
    prompt: string;
    output: string;
    isLoading: boolean;
    action: string;
    originalText: string;
  }>({ prompt: '', output: '', isLoading: false, action: '', originalText: '' });
  const savedSelectionRef = useRef<Range | null>(null);
  
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

  // Define processWithAI before using it in callbacks
  const processWithAI = useCallback(async (prompt: string, action: string, originalText: string, options?: any) => {
    console.log('BlockNotePopover processWithAI called:', { prompt, action });
    
    try {
      // Check if modal is already open (regenerating)
      const isRegenerating = showModal;
      
      // Save the current selection before showing modal
      if (!isRegenerating) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
        }
      }
      
      // Update modal to show loading state - preserve previous output if regenerating
      setModalData(prev => ({ 
        ...prev, 
        prompt, 
        output: isRegenerating ? prev.output : '', 
        isLoading: true, 
        action, 
        originalText 
      }));
      
      // Only set showModal and close popover if not regenerating
      if (!isRegenerating) {
        setShowModal(true);
        onClose(); // Close the popover when modal opens
      }
      
      // Get AI writing settings
      const settingsStore = useSettingsStore.getState();
      const aiWritingSettings = settingsStore.aiWriting;
      const chatStore = useChatStore.getState();
      
      // Determine which provider and model to use
      // Priority: AI Writing settings > Chat store settings
      let provider = aiWritingSettings.defaultProvider || chatStore.selectedProvider;
      let model = aiWritingSettings.defaultModel || chatStore.selectedModel;
      
      console.log('BlockNotePopover - AI Writing Settings:', aiWritingSettings);
      console.log('BlockNotePopover - Chat Store:', { provider: chatStore.selectedProvider, model: chatStore.selectedModel });
      console.log('BlockNotePopover - Using:', { provider, model });
      
      // Ensure we have valid provider and model
      if (!provider || !model) {
        throw new Error('No AI provider or model configured. Please configure AI settings.');
      }

      // Modify prompt based on options (e.g., for translation)
      let finalPrompt = prompt;
      if (action === 'translate' && options?.language) {
        finalPrompt = prompt.replace('Spanish', options.language);
      }

      // Get system prompt based on action
      let systemPrompt = 'Return ONLY the processed text without any explanations, introductions, or commentary. Do not include phrases like "Here is", "This is", or any other preamble.';
      
      switch (action) {
        case 'explain':
          systemPrompt = 'Explain the given text in simple, easy-to-understand terms. Return ONLY the explanation without any preamble.';
          break;
        case 'translate':
          systemPrompt = 'Translate the given text accurately. Return ONLY the translation without any explanations.';
          break;
        case 'summarize':
          systemPrompt = 'Provide a concise summary. Return ONLY the summary text without any introductory phrases.';
          break;
        case 'proofread':
          systemPrompt = 'Correct any errors. Return ONLY the corrected text without explanations.';
          break;
        case 'create-list':
          systemPrompt = 'Convert to a bulleted list. Return ONLY the list without any preamble.';
          break;
        case 'key-points':
          systemPrompt = 'Extract key points as a bulleted list. Return ONLY the list without introductions.';
          break;
        case 'rewrite-professional':
          systemPrompt = 'Rewrite in a professional tone. Return ONLY the rewritten text without any preamble like "Here\'s a professional rewrite:".';
          break;
        case 'rewrite-friendly':
          systemPrompt = 'Rewrite in a friendly tone. Return ONLY the rewritten text without introductory phrases.';
          break;
        case 'rewrite-concise':
          systemPrompt = 'Rewrite to be more concise. Return ONLY the shortened text without explanations like "Here\'s a more concise version:".';
          break;
        case 'rewrite-expanded':
          systemPrompt = 'Expand with more detail. Return ONLY the expanded text without introductory phrases.';
          break;
      }

      // Prepare messages for LLM
      const messages: LLMMessage[] = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: finalPrompt
        }
      ];

      // Get the provider manager and make the call
      const apiKeys = settingsStore.integrations.apiKeys;
      const providerManager = LLMProviderManager.getInstance(apiKeys);
      const llmProvider = providerManager.getProvider(provider);
      
      if (!llmProvider || !llmProvider.isConfigured()) {
        throw new Error(`Provider ${provider} is not configured. Please check your API keys in settings.`);
      }

      // Make the AI call
      console.log('Making LLM call with:', { provider, model });
      const response = await llmProvider.chat(messages, model || undefined);
      
      // Update modal with the AI response
      setModalData(prev => ({ 
        ...prev, 
        output: response, 
        isLoading: false 
      }));
    } catch (error) {
      console.error('Failed to process with AI:', error);
      setModalData(prev => ({ 
        ...prev, 
        output: 'Failed to generate AI response. Please try again.', 
        isLoading: false 
      }));
    }
  }, [onClose, showModal]);

  const handleRegenerate = useCallback((options?: any) => {
    if (modalData.prompt && modalData.action && modalData.originalText) {
      // For translation, update the prompt with the new language
      let prompt = modalData.prompt;
      if (modalData.action === 'translate' && options?.language) {
        prompt = `Translate the following text to ${options.language}: "${modalData.originalText}"`;
      }
      
      // Don't reopen modal, just update loading state
      setModalData(prev => ({ ...prev, isLoading: true }));
      
      // Process with updated prompt
      processWithAI(prompt, modalData.action, modalData.originalText, options);
    }
  }, [modalData, processWithAI]);

  const handleReplace = useCallback((text: string) => {
    try {
      // Focus the editor first
      editor.focus();
      
      // Get current selection or use saved selection
      const selection = window.getSelection();
      
      if (selection) {
        // Clear current selection
        selection.removeAllRanges();
        
        // Restore saved selection if available
        if (savedSelectionRef.current) {
          try {
            selection.addRange(savedSelectionRef.current);
          } catch (e) {
            console.log('Could not restore saved selection:', e);
          }
        }
        
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          
          // Delete the current selection
          range.deleteContents();
          
          // Create a text node with the new content
          const textNode = document.createTextNode(text);
          range.insertNode(textNode);
          
          // Move cursor to end of inserted text
          range.setStartAfter(textNode);
          range.setEndAfter(textNode);
          selection.removeAllRanges();
          selection.addRange(range);
          
          // Trigger input event for BlockNote
          const inputEvent = new InputEvent('input', {
            bubbles: true,
            cancelable: true,
            data: text
          });
          textNode.parentElement?.dispatchEvent(inputEvent);
        } else {
          // Fallback to execCommand
          document.execCommand('insertText', false, text);
        }
      }
      
      // Clear saved selection
      savedSelectionRef.current = null;
      
      // Trigger BlockNote to recognize the change
      editor.focus();
      
      setShowModal(false);
      onClose();
    } catch (error) {
      console.error('Failed to replace text:', error);
      // Final fallback
      document.execCommand('insertText', false, text);
      setShowModal(false);
    }
  }, [editor, onClose]);

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

  // processWithAI is now defined above as a useCallback

  const handleAIAction = async (action: string, customQuestion?: string) => {
    const selectedText = editor.getSelectedText();
    const currentBlock = editor.getTextCursorPosition().block;
    
    // For image blocks, handle differently
    if (currentBlock?.type === 'image' && !selectedText) {
      // For now, we'll skip AI actions on images
      // In the future, could add image-specific AI features
      return;
    }
    
    if (!selectedText && action !== 'ask-custom') return;
    
    // Map action to appropriate prompt
    const prompts: Record<string, string> = {
      'rewrite-professional': `Rewrite the following text in a professional tone: "${selectedText}"`,
      'rewrite-friendly': `Rewrite the following text in a friendly, casual tone: "${selectedText}"`,
      'rewrite-concise': `Rewrite the following text to be more concise: "${selectedText}"`,
      'rewrite-expanded': `Expand on the following text with more detail: "${selectedText}"`,
      'proofread': `Proofread and correct any grammar or spelling errors in: "${selectedText}"`,
      'summarize': `Summarize the following text in 2-3 sentences: "${selectedText}"`,
      'translate': `Translate the following text to Spanish: "${selectedText}"`,
      'explain': `Explain the following text in simple terms: "${selectedText}"`,
      'create-list': `Convert the following text into a bulleted list: "${selectedText}"`,
      'key-points': `Extract the key points from the following text: "${selectedText}"`,
      'ask-custom': customQuestion ? `${customQuestion} - Context: "${selectedText}"` : ''
    };
    
    const prompt = prompts[action];
    if (!prompt) return;
    
    await processWithAI(prompt, action, selectedText);
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

  return (
    <>
      {createPortal(
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
      )}
      <AIOutputModalPro
        isOpen={showModal}
        onClose={() => {
          console.log('BlockNotePopover modal onClose triggered');
          setShowModal(false);
        }}
        prompt={modalData.prompt}
        output={modalData.output}
        isLoading={modalData.isLoading}
        onReplace={handleReplace}
        onRegenerate={handleRegenerate}
        action={modalData.action as any}
        originalText={modalData.originalText}
        usedModel={modalData.usedModel}
        usedProvider={modalData.usedProvider}
      />
    </>
  );
}