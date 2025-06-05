//! Database module for SQLCipher integration
//!
//! This module provides secure, encrypted database functionality for LibreOllama.
//! It includes connection management, schema definitions, models, and migrations.

pub mod connection;
pub mod schema;
pub mod schema_v2; // Added schema_v2 module
pub mod schema_v4; // Added schema_v4 module for bidirectional linking
pub mod models;
pub mod models_v2;
pub mod operations;
pub mod operations_v2;
pub mod operations_v4; // Added operations_v4 module for bidirectional linking

#[cfg(test)]
pub mod test;

#[cfg(test)]
pub mod integration_tests;

// Re-export common types and functions for easier access
pub use connection::{DatabaseManager, get_connection};
pub use models::*;
pub use models_v2::*;
pub use schema::*;
pub use operations::*;
pub use operations_v2::*;

use anyhow::Result;

/// Initialize the database system
///
/// This function sets up the database connection, runs migrations,
/// and ensures the database is ready for use.
pub async fn init_database() -> Result<DatabaseManager> {
    let db_manager = DatabaseManager::new().await?;
    db_manager.run_migrations().await?;
    Ok(db_manager)
}