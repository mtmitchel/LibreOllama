# LibreOllama Implementation Guide

**Purpose**: Practical development guide for working with LibreOllama systems

## Canvas Development

### Architecture Overview
The canvas uses a unified store pattern with React Konva for rendering:

```typescript
// Store usage pattern
const elements = useUnifiedCanvasStore(state => state.elements);
const selectedTool = useUnifiedCanvasStore(state => state.selectedTool);
```

### Key Components
- **Store**: `src/features/canvas/stores/unifiedCanvasStore.ts`
- **Event Handler**: `src/features/canvas/components/UnifiedEventHandler.tsx`
- **Layer Manager**: `src/features/canvas/layers/CanvasLayerManager.tsx`
- **Tools**: `src/features/canvas/tools/` (creation, drawing, selection)

### Development Patterns

**Element Creation**:
```typescript
// Use discriminated unions with type guards
const isTextElement = (element: CanvasElement): element is TextElement => 
  element.type === 'text'

// Use branded types for IDs
type ElementId = string & { __brand: 'ElementId' }
```

**Store Updates**:
```typescript
// Always use Immer patterns
set(produce((state) => {
  state.elements[id] = updatedElement
}))
```

**Testing**:
- Use store-first testing approach
- Avoid UI rendering tests for performance
- Test with real store instances, not mocks

### Performance Considerations
- Viewport culling is implemented
- Use granular selectors to minimize re-renders
- Monitor memory usage with built-in tools
- Use React.memo for heavy components

## Gmail Integration

### Architecture
- Backend services handle all API interactions
- Frontend uses Tauri commands for Gmail operations
- OAuth handled securely in backend only
- OS keyring for token storage

### Key Files
- **Backend Services**: `src-tauri/src/services/gmail/`
- **Frontend Service**: `src/features/mail/services/gmailTauriService.ts`
- **Store**: `src/features/mail/stores/mailStore.ts`
- **Types**: `src/features/mail/types/index.ts`

### Setup Requirements
1. Create `src-tauri/.env` file with OAuth credentials:
   ```
   GMAIL_CLIENT_ID=your_client_id
   GMAIL_CLIENT_SECRET=your_client_secret
   ```

2. Google Cloud Console configuration:
   - Enable Gmail API
   - Create OAuth 2.0 credentials
   - Configure OAuth consent screen
   - Set redirect URI: `http://localhost:1423/auth/gmail/callback`

### Development Patterns

**Service Usage**:
```typescript
// Use Tauri commands for Gmail operations
const result = await invoke('get_gmail_labels', { accountId });
```

**Error Handling**:
```typescript
// Comprehensive error handling
try {
  await gmailTauriService.getMessages();
} catch (error) {
  const handledError = handleGmailError(error, { operation: 'fetch_messages' });
}
```

### Testing
- Backend: `cd src-tauri && cargo test --lib`
- Integration tests cover full OAuth flow
- UI tests focus on user interactions

## Calendar & Tasks Integration

### Architecture
- Real Google API integration with mock fallbacks
- Store-based state management with Zustand
- Multi-account support built-in

### Key Files
- **Services**: `src/services/google/googleCalendarService.ts`, `src/services/google/googleTasksService.ts`
- **Store**: `src/stores/googleStore.ts`
- **Types**: `src/types/google.ts`
- **Pages**: `src/app/pages/Calendar.tsx`, `src/app/pages/Tasks.tsx`

### Development Patterns

**Service Usage**:
```typescript
// Calendar events
const events = await googleCalendarService.getEvents(account);

// Tasks management
const tasks = await googleTasksService.getTasks(account, taskListId);
```

**Store Integration**:
```typescript
// Use store actions for state updates
const { fetchCalendarEvents, fetchTaskLists } = useGoogleStore();
```

### Setup Requirements
1. Google Cloud Console setup similar to Gmail
2. Enable Calendar API and Tasks API
3. Configure OAuth scopes for calendar and tasks access

## Backend Development

### Architecture
- Service-oriented architecture with domain separation
- Rate limiting integrated with all API calls
- Database integration with SQLite
- Proper error handling and logging

### Key Patterns

**Service Creation**:
```rust
// Service with proper dependency injection
pub struct GmailApiService {
    auth_service: Arc<GmailAuthService>,
    db_manager: Arc<DatabaseManager>,
    rate_limiter: Arc<Mutex<RateLimiter>>,
}
```

**Command Implementation**:
```rust
// Tauri command with proper error handling
#[tauri::command]
pub async fn get_gmail_labels(account_id: String) -> Result<Vec<Label>, String> {
    // Implementation with rate limiting and error handling
}
```

### Testing
- Use `cargo test --lib` for backend tests
- Integration tests cover full service chains
- Mock external API calls appropriately

## Common Development Tasks

### Adding New Canvas Tool
1. Create tool component in `src/features/canvas/tools/`
2. Add tool state to unified store
3. Implement tool selection logic
4. Add to toolbar UI
5. Add tests using store-first approach

### Adding New Gmail Feature
1. Implement backend service method
2. Add Tauri command
3. Update frontend service to use command
4. Add to UI components
5. Test OAuth flow integration

### Adding New Calendar/Tasks Feature
1. Extend Google service with new API calls
2. Update TypeScript types
3. Add store actions
4. Implement UI components
5. Test with real and mock services

## Troubleshooting

### Canvas Issues
- Check unified store connections
- Verify event handler setup
- Review React Konva patterns
- Use performance monitoring tools

### Gmail Issues
- Verify OAuth environment variables
- Check OS keyring access
- Review rate limiting configuration
- Test with minimal scopes first

### Calendar/Tasks Issues
- Ensure Google API credentials are configured
- Check scope permissions
- Verify account authentication
- Test with mock services first

## Testing Strategy

### Canvas Testing
- Store-first testing for performance
- Integration tests for user workflows
- Avoid UI rendering tests
- Focus on business logic validation

### Gmail Testing
- Backend integration tests
- OAuth flow testing
- Error scenario coverage
- Performance under load

### Calendar/Tasks Testing
- API integration tests
- Multi-account scenarios
- Real vs mock service testing
- UI interaction testing

---

This guide focuses on practical implementation patterns and common development tasks. Refer to PROJECT_STATUS.md for current implementation status and known issues. 