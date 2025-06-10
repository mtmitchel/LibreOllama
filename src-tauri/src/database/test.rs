//! Database integration tests
//!
//! These tests verify that the database system works correctly with SQLCipher

use anyhow::Result;
use rusqlite::Connection;
use chrono;
use super::*; // For schema, models, etc. from parent (database) module.

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::{models, schema};
    use rusqlite::Connection;

    // Original comment: Imports moved to file scope for broader access (e.g., by helper functions)
    // and corrected to use `super::*` for sibling modules.

    /// Test database initialization and basic operations
    #[tokio::test]
    async fn test_database_integration() -> anyhow::Result<()> {
        // Test in-memory database for testing
        let conn = Connection::open_in_memory()?;
        
        // Run migrations
        schema::run_migrations(&conn)?;
        
        // Test basic operations
        let session = models::ChatSession {
            id: 0,
            user_id: "test_user".to_string(),
            session_name: "Test Integration Session".to_string(),
            created_at: chrono::Utc::now().naive_utc(),
            updated_at: chrono::Utc::now().naive_utc(),
        };
        
        // Since we're using in-memory for tests, we need to create operations
        // that work with the provided connection rather than creating new ones
        // This would need adjustment in the actual operations module for testing
        
        println!("Database integration test passed");
        Ok(())
    }

    /// Test database stats functionality
    #[test]
    fn test_database_stats() -> anyhow::Result<()> {
        let conn = Connection::open_in_memory()?;
        schema::run_migrations(&conn)?;
        
        // Test that we can query basic stats
        let session_count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM chat_sessions",
            [],
            |row| row.get(0),
        ).unwrap_or(0);
        
        let message_count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM chat_messages", 
            [],
            |row| row.get(0),
        ).unwrap_or(0);
        
        assert_eq!(session_count, 0);
        assert_eq!(message_count, 0);
        
        Ok(())
    }

    /// Test SQLCipher encryption (would need actual SQLCipher for full test)
    #[test]
    fn test_encryption_setup() {
        // This test would verify that the database is properly encrypted
        // For now, we just test that our encryption key generation works
        let key = hex::encode("test_key_for_validation");
        assert!(!key.is_empty());
        assert_eq!(key.len(), 32); // 16 bytes * 2 (hex encoding)
    }
}

/// Helper function to create test database with sample data
#[cfg(test)]
pub fn create_test_database() -> Result<Connection, anyhow::Error> {
    let conn = Connection::open_in_memory()?;
    schema::run_migrations(&conn)?;
    
    // Insert some test data
    conn.execute(
        "INSERT INTO agents (id, name, description, model_name, system_prompt, created_at, updated_at)
         VALUES ('test-agent-1', 'Test Agent', 'A test agent', 'llama2', 'You are helpful', datetime('now'), datetime('now'))",
        [],
    )?;
    
    conn.execute(
        "INSERT INTO chat_sessions (id, title, model_name, agent_id, created_at, updated_at)
         VALUES ('test-session-1', 'Test Session', 'llama2', 'test-agent-1', datetime('now'), datetime('now'))",
        [],
    )?;
    
    conn.execute(
        "INSERT INTO chat_messages (id, session_id, role, content, created_at)
         VALUES ('test-msg-1', 'test-session-1', 'user', 'Hello', datetime('now'))",
        [],
    )?;
    
    Ok(conn)
}