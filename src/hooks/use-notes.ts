import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { mapNoteFromDB, mapNoteToDB } from '@/lib/dataMappers';
import { useAuth } from './use-auth';
import type { Item } from '@/lib/types';
import { useToast } from './use-toast';

interface UseNotesResult {
  notes: Item[];
  loading: boolean;
  error: string | null;
  createNote: (note: Omit<Item, 'id' | 'type' | 'createdAt' | 'updatedAt'>) => Promise<Item | null>;
  updateNote: (note: Item) => Promise<Item | null>;
  deleteNote: (id: string) => Promise<boolean>;
  getNoteById: (id: string) => Item | undefined;
  refreshNotes: () => Promise<void>;
}

export function useNotes(): UseNotesResult {
  const [notes, setNotes] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getCurrentUserId } = useAuth();
  const { toast } = useToast();

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', getCurrentUserId())
        .order('updated_at', { ascending: false });
      
      if (fetchError) {
        throw fetchError;
      }
      
      const mappedNotes: Item[] = data.map(mapNoteFromDB);
      setNotes(mappedNotes);
    } catch (err: any) {
      console.error('Error fetching notes:', err.message);
      setError(err.message);
      toast({
        title: 'Error fetching notes',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
    
    // Set up real-time subscription for notes
    const notesSubscription = supabase
      .channel('public:notes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notes',
        filter: `user_id=eq.${getCurrentUserId()}`
      }, (payload) => {
        // Instead of handling each event type specifically,
        // we'll just refetch all notes for simplicity
        fetchNotes();
      })
      .subscribe();
      
    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(notesSubscription);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createNote = async (noteData: Omit<Item, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Promise<Item | null> => {
    try {
      const now = new Date().toISOString();
      const noteToCreate: Item = {
        ...noteData,
        id: uuidv4(),
        type: 'note',
        createdAt: now,
        updatedAt: now,
      };
      
      const dbNote = mapNoteToDB(noteToCreate);
      dbNote.user_id = getCurrentUserId();
      
      const { data, error: insertError } = await supabase
        .from('notes')
        .insert(dbNote)
        .select()
        .single();
      
      if (insertError) {
        throw insertError;
      }
      
      const createdNote = mapNoteFromDB(data);
      
      // Update local state
      setNotes(prevNotes => [createdNote, ...prevNotes]);
      
      toast({
        title: 'Note created',
        description: `"${createdNote.name}" has been created successfully.`,
      });
      
      return createdNote;
    } catch (err: any) {
      console.error('Error creating note:', err.message);
      setError(err.message);
      toast({
        title: 'Error creating note',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateNote = async (note: Item): Promise<Item | null> => {
    try {
      if (note.type !== 'note') {
        throw new Error('Item is not a note');
      }
      
      const now = new Date().toISOString();
      const noteToUpdate = {
        ...note,
        updatedAt: now,
      };
      
      const dbNote = mapNoteToDB(noteToUpdate);
      dbNote.user_id = getCurrentUserId();
      
      const { data, error: updateError } = await supabase
        .from('notes')
        .update({
          title: note.name,
          content: note.content || null,
          image_url: note.imageUrl || null,
          tags: note.tags || null,
          updated_at: now,
        })
        .eq('id', note.id)
        .eq('user_id', getCurrentUserId())
        .select()
        .single();
      
      if (updateError) {
        throw updateError;
      }
      
      const updatedNote = mapNoteFromDB(data);
      
      // Update local state
      setNotes(prevNotes => {
        const updatedNotes = prevNotes.map(n => 
          n.id === updatedNote.id ? updatedNote : n
        );
        // Sort by updated date
        updatedNotes.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        return updatedNotes;
      });
      
      toast({
        title: 'Note updated',
        description: `"${updatedNote.name}" has been updated successfully.`,
      });
      
      return updatedNote;
    } catch (err: any) {
      console.error('Error updating note:', err.message);
      setError(err.message);
      toast({
        title: 'Error updating note',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteNote = async (id: string): Promise<boolean> => {
    try {
      // Get the note name before deleting for the toast message
      const noteToDelete = getNoteById(id);
      
      const { error: deleteError } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('user_id', getCurrentUserId());
      
      if (deleteError) {
        throw deleteError;
      }
      
      // Update local state
      setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
      
      toast({
        title: 'Note deleted',
        description: noteToDelete 
          ? `"${noteToDelete.name}" has been deleted.` 
          : 'Note has been deleted.',
      });
      
      return true;
    } catch (err: any) {
      console.error('Error deleting note:', err.message);
      setError(err.message);
      toast({
        title: 'Error deleting note',
        description: err.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const getNoteById = (id: string): Item | undefined => {
    return notes.find(note => note.id === id);
  };

  const refreshNotes = async (): Promise<void> => {
    await fetchNotes();
  };

  return {
    notes,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    getNoteById,
    refreshNotes,
  };
} 