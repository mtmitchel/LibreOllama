//! Advanced features commands for Phase 3.3
//!
//! This module contains Tauri commands for context management,
//! chat templates, performance metrics, and other advanced features.

use serde::{Deserialize, Serialize};
use crate::database::{self, operations_v2, models_v2::*};
use sha2::{Sha256, Digest};

// ===== Context Management Commands =====

#[tauri::command]
pub async fn get_conversation_context(session_id: String) -> Result<Option<ConversationContext>, String> {
    operations_v2::get_conversation_context(&session_id)
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
    let mut context = operations_v2::get_conversation_context(&session_id)
        .map_err(|e| format!("Failed to get context: {}", e))?
        .unwrap_or_else(|| ConversationContext::new(session_id, context_window_size));

    // Update context
    context.update_context(token_count, context_summary);

    // Save to database
    if operations_v2::get_conversation_context(&context.session_id)
        .map_err(|e| format!("Failed to check context: {}", e))?
        .is_some()
    {
        operations_v2::update_conversation_context(&context)
            .map_err(|e| format!("Failed to update context: {}", e))?;
    } else {
        operations_v2::create_conversation_context(&context)
            .map_err(|e| format!("Failed to create context: {}", e))?;
    }

    Ok(context)
}

// ===== Chat Template Commands =====

#[tauri::command]
pub async fn get_chat_templates(active_only: Option<bool>) -> Result<Vec<ChatTemplate>, String> {
    operations_v2::get_chat_templates(active_only.unwrap_or(true))
        .map_err(|e| format!("Failed to get chat templates: {}", e))
}

#[tauri::command]
pub async fn get_chat_template(template_id: String) -> Result<Option<ChatTemplate>, String> {
    operations_v2::get_chat_template_by_id(&template_id)
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

    operations_v2::create_chat_template(&template)
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
    let mut template = operations_v2::get_chat_template_by_id(&template_id)
        .map_err(|e| format!("Failed to get template: {}", e))?
        .ok_or("Template not found")?;

    // Update fields if provided
    if let Some(n) = name { template.name = n; }
    if let Some(d) = description { template.description = Some(d); }
    if let Some(sm) = system_message { template.system_message = Some(sm); }
    if let Some(ip) = initial_prompts { template.initial_prompts = Some(ip); }
    if let Some(mc) = model_config { template.model_config = Some(mc); }
    if let Some(def) = is_default { template.is_default = def; }
    if let Some(active) = is_active { template.is_active = active; }
    
    template.updated_at = chrono::Utc::now();

    operations_v2::update_chat_template(&template)
        .map_err(|e| format!("Failed to update chat template: {}", e))?;

    Ok(template)
}

#[tauri::command]
pub async fn increment_template_usage(template_id: String) -> Result<(), String> {
    let mut template = operations_v2::get_chat_template_by_id(&template_id)
        .map_err(|e| format!("Failed to get template: {}", e))?
        .ok_or("Template not found")?;

    template.increment_usage();
    
    operations_v2::update_chat_template(&template)
        .map_err(|e| format!("Failed to update template usage: {}", e))?;

    Ok(())
}

// ===== Performance Metrics Commands =====

#[tauri::command]
pub async fn record_performance_metric(
    metric_type: String,
    metric_value: f64,
    session_id: Option<String>,
    model_name: Option<String>,
    metadata: Option<String>,
) -> Result<(), String> {
    let metric = PerformanceMetric::new(
        MetricType::from(metric_type),
        metric_value,
        session_id,
        model_name,
        metadata,
    );

    operations_v2::create_performance_metric(&metric)
        .map_err(|e| format!("Failed to record performance metric: {}", e))
}

#[tauri::command]
pub async fn get_model_analytics(model_name: Option<String>) -> Result<serde_json::Value, String> {
    if let Some(name) = model_name {
        let analytics = operations_v2::get_model_analytics(&name)
            .map_err(|e| format!("Failed to get model analytics: {}", e))?;
        Ok(serde_json::to_value(analytics).unwrap())
    } else {
        let all_analytics = operations_v2::get_all_model_analytics()
            .map_err(|e| format!("Failed to get all model analytics: {}", e))?;
        Ok(serde_json::to_value(all_analytics).unwrap())
    }
}

