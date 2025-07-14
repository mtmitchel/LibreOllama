import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { notesService } from './services/notesService';
import { Note, Folder } from './types';

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

export const useNotesStore = create<NotesState>()(
  subscribeWithSelector(
    (set) => ({
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
        } catch {
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
        } catch {
          set({ error: 'Failed to fetch folders', isLoading: false });
        }
      },
      async createNote(note) {
        set({ isLoading: true });
        try {
          const createdNote = await notesService.createNote(note);
          set((state) => ({ 
            notes: [...state.notes, createdNote], 
            isLoading: false, 
            error: null 
          }));
        } catch {
          set({ error: 'Failed to create note', isLoading: false });
        }
      },
      async updateNote(note) {
        set({ isLoading: true });
        try {
          const updatedNote = await notesService.updateNote(note);
          set((state) => ({ 
            notes: state.notes.map(n => n.id === note.id ? updatedNote : n), 
            isLoading: false, 
            error: null 
          }));
        } catch {
          set({ error: 'Failed to update note', isLoading: false });
        }
      },
      async deleteNote(id) {
        set({ isLoading: true });
        try {
          await notesService.deleteNote(id);
          set((state) => ({
            notes: state.notes.filter(n => n.id !== id),
            selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId,
            isLoading: false,
            error: null
          }));
        } catch {
          set({ error: 'Failed to delete note', isLoading: false });
        }
      },
      async createFolder(folder) {
        set({ isLoading: true });
        try {
          const createdFolder = await notesService.createFolder(folder);
          set((state) => ({ 
            folders: [...state.folders, createdFolder], 
            isLoading: false, 
            error: null 
          }));
        } catch {
          set({ error: 'Failed to create folder', isLoading: false });
        }
      },
      async updateFolder(folder) {
        set({ isLoading: true });
        try {
          const updatedFolder = await notesService.updateFolder(folder);
          set((state) => ({ 
            folders: state.folders.map(f => f.id === folder.id ? updatedFolder : f), 
            isLoading: false, 
            error: null 
          }));
        } catch {
          set({ error: 'Failed to update folder', isLoading: false });
        }
      },
      async deleteFolder(id) {
        set({ isLoading: true });
        try {
          await notesService.deleteFolder(id);
          set((state) => ({
            folders: state.folders.filter(f => f.id !== id),
            selectedFolderId: state.selectedFolderId === id ? null : state.selectedFolderId,
            isLoading: false,
            error: null
          }));
        } catch {
          set({ error: 'Failed to delete folder', isLoading: false });
        }
      },
      selectNote(id) {
        set({ selectedNoteId: id });
      },
      selectFolder(id) {
        set({ selectedFolderId: id });
      }
    })
  )
);

function devLog(message: string, ...optionalParams: any[]) {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    console.log(`[NotesStore] ${message}`, ...optionalParams);
  }
} 