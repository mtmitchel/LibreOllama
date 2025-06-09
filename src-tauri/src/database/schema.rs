//! Database schema management and migrations
//!
//! This module handles database schema creation and version management

use anyhow::{Context, Result};
use rusqlite::Connection;

/// Run all database migrations
pub fn run_migrations(conn: &Connection) -> Result<()> {
    // Create schema version table if it doesn't exist
    conn.execute(
        "CREATE TABLE IF NOT EXISTS schema_version (
            version INTEGER PRIMARY KEY,
            applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    ).context("Failed to create schema_version table")?;

    // Get current schema version
    let current_version: i32 = conn
        .query_row(
            "SELECT COALESCE(MAX(version), 0) FROM schema_version",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    // Run migrations based on current version
    if current_version < 1 {
        run_migration_v1(conn)?;
        record_migration(conn, 1)?;
    }
    
    if current_version < 2 {
        run_migration_v2(conn)?;
        record_migration(conn, 2)?;
    }
    
    if current_version < 3 {
        run_migration_v3(conn)?;
        record_migration(conn, 3)?;
    }
    
    if current_version < 4 {
        crate::database::schema_v4::run_migration_v4(conn)?;
        record_migration(conn, 4)?;
    }

    Ok(())
}

/// Record that a migration has been applied
fn record_migration(conn: &Connection, version: i32) -> Result<()> {
    conn.execute(
        "INSERT INTO schema_version (version) VALUES (?1)",
        [version],
    )?;
    Ok(())
}

/// Run migration v1 - Basic tables
fn run_migration_v1(conn: &Connection) -> Result<()> {
    // Create chat_sessions table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS chat_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            session_name TEXT NOT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL
        )",
        [],
    ).context("Failed to create chat_sessions table")?;

    // Create chat_messages table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME NOT NULL,
            FOREIGN KEY (session_id) REFERENCES chat_sessions(id)
        )",
        [],
    ).context("Failed to create chat_messages table")?;

    // Create indexes
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id)",
        [],
    )?;

    Ok(())
}

/// Run migration v2 - Add advanced features tables
fn run_migration_v2(conn: &Connection) -> Result<()> {
    // Create agents table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS agents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            system_prompt TEXT NOT NULL,
            capabilities TEXT NOT NULL,
            parameters TEXT NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT 1,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL
        )",
        [],
    ).context("Failed to create agents table")?;

    // Create folders table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS folders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            folder_name TEXT NOT NULL,
            parent_id INTEGER,
            user_id TEXT NOT NULL,
            color TEXT,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            FOREIGN KEY (parent_id) REFERENCES folders(id)
        )",
        [],
    ).context("Failed to create folders table")?;

    // Create notes table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            user_id TEXT NOT NULL,
            tags TEXT,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL
        )",
        [],
    ).context("Failed to create notes table")?;

    // Create mcp_servers table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS mcp_servers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            url TEXT NOT NULL,
            api_key TEXT,
            configuration TEXT NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT 1,
            user_id TEXT NOT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL
        )",
        [],
    ).context("Failed to create mcp_servers table")?;

    // Create n8n_connections table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS n8n_connections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            webhook_url TEXT NOT NULL,
            api_key TEXT,
            workflow_id TEXT NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT 1,
            user_id TEXT NOT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL
        )",
        [],
    ).context("Failed to create n8n_connections table")?;

    Ok(())
}

/// Run migration v3 - Add advanced feature tables
fn run_migration_v3(conn: &Connection) -> Result<()> {
    // Create conversation_contexts table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS conversation_contexts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            context_name TEXT NOT NULL UNIQUE,
            context_data TEXT NOT NULL,
            context_window_size INTEGER NOT NULL,
            context_summary TEXT
        )",
        [],
    ).context("Failed to create conversation_contexts table")?;

    // Create chat_templates table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS chat_templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            template_name TEXT NOT NULL,
            template_content TEXT NOT NULL
        )",
        [],
    ).context("Failed to create chat_templates table")?;

    // Create user_preferences table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS user_preferences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            preference_key TEXT NOT NULL UNIQUE,
            preference_value TEXT NOT NULL,
            preference_type_name TEXT NOT NULL
        )",
        [],
    ).context("Failed to create user_preferences table")?;

    // Create application_logs table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS application_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            log_level TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at DATETIME NOT NULL
        )",
        [],
    ).context("Failed to create application_logs table")?;

    // Create performance_metrics table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS performance_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            metric_type TEXT NOT NULL,
            value REAL NOT NULL,
            timestamp DATETIME NOT NULL,
            metadata TEXT
        )",
        [],
    ).context("Failed to create performance_metrics table")?;

    // Create request_cache table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS request_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            request_hash TEXT NOT NULL UNIQUE,
            response_body TEXT NOT NULL,
            created_at DATETIME NOT NULL
        )",
        [],
    ).context("Failed to create request_cache table")?;

    Ok(())
}
