import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { createEditor, Descendant, Editor, Text, Transforms, Element as SlateElement } from 'slate';
import { Slate, Editable, withReact, ReactEditor } from 'slate-react';
import { withHistory } from 'slate-history';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Type,
  Palette
} from 'lucide-react';
import { cn } from '../../lib/utils';

export type CustomText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
};

export type ParagraphElement = {
  type: 'paragraph';
  align?: 'left' | 'center' | 'right' | 'justify';
  children: CustomText[];
};

export type HeadingElement = {
  type: 'heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: CustomText[];
};

export type CustomElement = ParagraphElement | HeadingElement;

declare module 'slate' {
  interface CustomTypes {
    Editor: ReactEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

interface RichTextEditorProps {
  value: Descendant[];
  onChange: (value: Descendant[]) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  readOnly?: boolean;
  fontSize?: number;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder = 'Type here...',
  autoFocus = false,
  readOnly = false,
  fontSize = 16,
  fontFamily = 'Inter',
  textAlign = 'left',
  color = '#000000',
  className,
  style
}) => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Initialize editor with default value
  useEffect(() => {
    if (value.length === 0) {
      const defaultValue: Descendant[] = [
        {
          type: 'paragraph',
          children: [{ text: '' }]
        }
      ];
      onChange(defaultValue);
    }
  }, [value, onChange]);

  // Custom rendering functions
  const renderElement = useCallback((props: any) => {
    const { attributes, children, element } = props;
    
    switch (element.type) {
      case 'heading':
        const HeadingTag = `h${element.level}` as keyof JSX.IntrinsicElements;
        return (
          <HeadingTag 
            {...attributes} 
            style={{ 
              textAlign: element.align || textAlign,
              margin: 0,
              fontSize: `${fontSize * (2 - element.level * 0.2)}px`,
              fontFamily,
              color,
              lineHeight: 1.2
            }}
          >
            {children}
          </HeadingTag>
        );
      default:
        return (
          <p 
            {...attributes} 
            style={{ 
              textAlign: element.align || textAlign,
              margin: 0,
              fontSize: `${fontSize}px`,
              fontFamily,
              color,
              lineHeight: 1.4
            }}
          >
            {children}
          </p>
        );
    }
  }, [textAlign, fontSize, fontFamily, color]);

  const renderLeaf = useCallback((props: any) => {
    const { attributes, children, leaf } = props;
    
    let style: React.CSSProperties = {};
    
    if (leaf.bold) style.fontWeight = 'bold';
    if (leaf.italic) style.fontStyle = 'italic';
    if (leaf.underline) style.textDecoration = 'underline';
    if (leaf.color) style.color = leaf.color;
    if (leaf.fontSize) style.fontSize = `${leaf.fontSize}px`;
    if (leaf.fontFamily) style.fontFamily = leaf.fontFamily;

    return (
      <span {...attributes} style={style}>
        {children}
      </span>
    );
  }, []);

  // Handle selection change to show/hide toolbar
  const handleSelectionChange = useCallback(() => {
    const { selection } = editor;
    
    if (selection && !readOnly && isFocused) {
      const isCollapsed = selection && 'anchor' in selection && 'focus' in selection ? 
        selection.anchor.offset === selection.focus.offset && 
        selection.anchor.path[0] === selection.focus.path[0] : true;
      
      if (!isCollapsed) {
        // Show formatting toolbar for text selection
        const domSelection = window.getSelection();
        if (domSelection && domSelection.rangeCount > 0) {
          const range = domSelection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          
          setToolbarPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 10
          });
          setShowToolbar(true);
        }
      } else {
        setShowToolbar(false);
      }
    } else {
      setShowToolbar(false);
    }
  }, [editor, readOnly, isFocused]);

  useEffect(() => {
    handleSelectionChange();
  }, [handleSelectionChange]);

  // Formatting functions
  const toggleFormat = useCallback((format: string) => {
    const isActive = isFormatActive(editor, format);
    
    if (isActive) {
      Editor.removeMark(editor, format);
    } else {
      Editor.addMark(editor, format, true);
    }
  }, [editor]);

  const toggleAlign = useCallback((align: 'left' | 'center' | 'right' | 'justify') => {
    Transforms.setNodes(
      editor,
      { align },
      { match: n => SlateElement.isElement(n) }
    );
  }, [editor]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!event.ctrlKey && !event.metaKey) return;

    switch (event.key) {
      case 'b':
        event.preventDefault();
        toggleFormat('bold');
        break;
      case 'i':
        event.preventDefault();
        toggleFormat('italic');
        break;
      case 'u':
        event.preventDefault();
        toggleFormat('underline');
        break;
    }
  }, [toggleFormat]);

  return (
    <div 
      ref={editorRef}
      className={cn("relative", className)}
      style={style}
    >
      <Slate 
        editor={editor} 
        initialValue={value.length > 0 ? value : [{ type: 'paragraph', children: [{ text: '' }] }]}
        onValueChange={onChange}
      >
        <Editable
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          placeholder={placeholder}
          autoFocus={autoFocus}
          readOnly={readOnly}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsFocused(true);
            onFocus?.();
          }}
          onBlur={() => {
            setIsFocused(false);
            setShowToolbar(false);
            onBlur?.();
          }}
          onSelect={handleSelectionChange}
          style={{
            outline: 'none',
            minHeight: '1.5em',
            width: '100%',
            background: 'transparent',
            border: 'none',
            resize: 'none',
            overflow: 'visible'
          }}
        />
        
        {/* Floating formatting toolbar */}
        {showToolbar && createPortal(
          <FormattingToolbar
            editor={editor}
            position={toolbarPosition}
            onToggleFormat={toggleFormat}
            onToggleAlign={toggleAlign}
          />,
          document.body
        )}
      </Slate>
    </div>
  );
};

