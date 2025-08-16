//! Gmail Services Module
//!
//! This module provides comprehensive Gmail integration services including
//! authentication, API access, email composition, and synchronization.

// Service modules
pub mod auth_service;
pub mod api_service;
#[cfg(feature = "gmail-compose")]
pub mod compose_service;
pub mod attachment_service;
pub mod cache_service;
#[cfg(feature = "gmail-compose")]
pub mod sync_service;

// Test modules
#[cfg(test)]
pub mod tests;

// Re-export only the actively used services and types
// Export tokens type only when required externally; otherwise avoid unused warnings
#[allow(unused_imports)]
pub use auth_service::GmailTokens;
pub use api_service::{ProcessedGmailMessage, EmailAddress};
pub use cache_service::GmailCacheService;
#[cfg(feature = "gmail-compose")]
pub use sync_service::GmailSyncService;

/// Gmail Services Module
/// 
/// This module provides comprehensive Gmail integration services including:
/// - Authentication and OAuth2 flow management (GmailAuthService)
/// - Core Gmail API operations (GmailApiService)  
/// - Email composition and sending (GmailComposeService)
/// - Message caching and offline access (GmailCacheService)
/// - Email synchronization (GmailSyncService)
/// - Attachment handling (GmailAttachmentService)
/// 
/// The services are designed to be:
/// - Type-safe with comprehensive error handling
/// - Secure with proper token encryption and storage
/// - Performant with optimized database operations
/// - Testable with clear separation of concerns
/// - Maintainable with modular architecture
///
/// All services are now implemented and available for use.
#[allow(unused)]
pub struct GmailServices; 