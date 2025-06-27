// src/pages/Notes.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Input } from '../shared/ui';
import {
  Plus, Folder, Search, Heading1, Heading2, List, CheckSquare, Code2,
  PencilRuler, ChevronRight, ChevronDown, GripVertical, MoreHorizontal, Type, Image as ImageIcon, Quote, Trash2
} from 'lucide-react';

// --- Data Structures & Mock Data (Enhanced) ---

interface Block {
  id: string;
  type: 'heading1' | 'heading2' | 'text' | 'list' | 'checklist' | 'code' | 'canvas' | 'image' | 'quote';
  content: string; // This will store HTML content for Tiptap blocks
  metadata?: any;
}

interface Note {
  id: string;
  title: string;
  folderId: string;
  blocks: Block[];
}

interface Folder {
  id: string;
  name: string;
  parentId?: string;
  notes: Note[];
  children?: Folder[];
}

// --- FOLDER/NOTE MOCK DATA (Keep as is) ---
const mockFoldersData: Omit<Folder, 'children'>[] = [
  {
    id: 'personal',
    name: 'Personal',
    notes: [
      {
        id: 'note1',
        title: 'Daily journal',
        folderId: 'personal',
        blocks: [
          { id: 'b1', type: 'heading1', content: 'June 8th, 2025' },
          { id: 'b2', type: 'text', content: 'Today was a productive day. I focused on implementing the core features for the block editor in LibreOllama.' },
          { id: 'b3', type: 'checklist', content: 'Implement Block Action Menu|true\nImplement Slash Command|true\nRefine Block Rendering|false' },
        ]
      },
      {
        id: 'note2',
        title: 'Feature brainstorm',
        folderId: 'personal',
        blocks: [
          { id: 'b4', type: 'heading2', content: 'New ideas for projects page' },
          { id: 'b5', type: 'text', content: 'Here is a quick sketch of the new project creation flow.' },
          { id: 'b6', type: 'canvas', content: 'Initial sketch of the wizard flow', metadata: {} },
          { id: 'b7', type: 'quote', content: 'The best way to predict the future is to invent it.' },
        ]
      },
    ],
  },
  {
    id: 'work',
    name: 'Work',
    notes: [
      { id: 'note3', title: 'Project alpha meeting notes', folderId: 'work', blocks: [{ id: 'b8', type: 'text', content: 'Discussed milestones for Q3.' }] }
    ]
  },
  {
    id: 'work-projects',
    name: 'Client Projects', parentId: 'work',
    notes: [
      { id: 'note4', title: 'Project beta - design specs', folderId: 'work-projects', blocks: [{ id: 'b9', type: 'text', content: 'Finalized UI mockups.' }] }
    ]
  },
  { id: 'recipes', name: 'Recipes', notes: [] }
];

// ... (Keep existing buildFolderTree and renderFolderTree functions as is) ...
const buildFolderTree = (folders: Omit<Folder, 'children'>[]): Folder[] => {
  const folderMap = new Map<string, Folder>();
  const rootFolders: Folder[] = [];
  folders.forEach(f => { folderMap.set(f.id, { ...f, children: [], notes: [...f.notes] }); });
  folderMap.forEach(folder => {
    if (folder.parentId && folderMap.has(folder.parentId)) {
      folderMap.get(folder.parentId)!.children!.push(folder);
    } else {
      rootFolders.push(folder);
    }
  });
  return rootFolders;
};

