//! N8N connection-related database operations
//!
//! This module provides CRUD operations for N8N connections.

use anyhow::{Context, Result};
use rusqlite::{Connection, params, OptionalExtension};
use crate::database::models::N8nConnection;
use chrono::{Local, NaiveDateTime};

// ===== N8N Connection Operations =====

/// Create a new N8N connection
pub fn create_n8n_connection(
    conn: &Connection,
    name: &str,
    webhook_url: &str,
    api_key: Option<&str>,
    workflow_id: &str,
    user_id: &str,
) -> Result<i32> {
    let now = Local::now().naive_local().format("%Y-%m-%d %H:%M:%S").to_string();

    conn.execute(
        "INSERT INTO n8n_connections (name, webhook_url, api_key, workflow_id, is_active, user_id, created_at, updated_at) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            name,
            webhook_url,
            api_key,
            workflow_id,
            true,
            user_id,
            now,
            now
        ],
    ).context("Failed to create N8N connection")?;

    let connection_id = conn.last_insert_rowid() as i32;
    Ok(connection_id)
}

/// Get all N8N connections for a user
pub fn get_n8n_connections_by_user(conn: &Connection, user_id: &str) -> Result<Vec<N8nConnection>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, webhook_url, api_key, workflow_id, is_active, user_id, created_at, updated_at 
         FROM n8n_connections WHERE user_id = ?1 ORDER BY name ASC"
    ).context("Failed to prepare get N8N connections by user query")?;

    let connections = stmt.query_map(params![user_id], |row| {
        // Parse datetime strings back to NaiveDateTime
        let created_at_str: String = row.get(7)?;
        let updated_at_str: String = row.get(8)?;
        let created_at = NaiveDateTime::parse_from_str(&created_at_str, "%Y-%m-%d %H:%M:%S")
            .unwrap_or_else(|_| Local::now().naive_local());
        let updated_at = NaiveDateTime::parse_from_str(&updated_at_str, "%Y-%m-%d %H:%M:%S")
            .unwrap_or_else(|_| Local::now().naive_local());

        Ok(N8nConnection {
            id: row.get(0)?,
            name: row.get(1)?,
            webhook_url: row.get(2)?,
            api_key: row.get(3)?,
            workflow_id: row.get(4)?,
            is_active: row.get(5)?,
            user_id: row.get(6)?,
            created_at,
            updated_at,
        })
    }).context("Failed to execute get N8N connections by user query")?;

    let mut result = Vec::new();
    for connection in connections {
        result.push(connection.context("Failed to process N8N connection")?);
    }

    Ok(result)
}

/// Get a specific N8N connection by ID
pub fn get_n8n_connection(conn: &Connection, connection_id: i32) -> Result<Option<N8nConnection>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, webhook_url, api_key, workflow_id, is_active, user_id, created_at, updated_at 
         FROM n8n_connections WHERE id = ?1"
    ).context("Failed to prepare get N8N connection query")?;

    let connection = stmt.query_row(params![connection_id], |row| {
        // Parse datetime strings back to NaiveDateTime
        let created_at_str: String = row.get(7)?;
        let updated_at_str: String = row.get(8)?;
        let created_at = NaiveDateTime::parse_from_str(&created_at_str, "%Y-%m-%d %H:%M:%S")
            .unwrap_or_else(|_| Local::now().naive_local());
        let updated_at = NaiveDateTime::parse_from_str(&updated_at_str, "%Y-%m-%d %H:%M:%S")
            .unwrap_or_else(|_| Local::now().naive_local());

        Ok(N8nConnection {
            id: row.get(0)?,
            name: row.get(1)?,
            webhook_url: row.get(2)?,
            api_key: row.get(3)?,
            workflow_id: row.get(4)?,
            is_active: row.get(5)?,
            user_id: row.get(6)?,
            created_at,
            updated_at,
        })
    }).optional().context("Failed to get N8N connection")?;

    Ok(connection)
}

/// Update an N8N connection
pub fn update_n8n_connection(
    conn: &Connection,
    connection_id: i32,
    name: &str,
    webhook_url: &str,
    api_key: Option<&str>,
    workflow_id: &str,
) -> Result<()> {
    let now = Local::now().naive_local().format("%Y-%m-%d %H:%M:%S").to_string();

    conn.execute(
        "UPDATE n8n_connections SET name = ?1, webhook_url = ?2, api_key = ?3, workflow_id = ?4, updated_at = ?5 WHERE id = ?6",
        params![name, webhook_url, api_key, workflow_id, now, connection_id],
    ).context("Failed to update N8N connection")?;

    Ok(())
}

pub fn set_n8n_connection_active_status(conn: &Connection, connection_id: i32, is_active: bool) -> Result<()> {
    let now = Local::now().naive_local().format("%Y-%m-%d %H:%M:%S").to_string();

    conn.execute(
        "UPDATE n8n_connections SET is_active = ?1, updated_at = ?2 WHERE id = ?3",
        params![is_active, now, connection_id],
    ).context("Failed to update N8N connection active status")?;

    Ok(())
}

