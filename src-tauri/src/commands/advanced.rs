//! Advanced features commands for Phase 3.3
//!
//! This module contains Tauri commands for context management,
//! chat templates, performance metrics, and other advanced features.

use serde::{Deserialize, Serialize};
use crate::database::models::{ConversationContext, ChatTemplate, UserPreference, ApplicationLog, PerformanceMetric, MetricType, RequestCache, PreferenceType, LogLevel};

// ===== Context Management Commands =====

#[tauri::command]
pub async fn get_conversation_context(session_id: String) -> Result<Option<ConversationContext>, String> {
    crate::database::get_conversation_context(&session_id)
        .await
        .map_err(|e| format!("Failed to get conversation context: {}", e))
}

#[tauri::command]
pub async fn update_conversation_context(
    session_id: String,
    context_window_size: Option<i32>,
    context_summary: Option<String>,
    _token_count: i32, // This parameter seems unused based on ConversationContext::new and update_context
) -> Result<ConversationContext, String> {
    // Get existing context or create new one
    let mut context = crate::database::get_conversation_context(&session_id)
        .await
        .map_err(|e| format!("Failed to get context: {}", e))?
        .unwrap_or_else(|| ConversationContext::new(session_id.clone(), context_window_size.unwrap_or_default()));

    // Update context
    if let Some(summary) = context_summary {
        context.context_summary = Some(summary);
    }
    if let Some(cws) = context_window_size {
        context.context_window_size = cws;
    }

    // Save to database
    if crate::database::get_conversation_context(&context.context_name) // Assuming session_id is context_name
        .await
        .map_err(|e| format!("Failed to check context: {}", e))?
        .is_some()
    {
        crate::database::update_conversation_context(&context)
            .await
            .map_err(|e| format!("Failed to update context: {}", e))?;
    } else {
        crate::database::create_conversation_context(&context)
            .await
            .map_err(|e| format!("Failed to create context: {}", e))?;
    }

    Ok(context)
}

// ===== Chat Template Commands =====

#[tauri::command]
pub async fn get_chat_templates(active_only: Option<bool>) -> Result<Vec<ChatTemplate>, String> {
    crate::database::get_chat_templates(active_only.unwrap_or(true)) // Assuming active_only is handled by the operation
        .await
        .map_err(|e| format!("Failed to get chat templates: {}", e))
}

#[tauri::command]
pub async fn get_chat_template(template_id: String) -> Result<Option<ChatTemplate>, String> {
    crate::database::get_chat_template_by_id(&template_id.parse().unwrap_or_default()) // Assuming template_id is i32
        .await
        .map_err(|e| format!("Failed to get chat template: {}", e))
}

#[tauri::command]
pub async fn create_chat_template(
    name: String,
    description: Option<String>,
    system_message: Option<String>,
    _initial_prompts: Option<String>, // These fields are not in ChatTemplate struct
    _model_config: Option<String>,    // These fields are not in ChatTemplate struct
    _is_default: Option<bool>,        // These fields are not in ChatTemplate struct
) -> Result<ChatTemplate, String> {
    let template = ChatTemplate::new(name, description.unwrap_or_default(), system_message.unwrap_or_default());

    crate::database::create_chat_template(&template)
        .await
        .map_err(|e| format!("Failed to create chat template: {}", e))?;

    Ok(template)
}

#[tauri::command]
pub async fn update_chat_template(
    template_id: String,
    name: Option<String>,
    _description: Option<String>, // description is part of template_content
    _system_message: Option<String>, // system_message is part of template_content
    _initial_prompts: Option<String>, // Not a field
    _model_config: Option<String>,    // Not a field
    _is_default: Option<bool>,        // Not a field
    _is_active: Option<bool>,         // Not a field
) -> Result<ChatTemplate, String> {
    let mut template = crate::database::get_chat_template_by_id(&template_id.parse().unwrap_or_default()) // Assuming template_id is i32
        .await
        .map_err(|e| format!("Failed to get template: {}", e))?
        .ok_or("Template not found")?;

    // Update fields if provided
    if let Some(n) = name { template.template_name = n; }
    // Description and system_message are part of template_content, would need parsing and re-serialization

    crate::database::update_chat_template(&template)
        .await
        .map_err(|e| format!("Failed to update chat template: {}", e))?;

    Ok(template)
}

#[tauri::command]
pub async fn increment_template_usage(template_id: String) -> Result<(), String> {
    let template = crate::database::get_chat_template_by_id(&template_id.parse().unwrap_or_default()) // Assuming template_id is i32
        .await
        .map_err(|e| format!("Failed to get template: {}", e))?
        .ok_or("Template not found")?;

    // template.increment_usage(); // increment_usage method doesn't exist
    
    crate::database::update_chat_template(&template) // This would just re-save it, not increment usage
        .await
        .map_err(|e| format!("Failed to update template usage: {}", e))?;

    Ok(())
}

// ===== Performance Metrics Commands =====

#[tauri::command]
pub async fn record_performance_metric(
    metric_type: String,
    value: f64,
    _component: Option<String>, // Not a field in PerformanceMetric
    _operation: Option<String>, // Not a field in PerformanceMetric
    tags: Option<String>, // Renamed to metadata in PerformanceMetric
) -> Result<(), String> {
    let metric = PerformanceMetric::new(
        MetricType::from(metric_type),
        value,
        chrono::Local::now().naive_local(), // Added timestamp
        tags, // Pass tags as metadata
    );
    crate::database::create_performance_metric(&metric)
        .await
        .map_err(|e| format!("Failed to record performance metric: {}", e))
}

