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
        run_migration_v4(conn)?;
        record_migration(conn, 4)?;
    }
    
    if current_version < 5 {
        run_migration_v5(conn)?;
        record_migration(conn, 5)?;
    }
    
    if current_version < 6 {
        run_migration_v6(conn)?;
        record_migration(conn, 6)?;
    }
    
    if current_version < 7 {
        run_migration_v7(conn)?;
        record_migration(conn, 7)?;
    }
    
    if current_version < 8 {
        run_migration_v8(conn)?;
        record_migration(conn, 8)?;
    }
    
    if current_version < 9 {
        run_migration_v9(conn)?;
        record_migration(conn, 9)?;
    }
    
    if current_version < 10 {
        run_migration_v10(conn)?;
        record_migration(conn, 10)?;
    }
    
    if current_version < 11 {
        println!("Running migration v11 to create task metadata tables...");
        run_migration_v11(conn)?;
        record_migration(conn, 11)?;
        println!("Migration v11 completed successfully");
    }
    
    if current_version < 12 {
        println!("Running migration v12 to fix task metadata schema...");
        run_migration_v12(conn)?;
        record_migration(conn, 12)?;
        println!("Migration v12 completed successfully");
    }
    
    if current_version < 13 {
        println!("Running migration v13 to add task_id_map for stable local IDs...");
        crate::database::schema_v13::run_migration_v13(conn)?;
        record_migration(conn, 13)?;
        println!("Migration v13 completed successfully");
    }
    
    if current_version < 14 {
        println!("Running migration v14 to simplify labels storage as JSON...");
        crate::database::schema_v14::run_migration_v14(conn)?;
        record_migration(conn, 14)?;
        println!("Migration v14 completed successfully");
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

/// Run migration v4 - Placeholder for archived migration
/// This migration was previously implemented in a separate file that has been archived.
/// Database tables it created are already present in existing databases.
fn run_migration_v4(_conn: &Connection) -> Result<()> {
    // This migration was previously implemented in schema_v4.rs
    // Since it's been archived and existing databases already have these changes,
    // we provide a no-op placeholder to maintain migration version consistency
    Ok(())
}

/// Run migration v5 - Placeholder for archived migration
/// This migration was previously implemented in a separate file that has been archived.
/// Database tables it created are already present in existing databases.
fn run_migration_v5(_conn: &Connection) -> Result<()> {
    // This migration was previously implemented in schema_v5.rs
    // Since it's been archived and existing databases already have these changes,
    // we provide a no-op placeholder to maintain migration version consistency
    Ok(())
}

/// Run migration v6 - Add secure Gmail accounts table
fn run_migration_v6(conn: &Connection) -> Result<()> {
    // Create secure Gmail accounts table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS gmail_accounts_secure (
            id TEXT PRIMARY KEY,
            email_address TEXT NOT NULL,
            display_name TEXT,
            profile_picture_url TEXT,
            access_token_encrypted TEXT NOT NULL,
            refresh_token_encrypted TEXT,
            token_expires_at TEXT,
            scopes TEXT NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT 1,
            last_sync_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            user_id TEXT NOT NULL,
            requires_reauth BOOLEAN DEFAULT 0,
            UNIQUE(email_address, user_id)
        )",
        [],
    ).context("Failed to create gmail_accounts_secure table")?;

    // Create index for efficient lookups
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_gmail_accounts_secure_user_id ON gmail_accounts_secure(user_id)",
        [],
    ).context("Failed to create index on gmail_accounts_secure")?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_gmail_accounts_secure_email ON gmail_accounts_secure(email_address)",
        [],
    ).context("Failed to create index on gmail_accounts_secure email")?;

    Ok(())
}