const renderFolderTree = (folderList: Folder[], level: number, selectedNoteId: string | null, setSelectedNoteId: (id: string) => void, expandedFolders: Record<string, boolean>, toggleFolder: (folderId: string) => void) => {
  return folderList.map(folder => {
    const isExpanded = expandedFolders[folder.id] ?? true;
    return (
      <div key={folder.id} style={{ marginLeft: `${level * 16}px` }} className="mb-2">
        <h3 className="flex items-center gap-2 px-2 py-1 mb-0.5 text-sm font-semibold text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-bg-secondary rounded-md" onClick={() => toggleFolder(folder.id)}> {/* Changed text-xs to text-sm */}
          {isExpanded ? <ChevronDown size={14} className="text-text-muted" /> : <ChevronRight size={14} className="text-text-muted" />}
          <Folder size={14} className="text-text-muted" />
          {folder.name}
          <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={(e) => { e.stopPropagation(); alert(`Add to ${folder.name}`); }}>
            <Plus size={12} className="text-text-muted" />
          </Button>
        </h3>
        {isExpanded && (
          <>
            <ul className="space-y-0.5">
              {folder.notes.map(note => (
                <li key={note.id}>
                  <a href="#" onClick={(e) => { e.preventDefault(); setSelectedNoteId(note.id); }} className={`block p-2 rounded-md truncate text-sm font-medium transition-colors ${selectedNoteId === note.id ? 'bg-accent-soft text-primary' : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'} pl-14`}> {/* Removed style, added pl-14. Kept text-sm for notes */}
                    {note.title}
                  </a>
                </li>
              ))}
            </ul>
            {folder.children && folder.children.length > 0 && (
              <div className="mt-1">
                {renderFolderTree(folder.children, level + 1, selectedNoteId, setSelectedNoteId, expandedFolders, toggleFolder)}
              </div>
            )}
          </>
        )}
      </div>
    );
  });
};

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
      className={`outline-none focus:ring-1 focus:ring-accent rounded p-1 -m-1 ${className || ''}`}
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
  <h1 className="text-3xl font-bold mb-4 mt-6 outline-none">
    <SimpleEditor content={block.content} onChange={onContentChange} blockId={block.id} className="font-bold" />
  </h1>
);

const Heading2Block: React.FC<BlockComponentProps> = ({ block, onContentChange }) => (
  <h2 className="text-2xl font-bold mb-3 mt-4 outline-none">
    <SimpleEditor content={block.content} onChange={onContentChange} blockId={block.id} className="font-bold" />
  </h2>
);

const QuoteBlock: React.FC<{block: Block}> = ({ block }) => (<blockquote className="my-4 border-l-4 border-accent-primary pl-4 italic text-text-secondary"><p>{block.content}</p></blockquote>);

interface ChecklistBlockProps extends BlockComponentProps {}

const ChecklistBlock: React.FC<ChecklistBlockProps> = ({ block, onContentChange }) => {
    const handleCheckChange = (index: number, checked: boolean) => {
        const lines = block.content.split('\n');
        const [text] = lines[index].split('|');
        lines[index] = `${text}|${checked}`;
        onContentChange(block.id, lines.join('\n'));
    };

    return (
        <div className="space-y-2 my-4">
            {block.content.split('\n').map((item: string, index: number) => {
                const [text, checkedStr] = item.split('|');
                const isChecked = checkedStr === 'true';
                return (
                    <div key={index} className="flex items-center gap-3">
                        <input type="checkbox" checked={isChecked} onChange={(e) => handleCheckChange(index, e.target.checked)} className="w-4 h-4 rounded text-primary focus:ring-primary bg-bg-tertiary border-border-default" />
                        <label className={`${isChecked ? 'line-through text-text-tertiary' : 'text-text-primary'}`}>{text}</label>
                    </div>
                );
            })}
        </div>
    );
};

const CanvasBlock: React.FC<{block: Block}> = ({ block }) => (
  <Card className="my-6 border-2 border-dashed border-border-default hover:border-primary hover:bg-accent-soft/50 transition-colors duration-200">
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <PencilRuler size={36} className="text-text-tertiary mb-4" />
      <h4 className="font-semibold text-text-primary">Embedded sketch</h4>
      <p className="text-sm text-text-secondary mb-4">{block.content}</p>
      <Button variant="secondary" size="sm">Edit sketch</Button>
    </div>
  </Card>
);

// --- Editor Feature Components ---

interface SlashCommandMenuProps {
  onSelect: (type: Block['type']) => void;
  position: { x: number; y: number } | null;
}

