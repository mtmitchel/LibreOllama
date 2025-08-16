//! Agents Commands Module
//!
//! This module contains all agent-related Tauri commands.

#[cfg(feature = "agents-admin")]
pub mod lifecycle;

// Re-export all agent commands for easy access
// Avoid wildcard re-exports; import explicitly at call sites.