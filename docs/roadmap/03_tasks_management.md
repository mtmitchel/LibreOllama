**A REMINDER: IF A FEATURE IS ALREADY PRESENT BUT NOT LISTED IN THE MVP, DO NOT REMOVE IT.**

**CRITICAL UI CONVENTION: This project uses sentence case (not title case) for ALL user-facing text including page titles, headings, section titles, list titles, button copy, navigation copy, form labels, menu items, and any other UI text. Example: "Create new project" NOT "Create New Project".**

# Tasks Management Roadmap

This document provides a comprehensive overview of the Tasks Management feature, detailing its current implementation and future plans.

## Design Assets

- **Mockup:** [tasks mockup.png](../../design/mockups/tasks%20mockup.png)
- **Spec:** [Tasks.html](../../design/specs/Tasks.html)

## Current Implementation

The Tasks page provides a **unified task management system** with local Kanban functionality and robust Google Tasks API integration. The system has been completely refactored from a fragmented multi-store architecture to a single unified store, solving critical data integrity issues.

### Architecture Overview

**Unified Task Store Architecture:**
- **Single Source of Truth**: All task data managed in `unifiedTaskStore.ts` with stable local IDs
- **Two-Way Sync**: Intelligent sync service (`realtimeSync.ts`) with proper reconciliation
- **Metadata Preservation**: Local-only fields (labels, priority, subtasks) preserved during Google sync
- **No Temp IDs**: Tasks created with stable local IDs, Google IDs added when synced
- **Optimistic Updates**: Immediate UI updates with rollback capability

**Key Benefits:**
- ✅ No more metadata loss during sync
- ✅ No more task duplication from race conditions  
- ✅ Reliable task deletion without resurrection
- ✅ Consistent UI state across all views
- ✅ Full offline support with sync on reconnection

### Frontend Architecture

- **Unified State Management:** The `unifiedTaskStore.ts` is the single source of truth for all task data, metadata, and sync state. It handles all CRUD operations with stable local IDs that never change.
- **Persistence:** All tasks and columns are persisted in the browser's `localStorage`, with automatic state restoration and sync state tracking.
- **Real-time Sync Service:** The `realtimeSync.ts` service provides intelligent two-way synchronization with Google Tasks API, using proper phase ordering to prevent race conditions and duplication.
- **Migration Layer:** The `migrationAdapter.ts` provides backward compatibility for existing components during the transition to the unified store.
- **Drag and Drop:** The `@dnd-kit` library is used to provide a professional and accessible drag-and-drop experience for moving tasks between columns. It includes features like a `DragOverlay` for visual feedback.
- **Component Structure:**
    - `Tasks.tsx`: The main page component that orchestrates the different views and the modal.
    - `TaskColumn.tsx` & `TaskCard.tsx`: Memoized components for displaying columns and individual tasks, optimized to prevent unnecessary re-renders.
    - `SimpleTaskModal.tsx`: A comprehensive modal for creating and editing tasks with full metadata support.
    - `KanbanTaskCard.tsx`: Enhanced task card with right-click context menu support for quick actions (edit, complete, duplicate, delete).
- **Metadata:** Tasks support rich metadata, including priority, labels, subtasks with completion status, and complex recurring task rules.

### Backend Architecture

- **Google Tasks API Integration:** Connects to Google Tasks API through Tauri commands for cloud synchronization with proper error handling and retry logic.
- **Local Storage:** Primary persistence layer using browser localStorage for offline functionality with automatic sync state tracking.
- **Sync Reconciliation:** Intelligent conflict resolution that preserves local metadata while syncing with Google's limited field set.
- **No Dedicated Backend:** No custom backend services for task management - relies on Google Tasks API and local storage with robust sync logic.

### Implemented Features

**Core Task Management:**
- Full task CRUD operations (Create, Read, Update, Delete) with stable local IDs
- Kanban and List view modes with consistent data across views
- LocalStorage persistence with automatic state restoration and sync state tracking
- Professional drag-and-drop with visual feedback and accessibility support

**Rich Metadata Support:**
- Comprehensive task metadata (priority, labels, subtasks, recurring tasks)
- Local-only fields preserved during Google sync (labels, priority, subtasks)
- Deep-merge logic ensures metadata never lost during synchronization

**Google Tasks Integration:**
- Robust Google Tasks API integration with proper error handling
- Multi-account Google Tasks support with OAuth 2.0 PKCE flow
- **CRITICAL: Date-only handling** - Google Tasks API only stores DATE information (not DATETIME)
  - Dates are parsed as YYYY-MM-DD in local timezone to prevent shifting
  - Never treat Google Tasks dates as datetime values
  - All update handlers only send changed fields to prevent unintended date updates
- Intelligent sync reconciliation preventing duplication and data loss

