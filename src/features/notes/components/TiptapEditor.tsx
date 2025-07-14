import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import Placeholder from '@tiptap/extension-placeholder';
import ImageResize from 'tiptap-extension-resize-image';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import { TiptapFixedToolbar } from './TiptapFixedToolbar';
import { SlashCommandExtension, SlashCommandSuggestion } from './TiptapSlashExtension';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile, writeFile } from '@tauri-apps/plugin-fs';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import HTMLtoDOCX from 'html-to-docx';
import { TiptapContextMenu } from './TiptapContextMenu';
import { open as openExternal } from '@tauri-apps/plugin-shell';

interface TiptapEditorProps {
  content: string;
  onChange?: (newContent: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
  selectedNote?: any;
  onDeleteNote?: () => void;
  titleInputRef?: React.RefObject<HTMLInputElement>;
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({
  content,
  onChange,
  readOnly,
  placeholder = '',
  className = '',
  selectedNote,
  onDeleteNote,
  titleInputRef,
}) => {
  const [editorContent, setEditorContent] = useState(content);
  const [isDragOver, setIsDragOver] = useState(false);
  const debounceTimeoutRef = useRef<number | null>(null);

  const defaultContent = '<p></p>';

  // Debounced onChange function to prevent excessive saves
  const debouncedOnChange = useCallback((newContent: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      onChange?.(newContent);
    }, 500); // Wait 500ms after user stops typing
  }, [onChange]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        bold: {},
        italic: {},
        code: {},
        bulletList: {},
        orderedList: {},
        blockquote: {},
        horizontalRule: false, // Disable the default one to use our custom import
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Typography,
      Placeholder.configure({ placeholder }),
      ImageResize.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'mx-auto',
        },
      }),
      Link.configure({ 
        openOnClick: false, // We'll handle click manually
        autolink: true,
        HTMLAttributes: {
          class: 'tiptap-link',
          rel: 'noopener noreferrer',
        },
      }),
      Table.configure({
        resizable: true,
        handleWidth: 5,
        cellMinWidth: 50,
        lastColumnResizable: true,
      }),
      TableRow,
      TableHeader.configure({ HTMLAttributes: { class: 'tiptap-table-header' } }),
      TableCell.configure({ HTMLAttributes: { class: 'tiptap-table-cell' } }),
      HorizontalRule,
      SlashCommandExtension.configure({
        suggestion: SlashCommandSuggestion,
      }),
    ],
    content: editorContent || defaultContent,
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      setEditorContent(newContent);
      debouncedOnChange(newContent);
    },
    editable: !readOnly,
  });

  const handleImageUpload = useCallback(
    (file: File) => {
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size must be less than 10MB');
        return;
      }
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
    },
    [editor]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith('image/')
    );
    if (files.length > 0) files.forEach((file) => handleImageUpload(file));
  };

  const exportAs = useCallback(
    async (format: 'pdf' | 'docx' | 'txt') => {
      if (!editor) return;
      const title = editor.state.doc.firstChild?.textContent || 'Untitled Note';
      const suggestedFilename = `${title.replace(/ /g, '_')}.${format}`;
      const filePath = await save({
        defaultPath: suggestedFilename,
        filters: [{ name: format.toUpperCase(), extensions: [format] }],
      });
      if (!filePath) return;

      if (format === 'txt') {
        await writeTextFile(filePath, editor.getText());
      } else if (format === 'docx') {
        const blob = await HTMLtoDOCX(editor.getHTML());
        const buffer = await blob.arrayBuffer();
        await writeFile(filePath, new Uint8Array(buffer));
      } else if (format === 'pdf') {
        const contentElement = document.querySelector('.tiptap-editor-content');
        if (contentElement) {
          const canvas = await html2canvas(contentElement as HTMLElement);
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const ratio = canvas.width / canvas.height;
          const width = pdfWidth;
          const height = width / ratio;
          pdf.addImage(imgData, 'PNG', 0, 0, width, height > pdfHeight ? pdfHeight : height);
          const pdfBuffer = pdf.output('arraybuffer');
          await writeFile(filePath, new Uint8Array(pdfBuffer));
        }
      }
    },
    [editor]
  );

  useEffect(() => {
    if (editor && content !== editorContent) {
      editor.commands.setContent(content || defaultContent);
      setEditorContent(content || defaultContent);
    }
  }, [content, editor]);

  useEffect(() => {
    if (!editor) return;
    const handleFocus = () => {
      if (titleInputRef?.current) {
        titleInputRef.current.blur();
      }
    };
    editor.on('focus', handleFocus);
    return () => {
      editor.off('focus', handleFocus);
    };
  }, [editor, titleInputRef]);

  if (!editor) {
    return (
      <div className={`tiptap-editor-container tiptap-loading ${className}`}>
        <p>Loading editor...</p>
      </div>
    );
  }

  return (
    <div
      className={`tiptap-editor-container flex h-full flex-col overflow-hidden rounded-lg ${
        isDragOver ? 'drag-over' : ''
      } ${className}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <TiptapFixedToolbar
        editor={editor}
        onImageUpload={handleImageUpload}
        onExport={exportAs}
        selectedNote={selectedNote}
        onDeleteNote={onDeleteNote}
      />
      <TiptapContextMenu editor={editor} className="relative flex-1">
        <div className="absolute inset-0 max-h-full overflow-auto rounded-b-lg border border-transparent bg-notes p-4 px-6 pb-40">
          <div
            className="tiptap-editor-content-container w-full break-words leading-relaxed"
            style={{
              contain: 'layout style',
              transition: 'none !important'
            }}
          >
            <EditorContent editor={editor} className="tiptap-editor-content size-full" />
          </div>
        </div>
      </TiptapContextMenu>
    </div>
  );
};

export default TiptapEditor;