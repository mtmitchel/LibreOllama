# LibreOllama Implementation Guide

## Overview
This guide provides comprehensive implementation patterns, testing strategies, and architectural decisions for the LibreOllama project.

## Architecture Overview

### Frontend Architecture
- **React + TypeScript**: Modern component-based UI
- **Zustand**: State management with devtools integration
- **Tauri**: Desktop application framework
- **Vite**: Build tool and development server

### Backend Architecture
- **Rust + Tauri**: Native desktop backend
- **SQLite**: Local database with migrations
- **Service Layer**: Command handlers for frontend integration

## Feature Implementation Patterns

### Notes Feature Implementation

#### Critical Database Integration Requirements

**LESSON LEARNED**: Always validate database schema matches service expectations before writing tests.

The Notes feature revealed critical gaps in database integration testing:

1. **Database Schema Validation**:
   - Frontend service expected `name` column, database had `folder_name`
   - Frontend expected string IDs, database returns integer IDs
   - Frontend expected array tags, database stores comma-separated strings

2. **Data Transformation Layer**:
   ```typescript
   // CORRECT: Transform database types to frontend types
   function folderResponseToFolder(response: FolderResponse): Folder {
     return {
       id: response.id.toString(),        // Convert number to string
       name: response.folder_name,        // Map database column name
       parentId: response.parent_id?.toString(),
       color: response.color || undefined,
       // ... rest of transformation
     };
   }
   ```

3. **Service Interface Alignment**:
   ```typescript
   // CORRECT: Match exact database schema
   export interface CreateFolderRequest {
     folder_name: string;  // Use exact database column name
     parent_id?: number;   // Use exact database type
     user_id: string;
     color?: string;
   }
   ```

#### Service Layer Architecture

**Service Pattern**:
```typescript
// Individual service functions
export async function createNote(
  title: string,
  content: string = '',
  tags: string[] = [],
  userId: string = 'default_user'
): Promise<{
  success: boolean;
  note?: Note;
  error?: string;
}> {
  try {
    const response = await invoke<NoteResponse>('create_note', {
      note: { title, content, user_id: userId, tags }
    });
    
    const note = noteResponseToNote(response);
    return { success: true, note };
  } catch (error) {
    return handleServiceError(error, 'createNote');
  }
}

// Singleton service class
class NotesService {
  private static instance: NotesService;
  private userId: string = 'default_user';

  static getInstance(): NotesService {
    if (!NotesService.instance) {
      NotesService.instance = new NotesService();
    }
    return NotesService.instance;
  }

  async createNote(title: string, content: string = '', tags: string[] = []): Promise<Note | null> {
    const result = await createNote(title, content, tags, this.userId);
    return result.success ? result.note || null : null;
  }
}
```

#### Store Implementation with Validation

**Enhanced Store Pattern**:
```typescript
export const useNotesStore = create<NotesStore>()(
  devtools(
    (set, get) => ({
      // State with proper error tracking
      error: undefined,
      lastError: undefined,
      
      createNote: async (title, folderId = 'default', content = '', tags = []) => {
        try {
          // Validate input data BEFORE service call
          const validation = validateNoteData(title, content);
          if (!validation.isValid) {
            const error = validation.error || 'Invalid note data';
            set({ 
              error,
              lastError: {
                operation: 'createNote',
                timestamp: Date.now(),
                details: error
              }
            });
            return null;
          }

          set({ isSyncing: true, error: undefined });
          
          const note = await notesService.createNote(title, content, tags);
          
          if (note) {
            set(state => ({
              notes: [...state.notes, note],
              selectedNote: note,
              isSyncing: false
            }));
            return note;
          } else {
            throw new Error('Failed to create note');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create note';
          set({ 
            isSyncing: false, 
            error: errorMessage,
            lastError: {
              operation: 'createNote',
              timestamp: Date.now(),
              details: errorMessage
            }
          });
          return null;
        }
      }
    })
  )
);
```

## Testing Strategy

### Critical Testing Lessons Learned

**MAJOR ISSUE**: Tests were mocking the wrong layer, creating false confidence while missing database integration failures.

#### Test Layer Strategy

