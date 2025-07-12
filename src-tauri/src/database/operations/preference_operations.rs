//! User preference-related database operations
//!
//! This module provides CRUD operations for user preferences.
//! The user_preferences table structure:
//! - id (INTEGER PRIMARY KEY AUTOINCREMENT)
//! - preference_key (TEXT NOT NULL UNIQUE)
//! - preference_value (TEXT NOT NULL)
//! - preference_type_name (TEXT NOT NULL)

use anyhow::{Context, Result};
use rusqlite::{Connection, params, OptionalExtension};
use crate::database::models::UserPreference;

// ===== User Preference Operations =====

/// Create a new user preference
pub fn create_user_preference(
    conn: &Connection,
    preference_key: &str,
    preference_value: &str,
    preference_type_name: &str,
) -> Result<i32> {
    conn.execute(
        "INSERT INTO user_preferences (preference_key, preference_value, preference_type_name) 
         VALUES (?1, ?2, ?3)",
        params![
            preference_key,
            preference_value,
            preference_type_name
        ],
    ).context("Failed to create user preference")?;

    let preference_id = conn.last_insert_rowid() as i32;
    Ok(preference_id)
}

/// Get a user preference by ID
pub fn get_user_preference(conn: &Connection, preference_id: i32) -> Result<Option<UserPreference>> {
    let mut stmt = conn.prepare(
        "SELECT id, preference_key, preference_value, preference_type_name 
         FROM user_preferences WHERE id = ?1"
    ).context("Failed to prepare get user preference query")?;

    let preference = stmt.query_row(params![preference_id], |row| {
        Ok(UserPreference {
            id: row.get(0)?,
            preference_key: row.get(1)?,
            preference_value: row.get(2)?,
            preference_type_name: row.get(3)?,
            created_at: chrono::Local::now().naive_local(), // Default created_at
            updated_at: chrono::Local::now().naive_local(), // Default updated_at
        })
    }).optional().context("Failed to get user preference")?;

    Ok(preference)
}

/// Get a user preference by key
pub fn get_user_preference_by_key(
    conn: &Connection,
    preference_key: &str,
) -> Result<Option<UserPreference>> {
    let mut stmt = conn.prepare(
        "SELECT id, preference_key, preference_value, preference_type_name 
         FROM user_preferences WHERE preference_key = ?1"
    ).context("Failed to prepare get user preference by key query")?;

    let preference = stmt.query_row(params![preference_key], |row| {
        Ok(UserPreference {
            id: row.get(0)?,
            preference_key: row.get(1)?,
            preference_value: row.get(2)?,
            preference_type_name: row.get(3)?,
            created_at: chrono::Local::now().naive_local(), // Default created_at
            updated_at: chrono::Local::now().naive_local(), // Default updated_at
        })
    }).optional().context("Failed to get user preference by key")?;

    Ok(preference)
}

/// Get user preferences by type
pub fn get_user_preferences_by_type(
    conn: &Connection,
    preference_type_name: &str,
) -> Result<Vec<UserPreference>> {
    let mut stmt = conn.prepare(
        "SELECT id, preference_key, preference_value, preference_type_name 
         FROM user_preferences WHERE preference_type_name = ?1 ORDER BY preference_key ASC"
    ).context("Failed to prepare get user preferences by type query")?;

    let preferences = stmt.query_map(params![preference_type_name], |row| {
        Ok(UserPreference {
            id: row.get(0)?,
            preference_key: row.get(1)?,
            preference_value: row.get(2)?,
            preference_type_name: row.get(3)?,
            created_at: chrono::Local::now().naive_local(), // Default created_at
            updated_at: chrono::Local::now().naive_local(), // Default updated_at
        })
    }).context("Failed to execute get user preferences by type query")?;

    let mut result = Vec::new();
    for preference in preferences {
        result.push(preference.context("Failed to process user preference")?);
    }

    Ok(result)
}

