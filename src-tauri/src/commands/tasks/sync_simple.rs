#![cfg(feature = "tasks-simple")]
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
pub struct TaskResponse {
    pub id: String,          // Google Task ID
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
pub async fn create_google_task_simple(
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

    // Store metadata in local DB
    if request.priority.is_some() || request.labels.is_some() || request.time_block.is_some() {
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
pub async fn update_google_task_simple(
    request: UpdateTaskRequest,
    google_tasks_service: State<'_, GoogleTasksService>,
    db_manager: State<'_, Arc<DatabaseManager>>,
) -> Result<TaskResponse, String> {
    // Fetch current task state from Google
    let current_task = google_tasks_service
        .get_single_task(
            &request.account_id,
            &request.task_list_id,
            &request.task_id,
        )
        .await
        .map_err(|e| format!("Failed to fetch current task state: {}", e))?;
    
    // Merge updates with current state
    let merged_input = UpdateTaskInput {
        title: request.title.or(Some(current_task.title)),
        notes: request.notes.or(current_task.notes),
        due: request.due.or(current_task.due),
        status: request.status.or(Some(current_task.status)),
    };
    
    // Update task in Google Tasks
    let google_task = google_tasks_service
        .update_task(
            &request.account_id,
            &request.task_list_id,
            &request.task_id,
            merged_input,
        )
        .await
        .map_err(|e| format!("Failed to update Google Task: {}", e))?;

    // Update metadata in local DB if needed
    if request.priority.is_some() || request.labels.is_some() || request.time_block.is_some() {
        super::metadata_simple::create_or_update_metadata(
            request.task_id.clone(),
            request.task_list_id.clone(),
            request.priority.clone(),
            request.labels.clone(),
            request.time_block.clone(),
            db_manager.inner().clone(),
        )
        .await?;
    }

    // Get metadata from DB
    let (priority, labels, _time_block) = super::metadata_simple::get_simple_metadata(
        request.task_id.clone(),
        db_manager.inner().clone(),
    )
    .await
    .unwrap_or_else(|_| ("none".to_string(), Vec::new(), None));

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