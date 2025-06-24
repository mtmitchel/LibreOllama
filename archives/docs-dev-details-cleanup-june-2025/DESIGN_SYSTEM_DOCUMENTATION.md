# LibreOllama Design System Documentation

## Overview

This document provides a comprehensive overview of the LibreOllama design system, combining all module-specific design guidelines and specifications into a single reference.

## Core Design Variables

```css
:root {
    /* Dark Theme Variables */
    --bg-primary: #0f1419;
    --bg-secondary: #1a2332;
    --bg-tertiary: #242b3d;
    --bg-surface: #2a3441;
    --bg-elevated: #323a47;
    
    --text-primary: #ffffff;
    --text-secondary: #94a3b8;
    --text-tertiary: #64748b;
    --text-muted: #475569;
    
    --accent-primary: #3b82f6;
    --accent-secondary: #1d4ed8;
    --accent-soft: rgba(59, 130, 246, 0.1);
    
    --success: #10b981;
    --warning: #f59e0b;
    --error: #ef4444;
    
    --border-subtle: rgba(148, 163, 184, 0.1);
    --border-default: rgba(148, 163, 184, 0.2);
    
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    
    --space-1: 4px;
    --space-2: 8px;
    --space-3: 12px;
    --space-4: 16px;
    --space-5: 20px;
    --space-6: 24px;
    --space-8: 32px;
    
    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 12px;
}

/* Light Theme Variables */
html.light {
    --bg-primary: #ffffff;
    --bg-secondary: #f8fafc;
    --bg-tertiary: #f1f5f9;
    --bg-surface: #ffffff;
    --bg-elevated: #ffffff;
    
    --text-primary: #0f172a;
    --text-secondary: #475569;
    --text-tertiary: #64748b;
    --text-muted: #94a3b8;
    
    --border-subtle: rgba(0, 0, 0, 0.05);
    --border-default: rgba(0, 0, 0, 0.1);
}
```

## Common Components

### Layout Structure

```css
.app-layout {
    display: flex;
    height: 100vh;
}

.sidebar {
    width: 280px;
    background: var(--bg-secondary);
    border-right: 1px solid var(--border-subtle);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
}

.main-content-wrapper {
    flex: 1;
    background: var(--bg-primary);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}
```

### Top Bar

```css
.top-bar {
    height: 72px;
    border-bottom: 1px solid var(--border-subtle);
    display: flex;
    align-items: center;
    padding: 0 var(--space-6);
    gap: var(--space-4);
    background: var(--bg-surface);
    flex-shrink: 0;
}

.breadcrumb {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: 14px;
    color: var(--text-secondary);
}

.breadcrumb-current {
    color: var(--text-primary);
    font-weight: 600;
}
```

### Buttons

```css
.btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-md);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border: none;
}

.btn-sm {
    padding: var(--space-2) var(--space-3);
    font-size: 12px;
}

.btn-primary {
    background: var(--accent-primary);
    color: white;
}

.btn-secondary {
    background: var(--bg-tertiary);
    color: var(--text-primary);
    border: 1px solid var(--border-default);
}

.action-btn {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-md);
    border: none;
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}
```

### Search Bar

```css
.search-bar {
    flex: 1;
    max-width: 480px;
    position: relative;
}

.search-input {
    width: 100%;
    padding: var(--space-3) var(--space-4) var(--space-3) var(--space-10);
    background: var(--bg-tertiary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    color: var(--text-primary);
    font-size: 14px;
    outline: none;
}

.search-icon {
    position: absolute;
    left: var(--space-3);
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    color: var(--text-muted);
    pointer-events: none;
}
```

## Module-Specific Components

### Chat Module

The chat interface uses a split-panel layout with a sidebar for conversation history and a main area for messages.

```css
.chat-layout {
    display: flex;
    height: 100%;
    width: 100%;
}

.chat-sidebar {
    width: 320px;
    border-right: 1px solid var(--border-subtle);
    display: flex;
    flex-direction: column;
}

.chat-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-4);
}

.message-bubble {
    max-width: 80%;
    margin-bottom: var(--space-4);
    padding: var(--space-4);
    border-radius: var(--radius-lg);
}

.message-bubble.user {
    background: var(--accent-soft);
    margin-left: auto;
}

.message-bubble.ai {
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
}
```

