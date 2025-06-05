//! Database schema management for LibreOllama
//!
//! This module handles table creation, migrations, and schema versioning
//! for the encrypted SQLCipher database.

use anyhow::{Context, Result};
use rusqlite::Connection;

/// Current database schema version
const CURRENT_SCHEMA_VERSION: i32 = 4;

/// Run all database migrations to bring the database up to the current schema
pub fn run_migrations(conn: &Connection) -> Result<()> {
    // Create schema_version table if it doesn't exist
    create_schema_version_table(conn)?;
    
    let current_version = get_schema_version(conn)?;
    
    if current_version < CURRENT_SCHEMA_VERSION {
        // Run migrations from current version to latest
        for version in (current_version + 1)..=CURRENT_SCHEMA_VERSION {
            match version {
                1 => run_migration_v1(conn)?,
                2 => super::schema_v2::run_migration_v2(conn)?,
                3 => run_migration_v3(conn)?,
                4 => super::schema_v4::run_migration_v4(conn)?,
                _ => return Err(anyhow::anyhow!("Unknown migration version: {}", version)),
            }
            set_schema_version(conn, version)?;
        }
    }
    
    Ok(())
}

/// Create the schema_version table to track database migrations
fn create_schema_version_table(conn: &Connection) -> Result<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS schema_version (
            version INTEGER PRIMARY KEY,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    ).context("Failed to create schema_version table")?;
    
    // Initialize with version 0 if no version exists
    let version_exists: bool = conn
        .prepare("SELECT EXISTS(SELECT 1 FROM schema_version LIMIT 1)")?
        .query_row([], |row| row.get(0))?;
    
    if !version_exists {
        conn.execute("INSERT INTO schema_version (version) VALUES (0)", [])?;
    }
    
    Ok(())
}

/// Get the current schema version
fn get_schema_version(conn: &Connection) -> Result<i32> {
    let version: i32 = conn
        .prepare("SELECT version FROM schema_version ORDER BY version DESC LIMIT 1")?
        .query_row([], |row| row.get(0))?;
    Ok(version)
}

/// Set the schema version
fn set_schema_version(conn: &Connection, version: i32) -> Result<()> {
    conn.execute(
        "INSERT INTO schema_version (version) VALUES (?1)",
        [version],
    )?;
    Ok(())
}

/// Migration v1: Create initial tables
fn run_migration_v1(conn: &Connection) -> Result<()> {
    // Create chat_sessions table
    conn.execute(
        "CREATE TABLE chat_sessions (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            model_name TEXT,
            agent_id TEXT,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            is_archived BOOLEAN NOT NULL DEFAULT FALSE,
            metadata TEXT,
            FOREIGN KEY (agent_id) REFERENCES agents (id) ON DELETE SET NULL
        )",
        [],
    ).context("Failed to create chat_sessions table")?;

    // Create chat_messages table
    conn.execute(
        "CREATE TABLE chat_messages (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
            content TEXT NOT NULL,
            model_name TEXT,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            metadata TEXT,
            FOREIGN KEY (session_id) REFERENCES chat_sessions (id) ON DELETE CASCADE
        )",
        [],
    ).context("Failed to create chat_messages table")?;

    // Create agents table
    conn.execute(
        "CREATE TABLE agents (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            model_name TEXT NOT NULL,
            system_prompt TEXT,
            temperature REAL,
            max_tokens INTEGER,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            metadata TEXT
        )",
        [],
    ).context("Failed to create agents table")?;

    // Create settings table
    conn.execute(
        "CREATE TABLE settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            description TEXT,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    ).context("Failed to create settings table")?;

    // Create agent_executions table
    conn.execute(
        "CREATE TABLE agent_executions (
            id TEXT PRIMARY KEY,
            agent_id TEXT NOT NULL,
            session_id TEXT,
            input TEXT NOT NULL,
            output TEXT,
            status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
            started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            completed_at DATETIME,
            error_message TEXT,
            metadata TEXT,
            FOREIGN KEY (agent_id) REFERENCES agents (id) ON DELETE CASCADE,
            FOREIGN KEY (session_id) REFERENCES chat_sessions (id) ON DELETE SET NULL
        )",
        [],
    ).context("Failed to create agent_executions table")?;

    // Create indexes for better performance
    create_indexes_v1(conn)?;

    // Insert default settings
    insert_default_settings(conn)?;

    Ok(())
}

