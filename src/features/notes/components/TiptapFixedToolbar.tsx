import React, { useCallback, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { Button } from '../../../components/ui';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../../../components/ui/DropdownMenu';
import {
  Bold, Italic, Underline, Strikethrough, Code, List, ListOrdered, Quote, Heading1, Heading2, Heading3, Link as LinkIcon, Table, Undo, Redo, Minus, ChevronDown, Type
} from 'lucide-react';
import { Image as ImageIcon } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { readFile } from '@tauri-apps/plugin-fs';
import { TextSelection } from 'prosemirror-state';
import { LinkDialog } from './LinkDialog';

interface TiptapFixedToolbarProps {
  editor: Editor;
  onImageUpload: (file: File) => void;
  onExport: (format: 'pdf' | 'docx' | 'txt') => void;
  selectedNote: any;
  onDeleteNote?: () => void;
}

export const TiptapFixedToolbar: React.FC<TiptapFixedToolbarProps> = ({ 
  editor,
  onImageUpload,
  onExport,
  selectedNote,
  onDeleteNote 
}) => {
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [currentLinkUrl, setCurrentLinkUrl] = useState('');

  const isActive = (name: string, attributes?: {}) => editor.isActive(name, attributes) ? 'primary' : 'ghost';

  const getCurrentHeadingLevel = () => {
    if (editor.isActive('heading', { level: 1 })) return 1;
    if (editor.isActive('heading', { level: 2 })) return 2;
    if (editor.isActive('heading', { level: 3 })) return 3;
    return 0; // Normal text
  };

  const getHeadingDisplay = () => {
    const level = getCurrentHeadingLevel();
    switch (level) {
      case 1: return { icon: Heading1, label: 'Heading 1' };
      case 2: return { icon: Heading2, label: 'Heading 2' };
      case 3: return { icon: Heading3, label: 'Heading 3' };
      default: return { icon: Type, label: 'Normal Text' };
    }
  };

  const handleHeadingChange = (level: number) => {
    if (level === 0) {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run();
    }
  };

  const handleImageUpload = useCallback(async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif'] }],
    });

    if (selected) {
      // selected is a File object: { path: string, name?: string } or string in older tauri versions
      const filePath = typeof selected === 'string' ? selected : selected.path;
      const contents = await readFile(filePath);
      const base64 = btoa(new Uint8Array(contents).reduce((data, byte) => data + String.fromCharCode(byte), ''));
      const dataUrl = `data:image/png;base64,${base64}`;
      editor.chain().focus().setImage({ src: dataUrl }).run();
    }
  }, [editor]);

  const handleLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    setCurrentLinkUrl(previousUrl || '');
    setIsLinkDialogOpen(true);
  }, [editor]);

  const handleLinkSave = useCallback((url: string) => {
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    let finalUrl = url;
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: finalUrl }).run();
  }, [editor]);

  return (
    <>
      <div className="flex items-center gap-[var(--space-1)] p-[var(--space-2)] bg-[var(--bg-secondary)] border-b border-[var(--border-default)] flex-wrap">
        {/* History Group */}
        <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo size={18} />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo size={18} />
        </Button>

        <div className="w-px h-6 bg-[var(--border-default)] mx-[var(--space-1)]" />

        {/* Formatting Group */}
        <Button variant={isActive('bold')} size="icon" onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={18} />
        </Button>
        <Button variant={isActive('italic')} size="icon" onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={18} />
        </Button>
        <Button variant={isActive('underline')} size="icon" onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <Underline size={18} />
        </Button>
        <Button variant={isActive('strike')} size="icon" onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough size={18} />
        </Button>
        
        <div className="w-px h-6 bg-[var(--border-default)] mx-[var(--space-1)]" />

        {/* Headings Group */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant={getCurrentHeadingLevel() > 0 ? 'primary' : 'ghost'} 
              size="icon" 
              title={getHeadingDisplay().label}
              className="relative"
            >
              {(() => {
                const IconComponent = getHeadingDisplay().icon;
                return <IconComponent size={18} />;
              })()}
              <ChevronDown size={10} className="absolute bottom-0 right-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={() => handleHeadingChange(0)}>
              <Type size={16} className="mr-[var(--space-2)]" />
              Normal Text
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleHeadingChange(1)}>
              <Heading1 size={16} className="mr-[var(--space-2)]" />
              Heading 1
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleHeadingChange(2)}>
              <Heading2 size={16} className="mr-[var(--space-2)]" />
              Heading 2
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleHeadingChange(3)}>
              <Heading3 size={16} className="mr-[var(--space-2)]" />
              Heading 3
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-6 bg-[var(--border-default)] mx-[var(--space-1)]" />

        {/* Block Elements Group */}
        <Button variant={isActive('bulletList')} size="icon" onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={18} />
        </Button>
        <Button variant={isActive('orderedList')} size="icon" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={18} />
        </Button>
        <Button variant={isActive('blockquote')} size="icon" onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote size={18} />
        </Button>
        
        <div className="w-px h-6 bg-[var(--border-default)] mx-[var(--space-1)]" />

        {/* Insertables Group */}
        <Button size="icon" onClick={handleLink} variant={isActive('link')}>
          <LinkIcon size={18} />
        </Button>
        <Button size="icon" onClick={handleImageUpload} variant="ghost">
          <ImageIcon size={18} />
        </Button>
        <Button
          size="icon"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          variant="ghost"
          title="Insert divider line"
        >
          <Minus size={18} />
        </Button>
        <Button
          size="icon"
          onClick={() => {
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run();
          }}
          variant="ghost"
        >
          <Table size={18} />
        </Button>
        <Button variant={isActive('code')} size="icon" onClick={() => editor.chain().focus().toggleCode().run()}>
          <Code size={18} />
        </Button>
      </div>

      <LinkDialog
        isOpen={isLinkDialogOpen}
        onClose={() => setIsLinkDialogOpen(false)}
        onSave={handleLinkSave}
        initialUrl={currentLinkUrl}
      />
    </>
  );
}; 