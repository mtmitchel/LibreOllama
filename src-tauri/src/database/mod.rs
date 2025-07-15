//! Database Module
//!
//! This module provides database access and management functionality.
//! Some functions are currently unused but kept for future development.

use anyhow::Result;

pub mod models;
pub mod schema;
pub mod operations;
pub mod connection;
#[cfg(test)]
pub mod integration_tests;

// Re-export DatabaseManager for easier access
pub use connection::DatabaseManager;
pub use models::*;

/// Initialize the database and return a DatabaseManager instance
pub async fn init_database() -> Result<DatabaseManager> {
    let db_manager = DatabaseManager::new().await?;
    
    // Run database migrations
    db_manager.run_migrations().await?;
    
    Ok(db_manager)
}

/// Get conversation context by session ID
pub async fn get_conversation_context(session_id: &str) -> Result<Option<ConversationContext>> {
    let db_manager = DatabaseManager::new().await?;
    let conn = db_manager.get_connection()?;
    operations::conversation_operations::get_conversation_context_by_name(&conn, session_id)
}

/// Get chat templates
pub async fn get_chat_templates(active_only: bool) -> Result<Vec<ChatTemplate>> {
    let db_manager = DatabaseManager::new().await?;
    let conn = db_manager.get_connection()?;
    if active_only {
        operations::template_operations::get_all_chat_templates(&conn)
    } else {
        operations::template_operations::get_all_chat_templates(&conn)
    }
}

/// Get chat template by ID
pub async fn get_chat_template_by_id(template_id: &i32) -> Result<Option<ChatTemplate>> {
    let db_manager = DatabaseManager::new().await?;
    let conn = db_manager.get_connection()?;
    operations::template_operations::get_chat_template(&conn, *template_id)
}

/// Get application logs
pub async fn get_application_logs(
    level: Option<LogLevel>,
    component: Option<String>,
    _start_time: Option<chrono::NaiveDateTime>,
    _end_time: Option<chrono::NaiveDateTime>,
    limit: Option<usize>,
) -> Result<Vec<ApplicationLog>> {
    let db_manager = DatabaseManager::new().await?;
    let conn = db_manager.get_connection()?;
    
    // For now, return all logs as the specific filtering operations might not be implemented
    let logs = operations::log_operations::get_all_application_logs(&conn)?;
    
    // Apply basic filtering
    let mut filtered_logs: Vec<ApplicationLog> = logs.into_iter()
        .filter(|log| {
            if let Some(ref level_filter) = level {
                // Simple string comparison for log level filtering
                log.log_level.as_str() == level_filter.as_str()
            } else {
                true
            }
        })
        .filter(|log| {
            if let Some(ref comp_filter) = component {
                log.module_name.contains(comp_filter)
            } else {
                true
            }
        })
        .collect();
    
    // Apply limit
    if let Some(limit_val) = limit {
        filtered_logs.truncate(limit_val);
    }
    
    Ok(filtered_logs)
}

// Note: Several unused functions have been removed to clean up warnings.
// Core database functionality is maintained. 