**Performance & UX:**
- Performance optimized with `React.memo`, `useCallback`, and efficient re-renders
- Dynamic Kanban columns based on Google Task lists (no hardcoded columns)
- Real-time sync with proper phase ordering (push local → pull remote → cleanup)
- Task sorting by "My order", "Date", and "Title"
- Right-click context menu on task cards for quick actions
- Optimistic updates with rollback capability for immediate UI feedback

### Current Limitations

- **Testing Coverage:** Limited test coverage with testing audit score of 45/100, indicating gaps in reliability testing for the unified store.
- **Component Migration:** Some components still use the legacy store APIs and need migration to the unified store.
- **Edge Case Handling:** While the unified architecture solves major issues, some edge cases in sync conflict resolution need refinement.

### Critical Implementation Notes

**Date Handling (Timezone Bug Prevention):**
- Google Tasks API stores dates as RFC3339 at midnight UTC (e.g., "2025-08-04T00:00:00.000Z")
- JavaScript Date parsing converts this to previous day in negative timezones
- Solution: Always extract date part (YYYY-MM-DD) and create dates in local timezone
- Use `parseGoogleTaskDate()` utility for consistent date handling
- Update handlers must only send changed fields to prevent accidental date shifts

**Priority System:**
- Uses 3-tier system with "None" option: High/Medium/Low/None
- "None" must convert to undefined when sending to API (not the string "none")
- All priority selectors must include the "None" option for clearing priority
- Priority updates must only send the priority field to prevent date shifts

**Show/Hide Completed Tasks:**
- Implemented per-list show/hide preferences (not just global)
- Calendar sidebar must receive ALL tasks, not pre-filtered
- Each view handles its own filtering based on showCompleted state
- Prevents double-filtering issues that break the toggle functionality

## Unified Architecture Implementation

### Migration from Fragmented to Unified Store

The task system has been completely refactored from a problematic three-store architecture to a single unified store:

**Previous Architecture (Problems):**
- `useKanbanStore.ts` - Local task data
- `googleTasksStore.ts` - Google sync state  
- `taskMetadataStore.ts` - Labels, priority, etc.
- **Issues**: Metadata loss, task duplication, deletion failures, ID race conditions

**Current Architecture (Solutions):**
- `unifiedTaskStore.ts` - Single source of truth for all task data
- `realtimeSync.ts` - Intelligent sync service with proper reconciliation
- `migrationAdapter.ts` - Backward compatibility layer

### Key Technical Improvements

**1. Stable Local IDs**
```typescript
interface UnifiedTask {
  readonly id: string;          // Stable local ID - NEVER changes
  googleTaskId?: string;        // Google's ID (when synced)
  // ... other fields
}
```

**2. Intelligent Sync Process**
- **Phase 1**: Push all pending local changes to Google
- **Phase 2**: Pull and reconcile remote changes  
- **Phase 3**: Clean up deleted tasks
- **Result**: No more feedback loops or duplication

**3. Metadata Preservation**
- Local-only fields (labels, priority, subtasks) preserved during sync
- Deep-merge logic ensures no data loss
- Google's limited field set doesn't overwrite local metadata

**4. Optimistic Updates**
- Immediate UI updates for better UX
- Rollback capability if sync fails
- Proper sync state tracking (`synced`, `pending_create`, `pending_update`, `pending_delete`)

### Migration Guide for Developers

**For Existing Components:**
```typescript
// Option 1: Use Migration Adapter (Immediate)
import { useTaskData } from '../hooks/useStores';
const { columns, createTask, updateTask, deleteTask } = useTaskData();

// Option 2: Direct Unified Store (Recommended)
import { useUnifiedTaskStore } from '../stores/unifiedTaskStore';
const store = useUnifiedTaskStore();
const tasks = store.getTasksByColumn(columnId);
```

## Future Work & Todos

This roadmap is aligned with the **Single-User MVP Strategy**, focusing on core individual-focused capabilities first.

### High Priority / Known Issues

- [ ] **Accessibility:** Implement full accessibility for the Tasks page, including keyboard navigation, ARIA labels, and screen reader support.
- [ ] **Component Migration:** Complete migration of all components to use the unified store APIs.
- [ ] **Testing Coverage:** Expand test coverage for the unified store and sync logic.
- [ ] **Sync Verification:** Verify column assignment and deduplication logic in production.

### MVP Must-Haves

- [x] **Kanban Columns CRUD:** Create, edit, and delete columns. *(Existing)*
- [x] **Drag-and-Drop:** Move tasks between columns. *(Existing)*
- [x] **Local Persistence:** Save board state in `localStorage`. *(Existing)*
- [x] **List View:** A toggle to switch between Kanban and a simple list view. *(Existing)*

### Post-MVP Enhancements

