//! Database operations for Phase 3.3 advanced features
//!
//! This module provides database operations for context management,
//! chat templates, performance metrics, and other advanced features.

use anyhow::{Context, Result};
use rusqlite::{Connection, params};
use crate::database::connection::get_connection;
use super::models_v2::*;
use chrono::{DateTime, Utc};

// ===== Conversation Context Operations =====

pub fn create_conversation_context(context: &ConversationContext) -> Result<()> {
    let conn = get_connection()?;
    conn.execute(
        "INSERT INTO conversation_context (id, session_id, context_window_size, context_summary, token_count, last_updated, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            context.id,
            context.session_id,
            context.context_window_size,
            context.context_summary,
            context.token_count,
            context.last_updated.to_rfc3339(),
            context.created_at.to_rfc3339()
        ],
    ).context("Failed to create conversation context")?;
    Ok(())
}

pub fn get_conversation_context(session_id: &str) -> Result<Option<ConversationContext>> {
    let conn = get_connection()?;
    let mut stmt = conn.prepare(
        "SELECT id, session_id, context_window_size, context_summary, token_count, last_updated, created_at
         FROM conversation_context WHERE session_id = ?1"
    )?;
    
    let mut rows = stmt.query_map([session_id], |row| {
        Ok(ConversationContext {
            id: row.get(0)?,
            session_id: row.get(1)?,
            context_window_size: row.get(2)?,
            context_summary: row.get(3)?,
            token_count: row.get(4)?,
            last_updated: DateTime::parse_from_rfc3339(&row.get::<_, String>(5)?)
                .map_err(|_| rusqlite::Error::InvalidColumnType(5, "datetime".to_string(), rusqlite::types::Type::Text))?
                .with_timezone(&Utc),
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(6)?)
                .map_err(|_| rusqlite::Error::InvalidColumnType(6, "datetime".to_string(), rusqlite::types::Type::Text))?
                .with_timezone(&Utc),
        })
    })?;
    
    Ok(rows.next().transpose()?)
}

pub fn update_conversation_context(context: &ConversationContext) -> Result<()> {
    let conn = get_connection()?;
    conn.execute(
        "UPDATE conversation_context SET context_window_size = ?1, context_summary = ?2, token_count = ?3, last_updated = ?4
         WHERE id = ?5",
        params![
            context.context_window_size,
            context.context_summary,
            context.token_count,
            context.last_updated.to_rfc3339(),
            context.id
        ],
    ).context("Failed to update conversation context")?;
    Ok(())
}

// ===== Chat Template Operations =====

pub fn create_chat_template(template: &ChatTemplate) -> Result<()> {
    let conn = get_connection()?;
    conn.execute(
        "INSERT INTO chat_templates (id, name, description, system_message, initial_prompts, model_config, is_default, is_active, created_at, updated_at, usage_count)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        params![
            template.id,
            template.name,
            template.description,
            template.system_message,
            template.initial_prompts,
            template.model_config,
            template.is_default,
            template.is_active,
            template.created_at.to_rfc3339(),
            template.updated_at.to_rfc3339(),
            template.usage_count
        ],
    ).context("Failed to create chat template")?;
    Ok(())
}

pub fn get_chat_templates(active_only: bool) -> Result<Vec<ChatTemplate>> {
    let conn = get_connection()?;
    let query = if active_only {
        "SELECT id, name, description, system_message, initial_prompts, model_config, is_default, is_active, created_at, updated_at, usage_count
         FROM chat_templates WHERE is_active = TRUE ORDER BY usage_count DESC, name ASC"
    } else {
        "SELECT id, name, description, system_message, initial_prompts, model_config, is_default, is_active, created_at, updated_at, usage_count
         FROM chat_templates ORDER BY usage_count DESC, name ASC"
    };
    
    let mut stmt = conn.prepare(query)?;
    let rows = stmt.query_map([], |row| {
        Ok(ChatTemplate {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            system_message: row.get(3)?,
            initial_prompts: row.get(4)?,
            model_config: row.get(5)?,
            is_default: row.get(6)?,
            is_active: row.get(7)?,
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(8)?)
                .map_err(|_| rusqlite::Error::InvalidColumnType(8, "datetime".to_string(), rusqlite::types::Type::Text))?
                .with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(9)?)
                .map_err(|_| rusqlite::Error::InvalidColumnType(9, "datetime".to_string(), rusqlite::types::Type::Text))?
                .with_timezone(&Utc),
            usage_count: row.get(10)?,
        })
    })?;
    
    let mut templates = Vec::new();
    for row in rows {
        templates.push(row?);
    }
    Ok(templates)
}

