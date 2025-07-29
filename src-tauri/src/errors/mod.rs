//! Unified Error Handling System for LibreOllama Tauri Backend
//!
//! This module provides a comprehensive error handling framework that unifies
//! error types across all domains (Gmail, Database, Sync, etc.) with consistent
//! propagation patterns and user-friendly error messages.

// Allow unused error handling infrastructure as these provide comprehensive error capabilities
#![allow(dead_code)]

use std::fmt;
use thiserror::Error;
use serde::{Deserialize, Serialize};
// use std::collections::HashMap;  // Not currently used

/// Main error type that encompasses all possible errors in the application
#[derive(Error, Debug, Clone, Serialize, Deserialize)]
pub enum LibreOllamaError {
    // === Gmail Domain Errors ===
    #[error("Gmail authentication failed: {message}")]
    GmailAuth { message: String, code: Option<String> },

    #[error("Gmail API error: {message}")]
    GmailApi { message: String, status_code: Option<u16> },

    #[error("Google Tasks API error: {message}")]
    GoogleTasksApi { message: String },

    #[error("Gmail token error: {message}")]
    GmailToken { message: String, token_type: String },

    #[error("Gmail sync error: {message}")]
    GmailSync { message: String, account_id: String },

    #[error("Gmail compose error: {message}")]
    GmailCompose { message: String, operation: String },

    #[error("Gmail attachment error: {message}")]
    GmailAttachment { message: String, attachment_id: Option<String> },

    // === Database Domain Errors ===
    #[error("Database connection failed: {message}")]
    DatabaseConnection { message: String },

    #[error("Database query failed: {message}")]
    DatabaseQuery { message: String, query_type: String },

    #[error("Database migration failed: {message}")]
    DatabaseMigration { message: String, version: String },

    #[error("Database transaction failed: {message}")]
    DatabaseTransaction { message: String },

    #[error("Database constraint violation: {message}")]
    DatabaseConstraint { message: String, constraint: String },

    // === Sync Domain Errors ===
    #[error("Sync operation failed: {message}")]
    SyncOperation { message: String, sync_type: String },

    #[error("Rate limiting exceeded: {message}")]
    RateLimit { message: String, retry_after: Option<u64> },

    #[error("Cache operation failed: {message}")]
    Cache { message: String, operation: String },

    // === Authentication & Security Errors ===
    #[error("OAuth flow failed: {message}")]
    OAuth { message: String, step: String },

    #[error("Token storage failed: {message}")]
    TokenStorage { message: String, storage_type: String },

    #[error("Encryption/Decryption failed: {message}")]
    Crypto { message: String },

    #[error("Keyring access failed: {message}")]
    Keyring { message: String },

    // === System & Configuration Errors ===
    #[error("Configuration error: {message}")]
    Configuration { message: String, config_key: Option<String> },

    #[error("Environment variable missing or invalid: {variable}")]
    Environment { variable: String },

    #[error("File system error: {message}")]
    FileSystem { message: String, path: Option<String> },

    #[error("Network error: {message}")]
    Network { message: String, url: Option<String> },

    // === Validation & Input Errors ===
    #[error("Invalid input: {message}")]
    InvalidInput { message: String, field: Option<String> },

    #[error("Serialization/Deserialization failed: {message}")]
    Serialization { message: String, data_type: String },

    #[error("Email parsing failed: {message}")]
    EmailParsing { message: String },

    // === Generic Errors ===
    #[error("Internal error: {message}")]
    Internal { message: String },

    #[error("Operation not supported: {operation}")]
    NotSupported { operation: String },

    #[error("Resource not found: {resource}")]
    NotFound { resource: String },

    #[error("Permission denied: {message}")]
    PermissionDenied { message: String },

    #[error("Timeout occurred: {operation}")]
    Timeout { operation: String, duration_ms: Option<u64> },
}

/// Result type alias for convenience
pub type Result<T> = std::result::Result<T, LibreOllamaError>;

/// Error context for providing additional debugging information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorContext {
    pub operation: String,
    pub component: String,
    pub user_id: Option<String>,
    pub account_id: Option<String>,
    pub session_id: Option<String>,
    pub timestamp: String,
    pub metadata: std::collections::HashMap<String, String>,
}

impl ErrorContext {
    pub fn new(operation: &str, component: &str) -> Self {
        Self {
            operation: operation.to_string(),
            component: component.to_string(),
            user_id: None,
            account_id: None,
            session_id: None,
            timestamp: chrono::Utc::now().to_rfc3339(),
            metadata: std::collections::HashMap::new(),
        }
    }

    pub fn with_user_id(mut self, user_id: &str) -> Self {
        self.user_id = Some(user_id.to_string());
        self
    }

    pub fn with_account_id(mut self, account_id: &str) -> Self {
        self.account_id = Some(account_id.to_string());
        self
    }

    pub fn with_session_id(mut self, session_id: &str) -> Self {
        self.session_id = Some(session_id.to_string());
        self
    }

