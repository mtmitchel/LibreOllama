//! Database schema v4 for bidirectional linking system
//!
//! This module adds tables for storing and managing bidirectional links
//! between notes, tasks, chats, and other content types.

use anyhow::{Context, Result};
use rusqlite::Connection;

/// Run migration from v3 to v4 - Add bidirectional linking tables
pub fn run_migration_v4(conn: &Connection) -> Result<()> {
    // Create link_relationships table for storing bidirectional links
    conn.execute(
        "CREATE TABLE link_relationships (
            id TEXT PRIMARY KEY,
            source_id TEXT NOT NULL,
            source_type TEXT NOT NULL CHECK (source_type IN ('note', 'task', 'chat', 'chat_session')),
            target_id TEXT NOT NULL,
            target_type TEXT NOT NULL CHECK (target_type IN ('note', 'task', 'chat', 'chat_session')),
            link_text TEXT NOT NULL,
            context_snippet TEXT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            user_id TEXT NOT NULL
        )",
        [],
    ).context("Failed to create link_relationships table")?;

    // Create content_index table for fast link resolution and search
    conn.execute(
        "CREATE TABLE content_index (
            id TEXT PRIMARY KEY,
            content_id TEXT NOT NULL,
            content_type TEXT NOT NULL CHECK (content_type IN ('note', 'task', 'chat', 'chat_session')),
            title TEXT NOT NULL,
            content_text TEXT NOT NULL,
            tags TEXT, -- JSON array of tags
            links TEXT, -- JSON array of normalized link targets
            last_indexed DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            user_id TEXT NOT NULL
        )",
        [],
    ).context("Failed to create content_index table")?;

    // Create link_suggestions table for caching auto-complete suggestions
    conn.execute(
        "CREATE TABLE link_suggestions (
            id TEXT PRIMARY KEY,
            partial_text TEXT NOT NULL,
            target_id TEXT NOT NULL,
            target_type TEXT NOT NULL CHECK (target_type IN ('note', 'task', 'chat', 'chat_session')),
            target_title TEXT NOT NULL,
            relevance_score REAL NOT NULL DEFAULT 0.0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            user_id TEXT NOT NULL
        )",
        [],
    ).context("Failed to create link_suggestions table")?;

    // Create link_analytics table for tracking link usage and performance
    conn.execute(
        "CREATE TABLE link_analytics (
            id TEXT PRIMARY KEY,
            link_id TEXT NOT NULL,
            action_type TEXT NOT NULL CHECK (action_type IN ('created', 'clicked', 'updated', 'deleted')),
            user_id TEXT NOT NULL,
            session_id TEXT,
            timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            metadata TEXT, -- JSON for additional context
            FOREIGN KEY (link_id) REFERENCES link_relationships (id) ON DELETE CASCADE,
            FOREIGN KEY (session_id) REFERENCES chat_sessions (id) ON DELETE SET NULL
        )",
        [],
    ).context("Failed to create link_analytics table")?;

    // Add linking-related columns to existing tables
    
    // Add link tracking to notes
    conn.execute(
        "ALTER TABLE notes ADD COLUMN outgoing_links_count INTEGER NOT NULL DEFAULT 0",
        [],
    ).context("Failed to add outgoing_links_count to notes")?;

    conn.execute(
        "ALTER TABLE notes ADD COLUMN incoming_links_count INTEGER NOT NULL DEFAULT 0",
        [],
    ).context("Failed to add incoming_links_count to notes")?;

    conn.execute(
        "ALTER TABLE notes ADD COLUMN last_linked DATETIME",
        [],
    ).context("Failed to add last_linked to notes")?;

    // Add link tracking to chat_sessions
    conn.execute(
        "ALTER TABLE chat_sessions ADD COLUMN outgoing_links_count INTEGER NOT NULL DEFAULT 0",
        [],
    ).context("Failed to add outgoing_links_count to chat_sessions")?;

    conn.execute(
        "ALTER TABLE chat_sessions ADD COLUMN incoming_links_count INTEGER NOT NULL DEFAULT 0",
        [],
    ).context("Failed to add incoming_links_count to chat_sessions")?;

    conn.execute(
        "ALTER TABLE chat_sessions ADD COLUMN last_linked DATETIME",
        [],
    ).context("Failed to add last_linked to chat_sessions")?;

    // Create indexes for v4 schema
    create_indexes_v4(conn)?;

    // Create triggers for maintaining link counts and analytics
    create_triggers_v4(conn)?;

    Ok(())
}

