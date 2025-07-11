import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import ImageResize from 'tiptap-extension-resize-image';
import { Image as ImageIcon } from 'lucide-react';
import { TiptapFixedToolbar } from './TiptapFixedToolbar';
import { createSlashCommandExtension } from './TiptapSlashExtension';

interface TiptapEditorProps {
  value?: string;
  initialValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  selectedNote?: any;
  onDeleteNote?: () => void;
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
  className = '',
  selectedNote,
  onDeleteNote
}) => {
  const [editorContent, setEditorContent] = useState<string>(
    value || initialValue || DEFAULT_CONTENT
  );
  const [isDragOver, setIsDragOver] = useState(false);

  // Image upload function
  const handleImageUpload = (file: File) => {
    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (src && editor) {
        editor.chain().focus().setImage({ src }).run();
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set isDragOver to false if we're leaving the main container
    if (e.currentTarget === e.target) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length > 0) {
      imageFiles.forEach(file => handleImageUpload(file));
    }
  };

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
      Image.configure({
        HTMLAttributes: {
          class: 'tiptap-image',
        },
        inline: false,
        allowBase64: true,
        addAttributes() {
          return {
            ...this.parent?.(),
            width: {
              default: null,
              parseHTML: element => element.getAttribute('width'),
              renderHTML: attributes => {
                if (!attributes.width) return {};
                return { width: attributes.width };
              },
            },
            style: {
              default: null,
              parseHTML: element => element.getAttribute('style'),
              renderHTML: attributes => {
                if (!attributes.style) return {};
                return { style: attributes.style };
              },
            },
          };
        },
      }),
      ImageResize,
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
      console.log('Updating editor content from:', editorContent, 'to:', value);
      editor.commands.setContent(value);
      setEditorContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return <div className="p-6 text-gray-500">Loading editor...</div>;
  }

  return (
    <div
      className={`h-full flex flex-col ${className}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Fixed Toolbar */}
      <TiptapFixedToolbar editor={editor} selectedNote={selectedNote} onDeleteNote={onDeleteNote} />
      
      {/* Editor Container */}
      <div className="flex-1 overflow-auto relative">
        <div className="px-8 py-6 h-full min-h-[500px] prose prose-lg max-w-none">
          <EditorContent 
            editor={editor}
            className="h-full focus:outline-none"
          />
          
          {/* Drag and Drop Overlay */}
          {isDragOver && (
            <div className="absolute inset-0 bg-blue-50 bg-opacity-90 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center z-10">
              <div className="text-center">
                <ImageIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <p className="text-lg font-medium text-blue-700">Drop images here to upload</p>
                <p className="text-sm text-blue-600">Supports JPG, PNG, GIF, WebP (max 10MB)</p>
              </div>
            </div>
          )}
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
        
        .tiptap-bullet-list {
          list-style-type: disc;
        }
        
        .tiptap-ordered-list {
          list-style-type: decimal;
        }
        
        .tiptap-list-item {
          margin: 0.375rem 0;
          display: list-item;
        }
        
        /* Ensure lists show markers inside prose */
        .prose .tiptap-bullet-list {
          list-style-type: disc;
          list-style-position: outside;
        }
        
        .prose .tiptap-ordered-list {
          list-style-type: decimal;
          list-style-position: outside;
        }
        
        .prose .tiptap-list-item {
          display: list-item;
          margin-top: 0.375rem;
          margin-bottom: 0.375rem;
        }
        
        /* Override any prose reset */
        .prose ul[class*='tiptap-bullet-list'] {
          list-style-type: disc !important;
        }
        
        .prose ol[class*='tiptap-ordered-list'] {
          list-style-type: decimal !important;
        }
        
        .prose li[class*='tiptap-list-item'] {
          display: list-item !important;
        }
        
        .tiptap-image {
          height: auto;
          border-radius: 0.5rem;
          margin: 1.5rem auto;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          display: block;
        }
        
        .tiptap-image:hover {
          transform: scale(1.01);
          box-shadow: 0 8px 12px -2px rgba(0, 0, 0, 0.15), 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .tiptap-image.ProseMirror-selectednode {
          outline: 3px solid #3b82f6;
          outline-offset: 2px;
          box-shadow: 0 8px 12px -2px rgba(59, 130, 246, 0.25), 0 4px 6px -1px rgba(59, 130, 246, 0.1);
        }
        
        /* Image size classes */
        .tiptap-image-small {
          width: 25%;
          max-width: 200px;
        }
        
        .tiptap-image-medium {
          width: 50%;
          max-width: 400px;
        }
        
        .tiptap-image-large {
          width: 75%;
          max-width: 600px;
        }
        
        .tiptap-image-full {
          width: 100%;
        }
        
        /* Resize handles for selected images */
        .tiptap-image.ProseMirror-selectednode {
          position: relative;
        }
        
        .tiptap-image.ProseMirror-selectednode::after {
          content: '';
          position: absolute;
          bottom: -4px;
          right: -4px;
          width: 12px;
          height: 12px;
          background: #3b82f6;
          border: 2px solid white;
          border-radius: 50%;
          cursor: nw-resize;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        /* Image upload area styling */
        .image-upload-area {
          border: 2px dashed #cbd5e1;
          border-radius: 0.5rem;
          padding: 2rem;
          text-align: center;
          margin: 1rem 0;
          transition: border-color 0.2s ease;
          cursor: pointer;
        }
        
        .image-upload-area:hover {
          border-color: #3b82f6;
          background-color: #f8fafc;
        }
        
        .image-upload-area.dragover {
          border-color: #3b82f6;
          background-color: #dbeafe;
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