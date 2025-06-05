//! Database operations for LibreOllama
//!
//! This module provides CRUD operations for all database entities including
//! chat sessions, messages, agents, settings, and agent executions.

use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use rusqlite::{params, Connection, Row};
use std::str::FromStr;

use super::models::*;
use super::connection::get_connection;

// ============================================================================
// Chat Session Operations
// ============================================================================

/// Create a new chat session
pub fn create_chat_session(session: &ChatSession) -> Result<()> {
    let conn = get_connection()?;
    
    conn.execute(
        "INSERT INTO chat_sessions 
         (id, title, model_name, agent_id, created_at, updated_at, is_archived, metadata)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            session.id,
            session.title,
            session.model_name,
            session.agent_id,
            session.created_at.to_rfc3339(),
            session.updated_at.to_rfc3339(),
            session.is_archived,
            session.metadata
        ],
    ).context("Failed to create chat session")?;
    
    Ok(())
}

/// Get all chat sessions (non-archived by default)
pub fn get_chat_sessions(include_archived: bool) -> Result<Vec<ChatSession>> {
    let conn = get_connection()?;
    
    let query = if include_archived {
        "SELECT id, title, model_name, agent_id, created_at, updated_at, is_archived, metadata
         FROM chat_sessions ORDER BY updated_at DESC"
    } else {
        "SELECT id, title, model_name, agent_id, created_at, updated_at, is_archived, metadata
         FROM chat_sessions WHERE is_archived = FALSE ORDER BY updated_at DESC"
    };
    
    let mut stmt = conn.prepare(query)?;
    let session_iter = stmt.query_map([], map_chat_session_row)?;
    
    let mut sessions = Vec::new();
    for session in session_iter {
        sessions.push(session?);
    }
    
    Ok(sessions)
}

/// Get a chat session by ID
pub fn get_chat_session_by_id(session_id: &str) -> Result<Option<ChatSession>> {
    let conn = get_connection()?;
    
    let mut stmt = conn.prepare(
        "SELECT id, title, model_name, agent_id, created_at, updated_at, is_archived, metadata
         FROM chat_sessions WHERE id = ?1"
    )?;
    
    let session_iter = stmt.query_map([session_id], map_chat_session_row)?;
    
    for session in session_iter {
        return Ok(Some(session?));
    }
    
    Ok(None)
}

/// Update a chat session
pub fn update_chat_session(session: &ChatSession) -> Result<()> {
    let conn = get_connection()?;
    
    conn.execute(
        "UPDATE chat_sessions 
         SET title = ?2, model_name = ?3, agent_id = ?4, updated_at = ?5, 
             is_archived = ?6, metadata = ?7
         WHERE id = ?1",
        params![
            session.id,
            session.title,
            session.model_name,
            session.agent_id,
            session.updated_at.to_rfc3339(),
            session.is_archived,
            session.metadata
        ],
    ).context("Failed to update chat session")?;
    
    Ok(())
}

/// Delete a chat session and all its messages
pub fn delete_chat_session(session_id: &str) -> Result<()> {
    let conn = get_connection()?;
    
    // Foreign key constraints will automatically delete messages
    conn.execute("DELETE FROM chat_sessions WHERE id = ?1", [session_id])
        .context("Failed to delete chat session")?;
    
    Ok(())
}

/// Helper function to map database row to ChatSession
fn map_chat_session_row(row: &Row) -> rusqlite::Result<ChatSession> {
    let created_at_str: String = row.get(4)?;
    let updated_at_str: String = row.get(5)?;
    
    Ok(ChatSession {
        id: row.get(0)?,
        title: row.get(1)?,
        model_name: row.get(2)?,
        agent_id: row.get(3)?,
        created_at: DateTime::parse_from_rfc3339(&created_at_str)
            .map_err(|_e| rusqlite::Error::InvalidColumnType(4, "datetime".to_string(), rusqlite::types::Type::Text))?
            .with_timezone(&Utc),
        updated_at: DateTime::parse_from_rfc3339(&updated_at_str)
            .map_err(|_e| rusqlite::Error::InvalidColumnType(5, "datetime".to_string(), rusqlite::types::Type::Text))?
            .with_timezone(&Utc),
        is_archived: row.get(6)?,
        metadata: row.get(7)?,
    })
}