### Canvas Module

The canvas provides a whiteboard interface with a floating toolbar.

```css
.canvas-layout {
    position: relative;
    height: 100%;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
}

.canvas-toolbar-wrapper {
    padding: var(--space-4);
    display: flex;
    justify-content: center;
    flex-shrink: 0;
    position: absolute;
    top: var(--space-4);
    left: 50%;
    transform: translateX(-50%);
    z-index: 20;
}

.canvas-toolbar {
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-lg);
    padding: var(--space-3);
    display: flex;
    gap: var(--space-2);
    box-shadow: var(--shadow-md);
}

.canvas-tool {
    width: 40px;
    height: 40px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius-md);
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.canvas-area {
    width: 100%;
    flex-grow: 1;
    background: var(--bg-primary);
    position: relative;
    overflow: hidden;
    cursor: default;
}
```

### Agents Module

The agents module uses a card-based layout for displaying and managing AI agents.

```css
.agents-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--space-6);
}

.agent-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
}

.agent-card-header {
    display: flex;
    align-items: center;
    gap: var(--space-3);
}

.agent-icon-wrapper {
    width: 40px;
    height: 40px;
    background-color: var(--bg-tertiary);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
}

.agent-status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
}

.agent-status-dot.online {
    background: var(--success);
}

.agent-status-dot.offline {
    background: var(--text-muted);
}
```

### Notes Module

The notes interface uses a three-column layout with navigation, list, and editor.

```css
.notes-layout {
    display: flex;
    height: 100%;
}

.notes-sidebar {
    width: 280px;
    border-right: 1px solid var(--border-subtle);
}

.notes-list {
    width: 320px;
    border-right: 1px solid var(--border-subtle);
}

.notes-editor {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.note-card {
    padding: var(--space-4);
    border-bottom: 1px solid var(--border-subtle);
    cursor: pointer;
}

.note-card:hover {
    background: var(--bg-elevated);
}
```

### Calendar Module

The calendar uses a grid layout with a sidebar for tasks and events.

```css
.calendar-layout {
    display: flex;
    height: 100%;
}

.calendar-main {
    flex: 1;
    padding: var(--space-4);
}

.calendar-sidebar {
    width: 320px;
    border-left: 1px solid var(--border-subtle);
    padding: var(--space-4);
}

.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
    background: var(--border-subtle);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    overflow: hidden;
}

.calendar-cell {
    background: var(--bg-surface);
    padding: var(--space-2);
    min-height: 120px;
}
```

### Tasks Module

The tasks module uses a Kanban-style board layout.

```css
.tasks-layout {
    height: 100%;
    padding: var(--space-4);
    overflow-x: auto;
}

.kanban-board {
    display: flex;
    gap: var(--space-4);
    height: 100%;
    padding-bottom: var(--space-4);
}

.kanban-column {
    flex: 0 0 320px;
    background: var(--bg-secondary);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
}

.task-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: var(--space-4);
    margin-bottom: var(--space-3);
}
```

## Typography

The design system uses the Inter font family with the following scale:

```css
body {
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
}

h1 { font-size: 28px; font-weight: 700; }
h2 { font-size: 24px; font-weight: 600; }
h3 { font-size: 20px; font-weight: 600; }
h4 { font-size: 16px; font-weight: 600; }

.text-sm { font-size: 12px; }
.text-xs { font-size: 11px; }
```

## Best Practices

1. Always use CSS variables for colors, spacing, and border-radius
2. Maintain consistent padding and margin using the spacing scale
3. Use semantic class names that describe the component's purpose
4. Follow BEM naming convention for component variants
5. Keep components modular and reusable
6. Use flexbox and grid for layouts
7. Ensure proper contrast ratios for accessibility
8. Maintain consistent spacing between related elements

## Implementation Guidelines

1. Use the provided CSS variables for all styling
2. Follow the modular architecture for component development
3. Implement responsive design using the defined breakpoints
4. Maintain dark/light theme compatibility
5. Use the standard button and input styles
6. Follow accessibility guidelines
7. Test components in both themes
8. Keep styles scoped to their specific modules

This documentation serves as the single source of truth for LibreOllama's design system. Refer to this guide when developing new features or modifying existing components.
