import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials are missing');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types based on your schema
export type Database = {
  public: {
    Tables: {
      agents: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          avatar_url: string | null;
          instructions: string;
          model: string;
          tools: string[];
          starting_prompts: string[] | null;
          tags: string[] | null;
          pinned: boolean;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: Omit<Database['public']['Tables']['agents']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['agents']['Row'], 'id' | 'created_at' | 'user_id'>>;
      };
      chat_sessions: {
        Row: {
          id: string;
          title: string;
          tags: string[] | null;
          pinned: boolean;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: Omit<Database['public']['Tables']['chat_sessions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['chat_sessions']['Row'], 'id' | 'created_at' | 'user_id'>>;
      };
      chat_messages: {
        Row: {
          id: string;
          session_id: string;
          role: string;
          content: string;
          image_url: string | null;
          whiteboard_sketch: string | null;
          created_at: string;
          user_id: string;
        };
        Insert: Omit<Database['public']['Tables']['chat_messages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Omit<Database['public']['Tables']['chat_messages']['Row'], 'id' | 'created_at' | 'user_id' | 'session_id'>>;
      };
      notes: {
        Row: {
          id: string;
          title: string;
          content: string | null;
          image_url: string | null;
          tags: string[] | null;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: Omit<Database['public']['Tables']['notes']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['notes']['Row'], 'id' | 'created_at' | 'user_id'>>;
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          status: string;
          priority: string | null;
          due_date: string | null;
          tags: string[] | null;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['tasks']['Row'], 'id' | 'created_at' | 'user_id'>>;
      };
      whiteboards: {
        Row: {
          id: string;
          name: string;
          content: string | null;
          image_url: string | null;
          tags: string[] | null;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: Omit<Database['public']['Tables']['whiteboards']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['whiteboards']['Row'], 'id' | 'created_at' | 'user_id'>>;
      };
      folders: {
        Row: {
          id: string;
          name: string;
          parent_id: string | null;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: Omit<Database['public']['Tables']['folders']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['folders']['Row'], 'id' | 'created_at' | 'user_id'>>;
      };
      settings: {
        Row: {
          id: string;
          preferences: Record<string, any>;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: Omit<Database['public']['Tables']['settings']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['settings']['Row'], 'id' | 'created_at' | 'user_id'>>;
      };
      n8n_connections: {
        Row: {
          id: string;
          url: string;
          auth_type: string;
          auth_details: Record<string, any> | null;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: Omit<Database['public']['Tables']['n8n_connections']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['n8n_connections']['Row'], 'id' | 'created_at' | 'user_id'>>;
      };
      mcp_servers: {
        Row: {
          id: string;
          name: string;
          url: string;
          auth_type: string | null;
          auth_details: Record<string, any> | null;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: Omit<Database['public']['Tables']['mcp_servers']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['mcp_servers']['Row'], 'id' | 'created_at' | 'user_id'>>;
      };
    };
  };
}; 