1. **Unit Tests** (Service Layer):
   ```typescript
   // Mock Tauri invoke calls
   vi.mock('@tauri-apps/api/tauri', () => ({
     invoke: vi.fn()
   }));
   
   // Test service functions with mocked responses
   it('should create note with valid data', async () => {
     const mockResponse = {
       id: 1,
       title: 'Test Note',
       content: 'Test content',
       user_id: 'test_user',
       tags: null,
       created_at: '2024-01-01T00:00:00Z',
       updated_at: '2024-01-01T00:00:00Z'
     };
     
     vi.mocked(invoke).mockResolvedValueOnce(mockResponse);
     
     const result = await createNote('Test Note', 'Test content');
     
     expect(result.success).toBe(true);
     expect(result.note?.title).toBe('Test Note');
   });
   ```

2. **Integration Tests** (Database Schema):
   ```typescript
   // Test actual database integration
   it('should handle real database schema', async () => {
     // This test would fail if schema doesn't match
     const result = await notesService.createNote('Test', 'Content');
     expect(result).toBeTruthy();
   });
   ```

3. **Component Tests** (Store Integration):
   ```typescript
   // Test store with real service calls
   it('should create note through store', async () => {
     const { result } = renderHook(() => useNotesStore());
     
     await act(async () => {
       const note = await result.current.createNote('Test Note');
       expect(note).toBeTruthy();
     });
   });
   ```

#### Test Patterns to Avoid

**ANTI-PATTERN**: Mocking service calls in integration tests
```typescript
// BAD: This creates false confidence
vi.mock('../services/notesService', () => ({
  notesService: {
    createNote: vi.fn().mockResolvedValue(mockNote)
  }
}));
```

**CORRECT PATTERN**: Test real service integration
```typescript
// GOOD: Test actual service behavior
it('should handle service errors gracefully', async () => {
  // Test with real service that might fail
  const result = await notesService.createNote('', ''); // Invalid data
  expect(result).toBeNull();
});
```

### Testing Documentation Requirements

1. **Database Schema Tests**: Verify frontend service matches backend schema
2. **Data Transformation Tests**: Ensure proper type conversions
3. **Error Handling Tests**: Validate graceful failure modes
4. **Validation Tests**: Test input validation before service calls

## Development Workflow

### Rust Tauri Backend Type Checking Equivalents

Based on the LibreOllama project structure, here are the main commands and tools that serve as the Rust/Tauri equivalent of TypeScript type checking:

#### Primary Type Checking Command

**`cargo check`** is the direct equivalent of TypeScript's `tsc --noEmit` command. It performs **fast, type-only compilation** without generating final binaries, making it ideal for development workflows where you want quick feedback on type errors and syntax issues.

```bash
cargo check
```

This command:
- Validates all type annotations and type safety
- Checks syntax correctness and compilation errors
- Runs significantly faster than `cargo build` (approximately 1.5-2x speedup)
- Saves metadata files for incremental checking

#### Enhanced Type Checking with Linting

**`cargo clippy`** extends type checking with comprehensive linting and static analysis. It's equivalent to combining TypeScript type checking with ESLint:

```bash
cargo clippy
```

Clippy provides:
- Over 750 linting rules for common mistakes and code improvements
- Categories including correctness, style, complexity, and performance checks
- Automatic fix suggestions with `cargo clippy --fix`

#### Code Formatting

**`cargo fmt`** handles code formatting (equivalent to Prettier for TypeScript):

```bash
cargo fmt
```

This automatically formats Rust code according to community style guidelines.

#### Testing

**`cargo test`** runs unit and integration tests:

```bash
cargo test
```

#### LibreOllama-Specific Implementation

For your Gmail feature implementation in LibreOllama, here's the recommended development workflow:

**1. Development Workflow Commands**
```bash
# Quick type checking (fastest feedback)
cargo check

# Comprehensive checking with linting
cargo clippy

# Format code
cargo fmt

# Run tests
cargo test

# Build for production
cargo build --release
```

**2. Package.json Integration**
Add these scripts to your `package.json` to mirror the existing TypeScript checking:

```json
{
  "scripts": {
    "tauri:check": "cargo check --manifest-path=src-tauri/Cargo.toml",
    "tauri:lint": "cargo clippy --manifest-path=src-tauri/Cargo.toml",
    "tauri:fmt": "cargo fmt --manifest-path=src-tauri/Cargo.toml",
    "tauri:test": "cargo test --manifest-path=src-tauri/Cargo.toml"
  }
}
```

**3. Tauri-Specific Type Safety**

For the Gmail feature implementation, you can leverage **Tauri Specta** for type-safe command generation:

```rust
use tauri_specta::ts;

#[tauri::command]
#[specta::specta]
fn gmail_fetch_emails(query: String) -> Result<Vec<Email>, String> {
    // Implementation
}
```

