//! Project Operations Module
//!
//! This module contains database operations for project management.

use anyhow::{Context, Result};
use rusqlite::{Connection, ToSql};
use chrono::{Utc, Local};

use crate::database::models::{Project, ProjectGoal, ProjectAsset};

// =============================================================================
// Project CRUD Operations
// =============================================================================

/// Create a new project
pub fn create_project(
    conn: &Connection,
    name: String,
    description: String,
    color: String,
    user_id: String,
) -> Result<i64> {
    let now = Utc::now().naive_utc();
    
    let project_id = conn.execute(
        "INSERT INTO projects (name, description, color, user_id, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        [&name, &description, &color, &user_id, &now.to_string(), &now.to_string()],
    ).context("Failed to create project")?;

    Ok(project_id as i64)
}

/// Get all projects for a user
pub fn get_projects_by_user(conn: &Connection, user_id: &str) -> Result<Vec<Project>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, description, color, status, progress, priority, user_id, created_at, updated_at
         FROM projects 
         WHERE user_id = ?1 
         ORDER BY updated_at DESC"
    ).context("Failed to prepare get projects query")?;

    let project_iter = stmt.query_map([user_id], |row| {
        Ok(Project::from(row))
    }).context("Failed to execute get projects query")?;

    let mut projects = Vec::new();
    for project in project_iter {
        projects.push(project.context("Failed to parse project row")?);
    }

    Ok(projects)
}

/// Get a specific project by ID
pub fn get_project_by_id(conn: &Connection, project_id: i32) -> Result<Option<Project>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, description, color, status, progress, priority, user_id, created_at, updated_at
         FROM projects 
         WHERE id = ?1"
    ).context("Failed to prepare get project query")?;

    let mut project_iter = stmt.query_map([project_id], |row| {
        Ok(Project::from(row))
    }).context("Failed to execute get project query")?;

    match project_iter.next() {
        Some(project) => Ok(Some(project.context("Failed to parse project row")?)),
        None => Ok(None),
    }
}

/// Update a project
pub fn update_project(
    conn: &Connection,
    project_id: i32,
    name: Option<String>,
    description: Option<String>,
    color: Option<String>,
    status: Option<String>,
    progress: Option<i32>,
    priority: Option<String>,
) -> Result<bool> {
    let now = Utc::now().naive_utc();
    let now_string = now.to_string();
    
    // Build dynamic update query
    let mut query_parts = Vec::new();
    let mut params: Vec<&dyn ToSql> = Vec::new();
    
    if let Some(ref n) = name {
        query_parts.push("name = ?");
        params.push(n);
    }
    if let Some(ref d) = description {
        query_parts.push("description = ?");
        params.push(d);
    }
    if let Some(ref c) = color {
        query_parts.push("color = ?");
        params.push(c);
    }
    if let Some(ref s) = status {
        query_parts.push("status = ?");
        params.push(s);
    }
    if let Some(ref p) = progress {
        query_parts.push("progress = ?");
        params.push(p);
    }
    if let Some(ref pr) = priority {
        query_parts.push("priority = ?");
        params.push(pr);
    }
    
    if query_parts.is_empty() {
        return Ok(false); // Nothing to update
    }
    
    query_parts.push("updated_at = ?");
    params.push(&now_string);
    params.push(&project_id);
    
    let query = format!(
        "UPDATE projects SET {} WHERE id = ?",
        query_parts.join(", ")
    );
    
    conn.execute(&query, &params[..])?;
    Ok(true)
}

/// Delete a project and all associated data
pub fn delete_project(conn: &Connection, project_id: i32) -> Result<bool> {
    let rows_affected = conn.execute(
        "DELETE FROM projects WHERE id = ?1",
        [project_id],
    ).context("Failed to delete project")?;

    Ok(rows_affected > 0)
}

// =============================================================================
// Project Goal Operations
// =============================================================================

/// Create a new project goal
pub fn create_project_goal(
    conn: &Connection,
    project_id: i32,
    title: String,
    priority: String,
) -> Result<i64> {
    let now = Utc::now().naive_utc();
    
    let goal_id = conn.execute(
        "INSERT INTO project_goals (project_id, title, priority, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        [&project_id.to_string(), &title, &priority, &now.to_string(), &now.to_string()],
    ).context("Failed to create project goal")?;

    Ok(goal_id as i64)
}

/// Get all goals for a project
pub fn get_project_goals(conn: &Connection, project_id: i32) -> Result<Vec<ProjectGoal>> {
    let mut stmt = conn.prepare(
        "SELECT id, project_id, title, completed, priority, due_date, created_at, updated_at
         FROM project_goals 
         WHERE project_id = ?1 
         ORDER BY created_at ASC"
    ).context("Failed to prepare get project goals query")?;

    let goal_iter = stmt.query_map([project_id], |row| {
        Ok(ProjectGoal::from(row))
    }).context("Failed to execute get project goals query")?;

    let mut goals = Vec::new();
    for goal in goal_iter {
        goals.push(goal.context("Failed to parse project goal row")?);
    }

    Ok(goals)
}