const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({ onSelect, position }) => {
    const commands = [
        { id: 'text' as const, label: 'Text', icon: Type }, 
        { id: 'heading1' as const, label: 'Heading 1', icon: Heading1 }, 
        { id: 'heading2' as const, label: 'Heading 2', icon: Heading2 }, 
        { id: 'checklist' as const, label: 'Checklist', icon: CheckSquare }, 
        { id: 'list' as const, label: 'Bulleted List', icon: List }, 
        { id: 'quote' as const, label: 'Quote', icon: Quote }, 
        { id: 'canvas' as const, label: 'Canvas', icon: PencilRuler }, 
        { id: 'image' as const, label: 'Image', icon: ImageIcon },
    ];
    if (!position) return null;
    return (
        <Card className="absolute z-50 w-64 shadow-xl border border-border-default" style={{ top: position.y, left: position.x }} padding="sm">
            <p className="text-xs font-semibold text-text-tertiary px-2 pb-2">BLOCKS</p>
            <ul>
                {commands.map(cmd => (
                    <li key={cmd.id}><button onClick={() => onSelect(cmd.id)} className="w-full text-left flex items-center gap-3 p-2 rounded-md hover:bg-bg-tertiary"><cmd.icon size={18} className="text-text-secondary" /> <span className="text-sm font-medium text-text-primary">{cmd.label}</span></button></li>
                ))}
            </ul>
        </Card>
    );
};

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
            <Card className="w-56 shadow-xl border border-border-default" padding="sm">
                <ul>
                    {options.map(opt => (
                        <li key={opt.id}><button onClick={() => { onSelect(opt.id); closeMenu(); }} className="w-full text-left flex items-center gap-3 p-2 rounded-md hover:bg-bg-tertiary"><opt.icon size={16} className={`text-text-secondary ${opt.id === 'delete' ? 'text-error' : ''}`} /> <span className={`text-sm font-medium ${opt.id === 'delete' ? 'text-error' : 'text-text-primary'}`}>{opt.label}</span></button></li>
                    ))}
                </ul>
            </Card>
        </div>
    );
};

// Main Block Renderer Component (Refactored & Enhanced)

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

const BlockRenderer: React.FC<BlockRendererProps> = ({ 
    block, 
    onContentChange, 
    onDragStart, 
    onDragOver, 
    onDrop, 
    onDragEnd, 
    isDraggingOver, 
    onDelete, 
    onTransform, 
    onAddBlock: _onAddBlock // Prefix with underscore to indicate intentionally unused
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
            default: return <p dangerouslySetInnerHTML={{ __html: block.content }}></p>; // Render HTML for unknown or future types
        }
    }

    return (
        <div
            ref={blockRef}
            className="relative group py-1"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onFocus={() => setIsHovered(true)} // Simplified hover/focus for block controls
            onBlur={() => setIsHovered(false)} // Simplified hover/focus for block controls
            draggable
            onDragStart={(e) => onDragStart(e, block.id)}
            onDragOver={(e) => onDragOver(e, block.id)}
            onDrop={(e) => onDrop(e, block.id)}
            onDragEnd={onDragEnd}
        >
            {isDraggingOver && <div className="absolute top-0 left-0 w-full h-0.5 bg-accent-primary rounded-full transition-all" />}
            <div className={`absolute -left-12 top-1/2 -translate-y-1/2 flex items-center gap-1 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0 group-focus-within:opacity-100'}`}>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { /* Implement Add Block Logic */ }}>
                    <Plus size={16} className="text-text-tertiary" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 cursor-grab active:cursor-grabbing">
                    <GripVertical size={16} className="text-text-tertiary" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setOptionsMenu({ x: rect.right, y: rect.top });
                }}>
                    <MoreHorizontal size={16} className="text-text-tertiary" />
                </Button>
            </div>
            {renderBlock()}
            {optionsMenu && <BlockOptionsMenu position={optionsMenu} onSelect={handleMenuOptionSelect} closeMenu={() => setOptionsMenu(null)} />}
             {isDraggingOver && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-accent-primary rounded-full transition-all" />}
        </div>
    );
};


