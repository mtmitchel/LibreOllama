import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNotesStore } from '../store';
import { Button, Text, Input, Card, Heading, Toast } from '../../../components/ui';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '../../../components/ui/DropdownMenu';
import { FolderPlus, FilePlus, Search, MoreHorizontal, Edit, Trash2, Folder as FolderIcon, FileText as NoteIcon, ChevronRight, X, FileDown, PanelLeft } from 'lucide-react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, useDraggable, useDroppable, DragStartEvent } from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import * as HTMLtoDOCX from 'html-to-docx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { writeTextFile, writeFile } from '@tauri-apps/plugin-fs';
import { save } from '@tauri-apps/plugin-dialog';
import { blocksToHtml, blocksToText } from '../utils/blocksToHtml';
import { useNotifications } from '../hooks/useNotifications';

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
  onSelectNote: (noteId: string | null) => void;
  onCreateNote: () => void;
}

const NoteDragPreview = ({ note }: { note: { title: string } }) => (
    <div className="ring-accent-primary flex items-center gap-2 rounded-md bg-accent-soft p-2 text-sm font-medium text-accent-primary shadow-lg ring-2">
        <NoteIcon size={16} />
        <span>{note.title}</span>
    </div>
);

const DraggableNote = ({ note, children }: { note: { id: string }, children: React.ReactNode }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `note-${note.id}`,
        data: { type: 'note', note: note },
    });

    return (
        <div 
            ref={setNodeRef} 
            className={`${isDragging ? 'opacity-50' : ''} min-h-[40px]`} 
            {...listeners} 
            {...attributes}
            style={{ minWidth: '100%' }}
        >
            {children}
        </div>
    );
}

const DroppableFolder = ({ folder, children }: { folder: { id: string }, children: React.ReactNode }) => {
    const { isOver, setNodeRef } = useDroppable({
        id: `folder-${folder.id}`,
        data: { type: 'folder', folderId: folder.id },
    });

    return (
        <div 
            ref={setNodeRef} 
            className={`rounded-md transition-all duration-200 min-h-[40px] ${isOver ? 'folder-drop-target bg-accent-soft' : ''}`}
            style={{ minWidth: '100%' }}
        >
            {children}
        </div>
    );
}

