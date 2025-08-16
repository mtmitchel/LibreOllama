use crate::database::DatabaseManager;
use crate::models::task_metadata::{TimeBlock};
use rusqlite::params;
// Note: This module is internal; no tauri::State used here
use std::sync::Arc;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimpleLabel {
    pub name: String,
    pub color: String,
}

/// Create or update task metadata with simplified label storage
pub async fn create_or_update_metadata(
    google_task_id: String,
    task_list_id: String,
    priority: Option<String>,
    labels: Option<Vec<SimpleLabel>>,
    time_block: Option<TimeBlock>,
    db_manager: Arc<DatabaseManager>,
) -> Result<(), String> {
    tokio::task::spawn_blocking(move || -> Result<(), String> {
        let conn = db_manager.get_connection()
            .map_err(|e| format!("Failed to get database connection: {}", e))?;
        
        // Use "none" as default priority to match frontend expectations
        let priority_value = priority.unwrap_or_else(|| "none".to_string());
        
        // Convert labels to JSON
        let labels_json = if let Some(label_list) = labels {
            Some(serde_json::to_string(&label_list).unwrap_or_else(|_| "[]".to_string()))
        } else {
            None
        };
        
        // Convert time_block to JSON
        let time_block_json = time_block.as_ref().map(|tb| {
            serde_json::to_string(tb).unwrap_or_else(|_| "null".to_string())
        });
        
        // Try to insert, and if it fails due to unique constraint, update instead
        match conn.execute(
            "INSERT INTO task_metadata (google_task_id, task_list_id, priority, labels_json, time_block) 
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![&google_task_id, &task_list_id, &priority_value, &labels_json, &time_block_json],
        ) {
            Ok(_) => {
                eprintln!("✅ Created metadata for task {}: priority={}, labels={:?}", 
                    google_task_id, priority_value, labels_json);
            },
            Err(e) if e.to_string().contains("UNIQUE constraint failed") => {
                // Update existing metadata
                conn.execute(
                    "UPDATE task_metadata 
                     SET task_list_id = ?2, priority = ?3, labels_json = ?4, time_block = ?5, updated_at = CURRENT_TIMESTAMP 
                     WHERE google_task_id = ?1",
                    params![&google_task_id, &task_list_id, &priority_value, &labels_json, &time_block_json],
                ).map_err(|e| format!("Failed to update existing task metadata: {}", e))?;
                eprintln!("✅ Updated metadata for task {}: priority={}, labels={:?}", 
                    google_task_id, priority_value, labels_json);
            },
            Err(e) => return Err(format!("Failed to insert task metadata: {}", e)),
        }
        
        Ok(())
    })
    .await
    .map_err(|e| format!("Task execution failed: {}", e))?
}

/// Get task metadata with simplified label retrieval
pub async fn get_simple_metadata(
    google_task_id: String,
    db_manager: Arc<DatabaseManager>,
) -> Result<(String, Vec<SimpleLabel>, Option<TimeBlock>), String> {
    tokio::task::spawn_blocking(move || -> Result<(String, Vec<SimpleLabel>, Option<TimeBlock>), String> {
        let conn = db_manager.get_connection()
            .map_err(|e| format!("Failed to get database connection: {}", e))?;
        
        let (priority, labels_json, time_block_json): (String, Option<String>, Option<String>) = conn
            .query_row(
                "SELECT priority, labels_json, time_block FROM task_metadata WHERE google_task_id = ?1",
                params![&google_task_id],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?))
            )
            .unwrap_or_else(|_| ("none".to_string(), None, None));
        
        // Parse labels from JSON (keep color info)
        let labels = if let Some(json) = labels_json {
            match serde_json::from_str::<Vec<SimpleLabel>>(&json) {
                Ok(label_list) => label_list,
                Err(_) => Vec::new(),
            }
        } else {
            Vec::new()
        };
        
        // Parse time_block from JSON
        let time_block = time_block_json.and_then(|json| {
            serde_json::from_str(&json).ok()
        });
        
        Ok((priority, labels, time_block))
    })
    .await
    .map_err(|e| format!("Task execution failed: {}", e))?
}