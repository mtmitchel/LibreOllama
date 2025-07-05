//! Database schema v5 for Gmail integration
//!
//! This module adds tables for storing and managing Gmail data including:
//! - Gmail accounts and authentication tokens
//! - Email messages and threads  
//! - Labels and folders
//! - Attachments
//! - Sync state and delta management

use anyhow::{Context, Result};
use rusqlite::Connection;

/// Run migration from v4 to v5 - Add Gmail integration tables
pub fn run_migration_v5(conn: &Connection) -> Result<()> {
    // Create gmail_accounts table for multi-account support
    conn.execute(
        "CREATE TABLE gmail_accounts (
            id TEXT PRIMARY KEY,
            email_address TEXT NOT NULL UNIQUE,
            display_name TEXT,
            profile_picture_url TEXT,
            access_token_encrypted TEXT NOT NULL,
            refresh_token_encrypted TEXT,
            token_expires_at DATETIME,
            scopes TEXT NOT NULL, -- JSON array of granted scopes
            is_active BOOLEAN NOT NULL DEFAULT 1,
            last_sync_at DATETIME,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            user_id TEXT NOT NULL
        )",
        [],
    ).context("Failed to create gmail_accounts table")?;

    // Create gmail_labels table for Gmail labels/folders
    conn.execute(
        "CREATE TABLE gmail_labels (
            id TEXT PRIMARY KEY, -- Gmail label ID
            account_id TEXT NOT NULL,
            name TEXT NOT NULL,
            message_list_visibility TEXT NOT NULL CHECK (message_list_visibility IN ('show', 'hide')),
            label_list_visibility TEXT NOT NULL CHECK (label_list_visibility IN ('labelShow', 'labelHide')),
            label_type TEXT NOT NULL CHECK (label_type IN ('system', 'user')),
            messages_total INTEGER DEFAULT 0,
            messages_unread INTEGER DEFAULT 0,
            threads_total INTEGER DEFAULT 0,
            threads_unread INTEGER DEFAULT 0,
            color_text TEXT,
            color_background TEXT,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (account_id) REFERENCES gmail_accounts (id) ON DELETE CASCADE
        )",
        [],
    ).context("Failed to create gmail_labels table")?;

    // Create gmail_threads table for email conversations
    conn.execute(
        "CREATE TABLE gmail_threads (
            id TEXT PRIMARY KEY, -- Gmail thread ID
            account_id TEXT NOT NULL,
            history_id TEXT,
            snippet TEXT,
            message_count INTEGER NOT NULL DEFAULT 0,
            is_read BOOLEAN NOT NULL DEFAULT 0,
            is_starred BOOLEAN NOT NULL DEFAULT 0,
            has_attachments BOOLEAN NOT NULL DEFAULT 0,
            participants TEXT, -- JSON array of email addresses
            subject TEXT,
            last_message_date DATETIME,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (account_id) REFERENCES gmail_accounts (id) ON DELETE CASCADE
        )",
        [],
    ).context("Failed to create gmail_threads table")?;

    // Create gmail_messages table for individual emails
    conn.execute(
        "CREATE TABLE gmail_messages (
            id TEXT PRIMARY KEY, -- Gmail message ID
            thread_id TEXT NOT NULL,
            account_id TEXT NOT NULL,
            history_id TEXT,
            internal_date DATETIME,
            size_estimate INTEGER,
            snippet TEXT,
            is_read BOOLEAN NOT NULL DEFAULT 0,
            is_starred BOOLEAN NOT NULL DEFAULT 0,
            is_important BOOLEAN NOT NULL DEFAULT 0,
            -- Message headers (most common ones for performance)
            from_email TEXT NOT NULL,
            from_name TEXT,
            to_emails TEXT, -- JSON array
            cc_emails TEXT, -- JSON array  
            bcc_emails TEXT, -- JSON array
            subject TEXT,
            date_header DATETIME,
            message_id_header TEXT, -- Email Message-ID header
            reply_to TEXT,
            -- Message content
            body_text TEXT,
            body_html TEXT,
            raw_headers TEXT, -- JSON of all headers
            has_attachments BOOLEAN NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (thread_id) REFERENCES gmail_threads (id) ON DELETE CASCADE,
            FOREIGN KEY (account_id) REFERENCES gmail_accounts (id) ON DELETE CASCADE
        )",
        [],
    ).context("Failed to create gmail_messages table")?;

    // Create gmail_message_labels junction table for message-label relationships
    conn.execute(
        "CREATE TABLE gmail_message_labels (
            message_id TEXT NOT NULL,
            label_id TEXT NOT NULL,
            account_id TEXT NOT NULL,
            applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (message_id, label_id),
            FOREIGN KEY (message_id) REFERENCES gmail_messages (id) ON DELETE CASCADE,
            FOREIGN KEY (label_id) REFERENCES gmail_labels (id) ON DELETE CASCADE,
            FOREIGN KEY (account_id) REFERENCES gmail_accounts (id) ON DELETE CASCADE
        )",
        [],
    ).context("Failed to create gmail_message_labels table")?;

    // Create gmail_attachments table for file attachments
    conn.execute(
        "CREATE TABLE gmail_attachments (
            id TEXT PRIMARY KEY,
            message_id TEXT NOT NULL,
            account_id TEXT NOT NULL,
            attachment_id TEXT NOT NULL, -- Gmail attachment ID
            filename TEXT NOT NULL,
            mime_type TEXT NOT NULL,
            size_bytes INTEGER NOT NULL,
            is_downloaded BOOLEAN NOT NULL DEFAULT 0,
            local_path TEXT, -- Path to downloaded file
            download_date DATETIME,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (message_id) REFERENCES gmail_messages (id) ON DELETE CASCADE,
            FOREIGN KEY (account_id) REFERENCES gmail_accounts (id) ON DELETE CASCADE
        )",
        [],
    ).context("Failed to create gmail_attachments table")?;

    // Create gmail_sync_state table for tracking synchronization
    conn.execute(
        "CREATE TABLE gmail_sync_state (
            id TEXT PRIMARY KEY,
            account_id TEXT NOT NULL,
            sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'incremental', 'labels', 'history')),
            last_sync_at DATETIME NOT NULL,
            last_history_id TEXT,
            next_page_token TEXT,
            sync_status TEXT NOT NULL CHECK (sync_status IN ('completed', 'in_progress', 'failed', 'paused')),
            error_message TEXT,
            messages_synced INTEGER DEFAULT 0,
            total_messages INTEGER DEFAULT 0,
            started_at DATETIME,
            completed_at DATETIME,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (account_id) REFERENCES gmail_accounts (id) ON DELETE CASCADE
        )",
        [],
    ).context("Failed to create gmail_sync_state table")?;

    // Create gmail_drafts table for draft messages
    conn.execute(
        "CREATE TABLE gmail_drafts (
            id TEXT PRIMARY KEY, -- Gmail draft ID
            message_id TEXT, -- Associated message ID if any
            account_id TEXT NOT NULL,
            to_emails TEXT, -- JSON array
            cc_emails TEXT, -- JSON array
            bcc_emails TEXT, -- JSON array
            subject TEXT,
            body_text TEXT,
            body_html TEXT,
            attachments TEXT, -- JSON array of attachment info
            is_reply BOOLEAN NOT NULL DEFAULT 0,
            reply_to_message_id TEXT,
            thread_id TEXT,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (account_id) REFERENCES gmail_accounts (id) ON DELETE CASCADE,
            FOREIGN KEY (thread_id) REFERENCES gmail_threads (id) ON DELETE CASCADE
        )",
        [],
    ).context("Failed to create gmail_drafts table")?;

    // Create indexes for v5 schema
    create_indexes_v5(conn)?;

    // Create triggers for maintaining data consistency
    create_triggers_v5(conn)?;

    Ok(())
}