// ============================================================================
// Chat Message Operations
// ============================================================================

/// Create a new chat message
pub fn create_chat_message(message: &ChatMessage) -> Result<()> {
    let conn = get_connection()?;
    
    conn.execute(
        "INSERT INTO chat_messages 
         (id, session_id, role, content, model_name, created_at, metadata)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            message.id,
            message.session_id,
            message.role.to_string(),
            message.content,
            message.model_name,
            message.created_at.to_rfc3339(),
            message.metadata
        ],
    ).context("Failed to create chat message")?;
    
    Ok(())
}

/// Get all messages for a chat session
pub fn get_session_messages(session_id: &str) -> Result<Vec<ChatMessage>> {
    let conn = get_connection()?;
    
    let mut stmt = conn.prepare(
        "SELECT id, session_id, role, content, model_name, created_at, metadata
         FROM chat_messages WHERE session_id = ?1 ORDER BY created_at ASC"
    )?;
    
    let message_iter = stmt.query_map([session_id], map_chat_message_row)?;
    
    let mut messages = Vec::new();
    for message in message_iter {
        messages.push(message?);
    }
    
    Ok(messages)
}

/// Get a chat message by ID
pub fn get_chat_message_by_id(message_id: &str) -> Result<Option<ChatMessage>> {
    let conn = get_connection()?;
    
    let mut stmt = conn.prepare(
        "SELECT id, session_id, role, content, model_name, created_at, metadata
         FROM chat_messages WHERE id = ?1"
    )?;
    
    let message_iter = stmt.query_map([message_id], map_chat_message_row)?;
    
    for message in message_iter {
        return Ok(Some(message?));
    }
    
    Ok(None)
}

/// Delete a chat message
pub fn delete_chat_message(message_id: &str) -> Result<()> {
    let conn = get_connection()?;
    
    conn.execute("DELETE FROM chat_messages WHERE id = ?1", [message_id])
        .context("Failed to delete chat message")?;
    
    Ok(())
}

/// Helper function to map database row to ChatMessage
fn map_chat_message_row(row: &Row) -> rusqlite::Result<ChatMessage> {
    let created_at_str: String = row.get(5)?;
    let role_str: String = row.get(2)?;
    
    Ok(ChatMessage {
        id: row.get(0)?,
        session_id: row.get(1)?,
        role: MessageRole::from_str(&role_str)
            .map_err(|_| rusqlite::Error::InvalidColumnType(2, "role".to_string(), rusqlite::types::Type::Text))?,
        content: row.get(3)?,
        model_name: row.get(4)?,
        created_at: DateTime::parse_from_rfc3339(&created_at_str)
            .map_err(|_e| rusqlite::Error::InvalidColumnType(5, "datetime".to_string(), rusqlite::types::Type::Text))?
            .with_timezone(&Utc),
        metadata: row.get(6)?,
    })
}

// ============================================================================
// Agent Operations
// ============================================================================

/// Create a new agent
pub fn create_agent(agent: &Agent) -> Result<()> {
    let conn = get_connection()?;
    
    conn.execute(
        "INSERT INTO agents 
         (id, name, description, model_name, system_prompt, temperature, max_tokens, 
          created_at, updated_at, is_active, metadata)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        params![
            agent.id,
            agent.name,
            agent.description,
            agent.model_name,
            agent.system_prompt,
            agent.temperature,
            agent.max_tokens,
            agent.created_at.to_rfc3339(),
            agent.updated_at.to_rfc3339(),
            agent.is_active,
            agent.metadata
        ],
    ).context("Failed to create agent")?;
    
    Ok(())
}

