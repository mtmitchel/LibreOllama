//! Folder management commands for Tauri
//!
//! This module provides commands for creating, reading, updating, and deleting folders
//! in the LibreOllama application.

use serde::{Deserialize, Serialize};
use tauri::command;
use crate::database::models::{Folder}; // Adjusted import
// Using database operations
use chrono::TimeZone; // Added for NaiveDateTime to DateTime<Utc> conversion

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
pub async fn create_folder(folder: CreateFolderRequest) -> Result<FolderResponse, String> {
    let new_folder = Folder::new(
        folder.name,
        folder.parent_id.and_then(|id_str| id_str.parse::<i32>().ok()), // Parse String to Option<i32>
        folder.user_id,
        folder.color,
    );

    crate::database::create_folder(&new_folder)
        .await
        .map_err(|e| format!("Failed to create folder: {}", e))?;

    Ok(FolderResponse::from(new_folder))
}

/// Get all folders for a user
#[command]
pub async fn get_folders(user_id: String) -> Result<Vec<FolderResponse>, String> {
    let folders = crate::database::get_folders(&user_id)
        .await
        .map_err(|e| format!("Failed to get folders: {}", e))?;

    Ok(folders.into_iter().map(FolderResponse::from).collect())
}

/// Update an existing folder
#[command]
pub async fn update_folder(id: String, folder: UpdateFolderRequest) -> Result<FolderResponse, String> {
    let mut existing_folder = crate::database::get_folder_by_id(id.parse().unwrap_or_default()) // Parse String to i32
        .await
        .map_err(|e| format!("Failed to get folder: {}", e))?
        .ok_or_else(|| "Folder not found".to_string())?;

    // Update fields if provided
    if let Some(name) = folder.name {
        existing_folder.folder_name = name;
    }
    if let Some(parent_id_str) = folder.parent_id {
        existing_folder.parent_id = parent_id_str.parse::<i32>().ok(); // Parse String to Option<i32>
    }
    if let Some(color) = folder.color {
        existing_folder.color = Some(color);
    }

    existing_folder.updated_at = chrono::Local::now().naive_local(); // Update timestamp

    crate::database::update_folder(&existing_folder)
        .await
        .map_err(|e| format!("Failed to update folder: {}", e))?;

    Ok(FolderResponse::from(existing_folder))
}

/// Delete a folder
#[command]
pub async fn delete_folder(id: String) -> Result<(), String> {
    crate::database::delete_folder(id.parse().unwrap_or_default()) // Parse String to i32
        .await
        .map_err(|e| format!("Failed to delete folder: {}", e))?;

    Ok(())
}