/// Run migration v7 - Drop and recreate chat_sessions and agents tables
fn run_migration_v7(conn: &Connection) -> Result<()> {
    // Temporarily disable foreign keys
    conn.execute("PRAGMA foreign_keys = OFF", []).context("Failed to disable foreign keys")?;
    
    // Drop existing tables (including dependent tables first)
    conn.execute("DROP TABLE IF EXISTS chat_messages", []).context("Failed to drop chat_messages table")?;
    conn.execute("DROP TABLE IF EXISTS chat_sessions", []).context("Failed to drop chat_sessions table")?;
    conn.execute("DROP TABLE IF EXISTS agents", []).context("Failed to drop agents table")?;

    // Recreate chat_sessions table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS chat_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            session_name TEXT NOT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL
        )",
        [],
    ).context("Failed to recreate chat_sessions table")?;

    // Recreate agents table
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
    ).context("Failed to recreate agents table")?;

    // Recreate chat_messages table
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
    ).context("Failed to recreate chat_messages table")?;

    // Recreate indexes
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id)",
        [],
    ).context("Failed to recreate index on chat_sessions")?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id)",
        [],
    ).context("Failed to recreate index on chat_messages")?;

    // Re-enable foreign keys
    conn.execute("PRAGMA foreign_keys = ON", []).context("Failed to re-enable foreign keys")?;

    Ok(())
}

/// Run migration v9 - Update agents table to match model structure
fn run_migration_v9(conn: &Connection) -> Result<()> {
    // Temporarily disable foreign keys
    conn.execute("PRAGMA foreign_keys = OFF", []).context("Failed to disable foreign keys")?;
    
    // Drop existing tables to ensure clean recreation
    conn.execute("DROP TABLE IF EXISTS agents", []).context("Failed to drop agents table")?;
    conn.execute("DROP TABLE IF EXISTS messages", []).context("Failed to drop messages table")?;
    conn.execute("DROP TABLE IF EXISTS chat_sessions", []).context("Failed to drop chat_sessions table")?;
    conn.execute("DROP TABLE IF EXISTS chat_messages", []).context("Failed to drop chat_messages table")?;
    
    // Create agents table with correct model structure
    conn.execute(
        "CREATE TABLE agents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            model_name TEXT NOT NULL DEFAULT 'llama3.2:latest',
            system_prompt TEXT,
            temperature REAL DEFAULT 0.7,
            max_tokens INTEGER DEFAULT 2048,
            is_active BOOLEAN DEFAULT true,
            capabilities TEXT, -- JSON array
            parameters TEXT, -- JSON object
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    ).context("Failed to create agents table")?;
    
    // Create agent_executions table
    conn.execute(
        "CREATE TABLE agent_executions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            agent_id INTEGER NOT NULL,
            session_id INTEGER,
            input TEXT NOT NULL,
            output TEXT,
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
            error_message TEXT,
            executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (agent_id) REFERENCES agents (id),
            FOREIGN KEY (session_id) REFERENCES chat_sessions (id)
        )",
        [],
    ).context("Failed to create agent_executions table")?;
    
    // Create chat_sessions table with correct model structure
    conn.execute(
        "CREATE TABLE chat_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            session_name TEXT,
            user_id TEXT,
            agent_id INTEGER,
            context_length INTEGER DEFAULT 4096,
            is_active BOOLEAN DEFAULT true,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (agent_id) REFERENCES agents (id)
        )",
        [],
    ).context("Failed to create chat_sessions table")?;
    
    // Create messages table with correct model structure
    conn.execute(
        "CREATE TABLE messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
            content TEXT NOT NULL,
            token_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES chat_sessions (id)
        )",
        [],
    ).context("Failed to create messages table")?;
    
    // Create chat_messages table (for backwards compatibility)
    conn.execute(
        "CREATE TABLE chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            token_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES chat_sessions (id)
        )",
        [],
    ).context("Failed to create chat_messages table")?;
    
    // Create indexes
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_messages_session_timestamp ON messages (session_id, created_at)",
        [],
    ).context("Failed to create messages index")?;
    
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_chat_sessions_agent ON chat_sessions (agent_id)",
        [],
    ).context("Failed to create chat_sessions index")?;
    
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages (session_id)",
        [],
    ).context("Failed to create chat_messages index")?;
    
    // Re-enable foreign keys
    conn.execute("PRAGMA foreign_keys = ON", []).context("Failed to re-enable foreign keys")?;

    Ok(())
}

