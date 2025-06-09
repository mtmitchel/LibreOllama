use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

// Import database modules
use crate::database::{ChatSession as DbChatSession, ChatMessage as DbChatMessage, MessageRole};

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
            created_at: db_session.created_at,
            updated_at: db_session.updated_at,
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
            timestamp: db_message.created_at,
        }
    }
}

// Tauri commands for chat functionality
#[tauri::command]
pub async fn create_session(title: String) -> Result<String, String> {
    // Create a new database session
    // This part needs to be aligned with how DbChatSession is created and what operations_v4::create_chat_session expects
    // For now, assuming operations_v4::create_chat_session takes title and returns a session or its ID
    let session_id = operations_v4::create_chat_session(title, "user_id_placeholder".to_string()) // Placeholder for user_id
        .await
        .map_err(|e| format!("Failed to create session: {}", e))?;
    
    Ok(session_id.to_string()) // Ensure it returns a String
}

#[tauri::command]
pub async fn get_sessions() -> Result<Vec<ChatSessionApi>, String> {
    let db_sessions = operations_v4::get_chat_sessions(false) 
        .await
        .map_err(|e| format!("Failed to get sessions: {}", e))?;
    
    let mut sessions_api = Vec::new();
    for db_session in db_sessions {
        let mut session_api: ChatSessionApi = db_session.into();
        let messages = operations_v4::get_session_messages(session_api.id.parse().unwrap_or_default()) // Parse String to i32
            .await
            .map_err(|e| format!("Failed to get message count for session {}: {}", session_api.id, e))?;
        session_api.message_count = messages.len();
        sessions_api.push(session_api);
    }
    
    Ok(sessions_api)
}

#[tauri::command]
pub async fn send_message(session_id_str: String, content: String) -> Result<ChatMessageApi, String> {
    let session_id: i32 = session_id_str.parse().map_err(|_| "Invalid session ID format".to_string())?;

    // Assuming operations_v4::create_chat_message handles creating and saving the message
    let db_message = operations_v4::create_chat_message(session_id, MessageRole::User, content)
        .await
        .map_err(|e| format!("Failed to send message: {}", e))?;

    // Assuming operations_v4::update_chat_session_timestamp handles this or it's done within create_chat_message
    operations_v4::update_chat_session_timestamp(session_id)
        .await
        .map_err(|e| format!("Failed to update session timestamp: {}", e))?;

    Ok(db_message.into())
}

#[tauri::command]
pub async fn get_session_messages(session_id_str: String) -> Result<Vec<ChatMessageApi>, String> {
    let session_id: i32 = session_id_str.parse().map_err(|_| "Invalid session ID format".to_string())?;
    let db_messages = operations_v4::get_session_messages(session_id)
        .await
        .map_err(|e| format!("Failed to get messages: {}", e))?;
    
    let messages_api: Vec<ChatMessageApi> = db_messages.into_iter().map(|msg| msg.into()).collect();
    Ok(messages_api)
}

// Additional database-specific commands

#[tauri::command]
pub async fn get_database_stats() -> Result<serde_json::Value, String> {
    let sessions = operations_v4::get_chat_sessions(true)
        .await
        .map_err(|e| format!("Failed to get sessions: {}", e))?;
    
    let mut total_messages = 0;
    for session in &sessions {
        let messages = operations_v4::get_session_messages(session.id)
            .await
            .map_err(|e| format!("Failed to get messages for session {}: {}", session.id, e))?;
        total_messages += messages.len();
    }
    
    let stats = serde_json::json!({
        "total_sessions": sessions.len(),
        "total_messages": total_messages,
        // "active_sessions": sessions.iter().filter(|s| !s.is_archived).count(), // is_archived not in new DbChatSession
        "database_type": "SQLCipher"
    });
    
    Ok(stats)
}

#[tauri::command]
pub async fn delete_session(session_id_str: String) -> Result<bool, String> {
    let session_id: i32 = session_id_str.parse().map_err(|_| "Invalid session ID format".to_string())?;
    
    crate::database::delete_chat_session(session_id)
        .await
        .map_err(|e| format!("Failed to delete session: {}", e))?;
    
    Ok(true)
}

#[tauri::command]
pub async fn delete_session(session_id: String) -> Result<bool, String> {
    // Check if session exists first
    let session_exists = database::operations::get_chat_session_by_id(&session_id)
        .map_err(|e| format!("Failed to check session: {}", e))?
        .is_some();
    
    if !session_exists {
        return Err("Session not found".to_string());
    }
    
    // Delete session from database (messages will be deleted via foreign key constraints)
    database::operations::delete_chat_session(&session_id)
        .map_err(|e| format!("Failed to delete session: {}", e))?;
    
    Ok(true)
}