/// Delete an N8N connection
pub fn delete_n8n_connection(conn: &Connection, connection_id: i32) -> Result<()> {
    conn.execute(
        "DELETE FROM n8n_connections WHERE id = ?1",
        params![connection_id],
    ).context("Failed to delete N8N connection")?;

    Ok(())
}

/// Get active N8N connections for a user
pub fn get_active_n8n_connections(conn: &Connection, user_id: &str) -> Result<Vec<N8nConnection>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, webhook_url, api_key, workflow_id, is_active, user_id, created_at, updated_at 
         FROM n8n_connections WHERE user_id = ?1 AND is_active = ?2 ORDER BY name ASC"
    ).context("Failed to prepare get active N8N connections query")?;

    let connections = stmt.query_map(params![user_id, true], |row| {
        // Parse datetime strings back to NaiveDateTime
        let created_at_str: String = row.get(7)?;
        let updated_at_str: String = row.get(8)?;
        let created_at = NaiveDateTime::parse_from_str(&created_at_str, "%Y-%m-%d %H:%M:%S")
            .unwrap_or_else(|_| Local::now().naive_local());
        let updated_at = NaiveDateTime::parse_from_str(&updated_at_str, "%Y-%m-%d %H:%M:%S")
            .unwrap_or_else(|_| Local::now().naive_local());

        Ok(N8nConnection {
            id: row.get(0)?,
            name: row.get(1)?,
            webhook_url: row.get(2)?,
            api_key: row.get(3)?,
            workflow_id: row.get(4)?,
            is_active: row.get(5)?,
            user_id: row.get(6)?,
            created_at,
            updated_at,
        })
    }).context("Failed to execute get active N8N connections query")?;

    let mut result = Vec::new();
    for connection in connections {
        result.push(connection.context("Failed to process N8N connection")?);
    }

    Ok(result)
}

/// Get N8N connection by name
pub fn get_n8n_connection_by_name(conn: &Connection, user_id: &str, name: &str) -> Result<Option<N8nConnection>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, webhook_url, api_key, workflow_id, is_active, user_id, created_at, updated_at 
         FROM n8n_connections WHERE user_id = ?1 AND name = ?2"
    ).context("Failed to prepare get N8N connection by name query")?;

    let connection = stmt.query_row(params![user_id, name], |row| {
        // Parse datetime strings back to NaiveDateTime
        let created_at_str: String = row.get(7)?;
        let updated_at_str: String = row.get(8)?;
        let created_at = NaiveDateTime::parse_from_str(&created_at_str, "%Y-%m-%d %H:%M:%S")
            .unwrap_or_else(|_| Local::now().naive_local());
        let updated_at = NaiveDateTime::parse_from_str(&updated_at_str, "%Y-%m-%d %H:%M:%S")
            .unwrap_or_else(|_| Local::now().naive_local());

        Ok(N8nConnection {
            id: row.get(0)?,
            name: row.get(1)?,
            webhook_url: row.get(2)?,
            api_key: row.get(3)?,
            workflow_id: row.get(4)?,
            is_active: row.get(5)?,
            user_id: row.get(6)?,
            created_at,
            updated_at,
        })
    }).optional().context("Failed to get N8N connection by name")?;

    Ok(connection)
}

/// Get N8N connection by workflow ID
pub fn get_n8n_connection_by_workflow_id(conn: &Connection, user_id: &str, workflow_id: &str) -> Result<Option<N8nConnection>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, webhook_url, api_key, workflow_id, is_active, user_id, created_at, updated_at 
         FROM n8n_connections WHERE user_id = ?1 AND workflow_id = ?2"
    ).context("Failed to prepare get N8N connection by workflow ID query")?;

    let connection = stmt.query_row(params![user_id, workflow_id], |row| {
        // Parse datetime strings back to NaiveDateTime
        let created_at_str: String = row.get(7)?;
        let updated_at_str: String = row.get(8)?;
        let created_at = NaiveDateTime::parse_from_str(&created_at_str, "%Y-%m-%d %H:%M:%S")
            .unwrap_or_else(|_| Local::now().naive_local());
        let updated_at = NaiveDateTime::parse_from_str(&updated_at_str, "%Y-%m-%d %H:%M:%S")
            .unwrap_or_else(|_| Local::now().naive_local());

        Ok(N8nConnection {
            id: row.get(0)?,
            name: row.get(1)?,
            webhook_url: row.get(2)?,
            api_key: row.get(3)?,
            workflow_id: row.get(4)?,
            is_active: row.get(5)?,
            user_id: row.get(6)?,
            created_at,
            updated_at,
        })
    }).optional().context("Failed to get N8N connection by workflow ID")?;

    Ok(connection)
}

/// Test N8N webhook
pub fn test_n8n_webhook(conn: &Connection, connection_id: i32) -> Result<bool> {
    // This is a placeholder implementation - in a real scenario, you would
    // send a test request to the webhook URL and return the result
    let connection = get_n8n_connection(conn, connection_id)?;
    match connection {
        Some(_) => Ok(true), // Placeholder: assume webhook is accessible if connection exists
        None => Ok(false),
    }
} 