// src/pages/Notes.tsx
import React, { useState, useEffect } from 'react';
import { useHeader } from '../contexts/HeaderContext';
import { Plus } from 'lucide-react';
import { NotesSidebar, NotesEditor, NotesEmptyState } from '../../features/notes/components';
import type { Note, Folder, Block } from '../../features/notes/types';

// --- Mock Data ---
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
          { id: 'b3', type: 'list', content: 'Implement Block Action Menu, Implement Slash Command, Refine Block Rendering' },
        ]
      },
      {
        id: 'note2',
        title: 'Feature brainstorm',
        folderId: 'personal',
        blocks: [
          { id: 'b4', type: 'heading2', content: 'New ideas for projects page' },
          { id: 'b5', type: 'text', content: 'Here is a quick sketch of the new project creation flow.' },
          { id: 'b6', type: 'code', content: 'Initial sketch of the wizard flow' },
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
      title: "Notes",
      primaryAction: {
        label: 'New note',
        onClick: handleNewNote,
        icon: <Plus size={16} />
      }
    });
    return () => clearHeaderProps();
  }, [setHeaderProps, clearHeaderProps]);

  return (
    <div className="flex h-full bg-[var(--bg-primary)] p-[var(--space-4)] md:p-[var(--space-6)] gap-[var(--space-4)] md:gap-[var(--space-6)]">
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
