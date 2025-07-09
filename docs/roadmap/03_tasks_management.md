**A REMINDER: IF A FEATURE IS ALREADY PRESENT BUT NOT LISTED IN THE MVP, DO NOT REMOVE IT.**

# Tasks Management Roadmap

This document provides a comprehensive overview of the Tasks Management feature, detailing its current implementation and future plans. It is currently considered **Production-Ready**.

## Design Assets

- **Mockup:** [tasks mockup.png](../../design/mockups/tasks%20mockup.png)
- **Spec:** [Tasks.html](../../design/specs/Tasks.html)

## Current Implementation

The Tasks page is a robust, client-side Kanban board for task management, built with a focus on performance and user experience.

### Frontend Architecture

- **State Management:** The `useKanbanStore.ts` is a dedicated Zustand store that manages all task and column data. It handles all CRUD operations and state logic.
- **Persistence:** All tasks and columns are persisted in the browser's `localStorage`, making any changes available across page refreshes. The store handles serialization and deserialization automatically.
- **Drag and Drop:** The `@dnd-kit` library is used to provide a professional and accessible drag-and-drop experience for moving tasks between columns. It includes features like a `DragOverlay` for visual feedback.
- **Component Structure:**
    - `Tasks.tsx`: The main page component that orchestrates the different views and the modal.
    - `TaskColumn.tsx` & `TaskCard.tsx`: Memoized components for displaying columns and individual tasks, optimized to prevent unnecessary re-renders.
    - `SimpleTaskModal.tsx`: A comprehensive modal for creating and editing tasks with full metadata support.
- **Metadata:** Tasks support rich metadata, including priority, labels, subtasks with completion status, and complex recurring task rules.

### Backend Architecture

- **No Backend:** This feature is currently **100% client-side**. All data is stored and managed in the browser's `localStorage`. There are no Tauri commands or backend services associated with it.

### Implemented Features

- Full task CRUD operations (Create, Read, Update, Delete).
- Kanban and List view modes.
- LocalStorage persistence.
- Professional drag-and-drop with visual feedback.
- Comprehensive task metadata (priority, labels, subtasks, recurring tasks).
- Timezone-correct date handling.
- Performance optimized with `React.memo`, `useCallback`, and efficient re-renders.

## Future Work & Todos

This roadmap is aligned with the **Single-User MVP Strategy**, focusing on core individual-focused capabilities first.

### High Priority / Known Issues

- [ ] **Accessibility:** Implement full accessibility for the Tasks page, including keyboard navigation, ARIA labels, and screen reader support.

### MVP Must-Haves

- [x] **Kanban Columns CRUD:** Create, edit, and delete columns. *(Existing)*
- [x] **Drag-and-Drop:** Move tasks between columns. *(Existing)*
- [x] **Local Persistence:** Save board state in `localStorage`. *(Existing)*
- [x] **List View:** A toggle to switch between Kanban and a simple list view. *(Existing)*

### Post-MVP Enhancements

- [x] **Subtasks & Due Dates:** Add subtasks and due dates to cards. *(Existing, but can be improved)*
- [x] **Recurring Tasks:** Set tasks to repeat on a schedule. *(Existing)*
- [ ] **Filters & Sorting:** Advanced filtering and sorting options.
- [ ] **Search:** Add a search functionality to quickly find tasks.
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
- [ ] **Documentation:** Create documentation for the Kanban architecture and best practices. 