    pub fn with_metadata(mut self, key: &str, value: &str) -> Self {
        self.metadata.insert(key.to_string(), value.to_string());
        self
    }
}

/// Enhanced error with context information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContextualError {
    pub error: LibreOllamaError,
    pub context: ErrorContext,
    pub source_location: Option<String>,
}

impl ContextualError {
    pub fn new(error: LibreOllamaError, context: ErrorContext) -> Self {
        Self {
            error,
            context,
            source_location: None,
        }
    }

    pub fn with_location(mut self, location: &str) -> Self {
        self.source_location = Some(location.to_string());
        self
    }
}

impl fmt::Display for ContextualError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.error)?;
        if let Some(location) = &self.source_location {
            write!(f, " (at {})", location)?;
        }
        Ok(())
    }
}

/// Convenience macros for error creation
#[macro_export]
macro_rules! gmail_auth_error {
    ($msg:expr) => {
        LibreOllamaError::GmailAuth {
            message: $msg.to_string(),
            code: None,
        }
    };
    ($msg:expr, $code:expr) => {
        LibreOllamaError::GmailAuth {
            message: $msg.to_string(),
            code: Some($code.to_string()),
        }
    };
}

#[macro_export]
macro_rules! gmail_api_error {
    ($msg:expr) => {
        LibreOllamaError::GmailApi {
            message: $msg.to_string(),
            status_code: None,
        }
    };
    ($msg:expr, $status:expr) => {
        LibreOllamaError::GmailApi {
            message: $msg.to_string(),
            status_code: Some($status),
        }
    };
}

#[macro_export]
macro_rules! database_error {
    ($msg:expr, $query_type:expr) => {
        LibreOllamaError::DatabaseQuery {
            message: $msg.to_string(),
            query_type: $query_type.to_string(),
        }
    };
}

#[macro_export]
macro_rules! sync_error {
    ($msg:expr, $sync_type:expr) => {
        LibreOllamaError::SyncOperation {
            message: $msg.to_string(),
            sync_type: $sync_type.to_string(),
        }
    };
}

#[macro_export]
macro_rules! oauth_error {
    ($msg:expr, $step:expr) => {
        LibreOllamaError::OAuth {
            message: $msg.to_string(),
            step: $step.to_string(),
        }
    };
}

/// Error conversion implementations for common external error types
impl From<rusqlite::Error> for LibreOllamaError {
    fn from(err: rusqlite::Error) -> Self {
        match err {
            rusqlite::Error::SqliteFailure(sqlite_err, msg) => {
                LibreOllamaError::DatabaseQuery {
                    message: msg.unwrap_or_else(|| format!("SQLite error: {:?}", sqlite_err.code)),
                    query_type: "sqlite_operation".to_string(),
                }
            }
            rusqlite::Error::InvalidColumnType(idx, name, typ) => {
                LibreOllamaError::DatabaseQuery {
                    message: format!("Invalid column type at index {}: {} (expected {})", idx, name, typ),
                    query_type: "column_type_validation".to_string(),
                }
            }
            _ => LibreOllamaError::DatabaseQuery {
                message: err.to_string(),
                query_type: "unknown".to_string(),
            }
        }
    }
}

impl From<reqwest::Error> for LibreOllamaError {
    fn from(err: reqwest::Error) -> Self {
        if err.is_timeout() {
            LibreOllamaError::Timeout {
                operation: "http_request".to_string(),
                duration_ms: None,
            }
        } else if err.is_connect() {
            LibreOllamaError::Network {
                message: format!("Connection failed: {}", err),
                url: err.url().map(|u| u.to_string()),
            }
        } else if let Some(status) = err.status() {
            LibreOllamaError::GmailApi {
                message: format!("HTTP error: {}", err),
                status_code: Some(status.as_u16()),
            }
        } else {
            LibreOllamaError::Network {
                message: err.to_string(),
                url: err.url().map(|u| u.to_string()),
            }
        }
    }
}

impl From<serde_json::Error> for LibreOllamaError {
    fn from(err: serde_json::Error) -> Self {
        LibreOllamaError::Serialization {
            message: err.to_string(),
            data_type: "json".to_string(),
        }
    }
}

impl From<oauth2::RequestTokenError<oauth2::reqwest::Error<reqwest::Error>, oauth2::StandardErrorResponse<oauth2::basic::BasicErrorResponseType>>> for LibreOllamaError {
    fn from(err: oauth2::RequestTokenError<oauth2::reqwest::Error<reqwest::Error>, oauth2::StandardErrorResponse<oauth2::basic::BasicErrorResponseType>>) -> Self {
        LibreOllamaError::OAuth {
            message: format!("OAuth token request failed: {}", err),
            step: "token_exchange".to_string(),
        }
    }
}

impl From<keyring::Error> for LibreOllamaError {
    fn from(err: keyring::Error) -> Self {
        LibreOllamaError::Keyring {
            message: err.to_string(),
        }
    }
}

impl From<std::io::Error> for LibreOllamaError {
    fn from(err: std::io::Error) -> Self {
        LibreOllamaError::FileSystem {
            message: err.to_string(),
            path: None,
        }
    }
}