pub fn get_chat_template_by_id(template_id: &str) -> Result<Option<ChatTemplate>> {
    let conn = get_connection()?;
    let mut stmt = conn.prepare(
        "SELECT id, name, description, system_message, initial_prompts, model_config, is_default, is_active, created_at, updated_at, usage_count
         FROM chat_templates WHERE id = ?1"
    )?;
    
    let mut rows = stmt.query_map([template_id], |row| {
        Ok(ChatTemplate {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            system_message: row.get(3)?,
            initial_prompts: row.get(4)?,
            model_config: row.get(5)?,
            is_default: row.get(6)?,
            is_active: row.get(7)?,
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(8)?)
                .map_err(|_| rusqlite::Error::InvalidColumnType(8, "datetime".to_string(), rusqlite::types::Type::Text))?
                .with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(9)?)
                .map_err(|_| rusqlite::Error::InvalidColumnType(9, "datetime".to_string(), rusqlite::types::Type::Text))?
                .with_timezone(&Utc),
            usage_count: row.get(10)?,
        })
    })?;
    
    Ok(rows.next().transpose()?)
}

pub fn update_chat_template(template: &ChatTemplate) -> Result<()> {
    let conn = get_connection()?;
    conn.execute(
        "UPDATE chat_templates SET name = ?1, description = ?2, system_message = ?3, initial_prompts = ?4, model_config = ?5, is_default = ?6, is_active = ?7, updated_at = ?8, usage_count = ?9
         WHERE id = ?10",
        params![
            template.name,
            template.description,
            template.system_message,
            template.initial_prompts,
            template.model_config,
            template.is_default,
            template.is_active,
            template.updated_at.to_rfc3339(),
            template.usage_count,
            template.id
        ],
    ).context("Failed to update chat template")?;
    Ok(())
}

// ===== Performance Metrics Operations =====

pub fn create_performance_metric(metric: &PerformanceMetric) -> Result<()> {
    let conn = get_connection()?;
    conn.execute(
        "INSERT INTO performance_metrics (id, metric_type, metric_value, session_id, model_name, timestamp, metadata)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            metric.id,
            metric.metric_type.to_string(),
            metric.metric_value,
            metric.session_id,
            metric.model_name,
            metric.timestamp.to_rfc3339(),
            metric.metadata
        ],
    ).context("Failed to create performance metric")?;
    Ok(())
}

// ===== Model Analytics Operations =====

pub fn create_or_update_model_analytics(model_name: &str, response_time: f64, tokens_generated: i32) -> Result<()> {
    let _conn = get_connection()?;
    
    // Check if analytics exist for this model
    let existing = get_model_analytics(model_name)?;
    
    if let Some(mut analytics) = existing {
        analytics.update_usage(response_time, tokens_generated);
        update_model_analytics(&analytics)?;
    } else {
        let mut analytics = ModelAnalytics::new(model_name.to_string());
        analytics.update_usage(response_time, tokens_generated);
        create_model_analytics(&analytics)?;
    }
    
    Ok(())
}

pub fn create_model_analytics(analytics: &ModelAnalytics) -> Result<()> {
    let conn = get_connection()?;
    conn.execute(
        "INSERT INTO model_analytics (id, model_name, total_requests, total_tokens_generated, average_response_time, last_used, performance_score, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            analytics.id,
            analytics.model_name,
            analytics.total_requests,
            analytics.total_tokens_generated,
            analytics.average_response_time,
            analytics.last_used.map(|dt| dt.to_rfc3339()),
            analytics.performance_score,
            analytics.created_at.to_rfc3339(),
            analytics.updated_at.to_rfc3339()
        ],
    ).context("Failed to create model analytics")?;
    Ok(())
}

