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
use super::metadata_simple::SimpleLabel;

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
    pub labels: Vec<SimpleLabel>,
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
            // Get metadata using simplified function
            let (priority, labels, time_block) = match super::metadata_simple::get_simple_metadata(
                task.id.clone(),
                db_manager.inner().clone(),
            ).await {
                Ok((p, l, tb)) => {
                    eprintln!("✅ Found metadata for task {} ({}): priority={}, labels={:?}, time_block={:?}", 
                        task.id, task.title, p, l, tb);
                    (p, l, tb)
                }
                Err(e) => {
                    eprintln!("⚠️ No metadata found for task {} ({}): {}", 
                        task.id, task.title, e);
                    ("none".to_string(), Vec::new(), None)
                }
            };
            
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
