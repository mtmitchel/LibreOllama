//! Chat-related database operations
//!
//! This module provides CRUD operations for chat sessions and messages.

use anyhow::{Context, Result};
use rusqlite::{Connection, params, OptionalExtension};
use crate::database::models::{ChatSession, ChatMessage};
use chrono::Local;

// ===== Chat Session Operations =====

/// Create a new chat session
pub fn create_chat_session(conn: &Connection, user_id: &str, session_name: &str) -> Result<i32> {
    let now = Local::now().naive_local();
    conn.execute(
        "INSERT INTO chat_sessions (user_id, session_name, created_at, updated_at) VALUES (?1, ?2, ?3, ?4)",
        params![user_id, session_name, now, now],
    ).context("Failed to create chat session")?;
    
    let session_id = conn.last_insert_rowid() as i32;
    Ok(session_id)
}

/// Get all chat sessions by user
pub fn get_chat_sessions_by_user(conn: &Connection, user_id: &str) -> Result<Vec<ChatSession>> {
    let mut stmt = conn.prepare(
        "SELECT id, user_id, session_name, created_at, updated_at FROM chat_sessions WHERE user_id = ?1 ORDER BY updated_at DESC"
    ).context("Failed to prepare get chat sessions by user query")?;
    
    let sessions = stmt.query_map(params![user_id], |row| {
        Ok(ChatSession {
            id: row.get(0)?,
            title: row.get(2)?, // Use session_name as title for now
            session_name: row.get(2)?,
            user_id: row.get(1)?,
            agent_id: 0, // Default agent_id
            context_length: 4096, // Default context_length
            is_active: true, // Default is_active
            created_at: row.get(3)?,
            updated_at: row.get(4)?,
        })
    }).context("Failed to execute get chat sessions by user query")?;
    
    let mut result = Vec::new();
    for session in sessions {
        result.push(session.context("Failed to process chat session")?);
    }
    
    Ok(result)
}

/// Get a specific chat session by ID
pub fn get_chat_session(conn: &Connection, session_id: i32) -> Result<Option<ChatSession>> {
    let mut stmt = conn.prepare(
        "SELECT id, user_id, session_name, created_at, updated_at FROM chat_sessions WHERE id = ?1"
    ).context("Failed to prepare get chat session query")?;
    
    let session = stmt.query_row(params![session_id], |row| {
        Ok(ChatSession {
            id: row.get(0)?,
            title: row.get(2)?, // Use session_name as title for now
            session_name: row.get(2)?,
            user_id: row.get(1)?,
            agent_id: 0, // Default agent_id
            context_length: 4096, // Default context_length
            is_active: true, // Default is_active
            created_at: row.get(3)?,
            updated_at: row.get(4)?,
        })
    }).optional().context("Failed to get chat session")?;
    
    Ok(session)
}

/// Update chat session
pub fn update_chat_session(conn: &Connection, session_id: i32, session_name: &str) -> Result<()> {
    let now = Local::now().naive_local();
    conn.execute(
        "UPDATE chat_sessions SET session_name = ?1, updated_at = ?2 WHERE id = ?3",
        params![session_name, now, session_id],
    ).context("Failed to update chat session")?;
    
    Ok(())
}

// Removed dangerous legacy placeholder function - use update_chat_session instead

/// Delete a chat session
pub fn delete_chat_session(conn: &Connection, session_id: i32) -> Result<()> {
    // First delete all messages in the session
    conn.execute(
        "DELETE FROM chat_messages WHERE session_id = ?1",
        params![session_id],
    ).context("Failed to delete chat messages")?;
    
    // Then delete the session
    conn.execute(
        "DELETE FROM chat_sessions WHERE id = ?1",
        params![session_id],
    ).context("Failed to delete chat session")?;
    
    Ok(())
}

// ===== Chat Message Operations =====

