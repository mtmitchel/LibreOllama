**A REMINDER: IF A FEATURE IS ALREADY PRESENT BUT NOT LISTED IN THE MVP, DO NOT REMOVE IT.**

# Dashboard Roadmap

This document provides a comprehensive overview of the Dashboard feature, including its current implementation details and future development plans.

## Current Implementation

The Dashboard serves as a home page, providing an at-a-glance view of various parts of the application through a system of widgets.

### Frontend Architecture

- **Widget System:** The core of the dashboard is a widget system. The components are located in `src/features/dashboard/components/`.
- **Existing Widgets:**
    - `WelcomeWidget.tsx`: A simple welcome message.
    - `AgentStatusWidget.tsx`: Displays the status of different agents.
    - `ProjectProgressWidget.tsx`: Shows the progress of various projects.
- **Layout:** The dashboard uses a simple grid layout to arrange the widgets.
- **State Management:** Currently, state is likely managed within individual widgets, fetching data as needed. There does not appear to be a dedicated store for the dashboard itself.

### Backend Architecture

- **No Direct Backend:** The dashboard itself doesn't have dedicated backend services. Instead, each widget is responsible for fetching its own data from other backend services (e.g., the `AgentStatusWidget` would fetch data from the agent services).

### Implemented Features

- A functional widget system.
- Three initial widgets providing basic information.
- A clean, responsive layout.

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