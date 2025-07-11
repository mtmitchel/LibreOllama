import React, { useCallback, useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import TiptapEditor from './TiptapEditor';
import { useNotesStore } from '../store';
import { NotesContextSidebar } from './NotesContextSidebar';
import { Input, EmptyState } from '../../../components/ui';

export const NotesPage: React.FC = () => {
  const { notes, selectedNoteId, updateNote, selectNote, createNote, selectedFolderId } = useNotesStore();
  const [isNotesSidebarOpen, setIsNotesSidebarOpen] = useState(true);
  const [isContextOpen, setIsContextOpen] = useState(false);

  const selectedNote = notes.find(note => note.id === selectedNoteId);

  const toggleNotesSidebar = useCallback(() => {
    setIsNotesSidebarOpen(!isNotesSidebarOpen);
  }, [isNotesSidebarOpen]);

  const toggleContext = useCallback(() => {
    setIsContextOpen(!isContextOpen);
  }, [isContextOpen]);

  useEffect(() => {
    if (!selectedNoteId && notes.length > 0) {
      selectNote(notes[0].id);
    }
  }, [notes, selectedNoteId, selectNote]);

  const handleContentChange = useCallback((newContent: string) => {
    if (selectedNote) {
      updateNote({ ...selectedNote, content: newContent });
    }
  }, [selectedNote, updateNote]);
  
  const handleCreateNote = async () => {
    await createNote({ title: 'Untitled Note', content: '', folderId: selectedFolderId });
  };

  return (
    <div 
      className="flex h-full bg-[var(--bg-primary)]"
      style={{ 
        padding: 'var(--space-6)',
        gap: 'var(--space-6)'
      }}
    >
      {/* Notes Sidebar */}
      <Sidebar 
        isOpen={isNotesSidebarOpen}
        onToggle={toggleNotesSidebar}
      />

      {/* Main Notes Container */}
      <div className="flex-1 flex flex-col h-full bg-[var(--bg-secondary)] rounded-[var(--radius-xl)] min-w-0 overflow-hidden shadow-sm border border-[var(--border-default)]">
        {selectedNote ? (
          <div 
            className="flex-1 flex flex-col min-h-0"
            style={{ padding: 'var(--space-4)' }}
          >
            <Input
              value={selectedNote.title}
              onChange={(e) => updateNote({ ...selectedNote, title: e.target.value })}
              className="text-2xl font-bold border-none bg-transparent p-0 focus:ring-0 focus:border-none"
              style={{ 
                marginBottom: 'var(--space-4)',
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-bold)'
              }}
              placeholder="Untitled Note"
            />
            <div className="flex-1 min-h-0">
              <TiptapEditor
                key={selectedNote.id}
                content={selectedNote.content}
                onChange={handleContentChange}
                selectedNote={selectedNote}
                placeholder="Start writing your note..."
                className="h-full"
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center h-full">
            <EmptyState
              title="No Note Selected"
              message="Select a note from the sidebar to view it, or create a new one."
              icon="📝"
              action={{ label: 'Create a New Note', onClick: handleCreateNote }}
            />
          </div>
        )}
      </div>

      {/* Context Sidebar */}
      <NotesContextSidebar 
        isOpen={isContextOpen}
        noteId={selectedNote?.id}
        onToggle={toggleContext}
      />
    </div>
  );
}; 