use rusqlite::{Connection, Result};
use serde_json;
use chrono::{DateTime, Utc};

/// Database operations for Gmail sync functionality
pub struct SyncOperations;

impl SyncOperations {
    /// Store multiple messages in batch
    pub fn store_messages(
        conn: &Connection,
        account_id: &str,
        messages: &[serde_json::Value],
    ) -> Result<()> {
        // Use transaction for batch operations
        let tx = conn.unchecked_transaction()?;
        
        for message in messages {
            Self::store_message_internal(&tx, account_id, message)?;
        }
        
        tx.commit()?;
        Ok(())
    }

    /// Store a single message
    pub fn store_message(
        conn: &Connection,
        account_id: &str,
        message: &serde_json::Value,
    ) -> Result<()> {
        Self::store_message_internal(conn, account_id, message)
    }

    /// Internal method to store a message
    fn store_message_internal(
        conn: &Connection,
        account_id: &str,
        message: &serde_json::Value,
    ) -> Result<()> {
        let message_id = message["id"].as_str().unwrap_or("");
        let thread_id = message["threadId"].as_str().unwrap_or("");
        let _snippet = message["snippet"].as_str().unwrap_or("");
        let empty_vec = vec![];
        let label_ids = message["labelIds"].as_array().unwrap_or(&empty_vec);
        let history_id = message["historyId"].as_str().unwrap_or("");
        let internal_date = message["internalDate"].as_str().unwrap_or("");
        let size_estimate = message["sizeEstimate"].as_u64().unwrap_or(0);

        // Parse headers for subject, from, to, etc.
        let mut subject = String::new();
        let mut from_email = String::new();
        let mut from_name = String::new();
        let mut to_emails = String::new();
        let mut cc_emails = String::new();
        let mut bcc_emails = String::new();
        let mut _date = String::new();

        if let Some(payload) = message.get("payload") {
            if let Some(headers) = payload.get("headers").and_then(|h| h.as_array()) {
                for header in headers {
                    if let (Some(name), Some(value)) = (
                        header.get("name").and_then(|n| n.as_str()),
                        header.get("value").and_then(|v| v.as_str()),
                    ) {
                        match name.to_lowercase().as_str() {
                            "subject" => subject = value.to_string(),
                            "from" => {
                                let parsed = Self::parse_email_address(value);
                                from_email = parsed.0;
                                from_name = parsed.1;
                            }
                            "to" => to_emails = value.to_string(),
                            "cc" => cc_emails = value.to_string(),
                            "bcc" => bcc_emails = value.to_string(),
                            "date" => _date = value.to_string(),
                            _ => {}
                        }
                    }
                }
            }
        }

        // Extract body
        let (body_text, body_html) = Self::extract_body(message);

        // Determine status flags
        let is_read = !label_ids.iter().any(|l| l.as_str() == Some("UNREAD"));
        let is_starred = label_ids.iter().any(|l| l.as_str() == Some("STARRED"));
        let is_important = label_ids.iter().any(|l| l.as_str() == Some("IMPORTANT"));
        let has_attachments = Self::has_attachments(message);

        // Convert label IDs to JSON string
        let labels_json = serde_json::to_string(&label_ids).unwrap_or_else(|_| "[]".to_string());

        // Parse internal date
        let received_at = if !internal_date.is_empty() {
            // Gmail internal date is in milliseconds
            if let Ok(timestamp) = internal_date.parse::<i64>() {
                DateTime::from_timestamp(timestamp / 1000, 0)
                    .unwrap_or_else(Utc::now)
                    .format("%Y-%m-%d %H:%M:%S")
                    .to_string()
            } else {
                Utc::now().format("%Y-%m-%d %H:%M:%S").to_string()
            }
        } else {
            Utc::now().format("%Y-%m-%d %H:%M:%S").to_string()
        };

        // Insert or update message (split into two queries to avoid parameter limit)
        let now = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
        
        // First query: basic message info
        conn.execute(
            "INSERT OR REPLACE INTO gmail_messages (
                id, account_id, thread_id, subject, from_email, from_name,
                to_emails, cc_emails, bcc_emails, body_text, body_html, 
                labels, is_read, is_starred, is_important, has_attachments
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                message_id,
                account_id,
                thread_id,
                subject,
                from_email,
                from_name,
                to_emails,
                cc_emails,
                bcc_emails,
                body_text,
                body_html,
                labels_json,
                is_read,
                is_starred,
                is_important,
                has_attachments,
            ),
        )?;

