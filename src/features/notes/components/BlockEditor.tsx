import React, { useState, useRef, useEffect } from 'react';
import { Button, Card, Heading, Text, Checkbox } from '../../../components/ui';
import type { Block } from '../types';
import {
  Heading1,
  Heading2,
  List,
  CheckSquare,
  Code2,
  PencilRuler,
  GripVertical,
  MoreHorizontal,
  Type,
  Image as ImageIcon,
  Quote,
  Trash2,
  Plus,
} from 'lucide-react';

// Simple text editor replacement for TipTap
interface SimpleEditorProps {
  content: string;
  onChange: (blockId: string, newContent: string) => void;
  blockId: string;
  className?: string;
}

const SimpleEditor: React.FC<SimpleEditorProps> = ({ content, onChange, blockId, className }) => {
  return (
    <div
      contentEditable
      suppressContentEditableWarning
      className={`outline-none focus:ring-1 focus:ring-[var(--accent-primary)] rounded-[var(--radius-sm)] p-[var(--space-1)] -m-[var(--space-1)] ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: content }}
      onBlur={(e) => {
        onChange(blockId, e.currentTarget.innerHTML);
      }}
    />
  );
};

interface BlockComponentProps {
  block: Block;
  onContentChange: (blockId: string, newContent: string) => void;
}

const TextBlock: React.FC<BlockComponentProps> = ({ block, onContentChange }) => (
  <SimpleEditor content={block.content} onChange={onContentChange} blockId={block.id} />
);

const Heading1Block: React.FC<BlockComponentProps> = ({ block, onContentChange }) => (
  <Heading level={1} className="text-[var(--text-primary)] mb-[var(--space-4)] mt-[var(--space-6)]">
    <SimpleEditor content={block.content} onChange={onContentChange} blockId={block.id} className="font-bold" />
  </Heading>
);

const Heading2Block: React.FC<BlockComponentProps> = ({ block, onContentChange }) => (
  <Heading level={2} className="text-[var(--text-primary)] mb-[var(--space-3)] mt-[var(--space-4)]">
    <SimpleEditor content={block.content} onChange={onContentChange} blockId={block.id} className="font-bold" />
  </Heading>
);

const QuoteBlock: React.FC<{block: Block}> = ({ block }) => (
  <blockquote className="border-l-4 border-[var(--accent-primary)] italic text-[var(--text-secondary)] my-[var(--space-4)] pl-[var(--space-4)]">
    <Text as="p" variant="secondary">{block.content}</Text>
  </blockquote>
);

interface ChecklistBlockProps extends BlockComponentProps {}

const ChecklistBlock: React.FC<ChecklistBlockProps> = ({ block, onContentChange }) => {
    const handleCheckChange = (index: number, checked: boolean) => {
        const lines = block.content.split('\n');
        const [text] = lines[index].split('|');
        lines[index] = `${text}|${checked}`;
        onContentChange(block.id, lines.join('\n'));
    };

    return (
        <div className="flex flex-col gap-[var(--space-2)] my-[var(--space-4)]">
            {block.content.split('\n').map((item: string, index: number) => {
                const [text, checkedStr] = item.split('|');
                const isChecked = checkedStr === 'true';
                return (
                    <div key={index} className="flex items-center gap-[var(--space-3)]">
                        <Checkbox 
                          checked={isChecked} 
                          onCheckedChange={(checked) => handleCheckChange(index, checked as boolean)}
                          className="w-[var(--space-4)] h-[var(--space-4)] rounded-[var(--radius-sm)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] bg-[var(--bg-tertiary)] border-[var(--border-default)]"
                        />
                        <Text 
                          as="label" 
                          className={`${isChecked ? 'line-through text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}
                        >
                          {text}
                        </Text>
                    </div>
                );
            })}
        </div>
    );
};

const CanvasBlock: React.FC<{block: Block}> = ({ block }) => (
  <Card className="border-2 border-dashed border-[var(--border-default)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-ghost)]/50 transition-colors duration-200 my-[var(--space-6)]">
    <div className="flex flex-col items-center justify-center text-center p-[var(--space-8)]">
      <PencilRuler size={36} className="text-[var(--text-secondary)] mb-[var(--space-4)]" />
      <Heading level={4} className="text-[var(--text-primary)]">Embedded sketch</Heading>
      <Text variant="secondary" size="sm" className="mb-[var(--space-4)]">
        {block.content}
      </Text>
      <Button variant="secondary" size="sm">Edit sketch</Button>
    </div>
  </Card>
);

interface BlockOptionsMenuProps {
  onSelect: (optionId: string) => void;
  position: { x: number; y: number } | null;
  closeMenu: () => void;
}