- [x] **Subtasks & Due Dates:** Add subtasks and due dates to cards. *(Existing, but can be improved)*
- [x] **Recurring Tasks:** Set tasks to repeat on a schedule. *(Existing)*
- [x] **Filters & Sorting:** Task sorting by "My order", "Date", and "Title" implemented. *(Completed - 2025-01-23)*
- [ ] **Search:** Add a search functionality to quickly find tasks.
- [x] **Two-Way Sync:** Seamless synchronization between local Kanban and Google Tasks with intelligent reconciliation. *(Completed - 2025-01-25)*
- [x] **Right-Click Context Menu:** Quick task actions via context menu (edit, complete, duplicate, delete). *(Completed - 2025-01-23)*
- [x] **Unified Store Architecture:** Single source of truth for all task data with stable IDs and metadata preservation. *(Completed - 2025-01-25)*
- [ ] **Task Dependencies:** Implement a system for defining dependencies between tasks.

### Future Vision & "Wow" Delighters

- [ ] **Natural Language Entry:** Create tasks with commands like "Call Bob on Tuesday at 2pm".
- [ ] **Smart Features:** Proactive reminders and automatic priority scoring.
- [ ] **Command Palette Integration:** A quick-add command to create tasks from anywhere in the app.
- [ ] **Backend Sync:** Add an optional backend synchronization feature to save tasks to a central database.

### UX/UI Improvements

- [ ] **Storybook Coverage:** Create Storybook stories for the `TaskCard`, `TaskColumn`, and `SimpleTaskModal` components.
- [ ] **Mobile Responsiveness:** Improve the experience on mobile devices with horizontal scroll-snap and better touch support.
- [ ] **Lazy Loading:** For columns with a very large number of tasks, fetch and render tasks lazily.

### Technical Debt & Refactoring

- [ ] **Performance Benchmarking:** Perform a performance benchmark to ensure the UI remains fast with a large number of tasks.
- [ ] **Authentication Refactor:** Convert the `GoogleAccountSettings` format to the standard `GoogleAccount` format in `Tasks.tsx` to streamline authentication.
- [x] **Unified Store Refactor:** Migrated from fragmented three-store architecture to single unified store. *(Completed - 2025-01-25)*
- [ ] **Legacy Store Cleanup:** Remove deprecated store files after all components are migrated.
- [ ] **Sync Logic Modularization:** Extract sync logic into separate modules for better maintainability. 

### Phase 3 Hardening Tests

- **Column drag/move robustness:** simulate 500 drag operations across columns and lists, assert final store state matches expected order.
- **Calendar time-blocking workflow:** drag task onto calendar, ensure Google Calendar event created and task marked as scheduled; write Vitest integration with mocked FullCalendar `eventReceive`.
- **Accessibility audit:** ensure draggable items have ARIA attributes (`aria-grabbed`, `aria-dropeffect`) and keyboard DnD works.

## Troubleshooting Guide

### Google Tasks Sync Issues

#### "Failed to sync tasks. Please check your Google account permissions"

This error occurs when the Google Tasks API cannot be accessed. Here's how to fix it:

**1. Check Developer Console for Error Details**
- Open browser developer console (F12) to see the specific error code
- 403 Error: Tasks API not enabled or permission denied
- 401 Error: Authentication token expired
- Other errors: Check the error message for details

**2. Enable Google Tasks API**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (or create a new one)
3. Navigate to "APIs & Services" → "Library"
4. Search for "Tasks API"
5. Click on "Tasks API" and press "Enable"
6. Wait a few minutes for the API to be fully activated

**3. Check OAuth Consent Screen**
1. In Google Cloud Console, go to "APIs & Services" → "OAuth consent screen"
2. Ensure the following scope is included: `https://www.googleapis.com/auth/tasks`
3. If not present, edit your OAuth consent screen and add the Tasks scope

**4. Reconnect Your Google Account**
1. Go to Settings in LibreOllama
2. Find your Google account
3. Click "Disconnect"
4. Click "Connect Google Account" again
5. During authorization, ensure you grant permission for "Tasks"

**5. Temporary Workaround - Disable Auto-sync**
If you need to use the app immediately without Tasks sync:
1. Open the file: `src\services\realtimeSync.ts`
2. Find line ~555 where it says `realtimeSync.initialize();`
3. Comment it out: `// realtimeSync.initialize();`
4. Restart the app

**6. Manual Testing**
To test if the API is working:
1. Open [Google Tasks API Explorer](https://developers.google.com/tasks/reference/rest/v1/tasklists/list)
2. Click "Try it"
3. Authorize with your Google account
4. Click "Execute"
5. If you see your task lists, the API is working

**7. Common Solutions**
- Clear browser cache and cookies for Google domains
- Use a different Google account to test if it's account-specific
- Check if you're using a Google Workspace account - some organizations restrict API access
- Ensure your Google Cloud project isn't in a suspended state

**8. Debug Information**
The enhanced error logging will show:
- Specific error codes (401, 403, etc.)
- Detailed error messages
- Suggestions based on the error type

Check the browser console for enhanced error messages after applying the code update. 