import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAuth } from './use-auth';

// Define our MCP server types based on backend structure
export type McpServer = {
  id: string;
  name: string;
  description?: string;
  serverType: string; // "stdio" or "sse"
  command?: string;
  args?: string[];
  env?: Record<string, unknown>;
  url?: string;
  authToken?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  status?: 'online' | 'offline' | 'error' | 'unknown';
};

export type McpServerCreate = Omit<McpServer, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'status'>;

// Backend request structures
interface CreateMcpServerRequest {
  name: string;
  description?: string;
  server_type: string;
  command?: string;
  args?: string[];
  env?: Record<string, unknown>;
  url?: string;
  auth_token?: string;
  user_id: string;
}

interface UpdateMcpServerRequest {
  name?: string;
  description?: string;
  server_type?: string;
  command?: string;
  args?: string[];
  env?: Record<string, unknown>;
  url?: string;
  auth_token?: string;
  is_active?: boolean;
}

// Backend response structure
interface McpServerResponse {
  id: string;
  name: string;
  description?: string;
  server_type: string;
  command?: string;
  args?: string[];
  env?: Record<string, unknown>;
  url?: string;
  auth_token?: string;
  is_active: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface UseMcpServersResult {
  servers: McpServer[];
  activeServer: McpServer | null;
  loading: boolean;
  error: string | null;
  createServer: (server: McpServerCreate) => Promise<McpServer | null>;
  updateServer: (id: string, updates: Partial<McpServerCreate>) => Promise<McpServer | null>;
  deleteServer: (id: string) => Promise<boolean>;
  setActive: (serverId: string) => void;
  refreshServers: () => Promise<void>;
}

export function useMcpServers(): UseMcpServersResult {
  const [servers, setServers] = useState<McpServer[]>([]);
  const [activeServer, setActiveServer] = useState<McpServer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getCurrentUserId } = useAuth();

  // Convert backend response to frontend format
  const convertToFrontendServer = (backendServer: McpServerResponse): McpServer => ({
    id: backendServer.id,
    name: backendServer.name,
    description: backendServer.description,
    serverType: backendServer.server_type,
    command: backendServer.command,
    args: backendServer.args,
    env: backendServer.env as Record<string, unknown>,
    url: backendServer.url,
    authToken: backendServer.auth_token,
    isActive: backendServer.is_active,
    userId: backendServer.user_id,
    createdAt: backendServer.created_at,
    updatedAt: backendServer.updated_at,
    status: 'unknown' as const
  });

  const fetchServers = async () => {
    try {
      setLoading(true);
      setError(null);
      const userId = getCurrentUserId();
      const serverData = await invoke<McpServerResponse[]>('get_mcp_servers', { user_id: userId });
      const convertedServers = serverData.map(convertToFrontendServer);
      setServers(convertedServers);
      
      // If there's a server, set the first one as active
      if (convertedServers.length > 0 && !activeServer) {
        setActiveServer(convertedServers[0]);
      }
    } catch (err: any) {
      console.error('Error fetching MCP servers:', err);
      setError(err.message || 'Failed to fetch MCP servers');
    } finally {
      setLoading(false);
    }
  };

  const createServer = async (serverData: McpServerCreate): Promise<McpServer | null> => {
    try {
      setError(null);
      const userId = getCurrentUserId();
      
      // Convert frontend format to backend format
      const createRequest: CreateMcpServerRequest = {
        name: serverData.name,
        description: serverData.description,
        server_type: serverData.serverType,
        command: serverData.command,
        args: serverData.args,
        env: serverData.env,
        url: serverData.url,
        auth_token: serverData.authToken,
        user_id: userId,
      };
      
      const backendServer = await invoke<McpServerResponse>('create_mcp_server', { server: createRequest });
      const newServer = convertToFrontendServer(backendServer);
      
      setServers(prevServers => {
        const updatedServers = [...prevServers, newServer];
        return updatedServers.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
      
      // If this is the first server, set it as active
      if (servers.length === 0) {
        setActiveServer(newServer);
      }
      
      return newServer;
    } catch (err: any) {
      console.error('Error creating MCP server:', err);
      setError(err.message || 'Failed to create MCP server');
      return null;
    }
  };

  const updateServer = async (id: string, updates: Partial<McpServerCreate>): Promise<McpServer | null> => {
    try {
      setError(null);
      
      // Convert frontend format to backend format
      const updateRequest: UpdateMcpServerRequest = {
        ...(updates.name && { name: updates.name }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.serverType && { server_type: updates.serverType }),
        ...(updates.command !== undefined && { command: updates.command }),
        ...(updates.args !== undefined && { args: updates.args }),
        ...(updates.env !== undefined && { env: updates.env }),
        ...(updates.url !== undefined && { url: updates.url }),
        ...(updates.authToken !== undefined && { auth_token: updates.authToken }),
        ...(updates.isActive !== undefined && { is_active: updates.isActive }),
      };
      
      const backendServer = await invoke<McpServerResponse>('update_mcp_server', {
        id,
        server: updateRequest
      });
      const updatedServer = convertToFrontendServer(backendServer);
      
      setServers(prevServers =>
        prevServers.map(server => {
          if (server.id === id) {
            // If this is the active server, update that too
            if (activeServer?.id === id) {
              setActiveServer(updatedServer);
            }
            return updatedServer;
          }
          return server;
        })
      );
      
      return updatedServer;
    } catch (err: any) {
      console.error('Error updating MCP server:', err);
      setError(err.message || 'Failed to update MCP server');
      return null;
    }
  };

  const deleteServer = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      await invoke('delete_mcp_server', { id });
      
      setServers(prevServers => prevServers.filter(server => server.id !== id));
      
      // If the active server was deleted, reset it
      if (activeServer?.id === id) {
        const nextServer = servers.find(server => server.id !== id);
        setActiveServer(nextServer || null);
      }
      
      return true;
    } catch (err: any) {
      console.error('Error deleting MCP server:', err);
      setError(err.message || 'Failed to delete MCP server');
      return false;
    }
  };

  const setActive = (serverId: string) => {
    const server = servers.find(server => server.id === serverId);
    if (server) {
      setActiveServer(server);
    }
  };

  const refreshServers = async (): Promise<void> => {
    await fetchServers();
  };

  useEffect(() => {
    fetchServers();
  }, []);

  return {
    servers,
    activeServer,
    loading,
    error,
    createServer,
    updateServer,
    deleteServer,
    setActive,
    refreshServers,
  };
}