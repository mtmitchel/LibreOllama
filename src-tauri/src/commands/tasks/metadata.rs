//! Task metadata commands for labels, priority, and subtasks
use crate::models::task_metadata::*;
use crate::database::DatabaseManager;
use crate::db::DbPool;
use rusqlite::{params, OptionalExtension};
use tauri::State;

#[tauri::command]
pub async fn get_task_metadata(
    google_task_id: String,
    db_manager: State<'_, DatabaseManager>,
) -> Result<Option<TaskMetadataWithRelations>, String> {
    let db_manager_clone = db_manager.inner().clone();
    
    tokio::task::spawn_blocking(move || {
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
                .collect::<Result<Vec<_>, _>>()
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
                .collect::<Result<Vec<_>, _>>()
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
    pool: State<'_, DbPool>,
) -> Result<TaskMetadataWithRelations, String> {
    let db = pool.0.lock().await;
    let mut tx = db.begin().await
        .map_err(|e| format!("Failed to start transaction: {}", e))?;
    
    // Insert task metadata
    let priority = data.priority.unwrap_or_else(|| "normal".to_string());
    let metadata_id = sqlx::query(
        "INSERT INTO task_metadata (google_task_id, task_list_id, priority) VALUES (?1, ?2, ?3)"
    )
    .bind(&data.google_task_id)
    .bind(&data.task_list_id)
    .bind(&priority)
    .execute(&mut *tx)
    .await
    .map_err(|e| format!("Failed to insert task metadata: {}", e))?
    .last_insert_rowid();
    
    // Insert labels if provided
    if let Some(label_names) = data.labels {
        for label_name in label_names {
            // Get or create label
            let label_id = sqlx::query(
                "INSERT OR IGNORE INTO labels (name) VALUES (?1)"
            )
            .bind(&label_name)
            .execute(&mut *tx)
            .await
            .map_err(|e| format!("Failed to insert label: {}", e))?
            .last_insert_rowid();
            
            let label_id = if label_id == 0 {
                // Label already exists, get its ID
                sqlx::query_scalar::<_, i64>(
                    "SELECT id FROM labels WHERE name = ?1"
                )
                .bind(&label_name)
                .fetch_one(&mut *tx)
                .await
                .map_err(|e| format!("Failed to fetch label ID: {}", e))?
            } else {
                label_id
            };
            
            // Create task-label association
            sqlx::query(
                "INSERT INTO task_labels (task_metadata_id, label_id) VALUES (?1, ?2)"
            )
            .bind(metadata_id)
            .bind(label_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| format!("Failed to associate label: {}", e))?;
        }
    }
    
    // Insert subtasks if provided
    if let Some(subtasks) = data.subtasks {
        for subtask in subtasks {
            sqlx::query(
                "INSERT INTO subtasks (task_metadata_id, title, completed, position) VALUES (?1, ?2, ?3, ?4)"
            )
            .bind(metadata_id)
            .bind(&subtask.title)
            .bind(subtask.completed)
            .bind(subtask.position)
            .execute(&mut *tx)
            .await
            .map_err(|e| format!("Failed to insert subtask: {}", e))?;
        }
    }
    
    tx.commit().await
        .map_err(|e| format!("Failed to commit transaction: {}", e))?;
    
    // Fetch and return the created metadata with relations
    get_task_metadata(data.google_task_id, pool).await?
        .ok_or_else(|| "Failed to fetch created metadata".to_string())
}

#[tauri::command]
pub async fn update_task_metadata(
    google_task_id: String,
    updates: UpdateTaskMetadata,
    pool: State<'_, DbPool>,
) -> Result<TaskMetadataWithRelations, String> {
    let db = pool.0.lock().await;
    let mut tx = db.begin().await
        .map_err(|e| format!("Failed to start transaction: {}", e))?;
    
    // Get metadata ID
    let metadata_id = sqlx::query_scalar::<_, i64>(
        "SELECT id FROM task_metadata WHERE google_task_id = ?1"
    )
    .bind(&google_task_id)
    .fetch_optional(&mut *tx)
    .await
    .map_err(|e| format!("Failed to fetch metadata ID: {}", e))?
    .ok_or_else(|| "Task metadata not found".to_string())?;
    
    // Update priority if provided
    if let Some(priority) = updates.priority {
        sqlx::query(
            "UPDATE task_metadata SET priority = ?1 WHERE id = ?2"
        )
        .bind(&priority)
        .bind(metadata_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| format!("Failed to update priority: {}", e))?;
    }
    
    // Update labels if provided
    if let Some(label_names) = updates.labels {
        // Remove existing labels
        sqlx::query("DELETE FROM task_labels WHERE task_metadata_id = ?1")
            .bind(metadata_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| format!("Failed to delete existing labels: {}", e))?;
        
        // Add new labels
        for label_name in label_names {
            let label_id = sqlx::query(
                "INSERT OR IGNORE INTO labels (name) VALUES (?1)"
            )
            .bind(&label_name)
            .execute(&mut *tx)
            .await
            .map_err(|e| format!("Failed to insert label: {}", e))?
            .last_insert_rowid();
            
            let label_id = if label_id == 0 {
                sqlx::query_scalar::<_, i64>(
                    "SELECT id FROM labels WHERE name = ?1"
                )
                .bind(&label_name)
                .fetch_one(&mut *tx)
                .await
                .map_err(|e| format!("Failed to fetch label ID: {}", e))?
            } else {
                label_id
            };
            
            sqlx::query(
                "INSERT INTO task_labels (task_metadata_id, label_id) VALUES (?1, ?2)"
            )
            .bind(metadata_id)
            .bind(label_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| format!("Failed to associate label: {}", e))?;
        }
    }
    
    // Update subtasks if provided
    if let Some(subtasks) = updates.subtasks {
        // Delete removed subtasks
        let existing_ids: Vec<i64> = subtasks.iter()
            .filter_map(|s| s.id)
            .collect();
        
        if !existing_ids.is_empty() {
            let placeholders = existing_ids.iter()
                .map(|_| "?")
                .collect::<Vec<_>>()
                .join(", ");
            
            let query = format!(
                "DELETE FROM subtasks WHERE task_metadata_id = ? AND id NOT IN ({})",
                placeholders
            );
            
            let mut query = sqlx::query(&query).bind(metadata_id);
            for id in &existing_ids {
                query = query.bind(id);
            }
            
            query.execute(&mut *tx).await
                .map_err(|e| format!("Failed to delete removed subtasks: {}", e))?;
        } else {
            // No existing IDs, delete all subtasks
            sqlx::query("DELETE FROM subtasks WHERE task_metadata_id = ?1")
                .bind(metadata_id)
                .execute(&mut *tx)
                .await
                .map_err(|e| format!("Failed to delete all subtasks: {}", e))?;
        }
        
        // Insert or update subtasks
        for subtask in subtasks {
            if let Some(id) = subtask.id {
                // Update existing subtask
                sqlx::query(
                    "UPDATE subtasks SET title = ?1, completed = ?2, position = ?3 WHERE id = ?4 AND task_metadata_id = ?5"
                )
                .bind(&subtask.title)
                .bind(subtask.completed)
                .bind(subtask.position)
                .bind(id)
                .bind(metadata_id)
                .execute(&mut *tx)
                .await
                .map_err(|e| format!("Failed to update subtask: {}", e))?;
            } else {
                // Insert new subtask
                sqlx::query(
                    "INSERT INTO subtasks (task_metadata_id, title, completed, position) VALUES (?1, ?2, ?3, ?4)"
                )
                .bind(metadata_id)
                .bind(&subtask.title)
                .bind(subtask.completed)
                .bind(subtask.position)
                .execute(&mut *tx)
                .await
                .map_err(|e| format!("Failed to insert subtask: {}", e))?;
            }
        }
    }
    
    tx.commit().await
        .map_err(|e| format!("Failed to commit transaction: {}", e))?;
    
    // Fetch and return the updated metadata with relations
    get_task_metadata(google_task_id, pool).await?
        .ok_or_else(|| "Failed to fetch updated metadata".to_string())
}

#[tauri::command]
pub async fn delete_task_metadata(
    google_task_id: String,
    pool: State<'_, DbPool>,
) -> Result<(), String> {
    let db = pool.0.lock().await;
    
    sqlx::query("DELETE FROM task_metadata WHERE google_task_id = ?1")
        .bind(&google_task_id)
        .execute(&**db)
        .await
        .map_err(|e| format!("Failed to delete task metadata: {}", e))?;
    
    Ok(())
}

#[tauri::command]
pub async fn get_all_labels(
    pool: State<'_, DbPool>,
) -> Result<Vec<Label>, String> {
    let db = pool.0.lock().await;
    
    sqlx::query_as::<_, Label>("SELECT * FROM labels ORDER BY name")
        .fetch_all(&**db)
        .await
        .map_err(|e| format!("Failed to fetch labels: {}", e))
}