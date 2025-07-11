import React, { useEffect, useMemo, useState, Fragment, useCallback, useRef } from 'react';
import { useNotesStore } from '../store';
import { Button, Text, Heading, Input } from '../../../components/ui';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '../../../components/ui/DropdownMenu';
import { FolderPlus, FilePlus, Search, MoreHorizontal, Edit, Trash2, Folder as FolderIcon, FileText as NoteIcon, ChevronRight, X } from 'lucide-react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, useDraggable, useDroppable } from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';


// A simple visual component for the drag preview
const NoteDragPreview = ({ note }: { note: any }) => (
    <div className="rounded-md p-2 text-sm font-medium bg-blue-200 text-blue-800 flex items-center gap-2 shadow-lg ring-2 ring-blue-500">
        <NoteIcon size={16} />
        <span>{note.title}</span>
    </div>
);


// Draggable Note Item
const DraggableNote = ({ note, children }: { note: any, children: React.ReactNode }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `note-${note.id}`,
        data: { type: 'note', note: note },
    });

    return (
        <div ref={setNodeRef} style={{ opacity: isDragging ? 0.5 : 1 }} {...listeners} {...attributes}>
            {children}
        </div>
    );
}

// Droppable Folder Item
const DroppableFolder = ({ folder, children }: { folder: any, children: React.ReactNode }) => {
    const { isOver, setNodeRef } = useDroppable({
        id: `folder-${folder.id}`,
        data: { type: 'folder', folderId: folder.id },
    });

    return (
        <div ref={setNodeRef} style={{ 
            backgroundColor: isOver ? 'rgba(0, 122, 255, 0.1)' : undefined, 
            borderRadius: '4px' 
        }}>
            {children}
        </div>
    );
}

