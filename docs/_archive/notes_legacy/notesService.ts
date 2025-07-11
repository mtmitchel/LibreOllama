/**
 * Notes API Service using Tauri Commands
 * 
 * This service provides a clean interface for Notes operations using the 
 * backend service architecture through Tauri commands.
 */

import { invoke } from '@tauri-apps/api/core';
import type { Note, Folder, Block } from '../types';

// =============================================================================
// Backend Response Types (Match EXACT Backend Response)
// =============================================================================

export interface NoteResponse {
  id: string;         // Backend returns string IDs
  title: string;      // Backend returns title
  content: string;    // Backend returns content
  user_id: string;    // Backend returns user_id
  tags: string[];     // Backend returns tags as array
  created_at: string; // Backend returns RFC3339 timestamp
  updated_at: string; // Backend returns RFC3339 timestamp
}

export interface FolderResponse {
  id: string;           // Backend returns string IDs
  name: string;         // Backend returns 'name' NOT 'folder_name'
  parent_id: string | null; // Backend returns string or null
  user_id: string;      // Backend returns user_id
  color: string | null; // Backend returns color or null
  created_at: string;   // Backend returns RFC3339 timestamp
  updated_at: string;   // Backend returns RFC3339 timestamp
}

// =============================================================================
// Backend Request Types (Match Backend Command Expectations)
// =============================================================================

export interface CreateNoteRequest {
  title: string;
  content: string;
  user_id: string;
  tags: string[];
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  tags?: string[];
}

export interface CreateFolderRequest {
  name: string;         // Backend expects 'name' NOT 'folder_name'
  parent_id?: string;   // Backend expects string
  user_id: string;
  color?: string;
}

export interface UpdateFolderRequest {
  name?: string;        // Backend expects 'name' NOT 'folder_name'
  parent_id?: string;   // Backend expects string
  color?: string;
}

// =============================================================================
// Data Transformation Functions
// =============================================================================

/**
 * Convert backend NoteResponse to frontend Note type
 */
function noteResponseToNote(response: NoteResponse, folderId: string = 'default'): Note {
  // Parse content as HTML and convert to blocks (simplified for now)
  const blocks: Block[] = response.content ? [
    {
      id: 'block-1',
      type: 'text',
      content: response.content
    }
  ] : [];

  return {
    id: response.id,              // Already a string from backend
    title: response.title,
    folderId,
    blocks,
    metadata: {
      status: 'active',
      tags: response.tags,        // Already an array from backend
      createdAt: response.created_at,
      updatedAt: response.updated_at
    }
  };
}

/**
 * Convert backend FolderResponse to frontend Folder type
 */
function folderResponseToFolder(response: FolderResponse, notes: Note[] = [], children: Folder[] = []): Folder {
  return {
    id: response.id,              // Already a string from backend
    name: response.name,          // Backend returns 'name'
    parentId: response.parent_id || undefined,
    color: response.color || undefined,
    notes,
    children,
    metadata: {
      createdAt: response.created_at,
      updatedAt: response.updated_at
    }
  };
}

// =============================================================================
// Service Functions
// =============================================================================

/**
 * Get all notes for a user
 */
export async function getNotes(userId: string): Promise<{
  success: boolean;
  notes?: Note[];
  error?: string;
}> {
  try {
    console.log('📋 [NotesService] Getting notes for user:', userId);
    
    const responses = await invoke<NoteResponse[]>('get_notes', {
      userId
    });
    
    const notes = responses.map(response => noteResponseToNote(response));
    
    console.log(`✅ [NotesService] Retrieved ${notes.length} notes`);
    return {
      success: true,
      notes
    };
  } catch (error) {
    console.error('❌ [NotesService] Failed to get notes:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get notes'
    };
  }
}

/**
 * Create a new note
 */
export async function createNote(
  title: string,
  content: string = '',
  tags: string[] = [],
  userId: string = 'default_user'
): Promise<{
  success: boolean;
  note?: Note;
  error?: string;
}> {
  try {
    console.log('📝 [NotesService] Creating new note:', title);
    
    const response = await invoke<NoteResponse>('create_note', {
      note: {
        title,
        content,
        user_id: userId,
        tags
      }
    });
    
    const note = noteResponseToNote(response);
    
    console.log('✅ [NotesService] Note created successfully:', note.id);
    return {
      success: true,
      note
    };
  } catch (error) {
    console.error('❌ [NotesService] Failed to create note:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create note'
    };
  }
}

/**
 * Update an existing note
 */
