import { invoke } from '@tauri-apps/api/core';
import type { AgentConfig } from './types';

// Database adapter for Tauri app using Tauri commands
export const localDb = {
  agents: {
    async findAll(userId: string): Promise<AgentConfig[]> {
      try {
        return await invoke<AgentConfig[]>('get_agents', { userId });
      } catch (error) {
        console.error('Error fetching agents:', error);
        return [];
      }
    },

    async create(agent: Omit<AgentConfig, 'id' | 'createdAt' | 'updatedAt'> & { userId: string }): Promise<AgentConfig> {
      return await invoke<AgentConfig>('create_agent', { agent });
    },

    async update(id: string, agent: Partial<AgentConfig>): Promise<AgentConfig | null> {
      try {
        return await invoke<AgentConfig>('update_agent', { id, agent });
      } catch (error) {
        console.error('Error updating agent:', error);
        return null;
      }
    },

    async delete(id: string): Promise<boolean> {
      try {
        await invoke('delete_agent', { id });
        return true;
      } catch (error) {
        console.error('Error deleting agent:', error);
        return false;
      }
    },
  },

  folders: {
    async findAll(userId: string) {
      try {
        return await invoke('get_folders', { user_id: userId });
      } catch (error) {
        console.error('Error fetching folders:', error);
        return [];
      }
    },

    async create(folder: any) {
      return await invoke('create_folder', folder);
    },

    async update(id: string, folder: any) {
      try {
        return await invoke('update_folder', { id, folder });
      } catch (error) {
        console.error('Error updating folder:', error);
        return null;
      }
    },

    async delete(id: string) {
      try {
        await invoke('delete_folder', { id });
        return true;
      } catch (error) {
        console.error('Error deleting folder:', error);
        return false;
      }
    },
  },

  notes: {
    async findAll(userId: string) {
      try {
        return await invoke('get_notes', { user_id: userId });
      } catch (error) {
        console.error('Error fetching notes:', error);
        return [];
      }
    },

    async create(note: any) {
      return await invoke('create_note', { note });
    },

    async update(id: string, note: any) {
      try {
        return await invoke('update_note', { id, note });
      } catch (error) {
        console.error('Error updating note:', error);
        return null;
      }
    },

    async delete(id: string) {
      try {
        await invoke('delete_note', { id });
        return true;
      } catch (error) {
        console.error('Error deleting note:', error);
        return false;
      }
    },
  },

  mcpServers: {
    async findAll(userId: string) {
      try {
        return await invoke('get_mcp_servers', { user_id: userId });
      } catch (error) {
        console.error('Error fetching MCP servers:', error);
        return [];
      }
    },

    async create(server: any) {
      return await invoke('create_mcp_server', { server });
    },

    async update(id: string, server: any) {
      try {
        return await invoke('update_mcp_server', { id, server });
      } catch (error) {
        console.error('Error updating MCP server:', error);
        return null;
      }
    },

    async delete(id: string) {
      try {
        await invoke('delete_mcp_server', { id });
        return true;
      } catch (error) {
        console.error('Error deleting MCP server:', error);
        return false;
      }
    },
  },

  n8nConnections: {
    async findAll(userId: string) {
      try {
        return await invoke('get_n8n_connections', { user_id: userId });
      } catch (error) {
        console.error('Error fetching n8n connections:', error);
        return [];
      }
    },

    async create(connection: any) {
      return await invoke('create_n8n_connection', { connection });
    },

    async update(id: string, connection: any) {
      try {
        return await invoke('update_n8n_connection', { id, connection });
      } catch (error) {
        console.error('Error updating n8n connection:', error);
        return null;
      }
    },

    async delete(id: string) {
      try {
        await invoke('delete_n8n_connection', { id });
        return true;
      } catch (error) {
        console.error('Error deleting n8n connection:', error);
        return false;
      }
    },
  },
};