-- Fix RLS Policies for LibreOllama
-- Run this script in Supabase SQL Editor to fix the RLS policy issues

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can manage their own chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can manage their own agents" ON agents;
DROP POLICY IF EXISTS "Users can manage their own notes" ON notes;
DROP POLICY IF EXISTS "Users can manage their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can manage their own whiteboards" ON whiteboards;
DROP POLICY IF EXISTS "Users can manage their own folders" ON folders;
DROP POLICY IF EXISTS "Users can manage their own settings" ON settings;
DROP POLICY IF EXISTS "Users can manage their own n8n connections" ON n8n_connections;
DROP POLICY IF EXISTS "Users can manage their own mcp servers" ON mcp_servers;

-- Create comprehensive RLS policies for chat_sessions
CREATE POLICY "Users can view their own chat sessions" ON chat_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat sessions" ON chat_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat sessions" ON chat_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat sessions" ON chat_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Create comprehensive RLS policies for chat_messages
CREATE POLICY "Users can view their own chat messages" ON chat_messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat messages" ON chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat messages" ON chat_messages
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat messages" ON chat_messages
    FOR DELETE USING (auth.uid() = user_id);

-- Create comprehensive RLS policies for agents
CREATE POLICY "Users can view their own agents" ON agents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agents" ON agents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agents" ON agents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agents" ON agents
    FOR DELETE USING (auth.uid() = user_id);

-- Create comprehensive RLS policies for notes
CREATE POLICY "Users can view their own notes" ON notes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes" ON notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" ON notes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" ON notes
    FOR DELETE USING (auth.uid() = user_id);

-- Create comprehensive RLS policies for tasks
CREATE POLICY "Users can view their own tasks" ON tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks" ON tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" ON tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" ON tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Create comprehensive RLS policies for whiteboards
CREATE POLICY "Users can view their own whiteboards" ON whiteboards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own whiteboards" ON whiteboards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own whiteboards" ON whiteboards
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own whiteboards" ON whiteboards
    FOR DELETE USING (auth.uid() = user_id);

-- Create comprehensive RLS policies for folders
CREATE POLICY "Users can view their own folders" ON folders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own folders" ON folders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders" ON folders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders" ON folders
    FOR DELETE USING (auth.uid() = user_id);

-- Create comprehensive RLS policies for settings
CREATE POLICY "Users can view their own settings" ON settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" ON settings
    FOR DELETE USING (auth.uid() = user_id);

-- Create comprehensive RLS policies for n8n_connections
CREATE POLICY "Users can view their own n8n connections" ON n8n_connections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own n8n connections" ON n8n_connections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own n8n connections" ON n8n_connections
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own n8n connections" ON n8n_connections
    FOR DELETE USING (auth.uid() = user_id);

-- Create comprehensive RLS policies for mcp_servers
CREATE POLICY "Users can view their own mcp servers" ON mcp_servers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mcp servers" ON mcp_servers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mcp servers" ON mcp_servers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mcp servers" ON mcp_servers
    FOR DELETE USING (auth.uid() = user_id); 