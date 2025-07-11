import React from 'react';
import type { Editor } from '@tiptap/react';
import { Button } from '../../../components/ui';
import {
  Bold, Italic, Underline, Strikethrough, Code, List, ListOrdered, Quote, Heading1, Heading2, Heading3, Link, Image
} from 'lucide-react';

interface TiptapFixedToolbarProps {
  editor: Editor;
}

export const TiptapFixedToolbar: React.FC<TiptapFixedToolbarProps> = ({ editor }) => {
  const isActive = (name: string) => editor.isActive(name) ? 'primary' : 'ghost';

  return (
    <div className="flex items-center gap-1 p-2 bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
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
      <Button variant={isActive('code')} size="icon" onClick={() => editor.chain().focus().toggleCode().run()}>
        <Code size={18} />
      </Button>
      <Button variant={isActive({ level: 1 })} size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
        <Heading1 size={18} />
      </Button>
      <Button variant={isActive({ level: 2 })} size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 size={18} />
      </Button>
      <Button variant={isActive({ level: 3 })} size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        <Heading3 size={18} />
      </Button>
      <Button variant={isActive('bulletList')} size="icon" onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List size={18} />
      </Button>
      <Button variant={isActive('orderedList')} size="icon" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered size={18} />
      </Button>
      <Button variant={isActive('blockquote')} size="icon" onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote size={18} />
      </Button>
    </div>
  );
}; 