export async function updateNote(
  noteId: string,
  updates: UpdateNoteRequest
): Promise<{
  success: boolean;
  note?: Note;
  error?: string;
}> {
  try {
    console.log('📝 [NotesService] Updating note:', noteId);
    
    const response = await invoke<NoteResponse>('update_note', {
      id: noteId,           // Backend expects 'id' not 'noteId'
      noteUpdate: updates   // Backend expects 'noteUpdate' not 'updates'
    });
    
    const note = noteResponseToNote(response);
    
    console.log('✅ [NotesService] Note updated successfully:', note.id);
    return {
      success: true,
      note
    };
  } catch (error) {
    console.error('❌ [NotesService] Failed to update note:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update note'
    };
  }
}

/**
 * Delete a note
 */
export async function deleteNote(noteId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    console.log('🗑️ [NotesService] Deleting note:', noteId);
    
    await invoke<void>('delete_note', {
      id: noteId  // Backend expects 'id' not 'noteId'
    });
    
    console.log('✅ [NotesService] Note deleted successfully:', noteId);
    return {
      success: true
    };
  } catch (error) {
    console.error('❌ [NotesService] Failed to delete note:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete note'
    };
  }
}

/**
 * Get a single note by ID
 */
export async function getNote(noteId: string): Promise<{
  success: boolean;
  note?: Note;
  error?: string;
}> {
  try {
    console.log('📋 [NotesService] Getting note:', noteId);
    
    const response = await invoke<NoteResponse | null>('get_note', {
      id: noteId  // Backend expects 'id' not 'noteId'
    });
    
    if (!response) {
      return {
        success: false,
        error: 'Note not found'
      };
    }
    
    const note = noteResponseToNote(response);
    
    console.log('✅ [NotesService] Retrieved note:', note.id);
    return {
      success: true,
      note
    };
  } catch (error) {
    console.error('❌ [NotesService] Failed to get note:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get note'
    };
  }
}

/**
 * Search notes
 */
export async function searchNotes(
  query: string,
  userId: string = 'default_user'
): Promise<{
  success: boolean;
  notes?: Note[];
  error?: string;
}> {
  try {
    console.log('🔍 [NotesService] Searching notes:', query);
    
    const responses = await invoke<NoteResponse[]>('search_notes', {
      query,
      userId
    });
    
    const notes = responses.map(response => noteResponseToNote(response));
    
    console.log(`✅ [NotesService] Found ${notes.length} notes`);
    return {
      success: true,
      notes
    };
  } catch (error) {
    console.error('❌ [NotesService] Failed to search notes:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search notes'
    };
  }
}

// =============================================================================
// Folder Functions
// =============================================================================

/**
 * Get all folders for a user
 */
export async function getFolders(userId: string): Promise<{
  success: boolean;
  folders?: Folder[];
  error?: string;
}> {
  try {
    console.log('📁 [NotesService] Getting folders for user:', userId);
    
    const responses = await invoke<FolderResponse[]>('get_folders', {
      userId
    });
    
    const folders = responses.map(response => folderResponseToFolder(response));
    
    console.log(`✅ [NotesService] Retrieved ${folders.length} folders`);
    return {
      success: true,
      folders
    };
  } catch (error) {
    console.error('❌ [NotesService] Failed to get folders:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get folders'
    };
  }
}

/**
 * Create a new folder
 */
export async function createFolder(
  name: string,
  parentId?: string,
  color?: string,
  userId: string = 'default_user'
): Promise<{
  success: boolean;
  folder?: Folder;
  error?: string;
}> {
  try {
    console.log('📁 [NotesService] Creating new folder:', name);
    
    const response = await invoke<FolderResponse>('create_folder', {
      folder: {
        name,               // Backend expects 'name' NOT 'folder_name'
        parent_id: parentId,
        user_id: userId,
        color
      }
    });
    
    const folder = folderResponseToFolder(response);
    
    console.log('✅ [NotesService] Folder created successfully:', folder.id);
    return {
      success: true,
      folder
    };
  } catch (error) {
    console.error('❌ [NotesService] Failed to create folder:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create folder'
    };
  }
}

/**
 * Update an existing folder
 */
export async function updateFolder(
  folderId: string,
  updates: UpdateFolderRequest
): Promise<{
  success: boolean;
  folder?: Folder;
  error?: string;
}> {
  try {
    console.log('📁 [NotesService] Updating folder:', folderId);
    
    const response = await invoke<FolderResponse>('update_folder', {
      id: folderId,     // Backend expects 'id' not 'folderId'
      folder: updates   // Backend expects 'folder' not 'updates'
    });
    
    const folder = folderResponseToFolder(response);
    
    console.log('✅ [NotesService] Folder updated successfully:', folder.id);
    return {
      success: true,
      folder
    };
  } catch (error) {
    console.error('❌ [NotesService] Failed to update folder:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update folder'
    };
  }
}

