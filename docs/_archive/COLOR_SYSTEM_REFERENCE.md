# LibreOllama Color System Reference

**Last Updated:** Current  
**Version:** 2.0 (Matching Mockups)  
**Status:** Production Implementation

## Overview

This document provides the complete reference for all color values in the LibreOllama design system. These colors are implemented in `src/core/design-system/globals.css` and match the comprehensive mockups exactly.

## Philosophy

The LibreOllama color system prioritizes:
- **Subtlety** - Soft, muted colors that reduce visual fatigue
- **Accessibility** - WCAG 2.1 AA compliant contrast ratios
- **Consistency** - Semantic tokens used throughout the application
- **Refinement** - Sophisticated palette that feels professional yet approachable

## Light Theme Colors

### Accent Colors
```css
--accent-primary: #6366f1      /* Indigo 500 - Primary actions, highlights */
--accent-secondary: #4f46e5    /* Indigo 600 - Hover/pressed states */
--accent-bg: rgba(224, 231, 255, 0.5)      /* Indigo 100/50 - Active backgrounds */
--accent-soft: rgba(224, 231, 255, 0.3)    /* Indigo 100/30 - Subtle highlights */
--accent-ghost: rgba(224, 231, 255, 0.1)   /* Indigo 100/10 - Very subtle */
--accent-text: #4f46e5         /* Indigo 600 - Accent text color */
```

### Background Hierarchy
```css
--bg-primary: #fafafa          /* Gray 50 - Main application background */
--bg-secondary: #ffffff        /* White - Primary content areas */
--bg-tertiary: rgba(244, 244, 245, 0.6)    /* Gray 100/60 - Subtle sections */
--bg-surface: rgba(255, 255, 255, 0.8)     /* White/80 - Cards, panels */
--bg-elevated: rgba(249, 250, 251, 0.8)    /* Gray 50/80 - Modals, dropdowns */
--bg-overlay: rgba(255, 255, 255, 0.8)     /* Overlay backgrounds */
--bg-glass: rgba(255, 255, 255, 0.6)       /* Glass morphism effects */
```

### Text Hierarchy
```css
--text-primary: #18181b        /* Gray 900 - Primary content text */
--text-secondary: #52525b      /* Gray 600 - Secondary descriptions */
--text-tertiary: #71717a       /* Gray 500 - Helper text, labels */
--text-muted: #a1a1aa          /* Gray 400 - Muted, disabled text */
--text-inverted: #ffffff       /* White - Text on dark backgrounds */
```

### Border System
```css
--border-primary: rgba(228, 228, 231, 0.6)   /* Gray 200/60 - Primary borders */
--border-default: rgba(228, 228, 231, 0.6)   /* Gray 200/60 - Standard borders */
--border-subtle: rgba(228, 228, 231, 0.4)    /* Gray 200/40 - Subtle dividers */
--border-focus: #6366f1        /* Indigo 500 - Focus states */
```

### Interactive States
```css
--hover-bg: rgba(244, 244, 245, 0.4)         /* Gray 100/40 - Hover backgrounds */
--active-bg: rgba(224, 231, 255, 0.5)        /* Indigo 100/50 - Active states */
--selected-bg: #eef2ff         /* Indigo 50 - Selected item backgrounds */
--selected-border: #c7d2fe     /* Indigo 200 - Selected item borders */
--selected-text: #4338ca       /* Indigo 700 - Selected item text */
```

### Status Colors
```css
/* Success States */
--success: #10b981             /* Green 500 - Success indicators */
--success-fg: #059669          /* Green 600 - Success text */
--success-ghost: #f0fdf4       /* Green 50 - Success backgrounds */

/* Warning States */
--warning: #f59e0b             /* Amber 500 - Warning indicators */
--warning-fg: #d97706          /* Amber 600 - Warning text */
--warning-ghost: #fffbeb       /* Amber 50 - Warning backgrounds */

/* Error States */
--error: #ef4444               /* Red 500 - Error indicators */
--error-fg: #dc2626            /* Red 600 - Error text */
--error-ghost: #fef2f2         /* Red 50 - Error backgrounds */
```

### Component-Specific Colors
```css
/* Chat Interface */
--chat-bubble-bg: #fafafa                     /* Gray 50 - Chat bubble backgrounds */
--chat-bubble-border: rgba(228, 228, 231, 0.6) /* Gray 200/60 - Chat bubble borders */
--chat-bubble-text: #18181b    /* Gray 900 - Chat text */

/* Input Fields */
--input-bg: #fafafa            /* Gray 50 - Input backgrounds */
--input-border: rgba(228, 228, 231, 0.6)      /* Gray 200/60 - Input borders */

/* Layout Components */
--card-bg: rgba(255, 255, 255, 0.8)          /* White/80 - Card backgrounds */
--sidebar-bg: rgba(249, 250, 251, 0.8)       /* Gray 50/80 - Sidebar backgrounds */
--header-bg: rgba(255, 255, 255, 0.8)        /* White/80 - Header backgrounds */
```

