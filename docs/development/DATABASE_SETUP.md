# LibreOllama SQLCipher Database Setup - Phase 2.1

This document outlines the implementation of the encrypted SQLCipher database system for LibreOllama Phase 2.1.

## Overview

The database system provides secure, encrypted data persistence for LibreOllama using SQLCipher. It includes:

- **Encrypted Storage**: SQLCipher provides transparent 256-bit AES encryption
- **Schema Management**: Versioned migrations for database evolution
- **Type Safety**: Rust structs for all database entities
- **Connection Pooling**: Efficient database connection management
- **CRUD Operations**: Complete database operations for all entities

## Architecture

```
src/database/
├── mod.rs           # Module exports and initialization
├── connection.rs    # SQLCipher connection management
├── schema.rs        # Table creation and migrations
├── models.rs        # Database model structs
├── operations.rs    # CRUD operations
└── test.rs          # Integration tests
```

## Database Schema

### Tables

1. **chat_sessions**: Chat conversation sessions
   - Primary key: `id` (TEXT)
   - Foreign key: `agent_id` → `agents.id`
   - Indexes: `created_at`, `updated_at`, `agent_id`

2. **chat_messages**: Individual messages within sessions
   - Primary key: `id` (TEXT)
   - Foreign key: `session_id` → `chat_sessions.id`
   - Indexes: `session_id`, `created_at`, `role`

3. **agents**: AI agent configurations
   - Primary key: `id` (TEXT)
   - Indexes: `is_active`, `model_name`

4. **settings**: Application settings
   - Primary key: `key` (TEXT)

5. **agent_executions**: Agent execution tracking
   - Primary key: `id` (TEXT)
   - Foreign keys: `agent_id` → `agents.id`, `session_id` → `chat_sessions.id`
   - Indexes: `agent_id`, `session_id`, `status`, `started_at`

6. **schema_version**: Migration tracking
   - Primary key: `version` (INTEGER)

## Key Features

### Security
- **Encryption**: SQLCipher with 256-bit AES encryption
- **Key Management**: Secure key generation and storage
- **Data Protection**: All data encrypted at rest

### Performance
- **WAL Mode**: Write-Ahead Logging for better concurrency
- **Indexes**: Strategic indexing for common queries
- **Connection Pooling**: Efficient connection reuse

### Reliability
- **Foreign Keys**: Referential integrity enforcement
- **Transactions**: ACID compliance for data consistency
- **Migrations**: Versioned schema evolution

## Dependencies Added

```toml
[dependencies]
# Database dependencies for SQLCipher integration
rusqlite = { version = "0.32", features = ["bundled-sqlcipher"] }
dirs = "5.0"
rand = "0.8"
hex = "0.4"
anyhow = "1.0"
thiserror = "1.0"
```

## Usage Examples

### Initialize Database
```rust
use database::init_database;

// Initialize on app startup
let db_manager = init_database().await?;
```

### Create Chat Session
```rust
use database::{ChatSession, create_chat_session};

let session = ChatSession::new(
    "My Chat".to_string(),
    Some("llama2".to_string()),
    None
);
create_chat_session(&session)?;
```

### Store Messages
```rust
use database::{ChatMessage, MessageRole, create_chat_message};

let message = ChatMessage::new(
    session_id,
    MessageRole::User,
    "Hello!".to_string(),
    Some("llama2".to_string())
);
create_chat_message(&message)?;
```

### Create Agent
```rust
use database::{Agent, create_agent};

let agent = Agent::new(
    "Assistant".to_string(),
    Some("Helpful AI assistant".to_string()),
    "llama2".to_string(),
    Some("You are a helpful assistant".to_string())
);
create_agent(&agent)?;
```

## Database Location

- **Windows**: `%APPDATA%/LibreOllama/database.db`
- **macOS**: `~/Library/Application Support/LibreOllama/database.db`
- **Linux**: `~/.local/share/LibreOllama/database.db`

## Encryption Key Management

For Phase 2.1, a fixed development key is used. In production, implement:

1. **OS Keychain Integration**: Store encryption keys securely
2. **Key Derivation**: Generate keys from user credentials
3. **Key Rotation**: Support for changing encryption keys

## Error Handling

All database operations return `Result<T, anyhow::Error>` for comprehensive error handling:

```rust
match create_chat_session(&session) {
    Ok(()) => println!("Session created successfully"),
    Err(e) => eprintln!("Failed to create session: {}", e),
}
```

## Testing

Run database tests with:
```bash
cargo test database::test
```

Tests cover:
- Schema creation and migration
- CRUD operations
- Data integrity
- Error handling

## Migration System

The database uses a versioned migration system:

1. **Version Tracking**: `schema_version` table tracks applied migrations
2. **Sequential Application**: Migrations applied in order
3. **Rollback Support**: Future enhancement for schema rollbacks

## Performance Considerations

- **Indexes**: Created for frequently queried columns
- **Connection Reuse**: Avoid creating connections for each operation
- **Batch Operations**: Use transactions for multiple related operations
- **Query Optimization**: Use prepared statements for repeated queries

## Security Notes

- **Development Key**: Current implementation uses fixed key for development
- **Production Deployment**: Implement secure key management before production
- **Data Validation**: All inputs validated before database operations
- **SQL Injection**: Using parameterized queries prevents injection attacks

## Future Enhancements

1. **Connection Pooling**: Implement proper connection pool
2. **Query Builder**: Type-safe query construction
3. **Backup/Restore**: Database backup and restore functionality
4. **Encryption Key Rotation**: Support for changing encryption keys
5. **Performance Monitoring**: Database operation metrics
6. **Async Operations**: Full async/await support for all operations

## Integration with Commands

The database system is integrated into the Tauri app startup process:

1. **Initialization**: Database initialized before app starts
2. **Health Check**: `database_health_check` command available
3. **Error Handling**: App exits if database initialization fails
4. **Command Integration**: Database operations available to Tauri commands

## Troubleshooting

### Common Issues

1. **Database Locked**: Ensure proper connection cleanup
2. **Migration Failures**: Check schema version and apply missing migrations
3. **Encryption Errors**: Verify encryption key is correctly set
4. **Permission Errors**: Ensure app data directory is writable

### Debug Commands

```rust
// Test database connection
database_health_check().await?;

// Get database statistics
let stats = get_database_stats(&conn)?;
println!("Sessions: {}, Messages: {}", stats.active_sessions, stats.total_messages);

// Verify schema
let is_valid = verify_schema(&conn)?;
println!("Schema valid: {}", is_valid);
```

This completes the Phase 2.1 SQLCipher database setup, providing a secure foundation for LibreOllama's data persistence needs.