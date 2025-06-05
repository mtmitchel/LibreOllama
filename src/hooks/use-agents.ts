import { useState, useEffect } from 'react';
import { localDb } from '@/lib/database-adapter';
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
      
      const agents = await localDb.agents.findAll(getCurrentUserId());
      
      // Sort pinned agents to the top
      agents.sort((a: AgentConfig, b: AgentConfig) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      
      setAgents(agents);
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
  }, [getCurrentUserId]);
  const createAgent = async (newAgent: Omit<AgentConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<AgentConfig | null> => {
    try {
      const createdAgent = await localDb.agents.create({
        ...newAgent,
        userId: getCurrentUserId(),
      });
      
      // Update local state
      setAgents(prevAgents => {
        const updatedAgents = [...prevAgents, createdAgent];
        // Keep pinned agents at the top
        updatedAgents.sort((a: AgentConfig, b: AgentConfig) => {
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
      const updatedAgent = await localDb.agents.update(agent.id, agent);
      
      if (!updatedAgent) {
        throw new Error('Agent not found');
      }
      
      // Update local state
      setAgents(prevAgents => {
        const updatedAgents = prevAgents.map(a => 
          a.id === updatedAgent.id ? updatedAgent : a
        );
        // Keep pinned agents at the top
        updatedAgents.sort((a: AgentConfig, b: AgentConfig) => {
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
      
      const success = await localDb.agents.delete(id);
      
      if (!success) {
        throw new Error('Failed to delete agent');
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
      
      const updatedAgent = await localDb.agents.update(id, {
        ...agent,
        pinned: !agent.pinned,
      });
      
      if (!updatedAgent) {
        throw new Error('Failed to update agent');
      }
      
      // Update local state
      setAgents(prevAgents => {
        const updatedAgents = prevAgents.map(a => 
          a.id === id ? updatedAgent : a
        );
        // Keep pinned agents at the top
        updatedAgents.sort((a: AgentConfig, b: AgentConfig) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
        return updatedAgents;
      });
      
      toast({
        title: updatedAgent.pinned ? 'Agent pinned' : 'Agent unpinned',
        description: `${updatedAgent.name} has been ${updatedAgent.pinned ? 'pinned' : 'unpinned'}.`,
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