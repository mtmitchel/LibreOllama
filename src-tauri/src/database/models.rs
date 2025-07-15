//! Database Models
//!
//! This module contains the database models for the LibreOllama application.
//! Some unused constructors have been removed to clean up warnings.

use chrono::NaiveDateTime;
use rusqlite::Row;
use serde::{Deserialize, Serialize};

// =============================================================================
// Enums
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PreferenceType {
    String,
    Integer,
    Float,
    Boolean,
    Json,
}

impl PreferenceType {
    pub fn from_string(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "string" => PreferenceType::String,
            "integer" => PreferenceType::Integer,
            "float" => PreferenceType::Float,
            "boolean" => PreferenceType::Boolean,
            "json" => PreferenceType::Json,
            _ => PreferenceType::String, // Default
        }
    }
    
    pub fn as_str(&self) -> &str {
        match self {
            PreferenceType::String => "string",
            PreferenceType::Integer => "integer",
            PreferenceType::Float => "float",
            PreferenceType::Boolean => "boolean",
            PreferenceType::Json => "json",
        }
    }
}

impl std::fmt::Display for PreferenceType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.as_str())
    }
}

impl From<String> for PreferenceType {
    fn from(s: String) -> Self {
        Self::from_string(&s)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LogLevel {
    Error,
    Warn,
    Info,
    Debug,
    Trace,
}

impl LogLevel {
    pub fn from_string(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "error" => LogLevel::Error,
            "warn" => LogLevel::Warn,
            "info" => LogLevel::Info,
            "debug" => LogLevel::Debug,
            "trace" => LogLevel::Trace,
            _ => LogLevel::Info, // Default
        }
    }
    
    pub fn as_str(&self) -> &str {
        match self {
            LogLevel::Error => "error",
            LogLevel::Warn => "warn",
            LogLevel::Info => "info",
            LogLevel::Debug => "debug",
            LogLevel::Trace => "trace",
        }
    }
}

impl std::fmt::Display for LogLevel {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.as_str())
    }
}

impl From<String> for LogLevel {
    fn from(s: String) -> Self {
        Self::from_string(&s)
    }
}

impl rusqlite::types::FromSql for LogLevel {
    fn column_result(value: rusqlite::types::ValueRef<'_>) -> rusqlite::types::FromSqlResult<Self> {
        let s = String::column_result(value)?;
        Ok(LogLevel::from_string(&s))
    }
}

impl rusqlite::types::ToSql for LogLevel {
    fn to_sql(&self) -> rusqlite::Result<rusqlite::types::ToSqlOutput<'_>> {
        Ok(rusqlite::types::ToSqlOutput::from(self.as_str()))
    }
}

