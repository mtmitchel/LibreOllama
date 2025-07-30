import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Block, BlockNoteEditor as BlockNoteEditorType, PartialBlock } from '@blocknote/core';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView, lightDefaultTheme, Theme } from '@blocknote/mantine';
import '@blocknote/core/style.css';
import '@blocknote/mantine/style.css';
import './BlockNoteEditor.css'; // Simplified custom styles
import { htmlToBlocks } from '../utils/htmlToBlocks';
import { BrowserLikeContextMenu } from './BrowserLikeContextMenu';
import { FormattingToolbar } from './FormattingToolbar';
import { AlignmentMenu } from './AlignmentMenu';
import { AIOutputModalPro } from '../../../components/ai/AIOutputModalPro';
import { LLMProviderManager } from '../../../services/llmProviders';
import { useSettingsStore } from '../../../stores/settingsStore';
import type { AIAction } from '../../../components/ai/AIWritingToolsMenu';

// Handles file uploads by converting them to base64 data URLs.
// This allows images/files to be embedded directly in the note content
// without requiring a separate server for hosting.
const handleUpload = async (file: File) => {
  const reader = new FileReader();
  return new Promise<string>((resolve, reject) => {
    reader.onload = (e) => {
      const dataUrl = e?.target?.result;
      if (typeof dataUrl === 'string') {
        resolve(dataUrl);
      } else {
        reject(new Error('Failed to read file.'));
      }
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file.'));
    };
    reader.readAsDataURL(file);
  });
};


// Creates a BlockNote theme object that aligns with the app's design system.
// Note: We use hardcoded hex values because the BlockNote theme object is created in JavaScript
// and cannot resolve CSS variables (`var(...)`) at runtime. These values are sourced from
// `src/core/design-system/globals.css`.
const customLightTheme: Theme = {
  ...lightDefaultTheme,
  colors: {
    ...lightDefaultTheme.colors,
    editor: {
      text: '#18181b', // var(--text-primary)
      background: '#f8f9fa', // var(--bg-notes)
    },
    menu: {
      text: '#18181b', // var(--text-primary)
      background: '#ffffff', // var(--bg-card)
    },
    tooltip: {
      text: '#ffffff', // var(--text-inverted)
      background: '#18181b', // var(--gray-900)
    },
    hovered: {
      text: '#18181b', // var(--text-primary)
      background: '#f4f4f5', // var(--gray-100), close to --state-hover
    },
    selected: {
      text: '#4338ca', // var(--accent-text)
      background: '#eef2ff', // var(--state-selected)
    },
    disabled: {
      text: '#a1a1aa', // var(--text-muted)
      background: '#f4f4f5', // var(--gray-100)
    },
    shadow: '#d4d4d8', // var(--gray-300)
    border: '#e4e4e7', // var(--border-primary)
    sideMenu: '#71717a', // var(--text-tertiary)
    highlights: {
      gray: {
        text: '#18181b',
        background: '#f4f4f5',
      },
      brown: {
        text: '#18181b',
        background: '#f5f5dc',
      },
      red: {
        text: '#18181b',
        background: '#fee2e2',
      },
      orange: {
        text: '#18181b',
        background: '#fed7aa',
      },
      yellow: {
        text: '#18181b',
        background: '#fef3c7',
      },
      green: {
        text: '#18181b',
        background: '#dcfce7',
      },
      blue: {
        text: '#18181b',
        background: '#e0e7ff',
      },
      purple: {
        text: '#18181b',
        background: '#e9d5ff',
      },
      pink: {
        text: '#18181b',
        background: '#fce7f3',
      },
    },
  },
  borderRadius: 6, // Corresponds to --radius-md
  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
};

// Helper to parse content safely from either HTML or BlockNote JSON
const parseContent = (content: string): PartialBlock[] => {
  if (content) {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      // Not a JSON string, so fall through and treat as HTML
    }
    return htmlToBlocks(content);
  }
  // Return a default empty paragraph if content is empty
  return [{ type: 'paragraph', content: '' }];
};


interface BlockNoteEditorProps {
  content: string; // This will be the HTML or JSON string from the database
  onChange: (newContent: Block[]) => void;
  readOnly?: boolean;
  className?: string;
}

