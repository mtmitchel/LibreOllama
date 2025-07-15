import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useNotesStore } from '../store';
import { invoke } from '@tauri-apps/api/core';

// Mock Tauri invoke with factory function to avoid hoisting issues
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Get the mocked invoke function
const mockInvoke = vi.mocked(invoke);

// Mock note data
const mockNote = {
  id: 1,
  title: 'Test Note',
  content: '<p>Test content</p>',
  user_id: 'test_user',
  folder_id: null,
  tags: null,
  created_at: '2025-01-17T10:00:00Z',
  updated_at: '2025-01-17T10:00:00Z',
};

const mockFolder = {
  id: 1,
  folder_name: 'Test Folder',
  parent_id: null,
  user_id: 'test_user',
  color: null,
  created_at: '2025-01-17T10:00:00Z',
  updated_at: '2025-01-17T10:00:00Z',
};

describe('Notes Backend Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNotesStore.getState().reset();
    mockInvoke.mockClear();
  });

  describe('Note CRUD Operations', () => {
    it('should create a new note via backend', async () => {
      const newNote = { ...mockNote, id: undefined };
      mockInvoke.mockResolvedValueOnce(mockNote);

      const { result } = renderHook(() => useNotesStore());

      await act(async () => {
        await result.current.createNote(newNote.title, newNote.content);
      });

      expect(mockInvoke).toHaveBeenCalledWith('create_note', {
        title: newNote.title,
        content: newNote.content,
        user_id: 'test_user',
        folder_id: null,
        tags: null,
      });
      
      await waitFor(() => {
        expect(result.current.notes).toHaveLength(1);
        expect(result.current.notes[0]).toMatchObject({
          title: mockNote.title,
          content: mockNote.content,
        });
      });
    });

    it('should load notes from backend', async () => {
      mockInvoke.mockResolvedValueOnce([mockNote]);

      const { result } = renderHook(() => useNotesStore());

      await act(async () => {
        await result.current.loadNotes();
      });

      expect(mockInvoke).toHaveBeenCalledWith('get_all_notes', { user_id: 'test_user' });
      
      await waitFor(() => {
        expect(result.current.notes).toHaveLength(1);
        expect(result.current.notes[0]).toEqual(mockNote);
      });
    });

    it('should update an existing note', async () => {
      const updatedNote = { ...mockNote, content: '<p>Updated content</p>' };
      mockInvoke.mockResolvedValueOnce(updatedNote);

      const { result } = renderHook(() => useNotesStore());
      
      // Set initial note
      act(() => {
        result.current.setNotes([mockNote]);
      });

      await act(async () => {
        await result.current.updateNote(mockNote.id, {
          content: updatedNote.content,
        });
      });

      expect(mockInvoke).toHaveBeenCalledWith('update_note', {
        id: mockNote.id,
        content: updatedNote.content,
      });
      
      await waitFor(() => {
        expect(result.current.notes[0].content).toBe(updatedNote.content);
      });
    });

    it('should delete a note', async () => {
      mockInvoke.mockResolvedValueOnce(true);

      const { result } = renderHook(() => useNotesStore());
      
      // Set initial note
      act(() => {
        result.current.setNotes([mockNote]);
      });

      await act(async () => {
        await result.current.deleteNote(mockNote.id);
      });

      expect(mockInvoke).toHaveBeenCalledWith('delete_note', { id: mockNote.id });
      
      await waitFor(() => {
        expect(result.current.notes).toHaveLength(0);
      });
    });
  });

  describe('Folder Operations', () => {
    it('should create a folder via backend', async () => {
      mockInvoke.mockResolvedValueOnce(mockFolder);

      const { result } = renderHook(() => useNotesStore());

      await act(async () => {
        await result.current.createFolder(mockFolder.folder_name);
      });

      expect(mockInvoke).toHaveBeenCalledWith('create_folder', {
        folder_name: mockFolder.folder_name,
        parent_id: null,
        user_id: 'test_user',
        color: null,
      });
      
      await waitFor(() => {
        expect(result.current.folders).toHaveLength(1);
        expect(result.current.folders[0]).toEqual(mockFolder);
      });
    });

    it('should load folders from backend', async () => {
      mockInvoke.mockResolvedValueOnce([mockFolder]);

      const { result } = renderHook(() => useNotesStore());

      await act(async () => {
        await result.current.loadFolders();
      });

      expect(mockInvoke).toHaveBeenCalledWith('get_all_folders', { user_id: 'test_user' });
      
      await waitFor(() => {
        expect(result.current.folders).toHaveLength(1);
        expect(result.current.folders[0]).toEqual(mockFolder);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle note creation errors', async () => {
      const errorMessage = 'Failed to create note';
      mockInvoke.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useNotesStore());

      await expect(
        act(async () => {
          await result.current.createNote('Test', 'Content');
        })
      ).rejects.toThrow(errorMessage);

      expect(result.current.notes).toHaveLength(0);
    });

    it('should handle note loading errors', async () => {
      const errorMessage = 'Failed to load notes';
      mockInvoke.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useNotesStore());

      await expect(
        act(async () => {
          await result.current.loadNotes();
        })
      ).rejects.toThrow(errorMessage);
    });

    it('should handle folder creation errors', async () => {
      const errorMessage = 'Failed to create folder';
      mockInvoke.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useNotesStore());

      await expect(
        act(async () => {
          await result.current.createFolder('Test Folder');
        })
      ).rejects.toThrow(errorMessage);

      expect(result.current.folders).toHaveLength(0);
    });
  });

  describe('State Management', () => {
    it('should maintain correct loading states', async () => {
      mockInvoke.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve([mockNote]), 100)));

      const { result } = renderHook(() => useNotesStore());

      // Check initial state
      expect(result.current.isLoading).toBe(false);

      // Start loading
      act(() => {
        result.current.loadNotes();
      });

      // Should be loading
      expect(result.current.isLoading).toBe(true);

      // Wait for completion
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 200 });

      expect(result.current.notes).toHaveLength(1);
    });

    it('should handle concurrent operations correctly', async () => {
      mockInvoke
        .mockResolvedValueOnce([mockNote])
        .mockResolvedValueOnce([mockFolder]);

      const { result } = renderHook(() => useNotesStore());

      await act(async () => {
        // Fire both operations simultaneously
        const notesPromise = result.current.loadNotes();
        const foldersPromise = result.current.loadFolders();
        
        await Promise.all([notesPromise, foldersPromise]);
      });

      expect(result.current.notes).toHaveLength(1);
      expect(result.current.folders).toHaveLength(1);
    });
  });

  describe('Data Validation', () => {
    it('should validate note data before sending to backend', async () => {
      const { result } = renderHook(() => useNotesStore());

      // Test empty title
      await expect(
        act(async () => {
          await result.current.createNote('', 'Content');
        })
      ).rejects.toThrow();

      expect(mockInvoke).not.toHaveBeenCalled();
    });

    it('should handle malformed backend responses', async () => {
      mockInvoke.mockResolvedValueOnce(null);

      const { result } = renderHook(() => useNotesStore());

      await expect(
        act(async () => {
          await result.current.loadNotes();
        })
      ).rejects.toThrow();
    });
  });
}); 