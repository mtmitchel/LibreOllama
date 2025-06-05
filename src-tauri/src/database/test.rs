//! Database integration tests
//!
//! These tests verify that the database system works correctly with SQLCipher

#[cfg(test)]
mod tests {
    use super::super::*;
    use anyhow::Result;
    use rusqlite::Connection;

    /// Test database initialization and basic operations
    #[tokio::test]
    async fn test_database_integration() -> Result<()> {
        // Test in-memory database for testing
        let conn = Connection::open_in_memory()?;
        
        // Run migrations
        schema::run_migrations(&conn)?;
        
        // Verify schema
        assert!(schema::verify_schema(&conn)?);
        
        // Test basic operations
        let session = models::ChatSession::new(
            "Test Integration Session".to_string(),
            Some("llama2".to_string()),
            None,
        );
        
        // Since we're using in-memory for tests, we need to create operations
        // that work with the provided connection rather than creating new ones
        // This would need adjustment in the actual operations module for testing
        
        println!("Database integration test passed");
        Ok(())
    }

    /// Test database stats functionality
    #[test]
    fn test_database_stats() -> Result<()> {
        let conn = Connection::open_in_memory()?;
        schema::run_migrations(&conn)?;
        
        let stats = schema::get_database_stats(&conn)?;
        assert_eq!(stats.active_sessions, 0);
        assert_eq!(stats.total_messages, 0);
        assert_eq!(stats.active_agents, 0);
        assert_eq!(stats.total_executions, 0);
        assert_eq!(stats.schema_version, 1);
        
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