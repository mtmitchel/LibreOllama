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

- **No Backend Implementation:** There are currently **no backend services, Tauri commands, or database tables** for managing projects.
- **No Data Persistence:** No actual project data storage or retrieval capabilities.
- **No API Integration:** No connection to any backend services or external APIs.

### Current Implementation Status

- **UI Shell Complete:** Professional UI components and layouts are implemented
- **No Functional Data:** All data arrays are empty, rendering the interface non-functional
- **No Backend Services:** No actual project management capabilities exist
- **Display Only:** Components render empty states and placeholder content

### Implemented UI Components

- Complete project management interface layout with sidebar navigation
- Non-functional project creation modal with form validation UI
- Project details view structure with progress tracking and metrics layout
- Goal management system UI with completion tracking display
- Asset management interface structure for different project types
- Search and filtering UI components (no underlying functionality)
- Responsive design with professional UI components

### Critical Implementation Gaps

- **No Data Management:** All mock data arrays are empty, making the UI non-functional
- **No Backend Integration:** No services for project persistence, CRUD operations, or data management
- **No Task Association:** No ability to link tasks from the Tasks module to projects
- **No Real Functionality:** UI components exist but perform no actual operations

## Future Work & Todos

This roadmap is aligned with the **Single-User MVP Strategy**.

### MVP Must-Haves

- [x] **Project Management UI:** Complete frontend interface for project management. *(Existing)*
- [ ] **Backend Implementation:** Create backend services for project persistence.
- [ ] **Project CRUD:** Backend and frontend integration for creating, reading, updating, and deleting projects.
- [ ] **Associate Tasks:** Link tasks from the Tasks module to projects.
- [ ] **Data Persistence:** Replace mock data with real database persistence.
- [ ] **Implement Asset Management:** Wire up the UI for adding and managing project assets in the `ProjectDetails.tsx` view.

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