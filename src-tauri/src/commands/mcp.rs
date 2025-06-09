//! MCP (Model Context Protocol) server management commands for Tauri
//!
//! This module provides commands for creating, reading, updating, and deleting MCP server
//! configurations in the LibreOllama application.

use serde::{Deserialize, Serialize};
use tauri::command;
use crate::database::McpServer;

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
        let args = server.args.and_then(|a| {
            if a.is_empty() {
                None
            } else {
                serde_json::from_str::<Vec<String>>(&a).ok()
            }
        });

        let env = server.env.and_then(|e| {
            if e.is_empty() {
                None
            } else {
                serde_json::from_str::<serde_json::Value>(&e).ok()
            }
        });

        Self {
            id: server.id,
            name: server.name,
            description: server.description,
            server_type: server.server_type,
            command: server.command,
            args,
            env,
            url: server.url,
            auth_token: server.auth_token,
            is_active: server.is_active,
            user_id: server.user_id,
            created_at: server.created_at.to_rfc3339(),
            updated_at: server.updated_at.to_rfc3339(),
        }
    }
}

/// Create a new MCP server
#[command]
pub async fn create_mcp_server(server: CreateMcpServerRequest) -> Result<McpServerResponse, String> {
    let mut new_server = McpServer::new(
        server.name,
        server.description,
        server.server_type,
        server.user_id,
    );

    // Set optional fields
    new_server.command = server.command;
    new_server.url = server.url;
    new_server.auth_token = server.auth_token;

    // Serialize args if provided
    if let Some(args) = server.args {
        new_server.args = Some(serde_json::to_string(&args)
            .map_err(|e| format!("Failed to serialize args: {}", e))?);
    }

    // Serialize env if provided
    if let Some(env) = server.env {
        new_server.env = Some(serde_json::to_string(&env)
            .map_err(|e| format!("Failed to serialize env: {}", e))?);
    }

    operations::create_mcp_server(&new_server)
        .map_err(|e| format!("Failed to create MCP server: {}", e))?;

    Ok(McpServerResponse::from(new_server))
}

/// Get all MCP servers for a user
#[command]
pub async fn get_mcp_servers(user_id: String) -> Result<Vec<McpServerResponse>, String> {
    let servers = operations::get_mcp_servers(&user_id)
        .map_err(|e| format!("Failed to get MCP servers: {}", e))?;

    Ok(servers.into_iter().map(McpServerResponse::from).collect())
}

/// Update an existing MCP server
#[command]
pub async fn update_mcp_server(id: String, server: UpdateMcpServerRequest) -> Result<McpServerResponse, String> {
    let mut existing_server = operations::get_mcp_server_by_id(&id)
        .map_err(|e| format!("Failed to get MCP server: {}", e))?
        .ok_or_else(|| "MCP server not found".to_string())?;

    // Update fields if provided
    if let Some(name) = server.name {
        existing_server.name = name;
    }
    if let Some(description) = server.description {
        existing_server.description = Some(description);
    }
    if let Some(server_type) = server.server_type {
        existing_server.server_type = server_type;
    }
    if let Some(command) = server.command {
        existing_server.command = Some(command);
    }
    if let Some(url) = server.url {
        existing_server.url = Some(url);
    }
    if let Some(auth_token) = server.auth_token {
        existing_server.auth_token = Some(auth_token);
    }
    if let Some(is_active) = server.is_active {
        existing_server.is_active = is_active;
    }

    // Update args if provided
    if let Some(args) = server.args {
        existing_server.args = Some(serde_json::to_string(&args)
            .map_err(|e| format!("Failed to serialize args: {}", e))?);
    }

    // Update env if provided
    if let Some(env) = server.env {
        existing_server.env = Some(serde_json::to_string(&env)
            .map_err(|e| format!("Failed to serialize env: {}", e))?);
    }

    existing_server.touch();

    operations::update_mcp_server(&existing_server)
        .map_err(|e| format!("Failed to update MCP server: {}", e))?;

    Ok(McpServerResponse::from(existing_server))
}

/// Delete an MCP server
#[command]
pub async fn delete_mcp_server(id: String) -> Result<(), String> {
    operations::delete_mcp_server(&id)
        .map_err(|e| format!("Failed to delete MCP server: {}", e))?;

    Ok(())
}