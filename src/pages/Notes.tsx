// src/pages/Notes.tsx

import { useState, useRef, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui';
import { Input } from '../components/ui';
import { 
  Plus, Folder, Search,
  Heading1, Heading2, List, CheckSquare, Code2,
  PencilRuler,
  ChevronRight, ChevronDown, // Added for collapsibility
  Bold, Italic, Underline, Strikethrough,
  Image, Upload, X,
  MoreHorizontal
} from 'lucide-react';

// --- Data Structures for a Block Editor ---
interface Block {
  id: string;
  type: 'heading1' | 'heading2' | 'text' | 'list' | 'checklist' | 'code' | 'canvas' | 'image';
  content: string; // For text-based blocks
  metadata?: any; // For complex data like checklist status or canvas data
  formatting?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    indentLevel?: number;
  };
  imageUrl?: string; // For image blocks
  imageName?: string; // For image blocks
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
  parentId?: string; // Added for nesting
  notes: Note[];
  children?: Folder[]; // Optional: for easier rendering of nested structure
}

// --- Mock Data (Replace with API calls later) ---
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
          { id: 'b1', type: 'heading1', content: 'June 7th, 2025' },
          { id: 'b2', type: 'text', content: 'Today was a productive day. I managed to finalize the architecture for the LibreOllama notes page.' },
          { id: 'b3', type: 'checklist', content: 'Finalize 2-column layout|true\nImplement block editor|true\nAdd canvas block|false' },
        ]
      },
      { 
        id: 'note2', 
        title: 'Feature brainstorm', 
        folderId: 'personal',
        blocks: [
          { id: 'b4', type: 'heading2', content: 'New ideas for projects page' },
          { id: 'b5', type: 'text', content: 'Here is a quick sketch of the new project creation flow.' },
          { id: 'b6', type: 'canvas', content: 'Initial sketch of the wizard flow', metadata: { /* Canvas JSON data would go here */ } },
          { id: 'b7', type: 'text', content: 'We should also consider adding AI-generated summaries.' },
        ]
      },
    ],
  },
  {
    id: 'work',
    name: 'Work',
    notes: [
      {
        id: 'note3',
        title: 'Project alpha meeting notes',
        folderId: 'work',
        blocks: [{ id: 'b8', type: 'text', content: 'Discussed milestones for Q3.' }]
      }
    ]
  },
  {
    id: 'work-projects',
    name: 'Client Projects',
    parentId: 'work', // Nested under 'Work'
    notes: [
      {
        id: 'note4',
        title: 'Project beta - design specs',
        folderId: 'work-projects',
        blocks: [{ id: 'b9', type: 'text', content: 'Finalized UI mockups.' }]
      }
    ]
  },
  {
    id: 'recipes',
    name: 'Recipes',
    notes: []
  }
];

// Helper to build the nested structure for rendering
const buildFolderTree = (folders: Omit<Folder, 'children'>[]): Folder[] => {
  const folderMap = new Map<string, Folder>();
  const rootFolders: Folder[] = [];

  // Initialize map and add children array
  folders.forEach(f => {
    folderMap.set(f.id, { ...f, children: [], notes: [...f.notes] });
  });

  folderMap.forEach(folder => {
    if (folder.parentId && folderMap.has(folder.parentId)) {
      folderMap.get(folder.parentId)!.children!.push(folder);
    } else {
      rootFolders.push(folder);
    }
  });

  return rootFolders;
};

// --- End Mock Data ---

// Recursive function to render folder tree
const renderFolderTree = (
  folderList: Folder[], 
  level: number, 
  selectedNoteId: string | null,
  setSelectedNoteId: (id: string) => void,
  expandedFolders: Record<string, boolean>,
  toggleFolder: (folderId: string) => void
) => {
  return folderList.map(folder => {
    const isExpanded = expandedFolders[folder.id] ?? true; // Default to expanded
    return (
    <div key={folder.id} className="mb-3">
      <h3 
        className="flex items-center gap-3 px-3 py-2 mb-1 text-sm font-semibold text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-bg-secondary rounded-md transition-colors"
        style={{ marginLeft: `${level * 20}px` }}
        onClick={() => toggleFolder(folder.id)}
      >
        {isExpanded ? <ChevronDown size={16} className="text-text-muted" /> : <ChevronRight size={16} className="text-text-muted" />}
        <Folder size={16} className="text-text-muted" /> 
        <span className="flex-1">{folder.name}</span>
        {/* Placeholder for folder actions (e.g., add note/folder here) */}
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); alert(`Add to ${folder.name}`); }}>
          <Plus size={14} className="text-text-muted" />
        </Button>
      </h3>
      {isExpanded && (
        <>
          <ul className="space-y-1">
        {folder.notes.map(note => (
          <li key={note.id}>
            <a
              href="#" 
              onClick={(e) => { e.preventDefault(); setSelectedNoteId(note.id); }}
              className={`block py-2 px-4 rounded-md truncate text-base font-medium transition-colors
                ${selectedNoteId === note.id 
                  ? 'bg-accent-soft text-primary'
                  : 'text-text-primary hover:bg-bg-secondary hover:text-text-primary'}`}
              style={{ marginLeft: `${(level + 1) * 20}px` }}
            >
              {note.title}
            </a>
          </li>
        ))}
      </ul>
          {folder.children && folder.children.length > 0 && (
            <div className="mt-2">
              {renderFolderTree(folder.children, level + 1, selectedNoteId, setSelectedNoteId, expandedFolders, toggleFolder)}
            </div>
          )}
        </>
      )}
    </div>
  );});
};