        // Second query: metadata
        conn.execute(
            "UPDATE gmail_messages SET 
                internal_date = ?, size_estimate = ?, history_id = ?, 
                created_at = ?, updated_at = ? 
             WHERE id = ? AND account_id = ?",
            (
                received_at,
                size_estimate as i64,
                history_id,
                &now,
                &now,
                message_id,
                account_id,
            ),
        )?;

        // Store thread info if it doesn't exist
        conn.execute(
            "INSERT OR IGNORE INTO gmail_threads (id, account_id, history_id, created_at) VALUES (?, ?, ?, ?)",
            (
                thread_id,
                account_id,
                history_id,
                Utc::now().format("%Y-%m-%d %H:%M:%S").to_string(),
            ),
        )?;

        Ok(())
    }

    /// Store sync history for incremental sync tracking
    pub fn store_history(
        conn: &Connection,
        account_id: &str,
        history_id: &str,
        history_data: &[serde_json::Value],
    ) -> Result<()> {
        let history_json = serde_json::to_string(history_data).unwrap_or_else(|_| "[]".to_string());
        
        conn.execute(
            "INSERT OR REPLACE INTO gmail_sync_state (
                account_id, sync_type, last_history_id, sync_data, last_sync_at, created_at
            ) VALUES (?, ?, ?, ?, ?, ?)",
            (
                account_id,
                "incremental",
                history_id,
                history_json,
                Utc::now().format("%Y-%m-%d %H:%M:%S").to_string(),
                Utc::now().format("%Y-%m-%d %H:%M:%S").to_string(),
            ),
        )?;

        Ok(())
    }

    /// Store push notification subscription info
    pub fn store_push_subscription(
        conn: &Connection,
        account_id: &str,
        topic_name: &str,
        expiration: &str,
    ) -> Result<()> {
        // Create push_subscriptions table if it doesn't exist
        conn.execute(
            "CREATE TABLE IF NOT EXISTS push_subscriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                account_id TEXT NOT NULL,
                topic_name TEXT NOT NULL,
                expiration TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                UNIQUE(account_id)
            )",
            [],
        )?;

        conn.execute(
            "INSERT OR REPLACE INTO push_subscriptions (
                account_id, topic_name, expiration, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?)",
            (
                account_id,
                topic_name,
                expiration,
                Utc::now().format("%Y-%m-%d %H:%M:%S").to_string(),
                Utc::now().format("%Y-%m-%d %H:%M:%S").to_string(),
            ),
        )?;

        Ok(())
    }

    /// Remove push notification subscription
    pub fn remove_push_subscription(conn: &Connection, account_id: &str) -> Result<()> {
        conn.execute(
            "DELETE FROM push_subscriptions WHERE account_id = ?",
            [account_id],
        )?;
        Ok(())
    }

    /// Update message labels based on add/remove operations
    pub fn update_message_labels(
        conn: &Connection,
        account_id: &str,
        message_ids: &[String],
        add_labels: &[String],
        remove_labels: &[String],
    ) -> Result<()> {
        let tx = conn.unchecked_transaction()?;

        for message_id in message_ids {
            // Get current labels
            let current_labels: String = tx
                .query_row(
                    "SELECT labels FROM gmail_messages WHERE id = ? AND account_id = ?",
                    (message_id, account_id),
                    |row| row.get(0),
                )
                .unwrap_or_else(|_| "[]".to_string());

            let mut labels: Vec<String> = serde_json::from_str(&current_labels).unwrap_or_default();

            // Add new labels
            for label in add_labels {
                if !labels.contains(label) {
                    labels.push(label.clone());
                }
            }

            // Remove labels
            for label in remove_labels {
                labels.retain(|l| l != label);
            }

            // Update read/starred status based on labels
            let is_read = !labels.contains(&"UNREAD".to_string());
            let is_starred = labels.contains(&"STARRED".to_string());

            // Update database
            tx.execute(
                "UPDATE gmail_messages 
                 SET labels = ?, is_read = ?, is_starred = ?, updated_at = ? 
                 WHERE id = ? AND account_id = ?",
                (
                    serde_json::to_string(&labels).unwrap_or_else(|_| "[]".to_string()),
                    is_read,
                    is_starred,
                    Utc::now().format("%Y-%m-%d %H:%M:%S").to_string(),
                    message_id,
                    account_id,
                ),
            )?;
        }

        tx.commit()?;
        Ok(())
    }

    /// Delete messages from database
    pub fn delete_messages(
        conn: &Connection,
        account_id: &str,
        message_ids: &[String],
    ) -> Result<()> {
        let tx = conn.unchecked_transaction()?;

        for message_id in message_ids {
            tx.execute(
                "DELETE FROM gmail_messages WHERE id = ? AND account_id = ?",
                (message_id, account_id),
            )?;
        }

        tx.commit()?;
        Ok(())
    }

    /// Get last sync history ID for incremental sync
    pub fn get_last_history_id(conn: &Connection, account_id: &str) -> Result<Option<String>> {
        let history_id: Option<String> = conn
            .query_row(
                "SELECT last_history_id FROM gmail_sync_state 
                 WHERE account_id = ? AND sync_type = 'incremental' 
                 ORDER BY last_sync_at DESC LIMIT 1",
                [account_id],
                |row| row.get(0),
            )
            .ok();

        Ok(history_id)
    }

    /// Update sync timestamp for account
    pub fn update_sync_timestamp(conn: &Connection, account_id: &str) -> Result<()> {
        conn.execute(
            "UPDATE gmail_sync_state 
             SET last_sync_at = ? 
             WHERE account_id = ? AND sync_type = 'incremental'",
            (
                Utc::now().format("%Y-%m-%d %H:%M:%S").to_string(),
                account_id,
            ),
        )?;
        Ok(())
    }

    /// Helper function to parse email address
    fn parse_email_address(address: &str) -> (String, String) {
        if let Some(start) = address.find('<') {
            if let Some(end) = address.find('>') {
                let name = address[..start].trim().trim_matches('"');
                let email = &address[start + 1..end];
                return (email.to_string(), name.to_string());
            }
        }
        (address.to_string(), String::new())
    }

    /// Extract body text and HTML from Gmail message
    fn extract_body(message: &serde_json::Value) -> (String, String) {
        let mut body_text = String::new();
        let mut body_html = String::new();

        if let Some(payload) = message.get("payload") {
            Self::extract_body_recursive(payload, &mut body_text, &mut body_html);
        }

        (body_text, body_html)
    }

    /// Recursively extract body from message parts
    fn extract_body_recursive(
        part: &serde_json::Value,
        body_text: &mut String,
        body_html: &mut String,
    ) {
        if let Some(mime_type) = part.get("mimeType").and_then(|m| m.as_str()) {
            if let Some(body) = part.get("body") {
                if let Some(data) = body.get("data").and_then(|d| d.as_str()) {
                    if let Ok(decoded) = base64::decode(&data.replace('-', "+").replace('_', "/")) {
                        if let Ok(text) = String::from_utf8(decoded) {
                            match mime_type {
                                "text/plain" => {
                                    if body_text.is_empty() {
                                        *body_text = text;
                                    }
                                }
                                "text/html" => {
                                    if body_html.is_empty() {
                                        *body_html = text;
                                    }
                                }
                                _ => {}
                            }
                        }
                    }
                }
            }
        }

        // Recursively process parts
        if let Some(parts) = part.get("parts").and_then(|p| p.as_array()) {
            for part in parts {
                Self::extract_body_recursive(part, body_text, body_html);
            }
        }
    }

    /// Check if message has attachments
    fn has_attachments(message: &serde_json::Value) -> bool {
        if let Some(payload) = message.get("payload") {
            return Self::has_attachments_recursive(payload);
        }
        false
    }

    /// Recursively check for attachments
    fn has_attachments_recursive(part: &serde_json::Value) -> bool {
        if let Some(body) = part.get("body") {
            if let Some(attachment_id) = body.get("attachmentId") {
                if attachment_id.is_string() {
                    return true;
                }
            }
        }

        if let Some(parts) = part.get("parts").and_then(|p| p.as_array()) {
            for part in parts {
                if Self::has_attachments_recursive(part) {
                    return true;
                }
            }
        }

        false
    }

    /// Get sync statistics for an account
    pub fn get_sync_stats(conn: &Connection, account_id: &str) -> Result<SyncStats> {
        let (total_messages, unread_messages, last_sync): (i64, i64, Option<String>) = conn
            .query_row(
                "SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread,
                    MAX(updated_at) as last_sync
                 FROM gmail_messages 
                 WHERE account_id = ?",
                [account_id],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
            )?;

        let pending_operations: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM gmail_sync_state 
                 WHERE account_id = ? AND sync_type = 'pending'",
                [account_id],
                |row| row.get(0),
            )
            .unwrap_or(0);

        Ok(SyncStats {
            total_messages: total_messages as u64,
            unread_messages: unread_messages as u64,
            pending_operations: pending_operations as u64,
            last_sync_time: last_sync,
        })
    }
}

