# Task Sync Diagnosis Research Prompt

## 🚨 CRITICAL: Task Sync System Investigation Required

You are tasked with conducting a **comprehensive, deep-dive investigation** into why the task synchronization system in LibreOllama is not working properly. This is a **production-critical issue** affecting core functionality. You must provide a complete diagnosis with specific root causes and actionable solutions.

## 📋 Project Context & Architecture Overview

### Current System Architecture
- **Frontend**: React + TypeScript + Zustand (unified store pattern)
- **Backend**: Tauri (Rust) with Google Tasks API integration
- **Sync Strategy**: Real-time bidirectional sync between local Kanban and Google Tasks
- **Store Pattern**: Recently migrated from fragmented 3-store architecture to unified single store

### Key Files to Analyze
```
src/stores/unifiedTaskStore.ts          # Main task store (547 lines)
src/stores/unifiedTaskStore.types.ts    # Type definitions
src/services/realtimeSync.ts            # Sync orchestration (600 lines)
src/services/google/googleTasksService.ts # Google API wrapper (317 lines)
src/hooks/useStores.ts                  # Migration adapter
src/app/pages/Tasks.tsx                 # Main UI component
```

## 🔍 Specific Issues to Investigate

### 1. **Task Display Issues**
**Problem**: Tasks created in Google Tasks are not appearing in the LibreOllama UI
**Investigation Points**:
- Examine `batchUpdateFromGoogle()` in unifiedTaskStore.ts (lines 280-350)
- Check column assignment logic in `reconcileColumnTasks()` (lines 463-522)
- Verify `googleTaskListId` matching between columns and tasks
- Analyze the "CRITICAL: No column found" error logs

**Key Questions**:
- Are Google task lists being properly mapped to local columns?
- Is the `googleTaskListId` field consistent across the sync pipeline?
- Are tasks being assigned to the correct columns during batch updates?

### 2. **Sync State Management Issues**
**Problem**: Tasks get stuck in pending states or disappear after sync
**Investigation Points**:
- Analyze sync state transitions in `markTaskSynced()`, `markTaskSyncError()`, `rollbackTask()`
- Check `getPendingTasks()` implementation and usage
- Examine optimistic update logic in `createTask()`, `updateTask()`, `deleteTask()`
- Review sync state tracking: `'synced'`, `'pending_create'`, `'pending_update'`, `'pending_delete'`, `'error'`

**Key Questions**:
- Are sync states being properly updated after API calls?
- Is there proper error handling and rollback for failed syncs?
- Are optimistic updates being correctly reconciled with server responses?

### 3. **ID Management & Duplication Issues**
**Problem**: Tasks may be duplicated or have ID conflicts
**Investigation Points**:
- Examine ID generation in `generateTaskId()` (line 59)
- Check Google ID assignment in `markTaskSynced()` (lines 220-240)
- Analyze `getTaskByGoogleId()` implementation
- Review the ID strategy: local IDs vs Google IDs vs hybrid approach

**Key Questions**:
- Are local IDs stable and never changing?
- Is the Google ID assignment working correctly?
- Are there race conditions in ID assignment during sync?

### 4. **Column Synchronization Issues**
**Problem**: Columns may not be properly synced with Google Task Lists
**Investigation Points**:
- Examine `setupColumns()` in realtimeSync.ts (lines 111-208)
- Check column creation and mapping logic
- Analyze `googleTaskListId` assignment to columns
- Review column-task relationship management

**Key Questions**:
- Are Google Task Lists being properly fetched and mapped to local columns?
- Is the column-task relationship being maintained during sync?
- Are new Google Task Lists being automatically created as local columns?

### 5. **API Integration Issues**
**Problem**: Google Tasks API calls may be failing or returning unexpected data
**Investigation Points**:
- Analyze all API calls in `googleTasksService.ts`
- Check error handling in `handleApiError()` (lines 15-25)
- Examine response parsing and data transformation
- Review authentication and token management

**Key Questions**:
- Are API calls returning the expected data structure?
- Is error handling comprehensive and informative?
- Are authentication tokens being properly managed?

## 🔬 Deep Investigation Requirements

### Phase 1: Code Analysis
1. **Trace the complete sync flow** from task creation to UI display
2. **Map all data transformations** between Google API and local store
3. **Identify all error paths** and failure modes
4. **Document the sync state machine** and transition logic

### Phase 2: Data Flow Analysis
1. **Examine localStorage persistence** and state restoration
2. **Check for data corruption** or inconsistent state
3. **Analyze the migration from legacy stores** to unified store
4. **Verify data integrity** across sync cycles

### Phase 3: API Integration Analysis
1. **Test all Google Tasks API endpoints** with real data
2. **Verify response parsing** and error handling
3. **Check authentication flow** and token refresh
4. **Analyze rate limiting** and retry logic