/// Get all agents (active by default)
pub fn get_agents(include_inactive: bool) -> Result<Vec<Agent>> {
    let conn = get_connection()?;
    
    let query = if include_inactive {
        "SELECT id, name, description, model_name, system_prompt, temperature, max_tokens,
                created_at, updated_at, is_active, metadata
         FROM agents ORDER BY created_at DESC"
    } else {
        "SELECT id, name, description, model_name, system_prompt, temperature, max_tokens,
                created_at, updated_at, is_active, metadata
         FROM agents WHERE is_active = TRUE ORDER BY created_at DESC"
    };
    
    let mut stmt = conn.prepare(query)?;
    let agent_iter = stmt.query_map([], map_agent_row)?;
    
    let mut agents = Vec::new();
    for agent in agent_iter {
        agents.push(agent?);
    }
    
    Ok(agents)
}

/// Get an agent by ID
pub fn get_agent_by_id(agent_id: &str) -> Result<Option<Agent>> {
    let conn = get_connection()?;
    
    let mut stmt = conn.prepare(
        "SELECT id, name, description, model_name, system_prompt, temperature, max_tokens,
                created_at, updated_at, is_active, metadata
         FROM agents WHERE id = ?1"
    )?;
    
    let agent_iter = stmt.query_map([agent_id], map_agent_row)?;
    
    for agent in agent_iter {
        return Ok(Some(agent?));
    }
    
    Ok(None)
}

/// Update an agent
pub fn update_agent(agent: &Agent) -> Result<()> {
    let conn = get_connection()?;
    
    conn.execute(
        "UPDATE agents 
         SET name = ?2, description = ?3, model_name = ?4, system_prompt = ?5,
             temperature = ?6, max_tokens = ?7, updated_at = ?8, is_active = ?9, metadata = ?10
         WHERE id = ?1",
        params![
            agent.id,
            agent.name,
            agent.description,
            agent.model_name,
            agent.system_prompt,
            agent.temperature,
            agent.max_tokens,
            agent.updated_at.to_rfc3339(),
            agent.is_active,
            agent.metadata
        ],
    ).context("Failed to update agent")?;
    
    Ok(())
}

/// Delete an agent
pub fn delete_agent(agent_id: &str) -> Result<()> {
    let conn = get_connection()?;
    
    conn.execute("DELETE FROM agents WHERE id = ?1", [agent_id])
        .context("Failed to delete agent")?;
    
    Ok(())
}

/// Helper function to map database row to Agent
fn map_agent_row(row: &Row) -> rusqlite::Result<Agent> {
    let created_at_str: String = row.get(7)?;
    let updated_at_str: String = row.get(8)?;
    
    Ok(Agent {
        id: row.get(0)?,
        name: row.get(1)?,
        description: row.get(2)?,
        model_name: row.get(3)?,
        system_prompt: row.get(4)?,
        temperature: row.get(5)?,
        max_tokens: row.get(6)?,
        created_at: DateTime::parse_from_rfc3339(&created_at_str)
            .map_err(|_e| rusqlite::Error::InvalidColumnType(7, "datetime".to_string(), rusqlite::types::Type::Text))?
            .with_timezone(&Utc),
        updated_at: DateTime::parse_from_rfc3339(&updated_at_str)
            .map_err(|_e| rusqlite::Error::InvalidColumnType(8, "datetime".to_string(), rusqlite::types::Type::Text))?
            .with_timezone(&Utc),
        is_active: row.get(9)?,
        metadata: row.get(10)?,
    })
}

// ============================================================================
// Settings Operations
// ============================================================================

/// Get a setting by key
pub fn get_setting(key: &str) -> Result<Option<Setting>> {
    let conn = get_connection()?;
    
    let mut stmt = conn.prepare(
        "SELECT key, value, description, created_at, updated_at
         FROM settings WHERE key = ?1"
    )?;
    
    let setting_iter = stmt.query_map([key], map_setting_row)?;
    
    for setting in setting_iter {
        return Ok(Some(setting?));
    }
    
    Ok(None)
}

