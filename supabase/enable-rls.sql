-- Enable Row Level Security and Create Policies
-- Run this AFTER creating the tables

-- Enable RLS on all tables
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE whiteboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE n8n_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_servers ENABLE ROW LEVEL SECURITY;

-- Chat Sessions Policies
CREATE POLICY "Users can manage their own chat sessions" ON chat_sessions
    USING (auth.uid() = user_id);

-- Chat Messages Policies  
CREATE POLICY "Users can manage their own chat messages" ON chat_messages
    USING (auth.uid() = user_id);

-- Agents Policies
CREATE POLICY "Users can manage their own agents" ON agents
    USING (auth.uid() = user_id);

-- Notes Policies
CREATE POLICY "Users can manage their own notes" ON notes
    USING (auth.uid() = user_id);

-- Tasks Policies
CREATE POLICY "Users can manage their own tasks" ON tasks
    USING (auth.uid() = user_id);

-- Whiteboards Policies
CREATE POLICY "Users can manage their own whiteboards" ON whiteboards
    USING (auth.uid() = user_id);

-- Folders Policies
CREATE POLICY "Users can manage their own folders" ON folders
    USING (auth.uid() = user_id);

-- Settings Policies
CREATE POLICY "Users can manage their own settings" ON settings
    USING (auth.uid() = user_id);

-- N8N Connections Policies
CREATE POLICY "Users can manage their own n8n connections" ON n8n_connections
    USING (auth.uid() = user_id);

-- MCP Servers Policies
CREATE POLICY "Users can manage their own mcp servers" ON mcp_servers
    USING (auth.uid() = user_id); 