export function Notes() {
    // ... (keep state for folders, expandedFolders)
    const [folders, _setFolders] = useState<Folder[]>(buildFolderTree(mockFoldersData)); // _setFolders to avoid unused var warning for now
    const [selectedNote, setSelectedNote] = useState<Note | null>(() => {
        const initialNote = mockFoldersData[0]?.notes[1];
        if (initialNote) return JSON.parse(JSON.stringify(initialNote)); // Deep copy
        return null;
    });
    const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

    // Drag and Drop State
    const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
    const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null);

    // Slash Command State
    const [showSlashCommand, setShowSlashCommand] = useState(false);
    const [slashCommandPosition, setSlashCommandPosition] = useState<{ x: number, y: number } | null>(null);
    const editorRef = useRef<HTMLDivElement>(null);

    // --- State Update Handlers ---
    const setSelectedNoteId = (id: string) => {
        const allNotes = getNotesFromFolders(folders);
        const noteToSelect = allNotes.find(n => n.id === id);
        setSelectedNote(noteToSelect ? JSON.parse(JSON.stringify(noteToSelect)) : null); // Deep copy
    };

    const getNotesFromFolders = (folderList: Folder[]): Note[] => {
        let notes: Note[] = [];
        folderList.forEach(folder => {
            notes = notes.concat(folder.notes);
            if (folder.children && folder.children.length > 0) {
                notes = notes.concat(getNotesFromFolders(folder.children));
            }
        });
        return notes;
    };
    
    const toggleFolder = (folderId: string) => {
        setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
    };

    const updateNoteBlocks = (newBlocks: Block[]) => {
        if (selectedNote) {
            setSelectedNote({ ...selectedNote, blocks: newBlocks });
            // Persist changes (e.g., to mockData or a backend)
            const folderContainingNote = folders.find(f => f.id === selectedNote.folderId) || 
                                     folders.flatMap(f => f.children || []).find(sf => sf.id === selectedNote.folderId);
            if (folderContainingNote) {
                const noteIndex = folderContainingNote.notes.findIndex(n => n.id === selectedNote.id);
                if (noteIndex !== -1) {
                    folderContainingNote.notes[noteIndex].blocks = newBlocks;
                }
            }
        }
    };
    
    const handleAddBlock = (currentBlockId: string, type: Block['type']) => {
        if (!selectedNote) return;
        const newBlock: Block = { id: `block-${Date.now()}`, type: type, content: '', metadata: {} };
        let currentIndex = selectedNote.blocks.findIndex(b => b.id === currentBlockId);
        if (currentBlockId === 'ADD_TO_END') { 
            currentIndex = selectedNote.blocks.length -1;
        }

        const newBlocks = [...selectedNote.blocks];
        if (currentIndex === -1 && currentBlockId !== 'ADD_TO_END') { 
            newBlocks.push(newBlock);
        } else {
            newBlocks.splice(currentIndex + 1, 0, newBlock);
        }
        
        updateNoteBlocks(newBlocks);
    };

    const handleBlockContentChange = (blockId: string, newContent: string) => {
        if (!selectedNote) return;
        const newBlocks = selectedNote.blocks.map(b => b.id === blockId ? { ...b, content: newContent } : b);
        updateNoteBlocks(newBlocks);
        
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
                    
                    // Get the element containing the caret
                    let currentNode = range.startContainer;
                    let currentElement = currentNode.nodeType === Node.ELEMENT_NODE ? currentNode as HTMLElement : currentNode.parentElement;
                    let blockWrapper = currentElement?.closest('.group') as HTMLElement | null;
                    let blockTop = 0;
                    if (blockWrapper && editorRef.current) {
                        blockTop = blockWrapper.offsetTop - editorRef.current.scrollTop;
                    }

                    setSlashCommandPosition({ 
                        x: caretRect.left - editorRect.left, 
                        y: blockTop + caretRect.height + 5 // Position below current line in the block
                    }); 
                    setShowSlashCommand(true);
                }
            }
        } else {
            setShowSlashCommand(false);
        }
    };

    const handleSlashCommandSelect = (type: Block['type']) => {
        if (!selectedNote || !editorRef.current) return;

        let currentBlockId: string | null = null;
        const selection = window.getSelection();
        if (selection && selection.focusNode) {
            let node = selection.focusNode;
            let parentElement = node.nodeType === Node.ELEMENT_NODE ? node as HTMLElement : node.parentElement;
            while (parentElement && !parentElement.classList.contains('group')) {
                parentElement = parentElement.parentElement;
            }
            if (parentElement) {
                // Assuming the block ID is on the .group element or can be found from it.
                // This part needs to be robust. For now, let's find the block by its contenteditable child.
                const renderedBlocks = Array.from(editorRef.current.querySelectorAll('.group [contenteditable="true"]'));
                const focusedEditorElement = selection.focusNode.parentElement?.closest('[contenteditable="true"]');
                const focusedBlockIndex = renderedBlocks.findIndex(el => el === focusedEditorElement);
                if (focusedBlockIndex !== -1 && selectedNote.blocks[focusedBlockIndex]) {
                    currentBlockId = selectedNote.blocks[focusedBlockIndex].id;
                    // Clean the content of the block that triggered the slash command
                    const blockToClean = selectedNote.blocks.find(b => b.id === currentBlockId);
                    if (blockToClean) {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = blockToClean.content;
                        let textContent = tempDiv.textContent || tempDiv.innerText || "";
                        if (textContent.endsWith('/')) {
                            textContent = textContent.slice(0, -1);
                            // This is a simplification. Ideally, Tiptap should handle this replacement.
                            blockToClean.content = textContent; 
                        }
                    }
                }
            }
        }
        
        const newBlock: Block = { id: `block-${Date.now()}`, type: type, content: '', metadata: {} };
        const currentIndex = currentBlockId ? selectedNote.blocks.findIndex(b => b.id === currentBlockId) : selectedNote.blocks.length -1 ;
        
        const newBlocks = [...selectedNote.blocks];
        newBlocks.splice(currentIndex + 1, 0, newBlock);
        
        updateNoteBlocks(newBlocks);
        setShowSlashCommand(false);

        // Focus the new block - This is a bit tricky with Tiptap async rendering
        // setTimeout(() => {
        //     const newBlockElement = document.querySelector(`[data-block-id="${newBlock.id}"] [contenteditable="true"]`);
        //     if (newBlockElement) {
        //         (newBlockElement as HTMLElement).focus();
        //     }
        // }, 50);
    };

    const handleDeleteBlock = (blockId: string) => {
        if (!selectedNote) return;
        const newBlocks = selectedNote.blocks.filter(b => b.id !== blockId);
        updateNoteBlocks(newBlocks);
    };

    const handleTransformBlock = (blockId: string, newType: Block['type']) => {
        if (!selectedNote) return;
        const newBlocks = selectedNote.blocks.map(b => b.id === blockId ? { ...b, type: newType, content: b.content } : b); // Ensure content is preserved
        updateNoteBlocks(newBlocks);
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
        if (!draggingBlockId || draggingBlockId === dropTargetId || !selectedNote) return;
        
        const dragIndex = selectedNote.blocks.findIndex(b => b.id === draggingBlockId);
        const dropIndex = selectedNote.blocks.findIndex(b => b.id === dropTargetId);

        if (dragIndex === -1 || dropIndex === -1) return; // Should not happen

        const newBlocks = [...selectedNote.blocks];
        const [draggedBlock] = newBlocks.splice(dragIndex, 1);
        newBlocks.splice(dropIndex, 0, draggedBlock);

        updateNoteBlocks(newBlocks);
        setDraggingBlockId(null);
        setDragOverBlockId(null);
    };

    const handleDragEnd = () => {
        setDraggingBlockId(null);
        setDragOverBlockId(null);
    };

    const blockTypeToolbar = [ { icon: Heading1, label: "H1" }, { icon: Heading2, label: "H2" }, { icon: List, label: "List" }, { icon: CheckSquare, label: "Checklist" }, { icon: Code2, label: "Code" }, { icon: PencilRuler, label: "Sketch" } ];

    // Effect to update mock data when selectedNote changes (simulating save)
    useEffect(() => {
        if (selectedNote) {
            const folderIndex = mockFoldersData.findIndex(f => f.id === selectedNote.folderId || f.notes.some(n => n.folderId === selectedNote.folderId) );
            if (folderIndex !== -1) {
                const noteIndex = mockFoldersData[folderIndex].notes.findIndex(n => n.id === selectedNote.id);
                if (noteIndex !== -1) {
                    mockFoldersData[folderIndex].notes[noteIndex] = JSON.parse(JSON.stringify(selectedNote));
                }
            }
            // This is a simplified update for nested folders. A more robust solution would be needed for deeper nesting.
            mockFoldersData.forEach(folder => {
                if(folder.parentId){
                    const parentFolder = mockFoldersData.find(pf => pf.id === folder.parentId);
                    if(parentFolder){
                        const childFolder = (parentFolder.notes.find(n => n.folderId === folder.id) as any)?.children?.find((cf: Folder) => cf.id === selectedNote.folderId);
                        if(childFolder){
                             const noteIndex = childFolder.notes.findIndex((n:Note) => n.id === selectedNote.id);
                             if(noteIndex !== -1){
                                childFolder.notes[noteIndex] = JSON.parse(JSON.stringify(selectedNote));
                             }
                        }
                    }
                }
            });
        }
    }, [selectedNote]);

    return (
        <div className="flex h-full bg-bg-primary p-4 md:p-6 gap-4 md:gap-6"> 
            <aside className={`w-[340px] flex-shrink-0 border border-border-subtle p-4 flex flex-col bg-bg-surface rounded-lg`}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h1 className="text-xl font-semibold text-text-primary">Notes</h1>
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => alert('New Folder clicked - implement functionality')}>
                            <Folder size={16} className="mr-1.5" /> New folder
                        </Button>
                        <Button variant="primary" size="sm" onClick={() => alert('New Note clicked - implement functionality')}>
                            <Plus size={16} className="mr-1.5" /> New note
                        </Button>
                    </div>
                </div>
                <div className="relative mb-4 flex-shrink-0">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <Input type="search" placeholder="Search all notes..." className="pl-9" />
                </div>
                <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
                    {renderFolderTree(folders, 0, selectedNote?.id || null, setSelectedNoteId, expandedFolders, toggleFolder)}
                </nav>
            </aside>

            <main className="flex-1 flex flex-col overflow-hidden bg-bg-surface rounded-lg border border-border-subtle">
                {selectedNote ? (
                    <>
                        <header className="p-4 border-b border-border-subtle flex items-center justify-between flex-shrink-0">
                            <Input 
                                type="text" 
                                value={selectedNote.title} 
                                onChange={(e) => setSelectedNote(prev => prev ? {...prev, title: e.target.value} : null)} 
                                className="text-lg font-semibold bg-transparent focus:ring-0 border-0 text-text-primary w-full p-0 h-auto focus-visible:ring-offset-0 focus-visible:ring-0"
                                placeholder="Untitled Note"
                            />
                            <div className="flex items-center gap-1 bg-bg-tertiary p-1 rounded-md">
                                {blockTypeToolbar.map(({ icon: Icon, label }, index) => (
                                    <Button key={index} variant="ghost" size="icon" title={label} className="h-8 w-8 text-text-muted hover:text-text-primary transition-all duration-150 hover:scale-105"><Icon size={18} /></Button>
                                ))}
                            </div>
                        </header>
                        <div ref={editorRef} className="flex-1 p-6 md:p-8 lg:px-24 overflow-y-auto bg-bg-primary relative" onDragOver={(e) => e.preventDefault()} >
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
                            {showSlashCommand && <SlashCommandMenu onSelect={handleSlashCommandSelect} position={slashCommandPosition} />} 
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center h-full text-center text-text-muted bg-bg-surface">
                        <p>Select a note to begin or create a new one.</p>
                    </div>
                )}
            </main>
        </div>
    );
}

export default Notes;
