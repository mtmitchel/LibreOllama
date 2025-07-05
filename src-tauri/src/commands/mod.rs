// Module declarations for Tauri commands
pub mod chat;
pub mod ollama;
pub mod agents;
pub mod advanced;
pub mod folders;
pub mod notes;
pub mod mcp;
pub mod n8n;
pub mod links; // Added links module for bidirectional linking
pub mod canvas; // Added canvas module for Konva.js integration
pub mod gmail; // Added gmail module for Gmail API integration
pub mod token_storage; // Added token storage module for secure Gmail token management
pub mod email_parser; // Added email parser module for MIME parsing and content extraction
pub mod gmail_integration; // Added gmail_integration module for complete email processing pipeline
pub mod sync_manager; // Added sync manager module for Gmail sync state and delta management
pub mod cache_manager; // Added cache manager module for efficient message storage and offline access
pub mod rate_limiter; // Added rate limiter module for Gmail API quota management and batch operations

// Re-export commonly used types
pub use advanced::*;
pub use agents::*;
pub use canvas::*;
pub use chat::*;
pub use folders::*;
pub use gmail::*;
pub use links::*;
pub use mcp::*;
pub use notes::*;
pub use token_storage::*;
pub use email_parser::*;
pub use gmail_integration::*;
pub use sync_manager::*;
pub use cache_manager::*;
pub use rate_limiter::*;