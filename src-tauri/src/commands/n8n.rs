//! N8N workflow connection management commands for Tauri
//!
//! This module provides commands for creating, reading, updating, and deleting N8N
//! workflow connections in the LibreOllama application.

use crate::database::models::N8nConnection; // Ensure this model exists or adjust path
// Using database operations
use chrono::TimeZone; // Added for NaiveDateTime to DateTime<Utc> conversion
use serde::{Deserialize, Serialize};
use tauri::command;

impl From<N8nConnection> for N8nConnectionResponse {
    fn from(connection: N8nConnection) -> Self {
        Self {
            id: connection.id.to_string(),
            name: connection.name,
            description: None, // description field doesn't exist in N8nConnection
            base_url: connection.webhook_url.clone(), // Using webhook_url as base_url
            api_key: connection.api_key,
            webhook_url: Some(connection.webhook_url),
            is_active: connection.is_active,
            user_id: connection.user_id,
            created_at: chrono::Utc.from_utc_datetime(&connection.created_at).to_rfc3339(),
            updated_at: chrono::Utc.from_utc_datetime(&connection.updated_at).to_rfc3339(),
        }
    }
}

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

/// Create a new N8N connection
#[command]
pub async fn create_n8n_connection(connection: CreateN8nConnectionRequest) -> Result<N8nConnectionResponse, String> {
    let new_connection = N8nConnection {
        id: 0, // Will be set by database
        name: connection.name,
        webhook_url: connection.webhook_url.unwrap_or(connection.base_url),
        api_key: connection.api_key,
        workflow_id: "".to_string(), // Default empty workflow_id
        is_active: true,
        user_id: connection.user_id,
        created_at: chrono::Local::now().naive_local(),
        updated_at: chrono::Local::now().naive_local(),
    };

    crate::database::create_n8n_connection(&new_connection)
        .await
        .map_err(|e| format!("Failed to create N8N connection: {}", e))?;

    Ok(N8nConnectionResponse::from(new_connection))
}

/// Get all N8N connections for a user
#[command]
pub async fn get_n8n_connections(user_id: String) -> Result<Vec<N8nConnectionResponse>, String> {
    let connections = crate::database::get_n8n_connections(&user_id)
        .await
        .map_err(|e| format!("Failed to get N8N connections: {}", e))?;

    Ok(connections.into_iter().map(N8nConnectionResponse::from).collect())
}

/// Update an existing N8N connection
#[command]
pub async fn update_n8n_connection(id: String, connection: UpdateN8nConnectionRequest) -> Result<N8nConnectionResponse, String> {
    let mut existing_connection = crate::database::get_n8n_connection_by_id(id.parse().unwrap_or_default()) // Parse String to i32
        .await
        .map_err(|e| format!("Failed to get N8N connection: {}", e))?
        .ok_or_else(|| "N8N connection not found".to_string())?;

    // Update fields if provided
    if let Some(name) = connection.name {
        existing_connection.name = name;
    }
    // Note: description doesn't exist in N8nConnection
    if let Some(base_url) = connection.base_url {
        existing_connection.webhook_url = base_url;
    }
    if let Some(api_key) = connection.api_key {
        existing_connection.api_key = Some(api_key);
    }
    if let Some(webhook_url) = connection.webhook_url {
        existing_connection.webhook_url = webhook_url;
    }
    if let Some(is_active) = connection.is_active {
        existing_connection.is_active = is_active;
    }

    existing_connection.updated_at = chrono::Local::now().naive_local(); // Update timestamp

    crate::database::update_n8n_connection(&existing_connection)
        .await
        .map_err(|e| format!("Failed to update N8N connection: {}", e))?;

    Ok(N8nConnectionResponse::from(existing_connection))
}

/// Delete an N8N connection
#[command]
pub async fn delete_n8n_connection(id: String) -> Result<(), String> {
    crate::database::delete_n8n_connection(id.parse().unwrap_or_default()) // Parse String to i32
        .await
        .map_err(|e| format!("Failed to delete N8N connection: {}", e))?;

    Ok(())
}