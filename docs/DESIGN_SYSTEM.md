# LibreOllama Design System

**Version:** 4.0  
**Last Updated:** 2025-02-07  
**Status:** Active Implementation

## Overview

LibreOllama uses an Asana-inspired design system focusing on clean minimalism, functional clarity, and consistent spacing. This document serves as the single source of truth for all design decisions.

## Implementation Status

### ✅ Completed Pages (Core Layout)
- **Dashboard** - Full Asana layout with 24px padding
- **Chat** - Asana layout with proper spacing
- **Mail** - Asana layout (search bar needs refinement)
- **Projects** - Uses asana-page class
- **Agents** - Uses asana-page class  
- **Settings** - Updated with padding and rounded containers
- **Canvas** - Uses asana-page class
- **Calendar** - Original Asana implementation
- **Tasks** - Original Asana implementation

### ⚠️ Needs Component-Level Updates
- **Mail Components**: Email list items, compose modal, reply interface
- **Chat Components**: Message bubbles, input area
- **All Pages**: Still contain Tailwind classes that need removal

## Core Design Principles

1. **24px Universal Padding**: All pages wrapped with 24px padding
2. **24px Component Gap**: Consistent spacing between major components
3. **Rounded Corners**: 8px border-radius for containers
4. **Subtle Shadows**: `0 1px 3px rgba(0, 0, 0, 0.1)` for elevation
5. **Clean Backgrounds**: #FAFBFC for page, #FFFFFF for containers

## Design Tokens

### Colors
```css
/* Brand Colors */
--asana-purple: #796EFF;
--asana-purple-hover: #6B5EE6;
--asana-coral: #FC636B;

/* Backgrounds */
--asana-bg-primary: #FFFFFF;
--asana-bg-secondary: #FAFBFC;
--asana-bg-tertiary: #F4F6F8;

/* Text */
--asana-text-primary: #323F4B;
--asana-text-secondary: #7B8794;
--asana-text-tertiary: #9AA5B1;

/* Borders */
--asana-border-default: #E4E7EB;
--asana-border-subtle: #E8E8E9;
```

### Spacing
```css
--asana-page-padding: 24px;
--asana-component-gap: 24px;
--asana-content-padding: 32px;
--asana-section-gap: 16px;
```

### Typography
```css
/* Headings */
--asana-h1: 32px/1.2, 600 weight
--asana-h2: 24px/1.3, 600 weight
--asana-h3: 18px/1.4, 600 weight

/* Body */
--asana-body: 14px/1.5, 400 weight
--asana-small: 12px/1.5, 400 weight
```

## CSS architecture

### Canonical global styles and import order
Use this order at app bootstrap to ensure variables and classes resolve predictably:

```ts
// main.tsx (target import order)
import '../styles/asana-globals.css';   // tokens + compatibility mappings
import '../styles/asana-core.css';      // components and utilities
import '../styles/asana-layout.css';    // page layout primitives
```

Note: `src/styles/asana-tokens.css` and `src/styles/asana-design-system.css` currently load for compatibility. They are slated for deprecation once all tokens/classes are migrated into the canonical files above.

### Core files
- `src/styles/asana-globals.css` – design tokens, semantic aliases, backwards-compat mappings
- `src/styles/asana-core.css` – component classes and utilities (buttons, cards, inputs, grid, etc.)
- `src/styles/asana-layout.css` – page layout primitives (page wrapper, dashboards, scroll containers)

### Page-level styles in use
- `src/app/pages/styles/page-asana-v2.css`
- `src/app/pages/styles/dashboard-asana-v3.css`
- `src/app/pages/styles/chat-asana.css`
- `src/app/pages/styles/mail-asana-v2.css`
- `src/app/pages/styles/settings-asana-v2.css`
- `src/app/pages/styles/calendar-asana.css`
- `src/app/pages/styles/calendar-custom.css` (calendar-only overrides)
- `src/app/pages/styles/TasksAsanaClean.css` (reference implementation)

### Key Classes

#### Page Layout
```css
.asana-page {
  display: flex;
  height: 100vh;
  background: #FAFBFC;
  padding: 24px;
  gap: 24px;
}

.asana-app-layout {
  /* Alternative layout with same padding */
  padding: 24px;
  gap: 24px;
}
```

