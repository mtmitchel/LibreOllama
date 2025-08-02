use crate::models::task_metadata::*;
use crate::{
    database::DatabaseManager,
    models::task_metadata::{TaskMetadata, TaskMetadataWithRelations, TimeBlock},
    services::google::tasks_service::GoogleTasksService,
};
use std::sync::Arc;
use serde::{Deserialize, Serialize};
use tauri::State;
use super::metadata::get_task_metadata;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnifiedTaskData {
    pub id: String,
    pub google_task_id: String,
    pub google_task_list_id: String,
    pub title: String,
    pub notes: Option<String>,
    pub due: Option<String>,
    pub status: String,
    pub updated: String,
    pub position: String,
    pub priority: String,
    pub labels: Vec<String>,
    pub time_block: Option<TimeBlock>,
    pub column_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AllTaskData {
    pub tasks: std::collections::HashMap<String, UnifiedTaskData>,
    pub columns: Vec<serde_json::Value>,
}

#[tauri::command]
pub async fn get_all_task_data(
    account_id: String,
    db_manager: State<'_, Arc<DatabaseManager>>,
    google_tasks_service: State<'_, GoogleTasksService>,
) -> Result<AllTaskData, String> {
    let task_lists = google_tasks_service
        .get_task_lists(&account_id)
        .await
        .map_err(|e| format!("Failed to get task lists: {}", e))?;

    let mut all_tasks = std::collections::HashMap::new();
    let mut column_task_ids: std::collections::HashMap<String, Vec<String>> = std::collections::HashMap::new();
    
    for list in &task_lists {
        let tasks = google_tasks_service
            .get_tasks(&account_id, &list.id)
            .await
            .map_err(|e| format!("Failed to get tasks: {}", e))?;

        let mut list_task_ids = Vec::new();
        
        for task in tasks {
            // Try to get metadata directly from the database to avoid labels table issues
            let metadata = match db_manager.get_connection() {
                Ok(conn) => {
                    // Get just the core metadata without labels/subtasks
                    match conn.query_row(
                        "SELECT priority, time_block FROM task_metadata WHERE google_task_id = ?1",
                        [&task.id],
                        |row| {
                            let priority: String = row.get(0)?;
                            let time_block_json: Option<String> = row.get(1)?;
                            let time_block = time_block_json.and_then(|json| {
                                serde_json::from_str(&json).ok()
                            });
                            Ok((priority, time_block))
                        }
                    ) {
                        Ok((priority, time_block)) => {
                            eprintln!("✅ Found metadata for task {}: priority={}, time_block={:?}", task.id, priority, time_block);
                            Some((priority, time_block))
                        }
                        Err(_) => None
                    }
                }
                Err(e) => {
                    eprintln!("Warning: Failed to get connection for task metadata {}: {}", task.id, e);
                    None
                }
            };

            let priority = metadata.as_ref().map(|(p, _)| p.clone()).unwrap_or_else(|| "normal".to_string());
            let labels = Vec::new(); // Skip labels for now to avoid table issues
            let time_block = metadata.as_ref().and_then(|(_, tb)| tb.clone());
            
            let unified_task = UnifiedTaskData {
                id: task.id.clone(),
                google_task_id: task.id.clone(),
                google_task_list_id: list.id.clone(),
                title: task.title,
                notes: task.notes,
                due: task.due,
                status: task.status,
                updated: task.updated.unwrap_or_default(),
                position: task.position.unwrap_or_default(),
                priority,
                labels,
                time_block,
                column_id: list.id.clone(),
            };
            
            list_task_ids.push(task.id.clone());
            all_tasks.insert(task.id.clone(), unified_task);
        }
        
        column_task_ids.insert(list.id.clone(), list_task_ids);
    }

    let columns = task_lists
        .into_iter()
        .map(|list| {
            let task_ids = column_task_ids.get(&list.id).cloned().unwrap_or_default();
            serde_json::json!({ 
                "id": list.id, 
                "title": list.title, 
                "googleTaskListId": list.id,
                "taskIds": task_ids
            })
        })
        .collect();

    // Debug log for TZTEST tasks
    for (id, task) in &all_tasks {
        if task.title.contains("TZTEST") {
            eprintln!("🔵 TIMEBLOCK DEBUG - TZTEST task in get_all_task_data response:");
            eprintln!("  id: {}", id);
            eprintln!("  title: {}", task.title);
            eprintln!("  time_block: {:?}", task.time_block);
            if let Some(tb) = &task.time_block {
                eprintln!("  TimeBlock data: start={}, end={}", tb.start_time, tb.end_time);
            } else {
                eprintln!("  🔴 No timeBlock for TZTEST task {}", id);
            }
        }
    }
    
    Ok(AllTaskData {
        tasks: all_tasks,
        columns,
    })
}
