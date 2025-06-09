//! Core database operations for LibreOllama
//!
//! This module provides all the CRUD operations for the various entities
//! in the LibreOllama application.

use anyhow::{Context, Result};
use rusqlite::params;
use crate::database::models::*;
use crate::database::connection::get_connection;
use chrono::NaiveDateTime;

// ===== Chat Session Operations =====

/// Create a new chat session
pub async fn create_chat_session(title: String, user_id: String) -> Result<i32> {
    let conn = get_connection()?;
    let now = chrono::Local::now().naive_local();
    let now_str = now.format("%Y-%m-%d %H:%M:%S").to_string();
    
    conn.execute(
        "INSERT INTO chat_sessions (user_id, session_name, created_at, updated_at) 
         VALUES (?1, ?2, ?3, ?4)",
        params![user_id, title, now_str, now_str],
    ).context("Failed to create chat session")?;
    
    let session_id = conn.last_insert_rowid() as i32;
    Ok(session_id)
}

/// Get all chat sessions
pub async fn get_chat_sessions(include_archived: bool) -> Result<Vec<ChatSession>> {
    let conn = get_connection()?;
    
    let query = if include_archived {
        "SELECT id, user_id, session_name, created_at, updated_at FROM chat_sessions ORDER BY updated_at DESC"
    } else {
        "SELECT id, user_id, session_name, created_at, updated_at FROM chat_sessions ORDER BY updated_at DESC"
    };
    
    let mut stmt = conn.prepare(query)?;
    let sessions = stmt.query_map([], |row| {
        let created_at_str: String = row.get(3)?;
        let updated_at_str: String = row.get(4)?;
        
        Ok(ChatSession {
            id: row.get(0)?,
            user_id: row.get(1)?,
            session_name: row.get(2)?,
            created_at: NaiveDateTime::parse_from_str(&created_at_str, "%Y-%m-%d %H:%M:%S")
                .unwrap_or_else(|_| chrono::Local::now().naive_local()),
            updated_at: NaiveDateTime::parse_from_str(&updated_at_str, "%Y-%m-%d %H:%M:%S")
                .unwrap_or_else(|_| chrono::Local::now().naive_local()),
        })
    })?
    .collect::<Result<Vec<_>, _>>()?;
    
    Ok(sessions)
}