impl From<anyhow::Error> for LibreOllamaError {
    fn from(err: anyhow::Error) -> Self {
        LibreOllamaError::Internal {
            message: err.to_string(),
        }
    }
}

/// Utility functions for error handling
impl LibreOllamaError {
    /// Check if error is retryable
    pub fn is_retryable(&self) -> bool {
        matches!(
            self,
            LibreOllamaError::Network { .. } |
            LibreOllamaError::Timeout { .. } |
            LibreOllamaError::RateLimit { .. } |
            LibreOllamaError::GmailApi { status_code: Some(503..=599), .. }
        )
    }

    /// Get retry delay in milliseconds
    pub fn retry_delay_ms(&self) -> Option<u64> {
        match self {
            LibreOllamaError::RateLimit { retry_after, .. } => *retry_after,
            LibreOllamaError::Timeout { .. } => Some(1000), // 1 second
            LibreOllamaError::Network { .. } => Some(5000), // 5 seconds
            _ => None,
        }
    }

    /// Get user-friendly error message
    pub fn user_message(&self) -> String {
        match self {
            LibreOllamaError::GmailAuth { .. } => {
                "Gmail authentication failed. Please sign in again.".to_string()
            }
            LibreOllamaError::GmailApi { .. } => {
                "Gmail service is temporarily unavailable. Please try again later.".to_string()
            }
            LibreOllamaError::DatabaseConnection { .. } => {
                "Database connection failed. Please restart the application.".to_string()
            }
            LibreOllamaError::Network { .. } => {
                "Network connection failed. Please check your internet connection.".to_string()
            }
            LibreOllamaError::RateLimit { .. } => {
                "Rate limit exceeded. Please wait a moment before trying again.".to_string()
            }
            LibreOllamaError::InvalidInput { .. } => {
                "Invalid input provided. Please check your data and try again.".to_string()
            }
            _ => "An unexpected error occurred. Please try again.".to_string(),
        }
    }

    /// Get error category for logging/metrics
    pub fn category(&self) -> &'static str {
        match self {
            LibreOllamaError::GmailAuth { .. } |
            LibreOllamaError::GmailApi { .. } |
            LibreOllamaError::GmailToken { .. } |
            LibreOllamaError::GmailSync { .. } |
            LibreOllamaError::GmailCompose { .. } |
            LibreOllamaError::GmailAttachment { .. } => "gmail",

            LibreOllamaError::DatabaseConnection { .. } |
            LibreOllamaError::DatabaseQuery { .. } |
            LibreOllamaError::DatabaseMigration { .. } |
            LibreOllamaError::DatabaseTransaction { .. } |
            LibreOllamaError::DatabaseConstraint { .. } => "database",

            LibreOllamaError::SyncOperation { .. } |
            LibreOllamaError::RateLimit { .. } |
            LibreOllamaError::Cache { .. } => "sync",

            LibreOllamaError::OAuth { .. } |
            LibreOllamaError::TokenStorage { .. } |
            LibreOllamaError::Crypto { .. } |
            LibreOllamaError::Keyring { .. } => "auth",

            LibreOllamaError::Configuration { .. } |
            LibreOllamaError::Environment { .. } |
            LibreOllamaError::FileSystem { .. } |
            LibreOllamaError::Network { .. } => "system",

            LibreOllamaError::InvalidInput { .. } |
            LibreOllamaError::Serialization { .. } |
            LibreOllamaError::EmailParsing { .. } => "validation",

            _ => "general",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_creation() {
        let error = gmail_auth_error!("Invalid credentials", "invalid_grant");
        assert!(matches!(error, LibreOllamaError::GmailAuth { .. }));
    }

    #[test]
    fn test_error_categorization() {
        let gmail_error = LibreOllamaError::GmailAuth {
            message: "Test".to_string(),
            code: None,
        };
        assert_eq!(gmail_error.category(), "gmail");

        let db_error = LibreOllamaError::DatabaseQuery {
            message: "Test".to_string(),
            query_type: "SELECT".to_string(),
        };
        assert_eq!(db_error.category(), "database");
    }

    #[test]
    fn test_retryable_errors() {
        let network_error = LibreOllamaError::Network {
            message: "Connection timeout".to_string(),
            url: None,
        };
        assert!(network_error.is_retryable());

        let auth_error = LibreOllamaError::GmailAuth {
            message: "Invalid token".to_string(),
            code: None,
        };
        assert!(!auth_error.is_retryable());
    }

    #[test]
    fn test_error_context() {
        let context = ErrorContext::new("sync_messages", "gmail_service")
            .with_user_id("user123")
            .with_account_id("account456")
            .with_metadata("retry_count", "3");

        assert_eq!(context.operation, "sync_messages");
        assert_eq!(context.component, "gmail_service");
        assert_eq!(context.user_id, Some("user123".to_string()));
        assert_eq!(context.account_id, Some("account456".to_string()));
        assert_eq!(context.metadata.get("retry_count"), Some(&"3".to_string()));
    }
} 