/// Get all user preferences
pub fn get_all_user_preferences(conn: &Connection) -> Result<Vec<UserPreference>> {
    let mut stmt = conn.prepare(
        "SELECT id, preference_key, preference_value, preference_type_name 
         FROM user_preferences ORDER BY preference_key ASC"
    ).context("Failed to prepare get all user preferences query")?;

    let preferences = stmt.query_map([], |row| {
        Ok(UserPreference {
            id: row.get(0)?,
            preference_key: row.get(1)?,
            preference_value: row.get(2)?,
            preference_type_name: row.get(3)?,
            created_at: chrono::Local::now().naive_local(), // Default created_at
            updated_at: chrono::Local::now().naive_local(), // Default updated_at
        })
    }).context("Failed to execute get all user preferences query")?;

    let mut result = Vec::new();
    for preference in preferences {
        result.push(preference.context("Failed to process user preference")?);
    }

    Ok(result)
}

/// Update a user preference by ID
pub fn update_user_preference(
    conn: &Connection,
    preference_id: i32,
    preference_value: &str,
) -> Result<()> {
    conn.execute(
        "UPDATE user_preferences SET preference_value = ?1 WHERE id = ?2",
        params![preference_value, preference_id],
    ).context("Failed to update user preference")?;

    Ok(())
}

/// Update a user preference by key
pub fn update_user_preference_by_key(
    conn: &Connection,
    preference_key: &str,
    preference_value: &str,
) -> Result<()> {
    conn.execute(
        "UPDATE user_preferences SET preference_value = ?1 WHERE preference_key = ?2",
        params![preference_value, preference_key],
    ).context("Failed to update user preference by key")?;

    Ok(())
}

/// Upsert a user preference (insert or update)
pub fn upsert_user_preference(
    conn: &Connection,
    preference_key: &str,
    preference_value: &str,
    preference_type_name: &str,
) -> Result<()> {
    conn.execute(
        "INSERT OR REPLACE INTO user_preferences (preference_key, preference_value, preference_type_name) 
         VALUES (?1, ?2, ?3)",
        params![
            preference_key,
            preference_value,
            preference_type_name
        ],
    ).context("Failed to upsert user preference")?;

    Ok(())
}

/// Delete a user preference by ID
pub fn delete_user_preference(conn: &Connection, preference_id: i32) -> Result<()> {
    conn.execute(
        "DELETE FROM user_preferences WHERE id = ?1",
        params![preference_id],
    ).context("Failed to delete user preference")?;

    Ok(())
}

/// Delete a user preference by key
pub fn delete_user_preference_by_key(
    conn: &Connection,
    preference_key: &str,
) -> Result<()> {
    conn.execute(
        "DELETE FROM user_preferences WHERE preference_key = ?1",
        params![preference_key],
    ).context("Failed to delete user preference by key")?;

    Ok(())
}

/// Delete all user preferences of a specific type
pub fn delete_user_preferences_by_type(
    conn: &Connection,
    preference_type_name: &str,
) -> Result<usize> {
    let affected = conn.execute(
        "DELETE FROM user_preferences WHERE preference_type_name = ?1",
        params![preference_type_name],
    ).context("Failed to delete user preferences by type")?;

    Ok(affected)
}

/// Get user preference count
pub fn get_user_preference_count(conn: &Connection) -> Result<i32> {
    let mut stmt = conn.prepare(
        "SELECT COUNT(*) FROM user_preferences"
    ).context("Failed to prepare get user preference count query")?;

    let count = stmt.query_row([], |row| {
        row.get::<_, i32>(0)
    }).context("Failed to get user preference count")?;

    Ok(count)
}

/// Search user preferences by key or value pattern
pub fn search_user_preferences(conn: &Connection, query: &str) -> Result<Vec<UserPreference>> {
    let mut stmt = conn.prepare(
        "SELECT id, preference_key, preference_value, preference_type_name 
         FROM user_preferences 
         WHERE preference_key LIKE ?1 OR preference_value LIKE ?1 
         ORDER BY preference_key ASC"
    ).context("Failed to prepare search user preferences query")?;

    let search_pattern = format!("%{}%", query);
    let preferences = stmt.query_map(params![search_pattern], |row| {
        Ok(UserPreference {
            id: row.get(0)?,
            preference_key: row.get(1)?,
            preference_value: row.get(2)?,
            preference_type_name: row.get(3)?,
            created_at: chrono::Local::now().naive_local(), // Default created_at
            updated_at: chrono::Local::now().naive_local(), // Default updated_at
        })
    }).context("Failed to execute search user preferences query")?;

    let mut result = Vec::new();
    for preference in preferences {
        result.push(preference.context("Failed to process user preference")?);
    }

    Ok(result)
}

