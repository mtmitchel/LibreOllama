import { useState, useEffect } from 'react';
import { supabase, Database } from '@/lib/supabase';
import { useToast } from './use-toast';
import { useAuth } from './use-auth';

// Define our n8n types
export type DBN8nConnection = Database['public']['Tables']['n8n_connections']['Row'];

export type N8nWorkflow = {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'error';
  lastRun?: string;
  updatedAt: string;
};

export type N8nConnection = {
  id: string;
  url: string;
  authType: 'apiKey' | 'basic' | 'oauth2' | 'none';
  authDetails: {
    apiKey?: string;
    username?: string;
    password?: string;
    oauthToken?: string;
  } | null;
  workflows?: N8nWorkflow[];
  createdAt: string;
  updatedAt: string;
  userId: string;
};

export type N8nConnectionCreate = Omit<N8nConnection, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'workflows'>;

export function useN8n() {
  const [connections, setConnections] = useState<N8nConnection[]>([]);
  const [activeConnection, setActiveConnection] = useState<N8nConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchConnections = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: connectionData, error: connectionError } = await supabase
        .from('n8n_connections')
        .select('*')
        .eq('user_id', user.id);

      if (connectionError) {
        throw connectionError;
      }

      if (connectionData) {
        // Map from snake_case DB format to camelCase
        const mappedConnections = connectionData.map(conn => ({
          id: conn.id,
          url: conn.url,
          authType: conn.auth_type as N8nConnection['authType'],
          authDetails: conn.auth_details,
          createdAt: conn.created_at,
          updatedAt: conn.updated_at,
          userId: conn.user_id
        }));
        
        setConnections(mappedConnections);
        
        // If there's a connection, set the first one as active
        if (mappedConnections.length > 0 && !activeConnection) {
          setActiveConnection(mappedConnections[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching n8n connections:', err);
      setError(err as Error);
      toast({
        title: 'Error loading n8n connections',
        description: (err as Error).message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createConnection = async (newConnection: N8nConnectionCreate) => {
    if (!user?.id) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Convert to snake_case for DB
      const dbConnection = {
        url: newConnection.url,
        auth_type: newConnection.authType,
        auth_details: newConnection.authDetails,
        user_id: user.id
      };
      
      const { data: createdConnection, error: createError } = await supabase
        .from('n8n_connections')
        .insert(dbConnection)
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      // Convert back to camelCase
      const mappedConnection: N8nConnection = {
        id: createdConnection.id,
        url: createdConnection.url,
        authType: createdConnection.auth_type as N8nConnection['authType'],
        authDetails: createdConnection.auth_details,
        createdAt: createdConnection.created_at,
        updatedAt: createdConnection.updated_at,
        userId: createdConnection.user_id
      };
      
      // Update state
      setConnections(prev => [...prev, mappedConnection]);
      setActiveConnection(mappedConnection);
      
      toast({
        title: 'Connection created',
        description: `Successfully connected to n8n at ${mappedConnection.url}`,
      });
      
      return mappedConnection;
    } catch (err) {
      console.error('Error creating n8n connection:', err);
      setError(err as Error);
      toast({
        title: 'Error creating connection',
        description: (err as Error).message,
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateConnection = async (connectionId: string, updates: Partial<N8nConnectionCreate>) => {
    if (!user?.id) return;
    
    setIsLoading(true);
    
    try {
      // Convert to snake_case for DB
      const dbUpdates: any = {};
      if (updates.url) dbUpdates.url = updates.url;
      if (updates.authType) dbUpdates.auth_type = updates.authType;
      if (updates.authDetails) dbUpdates.auth_details = updates.authDetails;
      
      const { error: updateError } = await supabase
        .from('n8n_connections')
        .update({
          ...dbUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', connectionId)
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setConnections(prev => prev.map(conn => {
        if (conn.id === connectionId) {
          const updated = {
            ...conn,
            ...updates,
            updatedAt: new Date().toISOString()
          };
          
          // If this is the active connection, update that too
          if (activeConnection?.id === connectionId) {
            setActiveConnection(updated);
          }
          
          return updated;
        }
        return conn;
      }));

      toast({
        title: 'Connection updated',
        description: 'Your n8n connection has been updated successfully.',
      });
    } catch (err) {
      console.error('Error updating n8n connection:', err);
      setError(err as Error);
      toast({
        title: 'Error updating connection',
        description: (err as Error).message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConnection = async (connectionId: string) => {
    if (!user?.id) return;
    
    setIsLoading(true);
    
    try {
      const { error: deleteError } = await supabase
        .from('n8n_connections')
        .delete()
        .eq('id', connectionId)
        .eq('user_id', user.id);

      if (deleteError) {
        throw deleteError;
      }

      // Update local state
      setConnections(prev => prev.filter(conn => conn.id !== connectionId));
      
      // If the active connection was deleted, reset it
      if (activeConnection?.id === connectionId) {
        const nextConnection = connections.find(conn => conn.id !== connectionId);
        setActiveConnection(nextConnection || null);
      }

      toast({
        title: 'Connection deleted',
        description: 'Your n8n connection has been deleted successfully.',
      });
    } catch (err) {
      console.error('Error deleting n8n connection:', err);
      setError(err as Error);
      toast({
        title: 'Error deleting connection',
        description: (err as Error).message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setActive = (connectionId: string) => {
    const connection = connections.find(conn => conn.id === connectionId);
    if (connection) {
      setActiveConnection(connection);
    }
  };

  // Mock function to fetch workflows from n8n - would be replaced with actual API call
  const fetchWorkflows = async () => {
    if (!activeConnection) {
      setWorkflows([]);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // In a real implementation, this would make an API call to the n8n instance
      // Mock data for now
      const mockWorkflows: N8nWorkflow[] = [
        {
          id: 'w1',
          name: 'File processor',
          description: 'Processes uploaded files and sends notifications',
          status: 'active',
          lastRun: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'w2',
          name: 'Email automation',
          description: 'Sends scheduled emails based on triggers',
          status: 'active',
          lastRun: new Date(Date.now() - 7200000).toISOString(),
          updatedAt: new Date(Date.now() - 172800000).toISOString()
        },
        {
          id: 'w3',
          name: 'Data sync',
          description: 'Synchronizes data between systems',
          status: 'inactive',
          updatedAt: new Date(Date.now() - 259200000).toISOString()
        }
      ];
      
      setWorkflows(mockWorkflows);
      setIsConnected(true);
    } catch (err) {
      console.error('Error fetching workflows:', err);
      setError(err as Error);
      setIsConnected(false);
      toast({
        title: 'Error loading workflows',
        description: (err as Error).message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Mock function to toggle workflow status
  const toggleWorkflowStatus = async (workflowId: string) => {
    try {
      // In a real implementation, this would make an API call to the n8n instance
      setWorkflows(prev => prev.map(wf => {
        if (wf.id === workflowId) {
          return { 
            ...wf, 
            status: wf.status === 'active' ? 'inactive' : 'active',
            updatedAt: new Date().toISOString()
          };
        }
        return wf;
      }));
      
      toast({
        title: 'Workflow updated',
        description: 'Workflow status has been toggled.',
      });
    } catch (err) {
      console.error('Error toggling workflow:', err);
      toast({
        title: 'Error updating workflow',
        description: (err as Error).message,
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchConnections();
    } else {
      setConnections([]);
      setActiveConnection(null);
      setIsLoading(false);
    }
  }, [user?.id]);

  // When active connection changes, fetch its workflows
  useEffect(() => {
    if (activeConnection) {
      fetchWorkflows();
    } else {
      setWorkflows([]);
      setIsConnected(false);
    }
  }, [activeConnection?.id]);

  return {
    connections,
    activeConnection,
    workflows,
    isLoading,
    isConnected,
    error,
    createConnection,
    updateConnection,
    deleteConnection,
    setActive,
    fetchWorkflows,
    toggleWorkflowStatus,
    refreshConnections: fetchConnections
  };
} 