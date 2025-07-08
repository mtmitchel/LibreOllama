pub mod gmail;

// Main export from gmail module
// Gmail services are managed directly in lib.rs
// pub use gmail::{...};

/// Services Module
/// 
/// This module provides the business logic layer for LibreOllama, organizing
/// functionality into focused service modules with clear responsibilities.
/// 
/// The service layer architecture provides:
/// - **Separation of Concerns**: Business logic separated from command handlers
/// - **Testability**: Services can be tested independently
/// - **Maintainability**: Clear module boundaries and dependencies
/// - **Reusability**: Services can be used across different interfaces
/// - **Type Safety**: Comprehensive error handling and validation
/// 
/// Current Services:
/// - `gmail::GmailAuthService`: Gmail authentication and account management
/// 
/// Planned Services:
/// - `database::DatabaseService`: Database operations and migrations
/// - `sync::SyncService`: Cross-platform synchronization
/// - `cache::CacheService`: Intelligent caching and offline support
/// - `notification::NotificationService`: System notifications
/// - `security::SecurityService`: Encryption and security operations
/// - `agent::AgentService`: AI agent coordination
/// - `canvas::CanvasService`: Canvas data management
/// - `note::NoteService`: Note and document management
/// - `project::ProjectService`: Project management
/// - `task::TaskService`: Task and workflow management
/// 
/// Each service follows these principles:
/// - Single Responsibility: Each service has a focused purpose
/// - Dependency Injection: Services receive their dependencies explicitly
/// - Error Handling: Comprehensive error types and handling
/// - Async/Await: Non-blocking operations where appropriate
/// - Documentation: Clear API documentation and usage examples
/// - Testing: Unit tests for all public methods
/// 
/// The services layer sits between the command handlers (exposed to frontend)
/// and the infrastructure layer (database, external APIs, etc.), providing
/// a clean abstraction that makes the application easier to maintain and extend.
#[allow(unused)]
pub struct Services; 