/// Create indexes for v5 Gmail schema
fn create_indexes_v5(conn: &Connection) -> Result<()> {
    // Gmail accounts indexes
    conn.execute(
        "CREATE INDEX idx_gmail_accounts_email ON gmail_accounts (email_address)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_gmail_accounts_user_id ON gmail_accounts (user_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_gmail_accounts_last_sync ON gmail_accounts (last_sync_at DESC)",
        [],
    )?;

    // Gmail labels indexes
    conn.execute(
        "CREATE INDEX idx_gmail_labels_account_id ON gmail_labels (account_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_gmail_labels_type ON gmail_labels (account_id, label_type)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_gmail_labels_name ON gmail_labels (account_id, name)",
        [],
    )?;

    // Gmail threads indexes
    conn.execute(
        "CREATE INDEX idx_gmail_threads_account_id ON gmail_threads (account_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_gmail_threads_last_message ON gmail_threads (account_id, last_message_date DESC)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_gmail_threads_unread ON gmail_threads (account_id, is_read, last_message_date DESC)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_gmail_threads_starred ON gmail_threads (account_id, is_starred, last_message_date DESC)",
        [],
    )?;

    // Gmail messages indexes
    conn.execute(
        "CREATE INDEX idx_gmail_messages_thread_id ON gmail_messages (thread_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_gmail_messages_account_id ON gmail_messages (account_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_gmail_messages_date ON gmail_messages (account_id, internal_date DESC)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_gmail_messages_from ON gmail_messages (account_id, from_email)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_gmail_messages_subject ON gmail_messages (account_id, subject)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_gmail_messages_unread ON gmail_messages (account_id, is_read, internal_date DESC)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_gmail_messages_starred ON gmail_messages (account_id, is_starred, internal_date DESC)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_gmail_messages_message_id_header ON gmail_messages (message_id_header)",
        [],
    )?;

    // Gmail message labels indexes
    conn.execute(
        "CREATE INDEX idx_gmail_message_labels_message ON gmail_message_labels (message_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_gmail_message_labels_label ON gmail_message_labels (label_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_gmail_message_labels_account ON gmail_message_labels (account_id, label_id)",
        [],
    )?;

    // Gmail attachments indexes
    conn.execute(
        "CREATE INDEX idx_gmail_attachments_message_id ON gmail_attachments (message_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_gmail_attachments_account_id ON gmail_attachments (account_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_gmail_attachments_filename ON gmail_attachments (account_id, filename)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_gmail_attachments_downloaded ON gmail_attachments (account_id, is_downloaded)",
        [],
    )?;

    // Gmail sync state indexes
    conn.execute(
        "CREATE INDEX idx_gmail_sync_state_account_id ON gmail_sync_state (account_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_gmail_sync_state_type ON gmail_sync_state (account_id, sync_type)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_gmail_sync_state_last_sync ON gmail_sync_state (account_id, last_sync_at DESC)",
        [],
    )?;

    // Gmail drafts indexes
    conn.execute(
        "CREATE INDEX idx_gmail_drafts_account_id ON gmail_drafts (account_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_gmail_drafts_thread_id ON gmail_drafts (thread_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX idx_gmail_drafts_updated ON gmail_drafts (account_id, updated_at DESC)",
        [],
    )?;

    // Full-text search index for Gmail messages
    conn.execute(
        "CREATE VIRTUAL TABLE gmail_messages_fts USING fts5(
            message_id,
            subject,
            from_name,
            from_email,
            body_text,
            body_html,
            content='gmail_messages',
            content_rowid='rowid'
        )",
        [],
    )?;

    // Trigger to keep Gmail FTS index in sync
    conn.execute(
        "CREATE TRIGGER gmail_messages_fts_insert AFTER INSERT ON gmail_messages BEGIN
            INSERT INTO gmail_messages_fts(rowid, message_id, subject, from_name, from_email, body_text, body_html)
            VALUES (new.rowid, new.id, new.subject, new.from_name, new.from_email, new.body_text, new.body_html);
        END",
        [],
    )?;

    conn.execute(
        "CREATE TRIGGER gmail_messages_fts_delete AFTER DELETE ON gmail_messages BEGIN
            DELETE FROM gmail_messages_fts WHERE rowid = old.rowid;
        END",
        [],
    )?;

    conn.execute(
        "CREATE TRIGGER gmail_messages_fts_update AFTER UPDATE ON gmail_messages BEGIN
            DELETE FROM gmail_messages_fts WHERE rowid = old.rowid;
            INSERT INTO gmail_messages_fts(rowid, message_id, subject, from_name, from_email, body_text, body_html)
            VALUES (new.rowid, new.id, new.subject, new.from_name, new.from_email, new.body_text, new.body_html);
        END",
        [],
    )?;

    Ok(())
}

