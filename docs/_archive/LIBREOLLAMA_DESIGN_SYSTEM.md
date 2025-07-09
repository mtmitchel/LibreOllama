# LibreOllama Design System

**The comprehensive design system for the entire LibreOllama application, covering all pages, components, and user interfaces.**

## Overview

The LibreOllama Design System is a unified approach to visual design and user experience across all areas of the application. It provides a single source of truth for colors, typography, spacing, components, and interaction patterns used throughout the Dashboard, Notes, Projects, Chat, Settings, Canvas, and all other features.

## Core Principles

### 1. Consistency First
Every interface element across the application follows the same design language, ensuring users have a cohesive experience whether they're managing projects, taking notes, or chatting with AI agents.

### 2. Accessibility & Usability
The design system prioritizes accessibility with proper contrast ratios, keyboard navigation, and screen reader support across all components and pages.

### 3. Scalability
Components and patterns are designed to work across different screen sizes and contexts, from the main dashboard to modal dialogs to the specialized canvas interface.

### 4. Maintainability
CSS variables serve as the single source of truth for all design tokens, making it easy to maintain consistency and implement features like theme switching.

## Foundation Layer

### Design Tokens

All design tokens are defined as CSS variables in `src/core/design-system/globals.css` and are available throughout the entire application.

#### Color System

**Primary Colors**
- `--accent-primary`: Main brand color used for primary actions, links, and highlights
- `--accent-secondary`: Darker variant for hover states and pressed buttons
- `--accent-soft`: Subtle background color for selected/active states

**Semantic Colors**
- `--success`: Success states, confirmations, positive feedback
- `--warning`: Warnings, cautions, important notices
- `--error`: Error states, destructive actions, validation failures

**Text Colors**
- `--text-primary`: Primary text content (headings, body text)
- `--text-secondary`: Secondary text (descriptions, labels)
- `--text-tertiary`: Tertiary text (metadata, timestamps)
- `--text-muted`: Muted text (placeholders, disabled states)

**Background Colors**
- `--bg-primary`: Main application background
- `--bg-secondary`: Secondary background areas
- `--bg-tertiary`: Tertiary background (subtle sections)
- `--bg-surface`: Card and widget backgrounds
- `--bg-elevated`: Elevated surface backgrounds (modals, dropdowns)

**Border Colors**
- `--border-subtle`: Subtle borders for cards and sections
- `--border-default`: Standard borders for inputs and components

#### Typography Scale

**Font Families**
- `--font-sans`: Primary sans-serif font (Inter)
- `--font-mono`: Monospace font for code and technical content

**Font Sizes**
- `--font-size-xs`: 12px - Small text, captions
- `--font-size-sm`: 14px - Secondary text, labels
- `--font-size-base`: 16px - Body text
- `--font-size-lg`: 18px - Subheadings
- `--font-size-xl`: 20px - Section headings
- `--font-size-2xl`: 24px - Page headings
- `--font-size-3xl`: 32px - Main titles

**Font Weights**
- `--font-weight-normal`: 400 - Regular text
- `--font-weight-medium`: 500 - Emphasized text
- `--font-weight-semibold`: 600 - Headings
- `--font-weight-bold`: 700 - Strong emphasis

#### Spacing Scale

**Consistent spacing based on 4px grid**
- `--space-1`: 4px - Minimal spacing
- `--space-2`: 8px - Small spacing
- `--space-3`: 12px - Medium-small spacing
- `--space-4`: 16px - Standard spacing
- `--space-5`: 20px - Medium spacing
- `--space-6`: 24px - Large spacing
- `--space-8`: 32px - Extra large spacing

#### Border Radius

- `--radius-sm`: 4px - Small elements
- `--radius-md`: 8px - Standard elements
- `--radius-lg`: 12px - Large elements
- `--radius-xl`: 16px - Extra large elements

## Component Library

### Core Components

All components are built using the design system tokens and are available in `src/components/ui/index.tsx`.

#### Button Component

