use crate::{
    database::DatabaseManager,
    services::google::tasks_service::{GoogleTasksService, CreateTaskInput, UpdateTaskInput},
    models::task_metadata::{CreateTaskMetadata, UpdateTaskMetadata, TimeBlock},
    commands::tasks::metadata,
};
use std::sync::Arc;
use tauri::State;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTaskRequest {
    pub account_id: String,
    pub task_list_id: String,
    pub title: String,
    pub notes: Option<String>,
    pub due: Option<String>,
    pub priority: Option<String>,
    pub labels: Option<Vec<String>>,
    pub time_block: Option<TimeBlock>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateTaskRequest {
    pub account_id: String,
    pub task_list_id: String,
    pub task_id: String,
    pub title: Option<String>,
    pub notes: Option<String>,
    pub due: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub labels: Option<Vec<String>>,
    pub time_block: Option<TimeBlock>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeleteTaskRequest {
    pub account_id: String,
    pub task_list_id: String,
    pub task_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskResponse {
    pub id: String,
    pub title: String,
    pub notes: Option<String>,
    pub due: Option<String>,
    pub status: String,
    pub position: Option<String>,
    pub updated: Option<String>,
    pub priority: String,
    pub labels: Vec<String>,
}

#[tauri::command]
pub async fn create_google_task(
    request: CreateTaskRequest,
    google_tasks_service: State<'_, GoogleTasksService>,
    db_manager: State<'_, Arc<DatabaseManager>>,
) -> Result<TaskResponse, String> {
    // Create task in Google Tasks
    let google_task = google_tasks_service
        .create_task(
            &request.account_id,
            &request.task_list_id,
            CreateTaskInput {
                title: request.title,
                notes: request.notes,
                due: request.due,
                status: Some("needsAction".to_string()),
            },
        )
        .await
        .map_err(|e| format!("Failed to create Google Task: {}", e))?;

    // Debug log to check if time_block is received
    eprintln!("🔵 TIMEBLOCK DEBUG - Create request received: has_time_block={}, time_block={:?}", 
        request.time_block.is_some(), request.time_block);
    
    // Store metadata in local DB
    if request.priority.is_some() || request.labels.is_some() || request.time_block.is_some() {
        let _ = crate::commands::tasks::metadata::create_task_metadata(
            CreateTaskMetadata {
                google_task_id: google_task.id.clone(),
                task_list_id: request.task_list_id.clone(),
                priority: request.priority.clone(),
                labels: request.labels.clone(),
                subtasks: None,
                time_block: request.time_block.clone(),
            },
            db_manager.clone(),
        )
        .await;
    }

    Ok(TaskResponse {
        id: google_task.id,
        title: google_task.title,
        notes: google_task.notes,
        due: google_task.due,
        status: google_task.status,
        position: google_task.position,
        updated: google_task.updated,
        priority: request.priority.unwrap_or_else(|| "normal".to_string()),
        labels: request.labels.unwrap_or_default(),
    })
}

#[tauri::command]
pub async fn update_google_task(
    request: UpdateTaskRequest,
    google_tasks_service: State<'_, GoogleTasksService>,
    db_manager: State<'_, Arc<DatabaseManager>>,
) -> Result<TaskResponse, String> {
    // Update task in Google Tasks
    let google_task = google_tasks_service
        .update_task(
            &request.account_id,
            &request.task_list_id,
            &request.task_id,
            UpdateTaskInput {
                title: request.title,
                notes: request.notes,
                due: request.due,
                status: request.status,
            },
        )
        .await
        .map_err(|e| format!("Failed to update Google Task: {}", e))?;

    // Debug log to check if time_block is received
    eprintln!("🔵 TIMEBLOCK DEBUG - Update request received: task_id={}, has_time_block={}, time_block={:?}", 
        request.task_id, request.time_block.is_some(), request.time_block);
    
    // Also log the full request to see all fields (clone to avoid move issues)
    eprintln!("🔵 TIMEBLOCK DEBUG - Full update request: account_id={}, task_list_id={}, task_id={}, priority={:?}, labels={:?}", 
        request.account_id, request.task_list_id, request.task_id, request.priority, request.labels);
    
    // Update or create metadata in local DB if needed
    if request.priority.is_some() || request.labels.is_some() || request.time_block.is_some() {
        // First check if metadata exists
        let existing_metadata = crate::commands::tasks::metadata::get_task_metadata(
            request.task_id.clone(),
            db_manager.clone(),
        )
        .await
        .ok()
        .flatten();
        
        if existing_metadata.is_some() {
            eprintln!("🔵 TIMEBLOCK DEBUG - Updating existing metadata for task {}", request.task_id);
            // Update existing metadata
            match crate::commands::tasks::metadata::update_task_metadata(
                request.task_id.clone(),
                UpdateTaskMetadata {
                    priority: request.priority.clone(),
                    labels: request.labels.clone(),
                    subtasks: None,
                    time_block: request.time_block.clone(),
                },
                db_manager.clone(),
            )
            .await {
                Ok(_) => eprintln!("✅ TIMEBLOCK DEBUG - Successfully updated metadata"),
                Err(e) => eprintln!("❌ TIMEBLOCK DEBUG - Failed to update metadata: {}", e),
            }
        } else {
            eprintln!("🔵 TIMEBLOCK DEBUG - Creating new metadata for task {}", request.task_id);
            // Create new metadata
            match crate::commands::tasks::metadata::create_task_metadata(
                CreateTaskMetadata {
                    google_task_id: request.task_id.clone(),
                    task_list_id: request.task_list_id.clone(),
                    priority: request.priority.clone(),
                    labels: request.labels.clone(),
                    subtasks: None,
                    time_block: request.time_block.clone(),
                },
                db_manager.clone(),
            )
            .await {
                Ok(_) => eprintln!("✅ TIMEBLOCK DEBUG - Successfully created metadata"),
                Err(e) => eprintln!("❌ TIMEBLOCK DEBUG - Failed to create metadata: {}", e),
            }
        }
    }

    // Get metadata from DB
    let metadata = crate::commands::tasks::metadata::get_task_metadata(
        request.task_id.clone(),
        db_manager.clone(),
    )
    .await
    .ok()
    .flatten();

    Ok(TaskResponse {
        id: google_task.id,
        title: google_task.title,
        notes: google_task.notes,
        due: google_task.due,
        status: google_task.status,
        position: google_task.position,
        updated: google_task.updated,
        priority: metadata
            .as_ref()
            .map(|m| m.metadata.priority.clone())
            .unwrap_or_else(|| "normal".to_string()),
        labels: metadata
            .as_ref()
            .map(|m| m.labels.iter().map(|l| l.name.clone()).collect())
            .unwrap_or_default(),
    })
}

#[tauri::command]
pub async fn delete_google_task(
    request: DeleteTaskRequest,
    google_tasks_service: State<'_, GoogleTasksService>,
    db_manager: State<'_, Arc<DatabaseManager>>,
) -> Result<(), String> {
    // Delete from Google Tasks
    google_tasks_service
        .delete_task(&request.account_id, &request.task_list_id, &request.task_id)
        .await
        .map_err(|e| format!("Failed to delete Google Task: {}", e))?;

    // Delete metadata from local DB
    let _ = crate::commands::tasks::metadata::delete_task_metadata(
        request.task_id.clone(),
        db_manager.clone(),
    )
    .await;

    Ok(())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateTaskListRequest {
    pub account_id: String,
    pub task_list_id: String,
    pub new_title: String,
}

#[tauri::command]
pub async fn update_google_task_list(
    request: UpdateTaskListRequest,
    google_tasks_service: State<'_, GoogleTasksService>,
) -> Result<(), String> {
    google_tasks_service
        .update_task_list(&request.account_id, &request.task_list_id, request.new_title)
        .await
        .map_err(|e| format!("Failed to update Google Task list: {}", e))?;

    Ok(())
}