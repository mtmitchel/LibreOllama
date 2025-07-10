// src/pages/Notes.tsx
import React, { useState, useEffect } from 'react';
import { useHeader } from '../contexts/HeaderContext';
import { Plus } from 'lucide-react';
import { NotesSidebar, NotesEditor, NotesEmptyState } from '../../features/notes/components';
import type { Note, Folder, Block } from '../../features/notes/types';

// --- Mock Data ---
const mockFoldersData: Omit<Folder, 'children'>[] = [];

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

export function Notes() {
  const { setHeaderProps, clearHeaderProps } = useHeader();
  const [folders, setFolders] = useState<Folder[]>(buildFolderTree(mockFoldersData));
  const [selectedNote, setSelectedNote] = useState<Note | null>(() => {
    const initialNote = mockFoldersData[0]?.notes[1];
    if (initialNote) return JSON.parse(JSON.stringify(initialNote));
    return null;
  });
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

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

  const setSelectedNoteId = (id: string) => {
    const allNotes = getNotesFromFolders(folders);
    const noteToSelect = allNotes.find(n => n.id === id);
    setSelectedNote(noteToSelect ? JSON.parse(JSON.stringify(noteToSelect)) : null);
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const updateNoteBlocks = (newBlocks: Block[]) => {
    if (selectedNote) {
      setSelectedNote({ ...selectedNote, blocks: newBlocks });
      // Update the folders data
      const updatedFolders = folders.map(folder => {
        if (folder.id === selectedNote.folderId) {
          return {
            ...folder,
            notes: folder.notes.map(note => 
              note.id === selectedNote.id ? { ...note, blocks: newBlocks } : note
            )
          };
        }
        if (folder.children) {
          return {
            ...folder,
            children: folder.children.map(child => {
              if (child.id === selectedNote.folderId) {
                return {
                  ...child,
                  notes: child.notes.map(note => 
                    note.id === selectedNote.id ? { ...note, blocks: newBlocks } : note
                  )
                };
              }
              return child;
            })
          };
        }
        return folder;
      });
      setFolders(updatedFolders);
    }
  };

  const updateNote = (updatedNote: Note) => {
    setSelectedNote(updatedNote);
    // Update the folders data
    const updatedFolders = folders.map(folder => {
      if (folder.id === updatedNote.folderId) {
        return {
          ...folder,
          notes: folder.notes.map(note => 
            note.id === updatedNote.id ? updatedNote : note
          )
        };
      }
      if (folder.children) {
        return {
          ...folder,
          children: folder.children.map(child => {
            if (child.id === updatedNote.folderId) {
              return {
                ...child,
                notes: child.notes.map(note => 
                  note.id === updatedNote.id ? updatedNote : note
                )
              };
            }
            return child;
          })
        };
      }
      return folder;
    });
    setFolders(updatedFolders);
  };

  const handleNewNote = () => {
    alert('New Note clicked - implement functionality');
  };

  const handleNewFolder = () => {
    alert('New Folder clicked - implement functionality');
  };

  // Header effect
  useEffect(() => {
    setHeaderProps({
      title: "Notes"
    });
    return () => clearHeaderProps();
  }, [setHeaderProps, clearHeaderProps]);

  return (
    <div className="flex h-full bg-[var(--bg-primary)] p-6 lg:p-8 gap-6 lg:gap-8">
      <NotesSidebar
        folders={folders}
        selectedNoteId={selectedNote?.id || null}
        onSelectNote={setSelectedNoteId}
        expandedFolders={expandedFolders}
        onToggleFolder={toggleFolder}
        onNewNote={handleNewNote}
        onNewFolder={handleNewFolder}
      />

      <div className="flex-1 max-w-4xl">
        {selectedNote ? (
          <NotesEditor
            selectedNote={selectedNote}
            onUpdateNote={updateNote}
            onUpdateBlocks={updateNoteBlocks}
          />
        ) : (
          <NotesEmptyState onNewNote={handleNewNote} />
        )}
      </div>
    </div>
  );
}

export default Notes;
