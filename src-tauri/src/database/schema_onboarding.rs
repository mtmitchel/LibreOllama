//! Database schema for onboarding system
//!
//! This module adds tables for storing onboarding progress and user preferences

use anyhow::{Context, Result};
use rusqlite::Connection;

/// Run onboarding schema migration
pub fn run_onboarding_migration(conn: &Connection) -> Result<()> {
    // Create user_onboarding table for tracking onboarding progress
    conn.execute(
        "CREATE TABLE IF NOT EXISTS user_onboarding (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL DEFAULT 'default',
            is_completed BOOLEAN NOT NULL DEFAULT FALSE,
            current_step TEXT NOT NULL DEFAULT 'welcome',
            completed_steps TEXT NOT NULL DEFAULT '[]', -- JSON array
            selected_persona TEXT,
            ollama_setup_status TEXT NOT NULL DEFAULT 'not-started',
            selected_models TEXT NOT NULL DEFAULT '[]', -- JSON array
            sample_data_created BOOLEAN NOT NULL DEFAULT FALSE,
            tour_progress TEXT NOT NULL DEFAULT '{}', -- JSON object
            started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            completed_at DATETIME,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    ).context("Failed to create user_onboarding table")?;

    // Create onboarding_analytics table for tracking onboarding metrics
    conn.execute(
        "CREATE TABLE IF NOT EXISTS onboarding_analytics (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL DEFAULT 'default',
            step_start_times TEXT NOT NULL DEFAULT '{}', -- JSON object
            step_completion_times TEXT NOT NULL DEFAULT '{}', -- JSON object
            step_skipped TEXT NOT NULL DEFAULT '{}', -- JSON object
            total_onboarding_time INTEGER,
            drop_off_step TEXT,
            persona_selected TEXT,
            models_selected TEXT NOT NULL DEFAULT '[]', -- JSON array
            sample_data_accepted BOOLEAN NOT NULL DEFAULT FALSE,
            tour_completed BOOLEAN NOT NULL DEFAULT FALSE,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    ).context("Failed to create onboarding_analytics table")?;

    // Create user_preferences table for storing user preferences
    conn.execute(
        "CREATE TABLE IF NOT EXISTS user_preferences_v2 (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL DEFAULT 'default',
            preference_key TEXT NOT NULL,
            preference_value TEXT NOT NULL,
            preference_type TEXT NOT NULL DEFAULT 'string',
            category TEXT NOT NULL DEFAULT 'general',
            description TEXT,
            is_system BOOLEAN NOT NULL DEFAULT FALSE,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, preference_key)
        )",
        [],
    ).context("Failed to create user_preferences_v2 table")?;

    // Create indexes for onboarding tables
    create_onboarding_indexes(conn)?;

    // Create triggers for maintaining updated_at timestamps
    create_onboarding_triggers(conn)?;

    Ok(())
}

/// Create indexes for onboarding tables
fn create_onboarding_indexes(conn: &Connection) -> Result<()> {
    // Indexes for user_onboarding
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_user_onboarding_user_id ON user_onboarding (user_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_user_onboarding_completed ON user_onboarding (is_completed)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_user_onboarding_step ON user_onboarding (current_step)",
        [],
    )?;

    // Indexes for onboarding_analytics
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_onboarding_analytics_user_id ON onboarding_analytics (user_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_onboarding_analytics_persona ON onboarding_analytics (persona_selected)",
        [],
    )?;

    // Indexes for user_preferences_v2
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_user_preferences_v2_user_id ON user_preferences_v2 (user_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_user_preferences_v2_category ON user_preferences_v2 (category)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_user_preferences_v2_key ON user_preferences_v2 (preference_key)",
        [],
    )?;

    Ok(())
}

/// Create triggers for maintaining updated_at timestamps
fn create_onboarding_triggers(conn: &Connection) -> Result<()> {
    // Trigger for user_onboarding
    conn.execute(
        "CREATE TRIGGER IF NOT EXISTS update_user_onboarding_timestamp 
         AFTER UPDATE ON user_onboarding
         BEGIN
             UPDATE user_onboarding SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
         END",
        [],
    )?;

    // Trigger for onboarding_analytics
    conn.execute(
        "CREATE TRIGGER IF NOT EXISTS update_onboarding_analytics_timestamp 
         AFTER UPDATE ON onboarding_analytics
         BEGIN
             UPDATE onboarding_analytics SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
         END",
        [],
    )?;

    // Trigger for user_preferences_v2
    conn.execute(
        "CREATE TRIGGER IF NOT EXISTS update_user_preferences_v2_timestamp 
         AFTER UPDATE ON user_preferences_v2
         BEGIN
             UPDATE user_preferences_v2 SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
         END",
        [],
    )?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    #[test]
    fn test_onboarding_migration() -> Result<()> {
        let conn = Connection::open_in_memory().unwrap();
        
        // Run onboarding migration
        run_onboarding_migration(&conn).unwrap();
        
        // Verify tables exist
        let tables = ["user_onboarding", "onboarding_analytics", "user_preferences_v2"];
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
}