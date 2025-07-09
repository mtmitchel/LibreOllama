**A REMINDER: IF A FEATURE IS ALREADY PRESENT BUT NOT LISTED IN THE MVP, DO NOT REMOVE IT.**

# Projects Roadmap

This document provides a comprehensive overview of the Projects feature, including its current (placeholder) implementation details and future development plans.

## Current Implementation (Placeholder)

The Projects page is currently a placeholder with a minimal UI and no backend functionality.

### Frontend Architecture

- **UI Components:** The UI is located in `src/features/projects/components/` and is very basic:
    - `Projects.tsx`: The main page component.
    - `NewProjectModal.tsx`: A modal for creating a new project (UI only).
    - `NoProjectSelected.tsx`: A placeholder screen for when no project is selected.
- **State Management:** There is no dedicated store for projects. State is likely managed locally within the components.

### Backend Architecture

- **No Backend Implementation:** There are currently **no backend services, Tauri commands, or database tables** for managing projects.

### Implemented Features

- A basic UI shell for the Projects page.
- A non-functional "New Project" modal.

## Future Work & Todos

This roadmap is aligned with the **Single-User MVP Strategy**.

### MVP Must-Haves

- [ ] **Project CRUD:** Backend and frontend for creating, reading, updating, and deleting projects.
- [ ] **Associate Tasks:** Link tasks from the Tasks module to a project.
- [ ] **Simple List View:** A basic list view to see all projects.

### Post-MVP Enhancements

- [ ] **Timeline/Gantt View:** A timeline view to visualize project schedules.
- [ ] **Search & Filtering:** A system for searching and filtering projects.

### Future Vision & "Wow" Delighters

- [ ] **Kanban per Project:** A dedicated Kanban board view for tasks within a single project.
- [ ] **Project Dashboard:** A dashboard view summarizing the status of a single project.
- [ ] **Project Templates:** Reusable templates for common project types.

### UX/UI Improvements

- [ ] **Enhance `NewProjectModal`:** Add more configuration options to the modal, such as setting deadlines or assigning team members.
- [ ] **Improve `NoProjectSelected`:** Make the "No Project Selected" screen more informative and visually appealing.
- [ ] **Project Dashboard Design:** Design the main project view to be an intuitive and useful dashboard.

### Technical Debt & Refactoring

- [ ] **Define Scope:** Finalize the full scope of project management features (e.g., fields, actions).
- [ ] **Backend Implementation:**
    - [ ] Design the database schema for projects.
    - [ ] Create backend services in Rust for all project CRUD operations.
    - [ ] Expose these services to the frontend via new Tauri commands.
- [ ] **Frontend Integration:**
    - [ ] Create a dedicated Zustand store (`projectStore.ts`) to manage project state.
    - [ ] Connect the frontend components to the backend.
- [ ] **Test Coverage:** Add comprehensive tests for all new project-related components and services.
- [ ] **Scalable Store:** Design the `projectStore` to be scalable and performant.
- [ ] **Documentation:** Document the new project data model and the API for interacting with it. 