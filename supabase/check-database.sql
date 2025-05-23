-- Check Database State for LibreOllama
-- Run this in Supabase SQL Editor to diagnose issues

-- Check if tables exist
SELECT 
    table_name,
    table_type
FROM 
    information_schema.tables 
WHERE 
    table_schema = 'public'
    AND table_name IN ('chat_sessions', 'chat_messages', 'agents', 'notes', 'tasks', 'whiteboards', 'folders', 'settings', 'n8n_connections', 'mcp_servers')
ORDER BY 
    table_name;

-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM 
    pg_tables 
WHERE 
    schemaname = 'public'
    AND tablename IN ('chat_sessions', 'chat_messages', 'agents', 'notes', 'tasks', 'whiteboards', 'folders', 'settings', 'n8n_connections', 'mcp_servers');

-- Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM 
    pg_policies 
WHERE 
    schemaname = 'public'
    AND tablename IN ('chat_sessions', 'chat_messages', 'agents', 'notes', 'tasks', 'whiteboards', 'folders', 'settings', 'n8n_connections', 'mcp_servers')
ORDER BY 
    tablename, policyname;

-- Check current user
SELECT auth.uid() as current_user_id;

-- Check if auth.users table exists and has data
SELECT count(*) as user_count FROM auth.users; 