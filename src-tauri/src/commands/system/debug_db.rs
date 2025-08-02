//! Debug database commands
use crate::database::DatabaseManager;
use tauri::State;
use std::sync::Arc;
use serde_json::Value;

#[tauri::command]
pub async fn debug_check_timeblock_data(
    db_manager: State<'_, Arc<DatabaseManager>>,
) -> Result<Value, String> {
    println!("🔍 DEBUG: Checking timeBlock data in database...");
    
    let conn = db_manager
        .get_connection()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;
    
    // Check if time_block column exists
    let table_check: String = conn
        .query_row(
            "SELECT sql FROM sqlite_master WHERE type='table' AND name='task_metadata'",
            [],
            |row| row.get(0),
        )
        .unwrap_or_else(|_| "Table not found".to_string());
    
    println!("📋 task_metadata table schema: {}", table_check);
    
    // Count tasks with timeBlock
    let count_with_timeblock: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM task_metadata WHERE time_block IS NOT NULL",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);
    
    println!("📊 Tasks with timeBlock data: {}", count_with_timeblock);
    
    // Get a sample of tasks with timeBlock
    let mut stmt = conn
        .prepare("SELECT google_task_id, time_block FROM task_metadata WHERE time_block IS NOT NULL LIMIT 5")
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;
    
    let tasks_with_timeblock: Vec<(String, String)> = stmt
        .query_map([], |row| {
            Ok((row.get(0)?, row.get(1)?))
        })
        .map_err(|e| format!("Failed to query: {}", e))?
        .filter_map(Result::ok)
        .collect();
    
    println!("📋 Sample tasks with timeBlock:");
    for (id, time_block) in &tasks_with_timeblock {
        println!("  - Task {}: {}", id, time_block);
    }
    
    // Get all metadata for debugging
    let mut all_metadata_stmt = conn
        .prepare("SELECT google_task_id, task_list_id, priority, time_block FROM task_metadata LIMIT 10")
        .map_err(|e| format!("Failed to prepare metadata query: {}", e))?;
    
    let all_metadata: Vec<serde_json::Value> = all_metadata_stmt
        .query_map([], |row| {
            let task_id: String = row.get(0)?;
            let list_id: String = row.get(1)?;
            let priority: String = row.get(2)?;
            let time_block: Option<String> = row.get(3)?;
            
            Ok(serde_json::json!({
                "google_task_id": task_id,
                "task_list_id": list_id,
                "priority": priority,
                "time_block": time_block
            }))
        })
        .map_err(|e| format!("Failed to query metadata: {}", e))?
        .filter_map(Result::ok)
        .collect();
    
    let result = serde_json::json!({
        "table_schema": table_check,
        "total_tasks_with_timeblock": count_with_timeblock,
        "sample_tasks_with_timeblock": tasks_with_timeblock,
        "all_metadata_sample": all_metadata
    });
    
    Ok(result)
}