#### Components
```css
/* Content containers */
.asana-content-card {
  background: #FFFFFF;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
}

/* Buttons */
.asana-btn-primary {
  background: #796EFF;
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  height: 40px;
}

/* Inputs */
.asana-input {
  background: #F6F7F8;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 8px 12px;
  height: 36px;
}
```

## Active components inventory

Authoritative source: `src/components/ui/design-system/index.ts`

- Interactive: `Button`, `Select` (and `NativeSelect`), `Toggle`, `ContextMenu`
- Overlays: `Popover`, `Dropdown` (ActionMenu, SelectDropdown), `Tooltip`, `Dialog`, `ConfirmDialog`, `Toast`
- Data/display: `Badge` (Count/Status/Group), `Tag` (Hash/Color/Group/Input), `Avatar` (Group/User/Bot/Team), `ProgressRing` (Bar/Spinner/Steps), `HeatMapCalendar` (ActivityCalendar)
- Layout primitives: `Stack` (VStack/HStack/FormStack/ListStack/ButtonGroup), `Grid` (GridItem/CardGrid/DashboardGrid/SidebarLayout/MasonryGrid/AutoGrid), `Box` (Center/Square/Circle/Flex/AspectRatio), `Container` (Section/Page/Article/Hero)
- Forms: `FormControl` (Label/Helper/Error/Success/Hint/Input/Textarea/Group, `useFormControl`)

Additional UI stylesheet: `src/components/ui/ui-asana.css` (to be merged into `src/styles/asana-core.css` after a diff to avoid duplication).

## Consolidation plan (non‑breaking)

1. Keep current imports in `src/app/main.tsx` unchanged for now to ensure no regressions.
2. Design tokens single source: treat `src/styles/asana-globals.css` as the only token authority. Diff `src/styles/asana-tokens.css` → copy any missing variables into `asana-globals.css`, then remove the extra file import.
3. Component classes single source: merge unique rules from `src/components/ui/ui-asana.css` and `src/styles/asana-design-system.css` into `src/styles/asana-core.css`. Update component entry points to rely on global `asana-core.css`. Only then remove redundant imports.
4. Page styles: standardize on `page-asana-v2.css` and `dashboard-asana-v3.css`. Remove older variants once each page is verified visually (no horizontal scroll, consistent 24px padding/gaps).
5. Calendar/Tasks as the canonical reference: keep `calendar-asana.css` and `TasksAsanaClean.css` as the design exemplars; propagate their patterns into shared primitives where appropriate.
6. Accessibility and motion: preserve focus rings, reduced‑motion behavior, and contrast variables during consolidation.

Tracking for this consolidation lives in `docs/design-system/migrations/DESIGN_SYSTEM_MIGRATION_STATUS.md` and `docs/design-system/reports/CSS_CONSOLIDATION_REPORT.md`.

## Component Status

### Fully Migrated
- Page layouts (all pages)
- Main navigation sidebar
- Headers and toolbars

### Partially Migrated
- Search bars (inconsistent implementations)
- Buttons (mix of Tailwind and Asana classes)
- Cards (some use old styles)

### Not Migrated
- Email list items
- Chat messages
- Modal dialogs
- Form inputs
- Tables
- Tooltips
- Dropdowns

## Migration Guidelines

### For New Components
1. Use Asana CSS classes, not Tailwind
2. Follow 8px grid system
3. Use CSS variables for all colors
4. Maintain 24px padding consistency

### For Existing Components
1. Replace Tailwind classes with Asana equivalents
2. Update inline styles to use CSS variables
3. Ensure proper spacing (24px between major elements)
4. Test responsive behavior

## Known Issues

1. **Mail Search Bar**: Recently updated but needs testing
2. **Component Inconsistency**: Mix of Tailwind and custom CSS
3. **Modal Styles**: Not updated to Asana design
4. **Email Components**: Still using old design system
5. **Date Inconsistency**: Some files have future dates (needs cleanup)

## Next Steps

1. **Phase 1**: Complete component-level updates for Mail and Chat
2. **Phase 2**: Remove all Tailwind classes 
3. **Phase 3**: Create reusable component library
4. **Phase 4**: Update all modals and dialogs
5. **Phase 5**: Final audit and validation

## References

- **CSS Files**: `src/styles/asana-core.css`
- **Page Styles**: `src/app/pages/styles/`
- **Original References**: Calendar and Tasks pages
- **Archived Docs**: `docs/_archive/design/` (for historical context)

---

*Note: This is the authoritative design system document. All other design-related documents have been archived to `docs/_archive/design/`.*