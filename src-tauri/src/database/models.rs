//! Database models for LibreOllama
//!
//! This module defines the data structures that represent database entities
//! including chat sessions, messages, agents, and settings.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Represents a chat session in the database
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatSession {
    pub id: String,
    pub title: String,
    pub model_name: Option<String>,
    pub agent_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub is_archived: bool,
    pub metadata: Option<String>, // JSON string for additional data
}

impl ChatSession {
    /// Create a new chat session
    pub fn new(title: String, model_name: Option<String>, agent_id: Option<String>) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            title,
            model_name,
            agent_id,
            created_at: now,
            updated_at: now,
            is_archived: false,
            metadata: None,
        }
    }

    /// Update the session's updated_at timestamp
    pub fn touch(&mut self) {
        self.updated_at = Utc::now();
    }
}

/// Represents a chat message in the database
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub id: String,
    pub session_id: String,
    pub role: MessageRole,
    pub content: String,
    pub model_name: Option<String>,
    pub created_at: DateTime<Utc>,
    pub metadata: Option<String>, // JSON string for additional data like token usage
}

impl ChatMessage {
    /// Create a new chat message
    pub fn new(
        session_id: String,
        role: MessageRole,
        content: String,
        model_name: Option<String>,
    ) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            session_id,
            role,
            content,
            model_name,
            created_at: Utc::now(),
            metadata: None,
        }
    }
}

/// Represents the role of a message sender
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum MessageRole {
    User,
    Assistant,
    System,
}

impl std::fmt::Display for MessageRole {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            MessageRole::User => write!(f, "user"),
            MessageRole::Assistant => write!(f, "assistant"),
            MessageRole::System => write!(f, "system"),
        }
    }
}

impl std::str::FromStr for MessageRole {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "user" => Ok(MessageRole::User),
            "assistant" => Ok(MessageRole::Assistant),
            "system" => Ok(MessageRole::System),
            _ => Err(anyhow::anyhow!("Invalid message role: {}", s)),
        }
    }
}

impl MessageRole {
    /// Convert to string representation
    pub fn as_str(&self) -> &'static str {
        match self {
            MessageRole::User => "user",
            MessageRole::Assistant => "assistant",
            MessageRole::System => "system",
        }
    }

    /// Convert to uppercase string representation
    pub fn to_uppercase(&self) -> String {
        self.as_str().to_uppercase()
    }
}

/// Represents an AI agent in the database
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Agent {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub model_name: String,
    pub system_prompt: Option<String>,
    pub temperature: Option<f64>,
    pub max_tokens: Option<i32>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub is_active: bool,
    pub metadata: Option<String>, // JSON string for additional configuration
}

impl Agent {
    /// Create a new agent
    pub fn new(
        name: String,
        description: Option<String>,
        model_name: String,
        system_prompt: Option<String>,
    ) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            description,
            model_name,
            system_prompt,
            temperature: Some(0.7),
            max_tokens: None,
            created_at: now,
            updated_at: now,
            is_active: true,
            metadata: None,
        }
    }

    /// Update the agent's updated_at timestamp
    pub fn touch(&mut self) {
        self.updated_at = Utc::now();
    }
}

/// Represents application settings in the database
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Setting {
    pub key: String,
    pub value: String,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Setting {
    /// Create a new setting
    pub fn new(key: String, value: String, description: Option<String>) -> Self {
        let now = Utc::now();
        Self {
            key,
            value,
            description,
            created_at: now,
            updated_at: now,
        }
    }

    /// Update the setting's value and timestamp
    pub fn update_value(&mut self, value: String) {
        self.value = value;
        self.updated_at = Utc::now();
    }
}

/// Agent execution record for tracking agent runs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentExecution {
    pub id: String,
    pub agent_id: String,
    pub session_id: Option<String>,
    pub input: String,
    pub output: Option<String>,
    pub status: ExecutionStatus,
    pub started_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
    pub error_message: Option<String>,
    pub metadata: Option<String>, // JSON string for execution details
}

impl AgentExecution {
    /// Create a new agent execution
    pub fn new(agent_id: String, session_id: Option<String>, input: String) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            agent_id,
            session_id,
            input,
            output: None,
            status: ExecutionStatus::Running,
            started_at: Utc::now(),
            completed_at: None,
            error_message: None,
            metadata: None,
        }
    }

    /// Mark execution as completed successfully
    pub fn complete(&mut self, output: String) {
        self.output = Some(output);
        self.status = ExecutionStatus::Completed;
        self.completed_at = Some(Utc::now());
    }

    /// Mark execution as failed
    pub fn fail(&mut self, error: String) {
        self.status = ExecutionStatus::Failed;
        self.error_message = Some(error);
        self.completed_at = Some(Utc::now());
    }
}

/// Represents the status of an agent execution
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ExecutionStatus {
    Running,
    Completed,
    Failed,
    Cancelled,
}

