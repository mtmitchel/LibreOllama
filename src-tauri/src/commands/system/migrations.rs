#![cfg(feature = "system-advanced")]
//! Database migration commands
use crate::database::DatabaseManager;
use tauri::State;
use std::sync::Arc;

#[tauri::command]
pub async fn force_run_migrations(
    db_manager: State<'_, Arc<DatabaseManager>>,
) -> Result<String, String> {
    println!("Force running database migrations...");
    
    db_manager
        .run_migrations()
        .await
        .map_err(|e| format!("Failed to run migrations: {}", e))?;
    
    println!("Database migrations completed successfully");
    Ok("Database migrations completed successfully".to_string())
}