import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import { notesService } from './services/notesService';
import { Note, Folder } from './types';
import { migrateNotesToBlockNote } from './utils/migrationScript';

interface NotesState {
  notes: Note[];
  folders: Folder[];
  selectedNoteId: string | null;
  selectedFolderId: string | null;
  isLoading: boolean;
  error: string | null;
  isMigrated: boolean; // Track if migration has been run
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
  runMigration: () => Promise<void>; // Manual migration trigger
}

// Initial state
const initialState = {
  notes: [],
  folders: [],
  selectedNoteId: null,
  selectedFolderId: null,
  isLoading: false,
  error: null,
  isMigrated: false,
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
              const notes = await notesService.getNotes();
              set(state => {
                state.notes = notes;
                state.isLoading = false;
              });
              
              // Run migration automatically if not done yet
              if (!get().isMigrated && notes.length > 0) {
                console.log('🔄 Auto-migrating notes to BlockNote format...');
                await get().runMigration();
              }
            } catch (error) {
              console.error('Failed to fetch notes:', error);
              set({ error: 'Failed to fetch notes', isLoading: false });
            }
          },

          async runMigration() {
            try {
              const stats = await migrateNotesToBlockNote();
              set({ isMigrated: true });
              
              if (stats.migrated > 0) {
                console.log(`✅ Successfully migrated ${stats.migrated} notes to BlockNote format`);
                // Refresh notes after migration
                await get().fetchNotes();
              }
            } catch (error) {
              console.error('Migration failed:', error);
              set({ error: 'Failed to migrate notes to BlockNote format' });
            }
          },

          async fetchFolders() {
            set({ isLoading: true, error: null });
            try {
              const folders = await notesService.getFolders();
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
              // Content is already in the correct format (JSON string for BlockNote)
              const newNote = await notesService.createNote(note);
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
              // Content is already in the correct format (JSON string for BlockNote)
              const updatedNote = await notesService.updateNote(note);
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
              const newFolder = await notesService.createFolder(folder);
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
              const updatedFolder = await notesService.updateFolder(folder);
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
              await notesService.deleteFolder(id);
              set(state => {
                state.folders = state.folders.filter(f => f.id !== id);
                if (state.selectedFolderId === id) {
                  state.selectedFolderId = null;
                }
                state.isLoading = false;
              });
              // Refresh notes to reflect orphaned notes (folder_id = null)
              await get().fetchNotes();
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
          isMigrated: state.isMigrated, // Persist migration status
        })
      }
    ),
    { name: 'notes-store' }
  )
); 