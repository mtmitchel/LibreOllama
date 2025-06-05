//! Database schema v2 for Phase 3.3 advanced features
//!
//! This module extends the schema to support context management,
//! chat templates, performance metrics, and advanced features.

use anyhow::{Context, Result};
use rusqlite::Connection;

/// Current database schema version
const CURRENT_SCHEMA_VERSION: i32 = 2;

/// Run migration from v1 to v2
pub fn run_migration_v2(conn: &Connection) -> Result<()> {
    // Create conversation_context table for memory management
    conn.execute(
        "CREATE TABLE conversation_context (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            context_window_size INTEGER NOT NULL DEFAULT 4096,
            context_summary TEXT,
            token_count INTEGER NOT NULL DEFAULT 0,
            last_updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES chat_sessions (id) ON DELETE CASCADE
        )",
        [],
    ).context("Failed to create conversation_context table")?;

    // Create chat_templates table
    conn.execute(
        "CREATE TABLE chat_templates (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            system_message TEXT,
            initial_prompts TEXT, -- JSON array of prompts
            model_config TEXT, -- JSON config (temperature, max_tokens, etc.)
            is_default BOOLEAN NOT NULL DEFAULT FALSE,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            usage_count INTEGER NOT NULL DEFAULT 0
        )",
        [],
    ).context("Failed to create chat_templates table")?;

    // Create conversation_branches table for forking conversations
    conn.execute(
        "CREATE TABLE conversation_branches (
            id TEXT PRIMARY KEY,
            parent_session_id TEXT NOT NULL,
            branch_session_id TEXT NOT NULL,
            branch_point_message_id TEXT NOT NULL,
            branch_name TEXT,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (parent_session_id) REFERENCES chat_sessions (id) ON DELETE CASCADE,
            FOREIGN KEY (branch_session_id) REFERENCES chat_sessions (id) ON DELETE CASCADE,
            FOREIGN KEY (branch_point_message_id) REFERENCES chat_messages (id) ON DELETE CASCADE
        )",
        [],
    ).context("Failed to create conversation_branches table")?;

    // Create performance_metrics table
    conn.execute(
        "CREATE TABLE performance_metrics (
            id TEXT PRIMARY KEY,
            metric_type TEXT NOT NULL, -- 'response_time', 'token_generation_rate', 'memory_usage'
            metric_value REAL NOT NULL,
            session_id TEXT,
            model_name TEXT,
            timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            metadata TEXT, -- JSON for additional context
            FOREIGN KEY (session_id) REFERENCES chat_sessions (id) ON DELETE SET NULL
        )",
        [],
    ).context("Failed to create performance_metrics table")?;

    // Create model_analytics table
    conn.execute(
        "CREATE TABLE model_analytics (
            id TEXT PRIMARY KEY,
            model_name TEXT NOT NULL,
            total_requests INTEGER NOT NULL DEFAULT 0,
            total_tokens_generated INTEGER NOT NULL DEFAULT 0,
            average_response_time REAL NOT NULL DEFAULT 0.0,
            last_used DATETIME,
            performance_score REAL DEFAULT 0.0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    ).context("Failed to create model_analytics table")?;

    // Create request_cache table for performance optimization
    conn.execute(
        "CREATE TABLE request_cache (
            id TEXT PRIMARY KEY,
            request_hash TEXT NOT NULL UNIQUE,
            model_name TEXT NOT NULL,
            prompt_text TEXT NOT NULL,
            response_text TEXT NOT NULL,
            response_metadata TEXT, -- JSON metadata
            hit_count INTEGER NOT NULL DEFAULT 1,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            last_accessed DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME
        )",
        [],
    ).context("Failed to create request_cache table")?;

    // Create application_logs table
    conn.execute(
        "CREATE TABLE application_logs (
            id TEXT PRIMARY KEY,
            log_level TEXT NOT NULL CHECK (log_level IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL')),
            message TEXT NOT NULL,
            component TEXT,
            session_id TEXT,
            error_code TEXT,
            stack_trace TEXT,
            metadata TEXT, -- JSON for additional context
            timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES chat_sessions (id) ON DELETE SET NULL
        )",
        [],
    ).context("Failed to create application_logs table")?;

    // Create user_preferences table
    conn.execute(
        "CREATE TABLE user_preferences (
            id TEXT PRIMARY KEY,
            preference_key TEXT NOT NULL UNIQUE,
            preference_value TEXT NOT NULL,
            preference_type TEXT NOT NULL CHECK (preference_type IN ('string', 'number', 'boolean', 'json')),
            description TEXT,
            is_system BOOLEAN NOT NULL DEFAULT FALSE,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    ).context("Failed to create user_preferences table")?;

    // Add new columns to existing tables
    
    // Add context tracking to chat_sessions
    conn.execute(
        "ALTER TABLE chat_sessions ADD COLUMN context_id TEXT REFERENCES conversation_context(id)",
        [],
    ).context("Failed to add context_id to chat_sessions")?;

    conn.execute(
        "ALTER TABLE chat_sessions ADD COLUMN template_id TEXT REFERENCES chat_templates(id)",
        [],
    ).context("Failed to add template_id to chat_sessions")?;

    conn.execute(
        "ALTER TABLE chat_sessions ADD COLUMN system_message TEXT",
        [],
    ).context("Failed to add system_message to chat_sessions")?;

    conn.execute(
        "ALTER TABLE chat_sessions ADD COLUMN pinned BOOLEAN NOT NULL DEFAULT FALSE",
        [],
    ).context("Failed to add pinned to chat_sessions")?;

    // Add performance tracking to chat_messages
    conn.execute(
        "ALTER TABLE chat_messages ADD COLUMN response_time_ms INTEGER",
        [],
    ).context("Failed to add response_time_ms to chat_messages")?;

    conn.execute(
        "ALTER TABLE chat_messages ADD COLUMN token_count INTEGER",
        [],
    ).context("Failed to add token_count to chat_messages")?;

    conn.execute(
        "ALTER TABLE chat_messages ADD COLUMN cached BOOLEAN NOT NULL DEFAULT FALSE",
        [],
    ).context("Failed to add cached to chat_messages")?;

    // Create indexes for v2 schema
    create_indexes_v2(conn)?;

    // Insert default templates and preferences
    insert_default_templates(conn)?;
    insert_default_preferences(conn)?;

    Ok(())
}

