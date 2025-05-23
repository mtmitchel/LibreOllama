import { useState, useEffect } from 'react';
import { supabase, Database } from '@/lib/supabase';
import { useToast } from './use-toast';
import { useAuth } from './use-auth';

// Define our MCP server types
export type DBMcpServer = Database['public']['Tables']['mcp_servers']['Row'];

export type McpServerAuthType = 'none' | 'apiKey' | 'basic' | 'oauth2' | 'bearer';

export type McpServer = {
  id: string;
  name: string;
  url: string;
  authType: McpServerAuthType | null;
  authDetails: {
    apiKey?: string;
    username?: string;
    password?: string;
    bearerToken?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  status?: 'online' | 'offline' | 'error' | 'unknown';
};

export type McpServerCreate = Omit<McpServer, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'status'>;

export function useMcpServers() {
  const [servers, setServers] = useState<McpServer[]>([]);
  const [activeServer, setActiveServer] = useState<McpServer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchServers = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: serverData, error: serverError } = await supabase
        .from('mcp_servers')
        .select('*')
        .eq('user_id', user.id);

      if (serverError) {
        throw serverError;
      }

      if (serverData) {
        // Map from snake_case DB format to camelCase
        const mappedServers = serverData.map(server => ({
          id: server.id,
          name: server.name,
          url: server.url,
          authType: server.auth_type as McpServerAuthType | null,
          authDetails: server.auth_details,
          createdAt: server.created_at,
          updatedAt: server.updated_at,
          userId: server.user_id,
          // Add status as unknown by default (would be determined by a health check)
          status: 'unknown' as const
        }));
        
        setServers(mappedServers);
        
        // If there's a server, set the first one as active
        if (mappedServers.length > 0 && !activeServer) {
          setActiveServer(mappedServers[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching MCP servers:', err);
      setError(err as Error);
      toast({
        title: 'Error loading MCP servers',
        description: (err as Error).message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createServer = async (newServer: McpServerCreate) => {
    if (!user?.id) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Convert to snake_case for DB
      const dbServer = {
        name: newServer.name,
        url: newServer.url,
        auth_type: newServer.authType,
        auth_details: newServer.authDetails,
        user_id: user.id
      };
      
      const { data: createdServer, error: createError } = await supabase
        .from('mcp_servers')
        .insert(dbServer)
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      // Convert back to camelCase
      const mappedServer: McpServer = {
        id: createdServer.id,
        name: createdServer.name,
        url: createdServer.url,
        authType: createdServer.auth_type as McpServerAuthType | null,
        authDetails: createdServer.auth_details,
        createdAt: createdServer.created_at,
        updatedAt: createdServer.updated_at,
        userId: createdServer.user_id,
        status: 'unknown'
      };
      
      // Update state
      setServers(prev => [...prev, mappedServer]);
      
      // If this is the first server, set it as active
      if (servers.length === 0) {
        setActiveServer(mappedServer);
      }
      
      toast({
        title: 'MCP Server created',
        description: `Successfully added MCP server '${mappedServer.name}'`,
      });
      
      return mappedServer;
    } catch (err) {
      console.error('Error creating MCP server:', err);
      setError(err as Error);
      toast({
        title: 'Error creating MCP server',
        description: (err as Error).message,
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateServer = async (serverId: string, updates: Partial<McpServerCreate>) => {
    if (!user?.id) return;
    
    setIsLoading(true);
    
    try {
      // Convert to snake_case for DB
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.url !== undefined) dbUpdates.url = updates.url;
      if (updates.authType !== undefined) dbUpdates.auth_type = updates.authType;
      if (updates.authDetails !== undefined) dbUpdates.auth_details = updates.authDetails;
      
      const { error: updateError } = await supabase
        .from('mcp_servers')
        .update({
          ...dbUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', serverId)
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setServers(prev => prev.map(server => {
        if (server.id === serverId) {
          const updated = {
            ...server,
            ...updates,
            updatedAt: new Date().toISOString()
          };
          
          // If this is the active server, update that too
          if (activeServer?.id === serverId) {
            setActiveServer(updated);
          }
          
          return updated;
        }
        return server;
      }));

      toast({
        title: 'MCP Server updated',
        description: 'Your MCP server has been updated successfully.',
      });
    } catch (err) {
      console.error('Error updating MCP server:', err);
      setError(err as Error);
      toast({
        title: 'Error updating MCP server',
        description: (err as Error).message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteServer = async (serverId: string) => {
    if (!user?.id) return;
    
    setIsLoading(true);
    
    try {
      const { error: deleteError } = await supabase
        .from('mcp_servers')
        .delete()
        .eq('id', serverId)
        .eq('user_id', user.id);

      if (deleteError) {
        throw deleteError;
      }

      // Update local state
      setServers(prev => prev.filter(server => server.id !== serverId));
      
      // If the active server was deleted, reset it
      if (activeServer?.id === serverId) {
        const nextServer = servers.find(server => server.id !== serverId);
        setActiveServer(nextServer || null);
      }

      toast({
        title: 'MCP Server deleted',
        description: 'Your MCP server has been deleted successfully.',
      });
    } catch (err) {
      console.error('Error deleting MCP server:', err);
      setError(err as Error);
      toast({
        title: 'Error deleting MCP server',
        description: (err as Error).message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setActive = (serverId: string) => {
    const server = servers.find(server => server.id === serverId);
    if (server) {
      setActiveServer(server);
    }
  };

  // Mock function to check server health - would be replaced with actual health check
  const checkServerHealth = async (serverId?: string) => {
    setIsLoading(true);
    
    try {
      // Get the servers to check - either the specified one or all
      const serversToCheck = serverId 
        ? servers.filter(server => server.id === serverId)
        : servers;
      
      // Mock health check - in real implementation, this would make API calls to each server
      const updatedServers = servers.map(server => {
        if (serversToCheck.find(s => s.id === server.id)) {
          // Random status for demonstration purposes
          const statusOptions: McpServer['status'][] = ['online', 'offline', 'error', 'unknown'];
          const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];
          
          return { ...server, status: randomStatus };
        }
        return server;
      });
      
      setServers(updatedServers);
      
      // Update active server if needed
      if (activeServer && serverId === activeServer.id) {
        const updatedActive = updatedServers.find(server => server.id === serverId);
        if (updatedActive) {
          setActiveServer(updatedActive);
        }
      }
      
      toast({
        title: 'Health check complete',
        description: serverId 
          ? 'Server health check completed.'
          : 'All server health checks completed.',
      });
    } catch (err) {
      console.error('Error checking server health:', err);
      setError(err as Error);
      toast({
        title: 'Error checking server health',
        description: (err as Error).message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchServers();
    } else {
      setServers([]);
      setActiveServer(null);
      setIsLoading(false);
    }
  }, [user?.id]);

  return {
    servers,
    activeServer,
    isLoading,
    error,
    createServer,
    updateServer,
    deleteServer,
    setActive,
    checkServerHealth,
    refreshServers: fetchServers
  };
} 