/// Set a setting value (insert or update)
pub fn set_setting(setting: &Setting) -> Result<()> {
    let conn = get_connection()?;
    
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value, description, created_at, updated_at)
         VALUES (?1, ?2, ?3, 
                 COALESCE((SELECT created_at FROM settings WHERE key = ?1), ?4), 
                 ?5)",
        params![
            setting.key,
            setting.value,
            setting.description,
            setting.created_at.to_rfc3339(),
            setting.updated_at.to_rfc3339()
        ],
    ).context("Failed to set setting")?;
    
    Ok(())
}

/// Get all settings
pub fn get_all_settings() -> Result<Vec<Setting>> {
    let conn = get_connection()?;
    
    let mut stmt = conn.prepare(
        "SELECT key, value, description, created_at, updated_at
         FROM settings ORDER BY key"
    )?;
    
    let setting_iter = stmt.query_map([], map_setting_row)?;
    
    let mut settings = Vec::new();
    for setting in setting_iter {
        settings.push(setting?);
    }
    
    Ok(settings)
}

/// Helper function to map database row to Setting
fn map_setting_row(row: &Row) -> rusqlite::Result<Setting> {
    let created_at_str: String = row.get(3)?;
    let updated_at_str: String = row.get(4)?;
    
    Ok(Setting {
        key: row.get(0)?,
        value: row.get(1)?,
        description: row.get(2)?,
        created_at: DateTime::parse_from_rfc3339(&created_at_str)
            .map_err(|_e| rusqlite::Error::InvalidColumnType(3, "datetime".to_string(), rusqlite::types::Type::Text))?
            .with_timezone(&Utc),
        updated_at: DateTime::parse_from_rfc3339(&updated_at_str)
            .map_err(|_e| rusqlite::Error::InvalidColumnType(4, "datetime".to_string(), rusqlite::types::Type::Text))?
            .with_timezone(&Utc),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::schema::run_migrations;
    use rusqlite::Connection;

    fn setup_test_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        run_migrations(&conn).unwrap();
        conn
    }

    #[test]
    fn test_chat_session_crud() {
        let _conn = setup_test_db();
        
        let session = ChatSession::new(
            "Test Session".to_string(),
            Some("llama2".to_string()),
            None,
        );
        
        // Test create
        assert!(create_chat_session(&session).is_ok());
        
        // Test read
        let retrieved = get_chat_session_by_id(&session.id).unwrap();
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().title, "Test Session");
        
        // Test list
        let sessions = get_chat_sessions(false).unwrap();
        assert_eq!(sessions.len(), 1);
    }

    #[test]
    fn test_agent_crud() {
        let _conn = setup_test_db();
        
        let agent = Agent::new(
            "Test Agent".to_string(),
            Some("A test agent".to_string()),
            "llama2".to_string(),
            Some("You are helpful".to_string()),
        );
        
        // Test create
        assert!(create_agent(&agent).is_ok());
        
        // Test read
        let retrieved = get_agent_by_id(&agent.id).unwrap();
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().name, "Test Agent");
    }
}

// ============================================================================
// Folder Operations
// ============================================================================

/// Create a new folder
pub fn create_folder(folder: &crate::database::models::Folder) -> Result<()> {
    let conn = crate::database::get_connection()?;
    
    conn.execute(
        "INSERT INTO folders (id, name, parent_id, color, user_id, created_at, updated_at, metadata)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        [
            &folder.id,
            &folder.name,
            &folder.parent_id.as_ref().unwrap_or(&"".to_string()),
            &folder.color.as_ref().unwrap_or(&"".to_string()),
            &folder.user_id,
            &folder.created_at.to_rfc3339(),
            &folder.updated_at.to_rfc3339(),
            &folder.metadata.as_ref().unwrap_or(&"".to_string()),
        ],
    ).context("Failed to create folder")?;
    
    Ok(())
}