/// Get user preferences by type pattern (using LIKE)
pub fn get_user_preferences_by_type_pattern(
    conn: &Connection,
    type_pattern: &str,
) -> Result<Vec<UserPreference>> {
    let mut stmt = conn.prepare(
        "SELECT id, preference_key, preference_value, preference_type_name 
         FROM user_preferences 
         WHERE preference_type_name LIKE ?1 
         ORDER BY preference_type_name ASC"
    ).context("Failed to prepare get user preferences by type pattern query")?;

    let preferences = stmt.query_map(params![type_pattern], |row| {
        Ok(UserPreference {
            id: row.get(0)?,
            preference_key: row.get(1)?,
            preference_value: row.get(2)?,
            preference_type_name: row.get(3)?,
            created_at: chrono::Local::now().naive_local(), // Default created_at
            updated_at: chrono::Local::now().naive_local(), // Default updated_at
        })
    }).context("Failed to execute get user preferences by type pattern query")?;

    let mut result = Vec::new();
    for preference in preferences {
        result.push(preference.context("Failed to process user preference")?);
    }

    Ok(result)
}

/// Check if a user preference exists by key
pub fn user_preference_exists(conn: &Connection, preference_key: &str) -> Result<bool> {
    let mut stmt = conn.prepare(
        "SELECT COUNT(*) FROM user_preferences WHERE preference_key = ?1"
    ).context("Failed to prepare user preference exists query")?;

    let count = stmt.query_row(params![preference_key], |row| {
        row.get::<_, i32>(0)
    }).context("Failed to check if user preference exists")?;

    Ok(count > 0)
}

/// Get preference value by key (returns only the value)
pub fn get_preference_value(conn: &Connection, preference_key: &str) -> Result<Option<String>> {
    let mut stmt = conn.prepare(
        "SELECT preference_value FROM user_preferences WHERE preference_key = ?1"
    ).context("Failed to prepare get preference value query")?;

    let value = stmt.query_row(params![preference_key], |row| {
        row.get::<_, String>(0)
    }).optional().context("Failed to get preference value")?;

    Ok(value)
}

/// Set preference value by key (creates if doesn't exist)
pub fn set_preference_value(
    conn: &Connection,
    preference_key: &str,
    preference_value: &str,
    preference_type_name: &str,
) -> Result<()> {
    upsert_user_preference(conn, preference_key, preference_value, preference_type_name)
}

/// Get all preference keys
pub fn get_all_preference_keys(conn: &Connection) -> Result<Vec<String>> {
    let mut stmt = conn.prepare(
        "SELECT DISTINCT preference_key FROM user_preferences ORDER BY preference_key ASC"
    ).context("Failed to prepare get all preference keys query")?;

    let keys = stmt.query_map([], |row| {
        row.get::<_, String>(0)
    }).context("Failed to execute get all preference keys query")?;

    let mut result = Vec::new();
    for key in keys {
        result.push(key.context("Failed to process preference key")?);
    }

    Ok(result)
}

