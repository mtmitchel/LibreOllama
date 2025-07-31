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
        size-8 rounded-md p-0 transition-all duration-200
        ${isActive 
          ? 'hover:bg-accent-primary-hover bg-accent-primary text-white' 
          : 'text-secondary hover:bg-tertiary hover:text-primary'
        }
        ${disabled ? 'cursor-not-allowed opacity-50' : ''}
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
    <div className="bg-bg-overlay fixed inset-0 z-50 flex items-center justify-center">
                  <div className="border-border-default w-full max-w-md rounded-lg border bg-content p-6 shadow-xl">
        <Text size="lg" weight="semibold" className="mb-4">Add link</Text>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Text size="sm" className="mb-2 text-secondary">URL</Text>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="border-border-default focus:ring-accent-primary w-full rounded-md border bg-transparent px-3 py-2 text-primary placeholder:text-muted focus:border-accent-primary focus:outline-none focus:ring-1"
              autoFocus
            />
          </div>
          
          <div>
            <Text size="sm" className="mb-2 text-secondary">Link Text (optional)</Text>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Link description"
              className="border-border-default focus:ring-accent-primary w-full rounded-md border bg-transparent px-3 py-2 text-primary placeholder:text-muted focus:border-accent-primary focus:outline-none focus:ring-1"
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
              Add link
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
          style: 'max-width: 100%; height: auto; border-radius: var(--radius-md);',
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
          class: `prose prose-sm max-w-none focus:outline-none p-4 min-h-[200px] text-text-primary font-sans text-sm leading-relaxed ${className}`,
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
      <div className="flex h-48 items-center justify-center rounded-md bg-secondary">
        <Text size="sm" variant="secondary">Loading editor...</Text>
      </div>
    );
  }

  if (showSource) {
    return (
      <div className="border-border-default rounded-md border">
        {/* Toolbar for source view */}
        <div className="border-border-default flex items-center justify-between border-b bg-secondary p-2">
          <Text size="sm" variant="secondary">HTML source</Text>
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
          className="h-64 w-full resize-none border-0 bg-transparent p-4 font-mono text-sm text-primary focus:outline-none"
          placeholder="HTML content..."
        />
      </div>
    );
  }

  return (
    <div className="border-border-default overflow-hidden rounded-md border">
      {/* Toolbar */}
      <div className="border-border-default flex flex-wrap items-center gap-1 border-b bg-secondary p-2">
        {/* Format tools */}
        <div className="border-border-default flex items-center gap-1 border-r pr-2">
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
        <div className="border-border-default flex items-center gap-1 border-r pr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet list"
          >
            <List size={16} />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered list"
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
        <div className="border-border-default flex items-center gap-1 border-r pr-2">
          <ToolbarButton
            onClick={addLink}
            isActive={editor.isActive('link')}
            title="Add link"
          >
            <LinkIcon size={16} />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={addImage}
            title="Add image"
          >
            <ImageIcon size={16} />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
            title="Inline code"
          >
            <Code size={16} />
          </ToolbarButton>
        </div>

        {/* Undo/Redo */}
        <div className="border-border-default flex items-center gap-1 border-r pr-2">
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
                      <div className="min-h-[200px] bg-content">
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
      <style>{`
        .rich-text-editor .ProseMirror {
          outline: none;
          padding: 0;
          min-height: 200px;
        }
        
        .rich-text-editor .ProseMirror p {
          margin-bottom: 0.5em;
        }
        
        .rich-text-editor .ProseMirror p.is-editor-empty:first-child::before {
          color: #adb5bd;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
