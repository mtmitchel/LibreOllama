//! System Commands Module
//!
//! This module contains all system-level Tauri commands.

pub mod advanced;
pub mod health;

// Re-export all system commands for easy access
pub use advanced::*;
pub use health::*; 