/// Get all preference types
pub fn get_all_preference_types(conn: &Connection) -> Result<Vec<String>> {
    let mut stmt = conn.prepare(
        "SELECT DISTINCT preference_type_name FROM user_preferences ORDER BY preference_type_name ASC"
    ).context("Failed to prepare get all preference types query")?;

    let types = stmt.query_map([], |row| {
        row.get::<_, String>(0)
    }).context("Failed to execute get all preference types query")?;

    let mut result = Vec::new();
    for ptype in types {
        result.push(ptype.context("Failed to process preference type")?);
    }

    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;
    use crate::database::schema::run_migrations;

    fn setup_test_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        run_migrations(&conn).unwrap();
        conn
    }

    #[test]
    fn test_create_and_get_user_preference() {
        let conn = setup_test_db();
        
        let id = create_user_preference(&conn, "test_key", "test_value", "String").unwrap();
        assert!(id > 0);

        let preference = get_user_preference(&conn, id).unwrap();
        assert!(preference.is_some());
        let pref = preference.unwrap();
        assert_eq!(pref.preference_key, "test_key");
        assert_eq!(pref.preference_value, "test_value");
        assert_eq!(pref.preference_type_name, "String");
    }

    #[test]
    fn test_get_user_preference_by_key() {
        let conn = setup_test_db();
        
        create_user_preference(&conn, "test_key", "test_value", "String").unwrap();
        
        let preference = get_user_preference_by_key(&conn, "test_key").unwrap();
        assert!(preference.is_some());
        let pref = preference.unwrap();
        assert_eq!(pref.preference_key, "test_key");
        assert_eq!(pref.preference_value, "test_value");
    }

    #[test]
    fn test_upsert_user_preference() {
        let conn = setup_test_db();
        
        // Insert new preference
        upsert_user_preference(&conn, "test_key", "test_value", "String").unwrap();
        let preference = get_user_preference_by_key(&conn, "test_key").unwrap();
        assert!(preference.is_some());
        assert_eq!(preference.unwrap().preference_value, "test_value");

        // Update existing preference
        upsert_user_preference(&conn, "test_key", "updated_value", "String").unwrap();
        let preference = get_user_preference_by_key(&conn, "test_key").unwrap();
        assert!(preference.is_some());
        assert_eq!(preference.unwrap().preference_value, "updated_value");
    }

    #[test]
    fn test_delete_user_preference() {
        let conn = setup_test_db();
        
        let id = create_user_preference(&conn, "test_key", "test_value", "String").unwrap();
        delete_user_preference(&conn, id).unwrap();
        
        let preference = get_user_preference(&conn, id).unwrap();
        assert!(preference.is_none());
    }

    #[test]
    fn test_get_preferences_by_type() {
        let conn = setup_test_db();
        
        create_user_preference(&conn, "test_key1", "test_value1", "String").unwrap();
        create_user_preference(&conn, "test_key2", "test_value2", "String").unwrap();
        create_user_preference(&conn, "test_key3", "test_value3", "Boolean").unwrap();
        
        let string_prefs = get_user_preferences_by_type(&conn, "String").unwrap();
        assert_eq!(string_prefs.len(), 2);
        
        let bool_prefs = get_user_preferences_by_type(&conn, "Boolean").unwrap();
        assert_eq!(bool_prefs.len(), 1);
    }
}

// ===== Async Database Interface Functions =====
// These functions provide async wrappers for the command handlers

use crate::database::connection::DatabaseManager;

/// Get user preference by key (async version for commands)
pub async fn get_user_preference_async(key: &str) -> Result<Option<UserPreference>> {
    let db_manager = DatabaseManager::new().await?;
    let conn = db_manager.get_connection()?;
    get_user_preference_by_key(&conn, key)
}

/// Set user preference (async version for commands)
pub async fn set_user_preference_async(preference: &UserPreference) -> Result<()> {
    let db_manager = DatabaseManager::new().await?;
    let conn = db_manager.get_connection()?;
    upsert_user_preference(
        &conn,
        &preference.preference_key,
        &preference.preference_value,
        &preference.preference_type_name,
    )
}

/// Get all user preferences with optional system filter (async version for commands)
pub async fn get_all_user_preferences_async(system_only: bool) -> Result<Vec<UserPreference>> {
    let db_manager = DatabaseManager::new().await?;
    let conn = db_manager.get_connection()?;
    
    if system_only {
        // If system_only is true, filter by system-related preference types
        // This is a simple implementation - you might want to define what constitutes "system" preferences
        get_user_preferences_by_type_pattern(&conn, "system%")
    } else {
        get_all_user_preferences(&conn)
    }
} 