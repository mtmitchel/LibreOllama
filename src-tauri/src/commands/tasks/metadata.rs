use crate::models::task_metadata::*;
use crate::database::DatabaseManager;
use rusqlite::{params, OptionalExtension, ToSql};
use tauri::State;
use std::sync::Arc;

#[tauri::command]
pub async fn get_task_metadata(
    google_task_id: String,
    db_manager: State<'_, Arc<DatabaseManager>>,
) -> Result<Option<TaskMetadataWithRelations>, String> {
    let db_manager_clone = Arc::clone(&db_manager);
    
    tokio::task::spawn_blocking(move || -> Result<Option<TaskMetadataWithRelations>, String> {
        let conn = db_manager_clone.get_connection()
            .map_err(|e| format!("Failed to get database connection: {}", e))?;
    
        // Get base metadata
        let metadata_query = "SELECT id, google_task_id, task_list_id, priority, created_at, updated_at FROM task_metadata WHERE google_task_id = ?1";
        let metadata: Option<TaskMetadata> = conn.query_row(
            metadata_query,
            &[&google_task_id],
            |row| {
                Ok(TaskMetadata {
                    id: row.get(0)?,
                    google_task_id: row.get(1)?,
                    task_list_id: row.get(2)?,
                    priority: row.get(3)?,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                })
            }
        ).optional()
        .map_err(|e| format!("Failed to fetch task metadata: {}", e))?;
    
        match metadata {
            Some(metadata) => {
                // Get labels
                let labels_query = "SELECT l.id, l.name, l.color, l.created_at FROM labels l 
                                   JOIN task_labels tl ON l.id = tl.label_id 
                                   WHERE tl.task_metadata_id = ?1";
                let mut labels_stmt = conn.prepare(labels_query)
                    .map_err(|e| format!("Failed to prepare labels query: {}", e))?;
                
                let labels: Vec<Label> = labels_stmt.query_map(
                    &[&metadata.id],
                    |row| {
                        Ok(Label {
                            id: row.get(0)?,
                            name: row.get(1)?,
                            color: row.get(2)?,
                            created_at: row.get(3)?,
                        })
                    }
                ).map_err(|e| format!("Failed to query labels: {}", e))?
                .collect::<Result<Vec<_>, rusqlite::Error>>()
                .map_err(|e| format!("Failed to collect labels: {}", e))?;
                
                // Get subtasks
                let subtasks_query = "SELECT id, task_metadata_id, title, completed, position, created_at 
                                     FROM subtasks WHERE task_metadata_id = ?1 ORDER BY position";
                let mut subtasks_stmt = conn.prepare(subtasks_query)
                    .map_err(|e| format!("Failed to prepare subtasks query: {}", e))?;
                
                let subtasks: Vec<Subtask> = subtasks_stmt.query_map(
                    &[&metadata.id],
                    |row| {
                        Ok(Subtask {
                            id: row.get(0)?,
                            task_metadata_id: row.get(1)?,
                            title: row.get(2)?,
                            completed: row.get(3)?,
                            position: row.get(4)?,
                            created_at: row.get(5)?,
                        })
                    }
                ).map_err(|e| format!("Failed to query subtasks: {}", e))?
                .collect::<Result<Vec<_>, rusqlite::Error>>()
                .map_err(|e| format!("Failed to collect subtasks: {}", e))?;
                
                Ok(Some(TaskMetadataWithRelations {
                    metadata,
                    labels,
                    subtasks,
                }))
            }
            None => Ok(None)
        }
    })
    .await
    .map_err(|e| format!("Task execution failed: {}", e))?
}