/// Run migration v8 - Fix folders table column name and recreate notes table
fn run_migration_v8(conn: &Connection) -> Result<()> {
    // Temporarily disable foreign keys
    conn.execute("PRAGMA foreign_keys = OFF", []).context("Failed to disable foreign keys")?;
    
    // Drop existing tables to ensure clean recreation
    conn.execute("DROP TABLE IF EXISTS folders", []).context("Failed to drop folders table")?;
    conn.execute("DROP TABLE IF EXISTS notes", []).context("Failed to drop notes table")?;
    
    // Create folders table with correct schema
    conn.execute(
        "CREATE TABLE folders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            parent_id INTEGER,
            user_id TEXT NOT NULL,
            color TEXT,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            FOREIGN KEY (parent_id) REFERENCES folders(id)
        )",
        [],
    ).context("Failed to create folders table")?;
    
    // Create notes table with proper structure
    conn.execute(
        "CREATE TABLE notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            user_id TEXT NOT NULL,
            folder_id INTEGER,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            FOREIGN KEY (folder_id) REFERENCES folders(id)
        )",
        [],
    ).context("Failed to create notes table")?;
    
    // Create indexes
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id)",
        [],
    ).context("Failed to create folders index")?;
    
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id)",
        [],
    ).context("Failed to create folders parent index")?;
    
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id)",
        [],
    ).context("Failed to create notes index")?;
    
    // Re-enable foreign keys
    conn.execute("PRAGMA foreign_keys = ON", []).context("Failed to re-enable foreign keys")?;

    Ok(())
}

/// Run migration v10 - Add project tables
fn run_migration_v10(conn: &Connection) -> Result<()> {
    // Create projects table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            color TEXT NOT NULL DEFAULT '#3b82f6',
            status TEXT NOT NULL DEFAULT 'active',
            progress INTEGER NOT NULL DEFAULT 0,
            priority TEXT NOT NULL DEFAULT 'medium',
            user_id TEXT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    ).context("Failed to create projects table")?;

    // Create project_goals table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS project_goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            completed BOOLEAN NOT NULL DEFAULT 0,
            priority TEXT NOT NULL DEFAULT 'medium',
            due_date DATETIME,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )",
        [],
    ).context("Failed to create project_goals table")?;

    // Create project_assets table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS project_assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            asset_type TEXT NOT NULL,
            url TEXT NOT NULL,
            size INTEGER,
            metadata TEXT,
            uploaded_by TEXT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )",
        [],
    ).context("Failed to create project_assets table")?;

    // Create indexes for better performance
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id)",
        [],
    ).context("Failed to create projects user_id index")?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_project_goals_project_id ON project_goals(project_id)",
        [],
    ).context("Failed to create project_goals project_id index")?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_project_assets_project_id ON project_assets(project_id)",
        [],
    ).context("Failed to create project_assets project_id index")?;

    Ok(())
}

/// Run migration v11 - Add task metadata tables and timeBlock support
fn run_migration_v11(conn: &Connection) -> Result<()> {
    // Create task_metadata table if it doesn't exist
    conn.execute(
        "CREATE TABLE IF NOT EXISTS task_metadata (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            google_task_id TEXT NOT NULL UNIQUE,
            task_list_id TEXT NOT NULL,
            priority TEXT NOT NULL DEFAULT 'normal',
            time_block TEXT,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    ).context("Failed to create task_metadata table")?;

    // Create labels table if it doesn't exist
    conn.execute(
        "CREATE TABLE IF NOT EXISTS labels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            color TEXT,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    ).context("Failed to create labels table")?;

    // Create task_labels junction table if it doesn't exist
    conn.execute(
        "CREATE TABLE IF NOT EXISTS task_labels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_metadata_id INTEGER NOT NULL,
            label_id INTEGER NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (task_metadata_id) REFERENCES task_metadata(id) ON DELETE CASCADE,
            FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE,
            UNIQUE(task_metadata_id, label_id)
        )",
        [],
    ).context("Failed to create task_labels table")?;

    // Create subtasks table if it doesn't exist
    conn.execute(
        "CREATE TABLE IF NOT EXISTS subtasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_metadata_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            completed BOOLEAN NOT NULL DEFAULT 0,
            position INTEGER NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (task_metadata_id) REFERENCES task_metadata(id) ON DELETE CASCADE
        )",
        [],
    ).context("Failed to create subtasks table")?;

    // Create indexes for better performance
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_task_metadata_google_task_id ON task_metadata(google_task_id)",
        [],
    ).context("Failed to create task_metadata index")?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_task_labels_metadata_id ON task_labels(task_metadata_id)",
        [],
    ).context("Failed to create task_labels index")?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_subtasks_metadata_id ON subtasks(task_metadata_id)",
        [],
    ).context("Failed to create subtasks index")?;

    Ok(())
}

