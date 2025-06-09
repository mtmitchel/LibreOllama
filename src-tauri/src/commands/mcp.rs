//! MCP (Model Context Protocol) server management commands for Tauri
//!
//! This module provides commands for creating, reading, updating, and deleting MCP server
//! configurations in the LibreOllama application.

use serde::{Deserialize, Serialize};
use tauri::command;
use crate::database::models::McpServer; // Adjusted import
// Using database operations
use chrono::TimeZone; // Added for NaiveDateTime to DateTime<Utc> conversion

/// Request structure for creating a new MCP server
#[derive(Debug, Deserialize)]
pub struct CreateMcpServerRequest {
    pub name: String,
    pub description: Option<String>,
    pub server_type: String, // "stdio" or "sse"
    pub command: Option<String>,
    pub args: Option<Vec<String>>,
    pub env: Option<serde_json::Value>,
    pub url: Option<String>,
    pub auth_token: Option<String>,
    pub user_id: String,
}

/// Request structure for updating an MCP server
#[derive(Debug, Deserialize)]
pub struct UpdateMcpServerRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub server_type: Option<String>,
    pub command: Option<String>,
    pub args: Option<Vec<String>>,
    pub env: Option<serde_json::Value>,
    pub url: Option<String>,
    pub auth_token: Option<String>,
    pub is_active: Option<bool>,
}

/// Response structure for MCP server operations
#[derive(Debug, Serialize)]
pub struct McpServerResponse {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub server_type: String,
    pub command: Option<String>,
    pub args: Option<Vec<String>>,
    pub env: Option<serde_json::Value>,
    pub url: Option<String>,
    pub auth_token: Option<String>,
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
            description: None, // Not in McpServer model
            server_type: "unknown".to_string(), // Not in McpServer model
            command: None, // Not in McpServer model
            args: None, // Not in McpServer model
            env: None, // Not in McpServer model
            url: Some(server.url),
            auth_token: server.api_key,
            is_active: server.is_active,
            user_id: server.user_id,
            created_at: chrono::Utc.from_utc_datetime(&server.created_at).to_rfc3339(),
            updated_at: chrono::Utc.from_utc_datetime(&server.updated_at).to_rfc3339(),
        }
    }
}

/// Create a new MCP server
#[command]
pub async fn create_mcp_server(server: CreateMcpServerRequest) -> Result<McpServerResponse, String> {
    let mut configuration = serde_json::json!({});
    if let Some(desc) = server.description {
        configuration["description"] = serde_json::json!(desc);
    }
    configuration["server_type"] = serde_json::json!(server.server_type);
    if let Some(cmd) = server.command {
        configuration["command"] = serde_json::json!(cmd);
    }
    if let Some(args) = server.args {
        configuration["args"] = serde_json::json!(args);
    }
    if let Some(env) = server.env {
        configuration["env"] = env;
    }

    let new_server = McpServer {
        id: 0, // Will be set by database
        name: server.name,
        url: server.url.unwrap_or_default(),
        api_key: server.auth_token,
        configuration,
        is_active: true,
        user_id: server.user_id,
        created_at: chrono::Local::now().naive_local(),
        updated_at: chrono::Local::now().naive_local(),
    };

    crate::database::create_mcp_server(&new_server)
        .await
        .map_err(|e| format!("Failed to create MCP server: {}", e))?;

    Ok(McpServerResponse::from(new_server))
}

/// Get all MCP servers for a user
#[command]
pub async fn get_mcp_servers(user_id: String) -> Result<Vec<McpServerResponse>, String> {
    let servers = crate::database::get_mcp_servers(&user_id)
        .await
        .map_err(|e| format!("Failed to get MCP servers: {}", e))?;

    Ok(servers.into_iter().map(McpServerResponse::from).collect())
}

/// Update an existing MCP server
#[command]
pub async fn update_mcp_server(id: String, server: UpdateMcpServerRequest) -> Result<McpServerResponse, String> {
    let mut existing_server = crate::database::get_mcp_server_by_id(id.parse().unwrap_or_default()) // Parse String to i32
        .await
        .map_err(|e| format!("Failed to get MCP server: {}", e))?
        .ok_or_else(|| "MCP server not found".to_string())?;

    // Update fields if provided
    if let Some(name) = server.name {
        existing_server.name = name;
    }
    if let Some(description) = server.description {
        existing_server.configuration["description"] = serde_json::json!(description);
    }
    if let Some(server_type) = server.server_type {
        existing_server.configuration["server_type"] = serde_json::json!(server_type);
    }
    if let Some(command) = server.command {
        existing_server.configuration["command"] = serde_json::json!(command);
    }
    if let Some(url) = server.url {
        existing_server.url = url;
    }
    if let Some(auth_token) = server.auth_token {
        existing_server.api_key = Some(auth_token);
    }
    if let Some(is_active) = server.is_active {
        existing_server.is_active = is_active;
    }

    // Update args if provided
    if let Some(args) = server.args {
        existing_server.configuration["args"] = serde_json::json!(args);
    }

    // Update env if provided
    if let Some(env) = server.env {
        existing_server.configuration["env"] = env;
    }

    existing_server.updated_at = chrono::Local::now().naive_local(); // Update timestamp

    crate::database::update_mcp_server(&existing_server)
        .await
        .map_err(|e| format!("Failed to update MCP server: {}", e))?;

    Ok(McpServerResponse::from(existing_server))
}

/// Delete an MCP server
#[command]
pub async fn delete_mcp_server(id: String) -> Result<(), String> {
    crate::database::delete_mcp_server(id.parse().unwrap_or_default()) // Parse String to i32
        .await
        .map_err(|e| format!("Failed to delete MCP server: {}", e))?;

    Ok(())
}