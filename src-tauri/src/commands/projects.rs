//! Project Management Commands
//!
//! This module contains all project-related Tauri commands.

use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc, TimeZone};

// Import database modules
use crate::database::{Project as DbProject, ProjectGoal as DbProjectGoal, ProjectAsset as DbProjectAsset};
use crate::database::operations;

// Data structures for project functionality (compatible with frontend)
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ProjectApi {
    pub id: String,
    pub name: String,
    pub description: String,
    pub color: String,
    pub status: String,
    pub progress: i32,
    pub priority: String,
    pub user_id: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ProjectGoalApi {
    pub id: String,
    pub project_id: String,
    pub title: String,
    pub completed: bool,
    pub priority: String,
    pub due_date: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ProjectAssetApi {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub asset_type: String,
    pub url: String,
    pub size: Option<i64>,
    pub metadata: Option<String>,
    pub uploaded_by: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// Helper functions to convert between database models and API models
impl From<DbProject> for ProjectApi {
    fn from(db_project: DbProject) -> Self {
        Self {
            id: db_project.id.to_string(),
            name: db_project.name,
            description: db_project.description,
            color: db_project.color,
            status: db_project.status,
            progress: db_project.progress,
            priority: db_project.priority,
            user_id: db_project.user_id,
            created_at: Utc.from_utc_datetime(&db_project.created_at),
            updated_at: Utc.from_utc_datetime(&db_project.updated_at),
        }
    }
}

impl From<DbProjectGoal> for ProjectGoalApi {
    fn from(db_goal: DbProjectGoal) -> Self {
        Self {
            id: db_goal.id.to_string(),
            project_id: db_goal.project_id.to_string(),
            title: db_goal.title,
            completed: db_goal.completed,
            priority: db_goal.priority,
            due_date: db_goal.due_date.map(|d| Utc.from_utc_datetime(&d)),
            created_at: Utc.from_utc_datetime(&db_goal.created_at),
            updated_at: Utc.from_utc_datetime(&db_goal.updated_at),
        }
    }
}

impl From<DbProjectAsset> for ProjectAssetApi {
    fn from(db_asset: DbProjectAsset) -> Self {
        Self {
            id: db_asset.id.to_string(),
            project_id: db_asset.project_id.to_string(),
            name: db_asset.name,
            asset_type: db_asset.asset_type,
            url: db_asset.url,
            size: db_asset.size,
            metadata: db_asset.metadata,
            uploaded_by: db_asset.uploaded_by,
            created_at: Utc.from_utc_datetime(&db_asset.created_at),
            updated_at: Utc.from_utc_datetime(&db_asset.updated_at),
        }
    }
}

// =============================================================================
// Project Management Commands
// =============================================================================

#[tauri::command]
pub async fn create_project(
    name: String,
    description: String,
    color: String,
    user_id: String,
    db_manager: tauri::State<'_, crate::database::DatabaseManager>,
) -> Result<String, String> {
    let db_manager_clone = db_manager.inner().clone();
    let project_id = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection().map_err(|e| e.to_string())?;
        operations::project_operations::create_project(&conn, name, description, color, user_id).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e| e)?;

    Ok(project_id.to_string())
}

#[tauri::command]
pub async fn get_projects(
    user_id: String,
    db_manager: tauri::State<'_, crate::database::DatabaseManager>,
) -> Result<Vec<ProjectApi>, String> {
    let db_manager_clone = db_manager.inner().clone();
    let projects = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::project_operations::get_projects_by_user(&conn, &user_id)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;

    // Convert to API format
    let projects_api: Vec<ProjectApi> = projects.into_iter().map(ProjectApi::from).collect();
    Ok(projects_api)
}

#[tauri::command]
pub async fn get_project(
    project_id: String,
    db_manager: tauri::State<'_, crate::database::DatabaseManager>,
) -> Result<Option<ProjectApi>, String> {
    let project_id: i32 = project_id.parse().map_err(|_| "Invalid project ID")?;
    
    let db_manager_clone = db_manager.inner().clone();
    let project = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::project_operations::get_project_by_id(&conn, project_id)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;

    Ok(project.map(ProjectApi::from))
}

#[tauri::command]
pub async fn update_project(
    project_id: String,
    name: Option<String>,
    description: Option<String>,
    color: Option<String>,
    status: Option<String>,
    progress: Option<i32>,
    priority: Option<String>,
    db_manager: tauri::State<'_, crate::database::DatabaseManager>,
) -> Result<bool, String> {
    let project_id: i32 = project_id.parse().map_err(|_| "Invalid project ID")?;
    
    let db_manager_clone = db_manager.inner().clone();
    let success = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::project_operations::update_project(
            &conn, project_id, name, description, color, status, progress, priority
        )
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;

    Ok(success)
}

#[tauri::command]
pub async fn delete_project(
    project_id: String,
    db_manager: tauri::State<'_, crate::database::DatabaseManager>,
) -> Result<bool, String> {
    let project_id: i32 = project_id.parse().map_err(|_| "Invalid project ID")?;
    
    let db_manager_clone = db_manager.inner().clone();
    let success = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::project_operations::delete_project(&conn, project_id)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;

    Ok(success)
}

// =============================================================================
// Project Goal Commands  
// =============================================================================

#[tauri::command]
pub async fn create_project_goal(
    project_id: String,
    title: String,
    priority: String,
    db_manager: tauri::State<'_, crate::database::DatabaseManager>,
) -> Result<String, String> {
    let project_id: i32 = project_id.parse().map_err(|_| "Invalid project ID")?;
    
    let db_manager_clone = db_manager.inner().clone();
    let goal_id = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::project_operations::create_project_goal(&conn, project_id, title, priority)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;

    Ok(goal_id.to_string())
}

#[tauri::command]
pub async fn get_project_goals(
    project_id: String,
    db_manager: tauri::State<'_, crate::database::DatabaseManager>,
) -> Result<Vec<ProjectGoalApi>, String> {
    let project_id: i32 = project_id.parse().map_err(|_| "Invalid project ID")?;
    
    let db_manager_clone = db_manager.inner().clone();
    let goals = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::project_operations::get_project_goals(&conn, project_id)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;

    // Convert to API format
    let goals_api: Vec<ProjectGoalApi> = goals.into_iter().map(ProjectGoalApi::from).collect();
    Ok(goals_api)
}

#[tauri::command]
pub async fn update_project_goal(
    goal_id: String,
    title: Option<String>,
    description: Option<String>,
    completed: Option<bool>,
    priority: Option<String>,
    db_manager: tauri::State<'_, crate::database::DatabaseManager>,
) -> Result<bool, String> {
    let goal_id: i32 = goal_id.parse().map_err(|_| "Invalid goal ID")?;
    
    let db_manager_clone = db_manager.inner().clone();
    let success = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::project_operations::update_project_goal(
            &conn, goal_id, title.as_deref(), description.as_deref(), completed, priority.as_deref()
        )
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;

    Ok(success)
}

#[tauri::command]
pub async fn delete_project_goal(
    goal_id: String,
    db_manager: tauri::State<'_, crate::database::DatabaseManager>,
) -> Result<bool, String> {
    let goal_id: i32 = goal_id.parse().map_err(|_| "Invalid goal ID")?;
    
    let db_manager_clone = db_manager.inner().clone();
    let success = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::project_operations::delete_project_goal(&conn, goal_id)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;

    Ok(success)
}

// =============================================================================
// Project Asset Commands
// =============================================================================

#[tauri::command]
pub async fn create_project_asset(
    project_id: String,
    name: String,
    asset_type: String,
    url: String,
    uploaded_by: String,
    size: Option<i64>,
    metadata: Option<String>,
    db_manager: tauri::State<'_, crate::database::DatabaseManager>,
) -> Result<String, String> {
    let project_id: i32 = project_id.parse().map_err(|_| "Invalid project ID")?;
    
    let db_manager_clone = db_manager.inner().clone();
    let asset_id = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::project_operations::create_project_asset(
            &conn, project_id, name, asset_type, url, uploaded_by, size, metadata
        )
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;

    Ok(asset_id.to_string())
}

#[tauri::command]
pub async fn get_project_assets(
    project_id: String,
    db_manager: tauri::State<'_, crate::database::DatabaseManager>,
) -> Result<Vec<ProjectAssetApi>, String> {
    let project_id: i32 = project_id.parse().map_err(|_| "Invalid project ID")?;
    
    let db_manager_clone = db_manager.inner().clone();
    let assets = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::project_operations::get_project_assets(&conn, project_id)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;

    // Convert to API format
    let assets_api: Vec<ProjectAssetApi> = assets.into_iter().map(ProjectAssetApi::from).collect();
    Ok(assets_api)
}

#[tauri::command]
pub async fn delete_project_asset(
    asset_id: String,
    db_manager: tauri::State<'_, crate::database::DatabaseManager>,
) -> Result<bool, String> {
    let asset_id: i32 = asset_id.parse().map_err(|_| "Invalid asset ID")?;
    
    let db_manager_clone = db_manager.inner().clone();
    let success = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::project_operations::delete_project_asset(&conn, asset_id)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;

    Ok(success)
}

// =============================================================================
// Project Statistics Commands
// =============================================================================

#[tauri::command]
pub async fn get_project_stats(
    project_id: String,
    db_manager: tauri::State<'_, crate::database::DatabaseManager>,
) -> Result<serde_json::Value, String> {
    let project_id: i32 = project_id.parse().map_err(|_| "Invalid project ID")?;
    
    let db_manager_clone = db_manager.inner().clone();
    let stats = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::project_operations::get_project_stats(&conn, project_id)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;

    Ok(stats)
} 