#[tauri::command]
pub async fn create_task_metadata(
    data: CreateTaskMetadata,
    db_manager: State<'_, Arc<DatabaseManager>>,
) -> Result<TaskMetadataWithRelations, String> {
    let db_manager_clone = Arc::clone(&db_manager);
    let google_task_id = data.google_task_id.clone();
    
    let _metadata_id = tokio::task::spawn_blocking(move || -> Result<i64, String> {
        let mut conn = db_manager_clone.get_connection()
            .map_err(|e| format!("Failed to get database connection: {}", e))?;
        
        let tx = conn.transaction().map_err(|e| format!("Failed to start transaction: {}", e))?;
        
        // Insert task metadata
        let priority = data.priority.unwrap_or_else(|| "normal".to_string());
        tx.execute(
            "INSERT INTO task_metadata (google_task_id, task_list_id, priority) VALUES (?1, ?2, ?3)",
            params![&data.google_task_id, &data.task_list_id, &priority],
        ).map_err(|e| format!("Failed to insert task metadata: {}", e))?;
        let metadata_id = tx.last_insert_rowid();
        
        // Insert labels if provided
        if let Some(label_names) = data.labels {
            for label_name in label_names {
                // Get or create label
                tx.execute("INSERT OR IGNORE INTO labels (name) VALUES (?1)", params![&label_name])
                    .map_err(|e| format!("Failed to insert label: {}", e))?;
                let label_id = tx.last_insert_rowid();
                
                let label_id = if label_id == 0 {
                    // Label already exists, get its ID
                    tx.query_row("SELECT id FROM labels WHERE name = ?1", params![&label_name], |row| row.get(0))
                        .map_err(|e| format!("Failed to fetch label ID: {}", e))?
                } else {
                    label_id
                };
                
                // Create task-label association
                tx.execute(
                    "INSERT INTO task_labels (task_metadata_id, label_id) VALUES (?1, ?2)",
                    params![metadata_id, label_id],
                ).map_err(|e| format!("Failed to associate label: {}", e))?;
            }
        }
        
        // Insert subtasks if provided
        if let Some(subtasks) = data.subtasks {
            for subtask in subtasks {
                tx.execute(
                    "INSERT INTO subtasks (task_metadata_id, title, completed, position) VALUES (?1, ?2, ?3, ?4)",
                    params![metadata_id, &subtask.title, subtask.completed, subtask.position],
                ).map_err(|e| format!("Failed to insert subtask: {}", e))?;
            }
        }
        
        tx.commit().map_err(|e| format!("Failed to commit transaction: {}", e))?;
        
        Ok(metadata_id)
    })
    .await
    .map_err(|e| format!("Task execution failed: {}", e))??;

    get_task_metadata(google_task_id, db_manager).await?.ok_or_else(|| "Failed to fetch created metadata".to_string())
}

