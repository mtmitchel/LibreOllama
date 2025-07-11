//! Folder management commands for Tauri
//!
//! This module provides commands for creating, reading, updating, and deleting folders
//! in the LibreOllama application.

use serde::{Deserialize, Serialize};
use tauri::{command, State};
use crate::database::models::{Folder};
use crate::database::operations;
use chrono::TimeZone;

/// Request structure for creating a new folder
#[derive(Debug, Deserialize)]
pub struct CreateFolderRequest {
    pub name: String,
    pub parent_id: Option<i32>,
    pub user_id: String,
}

/// Request structure for updating a folder
#[derive(Debug, Deserialize)]
pub struct UpdateFolderRequest {
    pub name: Option<String>,
    pub parent_id: Option<String>,
    pub color: Option<String>,
}

/// Response structure for folder operations
#[derive(Debug, Serialize)]
pub struct FolderResponse {
    pub id: String,
    pub name: String,
    pub parent_id: Option<String>,
    pub color: Option<String>,
    pub user_id: String,
    pub created_at: String,
    pub updated_at: String,
}

impl From<Folder> for FolderResponse {
    fn from(folder: Folder) -> Self {
        Self {
            id: folder.id.to_string(),
            name: folder.name,  // Changed from folder.folder_name to folder.name
            parent_id: folder.parent_id.map(|id| id.to_string()),
            color: folder.color,
            user_id: folder.user_id,
            created_at: chrono::Utc.from_utc_datetime(&folder.created_at).to_rfc3339(),
            updated_at: chrono::Utc.from_utc_datetime(&folder.updated_at).to_rfc3339(),
        }
    }
}

/// Create a new folder
#[command]
pub async fn create_folder(
    name: String,
    parent_id: Option<i32>,
    user_id: String,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<FolderResponse, String> {
    let db_manager_clone = db_manager.inner().clone();
    let created_folder = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection().map_err(|e| e.to_string())?;
        operations::folder_operations::create_folder(&conn, &name, parent_id, &user_id, None)
            .map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e| e)?;

    Ok(FolderResponse::from(created_folder))
}

/// Get all folders for a user
#[command]
pub async fn get_folders(
    user_id: String,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<Vec<FolderResponse>, String> {
    let db_manager_clone = db_manager.inner().clone();
    let folders = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection().map_err(|e| e.to_string())?;
        operations::folder_operations::get_folders_by_user(&conn, &user_id).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e| e)?;

    Ok(folders.into_iter().map(FolderResponse::from).collect())
}

/// Update an existing folder
#[command]
pub async fn update_folder(
    id: String,
    folder: UpdateFolderRequest,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<FolderResponse, String> {
    let folder_id = id.parse().map_err(|_| "Invalid folder ID".to_string())?;
    let db_manager_clone = db_manager.inner().clone();

    let updated_folder = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection().map_err(|e| e.to_string())?;
        operations::folder_operations::update_folder(
            &conn,
            folder_id,
            folder.name.as_deref(),
            None, // parent_id update not implemented yet
            folder.color.as_deref(),
        ).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e| e)?;
    
    Ok(FolderResponse::from(updated_folder))
}

/// Delete a folder
#[command]
pub async fn delete_folder(
    id: String,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<(), String> {
    let folder_id = id.parse().map_err(|_| "Invalid folder ID".to_string())?;
    let db_manager_clone = db_manager.inner().clone();

    tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection().map_err(|e| e.to_string())?;
        operations::folder_operations::delete_folder(&conn, folder_id).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e| e)?;

    Ok(())
} 