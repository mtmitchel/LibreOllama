**A REMINDER: IF A FEATURE IS ALREADY PRESENT BUT NOT LISTED IN THE MVP, DO NOT REMOVE IT.**

# Calendar & Tasks Integration Roadmap

This document provides a comprehensive overview of the Calendar & Tasks Integration feature, detailing its current implementation and future plans.

## Design Assets

- **Mockup:** [calendar mockup.png](../../design/mockups/calendar%20mockup.png)
- **Spec:** [calendar.html](../../design/specs/calendar.html)

## Current Implementation

The current implementation consists of two separate, functional systems that are not yet properly integrated.

### Frontend Architecture

- **Calendar View:** The `Calendar.tsx` page uses the `FullCalendar` library to display events from Google Calendar. It includes a sidebar that displays tasks from the `googleTasksService`.
- **Tasks View:** The `Tasks.tsx` page is a fully functional Kanban board that uses the `googleTasksService` to manage task lists and tasks.
- **Services:**
    - `googleCalendarService.ts`: Interacts with the Google Calendar API.
    - `googleTasksService.ts`: Interacts with the Google Tasks API.
- **State Management:** A legacy Zustand store, `googleStore.ts`, manages the state for both calendar events and Google Tasks. This is separate from the `useKanbanStore` used for the local-only tasks board.

### Backend Architecture

- **Direct API Calls:** The frontend services make calls to Tauri commands which in turn call the Google Calendar and Tasks APIs via the Rust backend services. There is no specific integration logic on the backend; it simply provides access to the Google APIs.

### Implementation Gap: The Missing Workflow

The core value proposition of this feature was the ability to seamlessly schedule tasks by dragging them from a task list onto the calendar. **This workflow is completely missing.**

- **What Works:** You can view calendar events. You can manage Google Tasks in a separate Kanban view.
- **What Doesn't Work:**
    - You cannot drag a task from the sidebar and drop it onto the calendar to schedule it.
    - There is no "Schedule Task" modal to set a time when a task is dropped.
    - The core logic to convert a task into a calendar event (`task-to-event`) is not implemented.

## Future Work & Todos

This roadmap is aligned with the **Single-User MVP Strategy**, focusing on core individual-focused capabilities first.

### MVP Must-Haves

- [ ] **Calendar View:** Standard Day/Week/Month views.
- [ ] **Create/Edit Events:** Basic functionality to add and modify calendar events.
- [ ] **Task Sidebar:** A read-only view of the task list next to the calendar.

### Post-MVP Enhancements

- [ ] **Drag-and-Drop Scheduling:** Drag tasks from the sidebar onto the calendar to schedule them.
- [ ] **Task-to-Event Modal:** A modal to confirm time/details when scheduling a task.
- [ ] **Complete from Calendar:** Mark tasks as complete directly from the calendar view.
- [ ] **Enhanced Event Modal:** Replace the basic event creation prompt with a full-featured modal.
- [ ] **Event Resizing:** Allow users to resize events directly on the calendar to change their duration.

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

- [ ] **Consolidate Stores:** This is critical. Refactor the state management to have a single source of truth for tasks, merging logic from `googleStore.ts` and `useKanbanStore.ts`.
- [ ] **Improve Test Coverage:** Write integration tests that specifically cover the new drag-and-drop scheduling workflow.
- [ ] **Recurring Tasks:** Add the ability to see and manage recurring tasks on the calendar. 