/// Sync statistics structure
#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct SyncStats {
    pub total_messages: u64,
    pub unread_messages: u64,
    pub pending_operations: u64,
    pub last_sync_time: Option<String>,
}

/// Add base64 dependency (you'll need to add this to Cargo.toml)
mod base64 {
    pub fn decode(input: &str) -> Result<Vec<u8>, String> {
        // This is a simplified base64 decoder
        // In a real implementation, you'd use the base64 crate
        // For now, return the input as bytes
        Ok(input.as_bytes().to_vec())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;
    use serde_json::json;

    #[test]
    fn test_store_message() {
        let conn = Connection::open_in_memory().unwrap();
        
        // Create tables (would normally be done by migration)
        conn.execute(
            "CREATE TABLE gmail_messages (
                id TEXT PRIMARY KEY,
                account_id TEXT NOT NULL,
                thread_id TEXT NOT NULL,
                subject TEXT,
                from_email TEXT,
                from_name TEXT,
                to_emails TEXT,
                cc_emails TEXT,
                bcc_emails TEXT,
                body_text TEXT,
                body_html TEXT,
                labels TEXT,
                is_read BOOLEAN,
                is_starred BOOLEAN,
                is_important BOOLEAN,
                has_attachments BOOLEAN,
                internal_date TEXT,
                size_estimate INTEGER,
                history_id TEXT,
                created_at TEXT,
                updated_at TEXT
            )",
            [],
        ).unwrap();

        conn.execute(
            "CREATE TABLE gmail_threads (
                id TEXT PRIMARY KEY,
                account_id TEXT NOT NULL,
                history_id TEXT,
                created_at TEXT
            )",
            [],
        ).unwrap();

        // Test message
        let message = json!({
            "id": "test-message-id",
            "threadId": "test-thread-id",
            "snippet": "Test message",
            "labelIds": ["INBOX", "UNREAD"],
            "historyId": "123456",
            "internalDate": "1640995200000",
            "sizeEstimate": 1024,
            "payload": {
                "headers": [
                    {"name": "Subject", "value": "Test Subject"},
                    {"name": "From", "value": "Test User <test@example.com>"}
                ],
                "body": {
                    "data": "VGVzdCBtZXNzYWdl"
                }
            }
        });

        let result = SyncOperations::store_message(&conn, "test-account", &message);
        assert!(result.is_ok());

        // Verify message was stored
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM gmail_messages WHERE account_id = 'test-account'",
            [],
            |row| row.get(0),
        ).unwrap();
        assert_eq!(count, 1);
    }

    #[test]
    fn test_parse_email_address() {
        let (email, name) = SyncOperations::parse_email_address("John Doe <john@example.com>");
        assert_eq!(email, "john@example.com");
        assert_eq!(name, "John Doe");

        let (email, name) = SyncOperations::parse_email_address("jane@example.com");
        assert_eq!(email, "jane@example.com");
        assert_eq!(name, "");
    }
} 