/**
 * Delete a folder
 */
export async function deleteFolder(folderId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    console.log('🗑️ [NotesService] Deleting folder:', folderId);
    
    await invoke<void>('delete_folder', {
      id: folderId  // Backend expects 'id' not 'folderId'
    });
    
    console.log('✅ [NotesService] Folder deleted successfully:', folderId);
    return {
      success: true
    };
  } catch (error) {
    console.error('❌ [NotesService] Failed to delete folder:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete folder'
    };
  }
}

// =============================================================================
// NotesService Class (Singleton)
// =============================================================================

class NotesService {
  private static instance: NotesService;
  private userId: string = 'default_user';

  private constructor() {}

  static getInstance(): NotesService {
    if (!NotesService.instance) {
      NotesService.instance = new NotesService();
    }
    return NotesService.instance;
  }

  // User management
  setUserId(userId: string): void {
    this.userId = userId;
  }

  getUserId(): string {
    return this.userId;
  }

  // Note operations
  async createNote(title: string, content: string = '', tags: string[] = []): Promise<Note | null> {
    const result = await createNote(title, content, tags, this.userId);
    return result.success ? result.note || null : null;
  }

  async getNotes(): Promise<Note[]> {
    const result = await getNotes(this.userId);
    return result.success ? result.notes || [] : [];
  }

  async getNote(noteId: string): Promise<Note | null> {
    const result = await getNote(noteId);
    return result.success ? result.note || null : null;
  }

  async updateNote(noteId: string, updates: UpdateNoteRequest): Promise<Note | null> {
    const result = await updateNote(noteId, updates);
    return result.success ? result.note || null : null;
  }

  async deleteNote(noteId: string): Promise<boolean> {
    const result = await deleteNote(noteId);
    return result.success;
  }

  async searchNotes(query: string): Promise<Note[]> {
    const result = await searchNotes(query, this.userId);
    return result.success ? result.notes || [] : [];
  }

  // Folder operations
  async createFolder(name: string, parentId?: string, color?: string): Promise<Folder | null> {
    const result = await createFolder(name, parentId, color, this.userId);
    return result.success ? result.folder || null : null;
  }

  async getFolders(): Promise<Folder[]> {
    const result = await getFolders(this.userId);
    return result.success ? result.folders || [] : [];
  }

  async updateFolder(folderId: string, updates: UpdateFolderRequest): Promise<Folder | null> {
    const result = await updateFolder(folderId, updates);
    return result.success ? result.folder || null : null;
  }

  async deleteFolder(folderId: string): Promise<boolean> {
    const result = await deleteFolder(folderId);
    return result.success;
  }
}

// Export singleton instance
export const notesService = NotesService.getInstance();

// Export default
export default notesService;

// =============================================================================
// Validation Utilities (Added based on test insights)
// =============================================================================

/**
 * Validate note data before creation/update
 */
export function validateNoteData(title: string, content: string): {
  isValid: boolean;
  error?: string;
} {
  if (!title || title.trim().length === 0) {
    return {
      isValid: false,
      error: 'Note title is required'
    };
  }

  if (title.length > 200) {
    return {
      isValid: false,
      error: 'Note title must be 200 characters or less'
    };
  }

  if (content.length > 50000) {
    return {
      isValid: false,
      error: 'Note content must be 50,000 characters or less'
    };
  }

  return {
    isValid: true
  };
}

/**
 * Validate folder data before creation/update
 */
export function validateFolderData(name: string): {
  isValid: boolean;
  error?: string;
} {
  if (!name || name.trim().length === 0) {
    return {
      isValid: false,
      error: 'Folder name is required'
    };
  }

  if (name.length > 100) {
    return {
      isValid: false,
      error: 'Folder name must be 100 characters or less'
    };
  }

  return {
    isValid: true
  };
}

/**
 * Standardized error handling for service operations
 * Based on insights from comprehensive test coverage
 */
export function handleServiceError(error: unknown, operation: string): {
  success: false;
  error: string;
} {
  console.error(`❌ [NotesService] ${operation} failed:`, error);
  
  if (error instanceof Error) {
    return {
      success: false,
      error: error.message
    };
  }
  
  return {
    success: false,
    error: `Unknown error during ${operation}`
  };
} 