### Phase 4: Performance & Race Conditions
1. **Identify potential race conditions** in concurrent sync operations
2. **Check for memory leaks** or resource exhaustion
3. **Analyze sync timing** and interval management
4. **Examine optimistic update conflicts**

## 📊 Diagnostic Tools & Logging

### Current Logging Strategy
The system uses structured logging with these key patterns:
- `[UnifiedStore]` - Store operations and state changes
- `[RealtimeSync]` - Sync orchestration and API calls
- `[GoogleTasksService]` - API integration and error handling

### Required Diagnostic Information
1. **Console logs** from browser developer tools
2. **Network requests** to Google Tasks API
3. **LocalStorage state** before and after sync operations
4. **Store state snapshots** at key sync points
5. **Error stack traces** and exception details

## 🎯 Specific Investigation Tasks

### Task 1: Column Assignment Debugging
**Objective**: Determine why tasks aren't being assigned to correct columns
**Steps**:
1. Add detailed logging to `batchUpdateFromGoogle()` column matching logic
2. Verify `googleTaskListId` values in both columns and incoming tasks
3. Check if column creation in `setupColumns()` is working correctly
4. Test with a minimal set of Google Task Lists

### Task 2: Sync State Machine Analysis
**Objective**: Map out all sync state transitions and identify stuck states
**Steps**:
1. Create a state transition diagram for all sync states
2. Add logging to track state changes in real-time
3. Identify tasks that get stuck in pending states
4. Test error scenarios and rollback mechanisms

### Task 3: API Response Validation
**Objective**: Verify Google Tasks API responses match expected format
**Steps**:
1. Log all API responses and compare with type definitions
2. Test edge cases (empty lists, deleted tasks, etc.)
3. Verify authentication token validity and refresh
4. Check for API rate limiting or quota issues

### Task 4: Data Integrity Verification
**Objective**: Ensure data consistency across sync cycles
**Steps**:
1. Compare local state before/after sync operations
2. Verify no data loss during state transformations
3. Check for duplicate tasks or orphaned records
4. Validate localStorage persistence and restoration

## 🚨 Critical Areas Requiring Immediate Attention

### 1. **Column-Task Relationship**
The most critical issue appears to be in the column assignment logic. Focus on:
- `batchUpdateFromGoogle()` lines 300-330 (column matching)
- `setupColumns()` in realtimeSync.ts (column creation)
- `googleTaskListId` consistency across the entire pipeline

### 2. **Sync State Management**
Tasks getting stuck in pending states indicates issues with:
- State transition logic in sync operations
- Error handling and rollback mechanisms
- Optimistic update reconciliation

### 3. **API Integration Reliability**
Google Tasks API integration may have issues with:
- Response parsing and data transformation
- Error handling and retry logic
- Authentication token management

## 📋 Expected Deliverables

### 1. **Root Cause Analysis Report**
- Detailed explanation of why sync is failing
- Specific code locations and logic issues
- Data flow diagrams showing the problem areas
- Error scenarios and failure modes

### 2. **Solution Recommendations**
- Specific code changes required
- Architectural improvements needed
- Testing strategies for validation
- Rollback plan if changes fail

### 3. **Implementation Plan**
- Prioritized list of fixes
- Testing approach for each fix
- Deployment strategy
- Monitoring and validation plan

### 4. **Code Examples**
- Specific code snippets showing the problems
- Proposed fixes with before/after code
- Test cases to validate fixes
- Debugging tools and logging improvements

## 🔧 Technical Requirements

### Environment Setup
- Tauri development environment
- Google Tasks API access
- Browser developer tools
- Network monitoring tools

### Testing Approach
- Unit tests for store operations
- Integration tests for sync logic
- End-to-end tests for user workflows
- Manual testing with real Google Tasks data

### Validation Criteria
- Tasks created in Google appear in LibreOllama UI
- Tasks created in LibreOllama sync to Google
- No duplicate tasks or data loss
- Proper error handling and user feedback
- Consistent sync state management

## ⚠️ Critical Success Factors

1. **Comprehensive Logging**: Add detailed logging to track every step of the sync process
2. **Error Isolation**: Identify specific failure points and isolate root causes
3. **Data Validation**: Verify data integrity at every transformation step
4. **User Experience**: Ensure users get clear feedback about sync status
5. **Reliability**: Implement robust error handling and recovery mechanisms

## 🎯 Success Metrics

- **100% task visibility**: All Google tasks appear in LibreOllama UI
- **100% sync reliability**: No tasks lost or duplicated during sync
- **Clear error reporting**: Users understand sync status and issues
- **Performance**: Sync completes within reasonable time limits
- **Stability**: No crashes or infinite loops during sync operations

---

**This investigation requires deep technical expertise in React, TypeScript, Zustand, Tauri, and Google Tasks API integration. The external developer must be prepared to dive deep into the codebase and provide specific, actionable solutions to restore full sync functionality.** 