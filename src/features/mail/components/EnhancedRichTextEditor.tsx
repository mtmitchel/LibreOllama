import React, { useCallback, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Typography from '@tiptap/extension-typography';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered, 
  Quote, 
  Link as LinkIcon,
  Image as ImageIcon,
  Palette,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Code,
  Undo,
  Redo,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button, Text } from '../../../components/ui';

interface EnhancedRichTextEditorProps {
  content: string;
  onUpdate: (content: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showSource?: boolean;
  onSourceToggle?: (showSource: boolean) => void;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, isActive, disabled, title, children }: ToolbarButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        h-8 w-8 p-0 rounded-md transition-all duration-200
        ${isActive 
          ? 'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)]' 
          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {children}
    </Button>
  );
}

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (url: string, text?: string) => void;
  initialUrl?: string;
  initialText?: string;
}

function LinkModal({ isOpen, onClose, onSubmit, initialUrl = '', initialText = '' }: LinkModalProps) {
  const [url, setUrl] = useState(initialUrl);
  const [text, setText] = useState(initialText);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim(), text.trim() || undefined);
      onClose();
      setUrl('');
      setText('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[var(--bg-primary)] rounded-lg p-6 w-full max-w-md shadow-xl border border-[var(--border-default)]">
        <Text size="lg" weight="semibold" className="mb-4">Add Link</Text>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Text size="sm" className="mb-2 text-[var(--text-secondary)]">URL</Text>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-[var(--border-default)] rounded-md bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
              autoFocus
            />
          </div>
          
          <div>
            <Text size="sm" className="mb-2 text-[var(--text-secondary)]">Link Text (optional)</Text>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Link description"
              className="w-full px-3 py-2 border border-[var(--border-default)] rounded-md bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
            />
          </div>
          
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!url.trim()}
            >
              Add Link
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EnhancedRichTextEditor({
  content,
  onUpdate,
  placeholder = "Write your message...",
  className = "",
  disabled = false,
  showSource = false,
  onSourceToggle
}: EnhancedRichTextEditorProps) {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          style: 'max-width: 100%; height: auto; border-radius: 6px;',
        },
      }),
      Underline,
      TextStyle,
      Typography,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
    editable: !disabled,
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none p-4 min-h-[200px] text-[var(--text-primary)] ${className}`,
        style: 'font-family: system-ui, -apple-system, sans-serif; font-size: 14px; line-height: 1.6;'
      },
    },
  });

  const addImage = useCallback(() => {
    const url = window.prompt('Enter image URL:');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const addLink = useCallback(() => {
    if (editor) {
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to);
      setShowLinkModal(true);
    }
  }, [editor]);

  const insertLink = useCallback((url: string, text?: string) => {
    if (editor) {
      const { from, to } = editor.state.selection;
      
      if (text) {
        // Insert new text with link
        editor.chain().focus().insertContentAt({ from, to }, [
          {
            type: 'text',
            text,
            marks: [{ type: 'link', attrs: { href: url } }]
          }
        ]).run();
      } else {
        // Just add link to selected text
        editor.chain().focus().setLink({ href: url }).run();
      }
    }
  }, [editor]);

  const toggleSource = useCallback(() => {
    if (onSourceToggle) {
      onSourceToggle(!showSource);
    }
  }, [showSource, onSourceToggle]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-48 bg-[var(--bg-secondary)] rounded-md">
        <Text size="sm" variant="secondary">Loading editor...</Text>
      </div>
    );
  }

  if (showSource) {
    return (
      <div className="border border-[var(--border-default)] rounded-md">
        {/* Toolbar for source view */}
        <div className="border-b border-[var(--border-default)] p-2 bg-[var(--bg-secondary)] flex items-center justify-between">
          <Text size="sm" variant="secondary">HTML Source</Text>
          <ToolbarButton
            onClick={toggleSource}
            title="Switch to visual editor"
          >
            <Eye size={16} />
          </ToolbarButton>
        </div>
        
        <textarea
          value={content}
          onChange={(e) => onUpdate(e.target.value)}
          className="w-full h-64 p-4 font-mono text-sm bg-transparent border-0 resize-none focus:outline-none text-[var(--text-primary)]"
          placeholder="HTML content..."
        />
      </div>
    );
  }

  return (
    <div className="border border-[var(--border-default)] rounded-md overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-[var(--border-default)] p-2 bg-[var(--bg-secondary)] flex items-center gap-1 flex-wrap">
        {/* Format tools */}
        <div className="flex items-center gap-1 pr-2 border-r border-[var(--border-default)]">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold"
          >
            <Bold size={16} />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic"
          >
            <Italic size={16} />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="Underline"
          >
            <UnderlineIcon size={16} />
          </ToolbarButton>
        </div>

        {/* List tools */}
        <div className="flex items-center gap-1 pr-2 border-r border-[var(--border-default)]">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List size={16} />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <ListOrdered size={16} />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Quote"
          >
            <Quote size={16} />
          </ToolbarButton>
        </div>

        {/* Insert tools */}
        <div className="flex items-center gap-1 pr-2 border-r border-[var(--border-default)]">
          <ToolbarButton
            onClick={addLink}
            isActive={editor.isActive('link')}
            title="Add Link"
          >
            <LinkIcon size={16} />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={addImage}
            title="Add Image"
          >
            <ImageIcon size={16} />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
            title="Inline Code"
          >
            <Code size={16} />
          </ToolbarButton>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-1 pr-2 border-r border-[var(--border-default)]">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            <Undo size={16} />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            <Redo size={16} />
          </ToolbarButton>
        </div>

        {/* Source toggle */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={toggleSource}
            title="View HTML source"
          >
            <EyeOff size={16} />
          </ToolbarButton>
        </div>
      </div>

      {/* Editor Content */}
      <div className="min-h-[200px] bg-[var(--bg-primary)]">
        <EditorContent 
          editor={editor} 
          className="rich-text-editor"
        />
      </div>

      {/* Link Modal */}
      <LinkModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        onSubmit={insertLink}
      />

      {/* Enhanced styling */}
      <style jsx>{`
        .rich-text-editor .ProseMirror {
          outline: none;
        }
        
        .rich-text-editor .ProseMirror p {
          margin: 8px 0;
        }
        
        .rich-text-editor .ProseMirror h1,
        .rich-text-editor .ProseMirror h2,
        .rich-text-editor .ProseMirror h3 {
          margin: 16px 0 8px 0;
          font-weight: 600;
          line-height: 1.3;
        }
        
        .rich-text-editor .ProseMirror h1 { font-size: 1.5em; }
        .rich-text-editor .ProseMirror h2 { font-size: 1.3em; }
        .rich-text-editor .ProseMirror h3 { font-size: 1.2em; }
        
        .rich-text-editor .ProseMirror ul,
        .rich-text-editor .ProseMirror ol {
          margin: 12px 0;
          padding-left: 24px;
        }
        
        .rich-text-editor .ProseMirror li {
          margin: 4px 0;
        }
        
        .rich-text-editor .ProseMirror blockquote {
          border-left: 4px solid var(--accent-primary);
          padding: 12px 16px;
          margin: 16px 0;
          background: var(--bg-secondary);
          border-radius: 0 6px 6px 0;
          font-style: italic;
        }
        
        .rich-text-editor .ProseMirror a {
          color: var(--accent-primary);
          text-decoration: underline;
          text-decoration-color: var(--accent-primary);
          text-underline-offset: 2px;
        }
        
        .rich-text-editor .ProseMirror a:hover {
          color: var(--accent-primary-hover);
          text-decoration-color: var(--accent-primary-hover);
        }
        
        .rich-text-editor .ProseMirror code {
          background: var(--bg-secondary);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
          font-size: 13px;
          border: 1px solid var(--border-default);
        }
        
        .rich-text-editor .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 6px;
          margin: 8px 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .rich-text-editor .ProseMirror .is-empty::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--text-muted);
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  );
} 