const ForwardedCard = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof Card>>((props, ref) => (
  <div {...props} ref={ref} />
));
ForwardedCard.displayName = 'ForwardedCard';

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onToggle, onSelectNote, onCreateNote }) => {
  const { folders, notes, selectedNoteId, selectedFolderId, fetchFolders, fetchNotes, createNote, createFolder, updateFolder, deleteFolder, updateNote, deleteNote, selectFolder } = useNotesStore();
  
  
  const [expandedFolders, setExpandedFolders] = useState(new Set<string>());
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameFolderName, setRenameFolderName] = useState('');
  const [renamingNoteId, setRenamingNoteId] = useState<string | null>(null);
  const [renameNoteTitle, setRenameNoteTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

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
        return filteredNotes.map(note => ({ ...note, type: 'note' }));
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

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(async (event: any) => {
    const { active, over } = event;
    if (active.data.current?.type === 'note' && over?.data.current?.type === 'folder') {
        const noteId = active.data.current.note.id;
        const folderId = over.data.current.folderId;
        
        console.log(`🔄 Drag & drop: Moving note ${noteId} to folder ${folderId}`);
        try {
          await updateNote({ id: noteId, folderId: folderId.toString() });
          console.log('✅ Drag & drop move completed');
          
          // Use custom notification
          const event = new CustomEvent('app-notification', {
            detail: { type: 'success', message: 'Note moved successfully' }
          });
          window.dispatchEvent(event);
          
          // Refresh notes to ensure consistency
          await fetchNotes();
        } catch (error) {
          console.error('❌ Drag & drop move failed:', error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          const event = new CustomEvent('app-notification', {
            detail: { type: 'error', message: `Failed to move note: ${errorMessage}` }
          });
          window.dispatchEvent(event);
        }
    }
    setActiveId(null);
  }, [updateNote, fetchNotes]);
  
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

  useEffect(() => {
    const handleNotification = (event: CustomEvent) => {
      setNotification(event.detail);
      
      // Auto-hide notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    };

    window.addEventListener('app-notification', handleNotification as EventListener);
    
    return () => {
      window.removeEventListener('app-notification', handleNotification as EventListener);
    };
  }, []);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    // Always create folders at root level (parentId: null)
    await createFolder({ name: newFolderName, parentId: null });
    setShowFolderInput(false);
    setNewFolderName('');
    await fetchFolders();
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
    console.log(`🔄 Starting export of note ${noteId} as ${format}`);
    
    // Add debug alert to confirm function is called
    console.log('Export function called with:', { noteId, format });
    
    // Show immediate feedback
    const event = new CustomEvent('app-notification', {
      detail: { type: 'info', message: `Starting ${format.toUpperCase()} export...` }
    });
    window.dispatchEvent(event);
    
    const note = notes.find(n => n.id === noteId);
    if (!note) {
        console.error("❌ Note not found for export:", noteId);
        console.error('Available notes:', notes.map(n => ({ id: n.id, title: n.title })));
        // Use a more reliable notification method
        const event = new CustomEvent('app-notification', {
          detail: { type: 'error', message: `Note not found for export: ${noteId}` }
        });
        window.dispatchEvent(event);
        return;
    }
    
    console.log('📝 Found note:', note.title, 'Content length:', note.content.length);
    
    const title = note.title || 'Untitled Note';
    const suggestedFilename = `${title.replace(/ /g, '_')}.${format}`;

    try {
      console.log('💾 Opening file dialog...');
      const filePath = await save({
          defaultPath: suggestedFilename,
          filters: [{ name: format.toUpperCase(), extensions: [format] }]
      });

      if (!filePath) {
          console.log('❌ User cancelled file dialog');
          const event = new CustomEvent('app-notification', {
            detail: { type: 'info', message: 'Export cancelled' }
          });
          window.dispatchEvent(event);
          return;
      }
      
      console.log('📁 User selected file path:', filePath);

      if (format === 'txt') {
          console.log('📄 Converting to text...');
          const textContent = blocksToText(note.content);
          console.log('✅ Text conversion complete, writing file...');
          await writeTextFile(filePath, textContent);
          console.log('✅ TXT export completed successfully');
      } else if (format === 'docx') {
          console.log('📄 Converting to HTML for DOCX...');
          const htmlContent = blocksToHtml(note.content);
          console.log('✅ HTML conversion complete, generating DOCX...');
          const docxData = await HTMLtoDOCX(htmlContent);
          console.log('✅ DOCX generation complete, writing file...');
          await writeFile(filePath, new Uint8Array(docxData));
          console.log('✅ DOCX export completed successfully');
      } else if (format === 'pdf') {
          console.log('📄 Converting to HTML for PDF...');
          const htmlContent = blocksToHtml(note.content);
          console.log('✅ HTML conversion complete, generating PDF...');
          
          // Create a temporary div to render HTML for PDF generation
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = htmlContent;
          tempDiv.style.padding = '40px';
          tempDiv.style.fontFamily = 'Arial, sans-serif';
          tempDiv.style.lineHeight = '1.6';
          tempDiv.style.position = 'absolute';
          tempDiv.style.left = '-9999px';
          document.body.appendChild(tempDiv);
          
          try {
            const canvas = await html2canvas(tempDiv);
            document.body.removeChild(tempDiv);
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF();
            const imgWidth = 210;
            const pageHeight = 295;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            
            let position = 0;
            
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
            
            while (heightLeft >= 0) {
              position = heightLeft - imgHeight;
              pdf.addPage();
              pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
              heightLeft -= pageHeight;
            }
            
            const pdfData = pdf.output('arraybuffer');
            await writeFile(filePath, new Uint8Array(pdfData));
            console.log('✅ PDF export completed successfully');
          } catch (pdfError) {
            document.body.removeChild(tempDiv);
            throw pdfError;
          }
      }
      
      // Show success notification
      const successEvent = new CustomEvent('app-notification', {
        detail: { type: 'success', message: `${format.toUpperCase()} export completed successfully!` }
      });
      window.dispatchEvent(successEvent);
      
    } catch (error) {
      console.error(`❌ Export failed for ${format}:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorEvent = new CustomEvent('app-notification', {
        detail: { type: 'error', message: `Export failed: ${errorMessage}` }
      });
      window.dispatchEvent(errorEvent);
    }
  }, [notes]);

  const renderTree = (items: any[], level: number): React.ReactNode => {
    const paddingLeft = `${level * 1.5}rem`;

    return items.map((item: any) => {
      if (item.type === 'folder') {
        const isExpanded = expandedFolders.has(item.id);
        const isRenaming = renamingFolderId === item.id;
        
        return (
          <DroppableFolder key={item.id} folder={item}>
            <div
              className={`group flex cursor-pointer items-center justify-between rounded-xl p-2 text-sm font-medium transition-colors ${selectedFolderId === item.id ? 'bg-selected-bg text-selected-text' : 'hover:bg-hover-bg'}`}
              style={{ paddingLeft }}
            >
              <div className="flex flex-1 items-center gap-2" onClick={() => selectFolder(item.id)}>
                <ChevronRight 
                  size={16} 
                  className={`transition-transform${isExpanded ? 'rotate-90' : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggleFolderExpansion(item.id); }}
                />
                <FolderIcon size={16} />
                {isRenaming ? (
                  <Input
                    value={renameFolderName}
                    onChange={(e) => setRenameFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleRenameFolder();
                      } else if (e.key === 'Escape') {
                        setRenamingFolderId(null);
                        setRenameFolderName('');
                      }
                    }}
                    onBlur={handleRenameFolder}
                    className="flex-1"
                    autoFocus
                  />
                ) : (
                  <Text variant="body">{item.name}</Text>
                )}
              </div>
              {!isRenaming && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-6 opacity-0 group-hover:opacity-100">
                      <MoreHorizontal size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="z-50">
                    <DropdownMenuItem onSelect={() => { setRenamingFolderId(item.id); setRenameFolderName(item.name); }}>
                      <Edit size={14} className="mr-2" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => deleteFolder(item.id)} className="text-error">
                      <Trash2 size={14} className="mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            {isExpanded && (
              <div className="pl-4">
                {renderTree([...item.children, ...item.notes], level + 1)}
              </div>
            )}
          </DroppableFolder>
        );
      } else { // item.type === 'note'
        const isRenaming = renamingNoteId === item.id;
        
        return (
          <DraggableNote key={item.id} note={item}>
            <div
              className={`group relative cursor-pointer rounded-lg border px-3 py-2 transition-all ${selectedNoteId === item.id ? 'border-selected bg-selected' : 'border-transparent'}`} 
              onClick={() => onSelectNote(item.id)}
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {isRenaming ? (
                      <Input
                        value={renameNoteTitle}
                        onChange={(e) => setRenameNoteTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRenameNote();
                          } else if (e.key === 'Escape') {
                            setRenamingNoteId(null);
                            setRenameNoteTitle('');
                          }
                        }}
                        onBlur={handleRenameNote}
                        className="flex-1"
                        autoFocus
                      />
                    ) : (
                      <Text weight="medium" className="truncate">{item.title}</Text>
                    )}
                  </div>
                </div>
                {!isRenaming && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button 
                        className="size-6 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-sm hover:bg-tertiary transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onSelect={() => { setRenamingNoteId(item.id); setRenameNoteTitle(item.title); }}>
                        <Edit size={14} className="mr-2" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <FolderIcon size={14} className="mr-2" /> Move to
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          {folders.length === 0 ? (
                            <DropdownMenuItem disabled>
                              No folders available
                            </DropdownMenuItem>
                          ) : (
                            folders.map(folder => (
                              <DropdownMenuItem
                                key={folder.id}
                                onSelect={() => {
                                  console.log('🎯 Move folder item onSelect triggered');
                                  console.log(`🔄 Move initiated: note ${item.id} to folder ${folder.id}`);
                                  updateNote({ id: item.id, folderId: folder.id })
                                    .then(() => {
                                      console.log('✅ Move completed successfully');
                                      const event = new CustomEvent('app-notification', {
                                        detail: { type: 'success', message: 'Note moved successfully' }
                                      });
                                      window.dispatchEvent(event);
                                    })
                                    .catch((error) => {
                                      console.error('❌ Move failed:', error);
                                      const event = new CustomEvent('app-notification', {
                                        detail: { type: 'error', message: `Move failed: ${error}` }
                                      });
                                      window.dispatchEvent(event);
                                    });
                                }}
                              >
                                <FolderIcon size={14} className="mr-2" /> {folder.name}
                              </DropdownMenuItem>
                            ))
                          )}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <FileDown size={14} className="mr-2" /> Export
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem onSelect={() => {
                            console.log('🎯 PDF Export menu item onSelect triggered');
                            console.log('🖨️ PDF Export initiated for note:', item.id);
                            exportNote(item.id, 'pdf');
                          }}>PDF</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => {
                            console.log('🎯 DOCX Export menu item onSelect triggered');
                            console.log('📄 DOCX Export initiated for note:', item.id);
                            exportNote(item.id, 'docx');
                          }}>DOCX</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => {
                            console.log('🎯 TXT Export menu item onSelect triggered');
                            console.log('📝 TXT Export initiated for note:', item.id);
                            exportNote(item.id, 'txt');
                          }}>TXT</DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuItem onSelect={() => deleteNote(item.id)} className="text-error">
                        <Trash2 size={14} className="mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </DraggableNote>
        );
      }
    });
  };

  // If closed, show only the toggle button
  if (!isOpen) {
    return (
      <Card className="flex h-full w-16 flex-col bg-sidebar" padding="none">
        <div className="border-border-default flex flex-col items-center border-b p-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            title="Show notes sidebar"
            className="mb-2 text-secondary hover:bg-tertiary hover:text-primary"
          >
            <NoteIcon size={20} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => createNote({ title: 'Untitled Note', content: '<p></p>', folderId: null })}
            title="Create new note"
            className="text-secondary hover:bg-accent-soft hover:text-primary"
          >
            <FilePlus size={18} />
          </Button>
        </div>
        
        <div className="flex flex-1 flex-col items-center gap-2 pt-4">
          {/* Show indicators for folders and notes */}
          <div className="flex flex-col items-center gap-2">
            <div 
              title="Folders"
              className="flex size-8 cursor-pointer items-center justify-center rounded-md bg-tertiary text-secondary transition-colors hover:bg-accent-soft"
            >
              <FolderIcon size={14} />
            </div>
            
            <div 
              title="Notes"
              className="flex size-8 cursor-pointer items-center justify-center rounded-md bg-tertiary text-secondary transition-colors hover:bg-accent-soft"
            >
              <NoteIcon size={14} />
            </div>
          </div>
          
          {/* Notes count indicator */}
          <div className="mt-2 flex flex-col items-center gap-1">
            <div className="flex size-6 items-center justify-center rounded-full bg-accent-primary">
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
    <>
      <Card className="flex h-full w-80 flex-col bg-sidebar" padding="none">
        {/* Header */}
        <div className="border-border-default flex shrink-0 items-center justify-between border-b p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="text-secondary hover:text-primary"
            >
              <PanelLeft size={20} />
            </Button>
            <Heading level={3}>Notes</Heading>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowFolderInput(true)}
              title="Create new folder"
              className="text-secondary hover:text-primary"
            >
              <FolderPlus size={20} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCreateNote}
              title="Create new note"
              className="text-secondary hover:text-primary"
            >
              <FilePlus size={20} />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="shrink-0 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <Input 
              placeholder="Search notes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        {showFolderInput && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-tertiary p-2">
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
      
      {/* Folder/Note List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-1">
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel} modifiers={[restrictToWindowEdges]}>
              {renderTree(dataTree, 0)}
              <DragOverlay>
                {activeId && activeNote ? <NoteDragPreview note={activeNote} /> : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      </Card>
      
      {/* Notification Display */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm rounded-lg p-4 shadow-lg transition-all duration-300 ${
          notification.type === 'success' ? 'bg-green-500 text-white' :
          notification.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          <div className="flex items-center justify-between">
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 rounded-full p-1 hover:bg-white/20"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};