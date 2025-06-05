use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

// Import database modules
use crate::database::{self, models::{ChatSession as DbChatSession, ChatMessage as DbChatMessage, MessageRole}};

// Data structures for chat functionality (compatible with frontend)
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ChatMessage {
    pub id: String,
    pub session_id: String,
    pub content: String,
    pub role: String, // "user" or "assistant"
    pub timestamp: DateTime<Utc>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ChatSession {
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
impl From<DbChatSession> for ChatSession {
    fn from(db_session: DbChatSession) -> Self {
        Self {
            id: db_session.id,
            title: db_session.title,
            created_at: db_session.created_at,
            updated_at: db_session.updated_at,
            // Note: message_count is calculated separately for compatibility
            message_count: 0,
        }
    }
}

impl From<DbChatMessage> for ChatMessage {
    fn from(db_message: DbChatMessage) -> Self {
        Self {
            id: db_message.id,
            session_id: db_message.session_id,
            content: db_message.content,
            role: db_message.role.to_string(),
            timestamp: db_message.created_at,
        }
    }
}

// Tauri commands for chat functionality
#[tauri::command]
pub async fn create_session(title: String) -> Result<String, String> {
    // Create a new database session
    let db_session = DbChatSession::new(title, None, None);
    let session_id = db_session.id.clone();
    
    // Save to database
    database::operations::create_chat_session(&db_session)
        .map_err(|e| format!("Failed to create session: {}", e))?;
    
    Ok(session_id)
}

#[tauri::command]
pub async fn get_sessions() -> Result<Vec<ChatSession>, String> {
    // Get sessions from database
    let db_sessions = database::operations::get_chat_sessions(false)
        .map_err(|e| format!("Failed to get sessions: {}", e))?;
    
    // Convert to API format and calculate message counts
    let mut sessions = Vec::new();
    for db_session in db_sessions {
        let mut session: ChatSession = db_session.into();
        
        // Calculate message count for this session
        let messages = database::operations::get_session_messages(&session.id)
            .map_err(|e| format!("Failed to get message count: {}", e))?;
        session.message_count = messages.len();
        
        sessions.push(session);
    }
    
    Ok(sessions)
}

#[tauri::command]
pub async fn send_message(session_id: String, content: String) -> Result<ChatMessage, String> {
    // Check if session exists
    let mut db_session = database::operations::get_chat_session_by_id(&session_id)
        .map_err(|e| format!("Failed to check session: {}", e))?
        .ok_or("Session not found")?;
    
    // Create a new database message
    let db_message = DbChatMessage::new(
        session_id.clone(),
        MessageRole::User,
        content,
        db_session.model_name.clone(),
    );
    
    // Save message to database
    database::operations::create_chat_message(&db_message)
        .map_err(|e| format!("Failed to create message: {}", e))?;
    
    // Update session's updated_at timestamp
    db_session.touch();
    database::operations::update_chat_session(&db_session)
        .map_err(|e| format!("Failed to update session: {}", e))?;
    
    // Convert to API format and return
    Ok(db_message.into())
}

#[tauri::command]
pub async fn get_session_messages(session_id: String) -> Result<Vec<ChatMessage>, String> {
    // Get messages from database
    let db_messages = database::operations::get_session_messages(&session_id)
        .map_err(|e| format!("Failed to get messages: {}", e))?;
    
    // Convert to API format
    let messages: Vec<ChatMessage> = db_messages.into_iter().map(|msg| msg.into()).collect();
    
    Ok(messages)
}

// Additional database-specific commands

#[tauri::command]
pub async fn get_database_stats() -> Result<serde_json::Value, String> {
    // Get basic statistics about the database
    let sessions = database::operations::get_chat_sessions(true)
        .map_err(|e| format!("Failed to get sessions: {}", e))?;
    
    let mut total_messages = 0;
    for session in &sessions {
        let messages = database::operations::get_session_messages(&session.id)
            .map_err(|e| format!("Failed to get messages: {}", e))?;
        total_messages += messages.len();
    }
    
    let stats = serde_json::json!({
        "total_sessions": sessions.len(),
        "total_messages": total_messages,
        "active_sessions": sessions.iter().filter(|s| !s.is_archived).count(),
        "database_type": "SQLCipher"
    });
    
    Ok(stats)
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