This generates TypeScript types automatically, ensuring type safety between your Rust backend and TypeScript frontend.

**4. CI/CD Integration**

Based on LibreOllama's existing structure, add Rust checking to your CI pipeline:

```yaml
# Add to existing workflow
- name: Check Rust code
  run: cargo check --manifest-path=src-tauri/Cargo.toml

- name: Lint Rust code
  run: cargo clippy --manifest-path=src-tauri/Cargo.toml -- -D warnings

- name: Test Rust code
  run: cargo test --manifest-path=src-tauri/Cargo.toml
```

**Summary**: The **cargo check** command is your primary equivalent to TypeScript type checking, providing fast feedback on type errors and compilation issues. Combined with **cargo clippy** for comprehensive linting and **cargo fmt** for formatting, you get a complete development toolkit that mirrors the TypeScript development experience while leveraging Rust's powerful type system.

### Pre-Implementation Checklist

1. **Database Schema Review**:
   - [ ] Verify column names match service expectations
   - [ ] Confirm data types align (INTEGER vs STRING)
   - [ ] Check nullable constraints
   - [ ] Validate foreign key relationships

2. **Service Layer Design**:
   - [ ] Define clear interfaces for requests/responses
   - [ ] Implement data transformation functions
   - [ ] Add comprehensive error handling
   - [ ] Include input validation

3. **Store Implementation**:
   - [ ] Add proper error state management
   - [ ] Implement validation before service calls
   - [ ] Handle loading states appropriately
   - [ ] Include optimistic updates where appropriate

4. **Testing Strategy**:
   - [ ] Write unit tests for service functions
   - [ ] Create integration tests for database schema
   - [ ] Test error handling and edge cases
   - [ ] Validate store state management

### Code Quality Standards

1. **Error Handling**:
   ```typescript
   // Always return structured error responses
   return {
     success: false,
     error: error instanceof Error ? error.message : 'Unknown error'
   };
   ```

2. **Input Validation**:
   ```typescript
   // Validate before service calls
   const validation = validateNoteData(title, content);
   if (!validation.isValid) {
     return { success: false, error: validation.error };
   }
   ```

3. **Type Safety**:
   ```typescript
   // Use exact database types
   export interface NoteResponse {
     id: number;         // Match database INTEGER
     title: string;      // Match database TEXT
     content: string;    // Match database TEXT
     user_id: string;    // Match database TEXT
     tags: string | null; // Match database TEXT (nullable)
     created_at: string; // Match database DATETIME
     updated_at: string; // Match database DATETIME
   }
   ```

## Production Readiness Checklist

### Database Integration
- [ ] Schema matches service expectations exactly
- [ ] Data transformations handle all type conversions
- [ ] Error handling covers database constraint violations
- [ ] Migrations are properly versioned

### Service Layer
- [ ] All service functions have comprehensive error handling
- [ ] Input validation prevents invalid database operations
- [ ] Response transformations match frontend expectations
- [ ] Logging provides sufficient debugging information

### Store Management
- [ ] Error states are properly managed and displayed
- [ ] Loading states provide user feedback
- [ ] Optimistic updates have rollback mechanisms
- [ ] State persistence works correctly

### Testing Coverage
- [ ] Unit tests cover all service functions
- [ ] Integration tests verify database schema compatibility
- [ ] Component tests validate store interactions
- [ ] Error scenarios are thoroughly tested

## Common Pitfalls and Solutions

### Database Schema Mismatches
**Problem**: Frontend service expects different column names/types than database
**Solution**: Always verify schema before writing service code

### False Test Confidence
**Problem**: Tests mock the wrong layer, missing real integration issues
**Solution**: Test actual service calls with real database constraints

### Error Handling Gaps
**Problem**: Services don't handle database errors gracefully
**Solution**: Implement comprehensive error handling with user-friendly messages

### Type Conversion Issues
**Problem**: Frontend expects strings but database returns numbers
**Solution**: Implement explicit data transformation functions

## Performance Considerations

### Database Queries
- Use indexed columns for frequent queries
- Implement pagination for large result sets
- Cache frequently accessed data appropriately

### State Management
- Use selectors to prevent unnecessary re-renders
- Implement optimistic updates for better UX
- Debounce search operations

### Error Recovery
- Implement retry mechanisms for transient failures
- Provide clear error messages to users
- Log errors for debugging without exposing sensitive data

---

This guide should be updated as new patterns emerge and lessons are learned from production usage. 