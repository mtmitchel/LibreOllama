#![cfg(feature = "system-advanced")]
//! Advanced features commands for Phase 3.3
//!
//! This module contains Tauri commands for context management,
//! chat templates, performance metrics, and other advanced features.

use serde::{Deserialize, Serialize};
use crate::database::models::{ConversationContext, ChatTemplate, UserPreference, ApplicationLog, PerformanceMetric, MetricType, RequestCache, PreferenceType, LogLevel, ChatSession, ChatMessage};
use tauri::State;

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
    db_manager: State<'_, crate::database::DatabaseManager>,
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

    let context_clone = context.clone();
    let db_manager_clone = db_manager.inner().clone();
    let update_task = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        let context_data_str = serde_json::to_string(&context_clone.context_data).unwrap_or_default();
        if context_clone.id > 0 {
             crate::database::operations::conversation_operations::update_conversation_context(
                &conn,
                context_clone.id,
                &context_data_str,
                context_clone.context_window_size,
                context_clone.context_summary.as_deref(),
            )
        } else {
            crate::database::operations::conversation_operations::create_conversation_context(
                &conn,
                &context_clone.context_name,
                &context_data_str,
                context_clone.context_window_size,
                context_clone.context_summary.as_deref(),
            ).map(|_| ())
        }
    });

    update_task.await.map_err(|e| e.to_string())?.map_err(|e: anyhow::Error| e.to_string())?;

    Ok(context)
}

// ===== Chat Template Commands =====

#[tauri::command]
pub async fn get_chat_templates(active_only: Option<bool>) -> Result<Vec<ChatTemplate>, String> {
    crate::database::get_chat_templates(active_only.unwrap_or(true))
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
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<ChatTemplate, String> {
    let template = ChatTemplate::new(name, description.unwrap_or_default(), system_message.unwrap_or_default());

    let template_clone = template.clone();
    let db_manager_clone = db_manager.inner().clone();
    let create_task = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        crate::database::operations::template_operations::create_chat_template(&conn, &template_clone.template_name, &template_clone.template_content)
    });

    create_task.await.map_err(|e| e.to_string())?.map_err(|e: anyhow::Error| e.to_string())?;

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
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<ChatTemplate, String> {
    let template_id_int = template_id.parse().unwrap_or_default();
    let db_manager_clone = db_manager.inner().clone();

    // Get the template
    let mut template = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        crate::database::operations::template_operations::get_chat_template(&conn, template_id_int)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?
    .ok_or("Template not found")?;

    // Update fields if provided
    if let Some(n) = name { template.template_name = n; }
    // Description and system_message are part of template_content, would need parsing and re-serialization

    let template_clone = template.clone();
    let db_manager_clone_update = db_manager.inner().clone();
    let update_task = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone_update.get_connection()?;
        crate::database::operations::template_operations::update_chat_template(&conn, template_clone.id, &template_clone.template_name, &template_clone.template_content)
    });

    update_task.await.map_err(|e| e.to_string())?.map_err(|e: anyhow::Error| e.to_string())?;

    Ok(template)
}

