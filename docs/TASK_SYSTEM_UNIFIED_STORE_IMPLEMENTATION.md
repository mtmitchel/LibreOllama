# Task System Unified Store Implementation

## Overview

This document outlines the comprehensive refactoring of the task management system from a fragmented three-store architecture to a unified single store, solving critical data integrity issues including metadata loss, task duplication, and deletion failures.

## 📝 Project: LibreOllama Task Management – Status & Goals

### Current Architecture & Refactor Status

**Unified Task Store:**
We have successfully migrated from a fragmented, multi-store setup (Kanban, GoogleTasks, Metadata) to a **single unified Zustand store** for all task data and metadata.

- All fields (Google-supported and local-only like labels/priority) are now part of the `UnifiedTask` object
- The unified store is defined in [`src/stores/unifiedTaskStore.ts`](file:///src/stores/unifiedTaskStore.ts) and types in [`src/stores/unifiedTaskStore.types.ts`](file:///src/stores/unifiedTaskStore.types.ts)

**Sync Logic:**
- **Two-way sync** with Google Tasks API via a dedicated sync service ([`src/services/realtimeSync.ts`](file:///src/services/realtimeSync.ts))
- **Local-only fields** (labels, priority, subtasks, etc.) are preserved and deep-merged after every sync, since Google Tasks API does not support them
- **No more temp IDs:** Tasks are created with a stable local ID, and when synced, a Google Task ID is attached

**UI:**
- Kanban board and task cards now read directly from the unified store
- All metadata is always available for rendering; no more missing fields after refresh or sync

## Problem Summary

The original architecture suffered from:
1. **Fragmented State**: Task data split across `useKanbanStore`, `googleTasksStore`, and `taskMetadataStore`
2. **ID Race Conditions**: Temporary IDs changing to Google IDs caused React component remounts and metadata loss
3. **Sync Logic Flaws**: Two-loop synchronization created feedback loops causing exponential task duplication
4. **Deletion Failures**: Tasks reappearing after deletion due to sync race conditions

### Recent Issues & Fixes

**Critical Bugs Addressed:**
- **Tasks not displaying:** Fixed by ensuring column IDs match and tasks are assigned to columns correctly during sync
- **Calendar duplication:** Fixed by normalizing date formats for deduplication keys in the calendar view
- **Metadata loss:** Deep-merge logic now ensures labels/priority are never overwritten by Google sync payloads
- **Local task creation:** Fixed by correctly assigning `googleTaskListId` from column at creation time
- **Premature deletion:** Implemented 30-second grace period to prevent deletion due to API replication lag

**Authentication:**
- Google OAuth 2.0 PKCE flow is implemented and tokens are securely managed via Tauri backend
- All Google API calls are routed through a single service for consistency and security

**Testing:**
- Added comprehensive unit tests for `batchUpdateFromGoogle` method
- Created integration tests for sync reconciliation scenarios
- Debug logging for task creation, deletion, and column assignment
- All tests passing with proper vanilla Zustand patterns

## Solution Architecture

### 1. Unified Task Store (`unifiedTaskStore.ts`)

**Key Features:**
- Single source of truth for all task data
- Stable local IDs that never change (preventing React remount issues)
- Integrated metadata directly in task objects
- Proper sync state tracking (`synced`, `pending_create`, `pending_update`, `pending_delete`)
- Optimistic updates with rollback capability

**Core Data Model:**
```typescript
interface UnifiedTask {
  readonly id: string;          // Stable local ID - NEVER changes
  googleTaskId?: string;        // Google's ID (when synced)
  title: string;
  notes?: string;
  labels: string[];             // Metadata integrated
  priority: 'low' | 'normal' | 'high' | 'urgent';
  syncState: TaskSyncState;
  // ... other fields
}
```

### 2. Real-time Sync Service (`realtimeSync.ts`)

**Improvements:**
- Single, intelligent sync loop (no more duplication feedback)
- Proper phase ordering: push local changes first, then pull remote
- Respects deletion markers to prevent resurrection
- Immediate sync for critical operations (deletions)
- 5-minute periodic sync for regular updates

**Sync Process:**
1. **Phase 1**: Push all pending local changes to Google
2. **Phase 2**: Pull and reconcile remote changes
3. **Phase 3**: Clean up deleted tasks

### 3. Migration System

**Components:**
- `migrationAdapter.ts`: Provides backward compatibility layer
- `UnifiedStoreMigration.tsx`: React component for seamless migration
- `useStores.ts`: Hook for components to access unified data

**Features:**
- Zero-downtime migration
- Preserves all existing data
- Maintains API compatibility for gradual component updates
- Automatic cleanup of old sync intervals

## Implementation Status

### Completed:
- ✅ Unified task store with stable IDs
- ✅ Real-time sync service with proper reconciliation
- ✅ Migration adapter for backward compatibility
- ✅ React migration component
- ✅ Hooks for unified data access

### Integration:
- The `UnifiedStoreMigration` component has been added to `App.tsx`
- Old sync service (`setupAutoSync`) has been deprecated
- Components can gradually migrate to use `useTaskData()` hook

## Outstanding Tasks & Next Steps

**Immediate Priorities:**
- **Verify column assignment:** Ensure all tasks from Google are assigned to the correct columns and appear in the UI
- **Confirm deduplication:** Make sure calendar events and tasks are not duplicated (date normalization)
- **Test deletion:** Ensure tasks deleted locally are not re-synced from Google
- **Audit all Google Tasks API calls:** Confirm they go through `googleTasksService` only

**Refactoring Tasks:**
- Remove `syncWithGoogle` from the store (make it pure state management)
- Modularize sync logic into `_updateExistingTaskFromGoogle` and `_createNewTaskFromGoogle`
- Create custom hooks (`useTasksData`, `useCalendarEventsData`) for UI data needs
- Extract date normalization to a shared utility

**Verification Steps:**
- Run the app and check that:
  - Tasks display on the Tasks page with correct metadata
  - No `[UnifiedStore] Deleted task {taskId: 'local-task-...'}` messages for Google-originating tasks
  - Calendar deduplication logs show correct matching
- Add/verify unit tests for `batchUpdateFromGoogle` and integration tests for sync reconciliation

## Benefits

1. **No More Metadata Loss**: Stable IDs prevent React remounts
2. **No More Duplicates**: Single-phase sync with intelligent reconciliation
3. **Reliable Deletions**: Proper tracking of deletion state
4. **Better Performance**: Single store reduces complexity
5. **Easier Maintenance**: Centralized state management

## Migration Guide

### For Existing Components:

**Option 1: Use Migration Adapter (Immediate)**
```typescript
import { useTaskData } from '../hooks/useStores';

function MyComponent() {
  const { columns, createTask, updateTask, deleteTask } = useTaskData();
  // Use same API as before
}
```

**Option 2: Direct Unified Store (Recommended for new code)**
```typescript
import { useUnifiedTaskStore } from '../stores/unifiedTaskStore';

function MyComponent() {
  const store = useUnifiedTaskStore();
  const tasks = store.getTasksByColumn(columnId);
  // Use new unified API
}
```

## Testing Recommendations

1. **Create Task**: Verify stable ID persists through sync
2. **Update Task**: Confirm metadata preserved during updates
3. **Delete Task**: Ensure no resurrection after deletion
4. **Concurrent Edits**: Test sync with multiple clients
5. **Offline/Online**: Verify proper sync after reconnection

## Future Enhancements

1. **Conflict Resolution**: Add last-write-wins or merge strategies
2. **Batch Operations**: Optimize for bulk task operations
3. **Real-time Collaboration**: WebSocket support for instant updates
4. **Offline Queue**: Better offline operation handling

## References & Key Files

- [unifiedTaskStore.ts](file:///src/stores/unifiedTaskStore.ts)
- [unifiedTaskStore.types.ts](file:///src/stores/unifiedTaskStore.types.ts)
- [realtimeSync.ts](file:///src/services/realtimeSync.ts)
- [dateUtils.ts](file:///src/utils/dateUtils.ts)
- [Google Tasks API Docs](https://developers.google.com/tasks)

## Summary Table

| Feature | Old Setup (Fragmented) | New Setup (Unified) |
| :--- | :--- | :--- |
| Task Data Location | 3 separate stores | Single unified store |
| Metadata Handling | Separate, often lost | Always present on task object |
| ID Handling | Temp IDs, race conditions | Stable local IDs, Google IDs added |
| Sync Logic | Manual, error-prone, racey | Event-driven, robust, atomic |
| UI Consistency | Frequent missing data | Always up-to-date, instant |
| Offline Support | Partial, buggy | Full, reliable |
| Testing | Difficult, fragmented | Unified, comprehensive |

## Technical Debt Addressed

- Eliminated three-store fragmentation
- Removed brittle ID mutation logic
- Fixed feedback loop in sync service
- Consolidated metadata management
- Improved error handling and recovery

This implementation provides a solid foundation for reliable task management with Google Tasks integration while maintaining backward compatibility for a smooth transition.

## What Developers Need to Know

### Picking Up This Work

**Current State:**
- Unified store architecture is implemented and functional
- Migration layer provides backward compatibility
- Sync logic is robust but needs verification in production
- Some components still use legacy APIs

**Latest Improvements (January 2025):**
1. **Removed all legacy code** - Deleted migration adapters and `importFromLegacyStores` method
2. **Fixed sync filtering** - Tasks marked for deletion are properly filtered before batch updates
3. **Added comprehensive tests** - Unit tests for store methods and integration tests for sync scenarios
4. **Cleaned up codebase** - Removed all KanbanTask type aliases and legacy references

**Remaining Work:**
1. **Production verification** - Test sync behavior with real Google API at scale
2. **Performance optimization** - Monitor and optimize sync for large task volumes
3. **Error recovery** - Enhance error handling for network failures and API limits
4. **User feedback** - Add UI indicators for sync status and conflicts

**Key Files to Understand:**
- `src/stores/unifiedTaskStore.ts` - Main store implementation
- `src/services/realtimeSync.ts` - Sync logic and reconciliation
- `src/hooks/useStores.ts` - Migration adapter for components
- `src/stores/unifiedTaskStore.types.ts` - Type definitions

**Testing Strategy:**
- Unit tests for store operations
- Integration tests for sync scenarios
- End-to-end tests for user workflows
- Debug logging for troubleshooting sync issues

This unified approach solves the major architectural problems while providing a clear path forward for continued development.