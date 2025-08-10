import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Sidebar } from './Sidebar';
import BlockNoteEditor from './BlockNoteEditor'; // Primary editor
import { useNotesStore } from '../store';
import { Button } from '@/components/ui/design-system/Button';
import { Block } from '@blocknote/core';
import { NotesContextSidebar } from './NotesContextSidebar';
import { useHeader } from '../../../app/contexts/HeaderContext';
import { useDebounce } from '@/core/hooks';

const NotesPage: React.FC = () => {
  const { setHeaderProps, clearHeaderProps } = useHeader();
  const {
    notes,
    selectedNoteId,
    selectNote,
    updateNote,
    createNote,
    deleteNote,
    selectedFolderId
  } = useNotesStore(
    useShallow((state) => ({
      notes: state.notes,
      selectedNoteId: state.selectedNoteId,
      selectNote: state.selectNote,
      updateNote: state.updateNote,
      createNote: state.createNote,
      deleteNote: state.deleteNote,
      selectedFolderId: state.selectedFolderId
    }))
  );

  const [isNotesSidebarOpen, setIsNotesSidebarOpen] = useState(true);
  const [isContextOpen, setIsContextOpen] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [editorContent, setEditorContent] = useState<string>('');
  const debouncedEditorContent = useDebounce(editorContent, 500); // 500ms delay

  const selectedNote = useMemo(() => {
    return notes.find(note => note.id === selectedNoteId);
  }, [notes, selectedNoteId]);

  // Load note content into local state when a note is selected
  useEffect(() => {
    if (selectedNote) {
      setEditorContent(selectedNote.content);
    } else {
      setEditorContent('');
    }
  }, [selectedNote]);

  // Save debounced content to the store
  useEffect(() => {
    // Ensure there's a selected note, and the debounced content is different
    // from the content already in the store to prevent unnecessary updates.
    if (selectedNote && debouncedEditorContent !== selectedNote.content) {
      updateNote({ id: selectedNote.id, content: debouncedEditorContent });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedEditorContent]);


  const toggleNotesSidebar = useCallback(() => {
    setIsNotesSidebarOpen(prev => !prev);
  }, []);

  const handleNoteSelect = useCallback((noteId: string | null) => {
    selectNote(noteId);
  }, [selectNote]);

  useEffect(() => {
    // Clear header as Notes uses contextual header
    clearHeaderProps();
    return () => clearHeaderProps();
  }, [clearHeaderProps]);

  useEffect(() => {
    if (notes.length > 0 && !selectedNoteId) {
      selectNote(notes[0].id);
    }
  }, [notes, selectedNoteId, selectNote]);

  const handleTitleBlur = useCallback(() => {
    if (selectedNote) {
      const title = titleInputRef.current?.value || '';
      if (!title) return; // Do not save if title is empty
      const content = selectedNote.content || '';
      if (title !== selectedNote.title || content !== selectedNote.content) {
        updateNote({ id: selectedNote.id, title, content });
      }
    }
  }, [selectedNote, updateNote]);

  const handleContentChange = useCallback((blocks: Block[]) => {
    // Update local state on every change for a responsive UI
    const jsonContent = JSON.stringify(blocks);
    setEditorContent(jsonContent);
  }, []);

  const handleCreateNote = async () => {
    // Create new note with initial BlockNote format
    const initialContent = JSON.stringify([{ type: 'paragraph', content: '' }]);
    await createNote({ title: 'Untitled Note', content: initialContent, folderId: null });
  };

  return (
    <div
      className="asana-app-layout"
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--bg-page)',
        padding: `${24}px ${isContextOpen ? 24 : 0}px ${24}px ${isNotesSidebarOpen ? 24 : 0}px`,
        gap: isNotesSidebarOpen ? '24px' : '0px'
      }}
    >
      <Sidebar
        isOpen={isNotesSidebarOpen}
        onToggle={toggleNotesSidebar}
        onSelectNote={handleNoteSelect}
        onCreateNote={handleCreateNote}
      />
      <div style={{ display: 'flex', gap: isContextOpen ? '24px' : '0px', flex: 1, minWidth: 0, alignItems: 'stretch' }}>
        <div className="border-border-primary flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
        {selectedNote ? (
          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="border-b border-primary p-4">
              <input
                ref={titleInputRef}
                type="text"
                value={selectedNote.title}
                onChange={(e) => updateNote({ id: selectedNote.id, title: e.target.value })}
                onBlur={handleTitleBlur}
                placeholder="Untitled Note"
                className="w-full bg-transparent asana-text-2xl font-bold text-primary outline-none"
              />
            </div>
            <div className="flex-1 p-6">
              <BlockNoteEditor
                content={editorContent} // Use local state for editor content
                onChange={handleContentChange}
                readOnly={false}
                className="h-full"
              />
            </div>
          </div>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-muted">
                {notes.length === 0 ? 'Create your first note' : 'Select a note to view'}
              </p>
            </div>
          )}
        </div>
        <NotesContextSidebar
          isOpen={isContextOpen}
          onToggle={() => setIsContextOpen(!isContextOpen)}
        />
      </div>
    </div>
  );
};

export { NotesPage }; 