#[tauri::command]
pub async fn increment_template_usage(
    template_id: String,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<(), String> {
    let template_id_int = template_id.parse().unwrap_or_default();
    let db_manager_clone = db_manager.inner().clone();
    
    let template = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        crate::database::operations::template_operations::get_chat_template(&conn, template_id_int)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?
    .ok_or("Template not found")?;

    // template.increment_usage(); // increment_usage method doesn't exist
    
    let template_clone = template.clone();
    let db_manager_clone_update = db_manager.inner().clone();
    tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone_update.get_connection()?;
        crate::database::operations::template_operations::update_chat_template(&conn, template_clone.id, &template_clone.template_name, &template_clone.template_content)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;

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
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<(), String> {
    let metric = PerformanceMetric::new(
        MetricType::from(metric_type),
        value,
        chrono::Local::now().naive_local(), // Added timestamp
        tags, // Pass tags as metadata
    );
    
    let db_manager_clone = db_manager.inner().clone();
    tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        crate::database::operations::performance_operations::create_performance_metric(&conn, metric.metric_type, metric.value, metric.metadata)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;

    Ok(())
}

#[allow(dead_code)]
#[tauri::command]
pub async fn get_performance_metrics(
    metric_type: Option<String>,
    _component: Option<String>,
    _operation: Option<String>,
    start_time: Option<String>, 
    end_time: Option<String>,   
    limit: Option<i32>,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<Vec<PerformanceMetric>, String> {
    let metric_type = metric_type.map(MetricType::from);
    let start_time = start_time.and_then(|s| s.parse::<chrono::NaiveDateTime>().ok());
    let end_time = end_time.and_then(|s| s.parse::<chrono::NaiveDateTime>().ok());
    let limit = limit.map(|l| l as usize);
    
    let db_manager_clone = db_manager.inner().clone();
    tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        crate::database::operations::performance_operations::get_performance_metrics_by_type(
            &conn,
            metric_type,
            start_time,
            end_time,
            limit,
        )
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())
}

// ===== Cache Management Commands =====

#[tauri::command]
pub async fn cache_request(
    key: String,
    value: String, // JSON string
    ttl_seconds: Option<i64>,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<(), String> {
    let expires_at = chrono::Local::now().naive_local() + chrono::Duration::seconds(ttl_seconds.unwrap_or(3600));
    let cache = RequestCache {
        id: 0,
        request_hash: key,
        response_body: value,
        expires_at: Some(expires_at),
        created_at: chrono::Local::now().naive_local(),
    };

    let db_manager_clone = db_manager.inner().clone();
    tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        crate::database::operations::cache_operations::create_cache_entry(
            &conn,
            &cache.request_hash,
            &cache.response_body,
            cache.expires_at.unwrap_or_else(|| chrono::Local::now().naive_local()),
        )
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_cached_request(
    key: String,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<Option<RequestCache>, String> {
    let db_manager_clone = db_manager.inner().clone();
    tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        crate::database::operations::cache_operations::get_valid_cache_entry(&conn, &key)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())
}

// ===== User Preference Commands =====

#[tauri::command]
pub async fn get_user_preference(
    key: String,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<Option<UserPreference>, String> {
    let db_manager_clone = db_manager.inner().clone();
    tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        crate::database::operations::preference_operations::get_user_preference_by_key(&conn, &key)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())
}

#[tauri::command]
pub async fn set_user_preference(
    key: String,
    value: String, // JSON string
    preference_type: Option<String>, // "string", "number", "boolean", "json"
    _is_system_preference: Option<bool>, // Not a field in UserPreference
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<(), String> {
    let pref_type = preference_type.map(|pt| PreferenceType::from_string(&pt)).unwrap_or(PreferenceType::String);
    
    let db_manager_clone = db_manager.inner().clone();
    tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        crate::database::operations::preference_operations::upsert_user_preference(
            &conn,
            &key,
            &value,
            pref_type.as_str(),
        )
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_all_user_preferences(
    system_only: Option<bool>,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<Vec<UserPreference>, String> {
    let system_only = system_only.unwrap_or(false);
    let db_manager_clone = db_manager.inner().clone();

    tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        if system_only {
            crate::database::operations::preference_operations::get_user_preferences_by_type_pattern(&conn, "system%")
        } else {
            crate::database::operations::preference_operations::get_all_user_preferences(&conn)
        }
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())
}

// ===== Application Logging Commands =====

#[tauri::command]
pub async fn log_application_event(
    level: String, // "info", "warn", "error", "debug"
    message: String,
    component: Option<String>, // Not a field in ApplicationLog, combined into message
    context: Option<String>, // Renamed to details in ApplicationLog::new
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<(), String> {
    let log_level = LogLevel::from_string(&level);
    let module_name = component.unwrap_or_else(|| "frontend".to_string());
    // 'context' can be mapped to 'function_name' or part of the message
    let function_name = context.unwrap_or_else(|| "unknown".to_string());
    
    let db_manager_clone = db_manager.inner().clone();
    tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        crate::database::operations::log_operations::create_application_log(
            &conn,
            &log_level.to_string(),
            &message,
            &module_name,
            &function_name,
        )
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_application_logs(
    level: Option<String>,
    component: Option<String>,
    start_time: Option<String>, // ISO 8601
    end_time: Option<String>,   // ISO 8601
    limit: Option<i32>,
) -> Result<Vec<ApplicationLog>, String> {
    let log_level = level.map(|l| LogLevel::from_string(&l));
    crate::database::get_application_logs(
        log_level,
        component,
        start_time.and_then(|s| s.parse::<chrono::NaiveDateTime>().ok()), // Parse to NaiveDateTime
        end_time.and_then(|s| s.parse::<chrono::NaiveDateTime>().ok()), // Parse to NaiveDateTime
        limit.map(|l| l as usize),
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
pub async fn export_chat_session(
    session_id: String,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<ChatExport, String> {
    let session_id_int = session_id.parse().unwrap_or_default();
    let db_manager_clone = db_manager.inner().clone();

    let export_data = tokio::task::spawn_blocking(move || -> Result<(ChatSession, Vec<ChatMessage>, Option<ConversationContext>), anyhow::Error> {
        let conn = db_manager_clone.get_connection()?;
        
        let session = crate::database::operations::chat_operations::get_chat_session(&conn, session_id_int)?
            .ok_or_else(|| anyhow::anyhow!("Session not found"))?;

        let messages = crate::database::operations::chat_operations::get_chat_messages_by_session(&conn, session_id_int)?;
        
        let context = crate::database::operations::conversation_operations::get_conversation_context_by_name(&conn, &session.session_name)?;

        Ok((session, messages, context))
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e| e.to_string())?;

    Ok(ChatExport {
        session: export_data.0,
        messages: export_data.1,
        context: export_data.2,
        export_timestamp: chrono::Utc::now(),
        export_version: "3.3.0".to_string(),
    })
}

#[tauri::command]
pub async fn export_chat_session_markdown(
    session_id: String,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<String, String> {
    let export = export_chat_session(session_id, db_manager).await?;
    
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