/// Create indexes for v1 schema
fn create_indexes_v1(conn: &Connection) -> Result<()> {
    // Indexes for chat_sessions
    conn.execute(
        "CREATE INDEX idx_chat_sessions_created_at ON chat_sessions (created_at DESC)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_chat_sessions_updated_at ON chat_sessions (updated_at DESC)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_chat_sessions_agent_id ON chat_sessions (agent_id)",
        [],
    )?;

    // Indexes for chat_messages
    conn.execute(
        "CREATE INDEX idx_chat_messages_session_id ON chat_messages (session_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_chat_messages_created_at ON chat_messages (created_at)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_chat_messages_role ON chat_messages (role)",
        [],
    )?;

    // Indexes for agents
    conn.execute(
        "CREATE INDEX idx_agents_is_active ON agents (is_active)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_agents_model_name ON agents (model_name)",
        [],
    )?;

    // Indexes for agent_executions
    conn.execute(
        "CREATE INDEX idx_agent_executions_agent_id ON agent_executions (agent_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_agent_executions_session_id ON agent_executions (session_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_agent_executions_status ON agent_executions (status)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_agent_executions_started_at ON agent_executions (started_at DESC)",
        [],
    )?;

    Ok(())
}

/// Insert default application settings
fn insert_default_settings(conn: &Connection) -> Result<()> {
    let default_settings = [
        ("default_model", "llama2", "Default model for new chat sessions"),
        ("max_history_length", "100", "Maximum number of messages to keep in memory"),
        ("auto_save_interval", "30", "Auto-save interval in seconds"),
        ("theme", "system", "UI theme preference (light, dark, system)"),
        ("temperature", "0.7", "Default temperature for model inference"),
        ("max_tokens", "2048", "Default maximum tokens for responses"),
    ];

    for (key, value, description) in default_settings {
        conn.execute(
            "INSERT OR IGNORE INTO settings (key, value, description) VALUES (?1, ?2, ?3)",
            [key, value, description],
        )?;
    }

    Ok(())
}

/// Migration v3: Create tables for folders, notes, MCP servers, and N8N connections
fn run_migration_v3(conn: &Connection) -> Result<()> {
    // Create folders table
    conn.execute(
        "CREATE TABLE folders (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            parent_id TEXT,
            color TEXT,
            user_id TEXT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            metadata TEXT,
            FOREIGN KEY (parent_id) REFERENCES folders (id) ON DELETE CASCADE
        )",
        [],
    ).context("Failed to create folders table")?;

    // Create notes table
    conn.execute(
        "CREATE TABLE notes (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            tags TEXT, -- JSON array of tags
            folder_id TEXT,
            user_id TEXT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            metadata TEXT,
            FOREIGN KEY (folder_id) REFERENCES folders (id) ON DELETE SET NULL
        )",
        [],
    ).context("Failed to create notes table")?;

    // Create mcp_servers table
    conn.execute(
        "CREATE TABLE mcp_servers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            server_type TEXT NOT NULL CHECK (server_type IN ('stdio', 'sse')),
            command TEXT,
            args TEXT, -- JSON array of command arguments
            env TEXT, -- JSON object of environment variables
            url TEXT,
            auth_token TEXT,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            user_id TEXT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            metadata TEXT
        )",
        [],
    ).context("Failed to create mcp_servers table")?;

    // Create n8n_connections table
    conn.execute(
        "CREATE TABLE n8n_connections (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            base_url TEXT NOT NULL,
            api_key TEXT,
            webhook_url TEXT,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            user_id TEXT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            metadata TEXT
        )",
        [],
    ).context("Failed to create n8n_connections table")?;

    // Create indexes for v3 schema
    create_indexes_v3(conn)?;

    Ok(())
}

