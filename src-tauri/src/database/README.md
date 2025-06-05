# Database Module

This directory contains the database functionality for LibreOllama, using SQLCipher for encrypted local storage.

## Core Files

### Main Database Files
- `connection.rs` - SQLCipher connection management
- `models.rs` - Core database model structs
- `operations.rs` - Core CRUD operations
- `schema.rs` - Main table creation and migrations

### Versioned Extensions

#### Version 2 (Advanced Features)
- `models_v2.rs` - Additional models for Phase 3.3 advanced features
  - Conversation context for memory management
  - Chat templates for conversation presets
  - Performance metrics
- `operations_v2.rs` - Operations for these advanced features
- `schema_v2.rs` - Schema extensions for advanced features

#### Version 4 (Bidirectional Linking)
- `operations_v4.rs` - Operations for bidirectional linking system
  - Link relationships
  - Content indexing
  - Link suggestions
- `schema_v4.rs` - Schema for bidirectional linking

### Other Files
- `schema_onboarding.rs` - Schema for onboarding functionality
- `test.rs` - Integration tests
- `integration_tests.rs` - Additional tests

## Architecture

The database module follows a versioned extension pattern:

1. **Core Functionality** (`models.rs`, `operations.rs`, `schema.rs`)
   - Basic chat sessions, messages, agents, and settings

2. **Advanced Features** (`*_v2.rs`)
   - Memory management
   - Templates
   - Performance tracking

3. **Bidirectional Linking** (`*_v4.rs`)
   - Content connections
   - Link management
   - Suggestion system

## Usage

These files are actively used in the codebase and should not be moved or deleted. The versioned files are not outdated but rather represent feature extensions to the core database functionality.

### Import Structure

The `mod.rs` file exports all models and operations, including the versioned ones, making them available throughout the application:

```rust
pub use models::*;
pub use models_v2::*;
pub use operations::*;
pub use operations_v2::*;
pub use operations_v4::*;
```

### Feature Dependencies

- Advanced features (`commands/advanced.rs`) depend on `models_v2` and `operations_v2`
- Link functionality (`commands/links.rs`) depends on `operations_v4`