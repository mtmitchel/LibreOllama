import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNotesStore } from '../store';
import { Button, Text, Input, Card, Heading, toast } from '../../../components/ui';
import { Dropdown } from '../../../components/ui/design-system';
import { FolderPlus, FilePlus, Search, MoreHorizontal, Edit, Trash2, Folder as FolderIcon, FileText as NoteIcon, ChevronRight, X, FileDown, PanelLeft, PanelRight } from 'lucide-react';
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
    <div className="ring-accent-primary flex items-center gap-2 rounded-md bg-accent-soft p-2 asana-text-sm font-medium text-accent-primary shadow-lg ring-2">
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
            className={`min-h-[40px] rounded-md transition-all duration-200 ${isOver ? 'folder-drop-target bg-accent-soft' : ''}`}
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
              className={`group flex cursor-pointer items-center justify-between rounded-xl p-2 asana-text-sm font-medium transition-colors ${selectedFolderId === item.id ? 'bg-selected-bg text-selected-text' : 'hover:bg-hover-bg'}`}
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
                <Dropdown
                  trigger={(
                    <Button variant="ghost" size="icon" className="size-6 opacity-0 group-hover:opacity-100">
                      <MoreHorizontal size={16} />
                    </Button>
                  )}
                  items={[
                    { value: 'rename', label: 'Rename', icon: <Edit size={14} className="mr-2" /> },
                    { value: 'delete', label: 'Delete', icon: <Trash2 size={14} className="mr-2" />, destructive: true },
                  ]}
                  onSelect={(v) => {
                    if (v === 'rename') { setRenamingFolderId(item.id); setRenameFolderName(item.name); }
                    if (v === 'delete') { deleteFolder(item.id); }
                  }}
                />
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
                  <Dropdown
                    trigger={(
                      <button 
                        className="flex size-6 items-center justify-center rounded-sm opacity-0 transition-colors hover:bg-tertiary group-hover:opacity-100"
                        onClick={(e) => { e.stopPropagation(); }}
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    )}
                    items={[
                      { value: 'rename', label: 'Rename', icon: <Edit size={14} className="mr-2" /> },
                      { value: 'move', label: 'Move to', icon: <FolderIcon size={14} className="mr-2" /> },
                      { value: 'export-pdf', label: 'Export as PDF', icon: <FileDown size={14} className="mr-2" /> },
                      { value: 'export-docx', label: 'Export as DOCX', icon: <FileDown size={14} className="mr-2" /> },
                      { value: 'export-txt', label: 'Export as TXT', icon: <FileDown size={14} className="mr-2" /> },
                      { value: 'delete', label: 'Delete', icon: <Trash2 size={14} className="mr-2" />, destructive: true },
                    ]}
                    onSelect={(v) => {
                      if (v === 'rename') { setRenamingNoteId(item.id); setRenameNoteTitle(item.title); }
                      if (v === 'move') {
                        // Default to first folder if available
                        if (folders.length > 0) {
                          const folder = folders[0];
                          updateNote({ id: item.id, folderId: folder.id })
                            .then(() => {
                              const event = new CustomEvent('app-notification', { detail: { type: 'success', message: `Moved to ${folder.name}` } });
                              window.dispatchEvent(event);
                            })
                            .catch((error) => {
                              const event = new CustomEvent('app-notification', { detail: { type: 'error', message: `Move failed: ${error}` } });
                              window.dispatchEvent(event);
                            });
                        }
                      }
                      if (v === 'export-pdf') { exportNote(item.id, 'pdf'); }
                      if (v === 'export-docx') { exportNote(item.id, 'docx'); }
                      if (v === 'export-txt') { exportNote(item.id, 'txt'); }
                      if (v === 'delete') { deleteNote(item.id); }
                    }}
                  />
                )}
              </div>
            </div>
          </DraggableNote>
        );
      }
    });
  };

  // If closed, show slim 40px gutter handle aligned like Canvas/Chat
  if (!isOpen) {
    return (
      <div
        style={{
          width: '40px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '-24px'
        }}
      >
        <button
          onClick={onToggle}
          title="Show notes sidebar"
          aria-label="Show notes sidebar"
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            padding: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-secondary)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <PanelRight size={18} strokeWidth={2} />
        </button>
      </div>
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
        <div className={`fixed right-4 top-4 z-50 max-w-sm rounded-lg p-4 shadow-lg transition-all duration-300 ${
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