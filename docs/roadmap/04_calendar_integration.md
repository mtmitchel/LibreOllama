**A REMINDER: IF A FEATURE IS ALREADY PRESENT BUT NOT LISTED IN THE MVP, DO NOT DELETE IT.**

**CRITICAL UI CONVENTION: This project uses sentence case (not title case) for ALL user-facing text including page titles, headings, section titles, list titles, button copy, navigation copy, form labels, menu items, and any other UI text. Example: "Create new project" NOT "Create New Project".**

# Calendar & Tasks Integration Roadmap

This document provides a comprehensive overview of the Calendar & Tasks Integration feature, detailing its current implementation and future plans.

## Design Assets

- **Mockup:** [calendar mockup.png](../../design/mockups/calendar%20mockup.png)
- **Spec:** [calendar.html](../../design/specs/calendar.html)

## Current Implementation

The Calendar page provides comprehensive calendar functionality with Google Calendar integration and task management features. While feature-rich, the implementation has reliability and testing gaps.

### Frontend Architecture

- **Calendar View:** The `Calendar.tsx` page uses the `React Big Calendar` library to display events with Day, Week, and Month view switching.
- **Event Management:** Full CRUD operations for calendar events (create, read, update, delete) with Google Calendar API integration.
- **Task Integration:** A sidebar that displays tasks from Google Tasks with filtering, creation capabilities, and drag-and-drop scheduling.
- **State Management:** Uses `useGoogleCalendarStore` for calendar events and `useGoogleTasksStore` for tasks with real API integration.

### Backend Architecture

- **Google Calendar API Integration:** Direct integration with Google Calendar API through Tauri commands for event management.
- **Google Tasks Integration:** Integration with Google Tasks API for task synchronization and scheduling.
- **Multi-Account Support:** Supports multiple Google accounts with centralized authentication management.

### Implemented Features

- Day, Week, and Month calendar views with navigation
- Create, edit, and delete calendar events with Google Calendar sync
- Task sidebar with Google Tasks integration and column filtering
- Drag-and-drop task scheduling from sidebar to calendar (direct drop without modal)
- Task-to-event conversion with automatic 1-hour duration
- Multi-account Google Calendar and Tasks support
- Real-time event updates and synchronization
- Event resizing and drag-and-drop repositioning
- Search and filtering capabilities
- Task sorting in sidebar by "My order", "Date", and "Title"
- Right-click context menu for tasks with quick actions
- 5-minute auto-sync for Google Tasks
- Direct task placement on calendar without popup modal
- Calendar shows ALL subscribed calendars with color coding
- Task click opens edit modal instead of marking complete
- Proper month transitions in calendar headers (e.g., "Jul 1", "Aug 1")

### Current Limitations

- **Testing Coverage:** Limited test coverage with testing audit score of 30/100, indicating significant reliability concerns.
- **Error Handling:** Inconsistent error handling for API failures and network issues.
- **Sync Reliability:** Potential synchronization issues between local state and Google services.
- **Performance:** May have performance issues with large datasets or frequent updates.
- **Edge Cases:** Limited handling of complex calendar scenarios (recurring events, etc.).
- **Undo Functionality:** No undo feature for accidentally marked tasks.

### Recent Improvements (2025-01-27)

- **Timezone Handling:** Fixed timezone-related date rollback issues where tasks would show one day behind after drag-and-drop
- **Date Parsing:** Implemented `parseTaskDueDate` helper to correctly handle RFC3339 dates from Google Tasks API
- **TimeBlock Preservation:** Fixed issue where editing task titles would lose time-block information
- **Compact Task Edit Modal:** Added streamlined modal for quick task editing from calendar view
- **Calendar Quick View Modal:** Implemented quick view popup for calendar events with edit/delete actions
- **Date Consistency:** Simplified date handling to use YYYY-MM-DD format throughout the system, avoiding complex timezone conversions

## Future Work & Todos

This roadmap is aligned with the **Single-User MVP Strategy**, focusing on core individual-focused capabilities first.

### MVP Must-Haves

- [x] **Calendar View:** Standard Day/Week/Month views. *(Existing)*
- [x] **Create/Edit Events:** Basic functionality to add and modify calendar events. *(Existing)*
- [x] **Task Sidebar:** A view of the task list next to the calendar. *(Implemented - 2025-01-23)*
- [x] **Drag-and-Drop Scheduling:** Implement drag tasks from the sidebar onto the calendar to schedule them. *(Completed - 2025-01-23, direct drop without modal)*
- [x] **Task Sorting:** Sort tasks by "My order", "Date", or "Title" in calendar sidebar. *(Completed - 2025-01-23)*
- [x] **Right-Click Context Menu:** Quick task actions via context menu. *(Completed - 2025-01-23)*
- [x] **5-Minute Auto-Sync:** Automatic synchronization with Google Tasks. *(Completed - 2025-01-23)*

### Phase 3 Hardening Tests

- **Time-blocking robustness:** simulate dragging tasks onto calendar across all views (day/week/month) and assert store + Google Calendar sync.
- **Event/Task linkage:** verify bidirectional updates (editing event updates task, marking task complete updates calendar event).
- **Accessibility audit:** ensure drag handles announce start/end via ARIA live regions.

### Post-MVP Enhancements

- [x] **Complete from Calendar:** Mark tasks as complete directly from the calendar view. *(Implemented - 2025-01-23, checkbox on task cards)*
- [ ] **Enhanced Event Modal:** Replace the basic event creation prompt with a full-featured modal.
- [x] **Event Resizing:** Allow users to resize events directly on the calendar to change their duration. *(Implemented - 2025-01-23, edge dragging enabled)*
- [x] **Task Click to Edit:** Clicking tasks opens edit modal instead of marking complete. *(Implemented - 2025-01-23)*
- [ ] **Undo Task Completion:** Add undo functionality for accidentally marked tasks.

### Future Vision & "Wow" Delighters

- [ ] **Time-blocking Suggestions:** AI-powered recommendations for scheduling tasks.
- [ ] **Smart Rescheduling:** Automatically move lower-priority tasks if a conflict arises.
- [ ] **Two-Way Sync:** Sync local tasks with Google Calendar events.
- [ ] **Daily Agenda Email:** An automated daily summary email of events and tasks.

### UX/UI Improvements

- [ ] **Visual Distinction:** Improve the visual design to make a clear distinction between regular calendar events and scheduled tasks.
- [ ] **Drag Feedback:** Provide better visual feedback during the drag-and-drop operation.
- [ ] **Display Task Priority:** Show a visual indicator of a task's priority on the calendar event.

### Technical Debt & Refactoring

- [x] **Google Calendar Integration:** Connect to real Google Calendar API instead of mock data. *(Completed - shows all subscribed calendars)*
- [x] **Drag-and-Drop Implementation:** Implement the core drag-and-drop scheduling workflow. *(Completed - 2025-01-23)*
- [ ] **Improve Test Coverage:** Write integration tests that cover the scheduling workflow.
- [ ] **Recurring Tasks:** Add the ability to see and manage recurring tasks on the calendar.
- [x] **Month Display Fix:** Calendar headers show proper month transitions. *(Completed - 2025-01-23)*
- [x] **All Calendars Display:** Show events from ALL subscribed Google calendars with colors. *(Completed - 2025-01-23)* 