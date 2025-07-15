//! Tauri Commands Module
//!
//! This module organizes all Tauri commands by domain for better maintainability.

// Domain-grouped command modules
pub mod gmail;    // Gmail authentication and operations
pub mod tasks;    // Google Tasks API operations
pub mod calendar; // Google Calendar API operations
pub mod agents;   // Agent lifecycle and execution  
pub mod chat;     // Chat sessions and messages
pub mod projects; // Project management
pub mod system;   // System health and advanced features
pub mod image_proxy;
pub mod text_processing;
pub mod llm;

// Legacy flat modules (to be reorganized)
pub mod ollama;
pub mod folders;
pub mod notes;
pub mod mcp;
pub mod n8n;
pub mod links;
pub mod canvas;
pub mod rate_limiter;

// Re-exports removed - commands are imported directly in lib.rs
// This eliminates unused import warnings and makes dependencies clearer

// ARCHIVED MODULES (functionality consolidated into services/):
// - secure_oauth_flow.rs → gmail/auth.rs
// - secure_token_commands.rs → gmail/auth.rs  
// - secure_token_storage.rs → gmail/auth.rs
// - agents.rs → agents/lifecycle.rs
// - chat.rs → chat/sessions.rs
// - advanced.rs → system/advanced.rs
//
// - email_parser.rs → services/gmail/api_service.rs
// - gmail_integration.rs → services/gmail/api_service.rs  
// - sync_manager.rs → services/gmail/sync_service.rs
// - cache_manager.rs → services/gmail/cache_service.rs
// - gmail_compose.rs → services/gmail/compose_service.rs
// - gmail_sync.rs → services/gmail/sync_service.rs
// - gmail_attachments.rs → services/gmail/attachment_service.rs