/// Create triggers for v5 Gmail schema
fn create_triggers_v5(conn: &Connection) -> Result<()> {
    // Trigger to update thread message count when messages are added/removed
    conn.execute(
        "CREATE TRIGGER gmail_thread_message_count_insert AFTER INSERT ON gmail_messages BEGIN
            UPDATE gmail_threads 
            SET message_count = message_count + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.thread_id;
        END",
        [],
    )?;

    conn.execute(
        "CREATE TRIGGER gmail_thread_message_count_delete AFTER DELETE ON gmail_messages BEGIN
            UPDATE gmail_threads 
            SET message_count = message_count - 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = OLD.thread_id;
        END",
        [],
    )?;

    // Trigger to update thread last_message_date
    conn.execute(
        "CREATE TRIGGER gmail_thread_last_message_update AFTER INSERT ON gmail_messages BEGIN
            UPDATE gmail_threads 
            SET last_message_date = NEW.internal_date,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.thread_id 
            AND (last_message_date IS NULL OR NEW.internal_date > last_message_date);
        END",
        [],
    )?;

    // Trigger to update thread read status based on messages
    conn.execute(
        "CREATE TRIGGER gmail_thread_read_status_update AFTER UPDATE OF is_read ON gmail_messages BEGIN
            UPDATE gmail_threads 
            SET is_read = (
                SELECT COUNT(*) = 0 
                FROM gmail_messages 
                WHERE thread_id = NEW.thread_id AND is_read = 0
            ),
            updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.thread_id;
        END",
        [],
    )?;

    // Trigger to update thread starred status based on messages
    conn.execute(
        "CREATE TRIGGER gmail_thread_starred_status_update AFTER UPDATE OF is_starred ON gmail_messages BEGIN
            UPDATE gmail_threads 
            SET is_starred = (
                SELECT COUNT(*) > 0 
                FROM gmail_messages 
                WHERE thread_id = NEW.thread_id AND is_starred = 1
            ),
            updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.thread_id;
        END",
        [],
    )?;

    // Trigger to update thread attachment status
    conn.execute(
        "CREATE TRIGGER gmail_thread_attachment_update AFTER INSERT ON gmail_attachments BEGIN
            UPDATE gmail_threads 
            SET has_attachments = 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = (
                SELECT thread_id 
                FROM gmail_messages 
                WHERE id = NEW.message_id
            );
        END",
        [],
    )?;

    // Trigger to update message attachment status
    conn.execute(
        "CREATE TRIGGER gmail_message_attachment_update AFTER INSERT ON gmail_attachments BEGIN
            UPDATE gmail_messages 
            SET has_attachments = 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.message_id;
        END",
        [],
    )?;

    // Trigger to update label message counts
    conn.execute(
        "CREATE TRIGGER gmail_label_count_insert AFTER INSERT ON gmail_message_labels BEGIN
            UPDATE gmail_labels 
            SET messages_total = messages_total + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.label_id;
        END",
        [],
    )?;

    conn.execute(
        "CREATE TRIGGER gmail_label_count_delete AFTER DELETE ON gmail_message_labels BEGIN
            UPDATE gmail_labels 
            SET messages_total = messages_total - 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = OLD.label_id;
        END",
        [],
    )?;

    // Trigger to maintain updated_at timestamps
    conn.execute(
        "CREATE TRIGGER gmail_accounts_updated_at AFTER UPDATE ON gmail_accounts BEGIN
            UPDATE gmail_accounts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END",
        [],
    )?;

    conn.execute(
        "CREATE TRIGGER gmail_messages_updated_at AFTER UPDATE ON gmail_messages BEGIN
            UPDATE gmail_messages SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END",
        [],
    )?;

    conn.execute(
        "CREATE TRIGGER gmail_threads_updated_at AFTER UPDATE ON gmail_threads BEGIN
            UPDATE gmail_threads SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END",
        [],
    )?;

    conn.execute(
        "CREATE TRIGGER gmail_labels_updated_at AFTER UPDATE ON gmail_labels BEGIN
            UPDATE gmail_labels SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END",
        [],
    )?;

    conn.execute(
        "CREATE TRIGGER gmail_sync_state_updated_at AFTER UPDATE ON gmail_sync_state BEGIN
            UPDATE gmail_sync_state SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END",
        [],
    )?;

    conn.execute(
        "CREATE TRIGGER gmail_drafts_updated_at AFTER UPDATE ON gmail_drafts BEGIN
            UPDATE gmail_drafts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END",
        [],
    )?;

    Ok(())
}

