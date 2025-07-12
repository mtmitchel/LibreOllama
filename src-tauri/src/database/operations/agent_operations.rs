//! Agent-related database operations
//!
//! This module provides CRUD operations for agents.

use anyhow::Result;
use rusqlite::{Connection, params, OptionalExtension};
use crate::database::models::{Agent, AgentExecution};
use chrono::Local;
use serde_json;

// ===== Agent Operations =====

/// Create a new agent
pub fn create_agent(
    conn: &Connection,
    name: &str,
    description: &str,
    system_prompt: &str,
    model_name: &str,
    temperature: f64,
    max_tokens: i32,
    capabilities: Vec<String>,
    parameters: serde_json::Value,
) -> Result<i32> {
    let now = Local::now().naive_local();
    let capabilities_json = serde_json::to_string(&capabilities)?;
    let parameters_json = serde_json::to_string(&parameters)?;

    conn.execute(
        "INSERT INTO agents (name, description, model_name, system_prompt, temperature, max_tokens, capabilities, parameters, is_active, created_at, updated_at) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        params![
            name,
            description,
            model_name,
            system_prompt,
            temperature,
            max_tokens,
            capabilities_json,
            parameters_json,
            true,
            now,
            now
        ],
    )?;

    let agent_id = conn.last_insert_rowid() as i32;
    Ok(agent_id)
}

pub fn get_all_agents(conn: &Connection) -> Result<Vec<Agent>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, description, model_name, system_prompt, temperature, max_tokens, is_active, capabilities, parameters, created_at, updated_at 
         FROM agents ORDER BY name ASC"
    )?;

    let agents = stmt.query_map([], |row| {
        let capabilities_json: String = row.get(8)?;
        let parameters_json: String = row.get(9)?;
        
        let capabilities: Vec<String> = serde_json::from_str(&capabilities_json).unwrap_or_default();
        let parameters: serde_json::Value = serde_json::from_str(&parameters_json).unwrap_or(serde_json::Value::Object(serde_json::Map::new()));

        Ok(Agent {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            model_name: row.get(3)?,
            system_prompt: row.get(4)?,
            temperature: row.get(5)?,
            max_tokens: row.get(6)?,
            is_active: row.get(7)?,
            capabilities,
            parameters,
            created_at: row.get(10)?,
            updated_at: row.get(11)?,
        })
    })?;

    let mut result = Vec::new();
    for agent in agents {
        result.push(agent?);
    }

    Ok(result)
}

pub fn get_active_agents(conn: &Connection) -> Result<Vec<Agent>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, description, model_name, system_prompt, temperature, max_tokens, is_active, capabilities, parameters, created_at, updated_at 
         FROM agents WHERE is_active = ?1 ORDER BY name ASC"
    )?;

    let agents = stmt.query_map(params![true], |row| {
        let capabilities_json: String = row.get(8)?;
        let parameters_json: String = row.get(9)?;
        
        let capabilities: Vec<String> = serde_json::from_str(&capabilities_json).unwrap_or_default();
        let parameters: serde_json::Value = serde_json::from_str(&parameters_json).unwrap_or(serde_json::Value::Object(serde_json::Map::new()));

        Ok(Agent {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            model_name: row.get(3)?,
            system_prompt: row.get(4)?,
            temperature: row.get(5)?,
            max_tokens: row.get(6)?,
            is_active: row.get(7)?,
            capabilities,
            parameters,
            created_at: row.get(10)?,
            updated_at: row.get(11)?,
        })
    })?;

    let mut result = Vec::new();
    for agent in agents {
        result.push(agent?);
    }

    Ok(result)
}

pub fn set_agent_active_status(conn: &Connection, agent_id: i32, is_active: bool) -> Result<()> {
    let now = Local::now().naive_local();

    conn.execute(
        "UPDATE agents SET is_active = ?1, updated_at = ?2 WHERE id = ?3",
        params![is_active, now, agent_id],
    )?;

    Ok(())
}