## Dark Theme Colors

### Background Hierarchy (Dark)
```css
--bg-primary: #18181b          /* Gray 900 - Main application background */
--bg-secondary: #1f1f23        /* Gray 850 - Primary content areas */
--bg-tertiary: rgba(39, 39, 42, 0.5)         /* Gray 800/50 - Subtle sections */
--bg-surface: rgba(31, 31, 35, 0.5)          /* Gray 850/50 - Cards, panels */
--bg-elevated: rgba(24, 24, 27, 0.95)        /* Gray 900/95 - Modals */
--bg-overlay: rgba(24, 24, 27, 0.8)          /* Gray 900/80 - Overlays */
--bg-glass: rgba(24, 24, 27, 0.4)            /* Gray 900/40 - Glass effects */
```

### Text Hierarchy (Dark)
```css
--text-primary: #f4f4f5        /* Gray 100 - Primary content text */
--text-secondary: #d4d4d8      /* Gray 300 - Secondary descriptions */
--text-tertiary: #a1a1aa       /* Gray 400 - Helper text */
--text-muted: #71717a          /* Gray 500 - Muted text */
--text-inverted: #18181b       /* Gray 900 - Text on light backgrounds */
```

### Interactive States (Dark)
```css
--hover-bg: rgba(39, 39, 42, 0.2)            /* Gray 800/20 - Hover backgrounds */
--active-bg: rgba(99, 102, 241, 0.2)         /* Indigo 500/20 - Active states */
--selected-bg: rgba(30, 27, 75, 0.3)         /* Indigo 950/30 - Selected backgrounds */
--selected-border: #3730a3     /* Indigo 800 - Selected borders */
--selected-text: #a5b4fc       /* Indigo 300 - Selected text */
```

## Semantic Token Usage

### Tailwind CSS Classes

**Text Colors:**
- `text-primary` → `var(--text-primary)`
- `text-secondary` → `var(--text-secondary)`
- `text-tertiary` → `var(--text-tertiary)`
- `text-muted` → `var(--text-muted)`
- `text-accent-primary` → `var(--accent-primary)`
- `text-success` → `var(--success)`
- `text-warning` → `var(--warning)`
- `text-error` → `var(--error)`

**Background Colors:**
- `bg-primary` → `var(--bg-primary)`
- `bg-secondary` → `var(--bg-secondary)`
- `bg-tertiary` → `var(--bg-tertiary)`
- `bg-surface` → `var(--bg-surface)`
- `bg-elevated` → `var(--bg-elevated)`
- `bg-accent-primary` → `var(--accent-primary)`
- `bg-accent-soft` → `var(--accent-soft)`
- `bg-success-ghost` → `var(--success-ghost)`
- `bg-warning-ghost` → `var(--warning-ghost)`
- `bg-error-ghost` → `var(--error-ghost)`

**Border Colors:**
- `border-default` → `var(--border-default)`
- `border-subtle` → `var(--border-subtle)`
- `border-primary` → `var(--border-primary)`
- `border-accent-primary` → `var(--accent-primary)`
- `border-success` → `var(--success)`
- `border-warning` → `var(--warning)`
- `border-error` → `var(--error)`

## Implementation Guidelines

### ✅ Correct Usage
```tsx
// Use semantic tokens
<div className="bg-surface text-primary border-default p-4 rounded-lg">
  <h3 className="text-lg font-semibold text-primary">Title</h3>
  <p className="text-secondary">Description text</p>
  <button className="bg-accent-primary text-white px-4 py-2 rounded-md">
    Action
  </button>
</div>
```

### ❌ Incorrect Usage
```tsx
// Never use hardcoded colors
<div className="bg-gray-50 text-gray-900 border-gray-200">  // BANNED

// Never use CSS variable injection
<div className="bg-[var(--bg-surface)]">  // BANNED

// Never use style props with CSS variables
<div style={{ color: 'var(--text-primary)' }}>  // BANNED
```

### Color Application Rules

1. **Hierarchy First** - Always follow the text/background hierarchy
2. **Accent Sparingly** - Use accent colors only for primary actions and highlights
3. **Status Meaningfully** - Use status colors only for actual status indication
4. **Consistent Patterns** - Apply colors consistently across similar components
5. **Accessibility Always** - Ensure proper contrast ratios are maintained

## Validation

Colors can be validated using:
- ESLint rules in `.eslintrc.design-system.json`
- Automated script `scripts/fix-hardcoded-colors.js`
- Design system compliance tests

---

**Note:** This color system is implemented and enforced across the entire LibreOllama application. All components use these semantic tokens for consistent, maintainable styling that matches the approved mockups. 