const BlockOptionsMenu: React.FC<BlockOptionsMenuProps> = ({ onSelect, position, closeMenu }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const options = [
      { id: 'delete', label: 'Delete', icon: Trash2 },
      { id: 'turn-into-text', label: 'Turn into Text', icon: Type },
      { id: 'turn-into-h1', label: 'Turn into H1', icon: Heading1 },
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                closeMenu();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [closeMenu]);

    if (!position) return null;
    return (
        <div ref={menuRef} style={{ top: position.y, left: position.x }} className="absolute z-50">
            <Card className="w-56 shadow-xl border border-[var(--border-default)]" padding="sm">
                <ul>
                    {options.map(opt => (
                        <li key={opt.id}>
                            <Button 
                                variant="ghost"
                                onClick={() => { onSelect(opt.id); closeMenu(); }} 
                                className="w-full text-left flex items-center gap-[var(--space-3)] p-[var(--space-2)] rounded-[var(--radius-md)] hover:bg-[var(--bg-tertiary)]"
                            >
                                <opt.icon size={16} className={`text-[var(--text-muted)] ${opt.id === 'delete' ? 'text-[var(--error)]' : ''}`} /> 
                                <Text size="sm" weight="medium" className={`${opt.id === 'delete' ? 'text-[var(--error)]' : 'text-[var(--text-primary)]'}`}>
                                    {opt.label}
                                </Text>
                            </Button>
                        </li>
                    ))}
                </ul>
            </Card>
        </div>
    );
};

interface BlockRendererProps {
  block: Block;
  onContentChange: (blockId: string, newContent: string) => void;
  onTransform: (blockId: string, newType: Block['type']) => void;
  onDelete: (blockId: string) => void;
  onAddBlock: (blockId: string, type: Block['type']) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, blockId: string) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, blockId: string) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, blockId: string) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  isDraggingOver: boolean;
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({ 
    block, 
    onContentChange, 
    onDragStart, 
    onDragOver, 
    onDrop, 
    onDragEnd, 
    isDraggingOver, 
    onDelete, 
    onTransform, 
    onAddBlock: _onAddBlock
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [optionsMenu, setOptionsMenu] = useState<{ x: number, y: number } | null>(null);
    const blockRef = useRef<HTMLDivElement>(null);

    const handleMenuOptionSelect = (optionId: string) => {
        if (optionId === 'delete') {
            onDelete(block.id);
        } else if (optionId.startsWith('turn-into-')) {
            const newType = optionId.replace('turn-into-', '');
            onTransform(block.id, newType as Block['type']);
        }
    };
    
    const renderBlock = () => {
        switch (block.type) {
            case 'text': return <TextBlock block={block} onContentChange={onContentChange} />;
            case 'heading1': return <Heading1Block block={block} onContentChange={onContentChange} />;
            case 'heading2': return <Heading2Block block={block} onContentChange={onContentChange} />;
            case 'checklist': return <ChecklistBlock block={block} onContentChange={onContentChange} />;
            case 'quote': return <QuoteBlock block={block} />;
            case 'canvas': return <CanvasBlock block={block} />;
            default: return <p dangerouslySetInnerHTML={{ __html: block.content }}></p>;
        }
    }

    return (
        <div
            ref={blockRef}
            className="relative group py-[var(--space-1)]"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onFocus={() => setIsHovered(true)}
            onBlur={() => setIsHovered(false)}
            draggable
            onDragStart={(e) => onDragStart(e, block.id)}
            onDragOver={(e) => onDragOver(e, block.id)}
            onDrop={(e) => onDrop(e, block.id)}
            onDragEnd={onDragEnd}
        >
            {isDraggingOver && <div className="absolute top-0 left-0 w-full h-0.5 bg-[var(--accent-primary)] rounded-full transition-all" />}
            <div className={`absolute -left-12 top-1/2 -translate-y-1/2 flex items-center gap-[var(--space-1)] transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0 group-focus-within:opacity-100'}`}>
                <Button variant="ghost" size="icon" className="h-[var(--space-6)] w-[var(--space-6)]" onClick={() => { /* Implement Add Block Logic */ }}>
                    <Plus size={16} className="text-[var(--text-muted)]" />
                </Button>
                <Button variant="ghost" size="icon" className="h-[var(--space-6)] w-[var(--space-6)] cursor-grab active:cursor-grabbing">
                    <GripVertical size={16} className="text-[var(--text-muted)]" />
                </Button>
                <Button variant="ghost" size="icon" className="h-[var(--space-6)] w-[var(--space-6)]" onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setOptionsMenu({ x: rect.right, y: rect.top });
                }}>
                    <MoreHorizontal size={16} className="text-[var(--text-muted)]" />
                </Button>
            </div>
            {renderBlock()}
            {optionsMenu && <BlockOptionsMenu position={optionsMenu} onSelect={handleMenuOptionSelect} closeMenu={() => setOptionsMenu(null)} />}
             {isDraggingOver && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--accent-primary)] rounded-full transition-all" />}
        </div>
    );
}; 