**A REMINDER: IF A FEATURE IS ALREADY PRESENT BUT NOT LISTED IN THE MVP, DO NOT REMOVE IT.**

**CRITICAL UI CONVENTION: This project uses sentence case (not title case) for ALL user-facing text including page titles, headings, section titles, list titles, button copy, navigation copy, form labels, menu items, and any other UI text. Example: "Create new project" NOT "Create New Project".**

# Projects Roadmap

This document provides a comprehensive overview of the Projects feature, including its current implementation details and future development plans.

## Current Implementation

The Projects page has a well-structured UI framework with multiple components, but operates entirely on empty mock data with no functional backend integration.

### Frontend Architecture

- **UI Components:** The UI is located in `src/features/projects/components/` and includes:
    - `Projects.tsx`: The main page component with project management interface structure.
    - `NewProjectModal.tsx`: A modal component for creating new projects (UI only).
    - `ProjectDetails.tsx`: Detailed project view component structure with metrics display.
    - `ProjectsSidebar.tsx`: Project navigation and selection sidebar component.
    - `ProjectSidebar.tsx`: Additional project navigation component structure.
    - `NoProjectSelected.tsx`: Placeholder screen for when no project is selected.
- **Mock Data:** Uses empty mock data arrays (`mockProjects: Project[] = []`) resulting in non-functional UI that displays empty states.
- **State Management:** Local state management within components but with no real data to manage.
- **UI Features:** Complete project management interface design including:
    - Project creation modal structure (no actual creation)
    - Project selection and navigation framework
    - Project details view layout with progress tracking display
    - Goal management UI structure
    - Asset management interface layout
    - Search and filtering UI components (no data to filter)

### Backend Architecture

- **Complete Backend Implementation:** Full backend services implemented in `src-tauri/src/commands/projects.rs`
- **Tauri Commands:** Complete CRUD operations for projects, goals, and assets:
  - `create_project`, `get_projects`, `get_project`, `update_project`, `delete_project`
  - `create_project_goal`, `get_project_goals`, `update_project_goal`, `delete_project_goal`
  - `create_project_asset`, `get_project_assets`, `delete_project_asset`
- **Database Integration:** Full database schema and operations in `src-tauri/src/database/operations/project_operations.rs`
- **Data Persistence:** SQLite database storage for all project data

### Current Implementation Status

- ✅ **Backend Complete:** Full backend implementation with database persistence
- ✅ **UI Shell Complete:** Professional UI components and layouts are implemented
- ❌ **Frontend-Backend Disconnection:** Frontend uses empty mock data instead of calling backend services
- ❌ **No Integration:** Frontend components don't invoke the existing Tauri commands

### Implemented UI Components

- Complete project management interface layout with sidebar navigation
- Non-functional project creation modal with form validation UI
- Project details view structure with progress tracking and metrics layout
- Goal management system UI with completion tracking display
- Asset management interface structure for different project types
- Search and filtering UI components (no underlying functionality)
- Responsive design with professional UI components

### Critical Implementation Gaps

- **Frontend-Backend Integration:** Frontend needs to be connected to existing backend services
- **Store Implementation:** Need to create `projectStore.ts` to manage state and API calls
- **Replace Mock Data:** Remove empty mock arrays and use real API data
- **Task Association:** Implement linking between Tasks module and Projects
- **Error Handling:** Add proper error handling and loading states

## Future Work & Todos

This roadmap is aligned with the **Single-User MVP Strategy**.

### MVP Must-Haves

- [x] **Project Management UI:** Complete frontend interface for project management. *(Completed)*
- [x] **Backend Implementation:** Backend services for project persistence. *(Completed)*
- [x] **Data Persistence:** Database schema and operations. *(Completed)*
- [ ] **Frontend Integration:** Connect frontend to existing backend services.
- [ ] **Project CRUD:** Wire up frontend to backend CRUD operations.
- [ ] **Associate Tasks:** Link tasks from the Tasks module to projects.
- [ ] **Implement Asset Management:** Wire up the UI for adding and managing project assets.

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

### Phase 3 Hardening Tests

- **Canvas ⇄ Projects link validation:** attach a Canvas export to a Project, reload, and assert the association persists.
- **Cold-boot persistence:** create a project, set progress metrics, reload the app, verify re-hydration.
- **Race-condition tests:** concurrently update project progress while adding tasks and ensure state consistency.
- **Accessibility audit:** keyboard navigation of project sidebar, new-project modal, and metrics tabs must have zero critical axe violations. 