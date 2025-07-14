**A REMINDER: IF A FEATURE IS ALREADY PRESENT BUT NOT LISTED IN THE MVP, DO NOT REMOVE IT.**

**CRITICAL UI CONVENTION: This project uses sentence case (not title case) for ALL user-facing text including page titles, headings, section titles, list titles, button copy, navigation copy, form labels, menu items, and any other UI text. Example: "Create new project" NOT "Create New Project".**

# Dashboard Roadmap

This document provides a comprehensive overview of the Dashboard feature, including its current implementation details and future development plans.

## Current Implementation

The Dashboard serves as a home page, providing an at-a-glance view of various parts of the application through a system of widgets. While the widget framework exists, it has limited data integration and testing coverage.

### Frontend Architecture

- **Widget System:** The core of the dashboard is a widget system. The components are located in `src/features/dashboard/components/`.
- **Existing Widgets:**
    - `WelcomeWidget.tsx`: A simple welcome message.
    - `AgentStatusWidget.tsx`: Displays the status of different agents (limited integration).
    - `ProjectProgressWidget.tsx`: Shows the progress of various projects (uses mock data).
    - `QuickActionsWidget.tsx`: Quick action buttons for common tasks.
    - `TodaysFocusWidget.tsx`: Focus items and priorities for today (mock data).
    - `UpcomingEventsWidget.tsx`: Upcoming calendar events (limited integration).
    - `PendingTasksWidget.tsx`: Pending tasks from the Kanban system (basic integration).
- **Layout:** The dashboard uses a flexible grid layout to arrange the widgets.
- **State Management:** Currently, state is managed within individual widgets, with varying levels of real data integration.

### Widget Integration Status

**Implemented Widgets (Not Listed in Original Roadmap):**
- `QuickActionsWidget.tsx` - Quick action buttons for common tasks (functional)
- `TodaysFocusWidget.tsx` - Focus items and priorities for today (mock data)
- `UpcomingEventsWidget.tsx` - Upcoming calendar events (limited calendar integration)
- `PendingTasksWidget.tsx` - Pending tasks from Kanban (basic store integration)
- `WidgetSkeleton.tsx` - Loading skeleton states for widgets
- `WidgetErrorBoundary.tsx` - Error boundaries for widget error handling

**UI Infrastructure Components:**
- `FlexibleGrid.tsx` - Responsive grid system for widget layout
- `EmptyState.tsx` - Empty state component for widgets with no data
- `AddNewCard.tsx` - Add new item cards with consistent styling

### Backend Architecture

- **No Direct Backend:** The dashboard itself doesn't have dedicated backend services. Each widget is responsible for fetching its own data from other backend services with varying success.
- **Widget Data Sources:** Widgets attempt to integrate with various stores and services but with limited real data connectivity.

### Current Limitations

- **Testing Coverage:** Limited test coverage with testing audit score of 35/100, indicating significant reliability issues.
- **Data Integration Gaps:** Many widgets use mock data or have limited integration with actual data sources.
- **Widget Reliability:** Inconsistent error handling and data loading across different widgets.
- **Performance Issues:** Potential performance problems with widget data fetching and updates.

### Implemented Features

- A functional widget system framework.
- Six operational widgets providing basic information.
- A clean, responsive layout with grid system.
- Loading states and error boundaries for widgets.
- Basic integration with some data stores (Kanban, limited Calendar/Tasks).

## Future Work & Todos

This roadmap is aligned with the **Single-User MVP Strategy**, focusing on core individual-focused capabilities first.

### MVP Must-Haves

- [x] **Widget Framework:** A system for creating and displaying widgets. *(Existing)*
- [x] **Core Widgets:** At least three widgets for welcome, calendar events, and pending tasks. *(Partially existing)*
    - [x] Welcome / Status Widget *(Existing)*
    - [ ] Upcoming Calendar Events Widget
    - [ ] Pending Tasks Widget

### Post-MVP Enhancements

- [ ] **Configurable Widgets:** Allow users to reorder widgets on the dashboard.
- [ ] **Additional Widgets:** Add new widgets for recent emails, notes, etc.
- [ ] **Customizable Layout:** Implement a drag-and-drop interface to resize and rearrange widgets.
- [ ] **Multiple Dashboards:** Allow users to create and save multiple distinct dashboards.

### Future Vision & "Wow" Delighters

- [ ] **Smart Widget Recommendations:** Intelligently suggest which widgets to show based on context.
- [ ] **One-Click Jump to Context:** Allow clicking a widget item to navigate directly to it (e.g., clicking a task opens the task modal).
- [ ] **Personal Theme Presets:** Pre-configured dashboard themes and layouts.

### UX/UI Improvements

- [ ] **Information Density:** Improve the visual design and information density of existing widgets.
- [ ] **Loading Animations:** Add loading animations or skeletons that appear while widget data is being fetched.
- [ ] **Responsiveness:** Perform a full review of the dashboard's responsiveness to ensure it is usable on all screen sizes.

### Technical Debt & Refactoring

- [ ] **Modular Widget System:** Refactor the widget system to be more modular and extensible, making it easier to add new widgets.
- [ ] **Performance:** Improve widget data fetching, potentially with a dedicated service to batch requests.
- [ ] **Test Coverage:** Add tests for the dashboard components and their interactions. 