/// Update a project goal
pub fn update_project_goal(
    conn: &Connection,
    goal_id: i32,
    title: Option<&str>,
    description: Option<&str>,
    completed: Option<bool>,
    priority: Option<&str>,
) -> Result<bool> {
    let now = Local::now().naive_local();
    let mut query_parts = Vec::new();
    let mut has_updates = false;
    
    if title.is_some() {
        query_parts.push("title = ?");
        has_updates = true;
    }
    
    if description.is_some() {
        query_parts.push("description = ?");
        has_updates = true;
    }
    
    if completed.is_some() {
        query_parts.push("completed = ?");
        has_updates = true;
    }
    
    if priority.is_some() {
        query_parts.push("priority = ?");
        has_updates = true;
    }
    
    if !has_updates {
        return Ok(false); // Nothing to update
    }
    
    query_parts.push("updated_at = ?");
    let now_string = now.to_string();
    
    let query = format!(
        "UPDATE project_goals SET {} WHERE id = ?",
        query_parts.join(", ")
    );
    
    // Build params dynamically based on what's being updated
    let mut param_values: Vec<&dyn ToSql> = Vec::new();
    
    // Store references to the Option contents that live long enough
    let title_ref = title.as_ref();
    let description_ref = description.as_ref();
    let priority_ref = priority.as_ref();
    
    if let Some(t) = title_ref {
        param_values.push(t);
    }
    if let Some(d) = description_ref {
        param_values.push(d);
    }
    if let Some(ref c) = completed {
        param_values.push(c);
    }
    if let Some(p) = priority_ref {
        param_values.push(p);
    }
    param_values.push(&now_string);
    param_values.push(&goal_id);
    
    conn.execute(&query, param_values.as_slice())?;
    Ok(true)
}

/// Delete a project goal
pub fn delete_project_goal(conn: &Connection, goal_id: i32) -> Result<bool> {
    let rows_affected = conn.execute(
        "DELETE FROM project_goals WHERE id = ?1",
        [goal_id],
    ).context("Failed to delete project goal")?;

    Ok(rows_affected > 0)
}

// =============================================================================
// Project Asset Operations
// =============================================================================

/// Create a new project asset
pub fn create_project_asset(
    conn: &Connection,
    project_id: i32,
    name: String,
    asset_type: String,
    url: String,
    uploaded_by: String,
    size: Option<i64>,
    metadata: Option<String>,
) -> Result<i64> {
    let now = Utc::now().naive_utc();
    
    let asset_id = conn.execute(
        "INSERT INTO project_assets (project_id, name, asset_type, url, uploaded_by, size, metadata, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        [
            &project_id.to_string(),
            &name,
            &asset_type,
            &url,
            &uploaded_by,
            &size.map(|s| s.to_string()).unwrap_or_default(),
            &metadata.unwrap_or_default(),
            &now.to_string(),
            &now.to_string()
        ],
    ).context("Failed to create project asset")?;

    Ok(asset_id as i64)
}

/// Get all assets for a project
pub fn get_project_assets(conn: &Connection, project_id: i32) -> Result<Vec<ProjectAsset>> {
    let mut stmt = conn.prepare(
        "SELECT id, project_id, name, asset_type, url, size, metadata, uploaded_by, created_at, updated_at
         FROM project_assets 
         WHERE project_id = ?1 
         ORDER BY created_at DESC"
    ).context("Failed to prepare get project assets query")?;

    let asset_iter = stmt.query_map([project_id], |row| {
        Ok(ProjectAsset::from(row))
    }).context("Failed to execute get project assets query")?;

    let mut assets = Vec::new();
    for asset in asset_iter {
        assets.push(asset.context("Failed to parse project asset row")?);
    }

    Ok(assets)
}

/// Delete a project asset
pub fn delete_project_asset(conn: &Connection, asset_id: i32) -> Result<bool> {
    let rows_affected = conn.execute(
        "DELETE FROM project_assets WHERE id = ?1",
        [asset_id],
    ).context("Failed to delete project asset")?;

    Ok(rows_affected > 0)
}

// =============================================================================
// Project Statistics
// =============================================================================

/// Get project statistics
pub fn get_project_stats(conn: &Connection, project_id: i32) -> Result<serde_json::Value> {
    // Get goal statistics
    let mut stmt = conn.prepare(
        "SELECT 
            COUNT(*) as total_goals,
            SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_goals
         FROM project_goals 
         WHERE project_id = ?1"
    ).context("Failed to prepare goal stats query")?;

    let goal_stats = stmt.query_row([project_id], |row| {
        Ok((
            row.get::<_, i32>("total_goals")?,
            row.get::<_, i32>("completed_goals")?
        ))
    }).context("Failed to get goal statistics")?;

    // Get asset statistics
    let mut stmt = conn.prepare(
        "SELECT 
            COUNT(*) as total_assets,
            COUNT(DISTINCT asset_type) as asset_types
         FROM project_assets 
         WHERE project_id = ?1"
    ).context("Failed to prepare asset stats query")?;

    let asset_stats = stmt.query_row([project_id], |row| {
        Ok((
            row.get::<_, i32>("total_assets")?,
            row.get::<_, i32>("asset_types")?
        ))
    }).context("Failed to get asset statistics")?;

    Ok(serde_json::json!({
        "goals": {
            "total": goal_stats.0,
            "completed": goal_stats.1,
            "completion_rate": if goal_stats.0 > 0 { 
                (goal_stats.1 as f64 / goal_stats.0 as f64 * 100.0) as i32 
            } else { 0 }
        },
        "assets": {
            "total": asset_stats.0,
            "types": asset_stats.1
        }
    }))
} 