pub fn get_model_analytics(model_name: &str) -> Result<Option<ModelAnalytics>> {
    let conn = get_connection()?;
    let mut stmt = conn.prepare(
        "SELECT id, model_name, total_requests, total_tokens_generated, average_response_time, last_used, performance_score, created_at, updated_at
         FROM model_analytics WHERE model_name = ?1"
    )?;
    
    let mut rows = stmt.query_map([model_name], |row| {
        Ok(ModelAnalytics {
            id: row.get(0)?,
            model_name: row.get(1)?,
            total_requests: row.get(2)?,
            total_tokens_generated: row.get(3)?,
            average_response_time: row.get(4)?,
            last_used: {
                let last_used_str: Option<String> = row.get(5)?;
                last_used_str.map(|s| DateTime::parse_from_rfc3339(&s)
                    .map_err(|_| rusqlite::Error::InvalidColumnType(5, "datetime".to_string(), rusqlite::types::Type::Text))
                    .map(|dt| dt.with_timezone(&Utc))).transpose()?
            },
            performance_score: row.get(6)?,
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(7)?)
                .map_err(|_| rusqlite::Error::InvalidColumnType(7, "datetime".to_string(), rusqlite::types::Type::Text))?
                .with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(8)?)
                .map_err(|_| rusqlite::Error::InvalidColumnType(8, "datetime".to_string(), rusqlite::types::Type::Text))?
                .with_timezone(&Utc),
        })
    })?;
    
    Ok(rows.next().transpose()?)
}

pub fn update_model_analytics(analytics: &ModelAnalytics) -> Result<()> {
    let conn = get_connection()?;
    conn.execute(
        "UPDATE model_analytics SET total_requests = ?1, total_tokens_generated = ?2, average_response_time = ?3, last_used = ?4, performance_score = ?5, updated_at = ?6
         WHERE id = ?7",
        params![
            analytics.total_requests,
            analytics.total_tokens_generated,
            analytics.average_response_time,
            analytics.last_used.map(|dt| dt.to_rfc3339()),
            analytics.performance_score,
            analytics.updated_at.to_rfc3339(),
            analytics.id
        ],
    ).context("Failed to update model analytics")?;
    Ok(())
}

pub fn get_all_model_analytics() -> Result<Vec<ModelAnalytics>> {
    let conn = get_connection()?;
    let mut stmt = conn.prepare(
        "SELECT id, model_name, total_requests, total_tokens_generated, average_response_time, last_used, performance_score, created_at, updated_at
         FROM model_analytics ORDER BY last_used DESC, model_name ASC"
    )?;
    
    let rows = stmt.query_map([], |row| {
        Ok(ModelAnalytics {
            id: row.get(0)?,
            model_name: row.get(1)?,
            total_requests: row.get(2)?,
            total_tokens_generated: row.get(3)?,
            average_response_time: row.get(4)?,
            last_used: {
                let last_used_str: Option<String> = row.get(5)?;
                last_used_str.map(|s| DateTime::parse_from_rfc3339(&s)
                    .map_err(|_| rusqlite::Error::InvalidColumnType(5, "datetime".to_string(), rusqlite::types::Type::Text))
                    .map(|dt| dt.with_timezone(&Utc))).transpose()?
            },
            performance_score: row.get(6)?,
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(7)?)
                .map_err(|_| rusqlite::Error::InvalidColumnType(7, "datetime".to_string(), rusqlite::types::Type::Text))?
                .with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(8)?)
                .map_err(|_| rusqlite::Error::InvalidColumnType(8, "datetime".to_string(), rusqlite::types::Type::Text))?
                .with_timezone(&Utc),
        })
    })?;
    
    let mut all_analytics = Vec::new();
    for row in rows {
        all_analytics.push(row?);
    }
    Ok(all_analytics)
}

// ===== Request Cache Operations =====

