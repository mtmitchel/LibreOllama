# Asana Design System Migration Guide

## Overview
This document outlines the migration from the old design system to the new Asana-based design system, inspired by the working implementations in Calendar and Tasks pages.

## Migration Status Tracker

### ✅ Complete
- Calendar page (CalendarCustom)
- Tasks page (TasksAsanaClean)

### 🔄 In Progress
- Design system documentation

### ⏳ Pending
- Dashboard
- Sidebar
- Mail
- Chat
- Notes
- Canvas
- Projects
- Agents
- Settings
- Shared UI components

## Token Mapping Guide

### Color Tokens

#### Background Colors
```css
/* OLD → NEW */
--bg-page          → --asana-bg-canvas (#FAFBFC)
--bg-primary       → --asana-bg-primary (#FFFFFF)
--bg-secondary     → --asana-bg-secondary (#F6F7F8)
--bg-card          → --asana-bg-card (#FFFFFF)
--bg-sidebar       → --asana-bg-sidebar (#F9FAFB)
--bg-header        → --asana-bg-primary (#FFFFFF)
--bg-overlay       → rgba(0, 0, 0, 0.5)
--input-bg         → --asana-bg-input (#F6F7F8)
```

#### Text Colors
```css
/* OLD → NEW */
--text-primary     → --asana-text-primary (#151B26)
--text-secondary   → --asana-text-secondary (#6B6F76)
--text-tertiary    → --asana-text-tertiary (#9CA1A8)
--text-muted       → --asana-text-muted (#B4B8BD)
--text-inverted    → #FFFFFF
--text-on-accent   → #FFFFFF
```

#### Border Colors
```css
/* OLD → NEW */
--border-primary   → --asana-border-default (#E8E8E9)
--border-secondary → --asana-border-subtle (#F0F0F1)
--border-focus     → --asana-border-focus (#796EFF)
--border-error     → --asana-status-blocked (#E8384F)
--border-success   → --asana-status-success (#14A454)
```

#### Brand Colors
```css
/* Asana Brand Palette */
--asana-brand-purple    → #796EFF (Primary brand)
--asana-brand-coral     → #FC636B (Secondary brand)
--asana-brand-mint      → #2EAADC (Tertiary)
```

#### Status Colors
```css
/* OLD → NEW */
--status-success   → --asana-status-success (#14A454)
--status-warning   → --asana-status-warning (#FFA93C)
--status-error     → --asana-status-blocked (#E8384F)
--status-info      → --asana-status-info (#6366F1)
```

### Spacing Tokens
```css
/* OLD → NEW */
--space-1          → --asana-spacing-xs (4px)
--space-2          → --asana-spacing-sm (8px)
--space-3          → --asana-spacing-md (12px)
--space-4          → --asana-spacing-lg (16px)
--space-5          → --asana-spacing-xl (20px)
--space-6          → --asana-spacing-2xl (24px)
--space-8          → --asana-spacing-3xl (32px)
--space-10         → --asana-spacing-4xl (40px)
```

### Typography
```css
/* OLD → NEW */
--text-xs          → --asana-font-size-xs (12px)
--text-sm          → --asana-font-size-sm (14px)
--text-base        → --asana-font-size-base (16px)
--text-lg          → --asana-font-size-lg (18px)
--text-xl          → --asana-font-size-xl (20px)
--font-normal      → --asana-font-weight-normal (400)
--font-medium      → --asana-font-weight-medium (500)
--font-semibold    → --asana-font-weight-semibold (600)
```

### Border Radius
```css
/* OLD → NEW */
--radius-sm        → --asana-radius-sm (4px)
--radius-md        → --asana-radius-md (6px)
--radius-lg        → --asana-radius-lg (8px)
--radius-xl        → --asana-radius-xl (12px)
--radius-full      → --asana-radius-full (9999px)
```

## Component Migration Guide

### Buttons

#### Old System
```tsx
<button className="btn btn-primary">Click me</button>
<button className="btn btn-secondary">Cancel</button>
<button className="btn btn-ghost">Ghost</button>
```

#### New Asana System
```tsx
<button className="asana-button asana-button-primary">Click me</button>
<button className="asana-button asana-button-secondary">Cancel</button>
<button className="asana-button asana-button-ghost">Ghost</button>
```

### Cards

#### Old System
```tsx
<div className="card">
  <div className="card-header">
    <h3 className="card-title">Title</h3>
  </div>
  <div className="card-body">Content</div>
</div>
```

