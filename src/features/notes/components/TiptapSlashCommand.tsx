import React, { 
  useState, 
  useEffect, 
  forwardRef, 
  useImperativeHandle 
} from 'react';
import type { Editor } from '@tiptap/react';
import { 
  Type,
  Heading1, 
  Heading2, 
  Heading3,
  Quote,
  List,
  ListOrdered,
  Code2,
  Minus,
  Image,
  Table
} from 'lucide-react';

interface SlashCommandItem {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  command: (editor: Editor) => void;
  keywords: string[];
}

interface TiptapSlashCommandProps {
  editor: Editor;
  range: any;
  query: string;
  onSelect: (item: SlashCommandItem) => void;
}

interface SlashCommandRef {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

export const TiptapSlashCommand = forwardRef<SlashCommandRef, TiptapSlashCommandProps>(
  ({ range, query, onSelect }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const items: SlashCommandItem[] = [
      {
        title: 'Text',
        description: 'Start writing with plain text',
        icon: Type,
        keywords: ['text', 'paragraph', 'p'],
        command: (editor) => {
          editor.chain().focus().deleteRange(range).setParagraph().run();
        },
      },
      {
        title: 'Heading 1',
        description: 'Big section heading',
        icon: Heading1,
        keywords: ['heading', 'h1', 'title'],
        command: (editor) => {
          editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
        },
      },
      {
        title: 'Heading 2',
        description: 'Medium section heading',
        icon: Heading2,
        keywords: ['heading', 'h2', 'subtitle'],
        command: (editor) => {
          editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
        },
      },
      {
        title: 'Heading 3',
        description: 'Small section heading',
        icon: Heading3,
        keywords: ['heading', 'h3', 'subheading'],
        command: (editor) => {
          editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
        },
      },
      {
        title: 'Bullet list',
        description: 'Create a simple bullet list',
        icon: List,
        keywords: ['list', 'bullet', 'ul', 'unordered'],
        command: (editor) => {
          editor.chain().focus().deleteRange(range).toggleBulletList().run();
        },
      },
      {
        title: 'Numbered List',
        description: 'Create a numbered list',
        icon: ListOrdered,
        keywords: ['list', 'numbered', 'ol', 'ordered'],
        command: (editor) => {
          editor.chain().focus().deleteRange(range).toggleOrderedList().run();
        },
      },
      {
        title: 'Quote',
        description: 'Capture a quote or citation',
        icon: Quote,
        keywords: ['quote', 'blockquote', 'citation'],
        command: (editor) => {
          editor.chain().focus().deleteRange(range).setBlockquote().run();
        },
      },
      {
        title: 'Code Block',
        description: 'Capture a code snippet',
        icon: Code2,
        keywords: ['code', 'codeblock', 'pre', 'snippet'],
        command: (editor) => {
          editor.chain().focus().deleteRange(range).setCodeBlock().run();
        },
      },
      {
        title: 'Divider',
        description: 'Visually divide blocks',
        icon: Minus,
        keywords: ['divider', 'hr', 'horizontal', 'line', 'break'],
        command: (editor) => {
          editor.chain().focus().deleteRange(range).setHorizontalRule().run();
        },
      },
      {
        title: 'Table',
        description: 'Create a simple table',
        icon: Table,
        keywords: ['table', 'grid', 'data'],
        command: (editor) => {
          editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        },
      },
      {
        title: 'Image',
        description: 'Upload an image',
        icon: Image,
        keywords: ['image', 'img', 'picture', 'photo', 'upload'],
        command: (editor) => {
          editor.chain().focus().deleteRange(range).run();
          
          // Trigger file upload
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          
          input.onchange = (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) return;

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
              if (src) {
                editor.chain().focus().setImage({ src }).run();
              }
            };
            reader.readAsDataURL(file);
          };

          input.click();
        },
      },
    ];

    // Filter items based on query
    const filteredItems = items.filter(item => {
      const searchQuery = query.toLowerCase();
      return (
        item.title.toLowerCase().includes(searchQuery) ||
        item.description.toLowerCase().includes(searchQuery) ||
        item.keywords.some(keyword => keyword.includes(searchQuery))
      );
    });

    // Reset selected index when filtered items change
    useEffect(() => {
      setSelectedIndex(0);
    }, [query]);

    // Handle keyboard navigation
    const onKeyDown = (event: KeyboardEvent): boolean => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + filteredItems.length - 1) % filteredItems.length);
        return true;
      }

      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % filteredItems.length);
        return true;
      }

      if (event.key === 'Enter') {
        const selectedItem = filteredItems[selectedIndex];
        if (selectedItem) {
          onSelect(selectedItem);
        }
        return true;
      }

      return false;
    };

    useImperativeHandle(ref, () => ({
      onKeyDown,
    }));

    if (filteredItems.length === 0) {
      return (
        <div className="flex items-center justify-center p-4">
          <div className="text-sm text-muted">
            No results for &quot;{query}&quot;
          </div>
        </div>
      );
    }

    return (
      <div className="border-border-default max-h-[300px] min-w-[280px] overflow-y-auto rounded-lg border bg-elevated p-2 shadow-lg">
        <div className="border-border-subtle mb-1 border-b px-2 py-1 text-xs text-muted">
          Commands {query && `matching &quot;${query}&quot;`}
        </div>
        
        {filteredItems.map((item, index) => {
          const Icon = item.icon;
          const isSelected = index === selectedIndex;
          
          return (
            <button
              key={item.title}
              className={`
                flex w-full items-start gap-3 rounded-md px-3 py-2 text-left transition-colors
                ${isSelected 
                  ? 'border border-accent-primary bg-accent-soft' 
                  : 'border border-transparent hover:bg-tertiary'
                }
              `}
              onClick={() => onSelect(item)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className={`
                mt-0.5 shrink-0 rounded-md p-1
                ${isSelected ? 'bg-accent-primary text-white' : 'bg-tertiary text-secondary'}
              `}>
                <Icon className="size-4" />
              </div>
              
              <div className="min-w-0 flex-1">
                <div className={`
                  text-sm font-medium
                  ${isSelected ? 'text-accent-primary' : 'text-primary'}
                `}>
                  {item.title}
                </div>
                <div className={`
                  mt-0.5 text-xs
                  ${isSelected ? 'text-accent-primary' : 'text-muted'}
                `}>
                  {item.description}
                </div>
              </div>
            </button>
          );
        })}
        
        <div className="border-border-subtle mt-2 border-t px-2 pt-2">
          <div className="flex items-center gap-4 text-xs text-muted">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Cancel</span>
          </div>
        </div>
      </div>
    );
  }
);

TiptapSlashCommand.displayName = 'TiptapSlashCommand';

export default TiptapSlashCommand; 