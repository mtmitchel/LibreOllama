import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAuth } from './use-auth';

export interface Note {
  id: string;
  title: string;
  content?: string;
  imageUrl?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  userId: string;
  folderId?: string;
}

export interface NoteCreate {
  title: string;
  content?: string;
  imageUrl?: string;
  tags?: string[];
  folderId?: string;
}

// Backend request structures
interface CreateNoteRequest {
  title: string;
  content: string;
  tags?: string[];
  folder_id?: string;
  user_id: string;
}

interface UpdateNoteRequest {
  title?: string;
  content?: string;
  tags?: string[];
  folder_id?: string;
}

// Backend response structure
interface NoteResponse {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  folder_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface UseNotesResult {
  notes: Note[];
  loading: boolean;
  error: string | null;
  createNote: (note: NoteCreate) => Promise<Note | null>;
  updateNote: (id: string, updates: Partial<NoteCreate>) => Promise<Note | null>;
  deleteNote: (id: string) => Promise<boolean>;
  getNoteById: (id: string) => Note | undefined;
  refreshNotes: () => Promise<void>;
}

export function useNotes(): UseNotesResult {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getCurrentUserId } = useAuth();

  // Convert backend response to frontend format
  const convertToFrontendNote = (backendNote: NoteResponse): Note => ({
    id: backendNote.id,
    title: backendNote.title,
    content: backendNote.content,
    tags: backendNote.tags || [],
    folderId: backendNote.folder_id,
    userId: backendNote.user_id,
    createdAt: backendNote.created_at,
    updatedAt: backendNote.updated_at,
  });

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const userId = getCurrentUserId();
      const noteData = await invoke<NoteResponse[]>('get_notes', { user_id: userId });
      const convertedNotes = noteData.map(convertToFrontendNote);
      setNotes(convertedNotes);
    } catch (err: any) {
      console.error('Error fetching notes:', err);
      setError(err.message || 'Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const createNote = async (noteData: NoteCreate): Promise<Note | null> => {
    try {
      setError(null);
      const userId = getCurrentUserId();
      
      // Convert frontend format to backend format
      const createRequest: CreateNoteRequest = {
        title: noteData.title,
        content: noteData.content || '',
        tags: noteData.tags,
        folder_id: noteData.folderId,
        user_id: userId,
      };
      
      const backendNote = await invoke<NoteResponse>('create_note', { note: createRequest });
      const newNote = convertToFrontendNote(backendNote);
      
      setNotes(prevNotes => {
        const updatedNotes = [...prevNotes, newNote];
        return updatedNotes.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
      
      return newNote;
    } catch (err: any) {
      console.error('Error creating note:', err);
      setError(err.message || 'Failed to create note');
      return null;
    }
  };

  const updateNote = async (id: string, updates: Partial<NoteCreate>): Promise<Note | null> => {
    try {
      setError(null);
      
      // Convert frontend format to backend format
      const updateRequest: UpdateNoteRequest = {
        ...(updates.title && { title: updates.title }),
        ...(updates.content !== undefined && { content: updates.content }),
        ...(updates.tags !== undefined && { tags: updates.tags }),
        ...(updates.folderId !== undefined && { folder_id: updates.folderId }),
      };
      
      const backendNote = await invoke<NoteResponse>('update_note', {
        id,
        note: updateRequest
      });
      const updatedNote = convertToFrontendNote(backendNote);
      
      setNotes(prevNotes =>
        prevNotes.map(note =>
          note.id === id ? updatedNote : note
        )
      );
      
      return updatedNote;
    } catch (err: any) {
      console.error('Error updating note:', err);
      setError(err.message || 'Failed to update note');
      return null;
    }
  };

  const deleteNote = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      await invoke('delete_note', { id });
      
      setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
      
      return true;
    } catch (err: any) {
      console.error('Error deleting note:', err);
      setError(err.message || 'Failed to delete note');
      return false;
    }
  };

  const getNoteById = (id: string): Note | undefined => {
    return notes.find(note => note.id === id);
  };

  const refreshNotes = async (): Promise<void> => {
    await fetchNotes();
  };

  return {
    notes,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    getNoteById,
    refreshNotes,
  };
}