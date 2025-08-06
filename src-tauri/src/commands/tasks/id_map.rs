use crate::{
    database::DatabaseManager,
    models::task_id_map::{TaskIdMap, CreateTaskIdMap, UpdateTaskIdMap},
};
use std::sync::Arc;
use tauri::State;
use uuid::Uuid;
use rusqlite::{params, Result as SqlResult};

/// Generate a new stable local ID for a task
pub fn generate_local_id() -> String {
    format!("local-task-{}", Uuid::new_v4())
}

#[tauri::command]
pub async fn create_task_id_mapping(
    mapping: CreateTaskIdMap,
    db_manager: State<'_, Arc<DatabaseManager>>,
) -> Result<TaskIdMap, String> {
    let conn = db_manager.get_connection()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;
    
    // Insert the mapping
    conn.execute(
        "INSERT INTO task_id_map (local_id, google_task_id, task_list_id, created_at, updated_at)
         VALUES (?1, ?2, ?3, datetime('now'), datetime('now'))",
        params![&mapping.local_id, &mapping.google_task_id, &mapping.task_list_id],
    )
    .map_err(|e| format!("Failed to create task ID mapping: {}", e))?;
    
    // Get the inserted row
    let result = conn.query_row(
        "SELECT * FROM task_id_map WHERE local_id = ?1",
        params![&mapping.local_id],
        |row| {
            Ok(TaskIdMap {
                id: row.get(0)?,
                local_id: row.get(1)?,
                google_task_id: row.get(2)?,
                task_list_id: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        },
    )
    .map_err(|e| format!("Failed to retrieve created mapping: {}", e))?;
    
    Ok(result)
}

#[tauri::command]
pub async fn get_task_id_mapping_by_local(
    local_id: String,
    db_manager: State<'_, Arc<DatabaseManager>>,
) -> Result<Option<TaskIdMap>, String> {
    let conn = db_manager.get_connection()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;
    
    let result = conn.query_row(
        "SELECT * FROM task_id_map WHERE local_id = ?1",
        params![&local_id],
        |row| {
            Ok(TaskIdMap {
                id: row.get(0)?,
                local_id: row.get(1)?,
                google_task_id: row.get(2)?,
                task_list_id: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        },
    );
    
    match result {
        Ok(mapping) => Ok(Some(mapping)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(format!("Failed to get task ID mapping: {}", e)),
    }
}

#[tauri::command]
pub async fn get_task_id_mapping_by_google(
    google_task_id: String,
    db_manager: State<'_, Arc<DatabaseManager>>,
) -> Result<Option<TaskIdMap>, String> {
    let conn = db_manager.get_connection()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;
    
    let result = conn.query_row(
        "SELECT * FROM task_id_map WHERE google_task_id = ?1",
        params![&google_task_id],
        |row| {
            Ok(TaskIdMap {
                id: row.get(0)?,
                local_id: row.get(1)?,
                google_task_id: row.get(2)?,
                task_list_id: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        },
    );
    
    match result {
        Ok(mapping) => Ok(Some(mapping)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(format!("Failed to get task ID mapping: {}", e)),
    }
}

#[tauri::command]
pub async fn update_task_id_mapping(
    local_id: String,
    updates: UpdateTaskIdMap,
    db_manager: State<'_, Arc<DatabaseManager>>,
) -> Result<(), String> {
    let conn = db_manager.get_connection()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;
    
    // Build dynamic update query based on provided fields
    let mut query_parts = Vec::new();
    let mut bind_values: Vec<String> = Vec::new();
    
    if let Some(google_task_id) = updates.google_task_id {
        query_parts.push("google_task_id = ?");
        bind_values.push(google_task_id);
    }
    
    if let Some(task_list_id) = updates.task_list_id {
        query_parts.push("task_list_id = ?");
        bind_values.push(task_list_id);
    }
    
    if query_parts.is_empty() {
        return Ok(()); // Nothing to update
    }
    
    query_parts.push("updated_at = datetime('now')");
    
    let query = format!(
        "UPDATE task_id_map SET {} WHERE local_id = ?",
        query_parts.join(", ")
    );
    
    // Execute the update with the proper parameters
    // We need to build the params dynamically
    match bind_values.len() {
        1 => {
            conn.execute(&query, params![bind_values[0], &local_id])
                .map_err(|e| format!("Failed to update task ID mapping: {}", e))?;
        },
        2 => {
            conn.execute(&query, params![bind_values[0], bind_values[1], &local_id])
                .map_err(|e| format!("Failed to update task ID mapping: {}", e))?;
        },
        _ => return Err("Invalid number of update fields".to_string()),
    }
    
    Ok(())
}

#[tauri::command]
pub async fn delete_task_id_mapping(
    local_id: String,
    db_manager: State<'_, Arc<DatabaseManager>>,
) -> Result<(), String> {
    let conn = db_manager.get_connection()
        .map_err(|e| format!("Failed to get database connection: {}", e))?;
    
    conn.execute(
        "DELETE FROM task_id_map WHERE local_id = ?1",
        params![&local_id],
    )
    .map_err(|e| format!("Failed to delete task ID mapping: {}", e))?;
    
    Ok(())
}