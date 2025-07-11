import React from 'react';
import { useNotesStore } from '../store';
import { TiptapEditor } from './TiptapEditor';
import { Sidebar } from './Sidebar';
import { Heading, Card, EmptyState } from '../../../components/ui';

export const NotesPage: React.FC = () => {
  const { notes, selectedNoteId, updateNote, createNote, selectedFolderId } = useNotesStore();
  const selectedNote = notes.find(n => n.id === selectedNoteId) || null;

  const handleCreateNote = async () => {
    // Create note in the currently selected folder (or root if none selected)
    await createNote({ title: 'Untitled Note', content: '', folderId: selectedFolderId });
  };
  
  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-950">
      <Sidebar />
      <main className="flex-1 flex flex-col p-6">
        {selectedNote ? (
          <div className="flex-1 flex flex-col">
            <input 
              type="text"
              value={selectedNote.title}
              onChange={(e) => updateNote({ ...selectedNote, title: e.target.value })}
              className="text-4xl font-bold bg-transparent border-none outline-none mb-4 text-neutral-800 dark:text-neutral-200"
              placeholder="Untitled Note"
            />
            <Card className="flex-1 p-0 shadow-lg border border-neutral-200 dark:border-neutral-800">
              <TiptapEditor
                value={selectedNote.content}
                onChange={content => updateNote({ ...selectedNote, content })}
                selectedNote={selectedNote}
              />
            </Card>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
                title="No Note Selected"
                message="Select a note from the sidebar to view it, or create a new one."
                icon="📝"
                action={{ label: 'Create a New Note', onClick: handleCreateNote }}
            />
          </div>
        )}
      </main>
    </div>
  );
}; 