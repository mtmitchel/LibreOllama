import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { mapAgentFromDB, mapAgentToDB } from '@/lib/dataMappers';
import { useAuth } from './use-auth';
import type { AgentConfig } from '@/lib/types';
import { useToast } from './use-toast';

interface UseAgentsResult {
  agents: AgentConfig[];
  loading: boolean;
  error: string | null;
  createAgent: (agent: Omit<AgentConfig, 'id' | 'createdAt' | 'updatedAt'>) => Promise<AgentConfig | null>;
  updateAgent: (agent: AgentConfig) => Promise<AgentConfig | null>;
  deleteAgent: (id: string) => Promise<boolean>;
  toggleAgentPin: (id: string) => Promise<boolean>;
  getAgentById: (id: string) => AgentConfig | undefined;
  refreshAgents: () => Promise<void>;
}

export function useAgents(): UseAgentsResult {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getCurrentUserId } = useAuth();
  const { toast } = useToast();

  const fetchAgents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', getCurrentUserId());
      
      if (fetchError) {
        throw fetchError;
      }
      
      const mappedAgents = data.map(mapAgentFromDB);
      
      // Sort pinned agents to the top
      mappedAgents.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      
      setAgents(mappedAgents);
    } catch (err: any) {
      console.error('Error fetching agents:', err.message);
      setError(err.message);
      toast({
        title: 'Error fetching agents',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createAgent = async (newAgent: Omit<AgentConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<AgentConfig | null> => {
    try {
      const now = new Date().toISOString();
      const agentToCreate: AgentConfig = {
        ...newAgent,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
      };
      
      const dbAgent = mapAgentToDB(agentToCreate);
      dbAgent.user_id = getCurrentUserId();
      
      const { data, error: insertError } = await supabase
        .from('agents')
        .insert(dbAgent)
        .select()
        .single();
      
      if (insertError) {
        throw insertError;
      }
      
      const createdAgent = mapAgentFromDB(data);
      
      // Update local state
      setAgents(prevAgents => {
        const updatedAgents = [...prevAgents, createdAgent];
        // Keep pinned agents at the top
        updatedAgents.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
        return updatedAgents;
      });
      
      toast({
        title: 'Agent created',
        description: `${createdAgent.name} has been created successfully.`,
      });
      
      return createdAgent;
    } catch (err: any) {
      console.error('Error creating agent:', err.message);
      setError(err.message);
      toast({
        title: 'Error creating agent',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateAgent = async (agent: AgentConfig): Promise<AgentConfig | null> => {
    try {
      const now = new Date().toISOString();
      const agentToUpdate = {
        ...agent,
        updatedAt: now,
      };
      
      const dbAgent = mapAgentToDB(agentToUpdate);
      dbAgent.user_id = getCurrentUserId();
      
      const { data, error: updateError } = await supabase
        .from('agents')
        .update(dbAgent)
        .eq('id', agent.id)
        .eq('user_id', getCurrentUserId())
        .select()
        .single();
      
      if (updateError) {
        throw updateError;
      }
      
      const updatedAgent = mapAgentFromDB(data);
      
      // Update local state
      setAgents(prevAgents => {
        const updatedAgents = prevAgents.map(a => 
          a.id === updatedAgent.id ? updatedAgent : a
        );
        // Keep pinned agents at the top
        updatedAgents.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
        return updatedAgents;
      });
      
      toast({
        title: 'Agent updated',
        description: `${updatedAgent.name} has been updated successfully.`,
      });
      
      return updatedAgent;
    } catch (err: any) {
      console.error('Error updating agent:', err.message);
      setError(err.message);
      toast({
        title: 'Error updating agent',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteAgent = async (id: string): Promise<boolean> => {
    try {
      // Get the agent name before deleting for the toast message
      const agentToDelete = getAgentById(id);
      
      const { error: deleteError } = await supabase
        .from('agents')
        .delete()
        .eq('id', id)
        .eq('user_id', getCurrentUserId());
      
      if (deleteError) {
        throw deleteError;
      }
      
      // Update local state
      setAgents(prevAgents => prevAgents.filter(a => a.id !== id));
      
      toast({
        title: 'Agent deleted',
        description: agentToDelete 
          ? `${agentToDelete.name} has been deleted.` 
          : 'Agent has been deleted.',
      });
      
      return true;
    } catch (err: any) {
      console.error('Error deleting agent:', err.message);
      setError(err.message);
      toast({
        title: 'Error deleting agent',
        description: err.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const toggleAgentPin = async (id: string): Promise<boolean> => {
    try {
      const agent = getAgentById(id);
      if (!agent) {
        throw new Error('Agent not found');
      }
      
      const newPinnedStatus = !agent.pinned;
      
      const { error: updateError } = await supabase
        .from('agents')
        .update({ pinned: newPinnedStatus, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', getCurrentUserId());
      
      if (updateError) {
        throw updateError;
      }
      
      // Update local state
      setAgents(prevAgents => {
        const updatedAgents = prevAgents.map(a => 
          a.id === id ? { ...a, pinned: newPinnedStatus, updatedAt: new Date().toISOString() } : a
        );
        // Keep pinned agents at the top
        updatedAgents.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
        return updatedAgents;
      });
      
      toast({
        title: newPinnedStatus ? 'Agent pinned' : 'Agent unpinned',
        description: `${agent.name} has been ${newPinnedStatus ? 'pinned' : 'unpinned'}.`,
      });
      
      return true;
    } catch (err: any) {
      console.error('Error toggling agent pin:', err.message);
      setError(err.message);
      toast({
        title: 'Error updating agent',
        description: err.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const getAgentById = (id: string): AgentConfig | undefined => {
    return agents.find(agent => agent.id === id);
  };

  const refreshAgents = async (): Promise<void> => {
    await fetchAgents();
  };

  return {
    agents,
    loading,
    error,
    createAgent,
    updateAgent,
    deleteAgent,
    toggleAgentPin,
    getAgentById,
    refreshAgents,
  };
} 