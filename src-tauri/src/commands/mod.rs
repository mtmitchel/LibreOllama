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

// Re-export commonly used types
pub use chat::*;
pub use ollama::*;
pub use agents::*;
pub use advanced::*;
pub use folders::*;
pub use notes::*;
pub use mcp::*;
pub use n8n::*;