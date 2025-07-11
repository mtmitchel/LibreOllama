import { useNotesStore } from '../../../stores/notesStore';
import type { Note, Folder } from '../types';

/**
 * Test utilities for Notes store
 * These methods should ONLY be used in tests, not in production code
 */
export const createTestNotesStore = () => {
  const store = useNotesStore.getState();
  
  return {
    /**
     * Test helper: Set notes directly in store
     * @param notes - Notes to set
     */
    setTestNotes: (notes: Note[]) => {
      console.log('📝 [TEST] Setting notes:', notes.length);
      useNotesStore.setState((state) => ({
        ...state,
        notes,
        isInitialized: true
      }));
    },

    /**
     * Test helper: Set folders directly in store
     * @param folders - Folders to set
     */
    setTestFolders: (folders: Folder[]) => {
      console.log('📁 [TEST] Setting folders:', folders.length);
      useNotesStore.setState((state) => ({
        ...state,
        folders,
        isInitialized: true
      }));
    },

    /**
     * Test helper: Set initialization state
     * @param isInitialized - Whether store is initialized
     */
    setTestInitialized: (isInitialized: boolean) => {
      console.log('🔄 [TEST] Setting initialized state:', isInitialized);
      useNotesStore.setState((state) => ({
        ...state,
        isInitialized
      }));
    },

    /**
     * Test helper: Set selected note
     * @param note - Note to select
     */
    setTestSelectedNote: (note: Note | null) => {
      console.log('👆 [TEST] Setting selected note:', note?.id);
      useNotesStore.setState((state) => ({
        ...state,
        selectedNote: note
      }));
    },

    /**
     * Test helper: Set search results
     * @param searchResults - Search results to set
     * @param searchQuery - Search query
     */
    setTestSearchResults: (searchResults: Note[], searchQuery: string = '') => {
      console.log('🔍 [TEST] Setting search results:', searchResults.length);
      useNotesStore.setState((state) => ({
        ...state,
        searchResults,
        searchQuery
      }));
    },

    /**
     * Test helper: Set loading state
     * @param isLoading - Whether store is loading
     */
    setTestLoading: (isLoading: boolean) => {
      console.log('⏳ [TEST] Setting loading state:', isLoading);
      useNotesStore.setState((state) => ({
        ...state,
        isLoading
      }));
    },

    /**
     * Test helper: Set sync state
     * @param isSyncing - Whether store is syncing
     */
    setTestSyncing: (isSyncing: boolean) => {
      console.log('🔄 [TEST] Setting syncing state:', isSyncing);
      useNotesStore.setState((state) => ({
        ...state,
        isSyncing
      }));
    },

    /**
     * Test helper: Set error state
     * @param error - Error message
     */
    setTestError: (error: string | undefined) => {
      console.log('❌ [TEST] Setting error state:', error);
      useNotesStore.setState((state) => ({
        ...state,
        error
      }));
    },

    /**
     * Test helper: Reset store to initial state
     */
    resetTestStore: () => {
      console.log('🧹 [TEST] Resetting store to initial state');
      useNotesStore.getState().clearAllData();
    },

    /**
     * Test helper: Get current store state (for assertions)
     */
    getTestState: () => {
      return useNotesStore.getState();
    },
  };
};

/**
 * Mock data factory for tests
 */
export const createMockNote = (overrides: Partial<Note> = {}): Note => ({
  id: `note-${Date.now()}`,
  title: 'Test Note',
  folderId: 'default',
  blocks: [
    { id: 'block-1', type: 'text', content: 'Test content' }
  ],
  metadata: {
    status: 'active',
    tags: ['test'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  ...overrides
});

export const createMockFolder = (overrides: Partial<Folder> = {}): Folder => ({
  id: `folder-${Date.now()}`,
  name: 'Test Folder',
  parentId: null,
  notes: [],
  children: [],
  ...overrides
});

export const createMockNotes = (count: number = 3): Note[] => {
  return Array.from({ length: count }, (_, i) => createMockNote({
    id: `note-${i + 1}`,
    title: `Test Note ${i + 1}`,
    blocks: [
      { id: `block-${i + 1}`, type: 'text', content: `Content for note ${i + 1}` }
    ]
  }));
};

export const createMockFolders = (count: number = 2): Folder[] => {
  return Array.from({ length: count }, (_, i) => createMockFolder({
    id: `folder-${i + 1}`,
    name: `Test Folder ${i + 1}`
  }));
}; 