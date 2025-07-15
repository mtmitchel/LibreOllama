import React, { useCallback, useEffect, useState } from 'react';
import { useRef } from 'react';
import { Sidebar } from './Sidebar';
import TiptapEditor from './TiptapEditor';
import { useNotesStore } from '../store';
import { NotesContextSidebar } from './NotesContextSidebar';
import { Input, EmptyState } from '../../../components/ui';
import { useHeader } from '../../../app/contexts/HeaderContext';

export const NotesPage: React.FC = () => {
  const { setHeaderProps, clearHeaderProps } = useHeader();
  const { notes, selectedNoteId, updateNote, selectNote, createNote, selectedFolderId } = useNotesStore();
  const [isNotesSidebarOpen, setIsNotesSidebarOpen] = useState(true);
  const [isContextOpen, setIsContextOpen] = useState(false);

  const selectedNote = notes.find(note => note.id === selectedNoteId);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  const toggleNotesSidebar = useCallback(() => {
    setIsNotesSidebarOpen(!isNotesSidebarOpen);
  }, [isNotesSidebarOpen]);

  const toggleContext = useCallback(() => {
    setIsContextOpen(!isContextOpen);
  }, [isContextOpen]);

  useEffect(() => {
    setHeaderProps({
      title: "Notes"
    });
    return () => clearHeaderProps();
  }, [setHeaderProps, clearHeaderProps]);

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
    <div className="flex h-full gap-6 bg-primary p-6">
      {/* Notes Sidebar */}
      <Sidebar 
        isOpen={isNotesSidebarOpen}
        onToggle={toggleNotesSidebar}
      />

      {/* Main Notes Container */}
      <div className="border-border-primary flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
        {selectedNote ? (
          <div className="flex min-h-0 flex-1 flex-col p-4">
            <Input
              ref={titleInputRef}
              value={selectedNote.title}
              onChange={(e) => updateNote({ ...selectedNote, title: e.target.value })}
              className="notes-title-input mb-4 border-none bg-transparent p-0 text-2xl font-bold focus:border-none focus:ring-0"
              placeholder="Untitled Note"
            />
            <div className="min-h-0 flex-1">
              <TiptapEditor
                key={selectedNote.id}
                content={selectedNote.content}
                onChange={handleContentChange}
                selectedNote={selectedNote}
                placeholder="Start writing your note..."
                className="h-full"
                titleInputRef={titleInputRef}
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-1 items-center justify-center">
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
        onToggle={toggleContext}
      />
    </div>
  );
}; 