//! Database module for SQLCipher integration
//!
//! This module provides secure, encrypted database functionality for LibreOllama.
//! It includes connection management, schema definitions, models, and migrations.

pub mod connection;
pub mod models;
pub mod operations_v4;
pub mod schema_v4;
pub mod schema_onboarding;

// Re-export all the necessary items for easy access from other modules.
// This allows other files to simply `use crate::database::ChatSession;`
pub use models::*;
pub use operations_v4::*;

#[cfg(test)]
pub mod test;

#[cfg(test)]
pub mod integration_tests;


use anyhow::Result;
use connection::DatabaseManager; // Ensure DatabaseManager is in scope

/// Initialize the database system
///
/// This function sets up the database connection, runs migrations,
/// and ensures the database is ready for use.
pub async fn init_database() -> Result<DatabaseManager> {
    let db_manager = DatabaseManager::new().await?;
    db_manager.run_migrations().await?;
    Ok(db_manager)
}