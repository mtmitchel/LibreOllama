import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { mapFolderFromDB } from '@/lib/dataMappers';
import { useAuth } from './use-auth';
import type { Folder, Item } from '@/lib/types';
import { useToast } from './use-toast';

interface UseFoldersResult {
  folders: Folder[];
  rootFolders: Folder[];
  loading: boolean;
  error: string | null;
  createFolder: (name: string, parentId?: string) => Promise<Folder | null>;
  updateFolder: (id: string, name: string) => Promise<Folder | null>;
  deleteFolder: (id: string) => Promise<boolean>;
  moveItem: (itemId: string, folderId: string | null) => Promise<boolean>;
  getFolderById: (id: string) => Folder | undefined;
  refreshFolders: () => Promise<void>;
}

export function useFolders(): UseFoldersResult {
  const [allFolders, setAllFolders] = useState<Folder[]>([]);
  const [rootFolders, setRootFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getCurrentUserId } = useAuth();
  const { toast } = useToast();

  // Build folder hierarchy from flat list
  const buildFolderHierarchy = (folders: any[], items: Item[]) => {
    // First create a map of all folders with empty children arrays
    const folderMap: Record<string, Folder> = {};
    folders.forEach(folder => {
      folderMap[folder.id] = {
        id: folder.id,
        name: folder.name,
        children: [],
        items: []
      };
    });
    
    // Then populate children and build hierarchy
    const rootFolders: Folder[] = [];
    
    folders.forEach(folder => {
      if (folder.parent_id) {
        // This is a child folder
        if (folderMap[folder.parent_id]) {
          folderMap[folder.parent_id].children.push(folderMap[folder.id]);
        } else {
          // If parent doesn't exist, treat as root
          rootFolders.push(folderMap[folder.id]);
        }
      } else {
        // This is a root folder
        rootFolders.push(folderMap[folder.id]);
      }
    });
    
    // Distribute items to their folders
    items.forEach(item => {
      // Implement this when folder_items junction table is added
      // For now, we'll assume all items are in root (not implemented in this initial hook)
    });
    
    return { allFolders: Object.values(folderMap), rootFolders };
  };

  const fetchFolders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all folders for the user
      const { data: foldersData, error: foldersError } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', getCurrentUserId())
        .order('name');
      
      if (foldersError) {
        throw foldersError;
      }
      
      // For a complete implementation, we would also fetch items and their folder associations
      // This would require a folder_items junction table
      // For now, we'll just build the folder hierarchy without items

      const { allFolders, rootFolders } = buildFolderHierarchy(foldersData, []);
      
      setAllFolders(allFolders);
      setRootFolders(rootFolders);
    } catch (err: any) {
      console.error('Error fetching folders:', err.message);
      setError(err.message);
      toast({
        title: 'Error fetching folders',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
    
    // Set up real-time subscription for folders
    const foldersSubscription = supabase
      .channel('public:folders')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'folders',
        filter: `user_id=eq.${getCurrentUserId()}`
      }, (payload) => {
        // Just refetch all folders for simplicity
        fetchFolders();
      })
      .subscribe();
      
    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(foldersSubscription);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createFolder = async (name: string, parentId?: string): Promise<Folder | null> => {
    try {
      const now = new Date().toISOString();
      const folderId = uuidv4();
      
      const { data, error: insertError } = await supabase
        .from('folders')
        .insert({
          id: folderId,
          name,
          parent_id: parentId || null,
          user_id: getCurrentUserId(),
          created_at: now,
          updated_at: now
        })
        .select()
        .single();
      
      if (insertError) {
        throw insertError;
      }
      
      // Refresh folders to update hierarchy
      await fetchFolders();
      
      // Find the created folder in the updated state
      const createdFolder = allFolders.find(f => f.id === folderId);
      
      toast({
        title: 'Folder created',
        description: `"${name}" folder has been created successfully.`,
      });
      
      return createdFolder || null;
    } catch (err: any) {
      console.error('Error creating folder:', err.message);
      setError(err.message);
      toast({
        title: 'Error creating folder',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateFolder = async (id: string, name: string): Promise<Folder | null> => {
    try {
      const now = new Date().toISOString();
      
      const { error: updateError } = await supabase
        .from('folders')
        .update({
          name,
          updated_at: now
        })
        .eq('id', id)
        .eq('user_id', getCurrentUserId());
      
      if (updateError) {
        throw updateError;
      }
      
      // Refresh folders to update hierarchy
      await fetchFolders();
      
      // Find the updated folder in the updated state
      const updatedFolder = allFolders.find(f => f.id === id);
      
      toast({
        title: 'Folder updated',
        description: `"${name}" folder has been updated successfully.`,
      });
      
      return updatedFolder || null;
    } catch (err: any) {
      console.error('Error updating folder:', err.message);
      setError(err.message);
      toast({
        title: 'Error updating folder',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteFolder = async (id: string): Promise<boolean> => {
    try {
      // Get the folder name before deleting for the toast message
      const folderToDelete = getFolderById(id);
      
      // First ensure all child folders are reassigned to parent or made root
      const childFolders = allFolders.filter(f => 
        f.children.some(child => child.id === id)
      );
      
      // Get parent folder of the folder being deleted
      const parentFolder = allFolders.find(f => 
        f.children.some(child => child.id === id)
      );
      
      // Update all child folders to point to the parent of the deleted folder
      // or make them root folders if the deleted folder was a root folder
      for (const childFolder of childFolders) {
        await supabase
          .from('folders')
          .update({
            parent_id: parentFolder?.id || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', childFolder.id)
          .eq('user_id', getCurrentUserId());
      }
      
      // Delete the folder
      const { error: deleteError } = await supabase
        .from('folders')
        .delete()
        .eq('id', id)
        .eq('user_id', getCurrentUserId());
      
      if (deleteError) {
        throw deleteError;
      }
      
      // Refresh folders to update hierarchy
      await fetchFolders();
      
      toast({
        title: 'Folder deleted',
        description: folderToDelete 
          ? `"${folderToDelete.name}" folder has been deleted.` 
          : 'Folder has been deleted.',
      });
      
      return true;
    } catch (err: any) {
      console.error('Error deleting folder:', err.message);
      setError(err.message);
      toast({
        title: 'Error deleting folder',
        description: err.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const moveItem = async (itemId: string, folderId: string | null): Promise<boolean> => {
    try {
      // This would require a folder_items junction table
      // Implementation will be needed when that table is added
      toast({
        title: 'Not implemented',
        description: 'Moving items between folders is not yet implemented.',
        variant: 'destructive',
      });
      return false;
    } catch (err: any) {
      console.error('Error moving item:', err.message);
      setError(err.message);
      toast({
        title: 'Error moving item',
        description: err.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const getFolderById = (id: string): Folder | undefined => {
    return allFolders.find(folder => folder.id === id);
  };

  const refreshFolders = async (): Promise<void> => {
    await fetchFolders();
  };

  return {
    folders: allFolders,
    rootFolders,
    loading,
    error,
    createFolder,
    updateFolder,
    deleteFolder,
    moveItem,
    getFolderById,
    refreshFolders,
  };
} 