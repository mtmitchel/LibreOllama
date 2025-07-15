import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
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
  clearError: () => void;
  reset: () => void;
}

// Initial state
const initialState = {
  notes: [],
  folders: [],
  selectedNoteId: null,
  selectedFolderId: null,
  isLoading: false,
  error: null,
};

export const useNotesStore = create<NotesState>()(
  devtools(
    persist(
      immer(
        subscribeWithSelector((set, get) => ({
          ...initialState,
          
          async fetchNotes() {
            set({ isLoading: true, error: null });
            try {
              devLog('Fetching notes...');
              const notes = await notesService.getNotes();
              devLog('Fetched notes:', notes);
              set(state => {
                state.notes = notes;
                state.isLoading = false;
              });
            } catch (error) {
              console.error('Failed to fetch notes:', error);
              set({ error: 'Failed to fetch notes', isLoading: false });
            }
          },

          async fetchFolders() {
            set({ isLoading: true, error: null });
            try {
              devLog('Fetching folders...');
              const folders = await notesService.getFolders();
              devLog('Fetched folders:', folders);
              set(state => {
                state.folders = folders;
                state.isLoading = false;
              });
            } catch (error) {
              console.error('Failed to fetch folders:', error);
              set({ error: 'Failed to fetch folders', isLoading: false });
            }
          },

          async createNote(note) {
            set({ isLoading: true, error: null });
            try {
              devLog('Creating note:', note);
              const newNote = await notesService.createNote(note);
              devLog('Created note:', newNote);
              set(state => {
                state.notes.push(newNote);
                state.selectedNoteId = newNote.id;
                state.isLoading = false;
              });
            } catch (error) {
              console.error('Failed to create note:', error);
              set({ error: 'Failed to create note', isLoading: false });
            }
          },

          async updateNote(note) {
            set({ error: null });
            try {
              devLog('Updating note:', note);
              const updatedNote = await notesService.updateNote(note);
              devLog('Updated note:', updatedNote);
              set(state => {
                const index = state.notes.findIndex(n => n.id === note.id);
                if (index !== -1) {
                  state.notes[index] = updatedNote;
                }
              });
            } catch (error) {
              console.error('Failed to update note:', error);
              set({ error: 'Failed to update note' });
            }
          },

          async deleteNote(id) {
            set({ isLoading: true, error: null });
            try {
              devLog('Deleting note:', id);
              await notesService.deleteNote(id);
              set(state => {
                state.notes = state.notes.filter(n => n.id !== id);
                if (state.selectedNoteId === id) {
                  state.selectedNoteId = null;
                }
                state.isLoading = false;
              });
            } catch (error) {
              console.error('Failed to delete note:', error);
              set({ error: 'Failed to delete note', isLoading: false });
            }
          },

          async createFolder(folder) {
            set({ isLoading: true, error: null });
            try {
              devLog('Creating folder:', folder);
              const newFolder = await notesService.createFolder(folder);
              devLog('Created folder:', newFolder);
              set(state => {
                state.folders.push(newFolder);
                state.isLoading = false;
              });
            } catch (error) {
              console.error('Failed to create folder:', error);
              set({ error: 'Failed to create folder', isLoading: false });
            }
          },

          async updateFolder(folder) {
            set({ error: null });
            try {
              devLog('Updating folder:', folder);
              const updatedFolder = await notesService.updateFolder(folder);
              devLog('Updated folder:', updatedFolder);
              set(state => {
                const index = state.folders.findIndex(f => f.id === folder.id);
                if (index !== -1) {
                  state.folders[index] = updatedFolder;
                }
              });
            } catch (error) {
              console.error('Failed to update folder:', error);
              set({ error: 'Failed to update folder' });
            }
          },

          async deleteFolder(id) {
            set({ isLoading: true, error: null });
            try {
              devLog('Deleting folder:', id);
              await notesService.deleteFolder(id);
              set(state => {
                state.folders = state.folders.filter(f => f.id !== id);
                if (state.selectedFolderId === id) {
                  state.selectedFolderId = null;
                }
                state.isLoading = false;
              });
            } catch (error) {
              console.error('Failed to delete folder:', error);
              set({ error: 'Failed to delete folder', isLoading: false });
            }
          },

          selectNote(id) {
            set({ selectedNoteId: id });
          },

          selectFolder(id) {
            set({ selectedFolderId: id });
          },

          clearError() {
            set({ error: null });
          },

          reset() {
            set(initialState);
          }
        }))
      ),
      {
        name: 'notes-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Only persist data, not loading states
          notes: state.notes,
          folders: state.folders,
          selectedNoteId: state.selectedNoteId,
          selectedFolderId: state.selectedFolderId,
        })
      }
    ),
    { name: 'notes-store' }
  )
);

function devLog(message: string, ...optionalParams: any[]) {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    console.log(`[NotesStore] ${message}`, ...optionalParams);
  }
} 