//! Advanced features commands for Phase 3.3
//!
//! This module contains Tauri commands for context management,
//! chat templates, performance metrics, and other advanced features.

use serde::{Deserialize, Serialize};
use crate::database::{ConversationContext, ChatTemplate, UserPreference, ApplicationLog, PerformanceMetric, MetricType, RequestCache, PreferenceType, LogLevel};
use sha2::{Sha256, Digest};

// ===== Context Management Commands =====

#[tauri::command]
pub async fn get_conversation_context(session_id: String) -> Result<Option<ConversationContext>, String> {
    operations_v4::get_conversation_context(&session_id)
        .await
        .map_err(|e| format!("Failed to get conversation context: {}", e))
}

#[tauri::command]
pub async fn update_conversation_context(
    session_id: String,
    context_window_size: Option<i32>,
    context_summary: Option<String>,
    token_count: i32,
) -> Result<ConversationContext, String> {
    // Get existing context or create new one
    let mut context = operations_v4::get_conversation_context(&session_id)
        .await
        .map_err(|e| format!("Failed to get context: {}", e))?
        .unwrap_or_else(|| ConversationContext::new(session_id, context_window_size));

    // Update context
    context.update_context(token_count, context_summary);

    // Save to database
    if operations_v4::get_conversation_context(&context.session_id)
        .await
        .map_err(|e| format!("Failed to check context: {}", e))?
        .is_some()
    {
        operations_v4::update_conversation_context(&context)
            .await
            .map_err(|e| format!("Failed to update context: {}", e))?;
    } else {
        operations_v4::create_conversation_context(&context)
            .await
            .map_err(|e| format!("Failed to create context: {}", e))?;
    }

    Ok(context)
}

// ===== Chat Template Commands =====

#[tauri::command]
pub async fn get_chat_templates(active_only: Option<bool>) -> Result<Vec<ChatTemplate>, String> {
    operations_v4::get_chat_templates(active_only.unwrap_or(true))
        .await
        .map_err(|e| format!("Failed to get chat templates: {}", e))
}

#[tauri::command]
pub async fn get_chat_template(template_id: String) -> Result<Option<ChatTemplate>, String> {
    operations_v4::get_chat_template_by_id(&template_id)
        .await
        .map_err(|e| format!("Failed to get chat template: {}", e))
}

#[tauri::command]
pub async fn create_chat_template(
    name: String,
    description: Option<String>,
    system_message: Option<String>,
    initial_prompts: Option<String>,
    model_config: Option<String>,
    is_default: Option<bool>,
) -> Result<ChatTemplate, String> {
    let mut template = ChatTemplate::new(name, description, system_message);
    template.initial_prompts = initial_prompts;
    template.model_config = model_config;
    template.is_default = is_default.unwrap_or(false);

    operations_v4::create_chat_template(&template)
        .await
        .map_err(|e| format!("Failed to create chat template: {}", e))?;

    Ok(template)
}

#[tauri::command]
pub async fn update_chat_template(
    template_id: String,
    name: Option<String>,
    description: Option<String>,
    system_message: Option<String>,
    initial_prompts: Option<String>,
    model_config: Option<String>,
    is_default: Option<bool>,
    is_active: Option<bool>,
) -> Result<ChatTemplate, String> {
    let mut template = operations_v4::get_chat_template_by_id(&template_id)
        .await
        .map_err(|e| format!("Failed to get template: {}", e))?
        .ok_or("Template not found")?;

    // Update fields if provided
    if let Some(n) = name { template.name = n; }
    if let Some(d) = description { template.description = Some(d); }
    if let Some(sm) = system_message { template.system_message = Some(sm); }
    if let Some(ip) = initial_prompts { template.initial_prompts = Some(ip); }
    if let Some(mc) = model_config { template.model_config = Some(mc); }
    if let Some(id) = is_default { template.is_default = id; }
    if let Some(ia) = is_active { template.is_active = ia; }

    operations_v4::update_chat_template(&template)
        .await
        .map_err(|e| format!("Failed to update chat template: {}", e))?;

    Ok(template)
}

