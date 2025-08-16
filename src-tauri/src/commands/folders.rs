#![cfg(feature = "folders")]
//! Folder Management Commands
//!
//! This module provides commands for managing folders in the application.

use serde::{Deserialize, Serialize};
use tauri::{command, State};
use std::sync::Arc;
use crate::database::models::Folder;
use crate::database::operations;

#[derive(Debug, Serialize)]
pub struct FolderResponse {
    pub id: String,
    pub name: String,
    pub parent_id: Option<String>,
    pub color: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

impl From<Folder> for FolderResponse {
    fn from(folder: Folder) -> Self {
        Self {
            id: folder.id.to_string(),
            name: folder.name,
            parent_id: folder.parent_id.map(|id| id.to_string()),
            color: folder.color,
            created_at: folder.created_at.to_string(),
            updated_at: folder.updated_at.to_string(),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct CreateFolderRequest {
    pub name: String,
    pub parent_id: Option<i32>,
    pub color: Option<String>,
    pub user_id: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateFolderRequest {
    pub name: Option<String>,
    pub parent_id: Option<Option<i32>>,
    pub color: Option<String>,
}

#[command]
pub async fn get_folders(
    db_manager: State<'_, Arc<crate::database::DatabaseManager>>,
) -> Result<Vec<FolderResponse>, String> {
    let db_manager_clone = db_manager.inner().clone();
    let folders = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection().map_err(|e| e.to_string())?;
        operations::folder_operations::get_folders_by_user(&conn, "default_user").map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e| e)?;

    let folder_responses: Vec<FolderResponse> = folders.into_iter().map(FolderResponse::from).collect();
    Ok(folder_responses)
}

#[command]
pub async fn create_folder(
    name: String,
    parent_id: Option<i32>,
    color: Option<String>,
    user_id: String,
    db_manager: State<'_, Arc<crate::database::DatabaseManager>>,
) -> Result<FolderResponse, String> {
    let db_manager_clone = db_manager.inner().clone();
    let folder = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection().map_err(|e| e.to_string())?;
        operations::folder_operations::create_folder(
            &conn, 
            &name, 
            parent_id, 
            &user_id, 
            color.as_deref()
        ).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e| e)?;

    Ok(FolderResponse::from(folder))
}

#[command]
pub async fn update_folder(
    id: String,
    folder: UpdateFolderRequest,
    db_manager: State<'_, Arc<crate::database::DatabaseManager>>,
) -> Result<FolderResponse, String> {
    let folder_id: i32 = id.parse().map_err(|_| "Invalid folder ID")?;
    
    let db_manager_clone = db_manager.inner().clone();
    let updated_folder = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection().map_err(|e| e.to_string())?;
        operations::folder_operations::update_folder(
            &conn, 
            folder_id, 
            folder.name.as_deref(), 
            folder.parent_id.flatten(), 
            folder.color.as_deref()
        ).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e| e)?;

    Ok(FolderResponse::from(updated_folder))
}

#[command]
pub async fn delete_folder(
    id: String,
    db_manager: State<'_, Arc<crate::database::DatabaseManager>>,
) -> Result<(), String> {
    let folder_id: i32 = id.parse().map_err(|_| "Invalid folder ID")?;
    
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