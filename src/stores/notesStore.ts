import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { notesService, validateNoteData, validateFolderData } from '../features/notes/services/notesService';
import type { Note, Folder, Block } from '../features/notes/types';

// =============================================================================
// Store State Interface
// =============================================================================

interface NotesStore {
  // State
  notes: Note[];
  folders: Folder[];
  selectedNote: Note | null;
  selectedFolderId: string | null;
  searchQuery: string;
  searchResults: Note[];
  expandedFolders: Record<string, boolean>;
  
  // Loading states
  isLoading: boolean;
  isInitialized: boolean;
  isSyncing: boolean;
  error: string | undefined;
  isSearching: boolean;
  
  // Error tracking (Added based on test insights)
  lastError: {
    operation: string;
    timestamp: number;
    details: string;
  } | undefined;
  
  // Computed properties
  folderTree: Folder[];
  
  // Actions
  initialize: () => Promise<void>;
  
  // Note operations
  createNote: (title: string, folderId?: string, content?: string, tags?: string[]) => Promise<Note | null>;
  getNotes: () => Promise<Note[]>;
  getNote: (noteId: string) => Promise<Note | null>;
  updateNote: (noteId: string, updates: Partial<Note>) => Promise<Note | null>;
  deleteNote: (noteId: string) => Promise<boolean>;
  selectNote: (note: Note | null) => void;
  selectNoteById: (noteId: string | null) => void;
  
  // Folder operations
  createFolder: (name: string, parentId?: string, color?: string) => Promise<Folder | null>;
  getFolders: () => Promise<Folder[]>;
  updateFolder: (folderId: string, updates: Partial<Folder>) => Promise<Folder | null>;
  deleteFolder: (folderId: string) => Promise<boolean>;
  selectFolder: (folderId: string | null) => void;
  toggleFolderExpansion: (folderId: string) => void;
  
  // Search operations
  searchNotes: (query: string) => Promise<Note[]>;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  
  // Utility operations
  clearError: () => void;
  clearAllData: () => void;
  
  // Helper methods
  getNotesInFolder: (folderId: string) => Note[];
  buildFolderTree: () => Folder[];
  
  // Private helper methods
  loadNotes: () => Promise<Note[]>;
  loadFolders: () => Promise<Folder[]>;
}

// =============================================================================
// Store Implementation
// =============================================================================

