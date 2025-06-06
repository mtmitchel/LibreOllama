# Archived Components & Files

This directory contains components, hooks, utilities, and other files that were created during development but are no longer actively used in the current consolidated application structure.

## Archived on: June 5, 2025

### Reason for Archiving
The main App.tsx component now contains all UI elements inline for better consolidation and maintainability. User requested to "conflate as much as possible" and avoid multiple separate files. These files were redundant and unused.

### Archived Items:

#### Components:
- **widgets/**: Individual widget components (ProjectProgressWidget, AgentStatusWidget, TodaysFocusWidget, QuickActionsWidget)
- **layout/**: Layout components (AppLayout, Sidebar, MainContent, TopBar, ContentArea)
- **navigation/**: Navigation components (NavSection, NavItem, Logo, Breadcrumb)
- **ui/**: UI components (Button, Input, Card, Badge)
- **CommandPalette.tsx**: Command palette component with keyboard shortcuts
- **DashboardWidget.tsx**: Generic dashboard widget component
- **ThemeToggle.tsx**: Theme toggle component
- **StatusIndicator.tsx**: Status indicator component

#### Hooks:
- **useCommandPalette.ts**: Command palette state management

#### Pages:
- **pages/**: Separate page components (Dashboard.tsx, Chat.tsx, Notes.tsx, Tasks.tsx)

#### Utilities:
- **lib/**: Utility functions and types (utils.ts, types.ts, design-tokens.ts)

#### Styles:
- **index.css**: Old Tailwind-based CSS file (replaced by design-system.css)

### Active Files (Remaining in src/):
- **App.tsx**: Main consolidated component with all UI inline
- **main.tsx**: React entry point
- **components/ThemeProvider.tsx**: Theme context provider (still in use)
- **hooks/useTheme.ts**: Theme management hook (still in use)
- **styles/design-system.css**: Complete CSS custom properties system
- **styles/App.css**: Additional app-specific styles

### Project State:
✅ **Fully Functional**: All dashboard widgets, navigation, layout working inline in App.tsx
✅ **Design System**: Complete CSS custom properties implementation
✅ **Theme System**: Working dark/light mode toggle
✅ **No Dependencies**: Removed Tailwind dependency, pure CSS variables
✅ **Consolidated**: Single App.tsx file contains entire UI

### Recovery
If any of these components are needed in the future, they can be moved back from this archive directory. The project structure is now much cleaner and follows the user's request for consolidation.
