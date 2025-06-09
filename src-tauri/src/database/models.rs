// src-tauri/src/database/models.rs

use serde::{Serialize, Deserialize};
use diesel::{Queryable, Insertable, AsChangeset, Identifiable};
use super::schema_v4::{chat_sessions, chat_messages, user_preferences, application_logs, request_cache, chat_templates, conversation_contexts, folders};

#[derive(Queryable, Identifiable, Serialize, Deserialize, Debug, Clone)]
#[diesel(table_name = chat_sessions)]
pub struct ChatSession {
    pub id: i32,
    pub user_id: String,
    pub session_name: String,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum MessageRole {
    User,
    Assistant,
    System,
}

#[derive(Queryable, Identifiable, Serialize, Deserialize, Debug, Clone)]
#[diesel(table_name = chat_messages)]
pub struct ChatMessage {
    pub id: i32,
    pub session_id: i32,
    pub role: String, // Storing MessageRole as a string
    pub content: String,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Queryable, Identifiable, Serialize, Deserialize, Debug, Clone)]
#[diesel(table_name = user_preferences)]
pub struct UserPreference {
    pub id: i32,
    pub preference_key: String,
    pub preference_value: String,
}

#[derive(Serialize, Deserialize)]
pub enum LogLevel {
    Info,
    Warn,
    Error,
}

#[derive(Queryable, Identifiable, Serialize, Deserialize, Debug, Clone)]
#[diesel(table_name = application_logs)]
pub struct ApplicationLog {
    pub id: i32,
    pub log_level: String, // Storing LogLevel as a string
    pub message: String,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Queryable, Identifiable, Serialize, Deserialize, Debug, Clone)]
#[diesel(table_name = request_cache)]
pub struct RequestCache {
    pub id: i32,
    pub request_hash: String,
    pub response_body: String,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Queryable, Identifiable, Serialize, Deserialize, Debug, Clone)]
#[diesel(table_name = chat_templates)]
pub struct ChatTemplate {
    pub id: i32,
    pub template_name: String,
    pub template_content: String,
}

#[derive(Queryable, Identifiable, Serialize, Deserialize, Debug, Clone)]
#[diesel(table_name = conversation_contexts)]
pub struct ConversationContext {
    pub id: i32,
    pub context_name: String,
    pub context_data: String, // JSON blob
}

#[derive(Queryable, Identifiable, Serialize, Deserialize, Debug, Clone)]
#[diesel(table_name = folders)]
pub struct Folder {
    pub id: i32,
    pub folder_name: String,
    pub parent_id: Option<i32>,
}

// Placeholder structs needed by commands, assuming simple structure for now
#[derive(Serialize, Deserialize)]
pub struct PerformanceMetric {
    // Add fields as necessary
}

#[derive(Serialize, Deserialize)]
pub struct MetricType {
    // Add fields as necessary
}

#[derive(Serialize, Deserialize)]
pub struct PreferenceType {
    // Add fields as necessary
}
