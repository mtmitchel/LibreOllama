import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Block, BlockNoteEditor as BlockNoteEditorType, PartialBlock } from '@blocknote/core';
import { useCreateBlockNote, SuggestionMenuController, getDefaultReactSlashMenuItems } from '@blocknote/react';
import { BlockNoteView, lightDefaultTheme, Theme } from '@blocknote/mantine';
import '@blocknote/core/style.css';
import '@blocknote/mantine/style.css';
import './BlockNoteEditor.css'; // Simplified custom styles
import { htmlToBlocks } from '../utils/htmlToBlocks';
import { BlockNotePopover } from './BlockNotePopover';
import { CustomSlashMenu } from './CustomSlashMenu';

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
  // Ref to track whether an update is coming from a prop change, to prevent loops.
  const isUpdatingFromProps = useRef(false);
  // Ref to store the latest onChange handler, to avoid re-running effects.
  const onChangeRef = useRef(onChange);
  const [showPopover, setShowPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  // Creates the editor instance, now with a file upload handler.
  const editor: BlockNoteEditorType | null = useCreateBlockNote({
    uploadFile: handleUpload,
  });

  // Handle text selection and block selection
  useEffect(() => {
    if (!editor || readOnly) return;

    let selectionTimeout: NodeJS.Timeout;

    const handleSelectionEnd = () => {
      // Clear any existing timeout
      clearTimeout(selectionTimeout);
      
      // Wait a moment to ensure selection is complete
      selectionTimeout = setTimeout(() => {
        // First check for text selection
        const selection = window.getSelection();
        const hasTextSelection = selection && !selection.isCollapsed && selection.toString().trim().length > 0;
        
        // Then check for block selection (like images)
        const currentBlock = editor.getTextCursorPosition().block;
        const hasBlockSelection = currentBlock && ['image', 'table', 'video', 'audio', 'file'].includes(currentBlock.type);
        
        if (hasTextSelection || hasBlockSelection) {
          // Check if selection is within BlockNote editor
          const editorElement = document.querySelector('.bn-editor');
          if (!editorElement) return;
          
          let rect: DOMRect;
          
          if (hasTextSelection && selection) {
            // For text selection, use the selection range
            if (!editorElement.contains(selection.anchorNode)) return;
            const range = selection.getRangeAt(0);
            rect = range.getBoundingClientRect();
          } else {
            // For block selection, find the block element
            const blockId = currentBlock.id;
            
            // Try multiple selectors to find the block element
            let blockElement = editorElement.querySelector(`[data-id="${blockId}"]`) || 
                              editorElement.querySelector(`[data-block-id="${blockId}"]`);
            
            // If not found, try to find the image element within the editor
            if (!blockElement && currentBlock.type === 'image') {
              // Look for the actual image element
              const allImages = editorElement.querySelectorAll('img');
              const blockContainer = Array.from(allImages).find(img => {
                const container = img.closest('[data-node-type], [data-content-type], .bn-block-content');
                return container && editorElement.contains(container);
              })?.closest('[data-node-type], [data-content-type], .bn-block-content');
              
              if (blockContainer) {
                blockElement = blockContainer;
              }
            }
            
            if (!blockElement) {
              // Fallback: try to find the currently focused element
              const focusedElement = document.activeElement;
              if (focusedElement && editorElement.contains(focusedElement)) {
                // For images, try to get the image element itself
                const imgElement = focusedElement.querySelector('img') || focusedElement.closest('img');
                rect = (imgElement || focusedElement).getBoundingClientRect();
              } else {
                console.log('Could not find block element for:', currentBlock);
                return;
              }
            } else {
              // For images, get the actual image rect, not the container
              const imgElement = blockElement.querySelector('img');
              rect = (imgElement || blockElement).getBoundingClientRect();
            }
          }
          
          // Calculate popover position - always to the right
          const popoverWidth = 340; // Width from BlockNotePopover
          const popoverHeight = 250; // Approximate height
          const padding = 10;
          
          // Always position to the right of the selection/block
          let left = rect.right + padding;
          let top = rect.top + (rect.height / 2) - (popoverHeight / 2);
          
          // Check if popover would go off right edge
          if (left + popoverWidth > window.innerWidth - padding) {
            // Position to the left of selection instead
            left = rect.left - popoverWidth - padding;
          }
          
          // Check if popover would go off top edge
          if (top < padding) {
            top = padding;
          }
          
          // Check if popover would go off bottom edge
          if (top + popoverHeight > window.innerHeight - padding) {
            top = window.innerHeight - popoverHeight - padding;
          }
          
          setPopoverPosition({ top, left });
          setShowPopover(true);
        } else {
          setShowPopover(false);
        }
      }, 200); // 200ms delay to ensure selection is complete
    };

    const handleSelectionChange = () => {
      // Check both text and block selection
      const selection = window.getSelection();
      const hasTextSelection = selection && !selection.isCollapsed && selection.toString().trim().length > 0;
      const currentBlock = editor.getTextCursorPosition().block;
      const hasBlockSelection = currentBlock && ['image', 'table', 'video', 'audio', 'file'].includes(currentBlock.type);
      
      if (!hasTextSelection && !hasBlockSelection) {
        setShowPopover(false);
      }
    };

    // Handle clicks on images and other blocks
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const editorElement = document.querySelector('.bn-editor');
      if (!editorElement || !editorElement.contains(target)) return;
      
      // Check if we clicked on an image
      const imgElement = target.tagName === 'IMG' ? target : target.closest('img');
      if (imgElement) {
        e.preventDefault();
        e.stopPropagation();
        
        const rect = imgElement.getBoundingClientRect();
        const popoverWidth = 340;
        const popoverHeight = 250;
        const padding = 10;
        
        let left = rect.right + padding;
        let top = rect.top + (rect.height / 2) - (popoverHeight / 2);
        
        // Check boundaries
        if (left + popoverWidth > window.innerWidth - padding) {
          left = rect.left - popoverWidth - padding;
        }
        if (top < padding) {
          top = padding;
        }
        if (top + popoverHeight > window.innerHeight - padding) {
          top = window.innerHeight - popoverHeight - padding;
        }
        
        setPopoverPosition({ top, left });
        setShowPopover(true);
        return;
      }
      
      // Otherwise handle as before
      handleSelectionEnd();
    };

    // Listen for selection changes (hide menu) and mouseup (show menu after delay)
    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('mouseup', handleSelectionEnd);
    document.addEventListener('click', handleClick, true);
    
    // Also listen for BlockNote selection changes
    const unsubscribe = editor.onSelectionChange?.(() => {
      handleSelectionEnd();
    });

    return () => {
      clearTimeout(selectionTimeout);
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mouseup', handleSelectionEnd);
      document.removeEventListener('click', handleClick, true);
      unsubscribe?.();
    };
  }, [editor, readOnly]);

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

  return (
    <div className={`blocknote-editor-container size-full ${className}`}>
      <BlockNoteView
        editor={editor}
        editable={!readOnly}
        theme={customLightTheme}
        className="h-full"
        formattingToolbar={false}
        slashMenu={false}
      >
        <SuggestionMenuController
          triggerCharacter="/"
          suggestionMenuComponent={CustomSlashMenu}
          getItems={async (query) => {
            const allItems = getDefaultReactSlashMenuItems(editor);
            // Filter items based on query
            return allItems.filter(item => 
              item.title.toLowerCase().includes(query.toLowerCase()) ||
              item.aliases?.some(alias => alias.toLowerCase().includes(query.toLowerCase()))
            );
          }}
        />
      </BlockNoteView>
      {editor && (
        <BlockNotePopover
          isOpen={showPopover}
          onClose={() => setShowPopover(false)}
          position={popoverPosition}
          editor={editor}
        />
      )}
    </div>
  );
};

export default BlockNoteEditor; 