# Complete Asana Design System Specification
**Based on Tasks and Calendar Pages Implementation**
**Version:** 1.0
**Last Updated:** 2025-02-06

## Executive Summary

This document defines the complete design system based on the Asana-style implementation from the Tasks and Calendar pages. This will replace the old Linear/Obsidian-inspired design system with a unified, consistent Asana-based approach.

## 1. Design System Architecture

### Core Principles
1. **Clean & Minimal**: Light backgrounds, subtle borders, plenty of whitespace
2. **Purple-First Brand**: #796EFF as primary brand color
3. **Coral Accent**: #FC636B as secondary accent
4. **Functional Over Decorative**: Clear hierarchy, obvious interactions
5. **Consistent Spacing**: 4px base unit system

### System Components
```
Design System
├── Tokens (Variables)
│   ├── Colors
│   ├── Typography
│   ├── Spacing
│   ├── Shadows
│   └── Transitions
├── Layout System
│   ├── Page Structure
│   ├── Grid System
│   └── Responsive Breakpoints
├── Components
│   ├── Atomic (Buttons, Inputs, etc.)
│   ├── Molecular (Cards, Forms, etc.)
│   └── Organisms (Headers, Sidebars, etc.)
└── Patterns
    ├── Navigation
    ├── Data Display
    └── User Feedback
```

## 2. Design Tokens

### Color System

#### Brand Colors
```css
--asana-brand-purple: #796EFF;    /* Primary brand */
--asana-brand-coral: #FC636B;     /* Secondary accent */
--asana-brand-mint: #2EAADC;      /* Tertiary */
--asana-brand-purple-hover: #6257E0; /* Purple hover state */
```

#### Background Colors
```css
--asana-bg-canvas: #FAFBFC;       /* Main page background */
--asana-bg-primary: #FFFFFF;      /* Card/content background */
--asana-bg-secondary: #F6F7F8;    /* Secondary surfaces */
--asana-bg-sidebar: #F9FAFB;      /* Sidebar background */
--asana-bg-hover: #F0F1F3;        /* Hover state */
--asana-bg-input: #F6F7F8;        /* Input fields */
--asana-bg-input-focus: #FFFFFF;  /* Focused inputs */
```

#### Text Colors
```css
--asana-text-primary: #151B26;    /* Main text */
--asana-text-secondary: #6B6F76;  /* Secondary text */
--asana-text-tertiary: #9CA1A8;   /* Tertiary text */
--asana-text-muted: #B4B8BD;      /* Muted/disabled */
--asana-text-placeholder: #9CA3AF; /* Placeholders */
```

#### Border Colors
```css
--asana-border-default: #E8E8E9;  /* Default borders */
--asana-border-subtle: #F0F0F1;   /* Subtle borders */
--asana-border-hover: #D1D5DB;    /* Hover borders */
--asana-border-focus: #796EFF;    /* Focus borders */
```

#### Status Colors
```css
--asana-status-success: #14A454;  /* Success/complete */
--asana-status-warning: #FFA93C;  /* Warning */
--asana-status-blocked: #E8384F;  /* Error/blocked */
--asana-status-info: #6366F1;     /* Info */
```

### Typography System

```css
/* Font Family */
--asana-font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', sans-serif;

/* Font Sizes */
--asana-font-size-xs: 12px;
--asana-font-size-sm: 13px;
--asana-font-size-base: 14px;
--asana-font-size-lg: 16px;
--asana-font-size-xl: 18px;
--asana-font-size-2xl: 20px;
--asana-font-size-3xl: 24px;

/* Font Weights */
--asana-font-weight-normal: 400;
--asana-font-weight-medium: 500;
--asana-font-weight-semibold: 600;
--asana-font-weight-bold: 700;

/* Line Heights */
--asana-line-height-tight: 1.25;
--asana-line-height-base: 1.5;
--asana-line-height-relaxed: 1.75;
```

### Spacing System (4px base)

