import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNotesStore } from '../store';
import { Button, Text, Input, Card } from '../../../components/ui';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '../../../components/ui/DropdownMenu';
import { FolderPlus, FilePlus, Search, MoreHorizontal, Edit, Trash2, Folder as FolderIcon, FileText as NoteIcon, ChevronRight, X, FileDown, PanelLeft } from 'lucide-react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, useDraggable, useDroppable } from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import HTMLtoDOCX from 'html-to-docx';
import jsPDF from 'jspdf';
import { writeTextFile, writeFile } from '@tauri-apps/plugin-fs';
import { save } from '@tauri-apps/plugin-dialog';

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

const NoteDragPreview = ({ note }: { note: any }) => (
    <div className="rounded-md p-[var(--space-2)] text-sm font-medium bg-[var(--accent-soft)] text-[var(--accent-primary)] flex items-center gap-[var(--space-2)] shadow-lg ring-2 ring-[var(--accent-primary)]">
        <NoteIcon size={16} />
        <span>{note.title}</span>
    </div>
);

const DraggableNote = ({ note, children }: { note: any, children: React.ReactNode }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `note-${note.id}`,
        data: { type: 'note', note: note },
    });

    return (
        <div ref={setNodeRef} className={isDragging ? 'opacity-50' : ''} {...listeners} {...attributes}>
            {children}
        </div>
    );
}

const DroppableFolder = ({ folder, children }: { folder: any, children: React.ReactNode }) => {
    const { isOver, setNodeRef } = useDroppable({
        id: `folder-${folder.id}`,
        data: { type: 'folder', folderId: folder.id },
    });

    return (
        <div ref={setNodeRef} className={`rounded-md transition-all duration-200 ${isOver ? 'folder-drop-target' : ''}`}>
            {children}
        </div>
    );
}

