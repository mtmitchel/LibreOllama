use crate::{
    database::DatabaseManager,
    services::google::tasks_service::{GoogleTasksService, CreateTaskInput, UpdateTaskInput},
    models::task_metadata::{TimeBlock},
};
use std::sync::Arc;
use tauri::State;
use serde::{Deserialize, Serialize};
use super::metadata_simple::SimpleLabel;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTaskRequest {
    pub account_id: String,
    pub task_list_id: String,
    pub title: String,
    pub notes: Option<String>,
    pub due: Option<String>,
    pub priority: Option<String>,
    pub labels: Option<Vec<SimpleLabel>>,
    pub time_block: Option<TimeBlock>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateTaskRequest {
    pub account_id: String,
    pub task_list_id: String,
    pub task_id: String,  // Google Task ID
    pub title: Option<String>,
    pub notes: Option<String>,
    pub due: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub labels: Option<Vec<SimpleLabel>>,
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
    pub labels: Vec<SimpleLabel>,
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
                title: request.title.clone(),
                notes: request.notes.clone(),
                due: request.due.clone(),
                status: Some("needsAction".to_string()),
            },
        )
        .await
        .map_err(|e| format!("Failed to create Google Task: {}", e))?;

    eprintln!("📝 Created Google task with ID: {}", google_task.id);

    // Store metadata in local DB
    if request.priority.is_some() || request.labels.is_some() || request.time_block.is_some() {
        eprintln!("💾 Storing metadata for task {}: priority={:?}, labels={:?}", 
            google_task.id, request.priority, request.labels);
            
        super::metadata_simple::create_or_update_metadata(
            google_task.id.clone(),
            request.task_list_id.clone(),
            request.priority.clone(),
            request.labels.clone(),
            request.time_block.clone(),
            db_manager.inner().clone(),
        )
        .await?;
    }

    Ok(TaskResponse {
        id: google_task.id,
        title: google_task.title,
        notes: google_task.notes,
        due: google_task.due,
        status: google_task.status,
        position: google_task.position,
        updated: google_task.updated,
        priority: request.priority.unwrap_or_else(|| "none".to_string()),
        labels: request.labels.unwrap_or_default(),
    })
}

#[tauri::command]
pub async fn update_google_task(
    request: UpdateTaskRequest,
    google_tasks_service: State<'_, GoogleTasksService>,
    db_manager: State<'_, Arc<DatabaseManager>>,
) -> Result<TaskResponse, String> {
    eprintln!("📝 Updating task {}: priority={:?}, labels={:?}", 
        request.task_id, request.priority, request.labels);

    // Update task in Google Tasks (only fields Google supports)
    let google_task = google_tasks_service
        .update_task(
            &request.account_id,
            &request.task_list_id,
            &request.task_id,
            UpdateTaskInput {
                title: request.title.clone(),
                notes: request.notes.clone(),
                due: request.due.clone(),
                status: request.status.clone(),
            },
        )
        .await
        .map_err(|e| format!("Failed to update Google Task: {}", e))?;

    // Always update/create metadata in local DB to ensure it persists
    eprintln!("💾 Updating metadata for task {}: priority={:?}, labels={:?}", 
        request.task_id, request.priority, request.labels);
        
    super::metadata_simple::create_or_update_metadata(
        request.task_id.clone(),
        request.task_list_id.clone(),
        request.priority.clone(),
        request.labels.clone(),
        request.time_block.clone(),
        db_manager.inner().clone(),
    )
    .await?;

    // Get metadata from DB to return
    let (priority, labels, _time_block) = super::metadata_simple::get_simple_metadata(
        request.task_id.clone(),
        db_manager.inner().clone(),
    )
    .await
    .unwrap_or_else(|_| ("none".to_string(), Vec::new(), None));

    eprintln!("✅ Retrieved metadata for task {}: priority={}, labels={:?}", 
        request.task_id, priority, labels);

    Ok(TaskResponse {
        id: google_task.id,
        title: google_task.title,
        notes: google_task.notes,
        due: google_task.due,
        status: google_task.status,
        position: google_task.position,
        updated: google_task.updated,
        priority,
        labels,
    })
}

#[tauri::command]
pub async fn delete_google_task(
    request: DeleteTaskRequest,
    google_tasks_service: State<'_, GoogleTasksService>,
    _db_manager: State<'_, Arc<DatabaseManager>>,
) -> Result<(), String> {
    google_tasks_service
        .delete_task(
            &request.account_id,
            &request.task_list_id,
            &request.task_id,
        )
        .await
        .map_err(|e| format!("Failed to delete Google Task: {}", e))?;

    // Note: We could also delete metadata here, but it will be orphaned and harmless

    Ok(())
}

#[tauri::command]
pub async fn update_google_task_list(
    _request: serde_json::Value,
    _google_tasks_service: State<'_, GoogleTasksService>,
    _db_manager: State<'_, Arc<DatabaseManager>>,
) -> Result<serde_json::Value, String> {
    // Placeholder for task list updates
    Ok(serde_json::json!({}))
}