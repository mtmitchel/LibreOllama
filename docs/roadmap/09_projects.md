**A REMINDER: IF A FEATURE IS ALREADY PRESENT BUT NOT LISTED IN THE MVP, DO NOT DELETE IT.**

# Projects Roadmap

This document provides a comprehensive overview of the Projects feature, including its current implementation details and future development plans.

## Current Implementation

The Projects page has a comprehensive frontend implementation with multiple components and full UI functionality.

### Frontend Architecture

- **UI Components:** The UI is located in `src/features/projects/components/` and includes:
    - `Projects.tsx`: The main page component with full project management interface.
    - `NewProjectModal.tsx`: A functional modal for creating new projects.
    - `ProjectDetails.tsx`: Detailed project view with metrics and management.
    - `ProjectsSidebar.tsx`: Project navigation and selection sidebar.
    - `ProjectSidebar.tsx`: Additional project navigation component.
    - `NoProjectSelected.tsx`: Placeholder screen for when no project is selected.
- **State Management:** Local state management within components with mock data for development.
- **Features:** Comprehensive project management UI including:
    - Project creation with multi-step form
    - Project selection and navigation
    - Project details with progress tracking
    - Goal management and tracking
    - Asset management interface
    - Search and filtering capabilities

### Backend Architecture

- **No Backend Implementation:** There are currently **no backend services, Tauri commands, or database tables** for managing projects. The frontend operates with mock data.

### Implemented Features

- Complete project management UI with sidebar navigation
- Functional project creation modal with form validation
- Project details view with progress tracking and metrics
- Goal management system with completion tracking
- Asset management interface for different project types
- Search and filtering capabilities
- Responsive design with professional UI components

## Future Work & Todos

This roadmap is aligned with the **Single-User MVP Strategy**.

### MVP Must-Haves

- [x] **Project Management UI:** Complete frontend interface for project management. *(Existing)*
- [ ] **Backend Implementation:** Create backend services for project persistence.
- [ ] **Project CRUD:** Backend and frontend integration for creating, reading, updating, and deleting projects.
- [ ] **Associate Tasks:** Link tasks from the Tasks module to projects.
- [ ] **Data Persistence:** Replace mock data with real database persistence.

### Post-MVP Enhancements

- [ ] **Timeline/Gantt View:** A timeline view to visualize project schedules.
- [ ] **Search & Filtering:** Enhanced search and filtering capabilities.
- [ ] **Project Templates:** Pre-built project templates for common use cases.

### Future Vision & "Wow" Delighters

- [ ] **Kanban per Project:** A dedicated Kanban board view for tasks within a single project.
- [ ] **Project Dashboard:** Enhanced dashboard view with real-time project metrics.
- [ ] **Project Templates:** Reusable templates for common project types.
- [ ] **Collaboration Features:** Multi-user project collaboration capabilities.

### UX/UI Improvements

- [ ] **Enhanced Project Creation:** Add more configuration options and project templates.
- [ ] **Advanced Metrics:** More detailed project analytics and reporting.
- [ ] **Mobile Responsiveness:** Optimize the interface for mobile devices.

### Technical Debt & Refactoring

- [ ] **Backend Implementation:**
    - [ ] Design the database schema for projects, goals, and assets.
    - [ ] Create backend services in Rust for all project CRUD operations.
    - [ ] Expose these services to the frontend via new Tauri commands.
- [ ] **Frontend Integration:**
    - [ ] Create a dedicated Zustand store (`projectStore.ts`) to manage project state.
    - [ ] Replace mock data with real API calls to backend services.
    - [ ] Implement proper error handling and loading states.
- [ ] **Test Coverage:** Add comprehensive tests for all project-related components and services.
- [ ] **Documentation:** Document the project data model and API architecture. 