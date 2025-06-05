import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAuth } from './use-auth';

export interface Folder {
  id: string;
  name: string;
  description?: string;
  color?: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface FolderCreate {
  name: string;
  description?: string;
  color?: string;
  parentId?: string;
}

// Backend request structures
interface CreateFolderRequest extends Record<string, unknown> {
  name: string;
  parent_id?: string;
  color?: string;
  user_id: string;
}

interface UpdateFolderRequest extends Record<string, unknown> {
  name?: string;
  parent_id?: string;
  color?: string;
}

// Backend response structure
interface FolderResponse {
  id: string;
  name: string;
  parent_id?: string;
  color?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface UseFoldersResult {
  folders: Folder[];
  loading: boolean;
  error: string | null;
  createFolder: (folder: FolderCreate) => Promise<Folder | null>;
  updateFolder: (id: string, updates: Partial<FolderCreate>) => Promise<Folder | null>;
  deleteFolder: (id: string) => Promise<boolean>;
  getFolderById: (id: string) => Folder | undefined;
  refreshFolders: () => Promise<void>;
}

export function useFolders(): UseFoldersResult {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getCurrentUserId } = useAuth();

  // Convert backend response to frontend format
  const convertToFrontendFolder = (backendFolder: FolderResponse): Folder => ({
    id: backendFolder.id,
    name: backendFolder.name,
    color: backendFolder.color,
    parentId: backendFolder.parent_id,
    userId: backendFolder.user_id,
    createdAt: backendFolder.created_at,
    updatedAt: backendFolder.updated_at,
  });

  const fetchFolders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Backend connection timeout')), 5000)
      );
      
      const userId = getCurrentUserId();
      const foldersPromise = invoke<FolderResponse[]>('get_folders', { user_id: userId });
      
      const folderData = await Promise.race([foldersPromise, timeoutPromise]) as FolderResponse[];
      const convertedFolders = folderData.map(convertToFrontendFolder);
      setFolders(convertedFolders);
    } catch (err: any) {
      console.error('Error fetching folders:', err);
      
      // Check if it's a backend connection issue
      if (err.message?.includes('timeout') || err.message?.includes('connection')) {
        setError('Backend connection unavailable. Folder functionality is limited.');
        // Set empty folders array to show empty state instead of loading spinner
        setFolders([]);
      } else {
        setError(err.message || 'Failed to fetch folders');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  const createFolder = async (folderData: FolderCreate): Promise<Folder | null> => {
    try {
      setError(null);
      const userId = getCurrentUserId();
      
      // Convert frontend format to backend format
      const createRequest: CreateFolderRequest = {
        name: folderData.name,
        parent_id: folderData.parentId,
        color: folderData.color,
        user_id: userId,
      };
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Create folder timeout')), 10000)
      );
      
      const createPromise = invoke<FolderResponse>('create_folder', createRequest);
      const backendFolder = await Promise.race([createPromise, timeoutPromise]) as FolderResponse;
      const newFolder = convertToFrontendFolder(backendFolder);
      
      setFolders(prevFolders => {
        const updatedFolders = [...prevFolders, newFolder];
        return updatedFolders.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
      
      return newFolder;
    } catch (err: any) {
      console.error('Error creating folder:', err);
      if (err.message?.includes('timeout')) {
        setError('Backend connection unavailable. Cannot create folder.');
      } else {
        setError(err.message || 'Failed to create folder');
      }
      return null;
    }
  };

  const updateFolder = async (id: string, updates: Partial<FolderCreate>): Promise<Folder | null> => {
    try {
      setError(null);
      
      // Convert frontend format to backend format
      const updateRequest: UpdateFolderRequest = {
        ...(updates.name && { name: updates.name }),
        ...(updates.parentId !== undefined && { parent_id: updates.parentId }),
        ...(updates.color && { color: updates.color }),
      };
      
      const backendFolder = await invoke<FolderResponse>('update_folder', {
        id,
        folder: updateRequest
      });
      const updatedFolder = convertToFrontendFolder(backendFolder);
      
      setFolders(prevFolders =>
        prevFolders.map(folder =>
          folder.id === id ? updatedFolder : folder
        )
      );
      
      return updatedFolder;
    } catch (err: any) {
      console.error('Error updating folder:', err);
      setError(err.message || 'Failed to update folder');
      return null;
    }
  };

  const deleteFolder = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      await invoke('delete_folder', { id });
      
      setFolders(prevFolders => prevFolders.filter(folder => folder.id !== id));
      
      return true;
    } catch (err: any) {
      console.error('Error deleting folder:', err);
      setError(err.message || 'Failed to delete folder');
      return false;
    }
  };

  const getFolderById = (id: string): Folder | undefined => {
    return folders.find(folder => folder.id === id);
  };

  const refreshFolders = async (): Promise<void> => {
    await fetchFolders();
  };

  return {
    folders,
    loading,
    error,
    createFolder,
    updateFolder,
    deleteFolder,
    getFolderById,
    refreshFolders,
  };
}