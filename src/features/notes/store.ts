import { create } from 'zustand';
import { notesService } from './services/notesService';
import type { Note, Folder } from '../types';
import { devLog } from '../../utils/devLog';

interface NotesState {
  notes: Note[];
  folders: Folder[];
  selectedNoteId: string | null;
  selectedFolderId: string | null;
  isLoading: boolean;
  error: string | null;
  fetchNotes: () => Promise<void>;
  fetchFolders: () => Promise<void>;
  createNote: (note: Omit<Note, 'id' | 'metadata'>) => Promise<void>;
  updateNote: (note: Partial<Note> & { id: string }) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  createFolder: (folder: Omit<Folder, 'id' | 'children' | 'metadata'>) => Promise<void>;
  updateFolder: (folder: Partial<Folder> & { id: string }) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  selectNote: (id: string | null) => void;
  selectFolder: (id: string | null) => void;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  folders: [],
  selectedNoteId: null,
  selectedFolderId: null,
  isLoading: false,
  error: null,
  async fetchNotes() {
    set({ isLoading: true });
    try {
      const notes = await notesService.getNotes();
      set({ notes, isLoading: false, error: null });
    } catch (e) {
      set({ error: 'Failed to fetch notes', isLoading: false });
    }
  },
  async fetchFolders() {
    set({ isLoading: true });
    try {
      devLog('Fetching folders...');
      const folders = await notesService.getFolders();
      devLog('Fetched folders:', folders);
      set({ folders, isLoading: false, error: null });
      // Removed auto-select of first folder to allow root-level notes by default
    } catch (e) {
      set({ error: 'Failed to fetch folders', isLoading: false });
    }
  },
  async createNote(note) {
    try {
      devLog('Attempting to create note with data:', note);
      const newNote = await notesService.createNote(note);
      devLog('Note created successfully, backend response:', newNote);
      set(state => {
        const newState = { notes: [...state.notes, newNote] };
        devLog('Updating store with new note. New note count:', newState.notes.length);
        return newState;
      });
      get().selectNote(newNote.id);
    } catch (e) {
      set({ error: 'Failed to create note' });
    }
  },
  async updateNote(note) {
    try {
      devLog(`Attempting to update note ${note.id} with data:`, note);
      const updatedNote = await notesService.updateNote(note);
      devLog('Note updated successfully, backend response:', updatedNote);
      set(state => {
        const newState = {
          notes: state.notes.map(n => (n.id === updatedNote.id ? updatedNote : n)),
        };
        devLog('Updating store. Notes updated:', newState.notes);
        return newState;
      });
    } catch (e) {
      set({ error: 'Failed to update note' });
    }
  },
  async deleteNote(id) {
    try {
      devLog(`Attempting to delete note ${id}`);
      await notesService.deleteNote(id);
      devLog('Note deleted successfully from backend.');
      set(state => {
        const newState = {
          notes: state.notes.filter(n => n.id !== id),
          selectedNoteId: get().selectedNoteId === id ? null : get().selectedNoteId,
        };
        devLog(`Updating store. Note ${id} removed. New note count:`, newState.notes.length);
        return newState;
      });
    } catch (e) {
      set({ error: 'Failed to delete note' });
    }
  },
  async createFolder(folder) {
    try {
      devLog('Attempting to create folder with data:', folder);
      const newFolder = await notesService.createFolder(folder);
      devLog('Folder created successfully, backend response:', newFolder);
      set(state => {
        const newState = { folders: [...state.folders, newFolder] };
        devLog('Updating store with new folder. New folder count:', newState.folders.length);
        return newState;
      });
      get().selectFolder(newFolder.id);
    } catch (e) {
      set({ error: 'Failed to create folder' });
    }
  },
  async updateFolder(folder) {
    try {
      devLog(`Attempting to update folder ${folder.id} with data:`, folder);
      const updatedFolder = await notesService.updateFolder(folder);
      devLog('Folder updated successfully, backend response:', updatedFolder);
      set(state => {
        const newState = {
          folders: state.folders.map(f => (f.id === updatedFolder.id ? updatedFolder : f)),
        };
        devLog('Updating store. Folders updated:', newState.folders);
        return newState;
      });
    } catch (e) {
      set({ error: 'Failed to update folder' });
    }
  },
  async deleteFolder(id) {
    try {
      devLog(`Attempting to delete folder ${id}`);
      await notesService.deleteFolder(id);
      devLog('Folder deleted successfully from backend.');
      set(state => {
        const newState = {
          folders: state.folders.filter(f => f.id !== id),
          selectedFolderId: get().selectedFolderId === id ? null : get().selectedFolderId,
        };
        devLog(`Updating store. Folder ${id} removed. New folder count:`, newState.folders.length);
        return newState;
      });
    } catch (e) {
      set({ error: 'Failed to delete folder' });
    }
  },
  selectNote(id) {
    devLog(`Selecting note: ${id}`);
    set({ selectedNoteId: id });
  },
  selectFolder(id) {
    devLog(`Selecting folder: ${id}`);
    set({ selectedFolderId: id, selectedNoteId: null });
  },
}));

// Utility for development logging
function devLog(message: string, ...optionalParams: any[]) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[NotesStore] ${message}`, ...optionalParams);
  }
} 