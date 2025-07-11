import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { 
  createNote, 
  getNotes, 
  getNote, 
  updateNote, 
  deleteNote, 
  searchNotes,
  createFolder,
  getFolders,
  updateFolder,
  deleteFolder,
  notesService
} from '../services/notesService';
import type { Note, Folder } from '../types';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

const mockInvoke = vi.mocked(invoke);

describe('notesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Note Operations', () => {
    const mockNoteResponse = {
      id: 'test-note-1',
      title: 'Test Note',
      content: '<p>Test content</p>',
      user_id: 'test-user',
      tags: ['test'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    };

    const mockCreateNoteRequest = {
      title: 'Test Note',
      content: '<p>Test content</p>',
      user_id: 'test-user',
      tags: ['test']
    };

    describe('createNote', () => {
      it('should create a note successfully', async () => {
        mockInvoke.mockResolvedValueOnce(mockNoteResponse);

        const result = await createNote(mockCreateNoteRequest);

        expect(result.success).toBe(true);
        expect(result.note).toBeDefined();
        expect(result.note?.id).toBe('test-note-1');
        expect(result.note?.title).toBe('Test Note');
        expect(mockInvoke).toHaveBeenCalledWith('create_note', {
          note: mockCreateNoteRequest
        });
      });

      it('should handle creation error', async () => {
        mockInvoke.mockRejectedValueOnce(new Error('Database error'));

        const result = await createNote(mockCreateNoteRequest);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Database error');
        expect(result.note).toBeUndefined();
      });
    });

    describe('getNotes', () => {
      it('should get notes successfully', async () => {
        mockInvoke.mockResolvedValueOnce([mockNoteResponse]);

        const result = await getNotes('test-user');

        expect(result.success).toBe(true);
        expect(result.notes).toHaveLength(1);
        expect(result.notes?.[0].id).toBe('test-note-1');
        expect(mockInvoke).toHaveBeenCalledWith('get_notes', {
          userId: 'test-user'
        });
      });

      it('should handle get notes error', async () => {
        mockInvoke.mockRejectedValueOnce(new Error('Database error'));

        const result = await getNotes('test-user');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Database error');
        expect(result.notes).toBeUndefined();
      });
    });

    describe('getNote', () => {
      it('should get a specific note successfully', async () => {
        mockInvoke.mockResolvedValueOnce(mockNoteResponse);

        const result = await getNote('test-note-1');

        expect(result.success).toBe(true);
        expect(result.note?.id).toBe('test-note-1');
        expect(mockInvoke).toHaveBeenCalledWith('get_note', {
          id: 'test-note-1'
        });
      });

      it('should handle note not found', async () => {
        mockInvoke.mockResolvedValueOnce(null);

        const result = await getNote('nonexistent');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Note not found');
      });
    });

    describe('updateNote', () => {
      const mockNote: Note = {
        id: 'test-note-1',
        title: 'Updated Note',
        folderId: 'test-folder',
        blocks: [{ id: 'block-1', type: 'text', content: 'Updated content' }],
        metadata: { status: 'active', tags: ['updated'] }
      };

      it('should update a note successfully', async () => {
        mockInvoke.mockResolvedValueOnce({
          ...mockNoteResponse,
          title: 'Updated Note'
        });

        const result = await updateNote('test-note-1', mockNote);

        expect(result.success).toBe(true);
        expect(result.note?.title).toBe('Updated Note');
        expect(mockInvoke).toHaveBeenCalledWith('update_note', {
          id: 'test-note-1',
          noteUpdate: expect.objectContaining({
            title: 'Updated Note'
          })
        });
      });

      it('should handle update error', async () => {
        mockInvoke.mockRejectedValueOnce(new Error('Update failed'));

        const result = await updateNote('test-note-1', mockNote);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Update failed');
      });
    });

    describe('deleteNote', () => {
      it('should delete a note successfully', async () => {
        mockInvoke.mockResolvedValueOnce(undefined);

        const result = await deleteNote('test-note-1');

        expect(result.success).toBe(true);
        expect(mockInvoke).toHaveBeenCalledWith('delete_note', {
          id: 'test-note-1'
        });
      });

      it('should handle delete error', async () => {
        mockInvoke.mockRejectedValueOnce(new Error('Delete failed'));

        const result = await deleteNote('test-note-1');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Delete failed');
      });
    });

    describe('searchNotes', () => {
      it('should search notes successfully', async () => {
        mockInvoke.mockResolvedValueOnce([mockNoteResponse]);

        const result = await searchNotes('test query', 'test-user');

        expect(result.success).toBe(true);
        expect(result.notes).toHaveLength(1);
        expect(mockInvoke).toHaveBeenCalledWith('search_notes', {
          query: 'test query',
          userId: 'test-user'
        });
      });

      it('should handle search error', async () => {
        mockInvoke.mockRejectedValueOnce(new Error('Search failed'));

        const result = await searchNotes('test query', 'test-user');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Search failed');
      });
    });
  });

  describe('Folder Operations', () => {
    const mockFolderResponse = {
      id: 'test-folder-1',
      name: 'Test Folder',
      parent_id: null,
      color: '#blue',
      user_id: 'test-user',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    };

    const mockCreateFolderRequest = {
      name: 'Test Folder',
      parent_id: null,
      color: '#blue',
      user_id: 'test-user'
    };

    describe('createFolder', () => {
      it('should create a folder successfully', async () => {
        mockInvoke.mockResolvedValueOnce(mockFolderResponse);

        const result = await createFolder(mockCreateFolderRequest);

        expect(result.success).toBe(true);
        expect(result.folder?.id).toBe('test-folder-1');
        expect(result.folder?.name).toBe('Test Folder');
        expect(mockInvoke).toHaveBeenCalledWith('create_folder', {
          folder: mockCreateFolderRequest
        });
      });

      it('should handle creation error', async () => {
        mockInvoke.mockRejectedValueOnce(new Error('Database error'));

        const result = await createFolder(mockCreateFolderRequest);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Database error');
      });
    });

    describe('getFolders', () => {
      it('should get folders successfully', async () => {
        mockInvoke.mockResolvedValueOnce([mockFolderResponse]);

        const result = await getFolders('test-user');

        expect(result.success).toBe(true);
        expect(result.folders).toHaveLength(1);
        expect(result.folders?.[0].id).toBe('test-folder-1');
        expect(mockInvoke).toHaveBeenCalledWith('get_folders', {
          userId: 'test-user'
        });
      });

      it('should handle get folders error', async () => {
        mockInvoke.mockRejectedValueOnce(new Error('Database error'));

        const result = await getFolders('test-user');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Database error');
      });
    });

    describe('updateFolder', () => {
      it('should update a folder successfully', async () => {
        mockInvoke.mockResolvedValueOnce({
          ...mockFolderResponse,
          name: 'Updated Folder'
        });

        const result = await updateFolder('test-folder-1', {
          name: 'Updated Folder'
        });

        expect(result.success).toBe(true);
        expect(result.folder?.name).toBe('Updated Folder');
        expect(mockInvoke).toHaveBeenCalledWith('update_folder', {
          id: 'test-folder-1',
          folder: { name: 'Updated Folder' }
        });
      });

      it('should handle update error', async () => {
        mockInvoke.mockRejectedValueOnce(new Error('Update failed'));

        const result = await updateFolder('test-folder-1', {
          name: 'Updated Folder'
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe('Update failed');
      });
    });

    describe('deleteFolder', () => {
      it('should delete a folder successfully', async () => {
        mockInvoke.mockResolvedValueOnce(undefined);

        const result = await deleteFolder('test-folder-1');

        expect(result.success).toBe(true);
        expect(mockInvoke).toHaveBeenCalledWith('delete_folder', {
          id: 'test-folder-1'
        });
      });

      it('should handle delete error', async () => {
        mockInvoke.mockRejectedValueOnce(new Error('Delete failed'));

        const result = await deleteFolder('test-folder-1');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Delete failed');
      });
    });
  });

  describe('NotesService Class', () => {
    beforeEach(() => {
      notesService.setUserId('test-user');
    });

    describe('createNote', () => {
      it('should create a note using the service class', async () => {
        mockInvoke.mockResolvedValueOnce({
          id: 'test-note-1',
          title: 'Test Note',
          content: '<p>Test content</p>',
          user_id: 'test-user',
          tags: [],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        });

        const result = await notesService.createNote('Test Note', '<p>Test content</p>');

        expect(result).toBeDefined();
        expect(result?.id).toBe('test-note-1');
        expect(result?.title).toBe('Test Note');
      });

      it('should return null on error', async () => {
        mockInvoke.mockRejectedValueOnce(new Error('Database error'));

        const result = await notesService.createNote('Test Note', '<p>Test content</p>');

        expect(result).toBeNull();
      });
    });

    describe('getNotes', () => {
      it('should get notes using the service class', async () => {
        mockInvoke.mockResolvedValueOnce([
          {
            id: 'test-note-1',
            title: 'Test Note',
            content: '<p>Test content</p>',
            user_id: 'test-user',
            tags: [],
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        ]);

        const result = await notesService.getNotes();

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('test-note-1');
      });

      it('should return empty array on error', async () => {
        mockInvoke.mockRejectedValueOnce(new Error('Database error'));

        const result = await notesService.getNotes();

        expect(result).toEqual([]);
      });
    });

    describe('createFolder', () => {
      it('should create a folder using the service class', async () => {
        mockInvoke.mockResolvedValueOnce({
          id: 'test-folder-1',
          name: 'Test Folder',
          parent_id: null,
          color: null,
          user_id: 'test-user',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        });

        const result = await notesService.createFolder('Test Folder');

        expect(result).toBeDefined();
        expect(result?.id).toBe('test-folder-1');
        expect(result?.name).toBe('Test Folder');
      });

      it('should return null on error', async () => {
        mockInvoke.mockRejectedValueOnce(new Error('Database error'));

        const result = await notesService.createFolder('Test Folder');

        expect(result).toBeNull();
      });
    });
  });
}); 