/// Get a specific agent by name
pub fn get_agent(conn: &Connection, agent_id: i32) -> Result<Option<Agent>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, description, model_name, system_prompt, temperature, max_tokens, is_active, capabilities, parameters, created_at, updated_at 
         FROM agents WHERE id = ?1"
    )?;

    let agent = stmt.query_row(params![agent_id], |row| {
        let capabilities_json: String = row.get(8)?;
        let parameters_json: String = row.get(9)?;
        
        let capabilities: Vec<String> = serde_json::from_str(&capabilities_json).unwrap_or_default();
        let parameters: serde_json::Value = serde_json::from_str(&parameters_json).unwrap_or(serde_json::Value::Object(serde_json::Map::new()));

        Ok(Agent {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            model_name: row.get(3)?,
            system_prompt: row.get(4)?,
            temperature: row.get(5)?,
            max_tokens: row.get(6)?,
            is_active: row.get(7)?,
            capabilities,
            parameters,
            created_at: row.get(10)?,
            updated_at: row.get(11)?,
        })
    }).optional()?;

    Ok(agent)
}

/// Update an agent
pub fn update_agent(
    conn: &Connection,
    agent_id: i32,
    name: &str,
    description: &str,
    system_prompt: &str,
    capabilities: Vec<String>,
    parameters: serde_json::Value,
    model_name: Option<&str>,
    temperature: Option<f64>,
    max_tokens: Option<i32>,
) -> Result<()> {
    let now = Local::now().naive_local();
    let capabilities_json = serde_json::to_string(&capabilities)?;
    let parameters_json = serde_json::to_string(&parameters)?;
    
    // Use defaults if not provided
    let model_name = model_name.unwrap_or("llama3:latest");
    let temperature = temperature.unwrap_or(0.7);
    let max_tokens = max_tokens.unwrap_or(2048);

    conn.execute(
        "UPDATE agents SET name = ?1, description = ?2, system_prompt = ?3, 
        capabilities = ?4, parameters = ?5, model_name = ?6, temperature = ?7, 
        max_tokens = ?8, updated_at = ?9 WHERE id = ?10",
        params![
            name,
            description,
            system_prompt,
            capabilities_json,
            parameters_json,
            model_name,
            temperature,
            max_tokens,
            now,
            agent_id
        ],
    )?;

    Ok(())
}

/// Delete an agent
pub fn delete_agent(conn: &Connection, agent_id: i32) -> Result<()> {
    // First delete all agent executions
    conn.execute(
        "DELETE FROM agent_executions WHERE agent_id = ?1",
        params![agent_id],
    )?;

    // Then delete the agent
    conn.execute(
        "DELETE FROM agents WHERE id = ?1",
        params![agent_id],
    )?;

    Ok(())
}

// ===== Agent Execution Operations =====

/// Create a new agent execution
pub fn create_agent_execution(
    conn: &Connection,
    agent_id: i32,
    session_id: Option<i32>,
    input: &str,
    output: &str,
    status: &str,
    error_message: Option<&str>,
) -> Result<i32> {
    let now = Local::now().naive_local();

    conn.execute(
        "INSERT INTO agent_executions (agent_id, session_id, input, output, status, error_message, executed_at) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            agent_id,
            session_id,
            input,
            output,
            status,
            error_message,
            now
        ],
    )?;

    let execution_id = conn.last_insert_rowid() as i32;
    Ok(execution_id)
}

/// Get a specific agent execution by ID
pub fn get_agent_execution(conn: &Connection, execution_id: i32) -> Result<Option<AgentExecution>> {
    let mut stmt = conn.prepare(
        "SELECT id, agent_id, session_id, input, output, status, error_message, executed_at 
         FROM agent_executions WHERE id = ?1"
    )?;

    let execution = stmt.query_row(params![execution_id], |row| {
        Ok(AgentExecution {
            id: row.get(0)?,
            agent_id: row.get(1)?,
            session_id: row.get(2)?,
            input: row.get(3)?,
            output: row.get(4)?,
            status: row.get(5)?,
            error_message: row.get(6)?,
            executed_at: row.get(7)?,
        })
    }).optional()?;

    Ok(execution)
}

/// Get all executions for a specific agent
pub fn get_agent_executions_by_agent(conn: &Connection, agent_id: i32) -> Result<Vec<AgentExecution>> {
    let mut stmt = conn.prepare(
        "SELECT id, agent_id, session_id, input, output, status, error_message, executed_at 
         FROM agent_executions WHERE agent_id = ?1 ORDER BY executed_at DESC"
    )?;

    let executions = stmt.query_map(params![agent_id], |row| {
        Ok(AgentExecution {
            id: row.get(0)?,
            agent_id: row.get(1)?,
            session_id: row.get(2)?,
            input: row.get(3)?,
            output: row.get(4)?,
            status: row.get(5)?,
            error_message: row.get(6)?,
            executed_at: row.get(7)?,
        })
    })?;

    let mut result = Vec::new();
    for execution in executions {
        result.push(execution?);
    }

    Ok(result)
}

