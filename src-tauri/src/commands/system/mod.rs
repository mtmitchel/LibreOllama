//! System Commands Module
//!
//! This module contains all system-level Tauri commands.

pub mod advanced;
pub mod health;
pub mod migrations;
pub mod debug_db;

// Re-export all system commands for easy access
pub use advanced::*;
pub use health::*;
pub use migrations::*;
pub use debug_db::*; 