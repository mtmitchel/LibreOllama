//! Database module for SQLCipher integration
//!
//! This module provides secure, encrypted database functionality for LibreOllama.
//! It includes connection management, schema definitions, models, and migrations.

pub mod connection;
pub mod models;
pub mod operations;
pub mod schema;
pub mod schema_onboarding;
pub mod test;

#[cfg(test)]
pub mod integration_tests;

// Re-export DatabaseManager specifically to ensure it's public
pub use connection::DatabaseManager;

// Re-export all other necessary items for easy access from other modules
pub use models::*;
pub use operations::*;
// Schema types available via direct import where needed
// pub use schema::*;

use anyhow::Result;
use chrono::NaiveDateTime;

/// Initialize the database system
///
/// This function sets up the database connection, runs migrations,
/// and ensures the database is ready for use.
pub async fn init_database() -> Result<DatabaseManager> {
    let db_manager = DatabaseManager::new().await?;
    db_manager.run_migrations().await?;
    Ok(db_manager)
}

// ===== Database Interface Functions =====
// These functions provide the expected interface for command handlers

/// Get user preference by key
pub async fn get_user_preference(key: &str) -> Result<Option<models::UserPreference>> {
    operations::preference_operations::get_user_preference_async(key).await
}

/// Set user preference
pub async fn set_user_preference(preference: &models::UserPreference) -> Result<()> {
    operations::preference_operations::set_user_preference_async(preference).await
}

/// Get all user preferences with optional system filter
pub async fn get_all_user_preferences(system_only: bool) -> Result<Vec<models::UserPreference>> {
    operations::preference_operations::get_all_user_preferences_async(system_only).await
}

/// Get agent by ID (async interface for commands)
pub async fn get_agent_by_id(agent_id: &str) -> Result<Option<models::Agent>> {
    // Convert string ID to integer and call the operation
    let id = agent_id.parse::<i32>().map_err(|_| anyhow::anyhow!("Invalid agent ID"))?;
    let db_manager = DatabaseManager::new().await?;
    let conn = db_manager.get_connection()?;
    operations::agent_operations::get_agent(&conn, id)
}

/// Get conversation context (async interface for commands)
pub async fn get_conversation_context(session_id: &str) -> Result<Option<models::ConversationContext>> {
    let db_manager = DatabaseManager::new().await?;
    let conn = db_manager.get_connection()?;
    operations::conversation_operations::get_conversation_context_by_name(&conn, session_id)
}

/// Get chat session by ID (async interface for commands)
pub async fn get_chat_session_by_id(session_id: i32) -> Result<Option<models::ChatSession>> {
    let db_manager = DatabaseManager::new().await?;
    let conn = db_manager.get_connection()?;
    operations::chat_operations::get_chat_session(&conn, session_id)
}

/// Get session messages (async interface for commands)
pub async fn get_session_messages(session_id: i32) -> Result<Vec<models::ChatMessage>> {
    let db_manager = DatabaseManager::new().await?;
    let conn = db_manager.get_connection()?;
    operations::chat_operations::get_chat_messages_by_session(&conn, session_id)
}

/// Get chat template by ID (async interface for commands)
pub async fn get_chat_template_by_id(template_id: &i32) -> Result<Option<models::ChatTemplate>> {
    let db_manager = DatabaseManager::new().await?;
    let conn = db_manager.get_connection()?;
    operations::template_operations::get_chat_template(&conn, *template_id)
}

/// Create request cache (async interface for commands)
pub async fn create_request_cache(cache: &models::RequestCache) -> Result<()> {
    let db_manager = DatabaseManager::new().await?;
    let conn = db_manager.get_connection()?;
    operations::cache_operations::create_cache_entry(&conn, &cache.request_hash, &cache.response_body, cache.expires_at)?;
    Ok(())
}

/// Get request cache (async interface for commands)
pub async fn get_request_cache(key: &str) -> Result<Option<models::RequestCache>> {
    let db_manager = DatabaseManager::new().await?;
    let conn = db_manager.get_connection()?;
    operations::cache_operations::get_cache_entry_by_hash(&conn, key)
}

/// Get application logs (async interface for commands)
pub async fn get_application_logs(
    log_level: Option<models::LogLevel>,
    component: Option<String>,
    start_date: Option<NaiveDateTime>,
    end_date: Option<NaiveDateTime>,
    limit: Option<usize>,
) -> Result<Vec<models::ApplicationLog>> {
    let db_manager = DatabaseManager::new().await?;
    let conn = db_manager.get_connection()?;
    operations::log_operations::get_application_logs_filtered(
        &conn, 
        log_level.map(|l| l.to_string()), 
        component,
        start_date, 
        end_date, 
        limit
    )
} 