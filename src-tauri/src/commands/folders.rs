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
    pub parent_id: Option<String>,
    pub color: Option<String>,
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
            name: folder.folder_name,
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
    folder: CreateFolderRequest,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<FolderResponse, String> {
    let parent_id = folder.parent_id.and_then(|id_str| id_str.parse::<i32>().ok());
    
    // Clone the values we need to use after the spawn_blocking
    let name = folder.name.clone();
    let user_id = folder.user_id.clone();
    let color = folder.color.clone();

    let db_manager_clone = db_manager.inner().clone();
    let created_folder_id = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::folder_operations::create_folder(
            &conn,
            &folder.name,
            parent_id,
            &folder.user_id,
            folder.color.as_deref(),
        )
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;
    
    let new_folder = Folder {
        id: created_folder_id,
        folder_name: name,
        parent_id,
        user_id,
        color,
        created_at: chrono::Local::now().naive_local(),
        updated_at: chrono::Local::now().naive_local(),
    };

    Ok(FolderResponse::from(new_folder))
}

/// Get all folders for a user
#[command]
pub async fn get_folders(
    user_id: String,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<Vec<FolderResponse>, String> {
    let db_manager_clone = db_manager.inner().clone();
    let folders = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::folder_operations::get_folders_by_user(&conn, &user_id)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;

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

    let mut existing_folder = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::folder_operations::get_folder(&conn, folder_id)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?
    .ok_or_else(|| "Folder not found".to_string())?;

    if let Some(name) = folder.name { existing_folder.folder_name = name; }
    if let Some(parent_id_str) = folder.parent_id { existing_folder.parent_id = parent_id_str.parse::<i32>().ok(); }
    if let Some(color) = folder.color { existing_folder.color = Some(color); }
    existing_folder.updated_at = chrono::Local::now().naive_local();

    let folder_id = existing_folder.id;
    let folder_name = existing_folder.folder_name.clone();
    let parent_id = existing_folder.parent_id;
    let folder_color = existing_folder.color.clone();
    
    let db_manager_clone_update = db_manager.inner().clone();
    tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone_update.get_connection()?;
        operations::folder_operations::update_folder(&conn, folder_id, &folder_name, parent_id, folder_color.as_deref())
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;

    Ok(FolderResponse::from(existing_folder))
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
        let conn = db_manager_clone.get_connection()?;
        operations::folder_operations::delete_folder(&conn, folder_id)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;

    Ok(())
} 