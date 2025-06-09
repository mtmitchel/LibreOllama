//! N8N workflow connection management commands for Tauri
//!
//! This module provides commands for creating, reading, updating, and deleting N8N
//! workflow connections in the LibreOllama application.

use serde::{Deserialize, Serialize};
use tauri::command;
use crate::database::N8nConnection;

/// Request structure for creating a new N8N connection
#[derive(Debug, Deserialize)]
pub struct CreateN8nConnectionRequest {
    pub name: String,
    pub description: Option<String>,
    pub base_url: String,
    pub api_key: Option<String>,
    pub webhook_url: Option<String>,
    pub user_id: String,
}

/// Request structure for updating an N8N connection
#[derive(Debug, Deserialize)]
pub struct UpdateN8nConnectionRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub base_url: Option<String>,
    pub api_key: Option<String>,
    pub webhook_url: Option<String>,
    pub is_active: Option<bool>,
}

/// Response structure for N8N connection operations
#[derive(Debug, Serialize)]
pub struct N8nConnectionResponse {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub base_url: String,
    pub api_key: Option<String>,
    pub webhook_url: Option<String>,
    pub is_active: bool,
    pub user_id: String,
    pub created_at: String,
    pub updated_at: String,
}

impl From<N8nConnection> for N8nConnectionResponse {
    fn from(connection: N8nConnection) -> Self {
        Self {
            id: connection.id,
            name: connection.name,
            description: connection.description,
            base_url: connection.base_url,
            api_key: connection.api_key,
            webhook_url: connection.webhook_url,
            is_active: connection.is_active,
            user_id: connection.user_id,
            created_at: connection.created_at.to_rfc3339(),
            updated_at: connection.updated_at.to_rfc3339(),
        }
    }
}

/// Create a new N8N connection
#[command]
pub async fn create_n8n_connection(connection: CreateN8nConnectionRequest) -> Result<N8nConnectionResponse, String> {
    let mut new_connection = N8nConnection::new(
        connection.name,
        connection.description,
        connection.base_url,
        connection.user_id,
    );

    // Set optional fields
    new_connection.api_key = connection.api_key;
    new_connection.webhook_url = connection.webhook_url;

    operations::create_n8n_connection(&new_connection)
        .map_err(|e| format!("Failed to create N8N connection: {}", e))?;

    Ok(N8nConnectionResponse::from(new_connection))
}

/// Get all N8N connections for a user
#[command]
pub async fn get_n8n_connections(user_id: String) -> Result<Vec<N8nConnectionResponse>, String> {
    let connections = operations::get_n8n_connections(&user_id)
        .map_err(|e| format!("Failed to get N8N connections: {}", e))?;

    Ok(connections.into_iter().map(N8nConnectionResponse::from).collect())
}

/// Update an existing N8N connection
#[command]
pub async fn update_n8n_connection(id: String, connection: UpdateN8nConnectionRequest) -> Result<N8nConnectionResponse, String> {
    let mut existing_connection = operations::get_n8n_connection_by_id(&id)
        .map_err(|e| format!("Failed to get N8N connection: {}", e))?
        .ok_or_else(|| "N8N connection not found".to_string())?;

    // Update fields if provided
    if let Some(name) = connection.name {
        existing_connection.name = name;
    }
    if let Some(description) = connection.description {
        existing_connection.description = Some(description);
    }
    if let Some(base_url) = connection.base_url {
        existing_connection.base_url = base_url;
    }
    if let Some(api_key) = connection.api_key {
        existing_connection.api_key = Some(api_key);
    }
    if let Some(webhook_url) = connection.webhook_url {
        existing_connection.webhook_url = Some(webhook_url);
    }
    if let Some(is_active) = connection.is_active {
        existing_connection.is_active = is_active;
    }

    existing_connection.touch();

    operations::update_n8n_connection(&existing_connection)
        .map_err(|e| format!("Failed to update N8N connection: {}", e))?;

    Ok(N8nConnectionResponse::from(existing_connection))
}

/// Delete an N8N connection
#[command]
pub async fn delete_n8n_connection(id: String) -> Result<(), String> {
    operations::delete_n8n_connection(&id)
        .map_err(|e| format!("Failed to delete N8N connection: {}", e))?;

    Ok(())
}