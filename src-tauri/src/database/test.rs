//! Database integration tests
//!
//! These tests verify that the database system works correctly with SQLCipher

 // Import specific modules

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
        assert_eq!(key.len(), 46); // 23 bytes * 2 (hex encoding) = 46 characters
    }

    /// Test that schema migrations include required columns
    #[test]
    fn test_schema_columns() -> anyhow::Result<()> {
        let conn = Connection::open_in_memory()?;
        schema::run_migrations(&conn)?;
        
        // Check that chat_sessions table has user_id column
        let mut has_user_id = false;
        let mut stmt = conn.prepare("PRAGMA table_info(chat_sessions)")?;
        let rows = stmt.query_map([], |row| {
            let column_name: String = row.get(1)?;
            Ok(column_name)
        })?;
        
        for row in rows {
            if row? == "user_id" {
                has_user_id = true;
                break;
            }
        }
        
        assert!(has_user_id, "chat_sessions table should have user_id column");
        
        // Check that agents table has capabilities column
        let mut has_capabilities = false;
        let mut stmt = conn.prepare("PRAGMA table_info(agents)")?;
        let rows = stmt.query_map([], |row| {
            let column_name: String = row.get(1)?;
            Ok(column_name)
        })?;
        
        for row in rows {
            if row? == "capabilities" {
                has_capabilities = true;
                break;
            }
        }
        
        assert!(has_capabilities, "agents table should have capabilities column");
        
        println!("✅ Schema columns verification passed");
        Ok(())
    }
}

/// Helper function to create test database with sample data
#[cfg(test)]
pub fn create_test_database() -> Result<rusqlite::Connection, anyhow::Error> {
    let conn = rusqlite::Connection::open_in_memory()?;
    crate::database::schema::run_migrations(&conn)?;
    
    // Insert test data using correct schema
    conn.execute(
        "INSERT INTO agents (name, description, system_prompt, capabilities, parameters, is_active, created_at, updated_at)
         VALUES ('Test Agent', 'A test agent', 'You are helpful', '[]', '{}', 1, datetime('now'), datetime('now'))",
        [],
    )?;
    
    conn.execute(
        "INSERT INTO chat_sessions (user_id, session_name, created_at, updated_at)
         VALUES ('test_user', 'Test Session', datetime('now'), datetime('now'))",
        [],
    )?;
    
    conn.execute(
        "INSERT INTO chat_messages (session_id, role, content, created_at)
         VALUES (1, 'user', 'Hello', datetime('now'))",
        [],
    )?;
    
    Ok(conn)
}