```css
--asana-spacing-xs: 4px;
--asana-spacing-sm: 8px;
--asana-spacing-md: 12px;
--asana-spacing-lg: 16px;
--asana-spacing-xl: 20px;
--asana-spacing-2xl: 24px;
--asana-spacing-3xl: 32px;
--asana-spacing-4xl: 40px;
```

### Shadow System

```css
--asana-shadow-card: 0 1px 3px rgba(0, 0, 0, 0.08);
--asana-shadow-card-hover: 0 4px 12px rgba(0, 0, 0, 0.12);
--asana-shadow-drag: 0 12px 24px rgba(0, 0, 0, 0.15);
--asana-shadow-overlay: 0 20px 40px rgba(0, 0, 0, 0.2);
```

### Border Radius

```css
--asana-radius-sm: 4px;
--asana-radius-md: 6px;
--asana-radius-lg: 8px;
--asana-radius-xl: 12px;
--asana-radius-full: 9999px;
```

### Transitions

```css
--asana-transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--asana-transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
--asana-transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
```

## 3. Layout System

### Page Structure

```
┌──────────────────────────────────────────────────┐
│                    Header (64px)                  │
├────────┬─────────────────────────────────────────┤
│        │                                          │
│ Sidebar│           Main Content Area             │
│ (240px)│                                          │
│        │                                          │
│        │                                          │
└────────┴─────────────────────────────────────────┘
```

#### Header Pattern
- Height: 64px
- Background: #FFFFFF
- Border-bottom: 1px solid #E8E8E9
- Content: Logo, Navigation, Search, User Actions
- Padding: 0 32px

#### Sidebar Pattern
- Width: 240px (collapsed: 64px)
- Background: #F9FAFB
- Border-right: 1px solid #E8E8E9
- Sections: Navigation, Workspace, User

#### Content Area Pattern
- Background: #FAFBFC
- Padding: 24px
- Max-width: 1440px (centered on large screens)

### Grid System

```css
/* Responsive Columns */
.asana-grid {
  display: grid;
  gap: 24px;
}

/* Auto-responsive */
.asana-grid-auto {
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
}

/* Fixed columns */
.asana-grid-2 { grid-template-columns: repeat(2, 1fr); }
.asana-grid-3 { grid-template-columns: repeat(3, 1fr); }
.asana-grid-4 { grid-template-columns: repeat(4, 1fr); }
```

### Responsive Breakpoints

```css
/* Mobile First */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

## 4. Component Library

### Atomic Components

#### Button
```css
.asana-button {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  transition: all 200ms ease;
  cursor: pointer;
  border: none;
  outline: none;
}

.asana-button-primary {
  background: #796EFF;
  color: white;
}

.asana-button-primary:hover {
  background: #6257E0;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(121, 110, 255, 0.3);
}

.asana-button-secondary {
  background: #F6F7F8;
  color: #151B26;
  border: 1px solid #E8E8E9;
}

.asana-button-ghost {
  background: transparent;
  color: #6B6F76;
}
```

#### Input
```css
.asana-input {
  width: 100%;
  padding: 8px 12px;
  background: #F6F7F8;
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 14px;
  transition: all 200ms ease;
  outline: none;
}

.asana-input:hover {
  background: #FFFFFF;
  border-color: #D1D5DB;
}

.asana-input:focus {
  background: #FFFFFF;
  border-color: #796EFF;
  box-shadow: 0 0 0 3px rgba(121, 110, 255, 0.1);
}
```

### Molecular Components

#### Card
```css
.asana-card {
  background: #FFFFFF;
  border-radius: 8px;
  border: 1px solid #E8E8E9;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  padding: 16px;
  transition: all 200ms ease;
}

.asana-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.asana-card-header {
  padding-bottom: 12px;
  border-bottom: 1px solid #F0F0F1;
  margin-bottom: 12px;
}