#[tauri::command]
pub async fn update_model_performance(
    model_name: String,
    response_time: f64,
    tokens_generated: i32,
) -> Result<(), String> {
    operations_v2::create_or_update_model_analytics(&model_name, response_time, tokens_generated)
        .map_err(|e| format!("Failed to update model performance: {}", e))
}

// ===== Cache Management Commands =====

#[tauri::command]
pub async fn get_cached_response(prompt: String, model_name: String) -> Result<Option<String>, String> {
    let request_hash = generate_request_hash(&prompt, &model_name);
    
    if let Some(mut cache) = operations_v2::get_cached_response(&request_hash)
        .map_err(|e| format!("Failed to get cached response: {}", e))? 
    {
        cache.increment_hit();
        operations_v2::update_cache_hit(&cache)
            .map_err(|e| format!("Failed to update cache hit: {}", e))?;
        Ok(Some(cache.response_text))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub async fn cache_response(
    prompt: String,
    model_name: String,
    response: String,
    response_metadata: Option<String>,
    expires_in_hours: Option<i64>,
) -> Result<(), String> {
    let request_hash = generate_request_hash(&prompt, &model_name);
    
    let cache = RequestCache::new(
        request_hash,
        model_name,
        prompt,
        response,
        response_metadata,
        expires_in_hours,
    );

    operations_v2::create_cached_response(&cache)
        .map_err(|e| format!("Failed to cache response: {}", e))
}

fn generate_request_hash(prompt: &str, model_name: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(prompt.as_bytes());
    hasher.update(model_name.as_bytes());
    format!("{:x}", hasher.finalize())
}

// ===== User Preferences Commands =====

#[tauri::command]
pub async fn get_user_preference(key: String) -> Result<Option<UserPreference>, String> {
    operations_v2::get_user_preference(&key)
        .map_err(|e| format!("Failed to get user preference: {}", e))
}

#[tauri::command]
pub async fn set_user_preference(
    key: String,
    value: String,
    preference_type: String,
    description: Option<String>,
) -> Result<(), String> {
    // Check if preference exists
    let mut preference = if let Some(existing) = operations_v2::get_user_preference(&key)
        .map_err(|e| format!("Failed to check preference: {}", e))? 
    {
        existing
    } else {
        UserPreference::new(
            key,
            value.clone(),
            PreferenceType::from(preference_type),
            description,
            false,
        )
    };

    preference.update_value(value);

    operations_v2::set_user_preference(&preference)
        .map_err(|e| format!("Failed to set user preference: {}", e))
}

#[tauri::command]
pub async fn get_all_user_preferences(system_only: Option<bool>) -> Result<Vec<UserPreference>, String> {
    operations_v2::get_all_user_preferences(system_only.unwrap_or(false))
        .map_err(|e| format!("Failed to get user preferences: {}", e))
}

// ===== Application Logging Commands =====

#[tauri::command]
pub async fn log_application_event(
    level: String,
    message: String,
    component: Option<String>,
    session_id: Option<String>,
    error_code: Option<String>,
    stack_trace: Option<String>,
    metadata: Option<String>,
) -> Result<(), String> {
    let log = ApplicationLog::new(
        LogLevel::from(level),
        message,
        component,
        session_id,
        error_code,
        stack_trace,
        metadata,
    );

    operations_v2::create_application_log(&log)
        .map_err(|e| format!("Failed to create application log: {}", e))
}

#[tauri::command]
pub async fn get_application_logs(
    level: Option<String>,
    component: Option<String>,
    limit: Option<i32>,
) -> Result<Vec<ApplicationLog>, String> {
    let log_level = level.map(LogLevel::from);
    
    operations_v2::get_application_logs(log_level, component.as_deref(), limit)
        .map_err(|e| format!("Failed to get application logs: {}", e))
}

#[tauri::command]
pub async fn cleanup_old_logs(max_entries: i32) -> Result<i32, String> {
    operations_v2::cleanup_old_logs(max_entries)
        .map_err(|e| format!("Failed to cleanup old logs: {}", e))
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
    let context = operations_v2::get_conversation_context(&session_id)
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