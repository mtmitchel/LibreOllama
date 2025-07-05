import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import Placeholder from '@tiptap/extension-placeholder';
import { TiptapFixedToolbar } from './TiptapFixedToolbar';
import { createSlashCommandExtension } from './TiptapSlashExtension';

interface TiptapEditorProps {
  value?: string;
  initialValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}

// Default content with examples
const DEFAULT_CONTENT = `
<h1>Welcome to your Notes</h1>
<p>Start writing your thoughts, ideas, and notes here. This editor supports rich text formatting with both toolbar controls and markdown shortcuts.</p>

<h2>Quick Tips</h2>
<ul>
  <li><strong>Use the toolbar above</strong> for quick formatting</li>
  <li><strong>Type / for commands</strong> - insert headings, lists, and more</li>
  <li><strong>Markdown shortcuts</strong> - type <code>**bold**</code>, <code>*italic*</code>, <code># heading</code></li>
  <li><strong>Keyboard shortcuts</strong> - Ctrl+B for bold, Ctrl+I for italic</li>
</ul>

<blockquote>
  <p>💡 Pro tip: You can combine toolbar controls with markdown shortcuts for faster editing!</p>
</blockquote>

<p>Ready to start writing? Replace this content with your own notes...</p>
`;

export const TiptapEditor: React.FC<TiptapEditorProps> = ({
  value,
  initialValue,
  onChange,
  placeholder = 'Start writing...',
  readOnly = false,
  className = ''
}) => {
  const [editorContent, setEditorContent] = useState<string>(
    value || initialValue || DEFAULT_CONTENT
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Configure built-in extensions
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
          HTMLAttributes: {
            class: 'tiptap-heading',
          },
        },
        paragraph: {
          HTMLAttributes: {
            class: 'tiptap-paragraph',
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: 'tiptap-blockquote',
          },
        },
        codeBlock: {
          HTMLAttributes: {
            class: 'tiptap-code-block',
          },
        },
        horizontalRule: {
          HTMLAttributes: {
            class: 'tiptap-hr',
          },
        },
        bulletList: {
          HTMLAttributes: {
            class: 'tiptap-bullet-list',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'tiptap-ordered-list',
          },
        },
        listItem: {
          HTMLAttributes: {
            class: 'tiptap-list-item',
          },
        },
        bold: {
          HTMLAttributes: {
            class: 'tiptap-bold',
          },
        },
        italic: {
          HTMLAttributes: {
            class: 'tiptap-italic',
          },
        },
        code: {
          HTMLAttributes: {
            class: 'tiptap-code',
          },
        },
        strike: {
          HTMLAttributes: {
            class: 'tiptap-strike',
          },
        },
      }),
      Underline.configure({
        HTMLAttributes: {
          class: 'tiptap-underline',
        },
      }),
      TextStyle,
      Color,
      Highlight.configure({
        HTMLAttributes: {
          class: 'tiptap-highlight',
        },
      }),
      Typography,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'tiptap-empty',
      }),
      createSlashCommandExtension(),
    ],
    content: editorContent,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setEditorContent(html);
      onChange?.(html);
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor-content prose prose-sm max-w-none focus:outline-none',
      },
    },
  });

  // Update editor content when value prop changes
  useEffect(() => {
    if (value !== undefined && value !== editorContent && editor) {
      editor.commands.setContent(value);
      setEditorContent(value);
    }
  }, [value, editor, editorContent]);

  if (!editor) {
    return <div className="p-6 text-gray-500">Loading editor...</div>;
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Fixed Toolbar */}
      <TiptapFixedToolbar editor={editor} />
      
      {/* Editor Container */}
      <div className="flex-1 overflow-auto relative">
        <div className="px-8 py-6 h-full min-h-[500px] prose prose-lg max-w-none">
          <EditorContent 
            editor={editor}
            className="h-full focus:outline-none"
          />
        </div>
      </div>
      
      {/* Custom Styles */}
      <style>{`
        .tiptap-editor-content {
          font-size: 16px;
          line-height: 1.75;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
          color: #1f2937;
        }
        
        .tiptap-heading {
          font-weight: 600;
          margin: 2em 0 0.75em 0;
          line-height: 1.3;
        }
        
        .tiptap-heading:first-child {
          margin-top: 0;
        }
        
        .tiptap-editor-content h1 {
          font-size: 2.25em;
          color: #111827;
          font-weight: 700;
        }
        
        .tiptap-editor-content h2 {
          font-size: 1.75em;
          color: #1f2937;
          font-weight: 600;
        }
        
        .tiptap-editor-content h3 {
          font-size: 1.375em;
          color: #374151;
          font-weight: 600;
        }
        
        .tiptap-paragraph {
          margin: 1.25em 0;
        }
        
        .tiptap-paragraph:first-child {
          margin-top: 0;
        }
        
        .tiptap-paragraph:last-child {
          margin-bottom: 0;
        }
        
        .tiptap-blockquote {
          border-left: 4px solid #3b82f6;
          background-color: #f8fafc;
          padding: 1rem 1.5rem;
          margin: 2rem 0;
          border-radius: 0 0.5rem 0.5rem 0;
          font-style: normal;
          color: #475569;
        }
        
        .tiptap-code-block {
          background-color: #1e293b;
          color: #e2e8f0;
          border-radius: 0.5rem;
          padding: 1.25rem;
          overflow-x: auto;
          margin: 2rem 0;
          font-family: 'JetBrains Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 14px;
          line-height: 1.5;
        }
        
        .tiptap-hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 3rem 0;
        }
        
        .tiptap-bullet-list, .tiptap-ordered-list {
          margin: 1.5rem 0;
          padding-left: 1.5rem;
        }
        
        .tiptap-list-item {
          margin: 0.375rem 0;
        }
        
        .tiptap-bold {
          font-weight: 700;
        }
        
        .tiptap-italic {
          font-style: italic;
        }
        
        .tiptap-underline {
          text-decoration: underline;
          text-decoration-thickness: 2px;
          text-underline-offset: 2px;
        }
        
        .tiptap-strike {
          text-decoration: line-through;
          text-decoration-thickness: 2px;
        }
        
        .tiptap-code {
          background-color: #f1f5f9;
          color: #e11d48;
          padding: 0.25rem 0.375rem;
          border-radius: 0.375rem;
          font-family: 'JetBrains Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.875em;
          font-weight: 500;
        }
        
        .tiptap-highlight {
          background-color: #fef08a;
          color: #854d0e;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
        }
        
        .tiptap-empty::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
        
        /* Focus state for better accessibility */
        .ProseMirror:focus {
          outline: none;
        }
        
        /* Tippy.js theme for slash commands */
        .tippy-box[data-theme~='slash-command'] {
          background-color: transparent;
          border: none;
          padding: 0;
          box-shadow: none;
        }
        
        .tippy-box[data-theme~='slash-command'] .tippy-content {
          padding: 0;
        }
      `}</style>
    </div>
  );
};

export default TiptapEditor; 