/// Get all executions for a specific session
pub fn get_agent_executions_by_session(conn: &Connection, session_id: i32) -> Result<Vec<AgentExecution>> {
    let mut stmt = conn.prepare(
        "SELECT id, agent_id, session_id, input, output, status, error_message, executed_at 
         FROM agent_executions WHERE session_id = ?1 ORDER BY executed_at DESC"
    )?;

    let executions = stmt.query_map(params![session_id], |row| {
        Ok(AgentExecution {
            id: row.get(0)?,
            agent_id: row.get(1)?,
            session_id: row.get(2)?,
            input: row.get(3)?,
            output: row.get(4)?,
            status: row.get(5)?,
            error_message: row.get(6)?,
            executed_at: row.get(7)?,
        })
    })?;

    let mut result = Vec::new();
    for execution in executions {
        result.push(execution?);
    }

    Ok(result)
}

/// Update the status of a specific agent execution
pub fn update_agent_execution_status(conn: &Connection, execution_id: i32, status: &str, error_message: Option<&str>) -> Result<()> {
    conn.execute(
        "UPDATE agent_executions SET status = ?1, error_message = ?2 WHERE id = ?3",
        params![status, error_message, execution_id],
    )?;

    Ok(())
}

/// Delete a specific agent execution
pub fn delete_agent_execution(conn: &Connection, execution_id: i32) -> Result<()> {
    conn.execute(
        "DELETE FROM agent_executions WHERE id = ?1",
        params![execution_id],
    )?;

    Ok(())
}

/// Get all agents (legacy function for command compatibility)
pub fn get_agents(_active_only: bool) -> Result<Vec<Agent>> {
    // This function provides backward compatibility for commands
    // In a real implementation, you might want to filter by active status
    // For now, we'll return all agents with a placeholder implementation
    Ok(Vec::new()) // TODO: Implement proper async database connection
}

// ===== Link Operations =====

/// Link statistics structure
#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct LinkStatistics {
    pub total_links: i32,
    pub total_content: i32,
    pub most_linked_content: Vec<(String, String, i32)>, // (title, type, link_count)
    pub orphaned_content: i32,
}

/// Clean up orphaned link suggestions (older than 24 hours)
pub fn cleanup_link_suggestions(conn: &Connection) -> Result<()> {
    conn.execute(
        "DELETE FROM link_suggestions 
         WHERE created_at < datetime('now', '-24 hours')",
        [],
    )?;
    Ok(())
}

/// Get link statistics for a user
pub fn get_link_statistics(conn: &Connection, user_id: &str) -> Result<LinkStatistics> {
    let total_links: i32 = conn
        .prepare("SELECT COUNT(*) FROM link_relationships WHERE user_id = ?1")?
        .query_row([user_id], |row| row.get(0))?;

    let total_content: i32 = conn
        .prepare("SELECT COUNT(*) FROM content_index WHERE user_id = ?1")?
        .query_row([user_id], |row| row.get(0))?;

    let most_linked_content: Vec<(String, String, i32)> = conn
        .prepare(
            "SELECT ci.title, ci.content_type, COUNT(lr.id) as link_count
             FROM content_index ci
             LEFT JOIN link_relationships lr ON ci.content_id = lr.target_id 
                 AND ci.content_type = lr.target_type
             WHERE ci.user_id = ?1
             GROUP BY ci.content_id, ci.content_type
             ORDER BY link_count DESC
             LIMIT 10"
        )?
        .query_map([user_id], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, i32>(2)?
            ))
        })?
        .collect::<Result<Vec<_>, _>>()?;

    let orphaned_content: i32 = conn
        .prepare(
            "SELECT COUNT(*) FROM content_index ci
             WHERE ci.user_id = ?1
             AND NOT EXISTS (
                 SELECT 1 FROM link_relationships lr 
                 WHERE lr.source_id = ci.content_id AND lr.source_type = ci.content_type
             )
             AND NOT EXISTS (
                 SELECT 1 FROM link_relationships lr 
                 WHERE lr.target_id = ci.content_id AND lr.target_type = ci.content_type
             )"
        )?
        .query_row([user_id], |row| row.get(0))?;

    Ok(LinkStatistics {
        total_links,
        total_content,
        most_linked_content,
        orphaned_content,
    })
} 