#[tauri::command]
pub async fn update_task_metadata(
    google_task_id: String,
    updates: UpdateTaskMetadata,
    db_manager: State<'_, Arc<DatabaseManager>>,
) -> Result<TaskMetadataWithRelations, String> {
    let db_manager_clone = Arc::clone(&db_manager);
    let google_task_id_clone = google_task_id.clone();
    
    tokio::task::spawn_blocking(move || -> Result<(), String> {
        let mut conn = db_manager_clone.get_connection()
            .map_err(|e| format!("Failed to get database connection: {}", e))?;
        
        let tx = conn.transaction().map_err(|e| format!("Failed to start transaction: {}", e))?;
        
        // Get metadata ID
        let metadata_id: i64 = tx.query_row(
            "SELECT id FROM task_metadata WHERE google_task_id = ?1",
            params![&google_task_id_clone],
            |row| row.get(0),
        ).optional()
        .map_err(|e| format!("Failed to fetch metadata ID: {}", e))?
        .ok_or_else(|| "Task metadata not found".to_string())?;
        
        // Update priority if provided
        if let Some(priority) = updates.priority {
            tx.execute(
                "UPDATE task_metadata SET priority = ?1 WHERE id = ?2",
                params![&priority, metadata_id],
            ).map_err(|e| format!("Failed to update priority: {}", e))?;
        }
        
        // Update labels if provided
        if let Some(label_names) = updates.labels {
            // Remove existing labels
            tx.execute("DELETE FROM task_labels WHERE task_metadata_id = ?1", params![metadata_id])
                .map_err(|e| format!("Failed to delete existing labels: {}", e))?;
            
            // Add new labels
            for label_name in label_names {
                tx.execute("INSERT OR IGNORE INTO labels (name) VALUES (?1)", params![&label_name])
                    .map_err(|e| format!("Failed to insert label: {}", e))?;
                let label_id = tx.last_insert_rowid();
                
                let label_id = if label_id == 0 {
                    tx.query_row("SELECT id FROM labels WHERE name = ?1", params![&label_name], |row| row.get(0))
                        .map_err(|e| format!("Failed to fetch label ID: {}", e))?
                } else {
                    label_id
                };
                
                tx.execute(
                    "INSERT INTO task_labels (task_metadata_id, label_id) VALUES (?1, ?2)",
                    params![metadata_id, label_id],
                ).map_err(|e| format!("Failed to associate label: {}", e))?;
            }
        }
        
        // Update subtasks if provided
        if let Some(subtasks) = updates.subtasks {
            // Delete removed subtasks
            let existing_ids: Vec<i64> = subtasks.iter().filter_map(|s| s.id).collect();
            
            if !existing_ids.is_empty() {
                let placeholders = existing_ids.iter().map(|_| "?").collect::<Vec<_>>().join(", ");
                let query = format!(
                    "DELETE FROM subtasks WHERE task_metadata_id = ? AND id NOT IN ({})",
                    placeholders
                );
                
                let mut params_vec: Vec<&dyn ToSql> = vec![&metadata_id];
                for id in &existing_ids {
                    params_vec.push(id);
                }
                
                tx.execute(&query, &*params_vec).map_err(|e| format!("Failed to delete removed subtasks: {}", e))?;
            } else {
                // No existing IDs, delete all subtasks
                tx.execute("DELETE FROM subtasks WHERE task_metadata_id = ?1", params![metadata_id])
                    .map_err(|e| format!("Failed to delete all subtasks: {}", e))?;
            }
            
            // Insert or update subtasks
            for subtask in subtasks {
                if let Some(id) = subtask.id {
                    // Update existing subtask
                    tx.execute(
                        "UPDATE subtasks SET title = ?1, completed = ?2, position = ?3 WHERE id = ?4 AND task_metadata_id = ?5",
                        params![&subtask.title, subtask.completed, subtask.position, id, metadata_id],
                    ).map_err(|e| format!("Failed to update subtask: {}", e))?;
                } else {
                    // Insert new subtask
                    tx.execute(
                        "INSERT INTO subtasks (task_metadata_id, title, completed, position) VALUES (?1, ?2, ?3, ?4)",
                        params![metadata_id, &subtask.title, subtask.completed, subtask.position],
                    ).map_err(|e| format!("Failed to insert subtask: {}", e))?;
                }
            }
        }
        
        tx.commit().map_err(|e| format!("Failed to commit transaction: {}", e))?;
        
        Ok(())
    })
    .await
    .map_err(|e| format!("Task execution failed: {}", e))??;

    get_task_metadata(google_task_id, db_manager).await?.ok_or_else(|| "Failed to fetch updated metadata".to_string())
}

#[tauri::command]
pub async fn delete_task_metadata(
    google_task_id: String,
    db_manager: State<'_, Arc<DatabaseManager>>,
) -> Result<(), String> {
    let db_manager_clone = Arc::clone(&db_manager);
    
    tokio::task::spawn_blocking(move || -> Result<(), String> {
        let conn = db_manager_clone.get_connection()
            .map_err(|e| format!("Failed to get database connection: {}", e))?;
        
        conn.execute("DELETE FROM task_metadata WHERE google_task_id = ?1", params![&google_task_id])
            .map_err(|e| format!("Failed to delete task metadata: {}", e))?;
        
        Ok(())
    })
    .await
    .map_err(|e| format!("Task execution failed: {}", e))?
}

#[tauri::command]
pub async fn get_all_labels(db_manager: State<'_, Arc<DatabaseManager>>) -> Result<Vec<Label>, String> {
    let db_manager_clone = Arc::clone(&db_manager);
    
    tokio::task::spawn_blocking(move || -> Result<Vec<Label>, String> {
        let conn = db_manager_clone.get_connection()
            .map_err(|e| format!("Failed to get database connection: {}", e))?;
        
        let mut stmt = conn.prepare("SELECT * FROM labels ORDER BY name")
            .map_err(|e| format!("Failed to prepare labels query: {}", e))?;
        
        let labels: Vec<Label> = stmt.query_map([], |row| {
            Ok(Label {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                created_at: row.get(3)?,
            })
        })
        .map_err(|e| format!("Failed to query labels: {}", e))?
        .collect::<Result<Vec<_>, rusqlite::Error>>()
        .map_err(|e| format!("Failed to collect labels: {}", e))?;
        
        Ok(labels)
    })
    .await
    .map_err(|e| format!("Task execution failed: {}", e))?
}