/// Create indexes for v4 schema
fn create_indexes_v4(conn: &Connection) -> Result<()> {
    // Indexes for link_relationships
    conn.execute(
        "CREATE INDEX idx_link_relationships_source ON link_relationships (source_id, source_type)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_link_relationships_target ON link_relationships (target_id, target_type)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_link_relationships_user_id ON link_relationships (user_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_link_relationships_created_at ON link_relationships (created_at DESC)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_link_relationships_updated_at ON link_relationships (updated_at DESC)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_link_relationships_link_text ON link_relationships (link_text)",
        [],
    )?;

    // Indexes for content_index
    conn.execute(
        "CREATE INDEX idx_content_index_content_id ON content_index (content_id, content_type)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_content_index_user_id ON content_index (user_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_content_index_title ON content_index (title)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_content_index_last_indexed ON content_index (last_indexed DESC)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_content_index_content_type ON content_index (content_type)",
        [],
    )?;

    // Full-text search index for content
    conn.execute(
        "CREATE VIRTUAL TABLE content_fts USING fts5(
            content_id,
            title,
            content_text,
            tags,
            content='content_index',
            content_rowid='rowid'
        )",
        [],
    )?;

    // Trigger to keep FTS index in sync
    conn.execute(
        "CREATE TRIGGER content_index_fts_insert AFTER INSERT ON content_index BEGIN
            INSERT INTO content_fts(rowid, content_id, title, content_text, tags)
            VALUES (new.rowid, new.content_id, new.title, new.content_text, new.tags);
        END",
        [],
    )?;

    conn.execute(
        "CREATE TRIGGER content_index_fts_delete AFTER DELETE ON content_index BEGIN
            DELETE FROM content_fts WHERE rowid = old.rowid;
        END",
        [],
    )?;

    conn.execute(
        "CREATE TRIGGER content_index_fts_update AFTER UPDATE ON content_index BEGIN
            DELETE FROM content_fts WHERE rowid = old.rowid;
            INSERT INTO content_fts(rowid, content_id, title, content_text, tags)
            VALUES (new.rowid, new.content_id, new.title, new.content_text, new.tags);
        END",
        [],
    )?;

    // Indexes for link_suggestions
    conn.execute(
        "CREATE INDEX idx_link_suggestions_partial_text ON link_suggestions (partial_text)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_link_suggestions_target ON link_suggestions (target_id, target_type)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_link_suggestions_user_id ON link_suggestions (user_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_link_suggestions_relevance ON link_suggestions (relevance_score DESC)",
        [],
    )?;

    // Indexes for link_analytics
    conn.execute(
        "CREATE INDEX idx_link_analytics_link_id ON link_analytics (link_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_link_analytics_user_id ON link_analytics (user_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_link_analytics_action_type ON link_analytics (action_type)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_link_analytics_timestamp ON link_analytics (timestamp DESC)",
        [],
    )?;

    Ok(())
}

/// Create triggers for maintaining link counts and analytics
fn create_triggers_v4(conn: &Connection) -> Result<()> {
    // Trigger to update outgoing link count when link is created
    conn.execute(
        "CREATE TRIGGER update_outgoing_links_on_insert AFTER INSERT ON link_relationships
        BEGIN
            UPDATE notes SET 
                outgoing_links_count = outgoing_links_count + 1,
                last_linked = CURRENT_TIMESTAMP
            WHERE id = NEW.source_id AND NEW.source_type = 'note';
            
            UPDATE chat_sessions SET 
                outgoing_links_count = outgoing_links_count + 1,
                last_linked = CURRENT_TIMESTAMP
            WHERE id = NEW.source_id AND NEW.source_type = 'chat_session';
        END",
        [],
    )?;

    // Trigger to update incoming link count when link is created
    conn.execute(
        "CREATE TRIGGER update_incoming_links_on_insert AFTER INSERT ON link_relationships
        BEGIN
            UPDATE notes SET 
                incoming_links_count = incoming_links_count + 1,
                last_linked = CURRENT_TIMESTAMP
            WHERE id = NEW.target_id AND NEW.target_type = 'note';
            
            UPDATE chat_sessions SET 
                incoming_links_count = incoming_links_count + 1,
                last_linked = CURRENT_TIMESTAMP
            WHERE id = NEW.target_id AND NEW.target_type = 'chat_session';
        END",
        [],
    )?;

    // Trigger to update outgoing link count when link is deleted
    conn.execute(
        "CREATE TRIGGER update_outgoing_links_on_delete AFTER DELETE ON link_relationships
        BEGIN
            UPDATE notes SET 
                outgoing_links_count = outgoing_links_count - 1
            WHERE id = OLD.source_id AND OLD.source_type = 'note';
            
            UPDATE chat_sessions SET 
                outgoing_links_count = outgoing_links_count - 1
            WHERE id = OLD.source_id AND OLD.source_type = 'chat_session';
        END",
        [],
    )?;

    // Trigger to update incoming link count when link is deleted
    conn.execute(
        "CREATE TRIGGER update_incoming_links_on_delete AFTER DELETE ON link_relationships
        BEGIN
            UPDATE notes SET 
                incoming_links_count = incoming_links_count - 1
            WHERE id = OLD.target_id AND OLD.target_type = 'note';
            
            UPDATE chat_sessions SET 
                incoming_links_count = incoming_links_count - 1
            WHERE id = OLD.target_id AND OLD.target_type = 'chat_session';
        END",
        [],
    )?;

    // Trigger to log link analytics on creation
    conn.execute(
        "CREATE TRIGGER log_link_creation AFTER INSERT ON link_relationships
        BEGIN
            INSERT INTO link_analytics (id, link_id, action_type, user_id, metadata)
            VALUES (
                'analytics_' || NEW.id || '_created',
                NEW.id,
                'created',
                NEW.user_id,
                json_object(
                    'source_type', NEW.source_type,
                    'target_type', NEW.target_type,
                    'link_text', NEW.link_text
                )
            );
        END",
        [],
    )?;

    // Trigger to log link analytics on deletion
    conn.execute(
        "CREATE TRIGGER log_link_deletion AFTER DELETE ON link_relationships
        BEGIN
            INSERT INTO link_analytics (id, link_id, action_type, user_id, metadata)
            VALUES (
                'analytics_' || OLD.id || '_deleted',
                OLD.id,
                'deleted',
                OLD.user_id,
                json_object(
                    'source_type', OLD.source_type,
                    'target_type', OLD.target_type,
                    'link_text', OLD.link_text
                )
            );
        END",
        [],
    )?;

    Ok(())
}

