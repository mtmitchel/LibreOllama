#![cfg(feature = "agents-admin")]
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc, TimeZone};
use tauri::State;

// Import database modules
use crate::database::models::{Agent as DbAgent, AgentExecution as DbAgentExecution};
use crate::database::operations;

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
pub async fn create_agent(
    request: CreateAgentRequest,
    db_manager: State<'_, std::sync::Arc<crate::database::DatabaseManager>>,
) -> Result<Agent, String> {
    let parameters = serde_json::json!({"model": request.model});
    
    // The DbAgent creation is synchronous and can stay here.
    let db_agent = DbAgent {
        id: 0, // Will be set by database
        name: request.name.clone(),
        description: request.description.clone(),
        model_name: request.model.clone(),
        system_prompt: request.system_prompt.clone(),
        temperature: 0.7, // default
        max_tokens: 2048, // default
        capabilities: request.tools.clone(),
        parameters,
        is_active: true,
        created_at: chrono::Local::now().naive_local(),
        updated_at: chrono::Local::now().naive_local(),
    };
    
    let db_manager_clone = db_manager.inner().clone();
    let name = db_agent.name.clone();
    let description = db_agent.description.clone();
    let system_prompt = db_agent.system_prompt.clone();
    let capabilities = db_agent.capabilities.clone();
    let parameters = db_agent.parameters.clone();
    let model_name = db_agent.model_name.clone();
    let created_agent_id = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::agent_operations::create_agent(
            &conn, 
            &name, 
            &description, 
            &system_prompt, 
            &model_name, 
            0.7, // default temperature 
            2048, // default max_tokens
            capabilities, 
            parameters
        )
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;

    let mut final_agent: Agent = db_agent.into();
    final_agent.id = created_agent_id.to_string();

    Ok(final_agent)
}

#[tauri::command]
pub async fn get_agents(db_manager: State<'_, crate::database::DatabaseManager>) -> Result<Vec<Agent>, String> {
    let db_manager_clone = db_manager.inner().clone();
    let db_agents = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::agent_operations::get_all_agents(&conn)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;
    
    let agents: Vec<Agent> = db_agents.into_iter().map(|agent| agent.into()).collect();
    
    Ok(agents)
}

#[tauri::command]
pub async fn get_agent(
    agent_id: String,
    db_manager: State<'_, std::sync::Arc<crate::database::DatabaseManager>>,
) -> Result<Agent, String> {
    let agent_id_int = agent_id.parse().map_err(|_| "Invalid agent ID".to_string())?;
    let db_manager_clone = db_manager.inner().clone();

    let db_agent = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::agent_operations::get_agent(&conn, agent_id_int)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?
    .ok_or("Agent not found")?;
    
    Ok(db_agent.into())
}

#[tauri::command]
pub async fn update_agent(
    agent_id: String,
    request: UpdateAgentRequest,
    db_manager: State<'_, std::sync::Arc<crate::database::DatabaseManager>>,
) -> Result<Agent, String> {
    let agent_id_int = agent_id.parse().map_err(|_| "Invalid agent ID".to_string())?;
    let db_manager_clone = db_manager.inner().clone();
    
    let mut db_agent = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::agent_operations::get_agent(&conn, agent_id_int)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?
    .ok_or("Agent not found")?;
    
    if let Some(name) = request.name { db_agent.name = name; }
    if let Some(description) = request.description { db_agent.description = description; }
    if let Some(system_prompt) = request.system_prompt { db_agent.system_prompt = system_prompt; }
    if let Some(model) = request.model { db_agent.parameters["model"] = serde_json::json!(model); }
    if let Some(tools) = request.tools { db_agent.capabilities = tools; }
    if let Some(is_active) = request.is_active { db_agent.is_active = is_active; }
    
    db_agent.updated_at = chrono::Local::now().naive_local();

    let result_agent: Agent = db_agent.clone().into();
    let db_manager_clone_update = db_manager.inner().clone();
    
    // Extract model name before other operations to avoid borrow checker issues
    let model_name = if let Some(model_value) = db_agent.parameters.get("model") {
        model_value.as_str().unwrap_or("llama3:latest").to_string()
    } else {
        "llama3:latest".to_string()
    };
    
    let capabilities_clone = db_agent.capabilities.clone();
    let parameters_clone = db_agent.parameters.clone();
    let agent_id = db_agent.id;
    let name = db_agent.name.clone();
    let description = db_agent.description.clone();
    let system_prompt = db_agent.system_prompt.clone();
    
    tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone_update.get_connection()?;
        
        operations::agent_operations::update_agent(
            &conn, 
            agent_id, 
            &name, 
            &description, 
            &system_prompt, 
            capabilities_clone,
            parameters_clone,
            Some(&model_name),
            None, // Use default temperature
            None  // Use default max_tokens
        )
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;
    
    Ok(result_agent)
}

#[tauri::command]
pub async fn delete_agent(
    agent_id: String,
    db_manager: State<'_, std::sync::Arc<crate::database::DatabaseManager>>,
) -> Result<bool, String> {
    let agent_id_int = agent_id.parse().map_err(|_| "Invalid agent ID".to_string())?;
    
    let db_manager_clone_check = db_manager.inner().clone();
    let agent_exists = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone_check.get_connection()?;
        operations::agent_operations::get_agent(&conn, agent_id_int)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?
    .is_some();
    
    if !agent_exists { return Err("Agent not found".to_string()); }
    
    let db_manager_clone_delete = db_manager.inner().clone();
    tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone_delete.get_connection()?;
        operations::agent_operations::delete_agent(&conn, agent_id_int)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;
    
    Ok(true)
}

#[tauri::command]
pub async fn execute_agent(
    agent_id: String,
    input: String,
    db_manager: State<'_, std::sync::Arc<crate::database::DatabaseManager>>,
) -> Result<AgentExecution, String> {
    let agent_id_int = agent_id.parse().map_err(|_| "Invalid agent ID".to_string())?;
    let db_manager_clone = db_manager.inner().clone();
    
    let db_agent = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::agent_operations::get_agent(&conn, agent_id_int)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?
    .ok_or("Agent not found")?;
    
    if !db_agent.is_active { return Err("Agent is not active".to_string()); }
    
    // Since agent execution logic is not fully implemented, this remains mostly synchronous.
    // However, the initial agent fetch is now correctly asynchronous.
    let db_execution = DbAgentExecution {
        id: 0,
        agent_id: db_agent.id,
        session_id: None,
        input: input.clone(),
        output: format!("Mock response from agent '{}' to input: '{}'", db_agent.name, input),
        status: "completed".to_string(),
        error_message: None,
        executed_at: chrono::Local::now().naive_local(),
    };
    
    Ok(db_execution.into())
}

#[tauri::command]
pub async fn get_agent_executions(
    agent_id: String,
    db_manager: State<'_, std::sync::Arc<crate::database::DatabaseManager>>,
) -> Result<Vec<AgentExecution>, String> {
    let agent_id_int = agent_id.parse().map_err(|_| "Invalid agent ID".to_string())?;
    let db_manager_clone = db_manager.inner().clone();

    tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::agent_operations::get_agent(&conn, agent_id_int)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?
    .ok_or("Agent not found")?;
    
    // The actual fetching of executions would also need to be a spawn_blocking call
    // once implemented in agent_operations.rs
    Ok(Vec::new())
}