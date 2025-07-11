import { invoke } from '@tauri-apps/api/core';
import type { Note, Folder } from '../types';

// --- Data Normalization ---

function normalizeNote(backendNote: any): Note {
    return {
        id: backendNote.id.toString(),
        title: backendNote.title,
        content: backendNote.content,
        folderId: backendNote.folder_id ? backendNote.folder_id.toString() : null,
        metadata: {
            createdAt: backendNote.created_at,
            updatedAt: backendNote.updated_at,
            status: 'active' // Assuming default, adjust if backend provides this
        }
    };
}

function normalizeFolder(backendFolder: any): Folder {
    return {
        id: backendFolder.id.toString(),
        name: backendFolder.name,
        parentId: backendFolder.parent_id ? backendFolder.parent_id.toString() : null,
        children: [], // Assuming children are not sent in this call
        metadata: {
            createdAt: backendFolder.created_at,
            updatedAt: backendFolder.updated_at
        }
    };
}


export const notesService = {
  async getNotes(): Promise<Note[]> {
    const notes = await invoke<any[]>('get_notes');
    return notes.map(normalizeNote);
  },
  async createNote(note: Omit<Note, 'id' | 'metadata' | 'content'> & { content?: string }): Promise<Note> {
    const newNote = await invoke<any>('create_note', { 
        title: note.title, 
        content: note.content || '', 
        folderId: note.folderId ? parseInt(note.folderId, 10) : null, 
        userId: 'default_user' 
    });
    return normalizeNote(newNote);
  },
  async updateNote(note: Partial<Note> & { id: string }): Promise<Note> {
    const payload: { id: string, note: { title?: string, content?: string, folder_id?: number | null } } = {
        id: note.id,
        note: {}
    };
    if (note.title) payload.note.title = note.title;
    if (note.content) payload.note.content = note.content;
    if (note.folderId !== undefined) {
        payload.note.folder_id = note.folderId ? parseInt(note.folderId, 10) : null;
    }

    const updatedNote = await invoke<any>('update_note', payload);
    return normalizeNote(updatedNote);
  },
  async deleteNote(id: string): Promise<void> {
    await invoke('delete_note', { id });
  },
  async getFolders(): Promise<Folder[]> {
    const folders = await invoke<any[]>('get_folders', { userId: 'default_user' });
    return folders.map(normalizeFolder);
  },
  async createFolder(folder: Omit<Folder, 'id' | 'children' | 'metadata'>): Promise<Folder> {
    const newFolder = await invoke<any>('create_folder', { 
        name: folder.name, 
        parentId: folder.parentId ? parseInt(folder.parentId, 10) : null, 
        userId: 'default_user' 
    });
    return normalizeFolder(newFolder);
  },
  async updateFolder(folder: Partial<Folder> & { id: string }): Promise<Folder> {
    const updatedFolder = await invoke<any>('update_folder', { id: folder.id, folder: { name: folder.name } });
    return normalizeFolder(updatedFolder);
  },
  async deleteFolder(id: string): Promise<void> {
    await invoke('delete_folder', { id });
  },
}; 