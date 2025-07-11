import React, { useState, useRef } from 'react';
import { Button, Card, Heading, Text } from '../../../components/ui';
import type { Block } from '../types';
import {
  GripVertical,
  Plus,
  Trash2,
  Type,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  Code2,
  Minus,
} from 'lucide-react';

interface BlockEditorProps {
  blocks: Block[];
  onBlocksChange: (blocks: Block[]) => void;
}

interface SimpleBlockProps {
  block: Block;
  onContentChange: (content: string) => void;
  onDelete: () => void;
  onAddBlock: (type: Block['type']) => void;
}

const SimpleBlock: React.FC<SimpleBlockProps> = ({ block, onContentChange, onDelete, onAddBlock }) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const blockTypes = [
    { type: 'text' as const, label: 'Paragraph', icon: Type },
    { type: 'heading1' as const, label: 'Heading 1', icon: Heading1 },
    { type: 'heading2' as const, label: 'Heading 2', icon: Heading2 },
    { type: 'heading3' as const, label: 'Heading 3', icon: Heading3 },
    { type: 'quote' as const, label: 'Quote', icon: Quote },
    { type: 'list' as const, label: 'List', icon: List },
    { type: 'code' as const, label: 'Code', icon: Code2 },
    { type: 'divider' as const, label: 'Divider', icon: Minus },
  ];

  const renderBlockContent = () => {
    const commonProps = {
      value: block.content,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onContentChange(e.target.value),
      placeholder: 'Type something...',
      className: 'w-full bg-transparent border-none outline-none resize-none',
    };

    switch (block.type) {
      case 'heading1':
        return (
          <Heading level={1} className="text-[var(--text-primary)] mb-0">
            <input {...commonProps} className={`${commonProps.className} text-3xl font-bold`} />
          </Heading>
        );
      case 'heading2':
        return (
          <Heading level={2} className="text-[var(--text-primary)] mb-0">
            <input {...commonProps} className={`${commonProps.className} text-2xl font-bold`} />
          </Heading>
        );
      case 'heading3':
        return (
          <Heading level={3} className="text-[var(--text-primary)] mb-0">
            <input {...commonProps} className={`${commonProps.className} text-xl font-semibold`} />
          </Heading>
        );
      case 'quote':
        return (
          <blockquote className="border-l-4 border-[var(--accent-primary)] bg-[var(--bg-secondary)]/30 rounded-r-md pl-4 pr-3 py-3">
            <textarea 
              {...commonProps} 
              className={`${commonProps.className} italic text-[var(--text-secondary)] min-h-[2rem]`}
              rows={1}
              style={{ resize: 'none' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
          </blockquote>
        );
      case 'list':
        return (
          <ul className="list-disc ml-6 my-2">
            <li className="text-[var(--text-primary)]">
              <input {...commonProps} className={`${commonProps.className} ml-2`} />
            </li>
          </ul>
        );
      case 'code':
        return (
          <Card className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-md p-4">
            <textarea 
              {...commonProps} 
              className={`${commonProps.className} font-mono text-sm min-h-[3rem]`}
              rows={3}
              style={{ resize: 'none' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
          </Card>
        );
      case 'divider':
        return (
          <div className="my-6 flex items-center justify-center">
            <div className="w-full max-w-xs h-px bg-[var(--border-default)]"></div>
          </div>
        );
      default:
        return (
          <textarea 
            {...commonProps} 
            className={`${commonProps.className} text-[var(--text-primary)] min-h-[2rem]`}
            rows={1}
            style={{ resize: 'none' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = target.scrollHeight + 'px';
            }}
          />
        );
    }
  };

  return (
    <div 
      className="group relative py-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowAddMenu(false);
      }}
    >
      {/* Block Controls */}
      <div className={`absolute left-0 top-0 flex items-center gap-1 -ml-12 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
        <Button
          variant="ghost"
          size="sm"
          className="w-8 h-8 p-0 hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
          onClick={() => setShowAddMenu(!showAddMenu)}
        >
          <Plus size={14} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-8 h-8 p-0 hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] cursor-grab"
        >
          <GripVertical size={14} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-8 h-8 p-0 hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-red-500"
          onClick={onDelete}
        >
          <Trash2 size={14} />
        </Button>
      </div>

      {/* Block Content */}
      <div className="relative">
        {renderBlockContent()}
      </div>

      {/* Add Block Menu */}
      {showAddMenu && (
        <Card className="absolute left-0 top-full mt-2 z-10 w-64 shadow-lg border border-[var(--border-default)] bg-[var(--bg-elevated)]" padding="sm">
          <div className="space-y-1">
            {blockTypes.map((type) => (
              <Button
                key={type.type}
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-left"
                onClick={() => {
                  onAddBlock(type.type);
                  setShowAddMenu(false);
                }}
              >
                <type.icon size={14} />
                <Text size="sm">{type.label}</Text>
              </Button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export const BlockEditor: React.FC<BlockEditorProps> = ({ blocks, onBlocksChange }) => {
  const handleBlockContentChange = (blockId: string, content: string) => {
    const newBlocks = blocks.map(block => 
      block.id === blockId ? { ...block, content } : block
    );
    onBlocksChange(newBlocks);
  };

  const handleDeleteBlock = (blockId: string) => {
    const newBlocks = blocks.filter(block => block.id !== blockId);
    onBlocksChange(newBlocks);
  };

  const handleAddBlock = (afterBlockId: string, type: Block['type']) => {
    const newBlock: Block = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content: '',
      metadata: {}
    };

    const currentIndex = blocks.findIndex(block => block.id === afterBlockId);
    const newBlocks = [...blocks];
    newBlocks.splice(currentIndex + 1, 0, newBlock);
    onBlocksChange(newBlocks);
  };

  const handleAddInitialBlock = () => {
    const newBlock: Block = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'text',
      content: '',
      metadata: {}
    };
    onBlocksChange([...blocks, newBlock]);
  };

  return (
    <div className="space-y-2 pl-12">
      {blocks.length === 0 ? (
        <div className="text-center py-8">
          <Text className="text-[var(--text-muted)] mb-4">Start writing your note...</Text>
          <Button onClick={handleAddInitialBlock} className="gap-2">
            <Plus size={16} />
            Add your first block
          </Button>
        </div>
      ) : (
        blocks.map((block) => (
          <SimpleBlock
            key={block.id}
            block={block}
            onContentChange={(content) => handleBlockContentChange(block.id, content)}
            onDelete={() => handleDeleteBlock(block.id)}
            onAddBlock={(type) => handleAddBlock(block.id, type)}
          />
        ))
      )}
    </div>
  );
}; 