export const Sidebar: React.FC = () => {
  const { folders, notes, selectedNoteId, selectedFolderId, fetchFolders, fetchNotes, createNote, createFolder, updateFolder, deleteFolder, updateNote, deleteNote, selectNote, selectFolder, isLoading, error } = useNotesStore();

  // Build tree structure for nested folders
  const folderTree = useMemo(() => {
    const map: Record<string, any> = {};
    folders.forEach(f => { map[f.id] = { ...f, children: [] }; });
    const roots: any[] = [];
    folders.forEach(f => {
      if (f.parentId) {
        map[f.parentId]?.children.push(map[f.id]);
      } else {
        roots.push(map[f.id]);
      }
    });
    return roots;
  }, [folders]);

  // Recursive renderer for nested folders
  const renderFolder = (folder: any, level: number): React.ReactNode => (
    <Fragment key={folder.id}>
      <li
        className={`group flex items-center justify-between rounded-md p-2 text-sm font-medium cursor-pointer ${selectedFolderId === folder.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-neutral-200 dark:hover:bg-neutral-800'}`}
        style={{ paddingLeft: `${level * 1}rem` }}
        onClick={() => selectFolder(folder.id)}
      >
        <div className="flex items-center gap-2">
          <FolderIcon size={16} />
          <Text>{folder.name}</Text>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
              <MoreHorizontal size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => { setRenamingFolderId(folder.id); setRenameFolderName(folder.name); }}>
              <Edit size={14} className="mr-2" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => deleteFolder(folder.id)} className="text-red-500">
              <Trash2 size={14} className="mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </li>
      {folder.children.map((child: any) => renderFolder(child, level + 1))}
    </Fragment>
  );

  const [showFolderInput, setShowFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameFolderName, setRenameFolderName] = useState('');
  const [renamingNoteId, setRenamingNoteId] = useState<string | null>(null);
  const [renameNoteTitle, setRenameNoteTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [activeId, setActiveId] = useState<string | null>(null);

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

  const sidebarRef = useRef<HTMLElement>(null);
  const [sidebarRect, setSidebarRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const updateRect = () => {
        if (sidebarRef.current) {
            setSidebarRect(sidebarRef.current.getBoundingClientRect());
        }
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, []);

  useEffect(() => {
    fetchFolders();
    fetchNotes();
  }, [fetchFolders, fetchNotes]);

  const filteredNotes = useMemo(() => {
    if (!searchQuery) {
      return notes.filter(note => note.folderId === selectedFolderId);
    }
    return notes.filter(note =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [notes, searchQuery, selectedFolderId]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    await createFolder({ name: newFolderName, parentId: null });
    setShowFolderInput(false);
    setNewFolderName('');
    await fetchFolders();
  };
  
  const handleCreateNote = async () => {
    // Create note in the selected folder, or at the root if no folder is selected.
    await createNote({ title: 'Untitled Note', content: '', folderId: selectedFolderId });
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

  return (
    <DndContext 
        sensors={sensors} 
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
    >
        <aside ref={sidebarRef} className="bg-neutral-100 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col h-full w-72 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Heading level={2}>Notes</Heading>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setShowFolderInput(true)} aria-label="New Folder">
                <FolderPlus size={18} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleCreateNote} aria-label="New Note">
                <FilePlus size={18} />
            </Button>
        </div>
      </div>
      
      {showFolderInput && (
        <div className="flex items-center gap-2 p-2 bg-neutral-200 dark:bg-neutral-800 rounded-md">
            <Input 
              placeholder="New folder name..." 
              className="flex-1"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              autoFocus
            />
            <Button variant="ghost" size="icon" onClick={handleCreateFolder}>Create</Button>
            <Button variant="ghost" size="icon" onClick={() => setShowFolderInput(false)}>
                <X size={18} />
            </Button>
        </div>
      )}

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <Input 
          placeholder="Search notes..." 
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && <X size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 cursor-pointer" onClick={() => setSearchQuery('')} />}
      </div>
      
      {isLoading && <Text variant="muted">Loading...</Text>}
      {error && <Text className="text-red-500">{error}</Text>}

      <div className="flex-1 overflow-y-auto space-y-4">
        <div>
          <Heading level={4} className="text-neutral-500 text-sm font-medium mb-2 px-2">Folders</Heading>
          <ul className="space-y-1">
            {/* Root-level notes bucket */}
            <li key="__root" className={`group flex items-center justify-between rounded-md p-2 text-sm font-medium cursor-pointer ${selectedFolderId === null ? 'bg-blue-100 text-blue-700' : 'hover:bg-neutral-200 dark:hover:bg-neutral-800'}`} onClick={() => selectFolder(null)}>
              <div className="flex items-center gap-2">
                <FolderIcon size={16} />
                <Text>All Notes</Text>
              </div>
            </li>
            {/* Nested folder hierarchy */}
            {folderTree.map(folder => (
              <DroppableFolder key={folder.id} folder={folder}>
                  {renderFolder(folder, 0)}
              </DroppableFolder>
            ))}
          </ul>
        </div>
        <div>
          <Heading level={4} className="text-neutral-500 text-sm font-medium mb-2 px-2">Notes</Heading>
          <ul className="space-y-1">
            {filteredNotes.map(note => (
              <DraggableNote key={note.id} note={note}>
                <li key={note.id} className={`group flex items-center justify-between rounded-md p-2 text-sm font-medium cursor-pointer ${selectedNoteId === note.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-neutral-200 dark:hover:bg-neutral-800'}`} onClick={() => selectNote(note.id)}>
                <div className="flex items-center gap-2">
                    <NoteIcon size={16} />
                    {renamingNoteId === note.id ? (
                        <Input value={renameNoteTitle} onChange={(e) => setRenameNoteTitle(e.target.value)} onBlur={handleRenameNote} onKeyDown={(e) => e.key === 'Enter' && handleRenameNote()} autoFocus />
                    ) : (
                        <Text>{note.title}</Text>
                    )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                      <MoreHorizontal size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onSelect={() => { setRenamingNoteId(note.id); setRenameNoteTitle(note.title); }}>
                      <Edit size={14} className="mr-2" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            <FolderIcon size={14} className="mr-2" /> Move to...
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                             <DropdownMenuItem onSelect={() => updateNote({ id: note.id, folderId: null })}>
                                <FolderIcon size={14} className="mr-2" /> All Notes (Root)
                            </DropdownMenuItem>
                            {folders.map(folder => (
                                <DropdownMenuItem key={folder.id} onSelect={() => updateNote({ id: note.id, folderId: folder.id })}>
                                    <FolderIcon size={14} className="mr-2" /> {folder.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuItem onSelect={() => deleteNote(note.id)} className="text-red-500">
                      <Trash2 size={14} className="mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            </DraggableNote>
            ))}
          </ul>
        </div>
      </div>
    </aside>

        <DragOverlay modifiers={[restrictToWindowEdges]}>
            {activeNote ? <NoteDragPreview note={activeNote} /> : null}
        </DragOverlay>
    </DndContext>
  );
}; 