export const useNotesStore = create<NotesStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      notes: [],
      folders: [],
      selectedNote: null,
      selectedFolderId: null,
      searchQuery: '',
      searchResults: [],
      expandedFolders: {},
      isLoading: false,
      isInitialized: false,
      isSyncing: false,
      isSearching: false,
      error: undefined,
      lastError: undefined,

        // Computed properties
  get folderTree() {
    const state = get();
    console.log('Building folder tree, folders:', state.folders.length);
    const tree = state.buildFolderTree();
    console.log('Built folder tree:', tree);
    return tree;
  },

      // =============================================================================
      // Initialization
      // =============================================================================

      initialize: async () => {
        const state = get();
        if (state.isInitialized) {
          console.log('✅ [NotesStore] Already initialized, skipping');
          return;
        }

        try {
          set({ isLoading: true, error: undefined });
          
          // Load folders and notes in parallel
          const [folders, notes] = await Promise.all([
            get().loadFolders(),
            get().loadNotes()
          ]);
          
          set({ 
            isInitialized: true, 
            isLoading: false,
            error: undefined 
          });
          
          console.log('✅ [NotesStore] Initialized successfully');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to initialize';
          set({ 
            isLoading: false, 
            error: errorMessage,
            lastError: {
              operation: 'initialize',
              timestamp: Date.now(),
              details: errorMessage
            }
          });
          console.error('❌ [NotesStore] Failed to initialize:', error);
        }
      },

      // =============================================================================
      // Note Operations
      // =============================================================================

      createNote: async (title, folderId = 'default', content = '', tags = []) => {
        try {
          // Validate input data (Added based on test insights)
          const validation = validateNoteData(title, content);
          if (!validation.isValid) {
            const error = validation.error || 'Invalid note data';
            set({ 
              error,
              lastError: {
                operation: 'createNote',
                timestamp: Date.now(),
                details: error
              }
            });
            return null;
          }

          set({ isSyncing: true, error: undefined });
          
          const note = await notesService.createNote(title, content, tags);
          
          if (note) {
            // Assign to folder if specified
            if (folderId !== 'default') {
              note.folderId = folderId;
            }
            
            set(state => ({
              notes: [...state.notes, note],
              selectedNote: note,
              isSyncing: false
            }));
            
            console.log('✅ [NotesStore] Note created:', note.id);
            return note;
          } else {
            throw new Error('Failed to create note');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create note';
          set({ 
            isSyncing: false, 
            error: errorMessage,
            lastError: {
              operation: 'createNote',
              timestamp: Date.now(),
              details: errorMessage
            }
          });
          console.error('❌ [NotesStore] Failed to create note:', error);
          return null;
        }
      },

      getNotes: async () => {
        try {
          const notes = await notesService.getNotes();
          return notes;
        } catch (error) {
          console.error('❌ [NotesStore] Failed to get notes:', error);
          return [];
        }
      },

      getNote: async (noteId: string) => {
        try {
          const note = await notesService.getNote(noteId);
          return note;
        } catch (error) {
          console.error('❌ [NotesStore] Failed to get note:', error);
          return null;
        }
      },

      updateNote: async (noteId: string, updates: Partial<Note>) => {
        try {
          const state = get();
          const existingNote = state.notes.find(n => n.id === noteId);
          
          if (!existingNote) {
            throw new Error('Note not found');
          }

          // Validate updates if title or content changed
          if (updates.title !== undefined || updates.blocks !== undefined) {
            const title = updates.title || existingNote.title;
            const content = updates.blocks ? 
              updates.blocks.map(b => b.content).join('\n') : 
              existingNote.blocks.map(b => b.content).join('\n');
            
            const validation = validateNoteData(title, content);
            if (!validation.isValid) {
              const error = validation.error || 'Invalid note data';
              set({ 
                error,
                lastError: {
                  operation: 'updateNote',
                  timestamp: Date.now(),
                  details: error
                }
              });
              return null;
            }
          }

          set({ isSyncing: true, error: undefined });
          
          // Convert frontend updates to backend format
          const backendUpdates: any = {};
          if (updates.title) backendUpdates.title = updates.title;
          if (updates.blocks) {
            backendUpdates.content = updates.blocks.map(b => b.content).join('\n');
          }
          if (updates.metadata?.tags) backendUpdates.tags = updates.metadata.tags;
          
          const updatedNote = await notesService.updateNote(noteId, backendUpdates);
          
          if (updatedNote) {
            set(state => ({
              notes: state.notes.map(n => n.id === noteId ? updatedNote : n),
              selectedNote: state.selectedNote?.id === noteId ? updatedNote : state.selectedNote,
              isSyncing: false
            }));
            
            console.log('✅ [NotesStore] Note updated:', noteId);
            return updatedNote;
          } else {
            throw new Error('Failed to update note');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update note';
          set({ 
            isSyncing: false, 
            error: errorMessage,
            lastError: {
              operation: 'updateNote',
              timestamp: Date.now(),
              details: errorMessage
            }
          });
          console.error('❌ [NotesStore] Failed to update note:', error);
          return null;
        }
      },

      deleteNote: async (noteId: string) => {
        try {
          set({ isSyncing: true, error: undefined });
          
          const success = await notesService.deleteNote(noteId);
          
          if (success) {
            set(state => ({
              notes: state.notes.filter(n => n.id !== noteId),
              selectedNote: state.selectedNote?.id === noteId ? null : state.selectedNote,
              isSyncing: false
            }));
            
            console.log('✅ [NotesStore] Note deleted:', noteId);
            return true;
          } else {
            throw new Error('Failed to delete note');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete note';
          set({ 
            isSyncing: false, 
            error: errorMessage,
            lastError: {
              operation: 'deleteNote',
              timestamp: Date.now(),
              details: errorMessage
            }
          });
          console.error('❌ [NotesStore] Failed to delete note:', error);
          return false;
        }
      },

      selectNote: (note: Note | null) => {
        set({ selectedNote: note });
      },

      selectNoteById: (noteId) => {
        const note = noteId ? get().notes.find(n => n.id === noteId) || null : null;
        set({ selectedNote: note });
      },

      // =============================================================================
      // Folder Operations
      // =============================================================================

      createFolder: async (name: string, parentId?: string, color?: string) => {
        try {
          // Validate input data (Added based on test insights)
          const validation = validateFolderData(name);
          if (!validation.isValid) {
            const error = validation.error || 'Invalid folder data';
            set({ 
              error,
              lastError: {
                operation: 'createFolder',
                timestamp: Date.now(),
                details: error
              }
            });
            return null;
          }

          set({ isSyncing: true, error: undefined });
          
          const folder = await notesService.createFolder(name, parentId, color);
          
          if (folder) {
            set(state => ({
              folders: [...state.folders, folder],
              isSyncing: false
            }));
            
            console.log('✅ [NotesStore] Folder created:', folder.id);
            return folder;
          } else {
            throw new Error('Failed to create folder');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create folder';
          set({ 
            isSyncing: false, 
            error: errorMessage,
            lastError: {
              operation: 'createFolder',
              timestamp: Date.now(),
              details: errorMessage
            }
          });
          console.error('❌ [NotesStore] Failed to create folder:', error);
          return null;
        }
      },

      getFolders: async () => {
        try {
          const folders = await notesService.getFolders();
          return folders;
        } catch (error) {
          console.error('❌ [NotesStore] Failed to get folders:', error);
          return [];
        }
      },

      updateFolder: async (folderId: string, updates: Partial<Folder>) => {
        try {
          // Validate updates if name changed
          if (updates.name !== undefined) {
            const validation = validateFolderData(updates.name);
            if (!validation.isValid) {
              const error = validation.error || 'Invalid folder data';
              set({ 
                error,
                lastError: {
                  operation: 'updateFolder',
                  timestamp: Date.now(),
                  details: error
                }
              });
              return null;
            }
          }

          set({ isSyncing: true, error: undefined });
          
          // Convert frontend updates to backend format
          const backendUpdates: any = {};
          if (updates.name) backendUpdates.name = updates.name;  // Use 'name' not 'folder_name'
          if (updates.parentId) backendUpdates.parent_id = updates.parentId;
          if (updates.color) backendUpdates.color = updates.color;
          
          const updatedFolder = await notesService.updateFolder(folderId, backendUpdates);
          
          if (updatedFolder) {
            set(state => ({
              folders: state.folders.map(f => f.id === folderId ? updatedFolder : f),
              isSyncing: false
            }));
            
            console.log('✅ [NotesStore] Folder updated:', folderId);
            return updatedFolder;
          } else {
            throw new Error('Failed to update folder');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update folder';
          set({ 
            isSyncing: false, 
            error: errorMessage,
            lastError: {
              operation: 'updateFolder',
              timestamp: Date.now(),
              details: errorMessage
            }
          });
          console.error('❌ [NotesStore] Failed to update folder:', error);
          return null;
        }
      },

      deleteFolder: async (folderId: string) => {
        try {
          set({ isSyncing: true, error: undefined });
          
          const success = await notesService.deleteFolder(folderId);
          
          if (success) {
            set(state => ({
              folders: state.folders.filter(f => f.id !== folderId),
              selectedFolderId: state.selectedFolderId === folderId ? null : state.selectedFolderId,
              isSyncing: false
            }));
            
            console.log('✅ [NotesStore] Folder deleted:', folderId);
            return true;
          } else {
            throw new Error('Failed to delete folder');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete folder';
          set({ 
            isSyncing: false, 
            error: errorMessage,
            lastError: {
              operation: 'deleteFolder',
              timestamp: Date.now(),
              details: errorMessage
            }
          });
          console.error('❌ [NotesStore] Failed to delete folder:', error);
          return false;
        }
      },

      selectFolder: (folderId: string | null) => {
        set({ selectedFolderId: folderId });
      },

      toggleFolderExpansion: (folderId: string) => {
        set(state => ({
          expandedFolders: {
            ...state.expandedFolders,
            [folderId]: !state.expandedFolders[folderId]
          }
        }));
      },

      // =============================================================================
      // Search Operations
      // =============================================================================

      searchNotes: async (query: string) => {
        try {
          set({ isSearching: true, error: undefined });
          
          const results = await notesService.searchNotes(query);
          
          set({ 
            searchResults: results,
            searchQuery: query,
            isSearching: false
          });
          
          console.log(`✅ [NotesStore] Search completed: ${results.length} results`);
          return results;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to search notes';
          set({ 
            isSearching: false, 
            error: errorMessage,
            lastError: {
              operation: 'searchNotes',
              timestamp: Date.now(),
              details: errorMessage
            }
          });
          console.error('❌ [NotesStore] Failed to search notes:', error);
          return [];
        }
      },

      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },

      clearSearch: () => {
        set({ 
          searchQuery: '', 
          searchResults: [] 
        });
      },

      // =============================================================================
      // Utility Operations
      // =============================================================================

      clearError: () => {
        set({ error: undefined, lastError: undefined });
      },

      clearAllData: () => {
        set({
          notes: [],
          folders: [],
          selectedNote: null,
          selectedFolderId: null,
          searchQuery: '',
          searchResults: [],
          expandedFolders: {},
          isLoading: false,
          isInitialized: false,
          isSyncing: false,
          error: undefined,
          lastError: undefined
        });
      },

      // =============================================================================
      // Private Helper Methods
      // =============================================================================

      loadNotes: async () => {
        try {
          const notes = await notesService.getNotes();
          set({ notes });
          console.log(`✅ [NotesStore] Loaded ${notes.length} notes`);
          return notes;
        } catch (error) {
          console.error('❌ [NotesStore] Failed to load notes:', error);
          throw error;
        }
      },

      loadFolders: async () => {
        try {
          const folders = await notesService.getFolders();
          set({ folders });
          console.log(`✅ [NotesStore] Loaded ${folders.length} folders`);
          return folders;
        } catch (error) {
          console.error('❌ [NotesStore] Failed to load folders:', error);
          throw error;
        }
      },

      // Helper methods
      getNotesInFolder: (folderId: string) => {
        return get().notes.filter(note => note.folderId === folderId);
      },

      buildFolderTree: () => {
        const folders = get().folders;
        if (!folders || folders.length === 0) return [];
        
        const folderMap: Record<string, Folder> = {};
        const rootFolders: Folder[] = [];

        // Create a map of all folders for quick lookup
        folders.forEach(folder => {
          folderMap[folder.id] = { ...folder, children: [] };
        });

        // Build the tree
        folders.forEach(folder => {
          if (!folder.parentId || folder.parentId === null) {
            rootFolders.push(folderMap[folder.id]);
          } else {
            const parentFolder = folderMap[folder.parentId];
            if (parentFolder) {
              parentFolder.children = [...(parentFolder.children || []), folderMap[folder.id]];
            } else {
              console.warn(`Folder with parentId ${folder.parentId} not found, adding to root.`);
              rootFolders.push(folderMap[folder.id]);
            }
          }
        });

        return rootFolders;
      }
    }),
    {
      name: 'notes-store',
      partialize: (state) => ({
        expandedFolders: state.expandedFolders,
        selectedFolderId: state.selectedFolderId
      })
    }
  )
);

// =============================================================================
// Store Selectors (Performance Optimization)
// =============================================================================

export const useNotesSelectors = {
  notes: (state: NotesStore) => state.notes,
  folders: (state: NotesStore) => state.folders,
  selectedNote: (state: NotesStore) => state.selectedNote,
  selectedFolderId: (state: NotesStore) => state.selectedFolderId,
  searchResults: (state: NotesStore) => state.searchResults,
  isLoading: (state: NotesStore) => state.isLoading,
  isInitialized: (state: NotesStore) => state.isInitialized,
  isSyncing: (state: NotesStore) => state.isSyncing,
  error: (state: NotesStore) => state.error,
  
  // Computed selectors
  notesByFolder: (folderId: string) => (state: NotesStore) => 
    state.notes.filter(note => note.folderId === folderId),
  
  folderById: (folderId: string) => (state: NotesStore) => 
    state.folders.find(folder => folder.id === folderId),
  
  hasError: (state: NotesStore) => Boolean(state.error),
  
  isReady: (state: NotesStore) => state.isInitialized && !state.isLoading,

  // Computed properties
  folderTree: (state: NotesStore) => state.folderTree,

  // Helper selectors
  notesInFolder: (folderId: string) => (state: NotesStore) => state.getNotesInFolder(folderId)
};

export default useNotesStore; 