// Helper functions
const isFormatActive = (editor: Editor, format: string) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format as keyof typeof marks] === true : false;
};

const isAlignActive = (editor: Editor, align: string) => {
  const [match] = Editor.nodes(editor, {
    match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as any).align === align,
  });
  return !!match;
};

// Floating formatting toolbar component
interface FormattingToolbarProps {
  editor: Editor;
  position: { x: number; y: number };
  onToggleFormat: (format: string) => void;
  onToggleAlign: (align: 'left' | 'center' | 'right' | 'justify') => void;
}

const FormattingToolbar: React.FC<FormattingToolbarProps> = ({
  editor,
  position,
  onToggleFormat,
  onToggleAlign
}) => {
  return (
    <div
      className="fixed z-50 bg-gray-900 text-white rounded-md shadow-lg p-1 flex items-center space-x-1 animate-in fade-in duration-200"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)'
      }}
    >
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "text-white hover:bg-gray-700",
          isFormatActive(editor, 'bold') && "bg-gray-700"
        )}
        onClick={() => onToggleFormat('bold')}
      >
        <Bold className="h-3 w-3" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "text-white hover:bg-gray-700",
          isFormatActive(editor, 'italic') && "bg-gray-700"
        )}
        onClick={() => onToggleFormat('italic')}
      >
        <Italic className="h-3 w-3" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "text-white hover:bg-gray-700",
          isFormatActive(editor, 'underline') && "bg-gray-700"
        )}
        onClick={() => onToggleFormat('underline')}
      >
        <Underline className="h-3 w-3" />
      </Button>
      
      <Separator orientation="vertical" className="h-4 bg-gray-600" />
      
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "text-white hover:bg-gray-700",
          isAlignActive(editor, 'left') && "bg-gray-700"
        )}
        onClick={() => onToggleAlign('left')}
      >
        <AlignLeft className="h-3 w-3" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "text-white hover:bg-gray-700",
          isAlignActive(editor, 'center') && "bg-gray-700"
        )}
        onClick={() => onToggleAlign('center')}
      >
        <AlignCenter className="h-3 w-3" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "text-white hover:bg-gray-700",
          isAlignActive(editor, 'right') && "bg-gray-700"
        )}
        onClick={() => onToggleAlign('right')}
      >
        <AlignRight className="h-3 w-3" />
      </Button>
    </div>
  );
};

// Simple text editor for basic use cases
export const SimpleTextEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  autoFocus?: boolean;
  onBlur?: () => void;
  onFocus?: () => void;
}> = ({
  value,
  onChange,
  placeholder,
  className,
  style,
  autoFocus,
  onBlur,
  onFocus
}) => {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full bg-transparent border-none outline-none resize-none",
        className
      )}
      style={{
        ...style,
        fontFamily: 'inherit',
        fontSize: 'inherit',
        color: 'inherit',
        lineHeight: 'inherit'
      }}
      autoFocus={autoFocus}
      onBlur={onBlur}
      onFocus={onFocus}
    />
  );
};

export default RichTextEditor;