# Backend Architecture

<cite>
**Referenced Files in This Document**   
- [lib.rs](file://src-tauri/src/lib.rs)
- [Cargo.toml](file://src-tauri/Cargo.toml)
- [database\mod.rs](file://src-tauri/src/database/mod.rs)
- [database\connection.rs](file://src-tauri/src/database/connection.rs)
- [services\gmail\auth_service.rs](file://src-tauri/src/services/gmail/auth_service.rs)
- [commands\gmail\auth.rs](file://src-tauri/src/commands/gmail/auth.rs)
- [services\gmail\api_service.rs](file://src-tauri/src/services/gmail/api_service.rs)
- [commands\gmail\api.rs](file://src-tauri/src/commands/gmail/api.rs)
- [services\google\tasks_service.rs](file://src-tauri/src/services/google/tasks_service.rs)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
The LibreOllama backend is a Rust-based native implementation built on the Tauri framework, designed to provide secure, efficient, and modular communication between the frontend and system-level services. This architecture enables seamless integration with Google services including Gmail, Calendar, Tasks, and AI functionality through a well-defined command pattern and service layer organization. The backend leverages SQLite with Diesel ORM for local data persistence, implements robust authentication mechanisms for Google API access, and ensures secure storage of sensitive credentials. This document provides a comprehensive overview of the backend architecture, detailing its modular design, database layer, command invocation system, service organization, and integration patterns.

## Project Structure
The project follows a standard Tauri application structure with a clear separation between frontend (TypeScript/React) and backend (Rust) components. The backend resides in the `src-tauri` directory and is organized into modular components for commands, services, database operations, and utilities.

```mermaid
graph TD
A[src-tauri] --> B[src]
A --> C[migrations]
A --> D[capabilities]
B --> E[commands]
B --> F[database]
B --> G[services]
B --> H[utils]
E --> I[gmail]
E --> J[calendar]
E --> K[tasks]
F --> L[operations]
F --> M[connection]
G --> N[gmail]
G --> O[google]
```

**Diagram sources**
- [lib.rs](file://src-tauri/src/lib.rs)
- [Cargo.toml](file://src-tauri/Cargo.toml)

**Section sources**
- [lib.rs](file://src-tauri/src/lib.rs)
- [Cargo.toml](file://src-tauri/Cargo.toml)

## Core Components
The LibreOllama backend consists of several core components that work together to provide a robust and secure foundation for the application. These include the Tauri command system for IPC communication, a modular service layer for business logic, a database layer using SQLite with Diesel ORM, and specialized modules for integrating with Google services and AI functionality. The architecture follows a clear separation of concerns, with commands handling frontend requests, services implementing business logic, and the database layer managing data persistence.

**Section sources**
- [lib.rs](file://src-tauri/src/lib.rs)
- [database\mod.rs](file://src-tauri/src/database/mod.rs)

## Architecture Overview
The LibreOllama backend architecture is built around the Tauri framework, which enables secure communication between the frontend and backend through a well-defined command invocation system. The architecture follows a layered approach with clear separation between the presentation layer (frontend), command layer (IPC interface), service layer (business logic), and data layer (database and external APIs).

```mermaid
graph TD
A[Frontend] --> |Tauri invoke| B[Command Layer]
B --> C[Service Layer]
C --> D[Database Layer]
C --> E[External APIs]
D --> F[SQLite Database]
E --> G[Google APIs]
E --> H[AI Services]
B --> I[Configuration]
B --> J[Authentication]
C --> K[Rate Limiter]
D --> L[Schema Migrations]
```

**Diagram sources**
- [lib.rs](file://src-tauri/src/lib.rs)
- [database\connection.rs](file://src-tauri/src/database/connection.rs)

## Detailed Component Analysis

### Command Pattern Implementation
The backend implements a command pattern where frontend functionality is invoked through Tauri's invoke system. Each command is a Rust function annotated with `#[tauri::command]` that can be called from the frontend JavaScript code. The `lib.rs` file serves as the central entry point, registering all available commands with the Tauri runtime.

```mermaid
sequenceDiagram
participant Frontend
participant Tauri
participant Command
participant Service
participant Database
Frontend->>Tauri : invoke('get_gmail_labels', accountId)
Tauri->>Command : Route to get_gmail_labels
Command->>Service : Call GmailApiService.get_labels()
Service->>Database : Get valid tokens
Database-->>Service : Return tokens
Service->>Google API : Make authenticated request
Google API-->>Service : Return labels
Service-->>Command : Return processed labels
Command-->>Tauri : Return result
Tauri-->>Frontend : Resolve promise with labels
```

**Diagram sources**
- [lib.rs](file://src-tauri/src/lib.rs)
- [commands\gmail\api.rs](file://src-tauri/src/commands/gmail/api.rs)

**Section sources**
- [lib.rs](file://src-tauri/src/lib.rs)
- [commands\gmail\api.rs](file://src-tauri/src/commands/gmail/api.rs)

### Service Layer Organization
The service layer is organized into dedicated modules for different functionality areas, following dependency injection patterns. Services are initialized in the `setup` function of `lib.rs` and managed by the Tauri app state. The architecture uses Arc (Atomic Reference Counting) for thread-safe sharing of service instances across async contexts.

```mermaid
classDiagram
class GmailAuthService {
+get_user_info()
+store_account_tokens()
+get_account_tokens()
+remove_account()
+validate_and_refresh_tokens()
}
class GmailApiService {
+get_labels()
+search_messages()
+get_message()
+get_thread()
+modify_messages()
+trash_messages()
}
class GoogleTasksService {
+get_task_lists()
+get_tasks()
+create_task()
+update_task()
+delete_task()
}
class DatabaseManager {
+get_connection()
+run_migrations()
+test_connection()
}
GmailApiService --> GmailAuthService : "uses"
GoogleTasksService --> GmailAuthService : "uses"
GmailApiService --> DatabaseManager : "uses"
GoogleTasksService --> DatabaseManager : "uses"
GmailAuthService --> DatabaseManager : "uses"
```

**Diagram sources**
- [services\gmail\auth_service.rs](file://src-tauri/src/services/gmail/auth_service.rs)
- [services\gmail\api_service.rs](file://src-tauri/src/services/gmail/api_service.rs)
- [services\google\tasks_service.rs](file://src-tauri/src/services/google/tasks_service.rs)

**Section sources**
- [services\gmail\auth_service.rs](file://src-tauri/src/services/gmail/auth_service.rs)
- [services\gmail\api_service.rs](file://src-tauri/src/services/gmail/api_service.rs)
- [services\google\tasks_service.rs](file://src-tauri/src/services/google/tasks_service.rs)

### Database Layer with SQLite and Diesel ORM
The database layer uses SQLite as the persistent storage engine with Diesel ORM for schema management and query operations. The `DatabaseManager` class handles connection pooling, migration execution, and connection configuration. The architecture supports schema versioning through migration files in the `migrations` directory.

```mermaid
erDiagram
GMAIL_ACCOUNTS_SECURE {
string id PK
string email_address
string display_name
string profile_picture_url
string access_token_encrypted
string refresh_token_encrypted
string token_expires_at
string scopes
bool is_active
string last_sync_at
string created_at
string updated_at
string user_id
}
TASK_METADATA {
string task_id PK
string title
string description
string status
string due_date
string list_id
string account_id
string created_at
string updated_at
}
TASK_ID_MAP {
string local_id PK
string google_id
string account_id
string list_id
string created_at
string updated_at
}
GMAIL_ACCOUNTS_SECURE ||--o{ TASK_METADATA : "has"
GMAIL_ACCOUNTS_SECURE ||--o{ TASK_ID_MAP : "has"
```

**Diagram sources**
- [database\connection.rs](file://src-tauri/src/database/connection.rs)
- [database\mod.rs](file://src-tauri/src/database/mod.rs)

**Section sources**
- [database\connection.rs](file://src-tauri/src/database/connection.rs)
- [database\mod.rs](file://src-tauri/src/database/mod.rs)

### Authentication and Secure Storage
The authentication system implements OAuth2 with PKCE for secure Google API access. The `GmailAuthService` handles the complete OAuth2 flow, including authorization request generation, callback processing, token exchange, and token refresh. Sensitive credentials are encrypted using AES-GCM before storage in the SQLite database.

```mermaid
sequenceDiagram
participant Frontend
participant Tauri
participant AuthService
participant GoogleAuth
participant Database
Frontend->>Tauri : invoke('start_gmail_oauth_with_callback')
Tauri->>AuthService : start_authorization()
AuthService->>AuthService : Generate PKCE challenge
AuthService->>AuthService : Store pending authorization
AuthService-->>Tauri : Return auth URL and state
Tauri-->>Frontend : Open browser with auth URL
Frontend->>GoogleAuth : Complete OAuth2 flow
GoogleAuth-->>Frontend : Redirect with code and state
Frontend->>Tauri : invoke('complete_authorization')
Tauri->>AuthService : complete_authorization()
AuthService->>GoogleAuth : Exchange code for tokens
GoogleAuth-->>AuthService : Return tokens
AuthService->>Database : Encrypt and store tokens
Database-->>AuthService : Confirmation
AuthService-->>Tauri : Return tokens
Tauri-->>Frontend : Resolve with tokens
```

**Diagram sources**
- [services\gmail\auth_service.rs](file://src-tauri/src/services/gmail/auth_service.rs)
- [commands\gmail\auth.rs](file://src-tauri/src/commands/gmail/auth.rs)

**Section sources**
- [services\gmail\auth_service.rs](file://src-tauri/src/services/gmail/auth_service.rs)
- [commands\gmail\auth.rs](file://src-tauri/src/commands/gmail/auth.rs)

### Error Handling Across FFI Boundary
The backend implements comprehensive error handling across the FFI boundary using a custom `LibreOllamaError` enum. Errors are propagated from the service layer through commands to the frontend, where they can be handled appropriately. The error system includes specific variants for different error types including authentication, network, database, and serialization errors.

```mermaid
flowchart TD
A[Service Operation] --> B{Success?}
B --> |Yes| C[Return Result]
B --> |No| D[Create Specific Error]
D --> E[LibreOllamaError::GmailAuth]
D --> F[LibreOllamaError::Network]
D --> G[LibreOllamaError::DatabaseQuery]
D --> H[LibreOllamaError::Serialization]
E --> I[Propagate to Command]
F --> I
G --> I
H --> I
I --> J[Convert to String]
J --> K[Return to Frontend]
K --> L[Handle in JavaScript]
```

**Diagram sources**
- [services\gmail\auth_service.rs](file://src-tauri/src/services/gmail/auth_service.rs)
- [services\gmail\api_service.rs](file://src-tauri/src/services/gmail/api_service.rs)

**Section sources**
- [services\gmail\auth_service.rs](file://src-tauri/src/services/gmail/auth_service.rs)
- [services\gmail\api_service.rs](file://src-tauri/src/services/gmail/api_service.rs)

## Dependency Analysis
The backend has a well-defined dependency structure with clear separation between core functionality and optional features. Dependencies are managed through Cargo.toml with feature flags enabling modular compilation of different components.

```mermaid
graph TD
A[Rust Backend] --> B[Tauri Framework]
A --> C[Diesel ORM]
A --> D[reqwest HTTP Client]
A --> E[oauth2]
A --> F[serde Serialization]
A --> G[rusqlite]
A --> H[tokio Async Runtime]
B --> I[WebView2]
C --> J[SQLite]
D --> K[Google APIs]
E --> L[OAuth2 Flow]
F --> M[JSON Serialization]
G --> N[SQLite Bindings]
H --> O[Async Operations]
style A fill:#f9f,stroke:#333
style B fill:#bbf,stroke:#333
style C fill:#bbf,stroke:#333
style D fill:#bbf,stroke:#333
style E fill:#bbf,stroke:#333
style F fill:#bbf,stroke:#333
style G fill:#bbf,stroke:#333
style H fill:#bbf,stroke:#333
```

**Diagram sources**
- [Cargo.toml](file://src-tauri/Cargo.toml)
- [lib.rs](file://src-tauri/src/lib.rs)

**Section sources**
- [Cargo.toml](file://src-tauri/Cargo.toml)
- [lib.rs](file://src-tauri/src/lib.rs)

## Performance Considerations
The backend architecture includes several performance optimizations, including connection pooling for database access, rate limiting for API calls, and efficient data retrieval patterns. The database is configured with WAL (Write-Ahead Logging) mode for improved concurrency and performance. The rate limiter service ensures that API calls to Google services stay within quota limits while providing a smooth user experience.

**Section sources**
- [database\connection.rs](file://src-tauri/src/database/connection.rs)
- [services\gmail\api_service.rs](file://src-tauri/src/services/gmail/api_service.rs)

## Troubleshooting Guide
The backend includes several debugging and troubleshooting features to assist with development and user support. These include debug commands for inspecting the secure token storage, checking database schema integrity, and validating authentication state. The logging system provides detailed information about authentication flows, API requests, and database operations.

**Section sources**
- [commands\gmail\auth.rs](file://src-tauri/src/commands/gmail/auth.rs)
- [services\gmail\auth_service.rs](file://src-tauri/src/services/gmail/auth_service.rs)

## Conclusion
The LibreOllama backend architecture demonstrates a well-structured, modular design that effectively leverages the Tauri framework for secure IPC communication between the frontend and native Rust code. The implementation follows best practices for authentication, data persistence, and error handling, providing a solid foundation for integrating with Google services and AI functionality. The use of Diesel ORM with SQLite ensures reliable data storage with proper schema migration support, while the service layer organization promotes code reuse and maintainability. The command pattern implementation provides a clean interface between the frontend and backend, enabling efficient development and testing of application features.