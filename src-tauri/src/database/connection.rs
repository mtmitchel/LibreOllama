//! Database connection management with SQLite
//!
//! This module handles SQLite database connections, initialization,
//! and connection pooling for the LibreOllama application.
//! Note: Encryption will be added in a future phase.

use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use anyhow::{Context, Result};
use dirs::data_dir;
use rand::Rng;
use rusqlite::{Connection, OpenFlags};

/// Database manager that handles SQLCipher connections
#[derive(Clone)]
pub struct DatabaseManager {
    db_path: PathBuf,
    encryption_key: String,
    connection: Arc<Mutex<Option<Connection>>>,
}

impl DatabaseManager {
    /// Create a new database manager instance
    pub async fn new() -> Result<Self> {
        let db_path = get_database_path()?;
        let encryption_key = get_or_create_encryption_key()?;
        
        // Ensure the database directory exists
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent)
                .context("Failed to create database directory")?;
        }

        let manager = Self {
            db_path,
            encryption_key,
            connection: Arc::new(Mutex::new(None)),
        };

        // Initialize the connection
        manager.init_connection().await?;
        
        Ok(manager)
    }

    /// Initialize the database connection
    async fn init_connection(&self) -> Result<()> {
        let conn = Connection::open_with_flags(
            &self.db_path,
            OpenFlags::SQLITE_OPEN_READ_WRITE | OpenFlags::SQLITE_OPEN_CREATE,
        ).context("Failed to open database")?;

        // Configure SQLite settings for performance and security
        conn.execute("PRAGMA foreign_keys = ON", [])
            .context("Failed to enable foreign keys")?;
        
        // Try to set WAL mode, but fall back to DELETE mode if it fails
        match conn.query_row("PRAGMA journal_mode = WAL", [], |row| {
            let mode: String = row.get(0)?;
            Ok(mode)
        }) {
            Ok(mode) => {
                println!("Database initialized with {} mode", mode);
            }
            Err(e) => {
                println!("WAL mode failed ({}), falling back to DELETE mode", e);
                conn.query_row("PRAGMA journal_mode = DELETE", [], |row| {
                    let mode: String = row.get(0)?;
                    Ok(mode)
                }).context("Failed to set DELETE mode")?;
                println!("Database initialized with DELETE mode");
            }
        }
            
        conn.execute("PRAGMA synchronous = NORMAL", [])
            .context("Failed to set synchronous mode")?;

        // Test database accessibility with a simple query
        conn.query_row("SELECT 1", [], |row| {
            let result: i32 = row.get(0)?;
            Ok(result)
        }).context("Failed to access database")?;

        // Store the connection
        let mut connection_guard = self.connection.lock().unwrap();
        *connection_guard = Some(conn);

        Ok(())
    }

    /// Get a database connection (creates new connection for thread safety)
    pub fn get_connection(&self) -> Result<Connection> {
        let conn = Connection::open_with_flags(
            &self.db_path,
            OpenFlags::SQLITE_OPEN_READ_WRITE,
        ).context("Failed to open database connection")?;

        // Configure settings
        conn.execute("PRAGMA foreign_keys = ON", [])?;
        
        // Apply the same journal mode fallback strategy
        match conn.query_row("PRAGMA journal_mode = WAL", [], |row| {
            let mode: String = row.get(0)?;
            Ok(mode)
        }) {
            Ok(_) => {},
            Err(_) => {
                // Silent fallback to DELETE mode for connection consistency
                let _ = conn.query_row("PRAGMA journal_mode = DELETE", [], |row| {
                    let mode: String = row.get(0)?;
                    Ok(mode)
                });
            }
        }
        
        Ok(conn)
    }

    /// Run database migrations
    pub async fn run_migrations(&self) -> Result<()> {
        let conn = self.get_connection()?;
        crate::database::schema::run_migrations(&conn)?;
        Ok(())
    }

    /// Get the database file path
    pub fn get_db_path(&self) -> &PathBuf {
        &self.db_path
    }

    /// Test database connectivity
    pub fn test_connection(&self) -> Result<bool> {
        let conn = self.get_connection()?;
        let result: i32 = conn.query_row("SELECT 1", [], |row| row.get(0))?;
        Ok(result == 1)
    }
}

/// Get the database file path in the app data directory
fn get_database_path() -> Result<PathBuf> {
    let data_dir = data_dir()
        .ok_or_else(|| anyhow::anyhow!("Could not determine data directory"))?;
    
    let app_data_dir = data_dir.join("LibreOllama");
    Ok(app_data_dir.join("database.db"))
}

/// Get or create an encryption key for the database
/// For Phase 2.1, we'll use a fixed key. In production, this should be 
/// securely generated and stored (e.g., using OS keychain)
fn get_or_create_encryption_key() -> Result<String> {
    // For Phase 2.1, use a fixed key for development
    // TODO: In production, implement secure key management
    let key = "libre_ollama_dev_key_2024_phase2";
    
    // Convert to hex format that SQLCipher expects
    Ok(hex::encode(key.as_bytes()))
}

/// Helper function to get a database connection (for use by other modules)
pub fn get_connection() -> Result<Connection> {
    // This is a simplified version that creates a new connection each time
    // In practice, you'd want to use the DatabaseManager instance
    let db_path = get_database_path()?;
    
    let conn = Connection::open_with_flags(
        &db_path,
        OpenFlags::SQLITE_OPEN_READ_WRITE,
    ).context("Failed to open database connection")?;
    
    conn.execute("PRAGMA foreign_keys = ON", [])?;
    
    // Apply the same journal mode fallback strategy
    match conn.query_row("PRAGMA journal_mode = WAL", [], |row| {
        let mode: String = row.get(0)?;
        Ok(mode)
    }) {
        Ok(_) => {},
        Err(_) => {
            // Silent fallback to DELETE mode for connection consistency
            let _ = conn.query_row("PRAGMA journal_mode = DELETE", [], |row| {
                let mode: String = row.get(0)?;
                Ok(mode)
            });
        }
    }
    
    Ok(conn)
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_database_manager_creation() {
        let manager = DatabaseManager::new().await;
        assert!(manager.is_ok());
    }
    
    #[tokio::test]
    async fn test_database_connection() {
        let manager = DatabaseManager::new().await.unwrap();
        let result = manager.test_connection();
        assert!(result.is_ok());
        assert!(result.unwrap());
    }
}