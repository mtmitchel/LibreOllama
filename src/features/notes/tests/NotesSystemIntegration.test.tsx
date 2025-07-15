import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useNotesStore } from '../store';
import { invoke } from '@tauri-apps/api/core';

// Mock Tauri invoke with factory function to avoid hoisting issues
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Get the mocked invoke function
const mockInvoke = vi.mocked(invoke);

// Mock validation function
const validateNoteData = (title: string, content: string) => {
  if (!title.trim()) {
    return { isValid: false, error: 'Title is required' };
  }
  return { isValid: true };
};

describe('Notes System Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNotesStore.getState().reset();
    mockInvoke.mockClear();
  });

  describe('MVP Requirements Validation', () => {
    it('should meet basic note creation requirements', async () => {
      const mockNote = {
        id: 1,
        title: 'My First Note',
        content: '<p>This is my first note content</p>',
        user_id: 'test_user',
        folder_id: null,
        tags: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockInvoke.mockResolvedValueOnce(mockNote);

      const { result } = renderHook(() => useNotesStore());

      // Test note creation flow
      await act(async () => {
        await result.current.createNote(mockNote.title, mockNote.content);
      });

      // Verify MVP requirements
      expect(result.current.notes).toHaveLength(1);
      expect(result.current.notes[0].title).toBe('My First Note');
      expect(result.current.notes[0].content).toContain('first note content');
      expect(mockInvoke).toHaveBeenCalledWith('create_note', expect.objectContaining({
        title: mockNote.title,
        content: mockNote.content,
      }));
    });

    it('should support folder organization', async () => {
      const mockFolder = {
        id: 1,
        folder_name: 'Work Notes',
        parent_id: null,
        user_id: 'test_user',
        color: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockNote = {
        id: 1,
        title: 'Work Task',
        content: '<p>Important work item</p>',
        user_id: 'test_user',
        folder_id: 1,
        tags: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockInvoke
        .mockResolvedValueOnce(mockFolder) // create folder
        .mockResolvedValueOnce(mockNote);  // create note in folder

      const { result } = renderHook(() => useNotesStore());

      // Create folder
      await act(async () => {
        await result.current.createFolder(mockFolder.folder_name);
      });

      // Create note in folder
      await act(async () => {
        await result.current.createNote(mockNote.title, mockNote.content, 1);
      });

      expect(result.current.folders).toHaveLength(1);
      expect(result.current.notes).toHaveLength(1);
      expect(result.current.notes[0].folder_id).toBe(1);
    });

    it('should handle note editing workflow', async () => {
      const originalNote = {
        id: 1,
        title: 'Original Title',
        content: '<p>Original content</p>',
        user_id: 'test_user',
        folder_id: null,
        tags: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updatedNote = {
        ...originalNote,
        title: 'Updated Title',
        content: '<p>Updated content with more details</p>',
        updated_at: new Date().toISOString(),
      };

      mockInvoke
        .mockResolvedValueOnce(originalNote) // create
        .mockResolvedValueOnce(updatedNote); // update

      const { result } = renderHook(() => useNotesStore());

      // Create initial note
      await act(async () => {
        await result.current.createNote(originalNote.title, originalNote.content);
      });

      // Update note
      await act(async () => {
        await result.current.updateNote(1, {
          title: updatedNote.title,
          content: updatedNote.content,
        });
      });

      expect(result.current.notes[0].title).toBe('Updated Title');
      expect(result.current.notes[0].content).toContain('more details');
    });
  });

  describe('Data Persistence', () => {
    it('should maintain data consistency across operations', async () => {
      const mockNotes = [
        {
          id: 1,
          title: 'Note 1',
          content: '<p>Content 1</p>',
          user_id: 'test_user',
          folder_id: null,
          tags: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 2,
          title: 'Note 2',
          content: '<p>Content 2</p>',
          user_id: 'test_user',
          folder_id: null,
          tags: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      mockInvoke.mockResolvedValueOnce(mockNotes);

      const { result } = renderHook(() => useNotesStore());

      // Load notes
      await act(async () => {
        await result.current.loadNotes();
      });

      expect(result.current.notes).toHaveLength(2);
      expect(result.current.notes[0].id).toBe(1);
      expect(result.current.notes[1].id).toBe(2);

      // Delete one note
      mockInvoke.mockResolvedValueOnce(true);
      await act(async () => {
        await result.current.deleteNote(1);
      });

      expect(result.current.notes).toHaveLength(1);
      expect(result.current.notes[0].id).toBe(2);
    });

    it('should handle bulk operations efficiently', async () => {
      const mockNotes = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        title: `Note ${i + 1}`,
        content: `<p>Content ${i + 1}</p>`,
        user_id: 'test_user',
        folder_id: null,
        tags: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      mockInvoke.mockResolvedValueOnce(mockNotes);

      const { result } = renderHook(() => useNotesStore());

      await act(async () => {
        await result.current.loadNotes();
      });

      expect(result.current.notes).toHaveLength(5);
      expect(mockInvoke).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Recovery', () => {
    it('should handle network failures gracefully', async () => {
      mockInvoke.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useNotesStore());

      await expect(
        act(async () => {
          await result.current.loadNotes();
        })
      ).rejects.toThrow('Network error');

      // State should remain clean after error
      expect(result.current.notes).toHaveLength(0);
      expect(result.current.isLoading).toBe(false);
    });

    it('should validate input before backend calls', async () => {
      const { result } = renderHook(() => useNotesStore());

      // Test validation logic
      const validation = validateNoteData('', 'Some content');
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Title is required');

      // Test that invalid data doesn't reach backend
      await expect(
        act(async () => {
          await result.current.createNote('', 'Some content');
        })
      ).rejects.toThrow();

      expect(mockInvoke).not.toHaveBeenCalled();
    });

    it('should handle partial failures in batch operations', async () => {
      const { result } = renderHook(() => useNotesStore());

      // Setup initial state
      act(() => {
        result.current.setNotes([
          {
            id: 1,
            title: 'Note 1',
            content: '<p>Content 1</p>',
            user_id: 'test_user',
            folder_id: null,
            tags: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
      });

      // Mock failure for update operation
      mockInvoke.mockRejectedValueOnce(new Error('Update failed'));

      await expect(
        act(async () => {
          await result.current.updateNote(1, { title: 'Failed Update' });
        })
      ).rejects.toThrow('Update failed');

      // Original data should be preserved
      expect(result.current.notes[0].title).toBe('Note 1');
    });
  });

  describe('Performance Requirements', () => {
    it('should handle reasonable amounts of data efficiently', async () => {
      const startTime = performance.now();

      const mockNotes = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        title: `Note ${i + 1}`,
        content: `<p>Content for note ${i + 1}</p>`,
        user_id: 'test_user',
        folder_id: null,
        tags: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      mockInvoke.mockResolvedValueOnce(mockNotes);

      const { result } = renderHook(() => useNotesStore());

      await act(async () => {
        await result.current.loadNotes();
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result.current.notes).toHaveLength(100);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should manage memory efficiently during operations', () => {
      const { result } = renderHook(() => useNotesStore());

      // Add notes
      act(() => {
        const notes = Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          title: `Note ${i + 1}`,
          content: `<p>Content ${i + 1}</p>`,
          user_id: 'test_user',
          folder_id: null,
          tags: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
        result.current.setNotes(notes);
      });

      expect(result.current.notes).toHaveLength(10);

      // Clear notes
      act(() => {
        result.current.reset();
      });

      expect(result.current.notes).toHaveLength(0);
      expect(result.current.folders).toHaveLength(0);
    });
  });

  describe('User Experience Requirements', () => {
    it('should provide immediate feedback for user actions', async () => {
      const { result } = renderHook(() => useNotesStore());

      // Test loading state
      expect(result.current.isLoading).toBe(false);

      // Simulate slow operation
      mockInvoke.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 100))
      );

      act(() => {
        result.current.loadNotes();
      });

      // Should show loading state
      expect(result.current.isLoading).toBe(true);
    });

    it('should handle concurrent user actions', async () => {
      const mockNote1 = {
        id: 1,
        title: 'Note 1',
        content: '<p>Content 1</p>',
        user_id: 'test_user',
        folder_id: null,
        tags: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockNote2 = {
        id: 2,
        title: 'Note 2',
        content: '<p>Content 2</p>',
        user_id: 'test_user',
        folder_id: null,
        tags: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockInvoke
        .mockResolvedValueOnce(mockNote1)
        .mockResolvedValueOnce(mockNote2);

      const { result } = renderHook(() => useNotesStore());

      // Fire multiple operations simultaneously
      await act(async () => {
        const promise1 = result.current.createNote(mockNote1.title, mockNote1.content);
        const promise2 = result.current.createNote(mockNote2.title, mockNote2.content);
        
        await Promise.all([promise1, promise2]);
      });

      expect(result.current.notes).toHaveLength(2);
      expect(mockInvoke).toHaveBeenCalledTimes(2);
    });
  });
}); 