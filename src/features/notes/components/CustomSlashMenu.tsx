import React from 'react';
import { SuggestionMenuProps } from '@blocknote/react';
import { 
  Type, Heading1, Heading2, Heading3, List, ListOrdered, Code, 
  Quote, ListTodo, Table, Image, FileText, CheckSquare
} from 'lucide-react';

export function CustomSlashMenu(props: SuggestionMenuProps<any>) {
  const { items, onItemClick, selectedIndex } = props;

  // Match context menu styling exactly
  return (
    <div 
      className="animate-in fade-in slide-in-from-left-2 rounded-lg border border-gray-200 bg-white p-3 shadow-lg duration-200 dark:border-gray-800" 
      style={{ 
        backgroundColor: '#ffffff',
        minWidth: '240px'
      }}
    >
      {items.map((item: any, index: number) => {
        // Map BlockNote icons to Lucide icons
        const getIcon = () => {
          switch (item.title) {
            case 'Heading 1': return <Heading1 size={16} />;
            case 'Heading 2': return <Heading2 size={16} />;
            case 'Heading 3': return <Heading3 size={16} />;
            case 'Bullet List': return <List size={16} />;
            case 'Numbered List': return <ListOrdered size={16} />;
            case 'Check List': return <CheckSquare size={16} />;
            case 'Quote': return <Quote size={16} />;
            case 'Code Block': return <Code size={16} />;
            case 'Table': return <Table size={16} />;
            case 'Image': return <Image size={16} />;
            case 'Paragraph': return <Type size={16} />;
            case 'Toggle List': return <ListTodo size={16} />;
            default: return <FileText size={16} />;
          }
        };

        return (
          <button
            key={index}
            onClick={() => onItemClick?.(item)}
            className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-gray-100 ${
              index === selectedIndex ? 'bg-gray-100' : ''
            }`}
            style={{ backgroundColor: index === selectedIndex ? '#f3f4f6' : 'transparent' }}
            // onMouseEnter={() => props.onItemHover?.(item)} // onItemHover may not exist in all versions
          >
            <span className="text-purple-600">
              {getIcon()}
            </span>
            <span className="flex-1 text-gray-800">
              {item.title}
            </span>
          </button>
        );
      })}
    </div>
  );
}