**Variants:**
- `primary`: Main call-to-action buttons (Create Project, Save, Submit)
- `secondary`: Secondary actions (Cancel, Edit, View Details)
- `ghost`: Subtle actions (Settings, More Options)
- `outline`: Alternative secondary style
- `default`: Standard button style

**Sizes:**
- `sm`: Small buttons for compact interfaces
- `default`: Standard button size
- `icon`: Icon-only buttons for toolbars

**Usage Across Application:**
- **Dashboard**: Quick action buttons, widget controls
- **Projects**: Create project, manage tasks, project actions
- **Notes**: Create note, formatting tools, save actions
- **Chat**: Send message, attach files, conversation actions
- **Settings**: Save preferences, toggle options, account actions

#### Card Component

**Variants:**
- `card`: Standard content cards
- `widget`: Dashboard widgets and specialized containers

**Padding Options:**
- `sm`: Compact cards
- `default`: Standard cards
- `lg`: Spacious cards

**Usage Across Application:**
- **Dashboard**: Status widgets, quick actions, recent activity
- **Projects**: Project cards, task lists, progress indicators
- **Notes**: Note cards, note preview, note details
- **Chat**: Message bubbles, conversation cards
- **Settings**: Setting groups, preference cards

#### Input Component

**Features:**
- Error state handling
- Icon support
- Consistent styling with design tokens
- Focus states and accessibility

**Usage Across Application:**
- **Projects**: Project names, task descriptions, search
- **Notes**: Note titles, content, tags
- **Chat**: Message input, search conversations
- **Settings**: Configuration values, API keys, preferences

#### Badge Component

**Variants:**
- `default`: Standard badges
- `success`: Success indicators
- `warning`: Warning indicators
- `error`: Error indicators
- `accent`: Highlighted badges
- `secondary`: Subtle badges
- `outline`: Outlined badges

**Usage Across Application:**
- **Dashboard**: Status indicators, notifications
- **Projects**: Task status, priority levels, progress
- **Notes**: Tags, categories, status
- **Chat**: Message status, agent status
- **Settings**: Feature flags, connection status

### Specialized Components

#### Navigation Components

**Sidebar (`src/components/navigation/Sidebar.tsx`)**
- Consistent navigation across all pages
- Active state indication
- Responsive behavior
- Badge support for notifications

**TopBar (`src/components/layout/TopBar.tsx`)**
- Application header with consistent styling
- Context-aware content
- User actions and settings access

#### Layout Components

**PageLayout (`src/components/layout/PageLayout.tsx`)**
- Consistent page structure
- Responsive grid system
- Proper spacing and alignment

**UnifiedHeader (`src/components/layout/UnifiedHeader.tsx`)**
- Page-specific headers
- Breadcrumb support
- Action buttons

## Application-Wide Patterns

### Dashboard

The dashboard serves as the central hub and showcases the design system's flexibility:

**Widget System:**
- Consistent card-based layout
- Standardized spacing and typography
- Unified color scheme for status indicators
- Responsive grid system

**Quick Actions:**
- Primary button for main actions
- Secondary buttons for supporting actions
- Consistent icon usage with Lucide React

### Projects Section

**Project Management Interface:**
- Card-based project display
- Progress indicators using design system colors
- Consistent button patterns for project actions
- Badge system for project status and priority

**Task Management:**
- Checkbox components with consistent styling
- Progress bars using accent colors
- Status badges with semantic colors

### Notes Section

**Note Organization:**
- Card-based note display
- Consistent typography hierarchy
- Tag system using badge components
- Search interface with standard input styling

**Note Editor:**
- Typography scale for content hierarchy
- Consistent spacing and line heights
- Toolbar with standard button components

### Chat Interface

**Conversation Management:**
- Message bubbles with consistent styling
- Avatar and timestamp formatting
- Input area with standard components
- Status indicators using badge system

**Agent Integration:**
- Status indicators using semantic colors
- Consistent button patterns for agent actions
- Typography for agent responses

### Settings Pages

**Configuration Interface:**
- Form components with consistent styling
- Tab navigation with standard patterns
- Toggle switches and checkboxes
- Save/cancel button patterns

