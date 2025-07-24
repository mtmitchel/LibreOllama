/**
 * Notes Backend Integration Tests
 * Tests the integration between notes service layer and backend database
 * Following LibreOllama testing standards from Implementation Guide
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { notesService } from '../services/notesService';
import type { Note, Folder } from '../types';

// Mock Tauri invoke function at the HTTP/IPC level (not service level)
vi.mock('@tauri-apps/api/core');

import { invoke } from '@tauri-apps/api/core';
const mockTauriInvoke = vi.mocked(invoke);

describe('Notes Backend Integration', () => {
  beforeEach(() => {
    mockTauriInvoke.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Database Schema Integration', () => {
    it('should handle note creation with proper data transformation', async () => {
      // Mock backend response with database-style data
      const mockBackendResponse = {
        id: 123,                    // Database returns INTEGER
        title: 'Test Note',
        content: 'Test content',
        folder_id: 456,            // Database uses snake_case
        created_at: '2025-01-17T10:00:00Z',
        updated_at: '2025-01-17T10:00:00Z'
      };

      mockTauriInvoke.mockResolvedValueOnce(mockBackendResponse);

      const result = await notesService.createNote({
        title: 'Test Note',
        content: 'Test content',
        folderId: '456'            // Frontend uses string IDs
      });

      // Verify service transforms database response correctly
      expect(result).toEqual({
        id: '123',                 // Converted to string
        title: 'Test Note',
        content: 'Test content',
        folderId: '456',          // Converted to string
        metadata: {
          createdAt: '2025-01-17T10:00:00Z',
          updatedAt: '2025-01-17T10:00:00Z',
          status: 'active'        // Service adds default status
        }
      });

      // Verify correct backend call with proper data transformation
      expect(mockTauriInvoke).toHaveBeenCalledWith('create_note', {
        title: 'Test Note',
        content: 'Test content',
        folderId: 456,            // Converted to number for database
        userId: 'default_user'
      });
    });

    it('should handle folder creation with schema transformation', async () => {
      const mockBackendResponse = {
        id: 789,
        name: 'Test Folder',
        parent_id: null,          // Database uses snake_case and null
        created_at: '2025-01-17T10:00:00Z',
        updated_at: '2025-01-17T10:00:00Z'
      };

      mockTauriInvoke.mockResolvedValueOnce(mockBackendResponse);

      const result = await notesService.createFolder({
        name: 'Test Folder',
        parentId: null            // Frontend uses camelCase
      });

      expect(result).toEqual({
        id: '789',                // Converted to string
        name: 'Test Folder',
        parentId: null,
        children: [],             // Service adds empty children array
        metadata: {
          createdAt: '2025-01-17T10:00:00Z',
          updatedAt: '2025-01-17T10:00:00Z'
        }
      });

      expect(mockTauriInvoke).toHaveBeenCalledWith('create_folder', {
        name: 'Test Folder',
        parentId: null,
        color: null,
        userId: 'default_user'
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle database constraint violations gracefully', async () => {
      const constraintError = new Error('UNIQUE constraint failed: notes.title');
      mockTauriInvoke.mockRejectedValueOnce(constraintError);

      await expect(notesService.createNote({
        title: 'Duplicate Title',
        content: 'Content',
        folderId: null
      })).rejects.toThrow('UNIQUE constraint failed: notes.title');
    });

    it('should handle foreign key constraint violations', async () => {
      const fkError = new Error('FOREIGN KEY constraint failed');
      mockTauriInvoke.mockRejectedValueOnce(fkError);

      await expect(notesService.createNote({
        title: 'Test',
        content: 'Content',
        folderId: '999'           // Non-existent folder
      })).rejects.toThrow('FOREIGN KEY constraint failed');
    });

    it('should handle network/IPC communication failures', async () => {
      const networkError = new Error('Failed to invoke Tauri command');
      mockTauriInvoke.mockRejectedValueOnce(networkError);

      await expect(notesService.getNotes()).rejects.toThrow('Failed to invoke Tauri command');
    });
  });

  describe('Data Type Validation', () => {
    it('should handle various data types correctly', async () => {
      const mockNotes = [
        {
          id: 1,
          title: 'Note 1',
          content: '',              // Empty content
          folder_id: null,          // No folder
          created_at: '2025-01-17T10:00:00Z',
          updated_at: '2025-01-17T10:00:00Z'
        },
        {
          id: 2,
          title: 'Note 2',
          content: 'Rich content with <strong>HTML</strong>',
          folder_id: 123,
          created_at: '2025-01-17T09:00:00Z',
          updated_at: '2025-01-17T11:00:00Z'
        }
      ];

      mockTauriInvoke.mockResolvedValueOnce(mockNotes);

      const result = await notesService.getNotes();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: '1',
        title: 'Note 1',
        content: '',
        folderId: null,
        metadata: {
          createdAt: '2025-01-17T10:00:00Z',
          updatedAt: '2025-01-17T10:00:00Z',
          status: 'active'
        }
      });
      expect(result[1]).toEqual({
        id: '2',
        title: 'Note 2',
        content: 'Rich content with <strong>HTML</strong>',
        folderId: '123',
        metadata: {
          createdAt: '2025-01-17T09:00:00Z',
          updatedAt: '2025-01-17T11:00:00Z',
          status: 'active'
        }
      });
    });

    it('should handle malformed backend responses', async () => {
      const malformedResponse = {
        // Missing required fields
        title: 'Incomplete Note'
        // Missing id, content, etc.
      };

      mockTauriInvoke.mockResolvedValueOnce([malformedResponse]);

      await expect(notesService.getNotes()).rejects.toThrow();
    });
  });

  describe('CRUD Operations Integration', () => {
    it('should handle complete note lifecycle', async () => {
      const noteId = '123';
      
      // Create
      const createResponse = {
        id: 123,
        title: 'Lifecycle Note',
        content: 'Original content',
        folder_id: null,
        created_at: '2025-01-17T10:00:00Z',
        updated_at: '2025-01-17T10:00:00Z'
      };
      mockTauriInvoke.mockResolvedValueOnce(createResponse);

      const createdNote = await notesService.createNote({
        title: 'Lifecycle Note',
        content: 'Original content',
        folderId: null
      });
      expect(createdNote.id).toBe(noteId);

      // Update
      const updateResponse = {
        ...createResponse,
        content: 'Updated content',
        updated_at: '2025-01-17T11:00:00Z'
      };
      mockTauriInvoke.mockResolvedValueOnce(updateResponse);

      const updatedNote = await notesService.updateNote({
        id: noteId,
        content: 'Updated content'
      });
      expect(updatedNote.content).toBe('Updated content');
      expect(updatedNote.metadata.updatedAt).toBe('2025-01-17T11:00:00Z');

      // Delete
      mockTauriInvoke.mockResolvedValueOnce(undefined);
      await expect(notesService.deleteNote(noteId)).resolves.toBeUndefined();

      expect(mockTauriInvoke).toHaveBeenCalledWith('delete_note', { id: noteId });
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        title: `Note ${i + 1}`,
        content: `Content for note ${i + 1}`,
        folder_id: i % 10 || null,
        created_at: '2025-01-17T10:00:00Z',
        updated_at: '2025-01-17T10:00:00Z'
      }));

      mockTauriInvoke.mockResolvedValueOnce(largeDataset);

      const startTime = performance.now();
      const result = await notesService.getNotes();
      const duration = performance.now() - startTime;

      expect(result).toHaveLength(1000);
      expect(duration).toBeLessThan(100); // Should process quickly
    });

    it('should handle concurrent operations correctly', async () => {
      const responses = [
        { id: 1, title: 'Concurrent 1', content: '', folder_id: null, created_at: '2025-01-17T10:00:00Z', updated_at: '2025-01-17T10:00:00Z' },
        { id: 2, title: 'Concurrent 2', content: '', folder_id: null, created_at: '2025-01-17T10:00:00Z', updated_at: '2025-01-17T10:00:00Z' },
        { id: 3, title: 'Concurrent 3', content: '', folder_id: null, created_at: '2025-01-17T10:00:00Z', updated_at: '2025-01-17T10:00:00Z' }
      ];

      mockTauriInvoke
        .mockResolvedValueOnce(responses[0])
        .mockResolvedValueOnce(responses[1])
        .mockResolvedValueOnce(responses[2]);

      const promises = [
        notesService.createNote({ title: 'Concurrent 1', content: '', folderId: null }),
        notesService.createNote({ title: 'Concurrent 2', content: '', folderId: null }),
        notesService.createNote({ title: 'Concurrent 3', content: '', folderId: null })
      ];

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.title).toBe(`Concurrent ${index + 1}`);
      });
    });
  });
}); 