/// Run migration v12 - Fix task metadata schema and ensure all related tables exist
fn run_migration_v12(conn: &Connection) -> Result<()> {
    // First ensure all the supporting tables exist
    
    // Create labels table if it doesn't exist
    conn.execute(
        "CREATE TABLE IF NOT EXISTS labels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            color TEXT,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    ).context("Failed to create labels table")?;

    // Create task_labels junction table if it doesn't exist
    conn.execute(
        "CREATE TABLE IF NOT EXISTS task_labels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_metadata_id INTEGER NOT NULL,
            label_id INTEGER NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (task_metadata_id) REFERENCES task_metadata(id) ON DELETE CASCADE,
            FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE,
            UNIQUE(task_metadata_id, label_id)
        )",
        [],
    ).context("Failed to create task_labels table")?;

    // Create subtasks table if it doesn't exist
    conn.execute(
        "CREATE TABLE IF NOT EXISTS subtasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_metadata_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            completed BOOLEAN NOT NULL DEFAULT 0,
            position INTEGER NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (task_metadata_id) REFERENCES task_metadata(id) ON DELETE CASCADE
        )",
        [],
    ).context("Failed to create subtasks table")?;
    
    // Now handle the task_metadata table migration
    // Check if the old schema exists
    let table_exists: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='task_metadata'",
            [],
            |row| {
                let count: i32 = row.get(0)?;
                Ok(count > 0)
            },
        )
        .unwrap_or(false);

    if table_exists {
        // Check if we have the old schema (with google_list_id)
        let has_old_schema: bool = conn
            .query_row(
                "SELECT sql FROM sqlite_master WHERE type='table' AND name='task_metadata'",
                [],
                |row| {
                    let sql: String = row.get(0)?;
                    Ok(sql.contains("google_list_id"))
                },
            )
            .unwrap_or(false);

        if has_old_schema {
            println!("Detected old task_metadata schema, migrating...");
            
            // Create a new table with the correct schema
            conn.execute(
                "CREATE TABLE task_metadata_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    google_task_id TEXT NOT NULL UNIQUE,
                    task_list_id TEXT NOT NULL,
                    priority TEXT NOT NULL DEFAULT 'normal',
                    time_block TEXT,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                )",
                [],
            ).context("Failed to create new task_metadata table")?;

            // Copy data from old table to new table
            conn.execute(
                "INSERT INTO task_metadata_new (id, google_task_id, task_list_id, priority, created_at, updated_at)
                 SELECT id, google_task_id, google_list_id, COALESCE(priority, 'normal'), created_at, updated_at
                 FROM task_metadata",
                [],
            ).context("Failed to copy data to new table")?;

            // Drop the old table
            conn.execute("DROP TABLE task_metadata", [])
                .context("Failed to drop old task_metadata table")?;

            // Rename the new table
            conn.execute("ALTER TABLE task_metadata_new RENAME TO task_metadata", [])
                .context("Failed to rename new table")?;

            // Recreate indexes
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_task_metadata_google_task_id ON task_metadata(google_task_id)",
                [],
            ).context("Failed to create task_metadata index")?;
            
            println!("Successfully migrated task_metadata table to new schema with time_block support");
        } else {
            // Table exists with correct schema, just ensure time_block column exists
            let has_time_block: bool = conn
                .query_row(
                    "SELECT sql FROM sqlite_master WHERE type='table' AND name='task_metadata'",
                    [],
                    |row| {
                        let sql: String = row.get(0)?;
                        Ok(sql.contains("time_block"))
                    },
                )
                .unwrap_or(false);

            if !has_time_block {
                // Add time_block column if it doesn't exist
                conn.execute(
                    "ALTER TABLE task_metadata ADD COLUMN time_block TEXT",
                    [],
                ).context("Failed to add time_block column")?;
                println!("Added time_block column to task_metadata table");
            }
        }
    }

    Ok(())
}