#[tauri::command]
pub async fn increment_template_usage(template_id: String) -> Result<(), String> {
    let mut template = operations_v4::get_chat_template_by_id(&template_id)
        .await
        .map_err(|e| format!("Failed to get template: {}", e))?
        .ok_or("Template not found")?;

    template.increment_usage();
    
    operations_v4::update_chat_template(&template)
        .await
        .map_err(|e| format!("Failed to update template usage: {}", e))?;

    Ok(())
}

// ===== Performance Metrics Commands =====

#[tauri::command]
pub async fn record_performance_metric(
    metric_type: String,
    value: f64,
    component: Option<String>,
    operation: Option<String>,
    tags: Option<String>, // JSON string for tags
) -> Result<(), String> {
    let metric = PerformanceMetric::new(
        MetricType::from(metric_type),
        value,
        component,
        operation,
        tags.map(|t| serde_json::from_str(&t).unwrap_or_default()),
    );
    operations_v4::create_performance_metric(&metric)
        .await
        .map_err(|e| format!("Failed to record performance metric: {}", e))
}

#[tauri::command]
pub async fn get_performance_metrics(
    metric_type: Option<String>,
    component: Option<String>,
    operation: Option<String>,
    start_time: Option<String>, // ISO 8601
    end_time: Option<String>,   // ISO 8601
    limit: Option<i32>,
) -> Result<Vec<PerformanceMetric>, String> {
    operations_v4::get_performance_metrics(
        metric_type.map(MetricType::from),
        component,
        operation,
        start_time,
        end_time,
        limit.unwrap_or(100),
    )
    .await
    .map_err(|e| format!("Failed to get performance metrics: {}", e))
}

// ===== Cache Management Commands =====

#[tauri::command]
pub async fn cache_request(
    key: String,
    value: String, // JSON string
    ttl_seconds: Option<i64>,
) -> Result<(), String> {
    let cache = RequestCache::new(
        key,
        value,
        ttl_seconds,
    );
    operations_v4::create_request_cache(&cache)
        .await
        .map_err(|e| format!("Failed to cache request: {}", e))
}

#[tauri::command]
pub async fn get_cached_request(key: String) -> Result<Option<RequestCache>, String> {
    operations_v4::get_request_cache(&key)
        .await
        .map_err(|e| format!("Failed to get cached request: {}", e))
}

#[tauri::command]
pub async fn clear_request_cache(prefix: Option<String>) -> Result<(), String> {
    operations_v4::clear_request_cache(prefix)
        .await
        .map_err(|e| format!("Failed to clear request cache: {}", e))
}

// ===== User Preference Commands =====

#[tauri::command]
pub async fn get_user_preference(key: String) -> Result<Option<UserPreference>, String> {
    operations_v4::get_user_preference(&key)
        .await
        .map_err(|e| format!("Failed to get user preference: {}", e))
}

#[tauri::command]
pub async fn set_user_preference(
    key: String,
    value: String, // JSON string
    preference_type: Option<String>, // "string", "number", "boolean", "json"
    is_system_preference: Option<bool>,
) -> Result<(), String> {
    let pref = UserPreference::new(
        key,
        value,
        preference_type.map(PreferenceType::from).unwrap_or(PreferenceType::String),
        is_system_preference.unwrap_or(false),
    );
    operations_v4::set_user_preference(&pref)
        .await
        .map_err(|e| format!("Failed to set user preference: {}", e))
}

#[tauri::command]
pub async fn get_all_user_preferences(system_only: Option<bool>) -> Result<Vec<UserPreference>, String> {
    operations_v4::get_all_user_preferences(system_only.unwrap_or(false))
        .await
        .map_err(|e| format!("Failed to get all user preferences: {}", e))
}

// ===== Application Logging Commands =====

#[tauri::command]
pub async fn log_application_event(
    level: String, // "info", "warn", "error", "debug"
    message: String,
    component: Option<String>,
    context: Option<String>, // JSON string
) -> Result<(), String> {
    let log = ApplicationLog::new(
        LogLevel::from(level),
        message,
        component,
        context,
    );
    operations_v4::create_application_log(&log)
        .await
        .map_err(|e| format!("Failed to log application event: {}", e))
}

