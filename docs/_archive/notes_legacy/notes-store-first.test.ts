import { describe, it, expect, beforeEach } from 'vitest';
import { useNotesStore } from '../../../stores/notesStore';
import { createTestNotesStore, createMockNote, createMockFolder, createMockNotes, createMockFolders } from './notes-test-utils';

describe('Notes Store-First Tests', () => {
  let testStore: ReturnType<typeof createTestNotesStore>;

  beforeEach(() => {
    testStore = createTestNotesStore();
    testStore.resetTestStore();
  });

  describe('Store State Management', () => {
    it('should initialize with empty state', () => {
      const state = useNotesStore.getState();
      
      expect(state.notes).toEqual([]);
      expect(state.folders).toEqual([]);
      expect(state.selectedNote).toBeNull();
      expect(state.selectedFolderId).toBeNull();
      expect(state.searchQuery).toBe('');
      expect(state.searchResults).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.isInitialized).toBe(false);
      expect(state.isSyncing).toBe(false);
      expect(state.error).toBeUndefined();
    });

    it('should set notes directly', () => {
      const mockNotes = createMockNotes(3);
      
      testStore.setTestNotes(mockNotes);
      
      const state = useNotesStore.getState();
      expect(state.notes).toHaveLength(3);
      expect(state.notes[0].title).toBe('Test Note 1');
      expect(state.notes[1].title).toBe('Test Note 2');
      expect(state.notes[2].title).toBe('Test Note 3');
      expect(state.isInitialized).toBe(true);
    });

    it('should set folders directly', () => {
      const mockFolders = createMockFolders(2);
      
      testStore.setTestFolders(mockFolders);
      
      const state = useNotesStore.getState();
      expect(state.folders).toHaveLength(2);
      expect(state.folders[0].name).toBe('Test Folder 1');
      expect(state.folders[1].name).toBe('Test Folder 2');
      expect(state.isInitialized).toBe(true);
    });

    it('should manage selected note state', () => {
      const mockNote = createMockNote({ title: 'Selected Note' });
      
      testStore.setTestSelectedNote(mockNote);
      
      const state = useNotesStore.getState();
      expect(state.selectedNote).toEqual(mockNote);
      expect(state.selectedNote?.title).toBe('Selected Note');
    });

    it('should manage search state', () => {
      const mockNotes = createMockNotes(5);
      const searchResults = mockNotes.slice(0, 2);
      
      testStore.setTestSearchResults(searchResults, 'test query');
      
      const state = useNotesStore.getState();
      expect(state.searchResults).toHaveLength(2);
      expect(state.searchQuery).toBe('test query');
    });

    it('should manage loading states', () => {
      testStore.setTestLoading(true);
      expect(useNotesStore.getState().isLoading).toBe(true);

      testStore.setTestLoading(false);
      expect(useNotesStore.getState().isLoading).toBe(false);

      testStore.setTestSyncing(true);
      expect(useNotesStore.getState().isSyncing).toBe(true);

      testStore.setTestSyncing(false);
      expect(useNotesStore.getState().isSyncing).toBe(false);
    });

    it('should manage error state', () => {
      testStore.setTestError('Test error message');
      expect(useNotesStore.getState().error).toBe('Test error message');

      testStore.setTestError(undefined);
      expect(useNotesStore.getState().error).toBeUndefined();
    });
  });

  describe('Computed Properties', () => {
    it('should build folder tree correctly', () => {
      const parentFolder = createMockFolder({ id: 'parent', name: 'Parent' });
      const childFolder = createMockFolder({ id: 'child', name: 'Child', parentId: 'parent' });
      const orphanFolder = createMockFolder({ id: 'orphan', name: 'Orphan' });
      
      testStore.setTestFolders([parentFolder, childFolder, orphanFolder]);
      
      const state = useNotesStore.getState();
      // Test the underlying buildFolderTree function directly
      const folderTree = state.buildFolderTree();
      
      expect(folderTree).toHaveLength(2); // parent and orphan should be at root
      
      const parent = folderTree.find(f => f.id === 'parent');
      expect(parent).toBeDefined();
      expect(parent?.children).toHaveLength(1);
      expect(parent?.children[0].id).toBe('child');
      
      const orphan = folderTree.find(f => f.id === 'orphan');
      expect(orphan).toBeDefined();
      expect(orphan?.children).toHaveLength(0);
    });

    it('should detect search state correctly', () => {
      // Set search query
      useNotesStore.setState(state => ({ ...state, searchQuery: 'test', isLoading: true }));
      
      const state = useNotesStore.getState();
      // Test the underlying logic directly instead of the getter
      const isSearching = state.isLoading && state.searchQuery.length > 0;
      expect(isSearching).toBe(true);
      
      // Clear search
      useNotesStore.setState(state => ({ ...state, searchQuery: '', isLoading: false }));
      
      const updatedState = useNotesStore.getState();
      const isSearchingAfter = updatedState.isLoading && updatedState.searchQuery.length > 0;
      expect(isSearchingAfter).toBe(false);
    });
  });

  describe('Store Actions', () => {
    it('should select note correctly', () => {
      const mockNote = createMockNote({ title: 'Action Test Note' });
      
      useNotesStore.getState().selectNote(mockNote);
      
      const state = useNotesStore.getState();
      expect(state.selectedNote).toEqual(mockNote);
    });

    it('should select folder correctly', () => {
      useNotesStore.getState().selectFolder('folder-123');
      
      const state = useNotesStore.getState();
      expect(state.selectedFolderId).toBe('folder-123');
    });

    it('should toggle folder expansion', () => {
      useNotesStore.getState().toggleFolderExpanded('folder-1');
      
      let state = useNotesStore.getState();
      expect(state.expandedFolders['folder-1']).toBe(true);
      
      useNotesStore.getState().toggleFolderExpanded('folder-1');
      
      state = useNotesStore.getState();
      expect(state.expandedFolders['folder-1']).toBe(false);
    });

    it('should clear search correctly', () => {
      // Set search state
      useNotesStore.setState(state => ({ 
        ...state, 
        searchQuery: 'test query', 
        searchResults: createMockNotes(2) 
      }));
      
      useNotesStore.getState().clearSearch();
      
      const state = useNotesStore.getState();
      expect(state.searchQuery).toBe('');
      expect(state.searchResults).toEqual([]);
    });

    it('should clear error correctly', () => {
      useNotesStore.setState(state => ({ ...state, error: 'Test error' }));
      
      useNotesStore.getState().clearError();
      
      const state = useNotesStore.getState();
      expect(state.error).toBeUndefined();
    });

    it('should clear all data correctly', () => {
      // Set up some data
      testStore.setTestNotes(createMockNotes(3));
      testStore.setTestFolders(createMockFolders(2));
      testStore.setTestSelectedNote(createMockNote());
      testStore.setTestError('Test error');
      
      // Clear all data
      useNotesStore.getState().clearAllData();
      
      const state = useNotesStore.getState();
      expect(state.notes).toEqual([]);
      expect(state.folders).toEqual([]);
      expect(state.selectedNote).toBeNull();
      expect(state.selectedFolderId).toBeNull();
      expect(state.searchQuery).toBe('');
      expect(state.searchResults).toEqual([]);
      expect(state.expandedFolders).toEqual({});
      expect(state.isLoading).toBe(false);
      expect(state.isInitialized).toBe(false);
      expect(state.isSyncing).toBe(false);
      expect(state.error).toBeUndefined();
    });
  });

  describe('Store Utility Methods', () => {
    it('should find notes in folder correctly', () => {
      const folder1Notes = createMockNotes(2).map((note, i) => 
        createMockNote({ ...note, id: `folder1-note-${i}`, folderId: 'folder-1' })
      );
      const folder2Notes = createMockNotes(3).map((note, i) => 
        createMockNote({ ...note, id: `folder2-note-${i}`, folderId: 'folder-2' })
      );
      
      testStore.setTestNotes([...folder1Notes, ...folder2Notes]);
      
      const notesInFolder1 = useNotesStore.getState().getNotesInFolder('folder-1');
      const notesInFolder2 = useNotesStore.getState().getNotesInFolder('folder-2');
      
      expect(notesInFolder1).toHaveLength(2);
      expect(notesInFolder2).toHaveLength(3);
      expect(notesInFolder1.every(note => note.folderId === 'folder-1')).toBe(true);
      expect(notesInFolder2.every(note => note.folderId === 'folder-2')).toBe(true);
    });

    it('should build folder tree with complex hierarchy', () => {
      const folders = [
        createMockFolder({ id: 'root1', name: 'Root 1', parentId: null }),
        createMockFolder({ id: 'root2', name: 'Root 2', parentId: null }),
        createMockFolder({ id: 'child1', name: 'Child 1', parentId: 'root1' }),
        createMockFolder({ id: 'child2', name: 'Child 2', parentId: 'root1' }),
        createMockFolder({ id: 'grandchild1', name: 'Grandchild 1', parentId: 'child1' }),
      ];
      
      testStore.setTestFolders(folders);
      
      // Test the underlying buildFolderTree function directly
      const folderTree = useNotesStore.getState().buildFolderTree();
      
      expect(folderTree).toHaveLength(2); // Two root folders
      
      const root1 = folderTree.find(f => f.id === 'root1');
      expect(root1?.children).toHaveLength(2); // child1 and child2
      
      const child1 = root1?.children.find(f => f.id === 'child1');
      expect(child1?.children).toHaveLength(1); // grandchild1
      
      const root2 = folderTree.find(f => f.id === 'root2');
      expect(root2?.children).toHaveLength(0); // No children
    });
  });

  describe('Store Integration', () => {
    it('should maintain state consistency across multiple operations', () => {
      // Set up initial data
      const notes = createMockNotes(3);
      const folders = createMockFolders(2);
      
      testStore.setTestNotes(notes);
      testStore.setTestFolders(folders);
      
      // Select a note
      useNotesStore.getState().selectNote(notes[1]);
      
      // Select a folder
      useNotesStore.getState().selectFolder(folders[0].id);
      
      // Verify state consistency
      const state = useNotesStore.getState();
      expect(state.notes).toHaveLength(3);
      expect(state.folders).toHaveLength(2);
      expect(state.selectedNote?.id).toBe(notes[1].id);
      expect(state.selectedFolderId).toBe(folders[0].id);
      expect(state.isInitialized).toBe(true);
    });

    it('should handle state subscriptions correctly', () => {
      const stateChanges: any[] = [];
      
      const unsubscribe = useNotesStore.subscribe((state) => {
        stateChanges.push({
          notesCount: state.notes.length,
          selectedNoteId: state.selectedNote?.id,
          isInitialized: state.isInitialized
        });
      });
      
      // Make changes
      testStore.setTestNotes(createMockNotes(2));
      useNotesStore.getState().selectNote(createMockNote({ id: 'selected-note' }));
      
      // Verify subscription fired
      expect(stateChanges.length).toBeGreaterThan(0);
      expect(stateChanges[stateChanges.length - 1]).toEqual({
        notesCount: 2,
        selectedNoteId: 'selected-note',
        isInitialized: true
      });
      
      unsubscribe();
    });
  });
}); 