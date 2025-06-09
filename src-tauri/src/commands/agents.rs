use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc, TimeZone};

// Import database modules
use crate::database::{Agent as DbAgent, AgentExecution as DbAgentExecution};

// Data structures for agent functionality (compatible with frontend)
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Agent {
    pub id: String,
    pub name: String,
    pub description: String,
    pub system_prompt: String,
    pub model: String,
    pub tools: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub is_active: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CreateAgentRequest {
    pub name: String,
    pub description: String,
    pub system_prompt: String,
    pub model: String,
    pub tools: Vec<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct UpdateAgentRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub system_prompt: Option<String>,
    pub model: Option<String>,
    pub tools: Option<Vec<String>>,
    pub is_active: Option<bool>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AgentExecution {
    pub id: String,
    pub agent_id: String,
    pub input: String,
    pub output: String,
    pub status: String, // "running", "completed", "failed"
    pub started_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
    pub error_message: Option<String>,
}

// Helper functions to convert between database models and API models
impl From<DbAgent> for Agent {
    fn from(db_agent: DbAgent) -> Self {
        // Parse tools from capabilities or parameters
        let tools = db_agent.capabilities.clone();
        
        // Extract model from parameters if it exists
        let model = if let Some(model_value) = db_agent.parameters.get("model") {
            model_value.as_str().unwrap_or("default").to_string()
        } else {
            "default".to_string()
        };

        Self {
            id: db_agent.id.to_string(),
            name: db_agent.name,
            description: db_agent.description,
            system_prompt: db_agent.system_prompt,
            model,
            tools,
            created_at: Utc.from_utc_datetime(&db_agent.created_at),
            updated_at: Utc.from_utc_datetime(&db_agent.updated_at),
            is_active: db_agent.is_active,
        }
    }
}

impl From<DbAgentExecution> for AgentExecution {
    fn from(db_execution: DbAgentExecution) -> Self {
        Self {
            id: db_execution.id.to_string(),
            agent_id: db_execution.agent_id.to_string(),
            input: db_execution.input,
            output: db_execution.output,
            status: db_execution.status,
            started_at: Utc.from_utc_datetime(&db_execution.executed_at),
            completed_at: None, // This field doesn't exist in DbAgentExecution
            error_message: db_execution.error_message,
        }
    }
}

// Tauri commands for agent functionality
#[tauri::command]
pub async fn create_agent(request: CreateAgentRequest) -> Result<Agent, String> {
    // Create database agent
    let parameters = serde_json::json!({"model": request.model});
    
    let db_agent = DbAgent {
        id: 0, // Will be set by database
        name: request.name,
        description: request.description,
        system_prompt: request.system_prompt,
        capabilities: request.tools,
        parameters,
        is_active: true,
        created_at: chrono::Local::now().naive_local(),
        updated_at: chrono::Local::now().naive_local(),
    };
    
    // Save to database
    crate::database::create_agent(&db_agent)
        .await
        .map_err(|e| format!("Failed to create agent: {}", e))?;
    
    // Convert to API format and return
    Ok(db_agent.into())
}

#[tauri::command]
pub async fn get_agents() -> Result<Vec<Agent>, String> {
    // Get agents from database (active only by default)
    let db_agents = crate::database::get_agents(false)
        .await
        .map_err(|e| format!("Failed to get agents: {}", e))?;
    
    // Convert to API format
    let agents: Vec<Agent> = db_agents.into_iter().map(|agent| agent.into()).collect();
    
    Ok(agents)
}

#[tauri::command]
pub async fn get_agent(agent_id: String) -> Result<Agent, String> {
    // Get agent from database
    let db_agent = crate::database::get_agent_by_id(&agent_id)
        .await
        .map_err(|e| format!("Failed to get agent: {}", e))?
        .ok_or("Agent not found")?;
    
    // Convert to API format and return
    Ok(db_agent.into())
}

#[tauri::command]
pub async fn update_agent(agent_id: String, request: UpdateAgentRequest) -> Result<Agent, String> {
    // Get existing agent from database
    let mut db_agent = crate::database::get_agent_by_id(&agent_id)
        .await
        .map_err(|e| format!("Failed to get agent: {}", e))?
        .ok_or("Agent not found")?;
    
    // Update fields that were provided
    if let Some(name) = request.name {
        db_agent.name = name;
    }
    if let Some(description) = request.description {
        db_agent.description = description;
    }
    if let Some(system_prompt) = request.system_prompt {
        db_agent.system_prompt = system_prompt;
    }
    if let Some(model) = request.model {
        db_agent.parameters["model"] = serde_json::json!(model);
    }
    if let Some(tools) = request.tools {
        db_agent.capabilities = tools;
    }
    if let Some(is_active) = request.is_active {
        db_agent.is_active = is_active;
    }
    
    // Update timestamp and save to database
    db_agent.updated_at = chrono::Local::now().naive_local();
    crate::database::update_agent(&db_agent)
        .await
        .map_err(|e| format!("Failed to update agent: {}", e))?;
    
    // Convert to API format and return
    Ok(db_agent.into())
}

#[tauri::command]
pub async fn delete_agent(agent_id: String) -> Result<bool, String> {
    // Check if agent exists first
    let agent_exists = crate::database::get_agent_by_id(&agent_id)
        .await
        .map_err(|e| format!("Failed to check agent: {}", e))?
        .is_some();
    
    if !agent_exists {
        return Err("Agent not found".to_string());
    }
    
    // Delete agent from database
    crate::database::delete_agent(&agent_id)
        .await
        .map_err(|e| format!("Failed to delete agent: {}", e))?;
    
    Ok(true)
}

#[tauri::command]
pub async fn execute_agent(agent_id: String, input: String) -> Result<AgentExecution, String> {
    // Check if agent exists and is active
    let db_agent = crate::database::get_agent_by_id(&agent_id)
        .await
        .map_err(|e| format!("Failed to get agent: {}", e))?
        .ok_or("Agent not found")?;
    
    if !db_agent.is_active {
        return Err("Agent is not active".to_string());
    }
    
    // Create a new execution record
    let db_execution = DbAgentExecution {
        id: 0, // Will be set by database
        agent_id: agent_id.parse().unwrap_or(0),
        session_id: None,
        input: input.clone(),
        output: format!("Mock response from agent '{}' to input: '{}'", db_agent.name, input),
        status: "completed".to_string(),
        error_message: None,
        executed_at: chrono::Local::now().naive_local(),
    };
    
    // Note: Since database operations for agent executions are not yet implemented in operations.rs,
    // we'll create a simple in-memory execution for now. This would need agent execution operations
    // to be added to the database operations module.
    
    // Convert to API format and return
    Ok(db_execution.into())
}

#[tauri::command]
pub async fn get_agent_executions(agent_id: String) -> Result<Vec<AgentExecution>, String> {
    // Note: Agent execution tracking in the database would require additional operations
    // to be implemented in database/operations.rs. For now, return empty list
    // as this is a placeholder for future implementation.
    
    // Verify agent exists
    let _agent = crate::database::get_agent_by_id(&agent_id)
        .await
        .map_err(|e| format!("Failed to get agent: {}", e))?
        .ok_or("Agent not found")?;
    
    // Return empty list for now - would fetch from database in full implementation
    Ok(Vec::new())
}