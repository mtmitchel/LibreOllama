#![cfg(feature = "gmail-migration")]
//! Gmail Account Migration Commands
//!
//! This module provides commands to migrate existing Gmail accounts
//! to use the correct user_id format.

use tauri::State;
use anyhow::Result;

/// Migrate all Gmail accounts to use 'default_user' as user_id
#[tauri::command]
pub async fn migrate_gmail_accounts_to_default_user(
    db_manager: State<'_, crate::database::connection::DatabaseManager>,
) -> Result<String, String> {
    let conn = db_manager.get_connection().map_err(|e| e.to_string())?;
    
    // First, check how many accounts need migration
    let count_before: i64 = conn.query_row(
        "SELECT COUNT(*) FROM gmail_accounts_secure WHERE user_id != 'default_user'",
        [],
        |row| row.get(0)
    ).map_err(|e| e.to_string())?;
    
    if count_before == 0 {
        return Ok("No accounts need migration. All accounts already use 'default_user'.".to_string());
    }
    
    // Perform the migration
    let rows_updated = conn.execute(
        "UPDATE gmail_accounts_secure SET user_id = 'default_user' WHERE user_id != 'default_user'",
        [],
    ).map_err(|e| format!("Failed to update accounts: {}", e))?;
    
    // Verify the migration
    let count_after: i64 = conn.query_row(
        "SELECT COUNT(*) FROM gmail_accounts_secure WHERE user_id = 'default_user'",
        [],
        |row| row.get(0)
    ).map_err(|e| e.to_string())?;
    
    Ok(format!(
        "Migration completed successfully!\n\
        - Accounts migrated: {}\n\
        - Total accounts with 'default_user': {}\n\
        - Accounts can now be loaded properly after refresh.",
        rows_updated, count_after
    ))
}