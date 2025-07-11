**A REMINDER: IF A FEATURE IS ALREADY PRESENT BUT NOT LISTED IN THE MVP, DO NOT DELETE IT.**

# Calendar & Tasks Integration Roadmap

This document provides a comprehensive overview of the Calendar & Tasks Integration feature, detailing its current implementation and future plans.

## Design Assets

- **Mockup:** [calendar mockup.png](../../design/mockups/calendar%20mockup.png)
- **Spec:** [calendar.html](../../design/specs/calendar.html)

## Current Implementation

The Calendar page provides calendar functionality with basic task management integration.

### Frontend Architecture

- **Calendar View:** The `Calendar.tsx` page uses the `FullCalendar` library to display events with Day, Week, and Month view switching.
- **Event Management:** Basic CRUD operations for calendar events (create, read, update, delete).
- **Task Integration:** A sidebar that displays tasks from the `useKanbanStore` with column filtering and task creation capabilities.
- **State Management:** Uses `useGoogleCalendarStore` for calendar events and `useKanbanStore` for tasks.

### Backend Architecture

- **Mock Calendar Service:** Currently uses mock data for calendar events with basic CRUD operations.
- **Task Persistence:** Tasks are persisted via the `useKanbanStore` to localStorage.

### Implemented Features

- Day, Week, and Month calendar views with navigation
- Create, edit, and delete calendar events
- Task sidebar with column selector dropdown
- "New Task" button with full task creation modal
- Basic event management interface

## Future Work & Todos

This roadmap is aligned with the **Single-User MVP Strategy**, focusing on core individual-focused capabilities first.

### MVP Must-Haves

- [x] **Calendar View:** Standard Day/Week/Month views. *(Existing)*
- [x] **Create/Edit Events:** Basic functionality to add and modify calendar events. *(Existing)*
- [x] **Task Sidebar:** A view of the task list next to the calendar. *(Existing)*

### Post-MVP Enhancements

- [ ] **Drag-and-Drop Scheduling:** Implement drag tasks from the sidebar onto the calendar to schedule them.
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

- [ ] **Google Calendar Integration:** Connect to real Google Calendar API instead of mock data.
- [ ] **Drag-and-Drop Implementation:** Implement the core drag-and-drop scheduling workflow.
- [ ] **Improve Test Coverage:** Write integration tests that cover the scheduling workflow.
- [ ] **Recurring Tasks:** Add the ability to see and manage recurring tasks on the calendar. 