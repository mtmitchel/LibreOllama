use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

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
        // Parse tools from metadata or use empty vec
        let tools = if let Some(metadata) = &db_agent.metadata {
            serde_json::from_str::<Vec<String>>(metadata).unwrap_or_default()
        } else {
            Vec::new()
        };

        Self {
            id: db_agent.id,
            name: db_agent.name,
            description: db_agent.description.unwrap_or_default(),
            system_prompt: db_agent.system_prompt.unwrap_or_default(),
            model: db_agent.model_name,
            tools,
            created_at: db_agent.created_at,
            updated_at: db_agent.updated_at,
            is_active: db_agent.is_active,
        }
    }
}

impl From<DbAgentExecution> for AgentExecution {
    fn from(db_execution: DbAgentExecution) -> Self {
        Self {
            id: db_execution.id,
            agent_id: db_execution.agent_id,
            input: db_execution.input,
            output: db_execution.output.unwrap_or_default(),
            status: db_execution.status.to_string(),
            started_at: db_execution.started_at,
            completed_at: db_execution.completed_at,
            error_message: db_execution.error_message,
        }
    }
}

// Tauri commands for agent functionality
#[tauri::command]
pub async fn create_agent(request: CreateAgentRequest) -> Result<Agent, String> {
    // Serialize tools to JSON for metadata storage
    let tools_json = serde_json::to_string(&request.tools)
        .map_err(|e| format!("Failed to serialize tools: {}", e))?;
    
    // Create database agent
    let mut db_agent = DbAgent::new(
        request.name,
        Some(request.description),
        request.model,
        Some(request.system_prompt),
    );
    db_agent.metadata = Some(tools_json);
    
    // Save to database
    database::operations::create_agent(&db_agent)
        .map_err(|e| format!("Failed to create agent: {}", e))?;
    
    // Convert to API format and return
    Ok(db_agent.into())
}

#[tauri::command]
pub async fn get_agents() -> Result<Vec<Agent>, String> {
    // Get agents from database (active only by default)
    let db_agents = database::operations::get_agents(false)
        .map_err(|e| format!("Failed to get agents: {}", e))?;
    
    // Convert to API format
    let agents: Vec<Agent> = db_agents.into_iter().map(|agent| agent.into()).collect();
    
    Ok(agents)
}

#[tauri::command]
pub async fn get_agent(agent_id: String) -> Result<Agent, String> {
    // Get agent from database
    let db_agent = database::operations::get_agent_by_id(&agent_id)
        .map_err(|e| format!("Failed to get agent: {}", e))?
        .ok_or("Agent not found")?;
    
    // Convert to API format and return
    Ok(db_agent.into())
}

#[tauri::command]
pub async fn update_agent(agent_id: String, request: UpdateAgentRequest) -> Result<Agent, String> {
    // Get existing agent from database
    let mut db_agent = database::operations::get_agent_by_id(&agent_id)
        .map_err(|e| format!("Failed to get agent: {}", e))?
        .ok_or("Agent not found")?;
    
    // Update fields that were provided
    if let Some(name) = request.name {
        db_agent.name = name;
    }
    if let Some(description) = request.description {
        db_agent.description = Some(description);
    }
    if let Some(system_prompt) = request.system_prompt {
        db_agent.system_prompt = Some(system_prompt);
    }
    if let Some(model) = request.model {
        db_agent.model_name = model;
    }
    if let Some(tools) = request.tools {
        // Serialize tools to JSON for metadata storage
        let tools_json = serde_json::to_string(&tools)
            .map_err(|e| format!("Failed to serialize tools: {}", e))?;
        db_agent.metadata = Some(tools_json);
    }
    if let Some(is_active) = request.is_active {
        db_agent.is_active = is_active;
    }
    
    // Update timestamp and save to database
    db_agent.touch();
    database::operations::update_agent(&db_agent)
        .map_err(|e| format!("Failed to update agent: {}", e))?;
    
    // Convert to API format and return
    Ok(db_agent.into())
}

#[tauri::command]
pub async fn delete_agent(agent_id: String) -> Result<bool, String> {
    // Check if agent exists first
    let agent_exists = database::operations::get_agent_by_id(&agent_id)
        .map_err(|e| format!("Failed to check agent: {}", e))?
        .is_some();
    
    if !agent_exists {
        return Err("Agent not found".to_string());
    }
    
    // Delete agent from database
    database::operations::delete_agent(&agent_id)
        .map_err(|e| format!("Failed to delete agent: {}", e))?;
    
    Ok(true)
}

#[tauri::command]
pub async fn execute_agent(agent_id: String, input: String) -> Result<AgentExecution, String> {
    // Check if agent exists and is active
    let db_agent = database::operations::get_agent_by_id(&agent_id)
        .map_err(|e| format!("Failed to get agent: {}", e))?
        .ok_or("Agent not found")?;
    
    if !db_agent.is_active {
        return Err("Agent is not active".to_string());
    }
    
    // Create a new execution record
    let mut db_execution = DbAgentExecution::new(agent_id.clone(), None, input.clone());
    
    // For now, create a mock execution with a simple response
    // In a real implementation, this would integrate with the Ollama API using the agent's configuration
    let mock_output = format!("Mock response from agent '{}' to input: '{}'", db_agent.name, input);
    db_execution.complete(mock_output);
    
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
    let _agent = database::operations::get_agent_by_id(&agent_id)
        .map_err(|e| format!("Failed to get agent: {}", e))?
        .ok_or("Agent not found")?;
    
    // Return empty list for now - would fetch from database in full implementation
    Ok(Vec::new())
}