/// Get all folders for a user
pub fn get_folders(user_id: &str) -> Result<Vec<crate::database::models::Folder>> {
    let conn = crate::database::get_connection()?;
    
    let mut stmt = conn.prepare(
        "SELECT id, name, parent_id, color, user_id, created_at, updated_at, metadata
         FROM folders WHERE user_id = ?1 ORDER BY created_at ASC"
    )?;
    
    let folders = stmt.query_map([user_id], map_folder_row)?
        .collect::<rusqlite::Result<Vec<_>>>()?;
    
    Ok(folders)
}

/// Get folder by ID
pub fn get_folder_by_id(folder_id: &str) -> Result<Option<crate::database::models::Folder>> {
    let conn = crate::database::get_connection()?;
    
    match conn.query_row(
        "SELECT id, name, parent_id, color, user_id, created_at, updated_at, metadata
         FROM folders WHERE id = ?1",
        [folder_id],
        map_folder_row,
    ) {
        Ok(folder) => Ok(Some(folder)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

/// Update folder
pub fn update_folder(folder: &crate::database::models::Folder) -> Result<()> {
    let conn = crate::database::get_connection()?;
    
    conn.execute(
        "UPDATE folders SET name = ?1, parent_id = ?2, color = ?3, updated_at = ?4, metadata = ?5
         WHERE id = ?6",
        [
            &folder.name,
            &folder.parent_id.as_ref().unwrap_or(&"".to_string()),
            &folder.color.as_ref().unwrap_or(&"".to_string()),
            &folder.updated_at.to_rfc3339(),
            &folder.metadata.as_ref().unwrap_or(&"".to_string()),
            &folder.id,
        ],
    ).context("Failed to update folder")?;
    
    Ok(())
}

/// Delete folder
pub fn delete_folder(folder_id: &str) -> Result<()> {
    let conn = crate::database::get_connection()?;
    
    conn.execute("DELETE FROM folders WHERE id = ?1", [folder_id])
        .context("Failed to delete folder")?;
    
    Ok(())
}

/// Map folder database row to Folder struct
fn map_folder_row(row: &rusqlite::Row) -> rusqlite::Result<crate::database::models::Folder> {
    use chrono::DateTime;
    
    let parent_id: String = row.get(2)?;
    let color: String = row.get(3)?;
    let metadata: String = row.get(7)?;
    
    Ok(crate::database::models::Folder {
        id: row.get(0)?,
        name: row.get(1)?,
        parent_id: if parent_id.is_empty() { None } else { Some(parent_id) },
        color: if color.is_empty() { None } else { Some(color) },
        user_id: row.get(4)?,
        created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(5)?).unwrap().with_timezone(&chrono::Utc),
        updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(6)?).unwrap().with_timezone(&chrono::Utc),
        metadata: if metadata.is_empty() { None } else { Some(metadata) },
    })
}

// ============================================================================
// Note Operations
// ============================================================================

/// Create a new note
pub fn create_note(note: &crate::database::models::Note) -> Result<()> {
    let conn = crate::database::get_connection()?;
    
    conn.execute(
        "INSERT INTO notes (id, title, content, tags, folder_id, user_id, created_at, updated_at, metadata)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        [
            &note.id,
            &note.title,
            &note.content,
            &note.tags.as_ref().unwrap_or(&"".to_string()),
            &note.folder_id.as_ref().unwrap_or(&"".to_string()),
            &note.user_id,
            &note.created_at.to_rfc3339(),
            &note.updated_at.to_rfc3339(),
            &note.metadata.as_ref().unwrap_or(&"".to_string()),
        ],
    ).context("Failed to create note")?;
    
    Ok(())
}

/// Get all notes for a user
pub fn get_notes(user_id: &str) -> Result<Vec<crate::database::models::Note>> {
    let conn = crate::database::get_connection()?;
    
    let mut stmt = conn.prepare(
        "SELECT id, title, content, tags, folder_id, user_id, created_at, updated_at, metadata
         FROM notes WHERE user_id = ?1 ORDER BY updated_at DESC"
    )?;
    
    let notes = stmt.query_map([user_id], map_note_row)?
        .collect::<rusqlite::Result<Vec<_>>>()?;
    
    Ok(notes)
}