pub fn get_cached_response(request_hash: &str) -> Result<Option<RequestCache>> {
    let conn = get_connection()?;
    let mut stmt = conn.prepare(
        "SELECT id, request_hash, model_name, prompt_text, response_text, response_metadata, hit_count, created_at, last_accessed, expires_at
         FROM request_cache WHERE request_hash = ?1"
    )?;
    
    let mut rows = stmt.query_map([request_hash], |row| {
        Ok(RequestCache {
            id: row.get(0)?,
            request_hash: row.get(1)?,
            model_name: row.get(2)?,
            prompt_text: row.get(3)?,
            response_text: row.get(4)?,
            response_metadata: row.get(5)?,
            hit_count: row.get(6)?,
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(7)?)
                .map_err(|_| rusqlite::Error::InvalidColumnType(7, "datetime".to_string(), rusqlite::types::Type::Text))?
                .with_timezone(&Utc),
            last_accessed: DateTime::parse_from_rfc3339(&row.get::<_, String>(8)?)
                .map_err(|_| rusqlite::Error::InvalidColumnType(8, "datetime".to_string(), rusqlite::types::Type::Text))?
                .with_timezone(&Utc),
            expires_at: {
                let expires_at_str: Option<String> = row.get(9)?;
                expires_at_str.map(|s| DateTime::parse_from_rfc3339(&s)
                    .map_err(|_| rusqlite::Error::InvalidColumnType(9, "datetime".to_string(), rusqlite::types::Type::Text))
                    .map(|dt| dt.with_timezone(&Utc))).transpose()?
            },
        })
    })?;
    
    if let Some(cache) = rows.next().transpose()? {
        if cache.is_expired() {
            delete_cached_response(&cache.request_hash)?;
            Ok(None)
        } else {
            Ok(Some(cache))
        }
    } else {
        Ok(None)
    }
}

pub fn create_cached_response(cache: &RequestCache) -> Result<()> {
    let conn = get_connection()?;
    conn.execute(
        "INSERT INTO request_cache (id, request_hash, model_name, prompt_text, response_text, response_metadata, hit_count, created_at, last_accessed, expires_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        params![
            cache.id,
            cache.request_hash,
            cache.model_name,
            cache.prompt_text,
            cache.response_text,
            cache.response_metadata,
            cache.hit_count,
            cache.created_at.to_rfc3339(),
            cache.last_accessed.to_rfc3339(),
            cache.expires_at.map(|dt| dt.to_rfc3339())
        ],
    ).context("Failed to create cached response")?;
    Ok(())
}

pub fn update_cache_hit(cache: &RequestCache) -> Result<()> {
    let conn = get_connection()?;
    conn.execute(
        "UPDATE request_cache SET hit_count = ?1, last_accessed = ?2 WHERE id = ?3",
        params![
            cache.hit_count,
            cache.last_accessed.to_rfc3339(),
            cache.id
        ],
    ).context("Failed to update cache hit")?;
    Ok(())
}

pub fn delete_cached_response(request_hash: &str) -> Result<()> {
    let conn = get_connection()?;
    conn.execute("DELETE FROM request_cache WHERE request_hash = ?1", [request_hash])
        .context("Failed to delete cached response")?;
    Ok(())
}

pub fn get_all_user_preferences(system_only: bool) -> Result<Vec<UserPreference>> {
    let conn = get_connection()?;
    let query = if system_only {
        "SELECT id, preference_key, preference_value, preference_type, description, is_system, created_at, updated_at
         FROM user_preferences WHERE is_system = TRUE ORDER BY preference_key ASC"
    } else {
        "SELECT id, preference_key, preference_value, preference_type, description, is_system, created_at, updated_at
         FROM user_preferences ORDER BY preference_key ASC"
    };
    
    let mut stmt = conn.prepare(query)?;
    let rows = stmt.query_map([], |row| {
        Ok(UserPreference {
            id: row.get(0)?,
            preference_key: row.get(1)?,
            preference_value: row.get(2)?,
            preference_type: PreferenceType::from(row.get::<_, String>(3)?),
            description: row.get(4)?,
            is_system: row.get(5)?,
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(6)?)
                .map_err(|_| rusqlite::Error::InvalidColumnType(6, "datetime".to_string(), rusqlite::types::Type::Text))?
                .with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(7)?)
                .map_err(|_| rusqlite::Error::InvalidColumnType(7, "datetime".to_string(), rusqlite::types::Type::Text))?
                .with_timezone(&Utc),
        })
    })?;
    
    let mut preferences = Vec::new();
    for row in rows {
        preferences.push(row?);
    }
    Ok(preferences)
}

// ===== User Preferences Operations =====

