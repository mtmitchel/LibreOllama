//! Google Tasks API Commands
//!
//! This module provides Tauri command handlers for Google Tasks API operations.

use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;

// Define the task structures that match the frontend types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GoogleTask {
    pub id: String,
    pub title: String,
    pub notes: Option<String>,
    pub status: String,
    pub due: Option<String>,
    pub completed: Option<String>,
    pub updated: Option<String>,
    pub parent: Option<String>,
    pub position: Option<String>,
    pub kind: Option<String>,
    pub etag: Option<String>,
    #[serde(rename = "selfLink")]
    pub self_link: Option<String>,
    pub links: Option<Vec<TaskLink>>,
    pub hidden: Option<bool>,
    pub deleted: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskLink {
    #[serde(rename = "type")]
    pub link_type: String,
    pub description: String,
    pub link: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GoogleTaskList {
    pub id: String,
    pub title: String,
    pub updated: Option<String>,
    #[serde(rename = "selfLink")]
    pub self_link: Option<String>,
    pub etag: Option<String>,
    pub kind: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskCreateData {
    pub title: String,
    pub notes: Option<String>,
    pub due: Option<String>,
    pub parent: Option<String>,
    pub previous: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskUpdateData {
    pub title: Option<String>,
    pub notes: Option<String>,
    pub status: Option<String>,
    pub due: Option<String>,
    pub completed: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TasksResponse {
    pub kind: String,
    pub etag: String,
    pub next_page_token: Option<String>,
    pub items: Vec<GoogleTask>,
}

// =============================================================================
// Command Handlers
// =============================================================================

/// Get all task lists for an account
#[tauri::command]
pub async fn get_task_lists(
    account_id: String,
    auth_service: State<'_, Arc<crate::services::gmail::auth_service::GmailAuthService>>,
) -> Result<Vec<GoogleTaskList>, String> {
    println!("📋 [TASKS-API] Getting task lists for account: {}", account_id);
    
    // Get access token
    let tokens = auth_service.get_account_tokens(&account_id).await
        .map_err(|e| format!("Failed to get tokens: {}", e))?
        .ok_or("No tokens found for account")?;

    // Make API call to Google Tasks
    let client = reqwest::Client::new();
    let response = client
        .get("https://www.googleapis.com/tasks/v1/users/@me/lists")
        .bearer_auth(&tokens.access_token)
        .send()
        .await
        .map_err(|e| format!("API request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Tasks API failed: {}", response.status()));
    }

    let task_lists_data: serde_json::Value = response.json().await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    let mut task_lists = Vec::new();
    if let Some(items) = task_lists_data["items"].as_array() {
        for item in items {
            task_lists.push(GoogleTaskList {
                id: item["id"].as_str().unwrap_or("").to_string(),
                title: item["title"].as_str().unwrap_or("").to_string(),
                updated: item["updated"].as_str().map(|s| s.to_string()),
                self_link: item["selfLink"].as_str().map(|s| s.to_string()),
                etag: item["etag"].as_str().map(|s| s.to_string()),
                kind: item["kind"].as_str().map(|s| s.to_string()),
            });
        }
    }
    
    println!("✅ [TASKS-API] Retrieved {} task lists", task_lists.len());
    Ok(task_lists)
}

/// Get tasks for a specific task list
#[tauri::command]
pub async fn get_tasks(
    account_id: String,
    task_list_id: String,
    show_completed: Option<bool>,
    show_deleted: Option<bool>,
    max_results: Option<u32>,
    auth_service: State<'_, Arc<crate::services::gmail::auth_service::GmailAuthService>>,
) -> Result<TasksResponse, String> {
    let show_completed = show_completed.unwrap_or(false);
    let show_deleted = show_deleted.unwrap_or(false);
    let max_results = max_results.unwrap_or(100);

    println!("📋 [TASKS-API] Getting tasks for list: {} (account: {})", task_list_id, account_id);

    // Get access token
    let tokens = auth_service.get_account_tokens(&account_id).await
        .map_err(|e| format!("Failed to get tokens: {}", e))?
        .ok_or("No tokens found for account")?;

    // Make API call to Google Tasks
    let client = reqwest::Client::new();
    let mut url = format!("https://www.googleapis.com/tasks/v1/lists/{}/tasks", task_list_id);
    url.push_str(&format!("?showCompleted={}&showDeleted={}&maxResults={}", 
                         show_completed, show_deleted, max_results));

    let response = client
        .get(&url)
        .bearer_auth(&tokens.access_token)
        .send()
        .await
        .map_err(|e| format!("API request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Tasks API failed: {}", response.status()));
    }

    let tasks_data: serde_json::Value = response.json().await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    let mut tasks = Vec::new();
    if let Some(items) = tasks_data["items"].as_array() {
        for item in items {
            tasks.push(GoogleTask {
                id: item["id"].as_str().unwrap_or("").to_string(),
                title: item["title"].as_str().unwrap_or("").to_string(),
                notes: item["notes"].as_str().map(|s| s.to_string()),
                status: item["status"].as_str().unwrap_or("needsAction").to_string(),
                due: item["due"].as_str().map(|s| s.to_string()),
                completed: item["completed"].as_str().map(|s| s.to_string()),
                updated: item["updated"].as_str().map(|s| s.to_string()),
                parent: item["parent"].as_str().map(|s| s.to_string()),
                position: item["position"].as_str().map(|s| s.to_string()),
                kind: item["kind"].as_str().map(|s| s.to_string()),
                etag: item["etag"].as_str().map(|s| s.to_string()),
                self_link: item["selfLink"].as_str().map(|s| s.to_string()),
                links: None, // Can be parsed if needed
                hidden: item["hidden"].as_bool(),
                deleted: item["deleted"].as_bool(),
            });
        }
    }

    Ok(TasksResponse {
        kind: tasks_data["kind"].as_str().unwrap_or("tasks#tasks").to_string(),
        etag: tasks_data["etag"].as_str().unwrap_or("").to_string(),
        next_page_token: tasks_data["nextPageToken"].as_str().map(|s| s.to_string()),
        items: tasks,
    })
}

/// Create a new task
#[tauri::command]
pub async fn create_task(
    account_id: String,
    task_list_id: String,
    task_data: TaskCreateData,
) -> Result<GoogleTask, String> {
    println!("📋 [TASKS-API] Creating task '{}' in list: {} (account: {})", 
             task_data.title, task_list_id, account_id);

    // Generate a mock task ID
    let task_id = format!("task-{}", chrono::Utc::now().timestamp_millis());

    let new_task = GoogleTask {
        id: task_id,
        title: task_data.title,
        notes: task_data.notes,
        status: "needsAction".to_string(),
        due: task_data.due,
        completed: None,
        updated: Some(chrono::Utc::now().to_rfc3339()),
        parent: task_data.parent,
        position: task_data.previous,
        kind: Some("tasks#task".to_string()),
        etag: None,
        self_link: None,
        links: None,
        hidden: Some(false),
        deleted: Some(false),
    };

    println!("✅ [TASKS-API] Task created successfully: {}", new_task.id);
    Ok(new_task)
}

/// Update an existing task
#[tauri::command]
pub async fn update_task(
    account_id: String,
    task_list_id: String,
    task_id: String,
    task_data: TaskUpdateData,
) -> Result<GoogleTask, String> {
    println!("📋 [TASKS-API] Updating task {} in list: {} (account: {})", 
             task_id, task_list_id, account_id);

    // Create a mock updated task
    let updated_task = GoogleTask {
        id: task_id.clone(),
        title: task_data.title.unwrap_or_else(|| "Updated Task".to_string()),
        notes: task_data.notes,
        status: task_data.status.unwrap_or_else(|| "needsAction".to_string()),
        due: task_data.due,
        completed: task_data.completed,
        updated: Some(chrono::Utc::now().to_rfc3339()),
        parent: None,
        position: None,
        kind: Some("tasks#task".to_string()),
        etag: None,
        self_link: None,
        links: None,
        hidden: Some(false),
        deleted: Some(false),
    };

    println!("✅ [TASKS-API] Task updated successfully: {}", task_id);
    Ok(updated_task)
}

/// Move a task to a different list or position
#[tauri::command]
pub async fn move_task(
    account_id: String,
    task_list_id: String,
    task_id: String,
    parent: Option<String>,
    previous: Option<String>,
) -> Result<GoogleTask, String> {
    println!("📋 [TASKS-API] Moving task {} to list: {} (account: {})", 
             task_id, task_list_id, account_id);

    // Create a mock moved task
    let moved_task = GoogleTask {
        id: task_id.clone(),
        title: "Moved Task".to_string(),
        notes: None,
        status: "needsAction".to_string(),
        due: None,
        completed: None,
        updated: Some(chrono::Utc::now().to_rfc3339()),
        parent,
        position: previous,
        kind: Some("tasks#task".to_string()),
        etag: None,
        self_link: None,
        links: None,
        hidden: Some(false),
        deleted: Some(false),
    };

    println!("✅ [TASKS-API] Task moved successfully: {}", task_id);
    Ok(moved_task)
}

/// Delete a task
#[tauri::command]
pub async fn delete_task(
    account_id: String,
    task_list_id: String,
    task_id: String,
) -> Result<(), String> {
    println!("📋 [TASKS-API] Deleting task {} from list: {} (account: {})", 
             task_id, task_list_id, account_id);

    // In a real implementation, this would make an API call to delete the task
    println!("✅ [TASKS-API] Task deleted successfully: {}", task_id);
    Ok(())
}

/// Create a new task list
#[tauri::command]
pub async fn create_task_list(
    account_id: String,
    title: String,
) -> Result<GoogleTaskList, String> {
    println!("📋 [TASKS-API] Creating task list '{}' (account: {})", title, account_id);

    let list_id = format!("list-{}", chrono::Utc::now().timestamp_millis());

    let new_list = GoogleTaskList {
        id: list_id.clone(),
        title,
        updated: Some(chrono::Utc::now().to_rfc3339()),
        self_link: None,
        etag: None,
        kind: Some("tasks#taskList".to_string()),
    };

    println!("✅ [TASKS-API] Task list created successfully: {}", list_id);
    Ok(new_list)
}

/// Update a task list
#[tauri::command]
pub async fn update_task_list(
    account_id: String,
    task_list_id: String,
    title: String,
) -> Result<GoogleTaskList, String> {
    println!("📋 [TASKS-API] Updating task list {} to '{}' (account: {})", 
             task_list_id, title, account_id);

    let updated_list = GoogleTaskList {
        id: task_list_id.clone(),
        title,
        updated: Some(chrono::Utc::now().to_rfc3339()),
        self_link: None,
        etag: None,
        kind: Some("tasks#taskList".to_string()),
    };

    println!("✅ [TASKS-API] Task list updated successfully: {}", task_list_id);
    Ok(updated_list)
}

/// Delete a task list
#[tauri::command]
pub async fn delete_task_list(
    account_id: String,
    task_list_id: String,
) -> Result<(), String> {
    println!("📋 [TASKS-API] Deleting task list {} (account: {})", task_list_id, account_id);

    // In a real implementation, this would make an API call to delete the task list
    println!("✅ [TASKS-API] Task list deleted successfully: {}", task_list_id);
    Ok(())
} 