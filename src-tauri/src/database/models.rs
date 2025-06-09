// src-tauri/src/database/models.rs

use serde::{Serialize, Deserialize};
use chrono::{NaiveDateTime, Local};

#[derive(Serialize, Deserialize, Debug, Clone)]
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

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ChatMessage {
    pub id: i32,
    pub session_id: i32,
    pub role: String, // Storing MessageRole as a string
    pub content: String,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct UserPreference {
    pub id: i32,
    pub preference_key: String,
    pub preference_value: String,
    pub preference_type_name: String,
}

impl UserPreference {
    pub fn new(key: String, value: String, ptype: PreferenceType) -> Self {
        Self {
            id: 0, // Placeholder
            preference_key: key,
            preference_value: value,
            preference_type_name: ptype.as_str().to_string(),
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum LogLevel {
    Info,
    Warn,
    Error,
}

impl ToString for LogLevel {
    fn to_string(&self) -> String {
        match self {
            LogLevel::Info => "Info".to_string(),
            LogLevel::Warn => "Warn".to_string(),
            LogLevel::Error => "Error".to_string(),
        }
    }
}

impl From<String> for LogLevel {
    fn from(s: String) -> Self {
        match s.to_lowercase().as_str() {
            "info" => LogLevel::Info,
            "warn" => LogLevel::Warn,
            "error" => LogLevel::Error,
            _ => LogLevel::Info, // Default
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ApplicationLog {
    pub id: i32,
    pub log_level: String, // Storing LogLevel as a string
    pub message: String,
    pub created_at: chrono::NaiveDateTime,
}

impl ApplicationLog {
    pub fn new(log_level_enum: LogLevel, message: String, details: Option<String>) -> Self {
        Self {
            id: 0, // Placeholder
            log_level: log_level_enum.to_string(),
            message: details.map_or(message.clone(), |d| format!("{} Details: {}", message, d)),
            created_at: Local::now().naive_local(),
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RequestCache {
    pub id: i32,
    pub request_hash: String,
    pub response_body: String,
    pub created_at: chrono::NaiveDateTime,
}

impl RequestCache {
    pub fn new(request_hash: String, response_body: String) -> Self {
        Self {
            id: 0, // Placeholder
            request_hash,
            response_body,
            created_at: Local::now().naive_local(),
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ChatTemplate {
    pub id: i32,
    pub template_name: String,
    pub template_content: String,
}

impl ChatTemplate {
    pub fn new(name: String, description: String, system_message: String) -> Self {
        // Combining description and system_message into template_content, perhaps as JSON or a formatted string.
        // For simplicity, let's use a formatted string.
        let content = format!(r#"{{"description": "{}", "system_message": "{}"}}"#, description, system_message);
        Self {
            id: 0, // Placeholder
            template_name: name,
            template_content: content,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ConversationContext {
    pub id: i32,
    pub context_name: String,
    pub context_data: String, // JSON blob
    pub context_window_size: i32,
    pub context_summary: Option<String>,
}

impl ConversationContext {
    // Assuming session_id from the call maps to context_name
    pub fn new(context_name: String, context_window_size: i32) -> Self {
        Self {
            id: 0, // Placeholder
            context_name,
            context_data: "{}".to_string(), // Default empty JSON
            context_window_size,
            context_summary: None,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Folder {
    pub id: i32,
    pub folder_name: String,
    pub parent_id: Option<i32>,
    pub user_id: String,
    pub color: Option<String>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

impl Folder {
    pub fn new(name: String, parent_id: Option<i32>, user_id: String, color: Option<String>) -> Self {
        let now = Local::now().naive_local();
        Self {
            id: 0, // Placeholder
            folder_name: name,
            parent_id,
            user_id,
            color,
            created_at: now,
            updated_at: now,
        }
    }
}

// Agent-related models
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Agent {
    pub id: i32,
    pub name: String,
    pub description: String,
    pub system_prompt: String,
    pub capabilities: Vec<String>,
    pub parameters: serde_json::Value,
    pub is_active: bool,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AgentExecution {
    pub id: i32,
    pub agent_id: i32,
    pub session_id: Option<i32>,
    pub input: String,
    pub output: String,
    pub status: String,
    pub error_message: Option<String>,
    pub executed_at: NaiveDateTime,
}

// Notes model
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Note {
    pub id: i32,
    pub title: String,
    pub content: String,
    pub user_id: String,
    pub tags: Vec<String>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

// MCP Server model
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct McpServer {
    pub id: i32,
    pub name: String,
    pub url: String,
    pub api_key: Option<String>,
    pub configuration: serde_json::Value,
    pub is_active: bool,
    pub user_id: String,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

// N8N Connection model
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct N8nConnection {
    pub id: i32,
    pub name: String,
    pub webhook_url: String,
    pub api_key: Option<String>,
    pub workflow_id: String,
    pub is_active: bool,
    pub user_id: String,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

// Performance and metrics models
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PerformanceMetric {
    pub metric_type: MetricType,
    pub value: f64,
    pub timestamp: NaiveDateTime,
    pub metadata: Option<String>,
}

impl PerformanceMetric {
    pub fn new(metric_type: MetricType, value: f64, timestamp: NaiveDateTime, metadata: Option<String>) -> Self {
        Self {
            metric_type,
            value,
            timestamp,
            metadata,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum MetricType {
    ResponseTime,
    TokenCount,
    CpuUsage,
    Placeholder,
}

impl From<String> for MetricType {
    fn from(s: String) -> Self {
        match s.to_lowercase().as_str() {
            "responsetime" | "response_time" => MetricType::ResponseTime,
            "tokencount" | "token_count" => MetricType::TokenCount,
            "cpuusage" | "cpu_usage" => MetricType::CpuUsage,
            _ => MetricType::Placeholder,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum PreferenceType {
    String,
    Boolean,
    Number,
}

impl PreferenceType {
    pub fn as_str(&self) -> &'static str {
        match self {
            PreferenceType::String => "String",
            PreferenceType::Boolean => "Boolean",
            PreferenceType::Number => "Number",
        }
    }
}

impl From<String> for PreferenceType {
    fn from(s: String) -> Self {
        match s.to_lowercase().as_str() {
            "string" => PreferenceType::String,
            "boolean" => PreferenceType::Boolean,
            "number" => PreferenceType::Number,
            _ => PreferenceType::String, // Default
        }
    }
}