// A helper component to render different block types with rich text editing
const BlockRenderer = ({ 
  block, 
  isEditing, 
  onEdit, 
  onSave, 
  onFormat, 
  onImageUpload,
  onCreateBlock 
}: { 
  block: Block;
  isEditing: boolean;
  onEdit: (blockId: string) => void;
  onSave: (blockId: string, content: string, formatting?: Block['formatting']) => void;
  onFormat: (blockId: string, formatType: 'bold' | 'italic' | 'underline' | 'strikethrough') => void;
  onImageUpload: (blockId: string, file: File) => void;
  onCreateBlock?: (afterBlockId: string, type: Block['type']) => void;
}) => {
  const textRef = useRef<HTMLDivElement>(null);
  // Handle keyboard shortcuts for formatting
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          onFormat(block.id, 'bold');
          break;
        case 'i':
          e.preventDefault();
          onFormat(block.id, 'italic');
          break;
        case 'u':
          e.preventDefault();
          onFormat(block.id, 'underline');
          break;        case 'Enter':
          e.preventDefault();
          if (e.shiftKey) {
            // Shift+Enter: Add a line break
            const selection = window.getSelection();
            if (selection?.rangeCount) {
              const range = selection.getRangeAt(0);
              const br = document.createElement('br');
              range.insertNode(br);
              range.setStartAfter(br);
              range.setEndAfter(br);
              selection.removeAllRanges();
              selection.addRange(range);
            }
          } else {
            // Regular Enter: Exit editing mode and potentially create new block
            onEdit('');
            if (onCreateBlock) {
              onCreateBlock(block.id, 'text');
            }
          }
          break;
      }
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        // Decrease indent
        const currentIndent = block.formatting?.indentLevel || 0;
        if (currentIndent > 0) {
          onSave(block.id, block.content, { 
            ...block.formatting, 
            indentLevel: currentIndent - 1 
          });
        }
      } else {
        // Increase indent
        const currentIndent = block.formatting?.indentLevel || 0;
        onSave(block.id, block.content, { 
          ...block.formatting, 
          indentLevel: currentIndent + 1 
        });
      }
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onEdit(''); // Exit editing mode
    }
  }, [block, onFormat, onSave, onEdit]);

  // Apply text formatting styles
  const getTextStyles = () => {
    const styles: React.CSSProperties = {};
    if (block.formatting?.bold) styles.fontWeight = 'bold';
    if (block.formatting?.italic) styles.fontStyle = 'italic';
    if (block.formatting?.underline) styles.textDecoration = 'underline';
    if (block.formatting?.strikethrough) {
      styles.textDecoration = styles.textDecoration 
        ? `${styles.textDecoration} line-through` 
        : 'line-through';
    }
    const indentLevel = block.formatting?.indentLevel || 0;
    styles.marginLeft = `${indentLevel * 2}rem`;
    return styles;
  };  // Handle text selection for formatting
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && isEditing) {
      const range = selection.getRangeAt(0);
      if (range.startOffset !== range.endOffset) {
        // Text is selected, show formatting toolbar
        // TODO: Implement floating toolbar functionality
        console.log('Text selected for formatting:', {
          blockId: block.id,
          start: range.startOffset,
          end: range.endOffset
        });
      }
    }
  };

  switch (block.type) {
    case 'heading1':
      return isEditing ? (
        <div className="relative group">
          <input
            type="text"
            defaultValue={block.content}
            className="text-4xl font-bold mb-6 mt-8 text-text-primary w-full bg-transparent border-none outline-none focus:ring-2 focus:ring-primary/50 rounded px-2"
            onKeyDown={handleKeyDown}
            onBlur={(e) => onSave(block.id, e.target.value)}
            autoFocus
          />
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" onClick={() => onEdit('')}>
              <X size={16} />
            </Button>
          </div>
        </div>
      ) : (
        <h1 
          className="text-4xl font-bold mb-6 mt-8 text-text-primary cursor-pointer hover:bg-accent-soft/20 rounded px-2 transition-colors"
          onClick={() => onEdit(block.id)}
          style={getTextStyles()}
        >
          {block.content}
        </h1>
      );

    case 'heading2':
      return isEditing ? (
        <div className="relative group">
          <input
            type="text"
            defaultValue={block.content}
            className="text-3xl font-bold mb-4 mt-6 text-text-primary w-full bg-transparent border-none outline-none focus:ring-2 focus:ring-primary/50 rounded px-2"
            onKeyDown={handleKeyDown}
            onBlur={(e) => onSave(block.id, e.target.value)}
            autoFocus
          />
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" onClick={() => onEdit('')}>
              <X size={16} />
            </Button>
          </div>
        </div>
      ) : (
        <h2 
          className="text-3xl font-bold mb-4 mt-6 text-text-primary cursor-pointer hover:bg-accent-soft/20 rounded px-2 transition-colors"
          onClick={() => onEdit(block.id)}
          style={getTextStyles()}
        >
          {block.content}
        </h2>
      );

    case 'text':
      return isEditing ? (
        <div className="relative group">
          <div
            ref={textRef}
            contentEditable
            className="text-lg leading-relaxed my-5 text-text-primary outline-none focus:ring-2 focus:ring-primary/50 rounded px-2 py-1 min-h-[2rem]"
            style={getTextStyles()}
            onKeyDown={handleKeyDown}
            onMouseUp={handleTextSelection}
            onBlur={(e) => onSave(block.id, e.currentTarget.textContent || '')}
            suppressContentEditableWarning={true}
            dangerouslySetInnerHTML={{ __html: block.content }}
          />          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/90 backdrop-blur-sm rounded-md p-1 shadow-lg border border-border-subtle">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onFormat(block.id, 'bold')} 
              title="Bold (Ctrl+B)" 
              className={`h-8 w-8 ${block.formatting?.bold ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}`}
            >
              <Bold size={14} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onFormat(block.id, 'italic')} 
              title="Italic (Ctrl+I)" 
              className={`h-8 w-8 ${block.formatting?.italic ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}`}
            >
              <Italic size={14} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onFormat(block.id, 'underline')} 
              title="Underline (Ctrl+U)" 
              className={`h-8 w-8 ${block.formatting?.underline ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}`}
            >
              <Underline size={14} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onFormat(block.id, 'strikethrough')} 
              title="Strikethrough" 
              className={`h-8 w-8 ${block.formatting?.strikethrough ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}`}
            >
              <Strikethrough size={14} />
            </Button>
            <div className="w-px bg-border-subtle mx-1"></div>
            <Button variant="ghost" size="icon" onClick={() => onEdit('')} title="Done editing (Ctrl+Enter)" className="h-8 w-8 hover:bg-red-500/10 hover:text-red-600">
              <X size={14} />
            </Button>
          </div>
        </div>
      ) : (
        <p 
          className="text-lg leading-relaxed my-5 text-text-primary cursor-pointer hover:bg-accent-soft/20 rounded px-2 py-1 transition-colors"
          onClick={() => onEdit(block.id)}
          style={getTextStyles()}
        >
          {block.content}
        </p>
      );

    case 'image':
      return (
        <div className="my-8 group relative">
          <div 
            className="border-2 border-dashed border-border hover:border-primary hover:bg-accent-soft/50 transition-colors duration-200 rounded-lg"
            onDrop={(e) => {
              e.preventDefault();
              const files = Array.from(e.dataTransfer.files);
              const imageFile = files.find(file => file.type.startsWith('image/'));
              if (imageFile) {
                onImageUpload(block.id, imageFile);
              }
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            {block.imageUrl ? (
              <div className="relative">
                <img 
                  src={block.imageUrl} 
                  alt={block.imageName || 'Note image'} 
                  className="w-full max-w-2xl mx-auto rounded-lg"
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="bg-black/50 text-white">
                    <MoreHorizontal size={16} />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-10 text-center">
                <Image size={48} className="text-text-tertiary mb-5" />
                <h4 className="text-xl font-semibold text-text-primary mb-2">Add Image</h4>
                <p className="text-base text-text-secondary mb-6">Drag and drop an image or click to upload</p>
                <Button 
                  variant="secondary" 
                  size="default"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        onImageUpload(block.id, file);
                      }
                    };
                    input.click();
                  }}
                >
                  <Upload size={16} className="mr-2" />
                  Choose Image
                </Button>
              </div>
            )}
          </div>
        </div>
      );

    case 'checklist':
      return (
        <div className="space-y-3 my-5">
          {block.content.split('\n').map((item, index) => {
            const [text, checked] = item.split('|');
            return (
              <div key={index} className="flex items-center gap-4">
                <input type="checkbox" defaultChecked={checked === 'true'} className="w-5 h-5 rounded text-primary focus:ring-primary" />
                <label className={`text-lg ${checked === 'true' ? 'line-through text-text-secondary' : 'text-text-primary'}`}>{text}</label>
              </div>
            );
          })}
        </div>
      );

    case 'canvas':
      return (
        <Card className="my-8 border-2 border-dashed border-border hover:border-primary hover:bg-accent-soft/50 transition-colors duration-200">
          <div className="flex flex-col items-center justify-center p-10 text-center">
            <PencilRuler size={48} className="text-text-tertiary mb-5" />
            <h4 className="text-xl font-semibold text-text-primary mb-2">Embedded sketch</h4>
            <p className="text-base text-text-secondary mb-6">{block.content}</p>
            <Button variant="secondary" size="default">Edit sketch</Button>
          </div>
        </Card>
      );

    default:
      return <p className="text-lg text-text-primary">{block.content}</p>;
  }
};