/// Helper functions for Gmail data management

/// Clean up old sync state records (keep last 10 per account per type)
pub fn cleanup_old_sync_states(conn: &Connection, account_id: &str) -> Result<()> {
    conn.execute(
        "DELETE FROM gmail_sync_state 
         WHERE account_id = ?1 
         AND id NOT IN (
             SELECT id FROM gmail_sync_state 
             WHERE account_id = ?1 
             ORDER BY last_sync_at DESC 
             LIMIT 10
         )",
        [account_id],
    )?;
    Ok(())
}

/// Get Gmail account statistics
pub fn get_gmail_account_stats(conn: &Connection, account_id: &str) -> Result<GmailAccountStats> {
    let (total_messages, unread_messages, total_threads): (i32, i32, i32) = conn.query_row(
        "SELECT 
            (SELECT COUNT(*) FROM gmail_messages WHERE account_id = ?1),
            (SELECT COUNT(*) FROM gmail_messages WHERE account_id = ?1 AND is_read = 0),
            (SELECT COUNT(*) FROM gmail_threads WHERE account_id = ?1)",
        [account_id],
        |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
    )?;

    let total_attachments: i32 = conn.query_row(
        "SELECT COUNT(*) FROM gmail_attachments WHERE account_id = ?1",
        [account_id],
        |row| row.get(0),
    )?;

    let storage_used: i64 = conn.query_row(
        "SELECT COALESCE(SUM(size_bytes), 0) FROM gmail_attachments WHERE account_id = ?1",
        [account_id],
        |row| row.get(0),
    )?;

    Ok(GmailAccountStats {
        total_messages,
        unread_messages,
        total_threads,
        total_attachments,
        storage_used_bytes: storage_used,
    })
}

/// Statistics structure for Gmail accounts
#[derive(Debug)]
pub struct GmailAccountStats {
    pub total_messages: i32,
    pub unread_messages: i32,
    pub total_threads: i32,
    pub total_attachments: i32,
    pub storage_used_bytes: i64,
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    #[test]
    fn test_v5_migration() -> Result<()> {
        let conn = Connection::open_in_memory()?;
        
        // Run the migration
        run_migration_v5(&conn)?;
        
        // Verify tables were created
        let table_count: i32 = conn.query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name LIKE 'gmail_%'",
            [],
            |row| row.get(0),
        )?;
        
        assert_eq!(table_count, 8); // 8 Gmail tables
        
        // Verify FTS table was created
        let fts_count: i32 = conn.query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='gmail_messages_fts'",
            [],
            |row| row.get(0),
        )?;
        
        assert_eq!(fts_count, 1);
        
        Ok(())
    }

    #[test]
    fn test_gmail_account_stats() {
        // This would test the statistics function with sample data
        // Implementation depends on test data setup
    }
} 