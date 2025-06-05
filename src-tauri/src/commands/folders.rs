//! Folder management commands for Tauri
//!
//! This module provides commands for creating, reading, updating, and deleting folders
//! in the LibreOllama application.

use serde::{Deserialize, Serialize};
use tauri::command;
use crate::database::{models::Folder, operations};

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
            id: folder.id,
            name: folder.name,
            parent_id: folder.parent_id,
            color: folder.color,
            user_id: folder.user_id,
            created_at: folder.created_at.to_rfc3339(),
            updated_at: folder.updated_at.to_rfc3339(),
        }
    }
}

/// Create a new folder
#[command]
pub async fn create_folder(folder: CreateFolderRequest) -> Result<FolderResponse, String> {
    let new_folder = Folder::new(
        folder.name,
        folder.parent_id,
        folder.user_id,
        folder.color,
    );

    operations::create_folder(&new_folder)
        .map_err(|e| format!("Failed to create folder: {}", e))?;

    Ok(FolderResponse::from(new_folder))
}

/// Get all folders for a user
#[command]
pub async fn get_folders(user_id: String) -> Result<Vec<FolderResponse>, String> {
    let folders = operations::get_folders(&user_id)
        .map_err(|e| format!("Failed to get folders: {}", e))?;

    Ok(folders.into_iter().map(FolderResponse::from).collect())
}

/// Update an existing folder
#[command]
pub async fn update_folder(id: String, folder: UpdateFolderRequest) -> Result<FolderResponse, String> {
    let mut existing_folder = operations::get_folder_by_id(&id)
        .map_err(|e| format!("Failed to get folder: {}", e))?
        .ok_or_else(|| "Folder not found".to_string())?;

    // Update fields if provided
    if let Some(name) = folder.name {
        existing_folder.name = name;
    }
    if let Some(parent_id) = folder.parent_id {
        existing_folder.parent_id = Some(parent_id);
    }
    if let Some(color) = folder.color {
        existing_folder.color = Some(color);
    }

    existing_folder.touch();

    operations::update_folder(&existing_folder)
        .map_err(|e| format!("Failed to update folder: {}", e))?;

    Ok(FolderResponse::from(existing_folder))
}

/// Delete a folder
#[command]
pub async fn delete_folder(id: String) -> Result<(), String> {
    operations::delete_folder(&id)
        .map_err(|e| format!("Failed to delete folder: {}", e))?;

    Ok(())
}