/// Get note by ID
pub fn get_note_by_id(note_id: &str) -> Result<Option<crate::database::models::Note>> {
    let conn = crate::database::get_connection()?;
    
    match conn.query_row(
        "SELECT id, title, content, tags, folder_id, user_id, created_at, updated_at, metadata
         FROM notes WHERE id = ?1",
        [note_id],
        map_note_row,
    ) {
        Ok(note) => Ok(Some(note)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

/// Update note
pub fn update_note(note: &crate::database::models::Note) -> Result<()> {
    let conn = crate::database::get_connection()?;
    
    conn.execute(
        "UPDATE notes SET title = ?1, content = ?2, tags = ?3, folder_id = ?4, updated_at = ?5, metadata = ?6
         WHERE id = ?7",
        [
            &note.title,
            &note.content,
            &note.tags.as_ref().unwrap_or(&"".to_string()),
            &note.folder_id.as_ref().unwrap_or(&"".to_string()),
            &note.updated_at.to_rfc3339(),
            &note.metadata.as_ref().unwrap_or(&"".to_string()),
            &note.id,
        ],
    ).context("Failed to update note")?;
    
    Ok(())
}

/// Delete note
pub fn delete_note(note_id: &str) -> Result<()> {
    let conn = crate::database::get_connection()?;
    
    conn.execute("DELETE FROM notes WHERE id = ?1", [note_id])
        .context("Failed to delete note")?;
    
    Ok(())
}

/// Map note database row to Note struct
fn map_note_row(row: &rusqlite::Row) -> rusqlite::Result<crate::database::models::Note> {
    use chrono::DateTime;
    
    let tags: String = row.get(3)?;
    let folder_id: String = row.get(4)?;
    let metadata: String = row.get(8)?;
    
    Ok(crate::database::models::Note {
        id: row.get(0)?,
        title: row.get(1)?,
        content: row.get(2)?,
        tags: if tags.is_empty() { None } else { Some(tags) },
        folder_id: if folder_id.is_empty() { None } else { Some(folder_id) },
        user_id: row.get(5)?,
        created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(6)?).unwrap().with_timezone(&chrono::Utc),
        updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(7)?).unwrap().with_timezone(&chrono::Utc),
        metadata: if metadata.is_empty() { None } else { Some(metadata) },
    })
}

// ============================================================================
// MCP Server Operations
// ============================================================================

/// Create a new MCP server
pub fn create_mcp_server(server: &crate::database::models::McpServer) -> Result<()> {
    let conn = crate::database::get_connection()?;
    
    conn.execute(
        "INSERT INTO mcp_servers (id, name, description, server_type, command, args, env, url, auth_token, is_active, user_id, created_at, updated_at, metadata)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
        [
            &server.id,
            &server.name,
            &server.description.as_ref().unwrap_or(&"".to_string()),
            &server.server_type,
            &server.command.as_ref().unwrap_or(&"".to_string()),
            &server.args.as_ref().unwrap_or(&"".to_string()),
            &server.env.as_ref().unwrap_or(&"".to_string()),
            &server.url.as_ref().unwrap_or(&"".to_string()),
            &server.auth_token.as_ref().unwrap_or(&"".to_string()),
            &server.is_active.to_string(),
            &server.user_id,
            &server.created_at.to_rfc3339(),
            &server.updated_at.to_rfc3339(),
            &server.metadata.as_ref().unwrap_or(&"".to_string()),
        ],
    ).context("Failed to create MCP server")?;
    
    Ok(())
}

/// Get MCP server by ID
pub fn get_mcp_server_by_id(server_id: &str) -> Result<Option<crate::database::models::McpServer>> {
    let conn = crate::database::get_connection()?;
    
    match conn.query_row(
        "SELECT id, name, description, server_type, command, args, env, url, auth_token, is_active, user_id, created_at, updated_at, metadata
         FROM mcp_servers WHERE id = ?1",
        [server_id],
        map_mcp_server_row,
    ) {
        Ok(server) => Ok(Some(server)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

/// Get all MCP servers for a user
pub fn get_mcp_servers(user_id: &str) -> Result<Vec<crate::database::models::McpServer>> {
    let conn = crate::database::get_connection()?;
    
    let mut stmt = conn.prepare(
        "SELECT id, name, description, server_type, command, args, env, url, auth_token, is_active, user_id, created_at, updated_at, metadata
         FROM mcp_servers WHERE user_id = ?1 ORDER BY created_at ASC"
    )?;
    
    let servers = stmt.query_map([user_id], map_mcp_server_row)?
        .collect::<rusqlite::Result<Vec<_>>>()?;
    
    Ok(servers)
}

/// Update MCP server
pub fn update_mcp_server(server: &crate::database::models::McpServer) -> Result<()> {
    let conn = crate::database::get_connection()?;
    
    conn.execute(
        "UPDATE mcp_servers SET name = ?1, description = ?2, server_type = ?3, command = ?4, args = ?5, env = ?6, url = ?7, auth_token = ?8, is_active = ?9, updated_at = ?10, metadata = ?11
         WHERE id = ?12",
        [
            &server.name,
            &server.description.as_ref().unwrap_or(&"".to_string()),
            &server.server_type,
            &server.command.as_ref().unwrap_or(&"".to_string()),
            &server.args.as_ref().unwrap_or(&"".to_string()),
            &server.env.as_ref().unwrap_or(&"".to_string()),
            &server.url.as_ref().unwrap_or(&"".to_string()),
            &server.auth_token.as_ref().unwrap_or(&"".to_string()),
            &server.is_active.to_string(),
            &server.updated_at.to_rfc3339(),
            &server.metadata.as_ref().unwrap_or(&"".to_string()),
            &server.id,
        ],
    ).context("Failed to update MCP server")?;
    
    Ok(())
}

/// Delete MCP server
pub fn delete_mcp_server(server_id: &str) -> Result<()> {
    let conn = crate::database::get_connection()?;
    
    conn.execute("DELETE FROM mcp_servers WHERE id = ?1", [server_id])
        .context("Failed to delete MCP server")?;
    
    Ok(())
}

/// Map MCP server database row to McpServer struct
fn map_mcp_server_row(row: &rusqlite::Row) -> rusqlite::Result<crate::database::models::McpServer> {
    use chrono::DateTime;
    
    let description: String = row.get(2)?;
    let command: String = row.get(4)?;
    let args: String = row.get(5)?;
    let env: String = row.get(6)?;
    let url: String = row.get(7)?;
    let auth_token: String = row.get(8)?;
    let metadata: String = row.get(13)?;
    
    Ok(crate::database::models::McpServer {
        id: row.get(0)?,
        name: row.get(1)?,
        description: if description.is_empty() { None } else { Some(description) },
        server_type: row.get(3)?,
        command: if command.is_empty() { None } else { Some(command) },
        args: if args.is_empty() { None } else { Some(args) },
        env: if env.is_empty() { None } else { Some(env) },
        url: if url.is_empty() { None } else { Some(url) },
        auth_token: if auth_token.is_empty() { None } else { Some(auth_token) },
        is_active: row.get::<_, String>(9)?.parse().unwrap_or(false),
        user_id: row.get(10)?,
        created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(11)?).unwrap().with_timezone(&chrono::Utc),
        updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(12)?).unwrap().with_timezone(&chrono::Utc),
        metadata: if metadata.is_empty() { None } else { Some(metadata) },
    })
}

// ============================================================================
// N8N Connection Operations
// ============================================================================

/// Create a new N8N connection
pub fn create_n8n_connection(connection: &crate::database::models::N8nConnection) -> Result<()> {
    let conn = crate::database::get_connection()?;
    
    conn.execute(
        "INSERT INTO n8n_connections (id, name, description, base_url, api_key, webhook_url, is_active, user_id, created_at, updated_at, metadata)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        [
            &connection.id,
            &connection.name,
            &connection.description.as_ref().unwrap_or(&"".to_string()),
            &connection.base_url,
            &connection.api_key.as_ref().unwrap_or(&"".to_string()),
            &connection.webhook_url.as_ref().unwrap_or(&"".to_string()),
            &connection.is_active.to_string(),
            &connection.user_id,
            &connection.created_at.to_rfc3339(),
            &connection.updated_at.to_rfc3339(),
            &connection.metadata.as_ref().unwrap_or(&"".to_string()),
        ],
    ).context("Failed to create N8N connection")?;
    
    Ok(())
}

/// Get N8N connection by ID
pub fn get_n8n_connection_by_id(connection_id: &str) -> Result<Option<crate::database::models::N8nConnection>> {
    let conn = crate::database::get_connection()?;
    
    match conn.query_row(
        "SELECT id, name, description, base_url, api_key, webhook_url, is_active, user_id, created_at, updated_at, metadata
         FROM n8n_connections WHERE id = ?1",
        [connection_id],
        map_n8n_connection_row,
    ) {
        Ok(connection) => Ok(Some(connection)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

/// Get all N8N connections for a user
pub fn get_n8n_connections(user_id: &str) -> Result<Vec<crate::database::models::N8nConnection>> {
    let conn = crate::database::get_connection()?;
    
    let mut stmt = conn.prepare(
        "SELECT id, name, description, base_url, api_key, webhook_url, is_active, user_id, created_at, updated_at, metadata
         FROM n8n_connections WHERE user_id = ?1 ORDER BY created_at ASC"
    )?;
    
    let connections = stmt.query_map([user_id], map_n8n_connection_row)?
        .collect::<rusqlite::Result<Vec<_>>>()?;
    
    Ok(connections)
}

/// Update N8N connection
pub fn update_n8n_connection(connection: &crate::database::models::N8nConnection) -> Result<()> {
    let conn = crate::database::get_connection()?;
    
    conn.execute(
        "UPDATE n8n_connections SET name = ?1, description = ?2, base_url = ?3, api_key = ?4, webhook_url = ?5, is_active = ?6, updated_at = ?7, metadata = ?8
         WHERE id = ?9",
        [
            &connection.name,
            &connection.description.as_ref().unwrap_or(&"".to_string()),
            &connection.base_url,
            &connection.api_key.as_ref().unwrap_or(&"".to_string()),
            &connection.webhook_url.as_ref().unwrap_or(&"".to_string()),
            &connection.is_active.to_string(),
            &connection.updated_at.to_rfc3339(),
            &connection.metadata.as_ref().unwrap_or(&"".to_string()),
            &connection.id,
        ],
    ).context("Failed to update N8N connection")?;
    
    Ok(())
}

/// Delete N8N connection
pub fn delete_n8n_connection(connection_id: &str) -> Result<()> {
    let conn = crate::database::get_connection()?;
    
    conn.execute("DELETE FROM n8n_connections WHERE id = ?1", [connection_id])
        .context("Failed to delete N8N connection")?;
    
    Ok(())
}

/// Map N8N connection database row to N8nConnection struct
fn map_n8n_connection_row(row: &rusqlite::Row) -> rusqlite::Result<crate::database::models::N8nConnection> {
    use chrono::DateTime;
    
    let description: String = row.get(2)?;
    let api_key: String = row.get(4)?;
    let webhook_url: String = row.get(5)?;
    let metadata: String = row.get(10)?;
    
    Ok(crate::database::models::N8nConnection {
        id: row.get(0)?,
        name: row.get(1)?,
        description: if description.is_empty() { None } else { Some(description) },
        base_url: row.get(3)?,
        api_key: if api_key.is_empty() { None } else { Some(api_key) },
        webhook_url: if webhook_url.is_empty() { None } else { Some(webhook_url) },
        is_active: row.get::<_, String>(6)?.parse().unwrap_or(false),
        user_id: row.get(7)?,
        created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(8)?).unwrap().with_timezone(&chrono::Utc),
        updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(9)?).unwrap().with_timezone(&chrono::Utc),
        metadata: if metadata.is_empty() { None } else { Some(metadata) },
    })
}