/// Create a new chat message
pub fn create_chat_message(conn: &Connection, session_id: i32, role: &str, content: &str) -> Result<i32> {
    let now = Local::now().naive_local();
    
    // Insert the message
    conn.execute(
        "INSERT INTO chat_messages (session_id, role, content, created_at) VALUES (?1, ?2, ?3, ?4)",
        params![session_id, role, content, now],
    ).context("Failed to create chat message")?;
    
    let message_id = conn.last_insert_rowid() as i32;
    
    // Update the session's updated_at timestamp
    conn.execute(
        "UPDATE chat_sessions SET updated_at = ?1 WHERE id = ?2",
        params![now, session_id],
    ).context("Failed to update session timestamp")?;
    
    Ok(message_id)
}

/// Get all messages for a session
pub fn get_chat_messages_by_session(conn: &Connection, session_id: i32) -> Result<Vec<ChatMessage>> {
    let mut stmt = conn.prepare(
        "SELECT id, session_id, role, content, created_at FROM chat_messages WHERE session_id = ?1 ORDER BY created_at ASC"
    ).context("Failed to prepare get chat messages by session query")?;
    
    let messages = stmt.query_map(params![session_id], |row| {
        Ok(ChatMessage {
            id: row.get(0)?,
            session_id: row.get(1)?,
            role: row.get(2)?,
            content: row.get(3)?,
            token_count: 0, // Default token_count
            created_at: row.get(4)?,
        })
    }).context("Failed to execute get chat messages by session query")?;
    
    let mut result = Vec::new();
    for message in messages {
        result.push(message.context("Failed to process chat message")?);
    }
    
    Ok(result)
}

// Removed dangerous legacy placeholder function - use get_chat_messages_by_session instead

/// Get a specific chat message by ID
pub fn get_chat_message(conn: &Connection, message_id: i32) -> Result<Option<ChatMessage>> {
    let mut stmt = conn.prepare(
        "SELECT id, session_id, role, content, created_at FROM chat_messages WHERE id = ?1"
    ).context("Failed to prepare get chat message query")?;
    
    let message = stmt.query_row(params![message_id], |row| {
        Ok(ChatMessage {
            id: row.get(0)?,
            session_id: row.get(1)?,
            role: row.get(2)?,
            content: row.get(3)?,
            token_count: 0, // Default token_count
            created_at: row.get(4)?,
        })
    }).optional().context("Failed to get chat message")?;
    
    Ok(message)
}

/// Update chat message content
pub fn update_chat_message(conn: &Connection, message_id: i32, content: &str) -> Result<()> {
    conn.execute(
        "UPDATE chat_messages SET content = ?1 WHERE id = ?2",
        params![content, message_id],
    ).context("Failed to update chat message")?;
    
    Ok(())
}

/// Delete a chat message
pub fn delete_chat_message(conn: &Connection, message_id: i32) -> Result<()> {
    conn.execute(
        "DELETE FROM chat_messages WHERE id = ?1",
        params![message_id],
    ).context("Failed to delete chat message")?;
    
    Ok(())
}

/// Get recent chat messages
pub fn get_recent_chat_messages(conn: &Connection, session_id: i32, limit: i32) -> Result<Vec<ChatMessage>> {
    let mut stmt = conn.prepare(
        "SELECT id, session_id, role, content, created_at FROM chat_messages WHERE session_id = ?1 ORDER BY created_at DESC LIMIT ?2"
    ).context("Failed to prepare get recent chat messages query")?;
    
    let messages = stmt.query_map(params![session_id, limit], |row| {
        Ok(ChatMessage {
            id: row.get(0)?,
            session_id: row.get(1)?,
            role: row.get(2)?,
            content: row.get(3)?,
            token_count: 0, // Default token_count
            created_at: row.get(4)?,
        })
    }).context("Failed to execute get recent chat messages query")?;
    
    let mut result = Vec::new();
    for message in messages {
        result.push(message.context("Failed to process chat message")?);
    }
    
    // Reverse to get chronological order
    result.reverse();
    Ok(result)
} 