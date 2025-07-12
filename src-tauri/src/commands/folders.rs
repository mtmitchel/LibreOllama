//! Folder Management Commands
//!
//! This module provides commands for managing folders in the application.
//! Currently unused but kept for future development.

use serde::{Deserialize, Serialize};
use tauri::State;
use crate::database::DatabaseManager;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateFolderRequest {
    // Note: Fields removed as they are unused
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateFolderRequest {
    pub name: Option<String>,
    // Note: Other fields removed as they are unused
}

// Note: All command functions have been removed as they are unused.
// This module is kept for potential future folder management features. 