#[tauri::command]
pub async fn get_application_logs(
    level: Option<String>,
    component: Option<String>,
    start_time: Option<String>, // ISO 8601
    end_time: Option<String>,   // ISO 8601
    limit: Option<i32>,
) -> Result<Vec<ApplicationLog>, String> {
    let log_level = level.map(LogLevel::from);
    operations_v4::get_application_logs(
        log_level,
        component,
        start_time,
        end_time,
        limit.unwrap_or(100),
    )
    .await
    .map_err(|e| format!("Failed to get application logs: {}", e))
}

// ===== Chat Export/Import Commands =====

#[derive(Serialize, Deserialize)]
pub struct ChatExport {
    pub session: database::models::ChatSession,
    pub messages: Vec<database::models::ChatMessage>,
    pub context: Option<ConversationContext>,
    pub export_timestamp: chrono::DateTime<chrono::Utc>,
    pub export_version: String,
}

#[tauri::command]
pub async fn export_chat_session(session_id: String) -> Result<ChatExport, String> {
    // Get session
    let session = database::operations::get_chat_session_by_id(&session_id)
        .map_err(|e| format!("Failed to get session: {}", e))?
        .ok_or("Session not found")?;

    // Get messages
    let messages = database::operations::get_session_messages(&session_id)
        .map_err(|e| format!("Failed to get messages: {}", e))?;

    // Get context if available
    let context = operations_v4::get_conversation_context(&session_id)
        .map_err(|e| format!("Failed to get context: {}", e))?;

    Ok(ChatExport {
        session,
        messages,
        context,
        export_timestamp: chrono::Utc::now(),
        export_version: "3.3.0".to_string(),
    })
}

#[tauri::command]
pub async fn export_chat_session_markdown(session_id: String) -> Result<String, String> {
    let export = export_chat_session(session_id).await?;
    
    let mut markdown = format!("# {}\n\n", export.session.title);
    markdown.push_str(&format!("**Created:** {}\n", export.session.created_at.format("%Y-%m-%d %H:%M:%S")));
    markdown.push_str(&format!("**Updated:** {}\n", export.session.updated_at.format("%Y-%m-%d %H:%M:%S")));
    
    if let Some(context) = &export.context {
        markdown.push_str(&format!("**Context Window:** {} tokens\n", context.context_window_size));
        if let Some(summary) = &context.context_summary {
            markdown.push_str(&format!("**Context Summary:** {}\n", summary));
        }
    }
    
    markdown.push_str("\n---\n\n");
    
    for message in &export.messages {
        let role_icon = match message.role.as_str() {
            "user" => "🧑",
            "assistant" => "🤖",
            "system" => "⚙️",
            _ => "❓",
        };
        
        markdown.push_str(&format!("## {} {}\n\n", role_icon, message.role.to_uppercase()));
        markdown.push_str(&format!("{}\n\n", message.content));
        markdown.push_str(&format!("*{} UTC*\n\n", message.created_at.format("%Y-%m-%d %H:%M:%S")));
        markdown.push_str("---\n\n");
    }
    
    markdown.push_str(&format!("\n*Exported on {} UTC*\n", export.export_timestamp.format("%Y-%m-%d %H:%M:%S")));
    
    Ok(markdown)
}

// ===== System Health Commands =====

#[tauri::command]
pub async fn get_system_health() -> Result<serde_json::Value, String> {
    let db_stats = database::schema::get_database_stats(&database::connection::get_connection()
        .map_err(|e| format!("Failed to get connection: {}", e))?)
        .map_err(|e| format!("Failed to get database stats: {}", e))?;

    let cache_count = database::connection::get_connection()
        .map_err(|e| format!("Failed to get connection: {}", e))?
        .prepare("SELECT COUNT(*) FROM request_cache")
        .and_then(|mut stmt| stmt.query_row([], |row| row.get::<_, i32>(0)))
        .unwrap_or(0);

    let health = serde_json::json!({
        "database": {
            "active_sessions": db_stats.active_sessions,
            "total_messages": db_stats.total_messages,
            "active_agents": db_stats.active_agents,
            "total_executions": db_stats.total_executions,
            "schema_version": db_stats.schema_version
        },
        "cache": {
            "total_entries": cache_count
        },
        "timestamp": chrono::Utc::now()
    });

    Ok(health)
}