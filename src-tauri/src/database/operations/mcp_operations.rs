//! MCP server-related database operations
//!
//! This module provides CRUD operations for MCP servers.

use anyhow::{Context, Result};
use rusqlite::{Connection, params, OptionalExtension};
use crate::database::models::McpServer;
use chrono::{Local, NaiveDateTime};
use serde_json;

// ===== MCP Server Operations =====

/// Create a new MCP server
pub fn create_mcp_server(
    conn: &Connection,
    name: &str,
    url: &str,
    api_key: Option<&str>,
    configuration: serde_json::Value,
    user_id: &str,
) -> Result<i32> {
    let now = Local::now().naive_local().format("%Y-%m-%d %H:%M:%S").to_string();
    let config_json = serde_json::to_string(&configuration).context("Failed to serialize configuration")?;

    conn.execute(
        "INSERT INTO mcp_servers (name, url, api_key, configuration, is_active, user_id, created_at, updated_at) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            name,
            url,
            api_key,
            config_json,
            true,
            user_id,
            now,
            now
        ],
    ).context("Failed to create MCP server")?;

    let server_id = conn.last_insert_rowid() as i32;
    Ok(server_id)
}

pub fn get_mcp_server(conn: &Connection, server_id: i32) -> Result<Option<McpServer>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, url, api_key, configuration, is_active, user_id, created_at, updated_at 
         FROM mcp_servers WHERE id = ?1"
    ).context("Failed to prepare get MCP server query")?;

    let server = stmt.query_row(params![server_id], |row| {
        let config_json: String = row.get(4)?;
        let configuration: serde_json::Value = serde_json::from_str(&config_json)
            .unwrap_or(serde_json::Value::Object(serde_json::Map::new()));

        // Parse datetime strings back to NaiveDateTime
        let created_at_str: String = row.get(7)?;
        let updated_at_str: String = row.get(8)?;
        let created_at = NaiveDateTime::parse_from_str(&created_at_str, "%Y-%m-%d %H:%M:%S")
            .unwrap_or_else(|_| Local::now().naive_local());
        let updated_at = NaiveDateTime::parse_from_str(&updated_at_str, "%Y-%m-%d %H:%M:%S")
            .unwrap_or_else(|_| Local::now().naive_local());

        Ok(McpServer {
            id: row.get(0)?,
            name: row.get(1)?,
            url: row.get(2)?,
            api_key: row.get(3)?,
            configuration,
            is_active: row.get(5)?,
            user_id: row.get(6)?,
            created_at,
            updated_at,
        })
    }).optional().context("Failed to get MCP server")?;

    Ok(server)
}

pub fn get_mcp_servers_by_user(conn: &Connection, user_id: &str) -> Result<Vec<McpServer>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, url, api_key, configuration, is_active, user_id, created_at, updated_at 
         FROM mcp_servers WHERE user_id = ?1 ORDER BY name ASC"
    ).context("Failed to prepare get MCP servers by user query")?;

    let servers = stmt.query_map(params![user_id], |row| {
        let config_json: String = row.get(4)?;
        let configuration: serde_json::Value = serde_json::from_str(&config_json)
            .unwrap_or(serde_json::Value::Object(serde_json::Map::new()));

        // Parse datetime strings back to NaiveDateTime
        let created_at_str: String = row.get(7)?;
        let updated_at_str: String = row.get(8)?;
        let created_at = NaiveDateTime::parse_from_str(&created_at_str, "%Y-%m-%d %H:%M:%S")
            .unwrap_or_else(|_| Local::now().naive_local());
        let updated_at = NaiveDateTime::parse_from_str(&updated_at_str, "%Y-%m-%d %H:%M:%S")
            .unwrap_or_else(|_| Local::now().naive_local());

        Ok(McpServer {
            id: row.get(0)?,
            name: row.get(1)?,
            url: row.get(2)?,
            api_key: row.get(3)?,
            configuration,
            is_active: row.get(5)?,
            user_id: row.get(6)?,
            created_at,
            updated_at,
        })
    }).context("Failed to execute get MCP servers by user query")?;

    let mut result = Vec::new();
    for server in servers {
        result.push(server.context("Failed to process MCP server")?);
    }

    Ok(result)
}

pub fn get_active_mcp_servers(conn: &Connection, user_id: &str) -> Result<Vec<McpServer>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, url, api_key, configuration, is_active, user_id, created_at, updated_at 
         FROM mcp_servers WHERE user_id = ?1 AND is_active = ?2 ORDER BY name ASC"
    ).context("Failed to prepare get active MCP servers query")?;

    let servers = stmt.query_map(params![user_id, true], |row| {
        let config_json: String = row.get(4)?;
        let configuration: serde_json::Value = serde_json::from_str(&config_json)
            .unwrap_or(serde_json::Value::Object(serde_json::Map::new()));

        // Parse datetime strings back to NaiveDateTime
        let created_at_str: String = row.get(7)?;
        let updated_at_str: String = row.get(8)?;
        let created_at = NaiveDateTime::parse_from_str(&created_at_str, "%Y-%m-%d %H:%M:%S")
            .unwrap_or_else(|_| Local::now().naive_local());
        let updated_at = NaiveDateTime::parse_from_str(&updated_at_str, "%Y-%m-%d %H:%M:%S")
            .unwrap_or_else(|_| Local::now().naive_local());

        Ok(McpServer {
            id: row.get(0)?,
            name: row.get(1)?,
            url: row.get(2)?,
            api_key: row.get(3)?,
            configuration,
            is_active: row.get(5)?,
            user_id: row.get(6)?,
            created_at,
            updated_at,
        })
    }).context("Failed to execute get active MCP servers query")?;

    let mut result = Vec::new();
    for server in servers {
        result.push(server.context("Failed to process MCP server")?);
    }

    Ok(result)
}