.asana-card-title {
  font-size: 16px;
  font-weight: 600;
  color: #151B26;
}
```

#### Task Card (Kanban)
```css
.asana-kanban-card {
  background: #FFFFFF;
  border-radius: 6px;
  border: 1px solid #E8E8E9;
  padding: 12px;
  margin-bottom: 8px;
  cursor: move;
  transition: all 200ms ease;
}

.asana-kanban-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.asana-task-title {
  font-size: 14px;
  font-weight: 400;
  color: #151B26;
  line-height: 20px;
}

.asana-task-metadata {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 12px;
  color: #6B6F76;
}
```

### Organism Components

#### Page Header
```css
.asana-page-header {
  height: 64px;
  background: #FFFFFF;
  border-bottom: 1px solid #E8E8E9;
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
}

.asana-header-title {
  font-size: 20px;
  font-weight: 600;
  color: #151B26;
}

.asana-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
```

## 5. Component Patterns

### Navigation Pattern
```
- Sidebar navigation with icons + labels
- Active state: Purple background (#796EFF/10), purple text
- Hover state: Light gray background (#F0F1F3)
- Collapsed state: Icons only (64px width)
```

### Form Pattern
```
- Labels above inputs
- 8px spacing between label and input
- Error messages below inputs in red (#E8384F)
- Required fields marked with asterisk
```

### Data Display Pattern
```
- Tables with alternating row colors
- Cards for individual items
- List view with clear separators
- Kanban board with draggable cards
```

### Modal Pattern
```
- Dark overlay (rgba(0,0,0,0.5))
- White modal with rounded corners
- Header, body, footer sections
- Close button in top right
```

## 6. Migration Strategy

### Phase 1: Foundation (Week 1)
- [ ] Create new token system
- [ ] Set up backwards compatibility
- [ ] Create component library structure

### Phase 2: Core Components (Week 2)
- [ ] Migrate atomic components
- [ ] Migrate molecular components
- [ ] Create Storybook/Ladle stories

### Phase 3: Page Migration (Week 3-4)
- [ ] Migrate Sidebar
- [ ] Migrate Dashboard
- [ ] Migrate remaining pages

### Phase 4: Cleanup (Week 5)
- [ ] Remove old design system
- [ ] Archive legacy files
- [ ] Update documentation

## 7. Implementation Checklist

### Files to Create
```
src/
├── design-system/
│   ├── tokens/
│   │   ├── colors.css
│   │   ├── typography.css
│   │   ├── spacing.css
│   │   └── index.css
│   ├── components/
│   │   ├── atomic/
│   │   ├── molecular/
│   │   └── organisms/
│   └── patterns/
│       ├── layouts/
│       └── navigation/
```

### Files to Migrate
- All pages in `src/app/pages/`
- All components in `src/components/`
- Sidebar navigation
- Header components

### Files to Archive
- `src/core/design-system/`
- Old CSS files
- Unused component variations

## 8. Quality Checklist

### Visual Consistency
- [ ] All pages use Asana color palette
- [ ] Typography is consistent
- [ ] Spacing follows 4px grid
- [ ] Shadows match specification

### Functionality
- [ ] All interactions work
- [ ] Responsive design intact
- [ ] Animations smooth
- [ ] No console errors

### Accessibility
- [ ] Color contrast meets WCAG AA
- [ ] Keyboard navigation works
- [ ] Screen reader friendly
- [ ] Focus states visible

### Performance
- [ ] Bundle size optimized
- [ ] No unused CSS
- [ ] Images optimized
- [ ] Lazy loading implemented

## 9. Documentation Requirements

### Component Documentation
- Usage examples
- Props/API documentation
- Accessibility notes
- Best practices

### Design Guidelines
- When to use each component
- Do's and don'ts
- Visual examples
- Code snippets

## 10. Success Metrics

### Quantitative
- 100% component coverage
- Zero TypeScript errors
- <5% CSS duplication
- <500kb CSS bundle

### Qualitative
- Consistent user experience
- Improved developer velocity
- Positive user feedback
- Easy maintenance