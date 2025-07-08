use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc, TimeZone};
use anyhow::Context;

// Import database modules
use crate::database::{ChatSession as DbChatSession, ChatMessage as DbChatMessage};
use crate::database::operations;

// Data structures for chat functionality (compatible with frontend)
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ChatMessageApi {
    pub id: String,
    pub session_id: String,
    pub content: String,
    pub role: String, // "user" or "assistant"
    pub timestamp: DateTime<Utc>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ChatSessionApi {
    pub id: String,
    pub title: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub message_count: usize,
}

// Error type for chat operations
#[derive(Serialize, Deserialize, Debug)]
pub struct ChatError {
    pub message: String,
}

impl std::fmt::Display for ChatError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl std::error::Error for ChatError {}

// Helper functions to convert between database models and API models
impl From<DbChatSession> for ChatSessionApi {
    fn from(db_session: DbChatSession) -> Self {
        Self {
            id: db_session.id.to_string(), // Convert i32 to String
            title: db_session.session_name, // Use session_name field
            created_at: Utc.from_utc_datetime(&db_session.created_at),
            updated_at: Utc.from_utc_datetime(&db_session.updated_at),
            message_count: 0, // Calculated separately
        }
    }
}

impl From<DbChatMessage> for ChatMessageApi {
    fn from(db_message: DbChatMessage) -> Self {
        Self {
            id: db_message.id.to_string(), // Convert i32 to String
            session_id: db_message.session_id.to_string(), // Convert i32 to String
            content: db_message.content,
            role: db_message.role, // role is already a String in DbChatMessage
            timestamp: Utc.from_utc_datetime(&db_message.created_at),
        }
    }
}

// Tauri commands for chat functionality
#[tauri::command]
pub async fn create_session(
    title: String,
    db_manager: tauri::State<'_, crate::database::DatabaseManager>,
) -> Result<String, String> {
    let db_manager_clone = db_manager.inner().clone();
    let session_id = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::chat_operations::create_chat_session(&conn, "user_id_placeholder", &title)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;
    
    Ok(session_id.to_string())
}

#[tauri::command]
pub async fn get_sessions(
    db_manager: tauri::State<'_, crate::database::DatabaseManager>,
) -> Result<Vec<ChatSessionApi>, String> {
    let db_manager_clone = db_manager.inner().clone();
    let db_sessions = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::chat_operations::get_chat_sessions_by_user(&conn, "user_id_placeholder")
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;
    
    let mut sessions_api = Vec::new();
    for db_session in db_sessions {
        let mut session_api: ChatSessionApi = db_session.into();
        let db_manager_clone_inner = db_manager.inner().clone();
        let session_id = session_api.id.parse().unwrap_or_default();
        let message_count = tokio::task::spawn_blocking(move || {
            let conn = db_manager_clone_inner.get_connection()?;
            operations::chat_operations::get_chat_messages_by_session(&conn, session_id)
        })
        .await
        .map_err(|e| e.to_string())?
        .map_err(|e: anyhow::Error| e.to_string())?
        .len();
        session_api.message_count = message_count;
        sessions_api.push(session_api);
    }
    
    Ok(sessions_api)
}

#[tauri::command]
pub async fn send_message(
    session_id_str: String,
    content: String,
    db_manager: tauri::State<'_, crate::database::DatabaseManager>,
) -> Result<ChatMessageApi, String> {
    let session_id: i32 = session_id_str.parse().map_err(|_| "Invalid session ID format".to_string())?;

    let db_manager_clone = db_manager.inner().clone();
    let content_clone = content.clone();
    let message_id = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::chat_operations::create_chat_message(&conn, session_id, "user", &content_clone)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;

    let db_manager_clone_update = db_manager.inner().clone();
    tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone_update.get_connection()?;
        // Fix: Use the working function instead of the broken legacy placeholder
        let now = chrono::Local::now().naive_local();
        conn.execute(
            "UPDATE chat_sessions SET updated_at = ?1 WHERE id = ?2",
            rusqlite::params![now, session_id],
        ).context("Failed to update chat session timestamp")
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;

    // Get the created message
    let db_manager_clone_get = db_manager.inner().clone();
    let db_message = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone_get.get_connection()?;
        operations::chat_operations::get_chat_message(&conn, message_id)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?
    .ok_or_else(|| "Failed to retrieve created message".to_string())?;

    Ok(db_message.into())
}

#[tauri::command]
pub async fn get_session_messages(
    session_id_str: String,
    db_manager: tauri::State<'_, crate::database::DatabaseManager>,
) -> Result<Vec<ChatMessageApi>, String> {
    let session_id: i32 = session_id_str.parse().map_err(|_| "Invalid session ID format".to_string())?;
    
    let db_manager_clone = db_manager.inner().clone();
    let db_messages = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::chat_operations::get_chat_messages_by_session(&conn, session_id)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;
    
    let messages_api: Vec<ChatMessageApi> = db_messages.into_iter().map(|msg| msg.into()).collect();
    Ok(messages_api)
}

// Additional database-specific commands

#[tauri::command]
pub async fn get_database_stats(
    db_manager: tauri::State<'_, crate::database::DatabaseManager>,
) -> Result<serde_json::Value, String> {
    let db_manager_clone = db_manager.inner().clone();
    let sessions = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::chat_operations::get_chat_sessions_by_user(&conn, "user_id_placeholder")
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;
    
    let mut total_messages = 0;
    for session in &sessions {
        let db_manager_clone_inner = db_manager.inner().clone();
        let session_id = session.id;
        let message_count = tokio::task::spawn_blocking(move || {
            let conn = db_manager_clone_inner.get_connection()?;
            operations::chat_operations::get_chat_messages_by_session(&conn, session_id)
        })
        .await
        .map_err(|e| e.to_string())?
        .map_err(|e: anyhow::Error| e.to_string())?
        .len();
        total_messages += message_count;
    }
    
    let stats = serde_json::json!({
        "total_sessions": sessions.len(),
        "total_messages": total_messages,
        "database_type": "SQLCipher"
    });
    
    Ok(stats)
}

#[allow(dead_code)]
#[tauri::command]
pub async fn delete_session_v4(
    session_id_str: String,
    db_manager: tauri::State<'_, crate::database::DatabaseManager>,
) -> Result<bool, String> {
    let session_id: i32 = session_id_str.parse().map_err(|_| "Invalid session ID format".to_string())?;
    
    let db_manager_clone = db_manager.inner().clone();
    tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::chat_operations::delete_chat_session(&conn, session_id)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;
    
    Ok(true)
}

#[tauri::command]
pub async fn delete_session(
    session_id: String,
    db_manager: tauri::State<'_, crate::database::DatabaseManager>,
) -> Result<bool, String> {
    let session_id_int: i32 = session_id.parse().map_err(|_| "Invalid session ID format".to_string())?;
    
    let db_manager_clone_check = db_manager.inner().clone();
    let session_exists = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone_check.get_connection()?;
        operations::chat_operations::get_chat_session(&conn, session_id_int)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?
    .is_some();
    
    if !session_exists {
        return Err("Session not found".to_string());
    }
    
    let db_manager_clone_delete = db_manager.inner().clone();
    tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone_delete.get_connection()?;
        operations::chat_operations::delete_chat_session(&conn, session_id_int)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;
    
    Ok(true)
}