const ForwardedCard = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof Card>>((props, ref) => (
  <Card {...props} ref={ref} />
));

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onToggle }) => {
  const { folders, notes, selectedNoteId, selectedFolderId, fetchFolders, fetchNotes, createNote, createFolder, updateFolder, deleteFolder, updateNote, deleteNote, selectNote, selectFolder, isLoading, error } = useNotesStore();
  
  const [expandedFolders, setExpandedFolders] = useState(new Set<string>());
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameFolderName, setRenameFolderName] = useState('');
  const [renamingNoteId, setRenamingNoteId] = useState<string | null>(null);
  const [renameNoteTitle, setRenameNoteTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  const sidebarRef = useRef<HTMLDivElement>(null);

  const toggleFolderExpansion = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const filteredNotes = useMemo(() => {
    if (!searchQuery) return notes;
    return notes.filter(note => 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (note.content as string).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [notes, searchQuery]);

  const dataTree = useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();

    // If there's a search query, just return a flat list of filtered notes
    if (searchQuery) {
        return notes
            .filter(note => note.title.toLowerCase().includes(lowerCaseQuery) || (note.content as string).toLowerCase().includes(lowerCaseQuery))
            .map(note => ({ ...note, type: 'note' }));
    }
    
    // Otherwise, build the folder tree structure
    const folderMap: Record<string, any> = {};
    folders.forEach(f => {
      folderMap[f.id] = { ...f, type: 'folder', children: [], notes: [] };
    });

    notes.forEach(n => {
      if (n.folderId && folderMap[n.folderId]) {
        folderMap[n.folderId].notes.push({ ...n, type: 'note' });
      }
    });

    const roots: any[] = [];
    Object.values(folderMap).forEach(f => {
      if (f.parentId && folderMap[f.parentId]) {
        folderMap[f.parentId].children.push(f);
      } else {
        roots.push(f);
      }
    });

    const rootNotes = notes
      .filter(n => !n.folderId)
      .map(n => ({ ...n, type: 'note' }));

    return [...roots, ...rootNotes];
  }, [folders, notes, searchQuery]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = useCallback((event: any) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;
    if (active.data.current?.type === 'note' && over?.data.current?.type === 'folder') {
        const noteId = active.data.current.note.id;
        const folderId = over.data.current.folderId;
        updateNote({ id: noteId, folderId });
    }
    setActiveId(null);
  }, [updateNote]);
  
  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const activeNote = useMemo(() => {
    return activeId ? notes.find(note => `note-${note.id}` === activeId) : null;
  }, [activeId, notes]);

  useEffect(() => {
    fetchFolders();
    fetchNotes();
  }, [fetchFolders, fetchNotes]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    await createFolder({ name: newFolderName, parentId: selectedFolderId });
    setShowFolderInput(false);
    setNewFolderName('');
    await fetchFolders();
  };
  
  const handleCreateNote = async () => {
    await createNote({ title: 'Untitled Note', content: '<p></p>', folderId: selectedFolderId });
    await fetchNotes();
  };

  const handleRenameFolder = async () => {
    if (!renamingFolderId || !renameFolderName.trim()) return;
    const folder = folders.find(f => f.id === renamingFolderId);
    if (folder) {
        await updateFolder({ ...folder, name: renameFolderName.trim() });
    }
    setRenamingFolderId(null);
    setRenameFolderName('');
  };
  
  const handleRenameNote = async () => {
    if (!renamingNoteId || !renameNoteTitle.trim()) return;
    const note = notes.find(n => n.id === renamingNoteId);
    if (note) {
        await updateNote({ ...note, title: renameNoteTitle.trim() });
    }
    setRenamingNoteId(null);
    setRenameNoteTitle('');
  };

  const exportNote = useCallback(async (noteId: string, format: 'pdf' | 'docx' | 'txt') => {
    const note = useNotesStore.getState().notes.find(n => n.id === noteId);
    if (!note) {
        console.error("Note not found for export");
        return;
    }
    
    const title = note.title || 'Untitled Note';
    const suggestedFilename = `${title.replace(/ /g, '_')}.${format}`;

    const filePath = await save({
        defaultPath: suggestedFilename,
        filters: [{ name: format.toUpperCase(), extensions: [format] }]
    });

    if (!filePath) return;

    if (format === 'txt') {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = note.content;
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        await writeTextFile(filePath, textContent);
    } else if (format === 'docx') {
        const blob = await HTMLtoDOCX(note.content, undefined, {
            footer: true,
            header: true,
            pageNumber: true,
        });
        const buffer = await blob.arrayBuffer();
        await writeFile(filePath, new Uint8Array(buffer));
    } else if (format === 'pdf') {
        const pdf = new jsPDF();
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = note.content;
        document.body.appendChild(tempDiv);
        
        pdf.html(tempDiv, {
            callback: async function (doc) {
                const pdfBuffer = doc.output('arraybuffer');
                await writeFile(filePath, new Uint8Array(pdfBuffer));
                document.body.removeChild(tempDiv);
            },
            x: 10,
            y: 10,
            width: 190,
            windowWidth: 800
        });
    }
}, []);

  const renderTree = (items: any[], level: number): React.ReactNode => {
    const paddingLeft = `${level * 1.5}rem`;

    return items.map(item => {
      if (item.type === 'folder') {
        const isExpanded = expandedFolders.has(item.id);
        return (
          <DroppableFolder key={item.id} folder={item}>
            <div
              className={`group flex items-center justify-between rounded-md p-[var(--space-2)] text-sm font-medium cursor-pointer ${selectedFolderId === item.id ? 'bg-[var(--accent-soft)] text-[var(--accent-primary)]' : 'hover:bg-[var(--bg-tertiary)]'}`}
              style={{ paddingLeft }}
            >
              <div className="flex items-center gap-[var(--space-2)] flex-1" onClick={() => selectFolder(item.id)}>
                <ChevronRight 
                  size={16} 
                  className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggleFolderExpansion(item.id); }}
                />
                <FolderIcon size={16} />
                <Text variant="body">{item.name}</Text>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 h-6 w-6">
                    <MoreHorizontal size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => { setRenamingFolderId(item.id); setRenameFolderName(item.name); }}>
                    <Edit size={14} className="mr-[var(--space-2)]" /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => deleteFolder(item.id)} className="text-[var(--error)]">
                    <Trash2 size={14} className="mr-[var(--space-2)]" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {isExpanded && (
              <div className="pl-[var(--space-4)]">
                {renderTree([...item.children, ...item.notes], level + 1)}
              </div>
            )}
          </DroppableFolder>
        );
      } else { // item.type === 'note'
        return (
          <DraggableNote key={item.id} note={item}>
            <Card 
              padding="sm"
              className={`cursor-pointer group relative ${selectedNoteId === item.id ? 'bg-[var(--accent-soft)] border-[var(--accent-primary)]' : 'hover:bg-[var(--bg-surface)]'}`} 
              onClick={() => selectNote(item.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-[var(--space-2)]">
                    <NoteIcon size={16} />
                    <Text weight="medium" variant="body">{item.title}</Text>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 h-6 w-6">
                      <MoreHorizontal size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onSelect={() => { setRenamingNoteId(item.id); setRenameNoteTitle(item.title); }}>
                      <Edit size={14} className="mr-[var(--space-2)]" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <FolderIcon size={14} className="mr-[var(--space-2)]" /> Move to
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        {folders.map(folder => (
                          <DropdownMenuItem key={folder.id} onSelect={() => updateNote({ ...item, folderId: folder.id })}>
                            <FolderIcon size={14} className="mr-[var(--space-2)]" /> {folder.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <FileDown size={14} className="mr-[var(--space-2)]" /> Export
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem onSelect={() => exportNote(item.id, 'pdf')}>PDF</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => exportNote(item.id, 'docx')}>DOCX</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => exportNote(item.id, 'txt')}>TXT</DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuItem onSelect={() => deleteNote(item.id)} className="text-[var(--error)]">
                      <Trash2 size={14} className="mr-[var(--space-2)]" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          </DraggableNote>
        );
      }
    });
  };

  // If closed, show only the toggle button
  if (!isOpen) {
    return (
      <Card className="w-16 h-full flex flex-col bg-[var(--bg-secondary)]/30" padding="none">
        <div 
          className="border-b border-[var(--border-default)] flex flex-col items-center"
          style={{ padding: 'var(--space-3)' }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            title="Show notes sidebar"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
            style={{ marginBottom: 'var(--space-2)' }}
          >
            <NoteIcon size={20} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => createNote({ title: 'Untitled Note', content: '<p></p>', folderId: selectedFolderId })}
            title="Create new note"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-ghost)]"
          >
            <FilePlus size={18} />
          </Button>
        </div>
        
        <div 
          className="flex-1 flex flex-col items-center"
          style={{ 
            paddingTop: 'var(--space-4)',
            gap: 'var(--space-2)'
          }}
        >
          {/* Show indicators for folders and notes */}
          <div 
            className="flex flex-col items-center"
            style={{ gap: 'var(--space-2)' }}
          >
            <div 
              title="Folders"
              className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--accent-ghost)] transition-colors cursor-pointer"
            >
              <FolderIcon size={14} />
            </div>
            
            <div 
              title="Notes"
              className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--accent-ghost)] transition-colors cursor-pointer"
            >
              <NoteIcon size={14} />
            </div>
          </div>
          
          {/* Notes count indicator */}
          <div 
            className="flex flex-col items-center mt-2"
            style={{ 
              gap: 'var(--space-1)',
              marginTop: 'var(--space-2)'
            }}
          >
            <div className="w-6 h-6 bg-[var(--accent-primary)] rounded-full flex items-center justify-center">
              <Text size="xs" weight="bold" className="text-white">
                {notes.length}
              </Text>
            </div>
            <Text size="xs" variant="tertiary" className="text-center">
              Notes
            </Text>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <ForwardedCard 
      className="w-[340px] flex-shrink-0 flex flex-col h-full"
      padding="default"
      ref={sidebarRef}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between border-b border-[var(--border-default)]"
        style={{ 
          padding: 'var(--space-4)',
          marginBottom: 'var(--space-4)'
        }}
      >
        <div className="flex items-center" style={{ gap: 'var(--space-2)' }}>
          <NoteIcon className="w-5 h-5 text-[var(--text-secondary)]" />
          <Text size="lg" weight="semibold">Notes</Text>
        </div>
        <div className="flex items-center gap-[var(--space-1)]">
          <Button onClick={() => setShowFolderInput(s => !s)} variant="ghost" size="icon" title="New Folder">
            <FolderPlus size={16} />
          </Button>
          {onToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              title="Hide notes sidebar"
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <PanelLeft size={18} />
            </Button>
          )}
        </div>
      </div>

      {/* Create Note Button */}
      <div className="mb-[var(--space-4)]">
        <Button
          onClick={handleCreateNote}
          variant="primary"
          className="w-full"
          size="default"
        >
          <FilePlus size={18} />
          Create Note
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-[var(--space-4)] flex-shrink-0">
        <Search size={16} className="absolute left-[var(--space-3)] top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <Input 
          type="search" 
          placeholder="Search notes..." 
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && <X size={16} className="absolute right-[var(--space-3)] top-1/2 -translate-y-1/2 text-[var(--text-muted)] cursor-pointer" onClick={() => setSearchQuery('')} />}
      </div>

      {showFolderInput && (
        <div className="flex items-center gap-[var(--space-2)] p-[var(--space-2)] bg-[var(--bg-tertiary)] rounded-md mb-[var(--space-4)]">
            <Input 
              placeholder="New folder name..." 
              className="flex-1"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              autoFocus
            />
            <Button variant="primary" size="sm" onClick={handleCreateFolder}>Create</Button>
            <Button variant="ghost" size="icon" onClick={() => setShowFolderInput(false)}>
                <X size={18} />
            </Button>
        </div>
      )}

      {/* Note & Folder List */}
      <div className="flex-1 overflow-y-auto pr-[var(--space-1)] space-y-[var(--space-1)]">
        {isLoading && <Text>Loading...</Text>}
        {error && <Text color="error">{error}</Text>}
        {!isLoading && !error && dataTree.length === 0 && searchQuery && (
            <Text variant="secondary" className="text-center p-[var(--space-4)]">No notes found.</Text>
        )}
        {!isLoading && !error && (
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel} modifiers={[restrictToWindowEdges]}>
            {renderTree(dataTree, 0)}
            <DragOverlay>
              {activeId && activeNote ? <NoteDragPreview note={activeNote} /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </ForwardedCard>
  );
}; 