#### New Asana System
```tsx
<div className="asana-card">
  <div className="asana-card-header">
    <h3 className="asana-card-title">Title</h3>
  </div>
  <div className="asana-card-body">Content</div>
</div>
```

### Form Inputs

#### Old System
```tsx
<input className="input" placeholder="Enter text" />
<select className="input">...</select>
<textarea className="textarea">...</textarea>
```

#### New Asana System
```tsx
<input className="asana-input" placeholder="Enter text" />
<select className="asana-select">...</select>
<textarea className="asana-textarea">...</textarea>
```

## Tailwind Class Migration

### Background Classes
```
bg-primary     → bg-[#FFFFFF]
bg-secondary   → bg-[#F6F7F8]
bg-tertiary    → bg-[#FAFBFC]
bg-card        → bg-white
bg-sidebar     → bg-[#F9FAFB]
```

### Text Classes
```
text-primary   → text-[#151B26]
text-secondary → text-[#6B6F76]
text-muted     → text-[#B4B8BD]
```

### Border Classes
```
border-primary → border-[#E8E8E9]
border-subtle  → border-[#F0F0F1]
```

## Migration Steps

### Step 1: Update main.tsx
Replace the old globals.css import with the Asana design system:

```tsx
// OLD
import "../core/design-system/globals.css";

// NEW
import "../styles/asana-tokens.css";
import "../styles/asana-design-system.css";
```

### Step 2: Update Component Imports
For each page/component, add the Asana CSS imports:

```tsx
import '../../styles/asana-tokens.css';
import '../../styles/asana-design-system.css';
```

### Step 3: Replace CSS Variables
Use find-and-replace to update CSS variable references:
- Search for `var(--bg-` and replace with `var(--asana-bg-`
- Search for `var(--text-` and replace with `var(--asana-text-`
- etc.

### Step 4: Update Component Classes
Replace old component classes with Asana equivalents:
- `.btn` → `.asana-button`
- `.card` → `.asana-card`
- `.input` → `.asana-input`
- etc.

### Step 5: Update Tailwind Classes
Replace Tailwind utility classes with Asana-specific values or CSS variables.

### Step 6: Test & Validate
- Visual regression testing
- Cross-browser testing
- Dark mode support
- Accessibility audit

## Files to Update

### Priority 1 (Core Files)
- [ ] src/app/main.tsx
- [ ] src/app/App.tsx
- [ ] src/components/navigation/Sidebar.tsx

### Priority 2 (Main Pages)
- [ ] src/app/pages/Dashboard.tsx
- [ ] src/app/pages/Mail.tsx
- [ ] src/app/pages/Chat.tsx
- [ ] src/app/pages/Notes.tsx
- [ ] src/app/pages/Canvas.tsx
- [ ] src/app/pages/Projects.tsx
- [ ] src/app/pages/Agents.tsx
- [ ] src/app/pages/Settings.tsx

### Priority 3 (Shared Components)
- [ ] src/components/ui/index.tsx
- [ ] src/components/ui/Button.tsx
- [ ] src/components/ui/Card.tsx
- [ ] src/components/ui/Input.tsx
- [ ] src/components/ui/Modal.tsx
- [ ] src/components/ui/Toast.tsx
- [ ] src/components/ui/Badge.tsx
- [ ] src/components/ui/Avatar.tsx

### Priority 4 (Feature Components)
- [ ] src/features/dashboard/components/*
- [ ] src/features/mail/components/*
- [ ] src/features/chat/components/*
- [ ] src/features/notes/components/*

## Testing Checklist

- [ ] All pages render correctly
- [ ] Color consistency across components
- [ ] Typography hierarchy maintained
- [ ] Spacing and layout preserved
- [ ] Interactive states work (hover, focus, active)
- [ ] Dark mode support (if applicable)
- [ ] Responsive design intact
- [ ] Accessibility standards met
- [ ] No console errors
- [ ] Performance metrics unchanged

## Rollback Plan

If issues arise during migration:
1. Keep the old globals.css file as backup
2. Use feature flags to toggle between old/new systems
3. Migrate one page at a time
4. Test thoroughly before removing old system

## Notes

- The Asana design system emphasizes clean, minimal design with purple (#796EFF) as the primary brand color
- Coral (#FC636B) is used as a secondary accent
- The system uses lighter backgrounds and subtle borders
- Focus on functionality and clarity over decorative elements