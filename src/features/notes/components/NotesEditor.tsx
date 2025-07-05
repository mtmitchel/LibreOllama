import React, { useRef, useState } from 'react';
import { Input, Card } from '../../../components/ui';
import { BlockRenderer } from './BlockEditor';
import { SlashCommandMenu } from './SlashCommandMenu';
import type { Note, Block } from '../types';

interface NotesEditorProps {
  selectedNote: Note;
  onUpdateNote: (note: Note) => void;
  onUpdateBlocks: (blocks: Block[]) => void;
}

export function NotesEditor({ selectedNote, onUpdateNote, onUpdateBlocks }: NotesEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null);
  const [showSlashCommand, setShowSlashCommand] = useState(false);
  const [slashCommandPosition, setSlashCommandPosition] = useState<{ x: number, y: number } | null>(null);

  const handleTitleChange = (title: string) => {
    onUpdateNote({ ...selectedNote, title });
  };

  const handleAddBlock = (currentBlockId: string, type: Block['type']) => {
    const newBlock: Block = { id: `block-${Date.now()}`, type: type, content: '', metadata: {} };
    let currentIndex = selectedNote.blocks.findIndex(b => b.id === currentBlockId);
    if (currentBlockId === 'ADD_TO_END') { 
      currentIndex = selectedNote.blocks.length - 1;
    }

    const newBlocks = [...selectedNote.blocks];
    if (currentIndex === -1 && currentBlockId !== 'ADD_TO_END') { 
      newBlocks.push(newBlock);
    } else {
      newBlocks.splice(currentIndex + 1, 0, newBlock);
    }
    
    onUpdateBlocks(newBlocks);
  };

  const handleBlockContentChange = (blockId: string, newContent: string) => {
    const newBlocks = selectedNote.blocks.map(b => b.id === blockId ? { ...b, content: newContent } : b);
    onUpdateBlocks(newBlocks);
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = newContent;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";

    if (textContent.endsWith('/')) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (range && editorRef.current) {
          const caretRect = range.getBoundingClientRect();
          const editorRect = editorRef.current.getBoundingClientRect();
          
          let currentNode = range.startContainer;
          let currentElement = currentNode.nodeType === Node.ELEMENT_NODE ? currentNode as HTMLElement : currentNode.parentElement;
          let blockWrapper = currentElement?.closest('.group') as HTMLElement | null;
          let blockTop = 0;
          if (blockWrapper && editorRef.current) {
            blockTop = blockWrapper.offsetTop - editorRef.current.scrollTop;
          }

          setSlashCommandPosition({ 
            x: caretRect.left - editorRect.left, 
            y: blockTop + caretRect.height + 5
          }); 
          setShowSlashCommand(true);
        }
      }
    } else {
      setShowSlashCommand(false);
    }
  };

  const handleSlashCommandSelect = (type: Block['type']) => {
    if (!editorRef.current) return;

    let currentBlockId: string | null = null;
    const selection = window.getSelection();
    if (selection && selection.focusNode) {
      let node = selection.focusNode;
      let parentElement = node.nodeType === Node.ELEMENT_NODE ? node as HTMLElement : node.parentElement;
      while (parentElement && !parentElement.classList.contains('group')) {
        parentElement = parentElement.parentElement;
      }
      if (parentElement) {
        const renderedBlocks = Array.from(editorRef.current.querySelectorAll('.group [contenteditable="true"]'));
        const focusedEditorElement = selection.focusNode.parentElement?.closest('[contenteditable="true"]');
        const focusedBlockIndex = renderedBlocks.findIndex(el => el === focusedEditorElement);
        if (focusedBlockIndex !== -1 && selectedNote.blocks[focusedBlockIndex]) {
          currentBlockId = selectedNote.blocks[focusedBlockIndex].id;
          const blockToClean = selectedNote.blocks.find(b => b.id === currentBlockId);
          if (blockToClean) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = blockToClean.content;
            let textContent = tempDiv.textContent || tempDiv.innerText || "";
            if (textContent.endsWith('/')) {
              textContent = textContent.slice(0, -1);
              blockToClean.content = textContent; 
            }
          }
        }
      }
    }
    
    const newBlock: Block = { id: `block-${Date.now()}`, type: type, content: '', metadata: {} };
    const currentIndex = currentBlockId ? selectedNote.blocks.findIndex(b => b.id === currentBlockId) : selectedNote.blocks.length - 1;
    
    const newBlocks = [...selectedNote.blocks];
    newBlocks.splice(currentIndex + 1, 0, newBlock);
    
    onUpdateBlocks(newBlocks);
    setShowSlashCommand(false);
  };

  const handleDeleteBlock = (blockId: string) => {
    const newBlocks = selectedNote.blocks.filter(b => b.id !== blockId);
    onUpdateBlocks(newBlocks);
  };

  const handleTransformBlock = (blockId: string, newType: Block['type']) => {
    const newBlocks = selectedNote.blocks.map(b => b.id === blockId ? { ...b, type: newType, content: b.content } : b);
    onUpdateBlocks(newBlocks);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, blockId: string) => {
    setDraggingBlockId(blockId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, blockId: string) => {
    e.preventDefault();
    if (blockId !== draggingBlockId) {
      setDragOverBlockId(blockId);
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropTargetId: string) => {
    e.preventDefault();
    if (!draggingBlockId || draggingBlockId === dropTargetId) return;
    
    const dragIndex = selectedNote.blocks.findIndex(b => b.id === draggingBlockId);
    const dropIndex = selectedNote.blocks.findIndex(b => b.id === dropTargetId);

    if (dragIndex === -1 || dropIndex === -1) return;

    const newBlocks = [...selectedNote.blocks];
    const [draggedBlock] = newBlocks.splice(dragIndex, 1);
    newBlocks.splice(dropIndex, 0, draggedBlock);

    onUpdateBlocks(newBlocks);
    setDraggingBlockId(null);
    setDragOverBlockId(null);
  };

  const handleDragEnd = () => {
    setDraggingBlockId(null);
    setDragOverBlockId(null);
  };

  return (
    <Card className="flex-1 flex flex-col overflow-hidden" padding="none">
      <header className="p-[var(--space-4)] border-b border-[var(--border-default)] flex items-center justify-between flex-shrink-0">
        <Input 
          type="text" 
          value={selectedNote.title} 
          onChange={(e) => handleTitleChange(e.target.value)} 
          className="text-lg font-semibold bg-transparent focus:ring-0 border-0 text-[var(--text-primary)] w-full p-0 h-auto focus-visible:ring-offset-0 focus-visible:ring-0"
          placeholder="Untitled Note"
        />
      </header>
      
      <div 
        ref={editorRef} 
        className="flex-1 p-[var(--space-6)] md:p-[var(--space-8)] lg:px-[var(--space-24)] overflow-y-auto bg-[var(--bg-primary)] relative" 
        onDragOver={(e) => e.preventDefault()}
      >
        <div className="max-w-3xl mx-auto">
          {selectedNote.blocks.map(block => (
            <BlockRenderer
              key={block.id}
              block={block}
              onContentChange={handleBlockContentChange}
              onDragStart={handleDragStart}
              onDragOver={(e) => handleDragOver(e, block.id)}
              onDrop={(e) => handleDrop(e, block.id)}
              onDragEnd={handleDragEnd}
              isDraggingOver={dragOverBlockId === block.id}
              onDelete={handleDeleteBlock}
              onTransform={handleTransformBlock}
              onAddBlock={handleAddBlock}
            />
          ))}
        </div>
        {showSlashCommand && (
          <SlashCommandMenu 
            onSelect={handleSlashCommandSelect} 
            position={slashCommandPosition} 
          />
        )}
      </div>
    </Card>
  );
} 