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

// Gmail-related models for Gmail integration
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GmailAccount {
    pub id: String,
    pub email_address: String,
    pub display_name: Option<String>,
    pub profile_picture_url: Option<String>,
    pub access_token_encrypted: String,
    pub refresh_token_encrypted: Option<String>,
    pub token_expires_at: Option<String>,
    pub scopes: Vec<String>,
    pub is_active: bool,
    pub last_sync_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub user_id: String,
}

impl GmailAccount {
    pub fn new(
        id: String,
        email_address: String,
        display_name: Option<String>,
        access_token_encrypted: String,
        scopes: Vec<String>,
        user_id: String,
    ) -> Self {
        let now = chrono::Utc::now().to_rfc3339();
        Self {
            id,
            email_address,
            display_name,
            profile_picture_url: None,
            access_token_encrypted,
            refresh_token_encrypted: None,
            token_expires_at: None,
            scopes,
            is_active: true,
            last_sync_at: None,
            created_at: now.clone(),
            updated_at: now,
            user_id,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GmailLabel {
    pub id: String,
    pub account_id: String,
    pub name: String,
    pub message_list_visibility: String,
    pub label_list_visibility: String,
    pub label_type: String,
    pub messages_total: Option<i32>,
    pub messages_unread: Option<i32>,
    pub threads_total: Option<i32>,
    pub threads_unread: Option<i32>,
    pub color_text: Option<String>,
    pub color_background: Option<String>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

impl GmailLabel {
    pub fn new(
        id: String,
        account_id: String,
        name: String,
        message_list_visibility: String,
        label_list_visibility: String,
        label_type: String,
    ) -> Self {
        let now = Local::now().naive_local();
        Self {
            id,
            account_id,
            name,
            message_list_visibility,
            label_list_visibility,
            label_type,
            messages_total: Some(0),
            messages_unread: Some(0),
            threads_total: Some(0),
            threads_unread: Some(0),
            color_text: None,
            color_background: None,
            created_at: now,
            updated_at: now,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GmailThread {
    pub id: String,
    pub account_id: String,
    pub history_id: Option<String>,
    pub snippet: Option<String>,
    pub message_count: i32,
    pub is_read: bool,
    pub is_starred: bool,
    pub has_attachments: bool,
    pub participants: Vec<String>,
    pub subject: Option<String>,
    pub last_message_date: Option<NaiveDateTime>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

impl GmailThread {
    pub fn new(id: String, account_id: String) -> Self {
        let now = Local::now().naive_local();
        Self {
            id,
            account_id,
            history_id: None,
            snippet: None,
            message_count: 0,
            is_read: false,
            is_starred: false,
            has_attachments: false,
            participants: Vec::new(),
            subject: None,
            last_message_date: None,
            created_at: now,
            updated_at: now,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GmailMessage {
    pub id: String,
    pub thread_id: String,
    pub account_id: String,
    pub history_id: Option<String>,
    pub internal_date: Option<NaiveDateTime>,
    pub size_estimate: Option<i32>,
    pub snippet: Option<String>,
    pub is_read: bool,
    pub is_starred: bool,
    pub is_important: bool,
    pub from_email: String,
    pub from_name: Option<String>,
    pub to_emails: Vec<String>,
    pub cc_emails: Vec<String>,
    pub bcc_emails: Vec<String>,
    pub subject: Option<String>,
    pub date_header: Option<NaiveDateTime>,
    pub message_id_header: Option<String>,
    pub reply_to: Option<String>,
    pub body_text: Option<String>,
    pub body_html: Option<String>,
    pub raw_headers: serde_json::Value,
    pub has_attachments: bool,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

impl GmailMessage {
    pub fn new(
        id: String,
        thread_id: String,
        account_id: String,
        from_email: String,
    ) -> Self {
        let now = Local::now().naive_local();
        Self {
            id,
            thread_id,
            account_id,
            history_id: None,
            internal_date: None,
            size_estimate: None,
            snippet: None,
            is_read: false,
            is_starred: false,
            is_important: false,
            from_email,
            from_name: None,
            to_emails: Vec::new(),
            cc_emails: Vec::new(),
            bcc_emails: Vec::new(),
            subject: None,
            date_header: None,
            message_id_header: None,
            reply_to: None,
            body_text: None,
            body_html: None,
            raw_headers: serde_json::Value::Object(serde_json::Map::new()),
            has_attachments: false,
            created_at: now,
            updated_at: now,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GmailAttachment {
    pub id: String,
    pub message_id: String,
    pub account_id: String,
    pub attachment_id: String,
    pub filename: String,
    pub mime_type: String,
    pub size_bytes: i64,
    pub is_downloaded: bool,
    pub local_path: Option<String>,
    pub download_date: Option<NaiveDateTime>,
    pub created_at: NaiveDateTime,
}

impl GmailAttachment {
    pub fn new(
        id: String,
        message_id: String,
        account_id: String,
        attachment_id: String,
        filename: String,
        mime_type: String,
        size_bytes: i64,
    ) -> Self {
        let now = Local::now().naive_local();
        Self {
            id,
            message_id,
            account_id,
            attachment_id,
            filename,
            mime_type,
            size_bytes,
            is_downloaded: false,
            local_path: None,
            download_date: None,
            created_at: now,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GmailSyncState {
    pub id: String,
    pub account_id: String,
    pub sync_type: String,
    pub last_sync_at: NaiveDateTime,
    pub last_history_id: Option<String>,
    pub next_page_token: Option<String>,
    pub sync_status: String,
    pub error_message: Option<String>,
    pub messages_synced: Option<i32>,
    pub total_messages: Option<i32>,
    pub started_at: Option<NaiveDateTime>,
    pub completed_at: Option<NaiveDateTime>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

impl GmailSyncState {
    pub fn new(
        id: String,
        account_id: String,
        sync_type: String,
        sync_status: String,
    ) -> Self {
        let now = Local::now().naive_local();
        Self {
            id,
            account_id,
            sync_type,
            last_sync_at: now,
            last_history_id: None,
            next_page_token: None,
            sync_status,
            error_message: None,
            messages_synced: Some(0),
            total_messages: Some(0),
            started_at: None,
            completed_at: None,
            created_at: now,
            updated_at: now,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GmailDraft {
    pub id: String,
    pub message_id: Option<String>,
    pub account_id: String,
    pub to_emails: Vec<String>,
    pub cc_emails: Vec<String>,
    pub bcc_emails: Vec<String>,
    pub subject: Option<String>,
    pub body_text: Option<String>,
    pub body_html: Option<String>,
    pub attachments: serde_json::Value,
    pub is_reply: bool,
    pub reply_to_message_id: Option<String>,
    pub thread_id: Option<String>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

impl GmailDraft {
    pub fn new(
        id: String,
        account_id: String,
        to_emails: Vec<String>,
    ) -> Self {
        let now = Local::now().naive_local();
        Self {
            id,
            message_id: None,
            account_id,
            to_emails,
            cc_emails: Vec::new(),
            bcc_emails: Vec::new(),
            subject: None,
            body_text: None,
            body_html: None,
            attachments: serde_json::Value::Array(Vec::new()),
            is_reply: false,
            reply_to_message_id: None,
            thread_id: None,
            created_at: now,
            updated_at: now,
        }
    }
}
