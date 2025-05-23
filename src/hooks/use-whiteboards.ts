import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { mapWhiteboardFromDB, mapWhiteboardToDB } from '@/lib/dataMappers';
import { useAuth } from './use-auth';
import type { Item } from '@/lib/types';
import { useToast } from './use-toast';

interface UseWhiteboardsResult {
  whiteboards: Item[];
  loading: boolean;
  error: string | null;
  createWhiteboard: (whiteboard: Omit<Item, 'id' | 'type' | 'createdAt' | 'updatedAt'>) => Promise<Item | null>;
  updateWhiteboard: (whiteboard: Item) => Promise<Item | null>;
  deleteWhiteboard: (id: string) => Promise<boolean>;
  getWhiteboardById: (id: string) => Item | undefined;
  refreshWhiteboards: () => Promise<void>;
}

export function useWhiteboards(): UseWhiteboardsResult {
  const [whiteboards, setWhiteboards] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getCurrentUserId } = useAuth();
  const { toast } = useToast();

  const fetchWhiteboards = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('whiteboards')
        .select('*')
        .eq('user_id', getCurrentUserId())
        .order('updated_at', { ascending: false });
      
      if (fetchError) {
        throw fetchError;
      }
      
      const mappedWhiteboards: Item[] = data.map(mapWhiteboardFromDB);
      setWhiteboards(mappedWhiteboards);
    } catch (err: any) {
      console.error('Error fetching whiteboards:', err.message);
      setError(err.message);
      toast({
        title: 'Error fetching whiteboards',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWhiteboards();
    
    // Set up real-time subscription for whiteboards
    const whiteboardsSubscription = supabase
      .channel('public:whiteboards')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'whiteboards',
        filter: `user_id=eq.${getCurrentUserId()}`
      }, (payload) => {
        // For simplicity, just refetch all whiteboards when anything changes
        fetchWhiteboards();
      })
      .subscribe();
      
    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(whiteboardsSubscription);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createWhiteboard = async (whiteboardData: Omit<Item, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Promise<Item | null> => {
    try {
      const now = new Date().toISOString();
      const whiteboardToCreate: Item = {
        ...whiteboardData,
        id: uuidv4(),
        type: 'whiteboard',
        createdAt: now,
        updatedAt: now,
      };
      
      const dbWhiteboard = mapWhiteboardToDB(whiteboardToCreate);
      dbWhiteboard.user_id = getCurrentUserId();
      
      const { data, error: insertError } = await supabase
        .from('whiteboards')
        .insert(dbWhiteboard)
        .select()
        .single();
      
      if (insertError) {
        throw insertError;
      }
      
      const createdWhiteboard = mapWhiteboardFromDB(data);
      
      // Update local state
      setWhiteboards(prevWhiteboards => [createdWhiteboard, ...prevWhiteboards]);
      
      toast({
        title: 'Whiteboard created',
        description: `"${createdWhiteboard.name}" has been created successfully.`,
      });
      
      return createdWhiteboard;
    } catch (err: any) {
      console.error('Error creating whiteboard:', err.message);
      setError(err.message);
      toast({
        title: 'Error creating whiteboard',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateWhiteboard = async (whiteboard: Item): Promise<Item | null> => {
    try {
      if (whiteboard.type !== 'whiteboard') {
        throw new Error('Item is not a whiteboard');
      }
      
      const now = new Date().toISOString();
      const whiteboardToUpdate = {
        ...whiteboard,
        updatedAt: now,
      };
      
      const dbWhiteboard = mapWhiteboardToDB(whiteboardToUpdate);
      dbWhiteboard.user_id = getCurrentUserId();
      
      const { data, error: updateError } = await supabase
        .from('whiteboards')
        .update({
          name: whiteboard.name,
          content: whiteboard.content || null,
          image_url: whiteboard.imageUrl || null,
          tags: whiteboard.tags || null,
          updated_at: now,
        })
        .eq('id', whiteboard.id)
        .eq('user_id', getCurrentUserId())
        .select()
        .single();
      
      if (updateError) {
        throw updateError;
      }
      
      const updatedWhiteboard = mapWhiteboardFromDB(data);
      
      // Update local state
      setWhiteboards(prevWhiteboards => {
        const updatedWhiteboards = prevWhiteboards.map(w => 
          w.id === updatedWhiteboard.id ? updatedWhiteboard : w
        );
        // Sort by updated date
        updatedWhiteboards.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        return updatedWhiteboards;
      });
      
      toast({
        title: 'Whiteboard updated',
        description: `"${updatedWhiteboard.name}" has been updated successfully.`,
      });
      
      return updatedWhiteboard;
    } catch (err: any) {
      console.error('Error updating whiteboard:', err.message);
      setError(err.message);
      toast({
        title: 'Error updating whiteboard',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteWhiteboard = async (id: string): Promise<boolean> => {
    try {
      // Get the whiteboard name before deleting for the toast message
      const whiteboardToDelete = getWhiteboardById(id);
      
      const { error: deleteError } = await supabase
        .from('whiteboards')
        .delete()
        .eq('id', id)
        .eq('user_id', getCurrentUserId());
      
      if (deleteError) {
        throw deleteError;
      }
      
      // Update local state
      setWhiteboards(prevWhiteboards => prevWhiteboards.filter(whiteboard => whiteboard.id !== id));
      
      toast({
        title: 'Whiteboard deleted',
        description: whiteboardToDelete 
          ? `"${whiteboardToDelete.name}" has been deleted.` 
          : 'Whiteboard has been deleted.',
      });
      
      return true;
    } catch (err: any) {
      console.error('Error deleting whiteboard:', err.message);
      setError(err.message);
      toast({
        title: 'Error deleting whiteboard',
        description: err.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const getWhiteboardById = (id: string): Item | undefined => {
    return whiteboards.find(whiteboard => whiteboard.id === id);
  };

  const refreshWhiteboards = async (): Promise<void> => {
    await fetchWhiteboards();
  };

  return {
    whiteboards,
    loading,
    error,
    createWhiteboard,
    updateWhiteboard,
    deleteWhiteboard,
    getWhiteboardById,
    refreshWhiteboards,
  };
} 