export function Notes() {
  // const { setHeaderProps } = useHeader(); // useHeader is not used
  const [folders, setFolders] = useState<Folder[]>(buildFolderTree(mockFoldersData));
  const [selectedNoteId, setSelectedNoteId] = useState<string>('note2');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  
  // Rich text editing state
  const [isEditingBlock, setIsEditingBlock] = useState<string | null>(null);
  
  // File upload refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Rich text editing handlers
  const handleBlockEdit = useCallback((blockId: string) => {
    setIsEditingBlock(blockId || null);
  }, []);

  const handleBlockSave = useCallback((blockId: string, content: string, formatting?: Block['formatting']) => {
    setFolders(prevFolders => {
      const updateBlockInFolders = (folders: Folder[]): Folder[] => {
        return folders.map(folder => ({
          ...folder,
          notes: folder.notes.map(note => ({
            ...note,
            blocks: note.blocks.map(block => 
              block.id === blockId 
                ? { ...block, content, formatting: formatting || block.formatting }
                : block
            )
          })),
          children: folder.children ? updateBlockInFolders(folder.children) : undefined
        }));
      };
      return updateBlockInFolders(prevFolders);
    });
    setIsEditingBlock(null);
  }, []);

  const handleBlockFormat = useCallback((blockId: string, formatType: 'bold' | 'italic' | 'underline' | 'strikethrough') => {
    setFolders(prevFolders => {
      const updateBlockInFolders = (folders: Folder[]): Folder[] => {
        return folders.map(folder => ({
          ...folder,
          notes: folder.notes.map(note => ({
            ...note,
            blocks: note.blocks.map(block => {
              if (block.id === blockId) {
                const currentFormatting = block.formatting || {};
                return {
                  ...block,
                  formatting: {
                    ...currentFormatting,
                    [formatType]: !currentFormatting[formatType]
                  }
                };
              }
              return block;
            })
          })),
          children: folder.children ? updateBlockInFolders(folder.children) : undefined
        }));
      };
      return updateBlockInFolders(prevFolders);
    });
  }, []);

  const handleImageUpload = useCallback((blockId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setFolders(prevFolders => {
        const updateBlockInFolders = (folders: Folder[]): Folder[] => {
          return folders.map(folder => ({
            ...folder,
            notes: folder.notes.map(note => ({
              ...note,
              blocks: note.blocks.map(block => 
                block.id === blockId 
                  ? { ...block, imageUrl, imageName: file.name }
                  : block
              )
            })),
            children: folder.children ? updateBlockInFolders(folder.children) : undefined
          }));
        };
        return updateBlockInFolders(prevFolders);
      });
    };
    reader.readAsDataURL(file);
  }, []);

  const handleCreateBlock = useCallback((afterBlockId: string, type: Block['type']) => {
    const newBlockId = `b${Date.now()}`;
    setFolders(prevFolders => {
      const updateBlockInFolders = (folders: Folder[]): Folder[] => {
        return folders.map(folder => ({
          ...folder,
          notes: folder.notes.map(note => ({
            ...note,
            blocks: note.blocks.reduce((acc: Block[], block) => {
              acc.push(block);
              if (block.id === afterBlockId) {
                acc.push({
                  id: newBlockId,
                  type,
                  content: '',
                  formatting: {}
                });
              }
              return acc;
            }, [])
          })),
          children: folder.children ? updateBlockInFolders(folder.children) : undefined
        }));
      };
      return updateBlockInFolders(prevFolders);
    });
    // Auto-focus the new block
    setTimeout(() => setIsEditingBlock(newBlockId), 10);
  }, []);

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

  const allNotes = getNotesFromFolders(folders);
  const selectedNote = allNotes.find(n => n.id === selectedNoteId);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const blockTypeToolbar = [
    { icon: Heading1, label: "H1" }, { icon: Heading2, label: "H2" }, { icon: List, label: "List" },
    { icon: CheckSquare, label: "Checklist" }, { icon: Code2, label: "Code" }, 
    { icon: PencilRuler, label: "Sketch" } // FEATURE: Add Sketch button
  ];
  return (
    <div className="flex h-full bg-background gap-4 p-4"> {/* Root element with gap and padding */}
      {/* PANE 1: Navigation Sidebar */}
      <aside className="w-[380px] flex-shrink-0 border border-border-subtle rounded-xl p-6 flex flex-col bg-surface shadow-sm"> {/* Added border, rounded corners, and shadow */}
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h1 className="text-2xl font-semibold text-text-primary">Notes</h1>
          {/* Placeholder for New Item buttons - to be improved with modals/dropdowns */}
          <div className="flex gap-3">
            <Button variant="secondary" size="default" onClick={() => alert('New Folder clicked - implement functionality')}>
              <Folder size={18} className="mr-2" /> New folder
            </Button>
            <Button variant="primary" size="default" onClick={() => alert('New Note clicked - implement functionality')}>
              <Plus size={18} className="mr-2" /> New note
            </Button>
          </div>
        </div>
        <div className="relative mb-6 flex-shrink-0">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input type="search" placeholder="Search all notes..." className="pl-10 text-base" />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          {renderFolderTree(folders, 0, selectedNoteId, setSelectedNoteId, expandedFolders, toggleFolder)}
        </nav>
      </aside>

      {/* PANE 2: The Block Editor */}
      <main className="flex-1 flex flex-col overflow-hidden border border-border-subtle rounded-xl shadow-sm"> {/* Added border, rounded corners, and shadow */}
        {selectedNote ? (
          <>
            <header className="p-6 border-b border-border-subtle flex items-center justify-between flex-shrink-0 bg-surface rounded-t-xl"> {/* Added rounded top corners */}
              <Input 
                type="text" 
                defaultValue={selectedNote.title} 
                className="text-xl font-semibold bg-transparent focus:ring-0 border-0 text-text-primary w-full p-0 h-auto focus-visible:ring-offset-0 focus-visible:ring-0"
              />
              <div className="flex items-center gap-2 bg-bg-secondary p-2 rounded-lg">
                {blockTypeToolbar.map(({ icon: Icon, label }, index) => (
                  <Button 
                    key={index} 
                    variant="ghost"
                    size="icon"
                    title={label} 
                    className="h-10 w-10 text-text-muted hover:text-text-primary transition-all duration-150 hover:scale-105"
                  >
                    <Icon size={20} />
                  </Button>
                ))}
              </div>
            </header>
            <div className="flex-1 p-8 md:p-10 lg:px-28 overflow-y-auto bg-bg-primary gap-6 rounded-b-xl"> {/* Changed background for visual separation and added gap + rounded bottom corners */}
              <div className="max-w-4xl mx-auto space-y-4">
                {selectedNote.blocks.map(block => (
                  <BlockRenderer 
                    key={block.id} 
                    block={block}
                    isEditing={isEditingBlock === block.id}
                    onEdit={handleBlockEdit}
                    onSave={handleBlockSave}
                    onFormat={handleBlockFormat}
                    onImageUpload={handleImageUpload}
                    onCreateBlock={handleCreateBlock}
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center h-full text-center text-text-muted bg-background rounded-xl"> {/* Added rounded corners */}
            <div>
              <p className="text-lg">Select a note to begin or create a new one.</p>
            </div>
          </div>
        )}
      </main>
      
      {/* Hidden file input for image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && isEditingBlock) {
            handleImageUpload(isEditingBlock, file);
          }
        }}
      />
    </div>
  );
}

export default Notes;