pub fn get_user_preference(key: &str) -> Result<Option<UserPreference>> {
    let conn = get_connection()?;
    let mut stmt = conn.prepare(
        "SELECT id, preference_key, preference_value, preference_type, description, is_system, created_at, updated_at
         FROM user_preferences WHERE preference_key = ?1"
    )?;
    
    let mut rows = stmt.query_map([key], |row| {
        Ok(UserPreference {
            id: row.get(0)?,
            preference_key: row.get(1)?,
            preference_value: row.get(2)?,
            preference_type: PreferenceType::from(row.get::<_, String>(3)?),
            description: row.get(4)?,
            is_system: row.get(5)?,
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(6)?)
                .map_err(|_| rusqlite::Error::InvalidColumnType(6, "datetime".to_string(), rusqlite::types::Type::Text))?
                .with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(7)?)
                .map_err(|_| rusqlite::Error::InvalidColumnType(7, "datetime".to_string(), rusqlite::types::Type::Text))?
                .with_timezone(&Utc),
        })
    })?;
    
    Ok(rows.next().transpose()?)
}

pub fn set_user_preference(preference: &UserPreference) -> Result<()> {
    let conn = get_connection()?;
    conn.execute(
        "INSERT OR REPLACE INTO user_preferences (id, preference_key, preference_value, preference_type, description, is_system, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            preference.id,
            preference.preference_key,
            preference.preference_value,
            preference.preference_type.to_string(),
            preference.description,
            preference.is_system,
            preference.created_at.to_rfc3339(),
            preference.updated_at.to_rfc3339()
        ],
    ).context("Failed to set user preference")?;
    Ok(())
}

// ===== Application Logging Operations =====

pub fn create_application_log(log: &ApplicationLog) -> Result<()> {
    let conn = get_connection()?;
    conn.execute(
        "INSERT INTO application_logs (id, log_level, message, component, session_id, error_code, stack_trace, metadata, timestamp)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            log.id,
            log.log_level.to_string(),
            log.message,
            log.component,
            log.session_id,
            log.error_code,
            log.stack_trace,
            log.metadata,
            log.timestamp.to_rfc3339()
        ],
    ).context("Failed to create application log")?;
    Ok(())
}

pub fn cleanup_old_logs(max_entries: i32) -> Result<i32> {
    let conn = get_connection()?;
    let deleted = conn.execute(
        "DELETE FROM application_logs WHERE id NOT IN (
            SELECT id FROM application_logs ORDER BY timestamp DESC LIMIT ?1
        )",
        [max_entries],
    ).context("Failed to cleanup old logs")?;
    Ok(deleted as i32)
}

pub fn get_application_logs(
    log_level: Option<LogLevel>,
    component: Option<&str>,
    limit: Option<i32>,
) -> Result<Vec<ApplicationLog>> {
    let conn = get_connection()?;
    let mut query = "SELECT id, log_level, message, component, session_id, error_code, stack_trace, metadata, timestamp FROM application_logs".to_string();
    let mut conditions = Vec::new();
    
    if log_level.is_some() {
        conditions.push("log_level = ?");
    }
    if component.is_some() {
        conditions.push("component = ?");
    }
    
    if !conditions.is_empty() {
        query.push_str(" WHERE ");
        query.push_str(&conditions.join(" AND "));
    }
    
    query.push_str(" ORDER BY timestamp DESC");
    
    if let Some(limit) = limit {
        query.push_str(&format!(" LIMIT {}", limit));
    }
    
    let mut stmt = conn.prepare(&query)?;
    
    // Create owned strings for parameters to avoid borrowing issues
    let level_string = log_level.as_ref().map(|l| l.to_string());
    let component_string = component.map(|c| c.to_string());
    let mut params: Vec<&dyn rusqlite::ToSql> = Vec::new();
    
    if let Some(ref level_str) = level_string {
        params.push(level_str);
    }
    if let Some(ref comp_str) = component_string {
        params.push(comp_str);
    }
    
    let rows = stmt.query_map(params.as_slice(), |row| {
        Ok(ApplicationLog {
            id: row.get(0)?,
            log_level: LogLevel::from(row.get::<_, String>(1)?),
            message: row.get(2)?,
            component: row.get(3)?,
            session_id: row.get(4)?,
            error_code: row.get(5)?,
            stack_trace: row.get(6)?,
            metadata: row.get(7)?,
            timestamp: DateTime::parse_from_rfc3339(&row.get::<_, String>(8)?)
                .map_err(|_| rusqlite::Error::InvalidColumnType(8, "datetime".to_string(), rusqlite::types::Type::Text))?
                .with_timezone(&Utc),
        })
    })?;
    
    let mut logs = Vec::new();
    for row in rows {
        logs.push(row?);
    }
    Ok(logs)
}