/// Create indexes for v3 schema
fn create_indexes_v3(conn: &Connection) -> Result<()> {
    // Indexes for folders
    conn.execute(
        "CREATE INDEX idx_folders_user_id ON folders (user_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_folders_parent_id ON folders (parent_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_folders_created_at ON folders (created_at DESC)",
        [],
    )?;

    // Indexes for notes
    conn.execute(
        "CREATE INDEX idx_notes_user_id ON notes (user_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_notes_folder_id ON notes (folder_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_notes_created_at ON notes (created_at DESC)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_notes_updated_at ON notes (updated_at DESC)",
        [],
    )?;

    // Indexes for mcp_servers
    conn.execute(
        "CREATE INDEX idx_mcp_servers_user_id ON mcp_servers (user_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_mcp_servers_is_active ON mcp_servers (is_active)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_mcp_servers_server_type ON mcp_servers (server_type)",
        [],
    )?;

    // Indexes for n8n_connections
    conn.execute(
        "CREATE INDEX idx_n8n_connections_user_id ON n8n_connections (user_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_n8n_connections_is_active ON n8n_connections (is_active)",
        [],
    )?;

    Ok(())
}

/// Verify database schema integrity
pub fn verify_schema(conn: &Connection) -> Result<bool> {
    // Check if all required tables exist
    let required_tables = [
        "schema_version",
        "chat_sessions",
        "chat_messages",
        "agents",
        "settings",
        "agent_executions",
        "folders",
        "notes",
        "mcp_servers",
        "n8n_connections",
        "link_relationships",
        "content_index",
        "link_suggestions",
        "link_analytics",
    ];

    for table in &required_tables {
        let exists: bool = conn
            .prepare(&format!(
                "SELECT EXISTS(SELECT name FROM sqlite_master WHERE type='table' AND name='{}')",
                table
            ))?
            .query_row([], |row| row.get(0))?;

        if !exists {
            return Ok(false);
        }
    }

    // Verify current schema version
    let version = get_schema_version(conn)?;
    Ok(version == CURRENT_SCHEMA_VERSION)
}

/// Get database statistics for monitoring
pub fn get_database_stats(conn: &Connection) -> Result<DatabaseStats> {
    let sessions_count: i32 = conn
        .prepare("SELECT COUNT(*) FROM chat_sessions WHERE is_archived = FALSE")?
        .query_row([], |row| row.get(0))?;

    let messages_count: i32 = conn
        .prepare("SELECT COUNT(*) FROM chat_messages")?
        .query_row([], |row| row.get(0))?;

    let agents_count: i32 = conn
        .prepare("SELECT COUNT(*) FROM agents WHERE is_active = TRUE")?
        .query_row([], |row| row.get(0))?;

    let executions_count: i32 = conn
        .prepare("SELECT COUNT(*) FROM agent_executions")?
        .query_row([], |row| row.get(0))?;

    Ok(DatabaseStats {
        active_sessions: sessions_count,
        total_messages: messages_count,
        active_agents: agents_count,
        total_executions: executions_count,
        schema_version: get_schema_version(conn)?,
    })
}

/// Database statistics structure
#[derive(Debug)]
pub struct DatabaseStats {
    pub active_sessions: i32,
    pub total_messages: i32,
    pub active_agents: i32,
    pub total_executions: i32,
    pub schema_version: i32,
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    #[test]
    fn test_schema_creation() {
        let conn = Connection::open_in_memory().unwrap();
        run_migrations(&conn).unwrap();
        assert!(verify_schema(&conn).unwrap());
    }

    #[test]
    fn test_database_stats() {
        let conn = Connection::open_in_memory().unwrap();
        run_migrations(&conn).unwrap();
        let stats = get_database_stats(&conn).unwrap();
        assert_eq!(stats.schema_version, CURRENT_SCHEMA_VERSION);
    }
}