const BlockNoteEditor: React.FC<BlockNoteEditorProps> = ({
  content,
  onChange,
  readOnly,
  className,
}) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ top: 0, left: 0 });
  const [showAIModal, setShowAIModal] = useState(false);
  
  // Debug effect to track modal state
  useEffect(() => {
    console.log('showAIModal state changed:', showAIModal);
  }, [showAIModal]);
  const [showAlignmentMenu, setShowAlignmentMenu] = useState(false);
  const [alignmentMenuPosition, setAlignmentMenuPosition] = useState({ top: 0, left: 0 });
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedBlockType, setSelectedBlockType] = useState<string | null>(null);
  const [aiModalData, setAIModalData] = useState<{
    prompt: string;
    output: string;
    isLoading: boolean;
    action: AIAction;
    originalText: string;
    usedModel?: string;
    usedProvider?: string;
    selectedProvider?: string;
    selectedModel?: string;
  }>({ prompt: '', output: '', isLoading: false, action: 'rewrite-professional', originalText: '' });
  
  const settings = useSettingsStore();
  
  // Store editor state when context menu opens
  const preservedStateRef = useRef<{
    selection?: any;
    cursorPosition?: any;
    selectedText?: string;
  }>({});
  // Ref to track whether an update is coming from a prop change, to prevent loops.
  const isUpdatingFromProps = useRef(false);
  // Ref to store the latest onChange handler, to avoid re-running effects.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  // Creates the editor instance, now with a file upload handler.
  const editor: BlockNoteEditorType | null = useCreateBlockNote({
    uploadFile: handleUpload,
  });

  // Effect for handling incoming content changes from props
  useEffect(() => {
    if (!editor) {
      return;
    }
    
    const newBlocks = parseContent(content);
    // Use JSON.stringify for a cheap but effective deep equality check.
    const currentBlocksJSON = JSON.stringify(editor.topLevelBlocks);
    const newBlocksJSON = JSON.stringify(newBlocks);

    // If the new content is different from the current editor content, update the editor.
    if (newBlocksJSON !== currentBlocksJSON) {
      isUpdatingFromProps.current = true;
      editor.replaceBlocks(editor.topLevelBlocks, newBlocks);
      // It's crucial to reset the flag in a timeout to allow the update to process
      // before we start listening for user changes again.
      setTimeout(() => {
        isUpdatingFromProps.current = false;
      }, 0);
    }
  }, [content, editor]);

  // Effect for handling outgoing changes from the editor to the parent
  useEffect(() => {
    if (!editor) {
      return;
    }

    try {
      const unsub = editor.onEditorContentChange(() => {
        // If the editor is being updated by a prop change, do not trigger the onChange handler.
        if (!isUpdatingFromProps.current) {
          onChangeRef.current(editor.topLevelBlocks);
        }
      });

      // Return cleanup function if unsub is a function, otherwise return empty cleanup
      return typeof unsub === 'function' ? unsub : () => {};
    } catch (error) {
      // If onEditorContentChange doesn't return a cleanup function, handle gracefully
      console.warn('Editor content change listener setup failed:', error);
      return () => {};
    }
  }, [editor]);


  if (!editor) {
    return <div>Loading Editor...</div>;
  }

  // Handle right-click for context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (editor && !readOnly) {
      // Preserve editor state before opening menu
      const selection = editor.getSelection();
      const cursorPosition = editor.getTextCursorPosition();
      const selectedText = editor.getSelectedText();
      
      preservedStateRef.current = {
        selection,
        cursorPosition,
        selectedText
      };
      
      setContextMenuPosition({ top: e.clientY, left: e.clientX });
      setShowContextMenu(true);
    }
  }, [editor, readOnly]);
  
  // Restore editor state and focus
  const restoreEditorState = useCallback(() => {
    if (!editor) return;
    
    const state = preservedStateRef.current;
    if (!state) return;
    
    // Restore selection if it existed
    if (state.selection && state.selection.blocks.length > 0) {
      try {
        editor.setSelection(
          state.selection.blocks[0],
          state.selection.blocks[state.selection.blocks.length - 1]
        );
      } catch (err) {
        console.error('Failed to restore selection:', err);
      }
    } else if (state.cursorPosition) {
      try {
        editor.setTextCursorPosition(state.cursorPosition.block, "end");
      } catch (err) {
        console.error('Failed to restore cursor position:', err);
      }
    }
    
    // Force focus back to editor
    setTimeout(() => {
      editor.focus();
    }, 10);
  }, [editor]);

  // Handle AI actions
  const handleAIAction = useCallback(async (action: AIAction, customPrompt?: string) => {
    console.log('AI Action triggered:', action, 'customPrompt:', customPrompt);
    if (!editor) return;
    
    const selectedText = preservedStateRef.current?.selectedText || editor.getSelectedText() || aiModalData.originalText;
    console.log('Selected text:', selectedText);
    if (!selectedText) {
      console.log('No text selected, returning');
      return;
    }

    // Close context menu first
    setShowContextMenu(false);
    
    // Small delay to ensure context menu is closed before showing modal
    setTimeout(() => {
      console.log('About to set modal data and show modal');
      
      // Use custom prompt if provided
      let prompt = customPrompt || '';
      let skipInitialProcessing = !!customPrompt;
      
      // Only create prompt if no custom prompt provided
      if (!customPrompt) {
        switch (action) {
        case 'rewrite-professional':
          prompt = `Rewrite the following text in a professional, formal tone while maintaining the original meaning:\n\n${selectedText}`;
          break;
        case 'rewrite-friendly':
          prompt = `Rewrite the following text in a warm, friendly, and conversational tone:\n\n${selectedText}`;
          break;
        case 'rewrite-concise':
          prompt = `Make the following text more concise and to the point without losing important information:\n\n${selectedText}`;
          break;
        case 'rewrite-expanded':
          prompt = `Expand and elaborate on the following text with more detail and context:\n\n${selectedText}`;
          break;
        case 'proofread':
          prompt = `Proofread the following text and correct any grammar, spelling, punctuation, or style errors. Preserve the original tone and meaning:\n\n${selectedText}`;
          break;
        case 'summarize':
          prompt = `Create a clear and concise summary of the main points in the following text:\n\n${selectedText}`;
          break;
        case 'translate':
          // For translate, we'll show the modal first with language selector
          skipInitialProcessing = true;
          prompt = `Translate to [language will be selected]:\n\n${selectedText}`;
          break;
        case 'explain':
          prompt = `Explain the following text in simple, easy-to-understand terms:\n\n${selectedText}`;
          break;
        case 'create-list':
          prompt = `Convert the following text into a well-organized bulleted or numbered list:\n\n${selectedText}`;
          break;
        case 'key-points':
          prompt = `Extract and list the key points, main ideas, or important takeaways from the following text:\n\n${selectedText}`;
          break;
        case 'ask-ai':
        case 'ask-custom':
          // For ask AI, we'll show the modal first with question input
          skipInitialProcessing = true;
          prompt = `[Question will be entered]\n\nText: ${selectedText}`;
          break;
        default:
          prompt = selectedText;
        }
      }

      console.log('Setting AI modal data and showing modal');
      setAIModalData({
        prompt,
        output: '',
        isLoading: !skipInitialProcessing,
        action,
        originalText: selectedText,
      });
      setShowAIModal(true);
      console.log('Modal should be visible now, showAIModal:', true);

      // Process AI request only if not skipping
      if (!skipInitialProcessing) {
        (async () => {
        try {
          // Get the settings state
          const settingsState = useSettingsStore.getState();
          const apiKeys = settingsState.integrations.apiKeys;
          
          // Use AI writing settings configured in settings modal
          const aiWritingSettings = settingsState.aiWriting;
          const provider = aiWritingSettings.defaultProvider;
          const model = aiWritingSettings.defaultModel;
          
          if (!provider || !model) {
            throw new Error('No AI provider or model configured. Please configure AI settings.');
          }
          
          // Get provider manager and make the call
          const providerManager = LLMProviderManager.getInstance(apiKeys);
          const llmProvider = providerManager.getProvider(provider);
          
          if (!llmProvider) {
            throw new Error(`Provider ${provider} not found`);
          }
          
          if (!llmProvider.isConfigured()) {
            throw new Error(`Provider ${provider} is not configured. Please check your API keys in settings.`);
          }

          // Add action-specific system prompts for better output
          let systemPrompt = 'You are a professional writing assistant. Return ONLY the processed text without any explanations, introductions, or commentary. Do not include phrases like "Here is", "This is", or any other preamble.';
          
          // Enhance system prompt based on action
          switch (action) {
            case 'proofread':
              systemPrompt += ' Fix errors while preserving the author\'s voice and style. Make minimal changes necessary for correctness.';
              break;
            case 'create-list':
              systemPrompt += ' Format as a clean bulleted list using • for bullets. Group related items if appropriate.';
              break;
            case 'key-points':
              systemPrompt += ' Present as a concise bulleted list of the most important points, typically 3-7 items.';
              break;
            case 'summarize':
              systemPrompt += ' Create a paragraph summary that captures the essence in about 1/3 the original length.';
              break;
          }
          
          const messages = [
            { role: 'system' as const, content: systemPrompt },
            { role: 'user' as const, content: prompt }
          ];

          // Make the AI call
          const response = await llmProvider.chat(messages, model);

          setAIModalData(prev => ({
            ...prev,
            output: response,
            isLoading: false,
            usedModel: model,
            usedProvider: provider,
          }));
        } catch (error) {
          console.error('AI processing error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          setAIModalData(prev => ({
            ...prev,
            output: `Error: ${errorMessage}`,
            isLoading: false,
          }));
        }
      })();
      }
    }, 100); // Close setTimeout
  }, [editor]);

  // Handle format actions
  const handleFormatAction = useCallback((formatType: string) => {
    if (!editor) return;
    
    // Don't close menu yet - apply formatting first
    switch (formatType) {
      case 'bold':
        editor.toggleStyles({ bold: true });
        break;
      case 'italic':
        editor.toggleStyles({ italic: true });
        break;
      case 'underline':
        editor.toggleStyles({ underline: true });
        break;
      case 'code':
        editor.toggleStyles({ code: true });
        break;
      case 'quote':
        const pos = editor.getTextCursorPosition();
        if (pos.block) {
          editor.updateBlock(pos.block, { 
            type: 'paragraph',
            props: { backgroundColor: 'gray', textColor: 'gray' }
          });
        }
        break;
      case 'bulletListItem':
      case 'numberedListItem':
        const position = editor.getTextCursorPosition();
        if (position.block) {
          editor.updateBlock(position.block, { 
            type: formatType as any
          });
        }
        break;
    }
    
    // Now close the menu
    setShowContextMenu(false);
    
    // Focus back to editor
    setTimeout(() => {
      editor.focus();
    }, 10);
  }, [editor]);

  // Handle insert actions
  const handleInsertAction = useCallback((insertType: string) => {
    if (!editor) return;
    
    const position = editor.getTextCursorPosition();
    if (!position.block) return;
    
    switch (insertType) {
      case 'link':
        const url = window.prompt('Enter URL:');
        if (url) {
          const selectedText = preservedStateRef.current?.selectedText || editor.getSelectedText();
          if (selectedText) {
            editor.createLink(url, selectedText);
          } else {
            // Insert link at cursor position
            editor.insertInlineContent([{
              type: "link",
              href: url,
              content: url,
            }]);
          }
        }
        break;
      case 'image':
        const imageUrl = window.prompt('Enter image URL:');
        if (imageUrl) {
          editor.insertBlocks(
            [{ type: 'image', props: { url: imageUrl } }],
            position.block,
            'after'
          );
        }
        break;
      case 'table':
        editor.insertBlocks(
          [{ type: 'table', content: { type: 'tableContent', rows: [
            { cells: ['', '', ''] },
            { cells: ['', '', ''] },
            { cells: ['', '', ''] }
          ] } }],
          position.block,
          'after'
        );
        break;
    }
    
    setShowContextMenu(false);
    
    // Focus back to editor
    setTimeout(() => {
      editor.focus();
    }, 10);
  }, [editor]);

  // Handle replacing text from AI modal
  const handleReplaceText = useCallback(() => {
    if (!editor || !aiModalData.output) return;
    
    // Since the modal was open, we lost the selection
    // The best we can do is insert at the current cursor position
    // or replace if there's still a selection
    const currentSelection = editor.getSelectedText();
    
    if (currentSelection && currentSelection === aiModalData.originalText) {
      // Selection is still intact, replace it
      editor.insertInlineContent(aiModalData.output);
    } else if (preservedStateRef.current?.cursorPosition) {
      // Try to restore cursor position and insert
      try {
        editor.setTextCursorPosition(preservedStateRef.current.cursorPosition.block, "end");
        editor.insertInlineContent(aiModalData.output);
      } catch (err) {
        console.error('Failed to restore cursor position:', err);
        // Just insert at current position
        editor.insertInlineContent(aiModalData.output);
      }
    } else {
      // Just insert at current cursor position
      editor.insertInlineContent(aiModalData.output);
    }
    
    setShowAIModal(false);
  }, [editor, aiModalData.output]);

  // Handle basic editing operations
  const handleCut = useCallback(() => {
    const selectedText = preservedStateRef.current?.selectedText || editor.getSelectedText();
    if (selectedText) {
      navigator.clipboard.writeText(selectedText);
      // Replace selection with empty string
      editor.insertInlineContent("");
    }
    setShowContextMenu(false);
  }, [editor]);

  const handleCopy = useCallback(() => {
    const selectedText = preservedStateRef.current?.selectedText || editor.getSelectedText();
    if (selectedText) {
      navigator.clipboard.writeText(selectedText);
    }
    setShowContextMenu(false);
  }, [editor]);

  const handlePaste = useCallback(async () => {
    restoreEditorState();
    
    setTimeout(async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          editor.insertInlineContent(text);
        }
      } catch (err) {
        console.error('Failed to read clipboard:', err);
      }
    }, 20);
    
    setShowContextMenu(false);
  }, [editor, restoreEditorState]);

  return (
    <div className="flex flex-col h-full">
      {/* Permanent formatting toolbar */}
      {!readOnly && <FormattingToolbar editor={editor} />}
      
      {/* Editor content area */}
      <div 
        className={`blocknote-editor-container flex-1 ${className}`}
        onContextMenu={handleContextMenu}
      >
        <BlockNoteView
          editor={editor}
          editable={!readOnly}
          theme={customLightTheme}
          className="h-full"
          formattingToolbar={false}
        />
      </div>
      
      {editor && (
        <>
          <BrowserLikeContextMenu
            isOpen={showContextMenu}
            onClose={() => {
              setShowContextMenu(false);
              // Restore focus to editor when menu closes
              setTimeout(() => {
                restoreEditorState();
              }, 10);
            }}
            position={contextMenuPosition}
            editor={editor}
            onAIAction={handleAIAction}
            onCut={handleCut}
            onCopy={handleCopy}
            onPaste={handlePaste}
          />
          
          <AIOutputModalPro
            isOpen={showAIModal}
            onClose={() => setShowAIModal(false)}
            prompt={aiModalData.prompt}
            output={aiModalData.output}
            isLoading={aiModalData.isLoading}
            onReplace={handleReplaceText}
            onCopy={() => {
              navigator.clipboard.writeText(aiModalData.output);
            }}
            onInsert={() => {
              if (editor && aiModalData.output) {
                // Insert at current cursor position without replacing
                editor.insertInlineContent(' ' + aiModalData.output);
              }
              setShowAIModal(false);
            }}
            action={aiModalData.action}
            originalText={aiModalData.originalText}
            usedModel={aiModalData.usedModel}
            usedProvider={aiModalData.usedProvider}
            onRegenerate={(options) => {
              console.log('Regenerating with options:', options);
              
              // Handle translate language change
              if (options?.language) {
                const newPrompt = `Translate the following text to ${options.language}:\n\n${aiModalData.originalText}`;
                handleAIAction(aiModalData.action, newPrompt);
              } 
              // Handle ask AI question
              else if (options?.question) {
                const newPrompt = `${options.question}\n\nText: ${aiModalData.originalText}`;
                handleAIAction(aiModalData.action, newPrompt);
              }
              // Default regenerate
              else {
                handleAIAction(aiModalData.action);
              }
            }}
          />
        </>
      )}
    </div>
  );
};

export default BlockNoteEditor;