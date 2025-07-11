import React, { 
  useState, 
  useEffect, 
  forwardRef, 
  useImperativeHandle 
} from 'react';
import { Editor } from '@tiptap/react';
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
  Hash,
  CheckSquare,
  Image,
  Table,
  Calendar,
  FileText
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
  ({ editor, range, query, onSelect }, ref) => {
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
        title: 'Bullet List',
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
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[280px]">
          <div className="text-gray-500 text-sm">
            No results for "{query}"
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[280px] max-h-[300px] overflow-y-auto">
        <div className="text-xs text-gray-500 px-2 py-1 mb-1 border-b border-gray-100">
          Commands {query && `matching "${query}"`}
        </div>
        
        {filteredItems.map((item, index) => {
          const Icon = item.icon;
          const isSelected = index === selectedIndex;
          
          return (
            <button
              key={item.title}
              className={`
                w-full text-left px-3 py-2 rounded-md transition-colors flex items-start gap-3
                ${isSelected 
                  ? 'bg-blue-50 border border-blue-200' 
                  : 'hover:bg-gray-50 border border-transparent'
                }
              `}
              onClick={() => onSelect(item)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className={`
                p-1 rounded-md mt-0.5 flex-shrink-0
                ${isSelected ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}
              `}>
                <Icon className="h-4 w-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className={`
                  text-sm font-medium
                  ${isSelected ? 'text-blue-900' : 'text-gray-900'}
                `}>
                  {item.title}
                </div>
                <div className={`
                  text-xs mt-0.5
                  ${isSelected ? 'text-blue-700' : 'text-gray-500'}
                `}>
                  {item.description}
                </div>
              </div>
            </button>
          );
        })}
        
        <div className="border-t border-gray-100 mt-2 pt-2 px-2">
          <div className="text-xs text-gray-400 flex items-center gap-4">
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