/// Create indexes for v2 schema
fn create_indexes_v2(conn: &Connection) -> Result<()> {
    // Indexes for conversation_context
    conn.execute(
        "CREATE INDEX idx_conversation_context_session_id ON conversation_context (session_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_conversation_context_last_updated ON conversation_context (last_updated DESC)",
        [],
    )?;

    // Indexes for chat_templates
    conn.execute(
        "CREATE INDEX idx_chat_templates_is_active ON chat_templates (is_active)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_chat_templates_usage_count ON chat_templates (usage_count DESC)",
        [],
    )?;

    // Indexes for conversation_branches
    conn.execute(
        "CREATE INDEX idx_conversation_branches_parent ON conversation_branches (parent_session_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_conversation_branches_branch ON conversation_branches (branch_session_id)",
        [],
    )?;

    // Indexes for performance_metrics
    conn.execute(
        "CREATE INDEX idx_performance_metrics_type ON performance_metrics (metric_type)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_performance_metrics_timestamp ON performance_metrics (timestamp DESC)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_performance_metrics_session ON performance_metrics (session_id)",
        [],
    )?;

    // Indexes for model_analytics
    conn.execute(
        "CREATE INDEX idx_model_analytics_model_name ON model_analytics (model_name)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_model_analytics_performance ON model_analytics (performance_score DESC)",
        [],
    )?;

    // Indexes for request_cache
    conn.execute(
        "CREATE INDEX idx_request_cache_hash ON request_cache (request_hash)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_request_cache_model ON request_cache (model_name)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_request_cache_expires ON request_cache (expires_at)",
        [],
    )?;

    // Indexes for application_logs
    conn.execute(
        "CREATE INDEX idx_application_logs_level ON application_logs (log_level)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_application_logs_timestamp ON application_logs (timestamp DESC)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_application_logs_component ON application_logs (component)",
        [],
    )?;

    // Indexes for user_preferences
    conn.execute(
        "CREATE INDEX idx_user_preferences_key ON user_preferences (preference_key)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_user_preferences_system ON user_preferences (is_system)",
        [],
    )?;

    Ok(())
}