impl std::fmt::Display for ExecutionStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ExecutionStatus::Running => write!(f, "running"),
            ExecutionStatus::Completed => write!(f, "completed"),
            ExecutionStatus::Failed => write!(f, "failed"),
            ExecutionStatus::Cancelled => write!(f, "cancelled"),
        }
    }
}

impl std::str::FromStr for ExecutionStatus {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "running" => Ok(ExecutionStatus::Running),
            "completed" => Ok(ExecutionStatus::Completed),
            "failed" => Ok(ExecutionStatus::Failed),
            "cancelled" => Ok(ExecutionStatus::Cancelled),
            _ => Err(anyhow::anyhow!("Invalid execution status: {}", s)),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_chat_session_creation() {
        let session = ChatSession::new(
            "Test Session".to_string(),
            Some("llama2".to_string()),
            None,
        );
        
        assert_eq!(session.title, "Test Session");
        assert_eq!(session.model_name, Some("llama2".to_string()));
        assert!(!session.is_archived);
    }

    #[test]
    fn test_message_role_conversion() {
        assert_eq!(MessageRole::User.to_string(), "user");
        assert_eq!("assistant".parse::<MessageRole>().unwrap(), MessageRole::Assistant);
    }

    #[test]
    fn test_agent_creation() {
        let agent = Agent::new(
            "Test Agent".to_string(),
            Some("A test agent".to_string()),
            "llama2".to_string(),
            Some("You are a helpful assistant".to_string()),
        );
        
        assert_eq!(agent.name, "Test Agent");
        assert!(agent.is_active);
        assert_eq!(agent.temperature, Some(0.7));
    }
}

/// Represents a folder in the database for organizing content
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Folder {
    pub id: String,
    pub name: String,
    pub parent_id: Option<String>,
    pub color: Option<String>,
    pub user_id: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub metadata: Option<String>, // JSON string for additional data
}

impl Folder {
    /// Create a new folder
    pub fn new(name: String, parent_id: Option<String>, user_id: String, color: Option<String>) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            parent_id,
            color,
            user_id,
            created_at: now,
            updated_at: now,
            metadata: None,
        }
    }

    /// Update the folder's updated_at timestamp
    pub fn touch(&mut self) {
        self.updated_at = Utc::now();
    }
}

/// Represents a note in the database
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Note {
    pub id: String,
    pub title: String,
    pub content: String,
    pub tags: Option<String>, // JSON array of tags
    pub folder_id: Option<String>,
    pub user_id: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub metadata: Option<String>, // JSON string for additional data
}

impl Note {
    /// Create a new note
    pub fn new(title: String, content: String, user_id: String, folder_id: Option<String>) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            title,
            content,
            tags: None,
            folder_id,
            user_id,
            created_at: now,
            updated_at: now,
            metadata: None,
        }
    }

    /// Update the note's updated_at timestamp
    pub fn touch(&mut self) {
        self.updated_at = Utc::now();
    }

    /// Update content and timestamp
    pub fn update_content(&mut self, title: String, content: String) {
        self.title = title;
        self.content = content;
        self.touch();
    }
}

/// Represents an MCP (Model Context Protocol) server configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpServer {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub server_type: String, // "stdio" or "sse"
    pub command: Option<String>, // For stdio servers
    pub args: Option<String>, // JSON array of command arguments
    pub env: Option<String>, // JSON object of environment variables
    pub url: Option<String>, // For SSE servers
    pub auth_token: Option<String>,
    pub is_active: bool,
    pub user_id: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub metadata: Option<String>, // JSON string for additional configuration
}

impl McpServer {
    /// Create a new MCP server configuration
    pub fn new(
        name: String,
        description: Option<String>,
        server_type: String,
        user_id: String,
    ) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            description,
            server_type,
            command: None,
            args: None,
            env: None,
            url: None,
            auth_token: None,
            is_active: true,
            user_id,
            created_at: now,
            updated_at: now,
            metadata: None,
        }
    }

    /// Update the server's updated_at timestamp
    pub fn touch(&mut self) {
        self.updated_at = Utc::now();
    }
}

/// Represents an N8N workflow connection configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct N8nConnection {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub base_url: String,
    pub api_key: Option<String>,
    pub webhook_url: Option<String>,
    pub is_active: bool,
    pub user_id: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub metadata: Option<String>, // JSON string for additional configuration
}

impl N8nConnection {
    /// Create a new N8N connection
    pub fn new(
        name: String,
        description: Option<String>,
        base_url: String,
        user_id: String,
    ) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            description,
            base_url,
            api_key: None,
            webhook_url: None,
            is_active: true,
            user_id,
            created_at: now,
            updated_at: now,
            metadata: None,
        }
    }

    /// Update the connection's updated_at timestamp
    pub fn touch(&mut self) {
        self.updated_at = Utc::now();
    }
}