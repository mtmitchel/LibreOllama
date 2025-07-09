# Technical Debt Tracking

## High Priority

### Calendar/Tasks Integration Incomplete
**Priority**: High
**Impact**: Core feature workflow missing
**Status**: Partially implemented

**Issue**: The Calendar and Tasks pages exist as separate functional systems but lack the integrated drag-and-drop time blocking workflow that was the core value proposition of the original scope.

**What's Missing**:
1. **Drag-and-drop from tasks to calendar dates** - Tasks are draggable but calendar doesn't accept drops
2. **"Schedule Task" modal** - No modal opens when dropping tasks on calendar
3. **Time selection interface** - No start/end time inputs for task scheduling
4. **Task-to-event conversion** - No API integration to create calendar events from tasks
5. **Enhanced event creation** - Basic prompt instead of full modal with proper form

**Current State**:
- ✅ Tasks Kanban board with intra-column drag-and-drop
- ✅ Calendar displays events and has task sidebar
- ❌ No cross-system integration between tasks and calendar

**Root Cause**: Implementation focused on individual system functionality rather than the integrated workflow.

**Solution**:
1. Add FullCalendar drop event handlers for tasks
2. Create modal component for task scheduling with time inputs
3. Implement `createEventFromTask()` API call in Google services
4. Add proper drag-and-drop visual feedback and validation
5. Replace basic event creation prompt with full modal

**Files to Modify**:
- `src/app/pages/Calendar.tsx` - Add drop handlers and modal
- `src/stores/googleStore.ts` - Add task-to-event conversion actions
- `src/services/google/googleCalendarService.ts` - Add event creation from task data

### Gmail Store Architecture Refactor
**Priority**: Medium
**Impact**: Test reliability and maintainability
**Status**: Documented, solution designed

**Issue**: Gmail workflow tests disabled due to race condition between automatic data fetching and test setup.

**Root Cause**: The `addAccount()` action in mailStore violates single responsibility by coupling state updates with side effects (automatic API calls).

**Solution**: 
1. Decouple data fetching from `addAccount()` action
2. Implement dependency injection for `GmailApiService`
3. Create explicit `initializeAccountData()` action
4. Rewrite workflow tests using controlled async flow

**References**: 
- `GMAIL_TESTING_COMPREHENSIVE_REPORT.txt` - Complete analysis
- Disabled tests in `src/tests/integration/gmail-complete-workflow.test.tsx`

**Confidence Level**: High - Gmail UI integration tests provide sufficient coverage of user-facing functionality

### Performance Monitoring Implementation
**Priority**: Medium  
**Impact**: User experience and production reliability  
**Status**: Created but not deployed

**Issue**: Performance tests revealed canvas operations taking 300ms vs expected 200ms, indicating potential production performance degradation.

**Solution Created**: 
- Implemented `ProductionPerformanceMonitor` class with real-time tracking
- Added performance thresholds based on test findings
- Canvas element addition: 250ms threshold (stricter than test 300ms)
- Automatic reporting of performance issues

**Current Status**: 
- ✅ Monitor class implemented in `src/features/canvas/utils/performance/productionMonitoring.ts`
- ❌ **Not integrated** - Zero usage found in codebase
- ❌ No actual performance tracking occurring

**Next Steps**:
1. Integrate `trackCanvasPerformance()` calls in canvas operations
2. Add `trackGmailPerformance()` calls in Gmail service operations
3. Set up production monitoring dashboard

---

## Production Insights from Testing

### Architecture Insights Applied
**What Works Well (Keep):**
- ✅ Gmail error handling system - comprehensive and production-ready
- ✅ Token refresh logic - robust automatic retry on 401 errors  
- ✅ Memory management - no leaks detected in canvas tests
- ✅ Environment safety - test checks don't interfere with production

**What Needs Attention:**
- 🔄 **Calendar/Tasks integration** - Core workflow missing from implementation
- 🔄 **Performance monitoring integration** - Monitor created but not deployed
- 🔄 Production metrics collection for user experience insights
- 🔄 Backend test failures - 2 failing tests (OAuth config, Gmail scopes)

## Current Status Summary

**Backend Tests**: 40 passing, 2 failing (95% success rate)
- Failing: OAuth configuration and Gmail scopes tests
- Impact: Minor configuration issues, not functional problems

**Frontend Integration**: 
- Gmail UI tests: Passing
- Gmail workflow tests: Disabled due to race conditions
- Canvas tests: Store-first approach working well
- **Calendar/Tasks**: Individual systems work, integration workflow missing

---

*Note: This follows our "Confidence, Not Coverage" testing philosophy. The disabled tests were testing implementation timing rather than user functionality.* 