/// Get a specific chat session by ID
pub async fn get_chat_session_by_id(session_id: i32) -> Result<Option<ChatSession>> {
    let conn = get_connection()?;
    
    let mut stmt = conn.prepare(
        "SELECT id, user_id, session_name, created_at, updated_at 
         FROM chat_sessions WHERE id = ?1"
    )?;
    
    let result = stmt.query_row(params![session_id], |row| {
        let created_at_str: String = row.get(3)?;
        let updated_at_str: String = row.get(4)?;
        
        Ok(ChatSession {
            id: row.get(0)?,
            user_id: row.get(1)?,
            session_name: row.get(2)?,
            created_at: NaiveDateTime::parse_from_str(&created_at_str, "%Y-%m-%d %H:%M:%S")
                .unwrap_or_else(|_| chrono::Local::now().naive_local()),
            updated_at: NaiveDateTime::parse_from_str(&updated_at_str, "%Y-%m-%d %H:%M:%S")
                .unwrap_or_else(|_| chrono::Local::now().naive_local()),
        })
    });
    
    match result {
        Ok(session) => Ok(Some(session)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

/// Update chat session timestamp
pub async fn update_chat_session_timestamp(session_id: i32) -> Result<()> {
    let conn = get_connection()?;
    let now = chrono::Local::now().naive_local();
    let now_str = now.format("%Y-%m-%d %H:%M:%S").to_string();
    
    conn.execute(
        "UPDATE chat_sessions SET updated_at = ?1 WHERE id = ?2",
        params![now_str, session_id],
    ).context("Failed to update chat session timestamp")?;
    
    Ok(())
}

/// Delete a chat session
pub async fn delete_chat_session(session_id: i32) -> Result<()> {
    let conn = get_connection()?;
    
    // Delete associated messages first
    conn.execute(
        "DELETE FROM chat_messages WHERE session_id = ?1",
        params![session_id],
    ).context("Failed to delete chat messages")?;
    
    // Delete the session
    conn.execute(
        "DELETE FROM chat_sessions WHERE id = ?1",
        params![session_id],
    ).context("Failed to delete chat session")?;
    
    Ok(())
}

// ===== Chat Message Operations =====

/// Create a new chat message
pub async fn create_chat_message(session_id: i32, role: MessageRole, content: String) -> Result<ChatMessage> {
    let conn = get_connection()?;
    let now = chrono::Local::now().naive_local();
    let now_str = now.format("%Y-%m-%d %H:%M:%S").to_string();
    let role_str = match role {
        MessageRole::User => "user",
        MessageRole::Assistant => "assistant",
        MessageRole::System => "system",
    };
    
    conn.execute(
        "INSERT INTO chat_messages (session_id, role, content, created_at) 
         VALUES (?1, ?2, ?3, ?4)",
        params![session_id, role_str, content, now_str],
    ).context("Failed to create chat message")?;
    
    let message_id = conn.last_insert_rowid() as i32;
    
    Ok(ChatMessage {
        id: message_id,
        session_id,
        role: role_str.to_string(),
        content,
        created_at: now,
    })
}

/// Get all messages for a session
pub async fn get_session_messages(session_id: i32) -> Result<Vec<ChatMessage>> {
    let conn = get_connection()?;
    
    let mut stmt = conn.prepare(
        "SELECT id, session_id, role, content, created_at 
         FROM chat_messages WHERE session_id = ?1 ORDER BY created_at ASC"
    )?;
    
    let messages = stmt.query_map(params![session_id], |row| {
        let created_at_str: String = row.get(4)?;
        
        Ok(ChatMessage {
            id: row.get(0)?,
            session_id: row.get(1)?,
            role: row.get(2)?,
            content: row.get(3)?,
            created_at: NaiveDateTime::parse_from_str(&created_at_str, "%Y-%m-%d %H:%M:%S")
                .unwrap_or_else(|_| chrono::Local::now().naive_local()),
        })
    })?
    .collect::<Result<Vec<_>, _>>()?;
    
    Ok(messages)
}

// ===== Agent Operations =====

/// Create a new agent
pub async fn create_agent(agent: &Agent) -> Result<()> {
    let conn = get_connection()?;
    let created_at_str = agent.created_at.format("%Y-%m-%d %H:%M:%S").to_string();
    let updated_at_str = agent.updated_at.format("%Y-%m-%d %H:%M:%S").to_string();
    
    conn.execute(
        "INSERT INTO agents (name, description, system_prompt, capabilities, parameters, is_active, created_at, updated_at) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            agent.name,
            agent.description,
            agent.system_prompt,
            serde_json::to_string(&agent.capabilities)?,
            serde_json::to_string(&agent.parameters)?,
            agent.is_active,
            created_at_str,
            updated_at_str,
        ],
    ).context("Failed to create agent")?;
    
    Ok(())
}

/// Get all agents
pub async fn get_agents(active_only: bool) -> Result<Vec<Agent>> {
    let conn = get_connection()?;
    
    let query = if active_only {
        "SELECT id, name, description, system_prompt, capabilities, parameters, is_active, created_at, updated_at 
         FROM agents WHERE is_active = 1 ORDER BY name"
    } else {
        "SELECT id, name, description, system_prompt, capabilities, parameters, is_active, created_at, updated_at 
         FROM agents ORDER BY name"
    };
    
    let mut stmt = conn.prepare(query)?;
    let agents = stmt.query_map([], |row| {
        let capabilities_json: String = row.get(4)?;
        let parameters_json: String = row.get(5)?;
        let created_at_str: String = row.get(7)?;
        let updated_at_str: String = row.get(8)?;
        
        Ok(Agent {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            system_prompt: row.get(3)?,
            capabilities: serde_json::from_str(&capabilities_json).unwrap_or_default(),
            parameters: serde_json::from_str(&parameters_json).unwrap_or_default(),
            is_active: row.get(6)?,
            created_at: NaiveDateTime::parse_from_str(&created_at_str, "%Y-%m-%d %H:%M:%S")
                .unwrap_or_else(|_| chrono::Local::now().naive_local()),
            updated_at: NaiveDateTime::parse_from_str(&updated_at_str, "%Y-%m-%d %H:%M:%S")
                .unwrap_or_else(|_| chrono::Local::now().naive_local()),
        })
    })?
    .collect::<Result<Vec<_>, _>>()?;
    
    Ok(agents)
}

/// Get agent by ID
pub async fn get_agent_by_id(agent_id: &str) -> Result<Option<Agent>> {
    let conn = get_connection()?;
    let id: i32 = agent_id.parse().unwrap_or(0);
    
    let mut stmt = conn.prepare(
        "SELECT id, name, description, system_prompt, capabilities, parameters, is_active, created_at, updated_at 
         FROM agents WHERE id = ?1"
    )?;
    
    let result = stmt.query_row(params![id], |row| {
        let capabilities_json: String = row.get(4)?;
        let parameters_json: String = row.get(5)?;
        let created_at_str: String = row.get(7)?;
        let updated_at_str: String = row.get(8)?;
        
        Ok(Agent {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            system_prompt: row.get(3)?,
            capabilities: serde_json::from_str(&capabilities_json).unwrap_or_default(),
            parameters: serde_json::from_str(&parameters_json).unwrap_or_default(),
            is_active: row.get(6)?,
            created_at: NaiveDateTime::parse_from_str(&created_at_str, "%Y-%m-%d %H:%M:%S")
                .unwrap_or_else(|_| chrono::Local::now().naive_local()),
            updated_at: NaiveDateTime::parse_from_str(&updated_at_str, "%Y-%m-%d %H:%M:%S")
                .unwrap_or_else(|_| chrono::Local::now().naive_local()),
        })
    });
    
    match result {
        Ok(agent) => Ok(Some(agent)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

/// Update an agent
pub async fn update_agent(agent: &Agent) -> Result<()> {
    let conn = get_connection()?;
    let updated_at_str = agent.updated_at.format("%Y-%m-%d %H:%M:%S").to_string();
    
    conn.execute(
        "UPDATE agents SET name = ?1, description = ?2, system_prompt = ?3, 
         capabilities = ?4, parameters = ?5, is_active = ?6, updated_at = ?7 
         WHERE id = ?8",
        params![
            agent.name,
            agent.description,
            agent.system_prompt,
            serde_json::to_string(&agent.capabilities)?,
            serde_json::to_string(&agent.parameters)?,
            agent.is_active,
            updated_at_str,
            agent.id,
        ],
    ).context("Failed to update agent")?;
    
    Ok(())
}

/// Delete an agent
pub async fn delete_agent(agent_id: &str) -> Result<()> {
    let conn = get_connection()?;
    let id: i32 = agent_id.parse().unwrap_or(0);
    
    conn.execute(
        "DELETE FROM agents WHERE id = ?1",
        params![id],
    ).context("Failed to delete agent")?;
    
    Ok(())
}

// ===== Folder Operations =====

/// Create a new folder
pub async fn create_folder(folder: &Folder) -> Result<()> {
    let conn = get_connection()?;
    let created_at_str = folder.created_at.format("%Y-%m-%d %H:%M:%S").to_string();
    let updated_at_str = folder.updated_at.format("%Y-%m-%d %H:%M:%S").to_string();
    
    conn.execute(
        "INSERT INTO folders (folder_name, parent_id, user_id, color, created_at, updated_at) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            folder.folder_name,
            folder.parent_id,
            folder.user_id,
            folder.color,
            created_at_str,
            updated_at_str,
        ],
    ).context("Failed to create folder")?;
    
    Ok(())
}

/// Get all folders for a user
pub async fn get_folders(user_id: &str) -> Result<Vec<Folder>> {
    let conn = get_connection()?;
    
    let mut stmt = conn.prepare(
        "SELECT id, folder_name, parent_id, user_id, color, created_at, updated_at 
         FROM folders WHERE user_id = ?1 ORDER BY folder_name"
    )?;
    
    let folders = stmt.query_map(params![user_id], |row| {
        let created_at_str: String = row.get(5)?;
        let updated_at_str: String = row.get(6)?;
        
        Ok(Folder {
            id: row.get(0)?,
            folder_name: row.get(1)?,
            parent_id: row.get(2)?,
            user_id: row.get(3)?,
            color: row.get(4)?,
            created_at: NaiveDateTime::parse_from_str(&created_at_str, "%Y-%m-%d %H:%M:%S")
                .unwrap_or_else(|_| chrono::Local::now().naive_local()),
            updated_at: NaiveDateTime::parse_from_str(&updated_at_str, "%Y-%m-%d %H:%M:%S")
                .unwrap_or_else(|_| chrono::Local::now().naive_local()),
        })
    })?
    .collect::<Result<Vec<_>, _>>()?;
    
    Ok(folders)
}

/// Get folder by ID
pub async fn get_folder_by_id(folder_id: i32) -> Result<Option<Folder>> {
    let conn = get_connection()?;
    
    let mut stmt = conn.prepare(
        "SELECT id, folder_name, parent_id, user_id, color, created_at, updated_at 
         FROM folders WHERE id = ?1"
    )?;
    
    let result = stmt.query_row(params![folder_id], |row| {
        let created_at_str: String = row.get(5)?;
        let updated_at_str: String = row.get(6)?;
        
        Ok(Folder {
            id: row.get(0)?,
            folder_name: row.get(1)?,
            parent_id: row.get(2)?,
            user_id: row.get(3)?,
            color: row.get(4)?,
            created_at: NaiveDateTime::parse_from_str(&created_at_str, "%Y-%m-%d %H:%M:%S")
                .unwrap_or_else(|_| chrono::Local::now().naive_local()),
            updated_at: NaiveDateTime::parse_from_str(&updated_at_str, "%Y-%m-%d %H:%M:%S")
                .unwrap_or_else(|_| chrono::Local::now().naive_local()),
        })
    });
    
    match result {
        Ok(folder) => Ok(Some(folder)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

/// Update a folder
pub async fn update_folder(folder: &Folder) -> Result<()> {
    let conn = get_connection()?;
    let updated_at_str = folder.updated_at.format("%Y-%m-%d %H:%M:%S").to_string();
    
    conn.execute(
        "UPDATE folders SET folder_name = ?1, parent_id = ?2, color = ?3, updated_at = ?4 
         WHERE id = ?5",
        params![
            folder.folder_name,
            folder.parent_id,
            folder.color,
            updated_at_str,
            folder.id,
        ],
    ).context("Failed to update folder")?;
    
    Ok(())
}

/// Delete a folder
pub async fn delete_folder(folder_id: i32) -> Result<()> {
    let conn = get_connection()?;
    
    conn.execute(
        "DELETE FROM folders WHERE id = ?1",
        params![folder_id],
    ).context("Failed to delete folder")?;
    
    Ok(())
}

// ===== Note Operations =====

/// Create a new note
pub async fn create_note(note: &Note) -> Result<()> {
    let conn = get_connection()?;
    let created_at_str = note.created_at.format("%Y-%m-%d %H:%M:%S").to_string();
    let updated_at_str = note.updated_at.format("%Y-%m-%d %H:%M:%S").to_string();
    
    conn.execute(
        "INSERT INTO notes (title, content, user_id, tags, created_at, updated_at) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            note.title,
            note.content,
            note.user_id,
            serde_json::to_string(&note.tags)?,
            created_at_str,
            updated_at_str,
        ],
    ).context("Failed to create note")?;
    
    Ok(())
}

/// Get all notes for a user
pub async fn get_notes(user_id: &str) -> Result<Vec<Note>> {
    let conn = get_connection()?;
    
    let mut stmt = conn.prepare(
        "SELECT id, title, content, user_id, tags, created_at, updated_at 
         FROM notes WHERE user_id = ?1 ORDER BY updated_at DESC"
    )?;
    
    let notes = stmt.query_map(params![user_id], |row| {
        let tags_json: String = row.get(4)?;
        let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();
        let created_at_str: String = row.get(5)?;
        let updated_at_str: String = row.get(6)?;
        
        Ok(Note {
            id: row.get(0)?,
            title: row.get(1)?,
            content: row.get(2)?,
            user_id: row.get(3)?,
            tags,
            created_at: NaiveDateTime::parse_from_str(&created_at_str, "%Y-%m-%d %H:%M:%S")
                .unwrap_or_else(|_| chrono::Local::now().naive_local()),
            updated_at: NaiveDateTime::parse_from_str(&updated_at_str, "%Y-%m-%d %H:%M:%S")
                .unwrap_or_else(|_| chrono::Local::now().naive_local()),
        })
    })?
    .collect::<Result<Vec<_>, _>>()?;
    
    Ok(notes)
}

/// Get note by ID
pub async fn get_note_by_id(note_id: i32) -> Result<Option<Note>> {
    let conn = get_connection()?;
    
    let mut stmt = conn.prepare(
        "SELECT id, title, content, user_id, tags, created_at, updated_at 
         FROM notes WHERE id = ?1"
    )?;
    
    let result = stmt.query_row(params![note_id], |row| {
        let tags_json: String = row.get(4)?;
        let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();
        let created_at_str: String = row.get(5)?;
        let updated_at_str: String = row.get(6)?;
        
        Ok(Note {
            id: row.get(0)?,
            title: row.get(1)?,
            content: row.get(2)?,
            user_id: row.get(3)?,
            tags,
            created_at: NaiveDateTime::parse_from_str(&created_at_str, "%Y-%m-%d %H:%M:%S")
                .unwrap_or_else(|_| chrono::Local::now().naive_local()),
            updated_at: NaiveDateTime::parse_from_str(&updated_at_str, "%Y-%m-%d %H:%M:%S")
                .unwrap_or_else(|_| chrono::Local::now().naive_local()),
        })
    });
    
    match result {
        Ok(note) => Ok(Some(note)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

/// Update a note
pub async fn update_note(note: &Note) -> Result<()> {
    let conn = get_connection()?;
    let updated_at_str = note.updated_at.format("%Y-%m-%d %H:%M:%S").to_string();
    
    conn.execute(
        "UPDATE notes SET title = ?1, content = ?2, tags = ?3, updated_at = ?4 
         WHERE id = ?5",
        params![
            note.title,
            note.content,
            serde_json::to_string(&note.tags)?,
            updated_at_str,
            note.id,
        ],
    ).context("Failed to update note")?;
    
    Ok(())
}

/// Delete a note
pub async fn delete_note(note_id: i32) -> Result<()> {
    let conn = get_connection()?;
    
    conn.execute(
        "DELETE FROM notes WHERE id = ?1",
        params![note_id],
    ).context("Failed to delete note")?;
    
    Ok(())
}

// ===== MCP Server Operations =====

/// Create a new MCP server
pub async fn create_mcp_server(server: &McpServer) -> Result<()> {
    let conn = get_connection()?;
    let created_at_str = server.created_at.format("%Y-%m-%d %H:%M:%S").to_string();
    let updated_at_str = server.updated_at.format("%Y-%m-%d %H:%M:%S").to_string();
    
    conn.execute(
        "INSERT INTO mcp_servers (name, url, api_key, configuration, is_active, user_id, created_at, updated_at) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            server.name,
            server.url,
            server.api_key,
            serde_json::to_string(&server.configuration)?,
            server.is_active,
            server.user_id,
            created_at_str,
            updated_at_str,
        ],
    ).context("Failed to create MCP server")?;
    
    Ok(())
}

/// Get all MCP servers for a user
pub async fn get_mcp_servers(user_id: &str) -> Result<Vec<McpServer>> {
    let conn = get_connection()?;
    
    let mut stmt = conn.prepare(
        "SELECT id, name, url, api_key, configuration, is_active, user_id, created_at, updated_at 
         FROM mcp_servers WHERE user_id = ?1 ORDER BY name"
    )?;
    
    let servers = stmt.query_map(params![user_id], |row| {
        let config_json: String = row.get(4)?;
        let created_at_str: String = row.get(7)?;
        let updated_at_str: String = row.get(8)?;
        
        Ok(McpServer {
            id: row.get(0)?,
            name: row.get(1)?,
            url: row.get(2)?,
            api_key: row.get(3)?,
            configuration: serde_json::from_str(&config_json).unwrap_or_default(),
            is_active: row.get(5)?,
            user_id: row.get(6)?,
            created_at: NaiveDateTime::parse_from_str(&created_at_str, "%Y-%m-%d %H:%M:%S")
                .unwrap_or_else(|_| chrono::Local::now().naive_local()),
            updated_at: NaiveDateTime::parse_from_str(&updated_at_str, "%Y-%m-%d %H:%M:%S")
                .unwrap_or_else(|_| chrono::Local::now().naive_local()),
        })
    })?
    .collect::<Result<Vec<_>, _>>()?;
    
    Ok(servers)
}

/// Get MCP server by ID
pub async fn get_mcp_server_by_id(server_id: i32) -> Result<Option<McpServer>> {
    let conn = get_connection()?;
    
    let mut stmt = conn.prepare(
        "SELECT id, name, url, api_key, configuration, is_active, user_id, created_at, updated_at 
         FROM mcp_servers WHERE id = ?1"
    )?;
    
    let result = stmt.query_row(params![server_id], |row| {
        let config_json: String = row.get(4)?;
        let created_at_str: String = row.get(7)?;
        let updated_at_str: String = row.get(8)?;
        
        Ok(McpServer {
            id: row.get(0)?,
            name: row.get(1)?,
            url: row.get(2)?,
            api_key: row.get(3)?,
            configuration: serde_json::from_str(&config_json).unwrap_or_default(),
            is_active: row.get(5)?,
            user_id: row.get(6)?,
            created_at: NaiveDateTime::parse_from_str(&created_at_str, "%Y-%m-%d %H:%M:%S")
                .unwrap_or_else(|_| chrono::Local::now().naive_local()),
            updated_at: NaiveDateTime::parse_from_str(&updated_at_str, "%Y-%m-%d %H:%M:%S")
                .unwrap_or_else(|_| chrono::Local::now().naive_local()),
        })
    });
    
    match result {
        Ok(server) => Ok(Some(server)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

/// Update an MCP server
pub async fn update_mcp_server(server: &McpServer) -> Result<()> {
    let conn = get_connection()?;
    let updated_at_str = server.updated_at.format("%Y-%m-%d %H:%M:%S").to_string();
    
    conn.execute(
        "UPDATE mcp_servers SET name = ?1, url = ?2, api_key = ?3, 
         configuration = ?4, is_active = ?5, updated_at = ?6 
         WHERE id = ?7",
        params![
            server.name,
            server.url,
            server.api_key,
            serde_json::to_string(&server.configuration)?,
            server.is_active,
            updated_at_str,
            server.id,
        ],
    ).context("Failed to update MCP server")?;
    
    Ok(())
}

/// Delete an MCP server
pub async fn delete_mcp_server(server_id: i32) -> Result<()> {
    let conn = get_connection()?;
    
    conn.execute(
        "DELETE FROM mcp_servers WHERE id = ?1",
        params![server_id],
    ).context("Failed to delete MCP server")?;
    
    Ok(())
}

// ===== N8N Connection Operations =====

/// Create a new N8N connection
pub async fn create_n8n_connection(connection: &N8nConnection) -> Result<()> {
    let conn = get_connection()?;
    let created_at_str = connection.created_at.format("%Y-%m-%d %H:%M:%S").to_string();
    let updated_at_str = connection.updated_at.format("%Y-%m-%d %H:%M:%S").to_string();
    
    conn.execute(
        "INSERT INTO n8n_connections (name, webhook_url, api_key, workflow_id, is_active, user_id, created_at, updated_at) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            connection.name,
            connection.webhook_url,
            connection.api_key,
            connection.workflow_id,
            connection.is_active,
            connection.user_id,
            created_at_str,
            updated_at_str,
        ],
    ).context("Failed to create N8N connection")?;
    
    Ok(())
}

/// Get all N8N connections for a user
pub async fn get_n8n_connections(user_id: &str) -> Result<Vec<N8nConnection>> {
    let conn = get_connection()?;
    
    let mut stmt = conn.prepare(
        "SELECT id, name, webhook_url, api_key, workflow_id, is_active, user_id, created_at, updated_at 
         FROM n8n_connections WHERE user_id = ?1 ORDER BY name"
    )?;
    
    let connections = stmt.query_map(params![user_id], |row| {
        let created_at_str: String = row.get(7)?;
        let updated_at_str: String = row.get(8)?;
        
        Ok(N8nConnection {
            id: row.get(0)?,
            name: row.get(1)?,
            webhook_url: row.get(2)?,
            api_key: row.get(3)?,
            workflow_id: row.get(4)?,
            is_active: row.get(5)?,
            user_id: row.get(6)?,
            created_at: NaiveDateTime::parse_from_str(&created_at_str, "%Y-%m-%d %H:%M:%S")
                .unwrap_or_else(|_| chrono::Local::now().naive_local()),
            updated_at: NaiveDateTime::parse_from_str(&updated_at_str, "%Y-%m-%d %H:%M:%S")
                .unwrap_or_else(|_| chrono::Local::now().naive_local()),
        })
    })?
    .collect::<Result<Vec<_>, _>>()?;
    
    Ok(connections)
}

/// Get N8N connection by ID
pub async fn get_n8n_connection_by_id(connection_id: i32) -> Result<Option<N8nConnection>> {
    let conn = get_connection()?;
    
    let mut stmt = conn.prepare(
        "SELECT id, name, webhook_url, api_key, workflow_id, is_active, user_id, created_at, updated_at 
         FROM n8n_connections WHERE id = ?1"
    )?;
    
    let result = stmt.query_row(params![connection_id], |row| {
        let created_at_str: String = row.get(7)?;
        let updated_at_str: String = row.get(8)?;
        
        Ok(N8nConnection {
            id: row.get(0)?,
            name: row.get(1)?,
            webhook_url: row.get(2)?,
            api_key: row.get(3)?,
            workflow_id: row.get(4)?,
            is_active: row.get(5)?,
            user_id: row.get(6)?,
            created_at: NaiveDateTime::parse_from_str(&created_at_str, "%Y-%m-%d %H:%M:%S")
                .unwrap_or_else(|_| chrono::Local::now().naive_local()),
            updated_at: NaiveDateTime::parse_from_str(&updated_at_str, "%Y-%m-%d %H:%M:%S")
                .unwrap_or_else(|_| chrono::Local::now().naive_local()),
        })
    });
    
    match result {
        Ok(connection) => Ok(Some(connection)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

/// Update an N8N connection
pub async fn update_n8n_connection(connection: &N8nConnection) -> Result<()> {
    let conn = get_connection()?;
    let updated_at_str = connection.updated_at.format("%Y-%m-%d %H:%M:%S").to_string();
    
    conn.execute(
        "UPDATE n8n_connections SET name = ?1, webhook_url = ?2, api_key = ?3, 
         workflow_id = ?4, is_active = ?5, updated_at = ?6 
         WHERE id = ?7",
        params![
            connection.name,
            connection.webhook_url,
            connection.api_key,
            connection.workflow_id,
            connection.is_active,
            updated_at_str,
            connection.id,
        ],
    ).context("Failed to update N8N connection")?;
    
    Ok(())
}

/// Delete an N8N connection
pub async fn delete_n8n_connection(connection_id: i32) -> Result<()> {
    let conn = get_connection()?;
    
    conn.execute(
        "DELETE FROM n8n_connections WHERE id = ?1",
        params![connection_id],
    ).context("Failed to delete N8N connection")?;
    
    Ok(())
}

// ===== Advanced Feature Operations =====

/// Get conversation context
pub async fn get_conversation_context(session_id: &str) -> Result<Option<ConversationContext>> {
    let conn = get_connection()?;
    
    let mut stmt = conn.prepare(
        "SELECT id, context_name, context_data, context_window_size, context_summary 
         FROM conversation_contexts WHERE context_name = ?1"
    )?;
    
    let result = stmt.query_row(params![session_id], |row| {
        Ok(ConversationContext {
            id: row.get(0)?,
            context_name: row.get(1)?,
            context_data: row.get(2)?,
            context_window_size: row.get(3)?,
            context_summary: row.get(4)?,
        })
    });
    
    match result {
        Ok(context) => Ok(Some(context)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

/// Create conversation context
pub async fn create_conversation_context(context: &ConversationContext) -> Result<()> {
    let conn = get_connection()?;
    
    conn.execute(
        "INSERT INTO conversation_contexts (context_name, context_data, context_window_size, context_summary) 
         VALUES (?1, ?2, ?3, ?4)",
        params![
            context.context_name,
            context.context_data,
            context.context_window_size,
            context.context_summary,
        ],
    ).context("Failed to create conversation context")?;
    
    Ok(())
}

/// Update conversation context
pub async fn update_conversation_context(context: &ConversationContext) -> Result<()> {
    let conn = get_connection()?;
    
    conn.execute(
        "UPDATE conversation_contexts SET context_data = ?1, context_window_size = ?2, context_summary = ?3 
         WHERE context_name = ?4",
        params![
            context.context_data,
            context.context_window_size,
            context.context_summary,
            context.context_name,
        ],
    ).context("Failed to update conversation context")?;
    
    Ok(())
}

/// Get chat templates
pub async fn get_chat_templates(_active_only: bool) -> Result<Vec<ChatTemplate>> {
    let conn = get_connection()?;
    
    let query = "SELECT id, template_name, template_content FROM chat_templates ORDER BY template_name";
    
    let mut stmt = conn.prepare(query)?;
    let templates = stmt.query_map([], |row| {
        Ok(ChatTemplate {
            id: row.get(0)?,
            template_name: row.get(1)?,
            template_content: row.get(2)?,
        })
    })?
    .collect::<Result<Vec<_>, _>>()?;
    
    Ok(templates)
}

/// Get chat template by ID
pub async fn get_chat_template_by_id(template_id: &i32) -> Result<Option<ChatTemplate>> {
    let conn = get_connection()?;
    
    let mut stmt = conn.prepare(
        "SELECT id, template_name, template_content FROM chat_templates WHERE id = ?1"
    )?;
    
    let result = stmt.query_row(params![template_id], |row| {
        Ok(ChatTemplate {
            id: row.get(0)?,
            template_name: row.get(1)?,
            template_content: row.get(2)?,
        })
    });
    
    match result {
        Ok(template) => Ok(Some(template)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

/// Create chat template
pub async fn create_chat_template(template: &ChatTemplate) -> Result<()> {
    let conn = get_connection()?;
    
    conn.execute(
        "INSERT INTO chat_templates (template_name, template_content) VALUES (?1, ?2)",
        params![template.template_name, template.template_content],
    ).context("Failed to create chat template")?;
    
    Ok(())
}

/// Update chat template
pub async fn update_chat_template(template: &ChatTemplate) -> Result<()> {
    let conn = get_connection()?;
    
    conn.execute(
        "UPDATE chat_templates SET template_name = ?1, template_content = ?2 WHERE id = ?3",
        params![template.template_name, template.template_content, template.id],
    ).context("Failed to update chat template")?;
    
    Ok(())
}

/// Create performance metric
pub async fn create_performance_metric(metric: &PerformanceMetric) -> Result<()> {
    let conn = get_connection()?;
    let timestamp_str = metric.timestamp.format("%Y-%m-%d %H:%M:%S").to_string();
    
    conn.execute(
        "INSERT INTO performance_metrics (metric_type, value, timestamp, metadata) VALUES (?1, ?2, ?3, ?4)",
        params![
            serde_json::to_string(&metric.metric_type)?,
            metric.value,
            timestamp_str,
            metric.metadata,
        ],
    ).context("Failed to create performance metric")?;
    
    Ok(())
}

/// Get performance metrics
pub async fn get_performance_metrics(
    _metric_type: Option<MetricType>,
    _component: Option<String>,
    _operation: Option<String>,
    _start_time: Option<chrono::NaiveDateTime>,
    _end_time: Option<chrono::NaiveDateTime>,
    _limit: i32,
) -> Result<Vec<PerformanceMetric>> {
    let _conn = get_connection()?;
    
    // For now, return empty vec as this would require more complex query building
    Ok(vec![])
}

/// Create request cache
pub async fn create_request_cache(cache: &RequestCache) -> Result<()> {
    let conn = get_connection()?;
    let created_at_str = cache.created_at.format("%Y-%m-%d %H:%M:%S").to_string();
    
    conn.execute(
        "INSERT INTO request_cache (request_hash, response_body, created_at) VALUES (?1, ?2, ?3)",
        params![cache.request_hash, cache.response_body, created_at_str],
    ).context("Failed to create request cache")?;
    
    Ok(())
}

/// Get request cache
pub async fn get_request_cache(key: &str) -> Result<Option<RequestCache>> {
    let conn = get_connection()?;
    
    let mut stmt = conn.prepare(
        "SELECT id, request_hash, response_body, created_at FROM request_cache WHERE request_hash = ?1"
    )?;
    
    let result = stmt.query_row(params![key], |row| {
        let created_at_str: String = row.get(3)?;
        
        Ok(RequestCache {
            id: row.get(0)?,
            request_hash: row.get(1)?,
            response_body: row.get(2)?,
            created_at: NaiveDateTime::parse_from_str(&created_at_str, "%Y-%m-%d %H:%M:%S")
                .unwrap_or_else(|_| chrono::Local::now().naive_local()),
        })
    });
    
    match result {
        Ok(cache) => Ok(Some(cache)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

/// Get user preference
pub async fn get_user_preference(key: &str) -> Result<Option<UserPreference>> {
    let conn = get_connection()?;
    
    let mut stmt = conn.prepare(
        "SELECT id, preference_key, preference_value, preference_type_name 
         FROM user_preferences WHERE preference_key = ?1"
    )?;
    
    let result = stmt.query_row(params![key], |row| {
        Ok(UserPreference {
            id: row.get(0)?,
            preference_key: row.get(1)?,
            preference_value: row.get(2)?,
            preference_type_name: row.get(3)?,
        })
    });
    
    match result {
        Ok(pref) => Ok(Some(pref)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

/// Set user preference
pub async fn set_user_preference(pref: &UserPreference) -> Result<()> {
    let conn = get_connection()?;
    
    conn.execute(
        "INSERT OR REPLACE INTO user_preferences (preference_key, preference_value, preference_type_name) 
         VALUES (?1, ?2, ?3)",
        params![pref.preference_key, pref.preference_value, pref.preference_type_name],
    ).context("Failed to set user preference")?;
    
    Ok(())
}

/// Get all user preferences
pub async fn get_all_user_preferences(_system_only: bool) -> Result<Vec<UserPreference>> {
    let conn = get_connection()?;
    
    let query = "SELECT id, preference_key, preference_value, preference_type_name 
                 FROM user_preferences ORDER BY preference_key";
    
    let mut stmt = conn.prepare(query)?;
    let preferences = stmt.query_map([], |row| {
        Ok(UserPreference {
            id: row.get(0)?,
            preference_key: row.get(1)?,
            preference_value: row.get(2)?,
            preference_type_name: row.get(3)?,
        })
    })?
    .collect::<Result<Vec<_>, _>>()?;
    
    Ok(preferences)
}

/// Create application log
pub async fn create_application_log(log: &ApplicationLog) -> Result<()> {
    let conn = get_connection()?;
    let created_at_str = log.created_at.format("%Y-%m-%d %H:%M:%S").to_string();
    
    conn.execute(
        "INSERT INTO application_logs (log_level, message, created_at) VALUES (?1, ?2, ?3)",
        params![log.log_level, log.message, created_at_str],
    ).context("Failed to create application log")?;
    
    Ok(())
}

/// Get application logs
pub async fn get_application_logs(
    _level: Option<LogLevel>,
    _component: Option<String>,
    _start_time: Option<chrono::NaiveDateTime>,
    _end_time: Option<chrono::NaiveDateTime>,
    _limit: i32,
) -> Result<Vec<ApplicationLog>> {
    let _conn = get_connection()?;
    
    // For now, return empty vec as this would require more complex query building
    Ok(vec![])
}
