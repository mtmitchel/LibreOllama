// src/pages/Notes.tsx

import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui';
import { Input } from '../components/ui';
import { 
  Plus, Folder, Search,
  Heading1, Heading2, List, CheckSquare, Code2,
  PencilRuler,
  ChevronRight, ChevronDown // Added for collapsibility
} from 'lucide-react';

// --- Data Structures for a Block Editor ---
interface Block {
  id: string;
  type: 'heading1' | 'heading2' | 'text' | 'list' | 'checklist' | 'code' | 'canvas';
  content: string; // For text-based blocks
  metadata?: any; // For complex data like checklist status or canvas data
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
    <div key={folder.id} style={{ marginLeft: `${level * 16}px` }} className="mb-2">
      <h3 
        className="flex items-center gap-2 px-2 py-1 mb-0.5 text-xs font-semibold text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-bg-secondary rounded-md"
        onClick={() => toggleFolder(folder.id)}
      >
        {isExpanded ? <ChevronDown size={14} className="text-text-muted" /> : <ChevronRight size={14} className="text-text-muted" />}
        <Folder size={14} className="text-text-muted" /> 
        {folder.name}
        {/* Placeholder for folder actions (e.g., add note/folder here) */}
        <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={() => alert(`Add to ${folder.name}`)}>
          <Plus size={12} className="text-text-muted" />
        </Button>
      </h3>
      {isExpanded && (
        <>
          <ul className="space-y-0.5">
        {folder.notes.map(note => (
          <li key={note.id}>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); setSelectedNoteId(note.id); }}
              className={`block p-2 rounded-md truncate text-sm font-medium transition-colors
                ${selectedNoteId === note.id 
                  ? 'bg-accent-soft text-primary'
                  : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'}`}
              style={{ paddingLeft: `${16 + (level > 0 ? 8 : 0)}px` }} // Indent notes slightly more if in a subfolder
            >
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
  );});
};


// A helper component to render different block types
const BlockRenderer = ({ block }: { block: Block }) => {
  switch (block.type) {
    case 'heading1':
      return <h1 className="text-3xl font-bold mb-4 mt-6">{block.content}</h1>;
    case 'heading2':
        return <h2 className="text-2xl font-bold mb-3 mt-4">{block.content}</h2>;
    case 'text':
      return <p className="leading-relaxed my-4">{block.content}</p>;
    case 'checklist':
      return (
        <div className="space-y-2 my-4">
          {block.content.split('\n').map((item, index) => {
            const [text, checked] = item.split('|');
            return (
              <div key={index} className="flex items-center gap-3">
                <input type="checkbox" defaultChecked={checked === 'true'} className="w-4 h-4 rounded text-primary focus:ring-primary" />
                <label className={checked === 'true' ? 'line-through text-muted-foreground' : ''}>{text}</label>
              </div>
            );
          })}
        </div>
      );
    // FEATURE: The new Canvas Block component
    case 'canvas':
      return (        <Card className="my-6 border-2 border-dashed border-border">
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <PencilRuler size={32} className="text-muted-foreground mb-4" />
            <h4 className="font-semibold text-foreground">Embedded sketch</h4>
            <p className="text-sm text-muted-foreground mb-4">{block.content}</p>
            <Button variant="secondary" size="sm">Edit sketch</Button>
          </div>
        </Card>
      );
    default:
      return <p>{block.content}</p>;
  }
};


export function Notes() {
  // const { setHeaderProps } = useHeader(); // useHeader is not used
  const [folders, setFolders] = useState<Folder[]>(buildFolderTree(mockFoldersData));
  const [selectedNoteId, setSelectedNoteId] = useState<string>('note2');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [newFolderName, setNewFolderName] = useState('');
  const [newNoteName, setNewNoteName] = useState('');
  const [parentFolderForNewItem, setParentFolderForNewItem] = useState<string | undefined>(undefined);

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
    <div className="flex h-full bg-background"> {/* Root element as per guide */}
      {/* PANE 1: Navigation Sidebar */}
      <aside className="w-[340px] flex-shrink-0 border-r border-border-subtle p-4 flex flex-col bg-surface">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h1 className="text-xl font-semibold text-text-primary">Notes</h1>
          {/* Placeholder for New Item buttons - to be improved with modals/dropdowns */}
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => alert('New Folder clicked - implement functionality')}>
              <Folder size={16} className="mr-1.5" /> New folder
            </Button>
            <Button variant="default" size="sm" onClick={() => alert('New Note clicked - implement functionality')}>
              <Plus size={16} className="mr-1.5" /> New note
            </Button>
          </div>
        </div>
        <div className="relative mb-4 flex-shrink-0">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input type="search" placeholder="Search all notes..." className="pl-9" />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          {renderFolderTree(folders, 0, selectedNoteId, setSelectedNoteId, expandedFolders, toggleFolder)}
        </nav>
      </aside>

      {/* PANE 2: The Block Editor */}
      <main className="flex-1 flex flex-col overflow-hidden"> {/* Added overflow-hidden */}
        {selectedNote ? (
          <>
            <header className="p-4 border-b border-border-subtle flex items-center justify-between flex-shrink-0 bg-surface">
              <Input 
                type="text" 
                defaultValue={selectedNote.title} 
                className="text-lg font-semibold bg-transparent focus:ring-0 border-0 text-text-primary w-full p-0 h-auto focus-visible:ring-offset-0 focus-visible:ring-0"
              />
              <div className="flex items-center gap-1 bg-bg-secondary p-1 rounded-md">
                {blockTypeToolbar.map(({ icon: Icon, label }, index) => (
                  <Button 
                    key={index} 
                    variant="ghost"
                    size="icon"
                    title={label} 
                    className="h-8 w-8 text-text-muted hover:text-text-primary"
                  >
                    <Icon size={18} />
                  </Button>
                ))}
              </div>
            </header>
            <div className="flex-1 p-6 md:p-8 lg:px-24 overflow-y-auto bg-background"> {/* Adjusted padding as per guide */}
              <div className="max-w-3xl mx-auto">
                {selectedNote.blocks.map(block => <BlockRenderer key={block.id} block={block} />)}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center h-full text-center text-text-muted bg-background">
            <p>Select a note to begin or create a new one.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default Notes;