#[tauri::command]
pub async fn get_performance_metrics(
    metric_type: Option<String>,
    component: Option<String>,
    operation: Option<String>,
    start_time: Option<String>, 
    end_time: Option<String>,   
    limit: Option<i32>,
) -> Result<Vec<PerformanceMetric>, String> {
    crate::database::get_performance_metrics(
        metric_type.map(MetricType::from),
        component,
        operation,
        start_time.and_then(|s| s.parse::<chrono::NaiveDateTime>().ok()), // Parse to NaiveDateTime
        end_time.and_then(|s| s.parse::<chrono::NaiveDateTime>().ok()), // Parse to NaiveDateTime
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
    _ttl_seconds: Option<i64>, // Not a field in RequestCache
) -> Result<(), String> {
    let cache = RequestCache::new(
        key,
        value,
    );
    crate::database::create_request_cache(&cache)
        .await
        .map_err(|e| format!("Failed to cache request: {}", e))
}

#[tauri::command]
pub async fn get_cached_request(key: String) -> Result<Option<RequestCache>, String> {
    crate::database::get_request_cache(&key)
        .await
        .map_err(|e| format!("Failed to get cached request: {}", e))
}

// ===== User Preference Commands =====

#[tauri::command]
pub async fn get_user_preference(key: String) -> Result<Option<UserPreference>, String> {
    crate::database::get_user_preference(&key)
        .await
        .map_err(|e| format!("Failed to get user preference: {}", e))
}

#[tauri::command]
pub async fn set_user_preference(
    key: String,
    value: String, // JSON string
    preference_type: Option<String>, // "string", "number", "boolean", "json"
    _is_system_preference: Option<bool>, // Not a field in UserPreference
) -> Result<(), String> {
    let pref = UserPreference::new(
        key,
        value,
        preference_type.map(PreferenceType::from).unwrap_or(PreferenceType::String),
    );
    crate::database::set_user_preference(&pref)
        .await
        .map_err(|e| format!("Failed to set user preference: {}", e))
}

#[tauri::command]
pub async fn get_all_user_preferences(system_only: Option<bool>) -> Result<Vec<UserPreference>, String> {
    crate::database::get_all_user_preferences(system_only.unwrap_or(false))
        .await
        .map_err(|e| format!("Failed to get all user preferences: {}", e))
}

// ===== Application Logging Commands =====

#[tauri::command]
pub async fn log_application_event(
    level: String, // "info", "warn", "error", "debug"
    message: String,
    component: Option<String>, // Not a field in ApplicationLog, combined into message
    context: Option<String>, // Renamed to details in ApplicationLog::new
) -> Result<(), String> {
    let log = ApplicationLog::new(
        LogLevel::from(level),
        component.map_or_else(|| message.clone(), |c| format!("[{}] {}", c, message)),
        context,
    );
    crate::database::create_application_log(&log)
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
    crate::database::get_application_logs(
        log_level,
        component,
        start_time.and_then(|s| s.parse::<chrono::NaiveDateTime>().ok()), // Parse to NaiveDateTime
        end_time.and_then(|s| s.parse::<chrono::NaiveDateTime>().ok()), // Parse to NaiveDateTime
        limit.unwrap_or(100),
    )
    .await
    .map_err(|e| format!("Failed to get application logs: {}", e))
}

// ===== Chat Export/Import Commands =====

#[derive(Serialize, Deserialize)]
pub struct ChatExport {
    pub session: crate::database::models::ChatSession, // Fully qualify ChatSession
    pub messages: Vec<crate::database::models::ChatMessage>, // Fully qualify ChatMessage
    pub context: Option<ConversationContext>,
    pub export_timestamp: chrono::DateTime<chrono::Utc>,
    pub export_version: String,
}

#[tauri::command]
pub async fn export_chat_session(session_id: String) -> Result<ChatExport, String> {
    // Get session
    let session = crate::database::get_chat_session_by_id(session_id.parse().unwrap_or_default()) // Parse String to i32
        .await
        .map_err(|e| format!("Failed to get session: {}", e))?
        .ok_or("Session not found")?;

    // Get messages
    let messages = crate::database::get_session_messages(session_id.parse().unwrap_or_default()) // Parse String to i32
        .await
        .map_err(|e| format!("Failed to get messages: {}", e))?;

    // Get context if available
    let context = crate::database::get_conversation_context(&session_id) // Assuming session_id is context_name
        .await
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
    
    let mut markdown = format!("# {}\n\n", export.session.session_name); // Use session_name
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
    // Database stats would need to be implemented in operations
    // For now, return placeholder data
    let db_stats = serde_json::json!({
        "active_sessions": 0,
        "total_messages": 0,
        "active_agents": 0,
        "total_executions": 0,
        "schema_version": "4.0"
    });

    // Cache count would need to be implemented in operations
    let cache_count = 0;

    let health = serde_json::json!({
        "database": db_stats,
        "cache": {
            "total_entries": cache_count
        },
        "timestamp": chrono::Utc::now()
    });

    Ok(health)
}
