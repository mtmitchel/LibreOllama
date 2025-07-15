import React, { useEffect, useRef } from 'react';
import { Block, BlockNoteEditor as BlockNoteEditorType, PartialBlock } from '@blocknote-core';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView, lightDefaultTheme, Theme } from '@blocknote/mantine';
import '@blocknote/core/style.css';
import '@blocknote/mantine/style.css';
import './BlockNoteEditor.css'; // Simplified custom styles
import { htmlToBlocks } from '../utils/htmlToBlocks';

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
    hover: {
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
    highlight: {
      text: '#18181b',
      background: '#e0e7ff', // var(--indigo-100)
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

    const unsub = editor.onEditorContentChange(() => {
      // If the editor is being updated by a prop change, do not trigger the onChange handler.
      if (!isUpdatingFromProps.current) {
        onChangeRef.current(editor.topLevelBlocks);
      }
    });

    // Return cleanup function, with a guard to ensure unsub is callable
    return () => {
      if (typeof unsub === 'function') {
        unsub();
      }
    };
  }, [editor]);


  if (!editor) {
    return <div>Loading Editor...</div>;
  }

  return (
    <div className={`blocknote-editor-container h-full w-full ${className}`}>
      <BlockNoteView
        editor={editor}
        editable={!readOnly}
        theme={customLightTheme}
        className="h-full"
      />
    </div>
  );
};

export default BlockNoteEditor; 