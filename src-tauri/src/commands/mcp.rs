//! MCP (Model Context Protocol) server management commands for Tauri
//!
//! This module provides commands for creating, reading, updating, and deleting MCP servers
//! in the LibreOllama application.

use serde::{Deserialize, Serialize};
use tauri::{command, State};
use crate::database::models::McpServer;
use crate::database::operations;
use chrono::TimeZone;

/// Request structure for creating a new MCP server
#[derive(Debug, Deserialize)]
pub struct CreateMcpServerRequest {
    pub name: String,
    pub url: String,
    pub api_key: Option<String>,
    pub configuration: serde_json::Value,
    pub user_id: String,
}

/// Request structure for updating an MCP server
#[derive(Debug, Deserialize)]
pub struct UpdateMcpServerRequest {
    pub name: Option<String>,
    pub url: Option<String>,
    pub api_key: Option<String>,
    pub configuration: Option<serde_json::Value>,
    pub is_active: Option<bool>,
}

/// Response structure for MCP server operations
#[derive(Debug, Serialize)]
pub struct McpServerResponse {
    pub id: String,
    pub name: String,
    pub url: String,
    pub api_key: Option<String>,
    pub configuration: serde_json::Value,
    pub is_active: bool,
    pub user_id: String,
    pub created_at: String,
    pub updated_at: String,
}

impl From<McpServer> for McpServerResponse {
    fn from(server: McpServer) -> Self {
        Self {
            id: server.id.to_string(),
            name: server.name,
            url: server.url,
            api_key: server.api_key,
            configuration: server.configuration,
            is_active: server.is_active,
            user_id: server.user_id,
            created_at: chrono::Utc.from_utc_datetime(&server.created_at).to_rfc3339(),
            updated_at: chrono::Utc.from_utc_datetime(&server.updated_at).to_rfc3339(),
        }
    }
}

/// Create a new MCP server
#[command]
pub async fn create_mcp_server(
    server: CreateMcpServerRequest,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<McpServerResponse, String> {
    let db_manager_clone = db_manager.inner().clone();
    let server_name = server.name.clone();
    let server_url = server.url.clone();
    let server_api_key = server.api_key.clone();
    let server_config = server.configuration.clone();
    let server_user_id = server.user_id.clone();
    
    let created_server_id = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::mcp_operations::create_mcp_server(
            &conn,
            &server.name,
            &server.url,
            server.api_key.as_deref(),
            server.configuration,
            &server.user_id,
        )
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;
    
    let new_server = McpServer {
        id: created_server_id,
        name: server_name,
        url: server_url,
        api_key: server_api_key,
        configuration: server_config,
        is_active: true,
        user_id: server_user_id,
        created_at: chrono::Local::now().naive_local(),
        updated_at: chrono::Local::now().naive_local(),
    };

    Ok(McpServerResponse::from(new_server))
}

/// Get all MCP servers for a user
#[command]
pub async fn get_mcp_servers(
    user_id: String,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<Vec<McpServerResponse>, String> {
    let db_manager_clone = db_manager.inner().clone();
    let servers = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::mcp_operations::get_mcp_servers_by_user(&conn, &user_id)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;

    Ok(servers.into_iter().map(McpServerResponse::from).collect())
}

/// Get a specific MCP server by ID
#[command]
pub async fn get_mcp_server(
    id: String,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<Option<McpServerResponse>, String> {
    let server_id = id.parse().map_err(|_| "Invalid server ID".to_string())?;
    let db_manager_clone = db_manager.inner().clone();
    
    let server = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::mcp_operations::get_mcp_server(&conn, server_id)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;

    Ok(server.map(McpServerResponse::from))
}

/// Update an existing MCP server
#[command]
pub async fn update_mcp_server(
    id: String,
    server_update: UpdateMcpServerRequest,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<McpServerResponse, String> {
    let server_id = id.parse().map_err(|_| "Invalid server ID".to_string())?;
    let db_manager_clone = db_manager.inner().clone();

    let mut existing_server = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::mcp_operations::get_mcp_server(&conn, server_id)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?
    .ok_or_else(|| "Server not found".to_string())?;

    if let Some(name) = server_update.name { existing_server.name = name; }
    if let Some(url) = server_update.url { existing_server.url = url; }
    if let Some(api_key) = server_update.api_key { existing_server.api_key = Some(api_key); }
    if let Some(config) = server_update.configuration { existing_server.configuration = config; }
    if let Some(is_active) = server_update.is_active { existing_server.is_active = is_active; }
    existing_server.updated_at = chrono::Local::now().naive_local();

    let server_id = existing_server.id;
    let server_name = existing_server.name.clone();
    let server_url = existing_server.url.clone();
    let server_api_key = existing_server.api_key.clone();
    let server_config = existing_server.configuration.clone();
    
    let db_manager_clone_update = db_manager.inner().clone();
    tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone_update.get_connection()?;
        operations::mcp_operations::update_mcp_server(
            &conn, 
            server_id, 
            &server_name, 
            &server_url, 
            server_api_key.as_deref(), 
            server_config
        )
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;

    Ok(McpServerResponse::from(existing_server))
}

/// Delete an MCP server
#[command]
pub async fn delete_mcp_server(
    id: String,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<(), String> {
    let server_id = id.parse().map_err(|_| "Invalid server ID".to_string())?;
    let db_manager_clone = db_manager.inner().clone();

    tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::mcp_operations::delete_mcp_server(&conn, server_id)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;

    Ok(())
}

/// Test connection to an MCP server
#[command]
pub async fn test_mcp_server_connection(
    id: String,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<bool, String> {
    let server_id = id.parse().map_err(|_| "Invalid server ID".to_string())?;
    let db_manager_clone = db_manager.inner().clone();
    
    let server = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::mcp_operations::get_mcp_server(&conn, server_id)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?
    .ok_or_else(|| "Server not found".to_string())?;

    // In a real implementation, this would test the actual connection
    // For now, we'll just validate that the server has a valid URL
    let url_valid = !server.url.is_empty() && (server.url.starts_with("http://") || server.url.starts_with("https://"));
    
    Ok(url_valid)
} 