# LibreOllama Design System

**Version:** 2.0  
**Last Updated:** 2025-01-24  
**Status:** Production Ready

A comprehensive design system for modern, accessible interfaces inspired by Linear, Obsidian, and Raycast.

## Table of Contents

1. [Design Principles](#design-principles)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Components](#components)
6. [Animation System](#animation-system)
7. [Accessibility](#accessibility)
8. [Implementation Guide](#implementation-guide)

## Design Principles

1. **Clarity First**: Prioritize readability and comprehension
2. **Subtle Sophistication**: Muted colors and gentle transitions
3. **Accessible Always**: WCAG AA compliance minimum
4. **Consistent Experience**: Unified patterns across all surfaces
5. **Performance Matters**: Lightweight, optimized components

## Color System

### Color Primitives

```css
/* Gray Scale */
--gray-50: #fafafa;
--gray-100: #f4f4f5;
--gray-200: #e4e4e7;
--gray-300: #d4d4d8;
--gray-400: #a1a1aa;
--gray-500: #71717a;
--gray-600: #52525b;
--gray-700: #3f3f46;
--gray-800: #27272a;
--gray-850: #1f1f23; /* Custom */
--gray-900: #18181b;
--gray-950: #09090b;

/* Indigo Scale (Primary) */
--indigo-50: #eef2ff;
--indigo-100: #e0e7ff;
--indigo-200: #c7d2fe;
--indigo-300: #a5b4fc;
--indigo-400: #818cf8;
--indigo-500: #6366f1;
--indigo-600: #4f46e5;
--indigo-700: #4338ca;
--indigo-800: #3730a3;
--indigo-900: #312e81;
--indigo-950: #1e1b4b;

/* Semantic Colors */
--green-50: #f0fdf4;
--green-200: #bbf7d0;
--green-500: #10b981;
--green-600: #059669;
--emerald-500: #10b981;
--amber-50: #fffbeb;
--amber-200: #fde68a;
--amber-500: #f59e0b;
--amber-600: #d97706;
--red-50: #fef2f2;
--red-200: #fecaca;
--red-300: #fca5a5;
--red-500: #ef4444;
--red-600: #dc2626;
```

### Semantic Color Tokens

#### Light Theme
```css
/* Backgrounds */
--bg-primary: #fafafa; /* gray-50 */
--bg-secondary: #ffffff; /* white */
--bg-tertiary: rgba(244, 244, 245, 0.6); /* gray-100/60 */
--bg-surface: rgba(255, 255, 255, 0.8); /* white/80 */
--bg-elevated: rgba(249, 250, 251, 0.8); /* gray-50/80 */
--bg-overlay: rgba(255, 255, 255, 0.8);
--bg-glass: rgba(255, 255, 255, 0.6);

/* Text */
--text-primary: #18181b; /* gray-900 */
--text-secondary: #52525b; /* gray-600 */
--text-tertiary: #71717a; /* gray-500 */
--text-muted: #a1a1aa; /* gray-400 */
--text-inverted: #ffffff;

/* Borders */
--border-primary: rgba(228, 228, 231, 0.6); /* gray-200/60 */
--border-default: rgba(228, 228, 231, 0.6); /* gray-200/60 */
--border-subtle: rgba(228, 228, 231, 0.4); /* gray-200/40 */
--border-focus: #6366f1; /* indigo-500 */

/* Interactive States */
--hover-bg: rgba(244, 244, 245, 0.4); /* gray-100/40 */
--active-bg: rgba(224, 231, 255, 0.5); /* indigo-100/50 */
--selected-bg: #eef2ff; /* indigo-50 */
--selected-border: #c7d2fe; /* indigo-200 */
--selected-text: #4338ca; /* indigo-700 */

/* Accents */
--accent-primary: #6366f1; /* indigo-500 */
--accent-secondary: #4f46e5; /* indigo-600 */
--accent-bg: rgba(224, 231, 255, 0.5); /* indigo-100/50 */
--accent-soft: rgba(224, 231, 255, 0.3); /* indigo-100/30 */
--accent-ghost: rgba(224, 231, 255, 0.1); /* indigo-100/10 */

/* Status Colors */
--status-success: #10b981; /* green-500 */
--status-success-bg: rgba(187, 247, 208, 0.2); /* green-200/20 */
--status-warning: #f59e0b; /* amber-500 */
--status-warning-bg: rgba(253, 230, 138, 0.2); /* amber-200/20 */
--status-error: #ef4444; /* red-500 */
--status-error-bg: rgba(254, 202, 202, 0.2); /* red-200/20 */
--status-info: #6366f1; /* indigo-500 */
--status-info-bg: rgba(224, 231, 255, 0.2); /* indigo-100/20 */
```

#### Dark Theme
```css
/* Backgrounds */
--bg-primary: #09090b; /* gray-950 */
--bg-secondary: #18181b; /* gray-900 */
--bg-tertiary: rgba(39, 39, 42, 0.6); /* gray-800/60 */
--bg-surface: rgba(24, 24, 27, 0.8); /* gray-900/80 */
--bg-elevated: rgba(31, 31, 35, 0.8); /* gray-850/80 */
--bg-overlay: rgba(0, 0, 0, 0.8);
--bg-glass: rgba(9, 9, 11, 0.6);

/* Text */
--text-primary: #fafafa; /* gray-50 */
--text-secondary: #a1a1aa; /* gray-400 */
--text-tertiary: #71717a; /* gray-500 */
--text-muted: #52525b; /* gray-600 */
--text-inverted: #18181b; /* gray-900 */

/* Dark theme borders/states follow similar pattern... */
```

## Typography

### Font Stack
```css
--font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
             "Helvetica Neue", Arial, sans-serif;
--font-mono: "JetBrains Mono", "SF Mono", Monaco, "Cascadia Code", 
             "Roboto Mono", Consolas, "Courier New", monospace;
```

### Type Scale
```css
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
--text-5xl: 3rem;      /* 48px */
```

### Font Weights
```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Line Heights
```css
--leading-none: 1;
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;
```

## Spacing & Layout

### Spacing Scale
```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

### Border Radius
```css
--radius-none: 0;
--radius-sm: 0.25rem;     /* 4px */
--radius-md: 0.375rem;    /* 6px */
--radius-lg: 0.5rem;      /* 8px */
--radius-xl: 0.75rem;     /* 12px */
--radius-2xl: 1rem;       /* 16px */
--radius-3xl: 1.5rem;     /* 24px */
--radius-full: 9999px;
```

### Shadows
```css
--shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
```

## Components

### Button Component

```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

// Primary Button
<Button variant="primary" size="md">
  Save Changes
</Button>

// Icon Button
<Button variant="ghost" size="icon">
  <Settings size={18} />
</Button>
```

**Button Styles:**
- Primary: Indigo background, white text
- Secondary: Gray background, darker text
- Ghost: Transparent with hover state
- Outline: Border only, transparent background
- Destructive: Red variant for dangerous actions

### Card Component

```tsx
interface CardProps {
  padding?: 'none' | 'sm' | 'default' | 'lg';
  variant?: 'default' | 'elevated' | 'ghost';
  interactive?: boolean;
}

<Card padding="default" variant="elevated" interactive>
  <CardHeader>
    <CardTitle>Project Progress</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### Input Component

```tsx
interface InputProps {
  type?: 'text' | 'email' | 'password' | 'search';
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
  icon?: React.ReactNode;
}

<Input 
  type="search" 
  placeholder="Search..." 
  icon={<Search size={16} />}
/>
```

### Modal Component

```tsx
interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

<Modal open={isOpen} onOpenChange={setIsOpen} size="md">
  <ModalHeader>
    <ModalTitle>Edit Profile</ModalTitle>
    <ModalDescription>
      Make changes to your profile here.
    </ModalDescription>
  </ModalHeader>
  <ModalContent>
    {/* Form content */}
  </ModalContent>
  <ModalFooter>
    <Button variant="ghost" onClick={() => setIsOpen(false)}>
      Cancel
    </Button>
    <Button variant="primary">Save</Button>
  </ModalFooter>
</Modal>
```

## Animation System

### Animation Principles

1. **Purpose-Driven Animation**
   - Micro-interactions provide immediate feedback
   - State transitions communicate changes clearly
   - Spatial awareness helps users understand layout changes
   - Progressive enhancement for reduced-motion users

2. **Performance First**
   - Use `transform` and `opacity` for best performance
   - Leverage hardware acceleration
   - Prefer CSS transitions over JavaScript animations
   - Respect `prefers-reduced-motion`

3. **Consistent Timing**
   - Follow standardized duration scales
   - Use semantic timing rather than arbitrary values
   - Maintain visual rhythm across components

### Duration Scale

```css
/* Micro-interactions (hover, focus) */
--duration-fast: 150ms;

/* State changes (active, selected) */
--duration-base: 200ms;

/* Layout transitions (modal open/close) */
--duration-slow: 300ms;

/* Complex animations (page transitions) */
--duration-slower: 500ms;
```

### Easing Functions

```css
/* Natural motion curves */
--ease-out: cubic-bezier(0, 0, 0.2, 1);        /* Deceleration */
--ease-in: cubic-bezier(0.4, 0, 1, 1);         /* Acceleration */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);   /* Smooth */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* Bouncy */
```

### Common Animation Patterns

#### Hover Effects
```tsx
// Color change
className="transition-colors duration-200 hover:bg-bg-secondary"

// Scale transform
className="transition-transform duration-150 hover:scale-105"

// Combined effects
className="transition-all duration-200 hover:bg-bg-secondary hover:shadow-md"
```

#### Button Interactions
```tsx
className="transition-all duration-150 hover:scale-105 active:scale-95"
```

#### Modal Animations
```tsx
// Overlay
className="transition-all duration-300 animate-in fade-in"

// Modal container
className="transition-all duration-300 animate-in zoom-in-95"
```

#### Loading States
```tsx
// Spinner
className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"

// Skeleton
className="animate-pulse bg-bg-secondary rounded-md"
```

### Accessibility

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

```tsx
// Respect reduced motion
className="motion-safe:transition-transform motion-safe:duration-200 motion-safe:hover:scale-105"
```

## Accessibility

### Core Requirements
- WCAG AA compliance minimum
- Keyboard navigation for all interactive elements
- Screen reader announcements for dynamic content
- Focus indicators on all focusable elements
- Color contrast ratios meeting standards

### Implementation Guidelines

#### Focus Management
```tsx
// Visible focus indicators
className="focus:ring-2 focus:ring-accent-primary focus:outline-none"

// Focus trap for modals
useFocusTrap(modalRef, isOpen);
```

#### ARIA Attributes
```tsx
// Buttons
<button aria-label="Close dialog" aria-pressed={isActive}>

// Modals
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">

// Loading states
<div role="status" aria-live="polite">
  <span className="sr-only">Loading...</span>
</div>
```

#### Keyboard Navigation
- Tab/Shift+Tab for focus navigation
- Enter/Space for activation
- Escape for dismissal
- Arrow keys for menu navigation

## Implementation Guide

### Setup

1. **Install Dependencies**
```bash
npm install tailwindcss @tailwindcss/forms @tailwindcss/typography
```

2. **Configure Tailwind**
```js
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Import color tokens
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        mono: ['JetBrains Mono', ...defaultTheme.fontFamily.mono],
      },
      animation: {
        // Custom animations
      },
    },
  },
};
```

3. **Import Global Styles**
```css
/* globals.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono&display=swap');

/* CSS custom properties */
:root {
  /* Color tokens */
  /* Typography tokens */
  /* Spacing tokens */
  /* Animation tokens */
}
```

### Component Development

1. **Use Design Tokens**
```tsx
// ✅ Good - Using tokens
className="bg-bg-primary text-text-primary"