// =============================================================================
// Core Models
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserPreference {
    pub id: i32,
    pub preference_key: String,
    pub preference_value: String,
    pub preference_type_name: String,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

impl UserPreference {
    // Note: Removed unused new() constructor to clean up warnings
}

impl From<&Row<'_>> for UserPreference {
    fn from(row: &Row) -> Self {
        UserPreference {
            id: row.get(0).unwrap_or(0),
            preference_key: row.get(1).unwrap_or_default(),
            preference_value: row.get(2).unwrap_or_default(),
            preference_type_name: row.get(3).unwrap_or_default(),
            created_at: row.get(4).unwrap_or_else(|_| chrono::Local::now().naive_local()),
            updated_at: row.get(5).unwrap_or_else(|_| chrono::Local::now().naive_local()),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApplicationLog {
    pub id: i32,
    pub log_level: LogLevel,
    pub message: String,
    pub module_name: String,
    pub function_name: String,
    pub line_number: Option<i32>,
    pub user_id: Option<String>,
    pub session_id: Option<String>,
    pub request_id: Option<String>,
    pub timestamp: NaiveDateTime,
    pub created_at: NaiveDateTime,
}

impl ApplicationLog {
    // Note: Removed unused new() constructor to clean up warnings
}

impl From<&Row<'_>> for ApplicationLog {
    fn from(row: &Row) -> Self {
        ApplicationLog {
            id: row.get(0).unwrap_or(0),
            log_level: LogLevel::from_string(&row.get::<_, String>(1).unwrap_or_default()),
            message: row.get(2).unwrap_or_default(),
            module_name: row.get(3).unwrap_or_default(),
            function_name: row.get(4).unwrap_or_default(),
            line_number: row.get(5).ok(),
            user_id: row.get(6).ok(),
            session_id: row.get(7).ok(),
            request_id: row.get(8).ok(),
            timestamp: row.get(9).unwrap_or_else(|_| chrono::Local::now().naive_local()),
            created_at: row.get(10).unwrap_or_else(|_| chrono::Local::now().naive_local()),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RequestCache {
    pub id: i32,
    pub request_hash: String,
    pub response_body: String,
    pub expires_at: Option<NaiveDateTime>,
    pub created_at: NaiveDateTime,
}

impl RequestCache {
    // Note: Removed unused new() constructor to clean up warnings
}

impl From<&Row<'_>> for RequestCache {
    fn from(row: &Row) -> Self {
        RequestCache {
            id: row.get(0).unwrap_or(0),
            request_hash: row.get(1).unwrap_or_default(),
            response_body: row.get(2).unwrap_or_default(),
            expires_at: row.get(3).ok(),
            created_at: row.get(4).unwrap_or_else(|_| chrono::Local::now().naive_local()),
        }
    }
}

// =============================================================================
// Agent Models
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Agent {
    pub id: i32,
    pub name: String,
    pub description: String,
    pub model_name: String,
    pub system_prompt: String,
    pub temperature: f64,
    pub max_tokens: i32,
    pub is_active: bool,
    pub capabilities: Vec<String>,
    pub parameters: serde_json::Value,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
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

impl From<&Row<'_>> for AgentExecution {
    fn from(row: &Row) -> Self {
        AgentExecution {
            id: row.get(0).unwrap_or(0),
            agent_id: row.get(1).unwrap_or(0),
            session_id: row.get(2).ok(),
            input: row.get(3).unwrap_or_default(),
            output: row.get(4).unwrap_or_default(),
            status: row.get(5).unwrap_or_default(),
            error_message: row.get(6).ok(),
            executed_at: row.get(7).unwrap_or_else(|_| chrono::Local::now().naive_local()),
        }
    }
}

impl From<&Row<'_>> for Agent {
    fn from(row: &Row) -> Self {
        Agent {
            id: row.get(0).unwrap_or(0),
            name: row.get(1).unwrap_or_default(),
            description: row.get(2).unwrap_or_default(),
            model_name: row.get(3).unwrap_or_default(),
            system_prompt: row.get(4).unwrap_or_default(),
            temperature: row.get(5).unwrap_or(0.7),
            max_tokens: row.get(6).unwrap_or(2048),
            is_active: row.get(7).unwrap_or(true),
            capabilities: serde_json::from_str(&row.get::<_, String>(8).unwrap_or_default()).unwrap_or_default(),
            parameters: serde_json::from_str(&row.get::<_, String>(9).unwrap_or_default()).unwrap_or(serde_json::json!({})),
            created_at: row.get(10).unwrap_or_else(|_| chrono::Local::now().naive_local()),
            updated_at: row.get(11).unwrap_or_else(|_| chrono::Local::now().naive_local()),
        }
    }
}

// =============================================================================
// Chat Models
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatSession {
    pub id: i32,
    pub title: String,
    pub session_name: String,
    pub user_id: String,
    pub agent_id: i32,
    pub context_length: i32,
    pub is_active: bool,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

impl From<&Row<'_>> for ChatSession {
    fn from(row: &Row) -> Self {
        ChatSession {
            id: row.get(0).unwrap_or(0),
            title: row.get(1).unwrap_or_default(),
            session_name: row.get(2).unwrap_or_default(),
            user_id: row.get(3).unwrap_or_default(),
            agent_id: row.get(4).unwrap_or(0),
            context_length: row.get(5).unwrap_or(4096),
            is_active: row.get(6).unwrap_or(true),
            created_at: row.get(7).unwrap_or_else(|_| chrono::Local::now().naive_local()),
            updated_at: row.get(8).unwrap_or_else(|_| chrono::Local::now().naive_local()),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub id: i32,
    pub session_id: i32,
    pub role: String,
    pub content: String,
    pub token_count: i32,
    pub created_at: NaiveDateTime,
}

impl From<&Row<'_>> for ChatMessage {
    fn from(row: &Row) -> Self {
        ChatMessage {
            id: row.get(0).unwrap_or(0),
            session_id: row.get(1).unwrap_or(0),
            role: row.get(2).unwrap_or_default(),
            content: row.get(3).unwrap_or_default(),
            token_count: row.get(4).unwrap_or(0),
            created_at: row.get(5).unwrap_or_else(|_| chrono::Local::now().naive_local()),
        }
    }
}

// =============================================================================
// Additional Models
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Note {
    pub id: i32,
    pub title: String,
    pub content: String,
    pub folder_id: Option<i32>,
    pub user_id: String,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

impl From<&Row<'_>> for Note {
    fn from(row: &Row) -> Self {
        Note {
            id: row.get(0).unwrap_or(0),
            title: row.get(1).unwrap_or_default(),
            content: row.get(2).unwrap_or_default(),
            folder_id: row.get(3).ok(),
            user_id: row.get(4).unwrap_or_default(),
            created_at: row.get(5).unwrap_or_else(|_| chrono::Local::now().naive_local()),
            updated_at: row.get(6).unwrap_or_else(|_| chrono::Local::now().naive_local()),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Folder {
    pub id: i32,
    pub name: String,
    pub parent_id: Option<i32>,
    pub user_id: String,
    pub color: Option<String>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

impl Folder {
    // Note: Removed unused new() constructor to clean up warnings
}

impl From<&Row<'_>> for Folder {
    fn from(row: &Row) -> Self {
        Folder {
            id: row.get(0).unwrap_or(0),
            name: row.get(1).unwrap_or_default(),
            parent_id: row.get(2).ok(),
            user_id: row.get(3).unwrap_or_default(),
            color: row.get(4).ok(),
            created_at: row.get(5).unwrap_or_else(|_| chrono::Local::now().naive_local()),
            updated_at: row.get(6).unwrap_or_else(|_| chrono::Local::now().naive_local()),
        }
    }
}

// =============================================================================
// Additional structures (kept for compatibility)
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MetricType {
    ResponseTime,
    DatabaseQuery,
    ApiCall,
    Memory,
    CPU,
    TokenCount,
    CpuUsage,
    Throughput,
    ErrorRate,
    MemoryUsage,
    Placeholder,
    Custom(String),
}

impl From<String> for MetricType {
    fn from(s: String) -> Self {
        match s.to_lowercase().as_str() {
            "response_time" => MetricType::ResponseTime,
            "database_query" => MetricType::DatabaseQuery,
            "api_call" => MetricType::ApiCall,
            "memory" => MetricType::Memory,
            "cpu" => MetricType::CPU,
            "token_count" => MetricType::TokenCount,
            "cpu_usage" => MetricType::CpuUsage,
            "throughput" => MetricType::Throughput,
            "error_rate" => MetricType::ErrorRate,
            "memory_usage" => MetricType::MemoryUsage,
            "placeholder" => MetricType::Placeholder,
            _ => MetricType::Custom(s),
        }
    }
}

impl std::fmt::Display for MetricType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let s = match self {
            MetricType::ResponseTime => "response_time",
            MetricType::DatabaseQuery => "database_query",
            MetricType::ApiCall => "api_call",
            MetricType::Memory => "memory",
            MetricType::CPU => "cpu",
            MetricType::TokenCount => "token_count",
            MetricType::CpuUsage => "cpu_usage",
            MetricType::Throughput => "throughput",
            MetricType::ErrorRate => "error_rate",
            MetricType::MemoryUsage => "memory_usage",
            MetricType::Placeholder => "placeholder",
            MetricType::Custom(s) => s,
        };
        write!(f, "{}", s)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceMetric {
    pub id: i32,
    pub metric_type: MetricType,
    pub value: f64,
    pub timestamp: NaiveDateTime,
    pub metadata: Option<String>,
    pub created_at: NaiveDateTime,
}

impl PerformanceMetric {
    pub fn new(metric_type: MetricType, value: f64, timestamp: NaiveDateTime, metadata: Option<String>) -> Self {
        PerformanceMetric {
            id: 0,
            metric_type,
            value,
            timestamp,
            metadata,
            created_at: chrono::Local::now().naive_local(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversationContext {
    pub id: i32,
    pub context_name: String,
    pub description: String,
    pub context_data: serde_json::Value,
    pub context_window_size: i32,
    pub context_summary: Option<String>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

impl ConversationContext {
    pub fn new(context_name: String, context_window_size: i32) -> Self {
        ConversationContext {
            id: 0,
            context_name,
            description: String::new(),
            context_data: serde_json::json!({}),
            context_window_size,
            context_summary: None,
            created_at: chrono::Local::now().naive_local(),
            updated_at: chrono::Local::now().naive_local(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatTemplate {
    pub id: i32,
    pub name: String,
    pub template_name: String,
    pub template_content: String,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

impl ChatTemplate {
    pub fn new(name: String, _description: String, template_content: String) -> Self {
        let now = chrono::Local::now().naive_local();
        ChatTemplate {
            id: 0, // Default value, will be set by the database
            name: name.clone(),
            template_name: name.to_lowercase().replace(' ', "_"),
            template_content,
            created_at: now,
            updated_at: now,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
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

#[derive(Debug, Clone, Serialize, Deserialize)]
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

// =============================================================================
// Project Models
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: i32,
    pub name: String,
    pub description: String,
    pub color: String,
    pub status: String, // 'active', 'completed', 'archived', 'on-hold'
    pub progress: i32,  // 0-100
    pub priority: String, // 'high', 'medium', 'low'
    pub user_id: String,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

// Removed unused Project::new constructor - use database operations instead

impl From<&Row<'_>> for Project {
    fn from(row: &Row) -> Self {
        Self {
            id: row.get("id").unwrap(),
            name: row.get("name").unwrap(),
            description: row.get("description").unwrap(),
            color: row.get("color").unwrap(),
            status: row.get("status").unwrap(),
            progress: row.get("progress").unwrap(),
            priority: row.get("priority").unwrap(),
            user_id: row.get("user_id").unwrap(),
            created_at: row.get("created_at").unwrap(),
            updated_at: row.get("updated_at").unwrap(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectGoal {
    pub id: i32,
    pub project_id: i32,
    pub title: String,
    pub completed: bool,
    pub priority: String, // 'high', 'medium', 'low'
    pub due_date: Option<NaiveDateTime>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

// Removed unused ProjectGoal::new constructor - use database operations instead

impl From<&Row<'_>> for ProjectGoal {
    fn from(row: &Row) -> Self {
        Self {
            id: row.get("id").unwrap(),
            project_id: row.get("project_id").unwrap(),
            title: row.get("title").unwrap(),
            completed: row.get("completed").unwrap(),
            priority: row.get("priority").unwrap(),
            due_date: row.get("due_date").ok(),
            created_at: row.get("created_at").unwrap(),
            updated_at: row.get("updated_at").unwrap(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectAsset {
    pub id: i32,
    pub project_id: i32,
    pub name: String,
    pub asset_type: String, // 'file', 'image', 'document', 'link', 'note', 'chat'
    pub url: String,
    pub size: Option<i64>,
    pub metadata: Option<String>, // JSON string for additional data
    pub uploaded_by: String,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

// Removed unused ProjectAsset::new constructor - use database operations instead

impl From<&Row<'_>> for ProjectAsset {
    fn from(row: &Row) -> Self {
        Self {
            id: row.get("id").unwrap(),
            project_id: row.get("project_id").unwrap(),
            name: row.get("name").unwrap(),
            asset_type: row.get("asset_type").unwrap(),
            url: row.get("url").unwrap(),
            size: row.get("size").ok(),
            metadata: row.get("metadata").ok(),
            uploaded_by: row.get("uploaded_by").unwrap(),
            created_at: row.get("created_at").unwrap(),
            updated_at: row.get("updated_at").unwrap(),
        }
    }
}