/// Clean up orphaned link suggestions (older than 24 hours)
pub fn cleanup_link_suggestions(conn: &Connection) -> Result<()> {
    conn.execute(
        "DELETE FROM link_suggestions 
         WHERE created_at < datetime('now', '-24 hours')",
        [],
    )?;
    Ok(())
}

/// Get link statistics for a user
pub fn get_link_statistics(conn: &Connection, user_id: &str) -> Result<LinkStatistics> {
    let total_links: i32 = conn
        .prepare("SELECT COUNT(*) FROM link_relationships WHERE user_id = ?1")?
        .query_row([user_id], |row| row.get(0))?;

    let total_content: i32 = conn
        .prepare("SELECT COUNT(*) FROM content_index WHERE user_id = ?1")?
        .query_row([user_id], |row| row.get(0))?;

    let most_linked_content: Vec<(String, String, i32)> = conn
        .prepare(
            "SELECT ci.title, ci.content_type, COUNT(lr.id) as link_count
             FROM content_index ci
             LEFT JOIN link_relationships lr ON ci.content_id = lr.target_id 
                 AND ci.content_type = lr.target_type
             WHERE ci.user_id = ?1
             GROUP BY ci.content_id, ci.content_type
             ORDER BY link_count DESC
             LIMIT 10"
        )?
        .query_map([user_id], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, i32>(2)?
            ))
        })?
        .collect::<Result<Vec<_>, _>>()?;

    let orphaned_content: i32 = conn
        .prepare(
            "SELECT COUNT(*) FROM content_index ci
             WHERE ci.user_id = ?1
             AND NOT EXISTS (
                 SELECT 1 FROM link_relationships lr 
                 WHERE lr.source_id = ci.content_id AND lr.source_type = ci.content_type
             )
             AND NOT EXISTS (
                 SELECT 1 FROM link_relationships lr 
                 WHERE lr.target_id = ci.content_id AND lr.target_type = ci.content_type
             )"
        )?
        .query_row([user_id], |row| row.get(0))?;

    Ok(LinkStatistics {
        total_links,
        total_content,
        most_linked_content,
        orphaned_content,
    })
}

/// Link statistics structure
#[derive(Debug)]
pub struct LinkStatistics {
    pub total_links: i32,
    pub total_content: i32,
    pub most_linked_content: Vec<(String, String, i32)>, // (title, type, link_count)
    pub orphaned_content: i32,
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    #[test]
    fn test_v4_migration() -> Result<()> {
        let conn = Connection::open_in_memory().unwrap();
        
        // Run previous migrations first
        crate::database::schema::run_migrations(&conn).unwrap();
        
        // Run v4 migration
        run_migration_v4(&conn).unwrap();
        
        // Verify tables exist
        let tables = ["link_relationships", "content_index", "link_suggestions", "link_analytics"];
        for table in &tables {
            let exists: bool = conn
                .prepare(&format!(
                    "SELECT EXISTS(SELECT name FROM sqlite_master WHERE type='table' AND name='{}')",
                    table
                ))?
                .query_row([], |row| row.get(0))
                .unwrap();
            assert!(exists, "Table {} should exist", table);
        }
        Ok(())
    }

    #[test]
    fn test_link_statistics() {
        let conn = Connection::open_in_memory().unwrap();
        crate::database::schema::run_migrations(&conn).unwrap();
        run_migration_v4(&conn).unwrap();
        
        let stats = get_link_statistics(&conn, "test_user").unwrap();
        assert_eq!(stats.total_links, 0);
        assert_eq!(stats.total_content, 0);
    }
}