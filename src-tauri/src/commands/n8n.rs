//! n8n automation connection management commands for Tauri
//!
//! This module provides commands for creating, reading, updating, and deleting n8n connections
//! in the LibreOllama application.

use serde::{Deserialize, Serialize};
use tauri::{command, State};
use crate::database::models::N8nConnection;
use crate::database::operations;
use chrono::TimeZone;

/// Request structure for creating a new n8n connection
#[derive(Debug, Deserialize)]
pub struct CreateN8nConnectionRequest {
    pub name: String,
    pub webhook_url: String,
    pub api_key: Option<String>,
    pub workflow_id: String,
    pub user_id: String,
}

/// Request structure for updating an n8n connection
#[derive(Debug, Deserialize)]
pub struct UpdateN8nConnectionRequest {
    pub name: Option<String>,
    pub webhook_url: Option<String>,
    pub api_key: Option<String>,
    pub workflow_id: Option<String>,
    pub is_active: Option<bool>,
}

/// Response structure for n8n connection operations
#[derive(Debug, Serialize)]
pub struct N8nConnectionResponse {
    pub id: String,
    pub name: String,
    pub webhook_url: String,
    pub api_key: Option<String>,
    pub workflow_id: String,
    pub is_active: bool,
    pub user_id: String,
    pub created_at: String,
    pub updated_at: String,
}

impl From<N8nConnection> for N8nConnectionResponse {
    fn from(connection: N8nConnection) -> Self {
        Self {
            id: connection.id.to_string(),
            name: connection.name,
            webhook_url: connection.webhook_url,
            api_key: connection.api_key,
            workflow_id: connection.workflow_id,
            is_active: connection.is_active,
            user_id: connection.user_id,
            created_at: chrono::Utc.from_utc_datetime(&connection.created_at).to_rfc3339(),
            updated_at: chrono::Utc.from_utc_datetime(&connection.updated_at).to_rfc3339(),
        }
    }
}

/// Create a new n8n connection
#[command]
pub async fn create_n8n_connection(
    connection: CreateN8nConnectionRequest,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<N8nConnectionResponse, String> {
    let db_manager_clone = db_manager.inner().clone();
    let conn_name = connection.name.clone();
    let conn_webhook_url = connection.webhook_url.clone();
    let conn_api_key = connection.api_key.clone();
    let conn_workflow_id = connection.workflow_id.clone();
    let conn_user_id = connection.user_id.clone();
    
    let created_connection_id = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::n8n_operations::create_n8n_connection(
            &conn,
            &connection.name,
            &connection.webhook_url,
            connection.api_key.as_deref(),
            &connection.workflow_id,
            &connection.user_id,
        )
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;
    
    let new_connection = N8nConnection {
        id: created_connection_id,
        name: conn_name,
        webhook_url: conn_webhook_url,
        api_key: conn_api_key,
        workflow_id: conn_workflow_id,
        is_active: true,
        user_id: conn_user_id,
        created_at: chrono::Local::now().naive_local(),
        updated_at: chrono::Local::now().naive_local(),
    };

    Ok(N8nConnectionResponse::from(new_connection))
}

/// Get all n8n connections for a user
#[command]
pub async fn get_n8n_connections(
    user_id: String,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<Vec<N8nConnectionResponse>, String> {
    let db_manager_clone = db_manager.inner().clone();
    let connections = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::n8n_operations::get_n8n_connections_by_user(&conn, &user_id)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;

    Ok(connections.into_iter().map(N8nConnectionResponse::from).collect())
}

/// Get a specific n8n connection by ID
#[command]
pub async fn get_n8n_connection(
    id: String,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<Option<N8nConnectionResponse>, String> {
    let connection_id = id.parse().map_err(|_| "Invalid connection ID".to_string())?;
    let db_manager_clone = db_manager.inner().clone();
    
    let connection = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::n8n_operations::get_n8n_connection(&conn, connection_id)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;

    Ok(connection.map(N8nConnectionResponse::from))
}

/// Update an existing n8n connection
#[command]
pub async fn update_n8n_connection(
    id: String,
    connection_update: UpdateN8nConnectionRequest,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<N8nConnectionResponse, String> {
    let connection_id = id.parse().map_err(|_| "Invalid connection ID".to_string())?;
    let db_manager_clone = db_manager.inner().clone();

    let mut existing_connection = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::n8n_operations::get_n8n_connection(&conn, connection_id)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?
    .ok_or_else(|| "Connection not found".to_string())?;

    if let Some(name) = connection_update.name { existing_connection.name = name; }
    if let Some(webhook_url) = connection_update.webhook_url { existing_connection.webhook_url = webhook_url; }
    if let Some(api_key) = connection_update.api_key { existing_connection.api_key = Some(api_key); }
    if let Some(workflow_id) = connection_update.workflow_id { existing_connection.workflow_id = workflow_id; }
    if let Some(is_active) = connection_update.is_active { existing_connection.is_active = is_active; }
    existing_connection.updated_at = chrono::Local::now().naive_local();

    let connection_id = existing_connection.id;
    let connection_name = existing_connection.name.clone();
    let connection_webhook_url = existing_connection.webhook_url.clone();
    let connection_api_key = existing_connection.api_key.clone();
    let connection_workflow_id = existing_connection.workflow_id.clone();
    
    let db_manager_clone_update = db_manager.inner().clone();
    tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone_update.get_connection()?;
        operations::n8n_operations::update_n8n_connection(
            &conn, 
            connection_id, 
            &connection_name, 
            &connection_webhook_url, 
            connection_api_key.as_deref(), 
            &connection_workflow_id
        )
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;

    Ok(N8nConnectionResponse::from(existing_connection))
}

/// Delete an n8n connection
#[command]
pub async fn delete_n8n_connection(
    id: String,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<(), String> {
    let connection_id = id.parse().map_err(|_| "Invalid connection ID".to_string())?;
    let db_manager_clone = db_manager.inner().clone();

    tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::n8n_operations::delete_n8n_connection(&conn, connection_id)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;

    Ok(())
}

/// Test an n8n webhook connection
#[command]
pub async fn test_n8n_connection(
    id: String,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<bool, String> {
    let connection_id = id.parse().map_err(|_| "Invalid connection ID".to_string())?;
    let db_manager_clone = db_manager.inner().clone();
    
    let connection = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::n8n_operations::get_n8n_connection(&conn, connection_id)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?
    .ok_or_else(|| "Connection not found".to_string())?;

    // In a real implementation, this would test the actual webhook
    // For now, we'll just validate that the connection has a valid webhook URL
    let url_valid = !connection.webhook_url.is_empty() && 
        (connection.webhook_url.starts_with("http://") || connection.webhook_url.starts_with("https://"));
    
    Ok(url_valid)
} 