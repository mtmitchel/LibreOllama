//! MCP (Model Context Protocol) Commands
//!
//! This module provides commands for MCP server management.
//! Currently unused but kept for future development.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateMcpServerRequest {
    // Note: Fields removed as they are unused
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateMcpServerRequest {
    // Note: Fields removed as they are unused
}

// Note: All command functions have been removed as they are unused.
// This module is kept for potential future MCP server management features. 