**Preference Management:**
- Card-based setting groups
- Consistent spacing and typography
- Status indicators for connections and features

## Theme System

### Light/Dark Theme Support

The design system supports both light and dark themes through CSS variables:

**Theme Implementation:**
- CSS variables automatically adapt to theme context
- Components inherit theme colors without modification
- Consistent contrast ratios across themes

**Theme Switching:**
- Global theme state management
- Automatic persistence of user preference
- Smooth transitions between themes

### Canvas-Specific Considerations

While the canvas has specialized requirements for Konva integration, it still follows the overall design system:

**Canvas Theme Integration:**
- Canvas-specific theme file (`src/features/canvas/utils/canvasTheme.ts`)
- Color values correspond to main design system tokens
- Documented mapping between CSS variables and canvas colors

## Interactive Component Library

### Ladle Integration

The design system includes a living component library built with Ladle:

**Access:** `npm run ladle` (runs on port 61000)

**Features:**
- Interactive component documentation
- Theme switching capabilities
- Responsive viewport testing
- Real-world usage examples

**Stories Include:**
- Design token visualization
- Component variants and states
- Usage patterns and examples
- Accessibility demonstrations

## Development Guidelines

### Using the Design System

**CSS Variables:**
Always use CSS variables instead of hardcoded values:
```css
/* Good */
color: var(--text-primary);
background: var(--bg-surface);
padding: var(--space-4);

/* Bad */
color: #1a1a1a;
background: #ffffff;
padding: 16px;
```

**Component Usage:**
Import and use components from the centralized UI library:
```typescript
import { Button, Card, Badge } from '@/components/ui';
```

**Consistent Patterns:**
- Use the same button variants across similar actions
- Apply consistent spacing using the spacing scale
- Follow the typography hierarchy for content structure

### Adding New Components

1. **Design First:** Ensure the component fits the design system
2. **Build with Tokens:** Use CSS variables for all styling
3. **Create Stories:** Add Ladle stories for documentation
4. **Test Across Contexts:** Verify the component works in different areas of the app

### Maintaining Consistency

**Regular Audits:**
- Review new components against design system guidelines
- Ensure consistent usage patterns across pages
- Validate accessibility compliance

**Documentation Updates:**
- Keep component stories up to date
- Document new patterns and usage guidelines
- Update design tokens as needed

## Future Roadmap

### Phase 3: Advanced Patterns
- Complex component compositions
- Animation and transition guidelines
- Advanced layout patterns

### Phase 4: Design Token Automation
- Automated design token generation
- Figma integration for design handoff
- Visual regression testing

### Phase 5: Accessibility Enhancement
- Comprehensive accessibility guidelines
- Automated accessibility testing
- Screen reader optimization

## File Structure

```
src/
├── core/design-system/
│   ├── globals.css                 # All design tokens
│   └── DesignTokens.stories.tsx    # Token documentation
├── components/
│   ├── ui/
│   │   ├── index.tsx              # Main component library
│   │   ├── Button.stories.tsx     # Button documentation
│   │   └── Card.stories.tsx       # Card documentation
│   ├── layout/                    # Layout components
│   └── navigation/                # Navigation components
├── features/
│   ├── dashboard/                 # Dashboard-specific components
│   ├── projects/                  # Project-specific components
│   ├── notes/                     # Notes-specific components
│   ├── chat/                      # Chat-specific components
│   └── canvas/                    # Canvas-specific components
└── app/pages/                     # Main application pages
```

## Getting Started

1. **Explore the Component Library:**
   ```bash
   npm run ladle
   ```

2. **Review Design Tokens:**
   - Check `src/core/design-system/globals.css`
   - View token documentation in the component library

3. **Use Components:**
   - Import from `@/components/ui`
   - Follow established patterns
   - Create stories for new components

4. **Maintain Consistency:**
   - Use CSS variables for all styling
   - Follow component usage patterns
   - Test across different pages and contexts

The LibreOllama Design System ensures a cohesive, accessible, and maintainable user experience across all areas of the application, from the dashboard and project management to note-taking and AI chat interactions. 