import React, { useCallback, useEffect, useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Code,
  Link,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Minus,
  Plus,
  Type,
  Palette,
  Image,
  Table,
  ChevronDown,
  Undo,
  Redo,
  Strikethrough,
  Highlighter,
  IndentDecrease,
  IndentIncrease
} from 'lucide-react';
import { BlockNoteEditor } from '@blocknote/core';
import { cn } from '../../../core/lib/utils';
import { LinkModal } from './LinkModal';
import { ImageUploadModal } from './ImageUploadModal';

interface FormattingToolbarProps {
  editor: BlockNoteEditor | null;
  className?: string;
}

interface ToolbarButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  className?: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  onClick,
  icon,
  label,
  active = false,
  disabled = false,
  className
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        "p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-w-[28px] h-[28px]",
        "flex items-center justify-center",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        active && "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
        className
      )}
    >
      {icon}
    </button>
  );
};

const ToolbarSeparator = () => (
  <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
);

export const FormattingToolbar: React.FC<FormattingToolbarProps> = ({ editor, className }) => {
  const [activeStyles, setActiveStyles] = useState<Record<string, boolean>>({});
  const [currentBlockType, setCurrentBlockType] = useState<string>('paragraph');
  const [showBlockTypeMenu, setShowBlockTypeMenu] = useState(false);
  const [textColor, setTextColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [fontSize, setFontSize] = useState(16);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentAlignment, setCurrentAlignment] = useState<'left' | 'center' | 'right' | 'justify'>('left');

  // Update active styles when selection changes
  useEffect(() => {
    if (!editor) return;

    const updateToolbarState = () => {
      const styles = editor.getActiveStyles();
      setActiveStyles({
        bold: styles.bold === true,
        italic: styles.italic === true,
        underline: styles.underline === true,
        strike: styles.strike === true,
        code: styles.code === true,
      });

      // Get current block type and alignment
      const position = editor.getTextCursorPosition();
      if (position.block) {
        setCurrentBlockType(position.block.type);
        // Get text alignment from block props
        const alignment = (position.block.props as any)?.textAlignment || 'left';
        setCurrentAlignment(alignment as any);
      }

      // Get text and background colors if they exist
      if (styles.textColor) {
        setTextColor(styles.textColor as string);
      }
      if (styles.backgroundColor) {
        setBackgroundColor(styles.backgroundColor as string);
      }
    };

    updateToolbarState();

    // Listen for selection changes
    const unsubscribe = editor.onSelectionChange(() => {
      updateToolbarState();
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [editor]);

  const handleUndo = useCallback(() => {
    if (editor) editor.undo();
  }, [editor]);

  const handleRedo = useCallback(() => {
    if (editor) editor.redo();
  }, [editor]);

  const toggleStyle = useCallback((style: string) => {
    if (!editor) return;
    editor.toggleStyles({ [style]: true });
  }, [editor]);

  const setBlockType = useCallback((type: string) => {
    if (!editor) return;
    const position = editor.getTextCursorPosition();
    if (position.block) {
      editor.updateBlock(position.block, { type: type as any });
    }
    setShowBlockTypeMenu(false);
  }, [editor]);

  const insertLink = useCallback(() => {
    if (!editor) return;
    setShowLinkModal(true);
  }, [editor]);

  const handleLinkConfirm = useCallback((url: string, text: string) => {
    if (!editor) return;
    editor.createLink(url, text);
    setShowLinkModal(false);
  }, [editor]);

  const insertImage = useCallback(() => {
    if (!editor) return;
    setShowImageModal(true);
  }, [editor]);

  const handleImageConfirm = useCallback((url: string) => {
    if (!editor) return;
    const position = editor.getTextCursorPosition();
    if (position.block) {
      editor.insertBlocks(
        [{ type: 'image', props: { url } }],
        position.block,
        'after'
      );
    }
    setShowImageModal(false);
  }, [editor]);

  const insertTable = useCallback(() => {
    if (!editor) return;
    const position = editor.getTextCursorPosition();
    if (position.block) {
      editor.insertBlocks(
        [{
          type: 'table',
          content: {
            type: 'tableContent',
            rows: [
              { cells: ['', '', ''] },
              { cells: ['', '', ''] },
              { cells: ['', '', ''] }
            ]
          }
        }],
        position.block,
        'after'
      );
    }
  }, [editor]);

  const insertList = useCallback((ordered: boolean) => {
    if (!editor) return;
    const position = editor.getTextCursorPosition();
    if (position.block) {
      editor.updateBlock(position.block, {
        type: ordered ? 'numberedListItem' : 'bulletListItem' as any
      });
    }
  }, [editor]);

  const handleTextColorChange = useCallback((color: string) => {
    if (!editor) return;
    editor.addStyles({ textColor: color });
    setTextColor(color);
  }, [editor]);

  const handleBackgroundColorChange = useCallback((color: string) => {
    if (!editor) return;
    editor.addStyles({ backgroundColor: color });
    setBackgroundColor(color);
  }, [editor]);

  const handleFontSizeChange = useCallback((delta: number) => {
    if (!editor) return;
    const newSize = Math.max(8, Math.min(72, fontSize + delta));
    setFontSize(newSize);
    // Note: BlockNote doesn't have built-in font size support
    // You would need to implement this as a custom style
  }, [editor, fontSize]);

  const setAlignment = useCallback((alignment: 'left' | 'center' | 'right' | 'justify') => {
    if (!editor) return;
    const position = editor.getTextCursorPosition();
    if (position.block) {
      editor.updateBlock(position.block, {
        props: { textAlignment: alignment }
      });
    }
    setCurrentAlignment(alignment);
  }, [editor]);

  const handleIndent = useCallback((direction: 'increase' | 'decrease') => {
    if (!editor) return;
    if (direction === 'increase') {
      editor.nestBlock();
    } else {
      editor.unnestBlock();
    }
  }, [editor]);

  const getBlockTypeLabel = () => {
    switch (currentBlockType) {
      case 'heading':
        return 'Heading';
      case 'paragraph':
        return 'Normal text';
      case 'bulletListItem':
        return 'Bullet list';
      case 'numberedListItem':
        return 'Numbered list';
      case 'checkListItem':
        return 'Checklist';
      default:
        return 'Normal text';
    }
  };

  if (!editor) return null;

  return (
    <div className={cn(
      "flex items-center gap-0.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700",
      "sticky top-0 z-50",
      className
    )}>
      {/* Undo/Redo */}
      <ToolbarButton onClick={handleUndo} icon={<Undo size={16} />} label="Undo (Ctrl+Z)" />
      <ToolbarButton onClick={handleRedo} icon={<Redo size={16} />} label="Redo (Ctrl+Y)" />
      
      <ToolbarSeparator />
      
      {/* Block type selector */}
      <div className="relative">
        <button
          onClick={() => setShowBlockTypeMenu(!showBlockTypeMenu)}
          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 min-w-[120px] h-[28px] text-left text-sm"
        >
          <span>{getBlockTypeLabel()}</span>
          <ChevronDown size={12} className="ml-auto opacity-70" />
        </button>
        
        {showBlockTypeMenu && (
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1 min-w-[160px] z-50">
            <button
              onClick={() => setBlockType('paragraph')}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center"
            >
              <Type size={14} className="mr-2 opacity-70" />
              Normal text
            </button>
            <button
              onClick={() => setBlockType('heading')}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center"
            >
              <Heading1 size={14} className="mr-2 opacity-70" />
              Heading 1
            </button>
            <button
              onClick={() => setBlockType('heading')}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center"
            >
              <Heading2 size={14} className="mr-2 opacity-70" />
              Heading 2
            </button>
            <button
              onClick={() => setBlockType('heading')}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center"
            >
              <Heading3 size={14} className="mr-2 opacity-70" />
              Heading 3
            </button>
            <div className="my-1 h-px bg-gray-200 dark:bg-gray-700" />
            <button
              onClick={() => setBlockType('bulletListItem')}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center"
            >
              <List size={14} className="mr-2 opacity-70" />
              Bullet list
            </button>
            <button
              onClick={() => setBlockType('numberedListItem')}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center"
            >
              <ListOrdered size={14} className="mr-2 opacity-70" />
              Numbered list
            </button>
          </div>
        )}
      </div>
      
      <ToolbarSeparator />
      
      {/* Font size */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleFontSizeChange(-2)}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Minus size={14} />
        </button>
        <span className="text-sm w-8 text-center">{fontSize}</span>
        <button
          onClick={() => handleFontSizeChange(2)}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Plus size={14} />
        </button>
      </div>
      
      <ToolbarSeparator />
      
      {/* Text formatting */}
      <ToolbarButton
        onClick={() => toggleStyle('bold')}
        icon={<Bold size={16} />}
        label="Bold (Ctrl+B)"
        active={activeStyles.bold}
      />
      <ToolbarButton
        onClick={() => toggleStyle('italic')}
        icon={<Italic size={16} />}
        label="Italic (Ctrl+I)"
        active={activeStyles.italic}
      />
      <ToolbarButton
        onClick={() => toggleStyle('underline')}
        icon={<Underline size={16} />}
        label="Underline (Ctrl+U)"
        active={activeStyles.underline}
      />
      <ToolbarButton
        onClick={() => toggleStyle('strike')}
        icon={<Strikethrough size={16} />}
        label="Strikethrough"
        active={activeStyles.strike}
      />
      <ToolbarButton
        onClick={() => toggleStyle('code')}
        icon={<Code size={16} />}
        label="Code"
        active={activeStyles.code}
      />
      
      <ToolbarSeparator />
      
      {/* Colors */}
      <div className="relative">
        <input
          type="color"
          value={textColor}
          onChange={(e) => handleTextColorChange(e.target.value)}
          className="absolute opacity-0 w-0 h-0"
          id="text-color-picker"
        />
        <label htmlFor="text-color-picker">
          <ToolbarButton
            onClick={() => document.getElementById('text-color-picker')?.click()}
            icon={
              <div className="relative">
                <Type size={16} />
                <div
                  className="absolute bottom-0 left-0 right-0 h-1"
                  style={{ backgroundColor: textColor }}
                />
              </div>
            }
            label="Text color"
          />
        </label>
      </div>
      
      <div className="relative">
        <input
          type="color"
          value={backgroundColor}
          onChange={(e) => handleBackgroundColorChange(e.target.value)}
          className="absolute opacity-0 w-0 h-0"
          id="bg-color-picker"
        />
        <label htmlFor="bg-color-picker">
          <ToolbarButton
            onClick={() => document.getElementById('bg-color-picker')?.click()}
            icon={
              <div className="relative">
                <Highlighter size={16} />
                <div
                  className="absolute bottom-0 left-0 right-0 h-1"
                  style={{ backgroundColor: backgroundColor }}
                />
              </div>
            }
            label="Background color"
          />
        </label>
      </div>
      
      <ToolbarSeparator />
      
      {/* Text alignment */}
      <ToolbarButton
        onClick={() => setAlignment('left')}
        icon={<AlignLeft size={16} />}
        label="Align left"
        active={currentAlignment === 'left'}
      />
      <ToolbarButton
        onClick={() => setAlignment('center')}
        icon={<AlignCenter size={16} />}
        label="Align center"
        active={currentAlignment === 'center'}
      />
      <ToolbarButton
        onClick={() => setAlignment('right')}
        icon={<AlignRight size={16} />}
        label="Align right"
        active={currentAlignment === 'right'}
      />
      <ToolbarButton
        onClick={() => setAlignment('justify')}
        icon={<AlignJustify size={16} />}
        label="Justify"
        active={currentAlignment === 'justify'}
      />
      
      <ToolbarSeparator />
      
      {/* Indentation */}
      <ToolbarButton
        onClick={() => handleIndent('decrease')}
        icon={<IndentDecrease size={16} />}
        label="Decrease indent (Shift+Tab)"
      />
      <ToolbarButton
        onClick={() => handleIndent('increase')}
        icon={<IndentIncrease size={16} />}
        label="Increase indent (Tab)"
      />
      
      <ToolbarSeparator />
      
      {/* Insert elements */}
      <ToolbarButton
        onClick={insertLink}
        icon={<Link size={16} />}
        label="Insert link (Ctrl+K)"
      />
      <ToolbarButton
        onClick={insertImage}
        icon={<Image size={16} />}
        label="Insert image"
      />
      <ToolbarButton
        onClick={insertTable}
        icon={<Table size={16} />}
        label="Insert table"
      />
      <ToolbarButton
        onClick={() => insertList(false)}
        icon={<List size={16} />}
        label="Bullet list"
      />
      <ToolbarButton
        onClick={() => insertList(true)}
        icon={<ListOrdered size={16} />}
        label="Numbered list"
      />
      
      {/* Modals */}
      <LinkModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        onConfirm={handleLinkConfirm}
        initialText={editor?.getSelectedText() || ''}
      />
      
      <ImageUploadModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        onConfirm={handleImageConfirm}
      />
    </div>
  );
};