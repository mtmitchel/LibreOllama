//! Database Operations Module
//!
//! This module provides comprehensive database operation functions for all features.
//! Some functions are used by current commands, others are infrastructure for future features.

// Allow unused functions as this is infrastructure for comprehensive database operations
#![allow(dead_code)]

// Core operations modules
pub mod agent_operations;
pub mod cache_operations;
pub mod chat_operations;
pub mod conversation_operations;
pub mod folder_operations;
pub mod link_operations;
pub mod log_operations;
pub mod mcp_operations;
pub mod n8n_operations;
pub mod note_operations;
pub mod onboarding_operations;
pub mod performance_operations;
pub mod preference_operations;
pub mod project_operations;
pub mod template_operations;

// Re-export all operations for convenience
// Note: These are comprehensive database operations - some are used by current commands,
// others are infrastructure for future features
// Database operations are accessed via specific imports where needed
// Removing blanket exports to reduce unused import warnings

// Core operations that are actively used
  // Used by links commands

// Other operations available but not re-exported to avoid unused warnings
// Import directly where needed: use crate::database::operations::agent_operations;
// pub use agent_operations::*;
// pub use cache_operations::*;
// pub use chat_operations::*;
// pub use conversation_operations::*;
// pub use folder_operations::*;
// pub use log_operations::*;
// pub use mcp_operations::*;
// pub use n8n_operations::*;
// pub use note_operations::*;
// pub use onboarding_operations::*;
// pub use performance_operations::*;
// pub use preference_operations::*; 