pub fn update_mcp_server(
    conn: &Connection,
    server_id: i32,
    name: &str,
    url: &str,
    api_key: Option<&str>,
    configuration: serde_json::Value,
) -> Result<()> {
    let now = Local::now().naive_local().format("%Y-%m-%d %H:%M:%S").to_string();
    let config_json = serde_json::to_string(&configuration).context("Failed to serialize configuration")?;

    conn.execute(
        "UPDATE mcp_servers SET name = ?1, url = ?2, api_key = ?3, configuration = ?4, updated_at = ?5 WHERE id = ?6",
        params![name, url, api_key, config_json, now, server_id],
    ).context("Failed to update MCP server")?;

    Ok(())
}

pub fn set_mcp_server_active_status(conn: &Connection, server_id: i32, is_active: bool) -> Result<()> {
    let now = Local::now().naive_local().format("%Y-%m-%d %H:%M:%S").to_string();

    conn.execute(
        "UPDATE mcp_servers SET is_active = ?1, updated_at = ?2 WHERE id = ?3",
        params![is_active, now, server_id],
    ).context("Failed to update MCP server active status")?;

    Ok(())
}

pub fn delete_mcp_server(conn: &Connection, server_id: i32) -> Result<()> {
    conn.execute(
        "DELETE FROM mcp_servers WHERE id = ?1",
        params![server_id],
    ).context("Failed to delete MCP server")?;

    Ok(())
}

pub fn get_mcp_server_by_name(conn: &Connection, user_id: &str, name: &str) -> Result<Option<McpServer>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, url, api_key, configuration, is_active, user_id, created_at, updated_at 
         FROM mcp_servers WHERE user_id = ?1 AND name = ?2"
    ).context("Failed to prepare get MCP server by name query")?;

    let server = stmt.query_row(params![user_id, name], |row| {
        let config_json: String = row.get(4)?;
        let configuration: serde_json::Value = serde_json::from_str(&config_json)
            .unwrap_or(serde_json::Value::Object(serde_json::Map::new()));

        // Parse datetime strings back to NaiveDateTime
        let created_at_str: String = row.get(7)?;
        let updated_at_str: String = row.get(8)?;
        let created_at = NaiveDateTime::parse_from_str(&created_at_str, "%Y-%m-%d %H:%M:%S")
            .unwrap_or_else(|_| Local::now().naive_local());
        let updated_at = NaiveDateTime::parse_from_str(&updated_at_str, "%Y-%m-%d %H:%M:%S")
            .unwrap_or_else(|_| Local::now().naive_local());

        Ok(McpServer {
            id: row.get(0)?,
            name: row.get(1)?,
            url: row.get(2)?,
            api_key: row.get(3)?,
            configuration,
            is_active: row.get(5)?,
            user_id: row.get(6)?,
            created_at,
            updated_at,
        })
    }).optional().context("Failed to get MCP server by name")?;

    Ok(server)
}

pub fn get_all_mcp_servers(conn: &Connection) -> Result<Vec<McpServer>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, url, api_key, configuration, is_active, user_id, created_at, updated_at 
         FROM mcp_servers ORDER BY name ASC"
    ).context("Failed to prepare get all MCP servers query")?;

    let servers = stmt.query_map([], |row| {
        let config_json: String = row.get(4)?;
        let configuration: serde_json::Value = serde_json::from_str(&config_json)
            .unwrap_or(serde_json::Value::Object(serde_json::Map::new()));

        // Parse datetime strings back to NaiveDateTime
        let created_at_str: String = row.get(7)?;
        let updated_at_str: String = row.get(8)?;
        let created_at = NaiveDateTime::parse_from_str(&created_at_str, "%Y-%m-%d %H:%M:%S")
            .unwrap_or_else(|_| Local::now().naive_local());
        let updated_at = NaiveDateTime::parse_from_str(&updated_at_str, "%Y-%m-%d %H:%M:%S")
            .unwrap_or_else(|_| Local::now().naive_local());

        Ok(McpServer {
            id: row.get(0)?,
            name: row.get(1)?,
            url: row.get(2)?,
            api_key: row.get(3)?,
            configuration,
            is_active: row.get(5)?,
            user_id: row.get(6)?,
            created_at,
            updated_at,
        })
    }).context("Failed to execute get all MCP servers query")?;

    let mut result = Vec::new();
    for server in servers {
        result.push(server.context("Failed to process MCP server")?);
    }

    Ok(result)
}

pub fn test_mcp_server_connection(conn: &Connection, server_id: i32) -> Result<bool> {
    // This is a placeholder implementation - in a real scenario, you would
    // attempt to connect to the MCP server and return the result
    let server = get_mcp_server(conn, server_id)?;
    match server {
        Some(_) => Ok(true), // Placeholder: assume connection is successful if server exists
        None => Ok(false),
    }
} 