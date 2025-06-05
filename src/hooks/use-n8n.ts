import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAuth } from './use-auth';

// Define our n8n types based on backend structure
export type N8nConnection = {
  id: string;
  name: string;
  description?: string;
  baseUrl: string;
  apiKey?: string;
  webhookUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
};

export type N8nConnectionCreate = Omit<N8nConnection, 'id' | 'createdAt' | 'updatedAt' | 'userId'>;

// Backend request structures
interface CreateN8nConnectionRequest {
  name: string;
  description?: string;
  base_url: string;
  api_key?: string;
  webhook_url?: string;
  user_id: string;
}

interface UpdateN8nConnectionRequest {
  name?: string;
  description?: string;
  base_url?: string;
  api_key?: string;
  webhook_url?: string;
  is_active?: boolean;
}

// Backend response structure
interface N8nConnectionResponse {
  id: string;
  name: string;
  description?: string;
  base_url: string;
  api_key?: string;
  webhook_url?: string;
  is_active: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface UseN8nResult {
  connections: N8nConnection[];
  activeConnection: N8nConnection | null;
  loading: boolean;
  error: string | null;
  createConnection: (connection: N8nConnectionCreate) => Promise<N8nConnection | null>;
  updateConnection: (id: string, updates: Partial<N8nConnectionCreate>) => Promise<N8nConnection | null>;
  deleteConnection: (id: string) => Promise<boolean>;
  setActive: (connectionId: string) => void;
  refreshConnections: () => Promise<void>;
}

export function useN8n(): UseN8nResult {
  const [connections, setConnections] = useState<N8nConnection[]>([]);
  const [activeConnection, setActiveConnection] = useState<N8nConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getCurrentUserId } = useAuth();

  // Convert backend response to frontend format
  const convertToFrontendConnection = (backendConnection: N8nConnectionResponse): N8nConnection => ({
    id: backendConnection.id,
    name: backendConnection.name,
    description: backendConnection.description,
    baseUrl: backendConnection.base_url,
    apiKey: backendConnection.api_key,
    webhookUrl: backendConnection.webhook_url,
    isActive: backendConnection.is_active,
    userId: backendConnection.user_id,
    createdAt: backendConnection.created_at,
    updatedAt: backendConnection.updated_at,
  });

  const fetchConnections = async () => {
    try {
      setLoading(true);
      setError(null);
      const userId = getCurrentUserId();
      const connectionData = await invoke<N8nConnectionResponse[]>('get_n8n_connections', { user_id: userId });
      const convertedConnections = connectionData.map(convertToFrontendConnection);
      setConnections(convertedConnections);
      
      // If there's a connection, set the first one as active
      if (convertedConnections.length > 0 && !activeConnection) {
        setActiveConnection(convertedConnections[0]);
      }
    } catch (err: any) {
      console.error('Error fetching n8n connections:', err);
      setError(err.message || 'Failed to fetch N8N connections');
    } finally {
      setLoading(false);
    }
  };

  const createConnection = async (connectionData: N8nConnectionCreate): Promise<N8nConnection | null> => {
    try {
      setError(null);
      const userId = getCurrentUserId();
      
      // Convert frontend format to backend format
      const createRequest: CreateN8nConnectionRequest = {
        name: connectionData.name,
        description: connectionData.description,
        base_url: connectionData.baseUrl,
        api_key: connectionData.apiKey,
        webhook_url: connectionData.webhookUrl,
        user_id: userId,
      };
      
      const backendConnection = await invoke<N8nConnectionResponse>('create_n8n_connection', { connection: createRequest });
      const newConnection = convertToFrontendConnection(backendConnection);
      
      setConnections(prevConnections => {
        const updatedConnections = [...prevConnections, newConnection];
        return updatedConnections.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
      
      setActiveConnection(newConnection);
      
      return newConnection;
    } catch (err: any) {
      console.error('Error creating N8N connection:', err);
      setError(err.message || 'Failed to create N8N connection');
      return null;
    }
  };

  const updateConnection = async (id: string, updates: Partial<N8nConnectionCreate>): Promise<N8nConnection | null> => {
    try {
      setError(null);
      
      // Convert frontend format to backend format
      const updateRequest: UpdateN8nConnectionRequest = {
        ...(updates.name && { name: updates.name }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.baseUrl && { base_url: updates.baseUrl }),
        ...(updates.apiKey !== undefined && { api_key: updates.apiKey }),
        ...(updates.webhookUrl !== undefined && { webhook_url: updates.webhookUrl }),
        ...(updates.isActive !== undefined && { is_active: updates.isActive }),
      };
      
      const backendConnection = await invoke<N8nConnectionResponse>('update_n8n_connection', {
        id,
        connection: updateRequest
      });
      const updatedConnection = convertToFrontendConnection(backendConnection);
      
      setConnections(prevConnections =>
        prevConnections.map(connection => {
          if (connection.id === id) {
            // If this is the active connection, update that too
            if (activeConnection?.id === id) {
              setActiveConnection(updatedConnection);
            }
            return updatedConnection;
          }
          return connection;
        })
      );
      
      return updatedConnection;
    } catch (err: any) {
      console.error('Error updating N8N connection:', err);
      setError(err.message || 'Failed to update N8N connection');
      return null;
    }
  };

  const deleteConnection = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      await invoke('delete_n8n_connection', { id });
      
      setConnections(prevConnections => prevConnections.filter(connection => connection.id !== id));
      
      // If the active connection was deleted, reset it
      if (activeConnection?.id === id) {
        const nextConnection = connections.find(connection => connection.id !== id);
        setActiveConnection(nextConnection || null);
      }
      
      return true;
    } catch (err: any) {
      console.error('Error deleting N8N connection:', err);
      setError(err.message || 'Failed to delete N8N connection');
      return false;
    }
  };

  const setActive = (connectionId: string) => {
    const connection = connections.find(connection => connection.id === connectionId);
    if (connection) {
      setActiveConnection(connection);
    }
  };

  const refreshConnections = async (): Promise<void> => {
    await fetchConnections();
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  return {
    connections,
    activeConnection,
    loading,
    error,
    createConnection,
    updateConnection,
    deleteConnection,
    setActive,
    refreshConnections,
  };
}