/// Insert default chat templates
fn insert_default_templates(conn: &Connection) -> Result<()> {
    let default_templates = [
        (
            "general_assistant",
            "General Assistant",
            "A helpful and knowledgeable assistant",
            "You are a helpful, harmless, and honest AI assistant. Provide clear, accurate, and helpful responses.",
            r#"["How can I help you today?", "What would you like to know?", "Feel free to ask me anything!"]"#,
            r#"{"temperature": 0.7, "max_tokens": 2048, "top_p": 0.9}"#,
            true
        ),
        (
            "code_assistant",
            "Code Assistant",
            "Specialized assistant for programming and development",
            "You are an expert programming assistant. Help with code, debugging, best practices, and technical questions. Always provide clear explanations and working examples.",
            r#"["Help me with my code", "Explain this programming concept", "Review my implementation"]"#,
            r#"{"temperature": 0.3, "max_tokens": 4096, "top_p": 0.95}"#,
            false
        ),
        (
            "creative_writer",
            "Creative Writer",
            "Assistant for creative writing and storytelling",
            "You are a creative writing assistant. Help with storytelling, character development, plot ideas, and creative expression. Be imaginative and inspiring.",
            r#"["Help me write a story", "Develop this character", "Give me plot ideas"]"#,
            r#"{"temperature": 0.9, "max_tokens": 3072, "top_p": 0.9}"#,
            false
        ),
        (
            "research_assistant",
            "Research Assistant",
            "Assistant for research and analysis tasks",
            "You are a thorough research assistant. Help with finding information, analyzing data, summarizing content, and providing well-researched insights.",
            r#"["Research this topic", "Analyze these findings", "Summarize this information"]"#,
            r#"{"temperature": 0.4, "max_tokens": 3072, "top_p": 0.9}"#,
            false
        ),
    ];

    for (id, name, description, system_message, initial_prompts, model_config, is_default) in default_templates {
        conn.execute(
            "INSERT OR IGNORE INTO chat_templates (id, name, description, system_message, initial_prompts, model_config, is_default) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            [id, name, description, system_message, initial_prompts, model_config, &is_default.to_string()],
        )?;
    }

    Ok(())
}

/// Insert default user preferences
fn insert_default_preferences(conn: &Connection) -> Result<()> {
    let default_preferences = [
        ("auto_save_interval", "30", "number", "Auto-save interval in seconds", true),
        ("max_context_tokens", "4096", "number", "Maximum context window size in tokens", true),
        ("enable_caching", "true", "boolean", "Enable response caching for performance", true),
        ("cache_expiry_hours", "24", "number", "Cache expiry time in hours", true),
        ("enable_analytics", "true", "boolean", "Enable usage analytics collection", true),
        ("max_log_entries", "10000", "number", "Maximum number of log entries to keep", true),
        ("log_level", "INFO", "string", "Application log level", true),
        ("theme", "system", "string", "UI theme preference", false),
        ("default_model", "llama2", "string", "Default model for new sessions", false),
        ("streaming_enabled", "true", "boolean", "Enable streaming responses by default", false),
        ("show_token_count", "true", "boolean", "Show token count in messages", false),
        ("enable_context_summary", "true", "boolean", "Enable automatic context summarization", false),
        ("context_summary_threshold", "8192", "number", "Token threshold for context summarization", false),
    ];

    for (key, value, pref_type, description, is_system) in default_preferences {
        conn.execute(
            "INSERT OR IGNORE INTO user_preferences (id, preference_key, preference_value, preference_type, description, is_system) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            [&format!("pref_{}", key), key, value, pref_type, description, &is_system.to_string()],
        )?;
    }

    Ok(())
}