// ❌ Bad - Hardcoded values
className="bg-gray-50 text-gray-900"
```

2. **Follow Naming Conventions**
```tsx
// Components: PascalCase
export function UserProfile() {}

// Utilities: camelCase
export function formatDate() {}

// Constants: UPPER_SNAKE_CASE
export const MAX_FILE_SIZE = 5242880;
```

3. **Maintain Consistency**
```tsx
// Consistent prop interfaces
interface ComponentProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}
```

### Testing Design System

1. **Visual Regression Testing**
   - Use Storybook for component documentation
   - Implement Chromatic for visual testing
   - Test across different viewports

2. **Accessibility Testing**
   - Run axe-core in test suite
   - Manual keyboard navigation testing
   - Screen reader compatibility testing

3. **Performance Testing**
   - Monitor bundle size impact
   - Test animation performance
   - Validate render performance

### Migration Guide

For existing components:

1. **Audit Current Implementation**
   - Identify hardcoded values
   - Find inconsistent patterns
   - List accessibility gaps

2. **Apply Design Tokens**
   - Replace hardcoded colors
   - Update spacing values
   - Standardize animations

3. **Test and Validate**
   - Visual regression tests
   - Accessibility audit
   - Performance profiling

## Resources

- **Component Explorer**: Run `npm run ladle` for interactive component gallery
- **Design Tokens**: See `src/core/design-system/tokens.ts`
- **Icons**: Using Lucide React icon library
- **Animation Utils**: See `src/core/hooks/useAnimation.ts`

---

*This document represents the complete LibreOllama Design System. For specific implementation details, refer to the component source code and Storybook documentation.*