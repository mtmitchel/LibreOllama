# LibreOllama Design System

A comprehensive design system for modern, accessible interfaces inspired by Linear, Obsidian, and Raycast.

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
--accent-text: #4f46e5; /* indigo-600 */

/* Status Colors */
--success: #10b981; /* green-500 */
--success-fg: #059669; /* green-600 */
--success-ghost: #f0fdf4; /* green-50 */
--warning: #f59e0b; /* amber-500 */
--warning-fg: #d97706; /* amber-600 */
--warning-ghost: #fffbeb; /* amber-50 */
--error: #ef4444; /* red-500 */
--error-fg: #dc2626; /* red-600 */
--error-ghost: #fef2f2; /* red-50 */

/* Components */
--chat-bubble-bg: #fafafa; /* gray-50 */
--chat-bubble-border: rgba(228, 228, 231, 0.6); /* gray-200/60 */
--chat-bubble-text: #18181b; /* gray-900 */
--input-bg: #fafafa; /* gray-50 */
--input-border: #e4e4e7; /* gray-200 */
--card-bg: rgba(255, 255, 255, 0.8);
--sidebar-bg: rgba(249, 250, 251, 0.8); /* gray-50/80 */
--header-bg: rgba(255, 255, 255, 0.8);
```

#### Dark Theme
```css
/* Backgrounds */
--bg-primary: #18181b; /* gray-900 */
--bg-secondary: #1f1f23; /* gray-850 */
--bg-tertiary: rgba(39, 39, 42, 0.5); /* gray-800/50 */
--bg-surface: rgba(31, 31, 35, 0.5); /* gray-850/50 */
--bg-elevated: rgba(24, 24, 27, 0.95); /* gray-900/95 */
--bg-overlay: rgba(24, 24, 27, 0.8); /* gray-900/80 */
--bg-glass: rgba(24, 24, 27, 0.4); /* gray-900/40 */

/* Text */
--text-primary: #f4f4f5; /* gray-100 */
--text-secondary: #d4d4d8; /* gray-300 */
--text-tertiary: #a1a1aa; /* gray-400 */
--text-muted: #71717a; /* gray-500 */
--text-inverted: #18181b; /* gray-900 */

/* Borders */
--border-primary: rgba(39, 39, 42, 0.4); /* gray-800/40 */
--border-default: rgba(39, 39, 42, 0.4); /* gray-800/40 */
--border-subtle: rgba(63, 63, 70, 0.3); /* gray-700/30 */
--border-focus: #818cf8; /* indigo-400 */

/* Interactive States */
--hover-bg: rgba(39, 39, 42, 0.2); /* gray-800/20 */
--active-bg: rgba(99, 102, 241, 0.2); /* indigo-500/20 */
--selected-bg: rgba(30, 27, 75, 0.3); /* indigo-950/30 */
--selected-border: #3730a3; /* indigo-800 */
--selected-text: #a5b4fc; /* indigo-300 */

/* Accents */
--accent-primary: #6366f1; /* indigo-500 */
--accent-secondary: #818cf8; /* indigo-400 */
--accent-bg: rgba(99, 102, 241, 0.2); /* indigo-500/20 */
--accent-soft: rgba(99, 102, 241, 0.15); /* indigo-500/15 */
--accent-ghost: rgba(99, 102, 241, 0.1); /* indigo-500/10 */
--accent-text: #818cf8; /* indigo-400 */

/* Status Colors */
--success: #10b981; /* green-500 */
--success-fg: #34d399; /* green-400 */
--success-ghost: rgba(16, 185, 129, 0.1); /* green-500/10 */
--warning: #f59e0b; /* amber-500 */
--warning-fg: #fbbf24; /* amber-400 */
--warning-ghost: rgba(245, 158, 11, 0.1); /* amber-500/10 */
--error: #ef4444; /* red-500 */
--error-fg: #f87171; /* red-400 */
--error-ghost: rgba(239, 68, 68, 0.1); /* red-500/10 */

/* Components */
--chat-bubble-bg: #27272a; /* gray-800 */
--chat-bubble-border: rgba(63, 63, 70, 0.6); /* gray-700/60 */
--chat-bubble-text: #f4f4f5; /* gray-100 */
--input-bg: rgba(39, 39, 42, 0.3); /* gray-800/30 */
--input-border: rgba(63, 63, 70, 0.5); /* gray-700/50 */
--card-bg: rgba(31, 31, 35, 0.5); /* gray-850/50 */
--sidebar-bg: rgba(24, 24, 27, 0.95); /* gray-900/95 */
--header-bg: rgba(24, 24, 27, 0.8); /* gray-900/80 */
```

## Typography System

### Font Stack
```css
--font-sans: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
--font-mono: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
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
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

### Letter Spacing
```css
--tracking-tighter: -0.05em;
--tracking-tight: -0.025em;
--tracking-normal: 0;
--tracking-wide: 0.025em;
--tracking-wider: 0.05em;
```

## Spacing System

Based on 4px base unit:
```css
--space-0: 0;
--space-0-5: 0.125rem;  /* 2px */
--space-1: 0.25rem;     /* 4px */
--space-1-5: 0.375rem;  /* 6px */
--space-2: 0.5rem;      /* 8px */
--space-2-5: 0.625rem;  /* 10px */
--space-3: 0.75rem;     /* 12px */
--space-4: 1rem;        /* 16px */
--space-5: 1.25rem;     /* 20px */
--space-6: 1.5rem;      /* 24px */
--space-8: 2rem;        /* 32px */
--space-10: 2.5rem;     /* 40px */
--space-12: 3rem;       /* 48px */
--space-16: 4rem;       /* 64px */
--space-20: 5rem;       /* 80px */
--space-24: 6rem;       /* 96px */
```

## Border Radius System

```css
--radius-none: 0;
--radius-sm: 0.125rem;    /* 2px */
--radius-md: 0.375rem;    /* 6px */
--radius-lg: 0.5rem;      /* 8px */
--radius-xl: 0.75rem;     /* 12px */
--radius-2xl: 1rem;       /* 16px */
--radius-3xl: 1.5rem;     /* 24px */
--radius-full: 9999px;
```

## Shadow System

### Light Theme Shadows
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
```

### Dark Theme Shadows
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
```

## Animation System

### Transitions
```css
--transition-fast: 150ms ease;
--transition-base: 200ms ease;
--transition-slow: 300ms ease;
--transition-slower: 500ms ease;

/* Common transitions */
--transition-colors: color, background-color, border-color 200ms ease;
--transition-opacity: opacity 200ms ease;
--transition-transform: transform 200ms ease;
--transition-all: all 200ms ease;
```

### Animation Curves
```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

## Semantic Token Usage

### Available Tailwind Classes

**Text Colors:**
- `text-primary` → Primary content text
- `text-secondary` → Secondary descriptions  
- `text-tertiary` → Helper text, labels
- `text-muted` → Muted, disabled text
- `text-accent-primary` → Accent colored text
- `text-success` → Success messages
- `text-warning` → Warning text
- `text-error` → Error messages

**Background Colors:**
- `bg-primary` → Main app background
- `bg-secondary` → Content areas
- `bg-tertiary` → Subtle sections
- `bg-surface` → Cards, panels
- `bg-elevated` → Modals, elevated content
- `bg-accent-primary` → Primary accent background
- `bg-accent-soft` → Subtle accent background
- `bg-success-ghost` → Success backgrounds
- `bg-warning-ghost` → Warning backgrounds
- `bg-error-ghost` → Error backgrounds

**Border Colors:**
- `border-default` → Standard borders
- `border-subtle` → Subtle borders
- `border-primary` → Primary borders
- `border-accent-primary` → Accent borders
- `border-success` → Success borders
- `border-warning` → Warning borders
- `border-error` → Error borders

## Component Patterns

### Buttons

#### Primary Button
```css
.btn-primary {
  background: var(--accent-primary);
  color: white;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-xl);
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
  transition: var(--transition-all);
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
  background: var(--accent-secondary);
  box-shadow: var(--shadow-md);
}
```

#### Ghost Button
```css
.btn-ghost {
  background: transparent;
  color: var(--text-primary);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-xl);
  transition: var(--transition-all);
}

.btn-ghost:hover {
  background: var(--hover-bg);
}
```

#### Icon Button
```css
.btn-icon {
  width: var(--space-8);
  height: var(--space-8);
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-xl);
  transition: var(--transition-all);
}

.btn-icon:hover {
  background: var(--hover-bg);
}
```

### Inputs

#### Text Input
```css
.input {
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  color: var(--text-primary);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-xl);
  font-size: var(--text-sm);
  transition: var(--transition-colors);
}

.input:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.input::placeholder {
  color: var(--text-tertiary);
}
```

### Cards

#### Base Card
```css
.card {
  background: var(--card-bg);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  backdrop-filter: blur(10px);
  transition: var(--transition-all);
  box-shadow: var(--shadow-sm);
}

.card:hover {
  border-color: var(--border-subtle);
  box-shadow: var(--shadow-md);
}
```

### Chat Components

#### Chat Bubble
```css
.chat-bubble {
  max-width: 80%;
  padding: var(--space-2-5) var(--space-4);
  border-radius: var(--radius-2xl);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

.chat-bubble--ai {
  background: var(--chat-bubble-bg);
  border: 1px solid var(--chat-bubble-border);
  color: var(--chat-bubble-text);
  box-shadow: var(--shadow-sm);
}

.chat-bubble--user {
  background: var(--accent-primary);
  color: white;
  box-shadow: var(--shadow-md);
}
```

#### Chat Avatar
```css
.chat-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  transition: var(--transition-transform);
}

.chat-avatar:hover {
  transform: scale(1.05);
}
```

### Navigation

#### Nav Item
```css
.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-xl);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  transition: var(--transition-all);
}

.nav-item:hover {
  background: var(--hover-bg);
}

.nav-item--active {
  background: var(--selected-bg);
  color: var(--selected-text);
  border: 1px solid var(--selected-border);
}
```

#### Sidebar
```css
.sidebar {
  width: 224px; /* 14rem */
  background: var(--sidebar-bg);
  border-right: 1px solid var(--border-primary);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(10px);
}
```

### Overlays

#### Modal/Command Palette
```css
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(4px);
  z-index: 50;
}

.modal {
  background: var(--bg-glass);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-xl);
  backdrop-filter: blur(10px);
  max-width: 600px;
}
```

### Progress

#### Progress Bar
```css
.progress {
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--accent-primary);
  border-radius: var(--radius-full);
  transition: width var(--transition-slower);
}
```

### Tags & Badges

#### Tag
```css
.tag {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-2-5);
  background: var(--accent-soft);
  color: var(--accent-text);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}
```

#### Badge
```css
.badge {
  padding: var(--space-0-5) var(--space-1-5);
  background: var(--bg-tertiary);
  color: var(--text-tertiary);
  border-radius: var(--radius-lg);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}
```

## Layout System

### Container
```css
.container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 var(--space-6);
}
```

### Grid
```css
.grid {
  display: grid;
  gap: var(--space-6);
}

.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
```

### Flex Utilities
```css
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.gap-1 { gap: var(--space-1); }
.gap-2 { gap: var(--space-2); }
.gap-3 { gap: var(--space-3); }
.gap-4 { gap: var(--space-4); }
```

## Accessibility Guidelines

### Focus States
- All interactive elements must have visible focus indicators
- Focus rings use `--border-focus` color with 3px offset
- Keyboard navigation must follow logical order

### Color Contrast
- Normal text: minimum 4.5:1 contrast ratio
- Large text: minimum 3:1 contrast ratio
- Interactive elements: minimum 3:1 against background

### Motion
- Respect `prefers-reduced-motion` preference
- Provide pause/stop controls for auto-playing content
- Keep animations under 300ms for responsiveness

### Text
- Base font size: 16px minimum
- Line height: 1.5 for body text
- Maximum line length: 75 characters

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

## Implementation Example

```jsx
// Example React component using the design system
function ChatMessage({ message, isAI }) {
  return (
    <div className={`flex gap-3 ${isAI ? 'items-start' : 'items-end flex-row-reverse'}`}>
      <div className="chat-avatar">
        {isAI ? <SparklesIcon /> : 'U'}
      </div>
      <div className={`chat-bubble ${isAI ? 'chat-bubble--ai' : 'chat-bubble--user'}`}>
        {message}
      </div>
    </div>
  );
}
```

## Responsive Breakpoints

```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
```

## Z-Index Scale

```css
--z-0: 0;
--z-10: 10;
--z-20: 20;
--z-30: 30;
--z-40: 40;
--z-50: 50;
```

---

This design system provides a complete foundation for building accessible, beautiful interfaces with a calm, sophisticated aesthetic. All values are optimized for both light and dark themes with proper contrast ratios and consistent visual hierarchy. The color values exactly match the mockups and current implementation. 

---

# Developer Implementation Guide

**CRITICAL UI CONVENTION: This project uses sentence case (not title case) for ALL user-facing text including page titles, headings, section titles, list titles, button copy, navigation copy, form labels, menu items, and any other UI text. Example: "Create new project" NOT "Create New Project".**

## Design System Standards

### 🚫 **CRITICAL: CSS Variable Injection Ban**

**CSS variable injection utilities are BANNED from the codebase.**

❌ **Forbidden Patterns:**
```typescript
// DO NOT USE - CSS variable injection utilities
className="bg-[var(--bg-surface)]"
className="text-[var(--text-primary)]"
className="border-[var(--border-default)]"
className="p-[var(--space-4)]"
```

✅ **Required Patterns:**
```typescript
// USE THESE - Semantic Tailwind utilities
className="bg-surface"
className="text-primary" 
className="border-border-default"
className="p-4"
```

### 🚫 **Hard-coded Color Values Ban**

**Hard-coded Tailwind palette values are BANNED from the codebase.**

❌ **Forbidden Patterns:**
```typescript
// DO NOT USE - Hard-coded palette colors
className="text-yellow-500"
className="bg-red-600"
className="border-blue-400"
```

✅ **Required Patterns:**
```typescript
// USE THESE - Semantic color tokens
className="text-warning"
className="bg-error"
className="border-accent-primary"
```

### 🚫 **Style Props Ban**

**Style props with CSS variables are BANNED from the codebase.**

❌ **Forbidden Patterns:**
```typescript
// DO NOT USE - Style props with CSS variables
style={{ padding: 'var(--space-6)' }}
style={{ color: 'var(--text-primary)' }}
style={{ backgroundColor: 'var(--bg-surface)' }}
```

✅ **Required Patterns:**
```typescript
// USE THESE - Tailwind utility classes
className="p-6"
className="text-primary"
className="bg-surface"
```

## Component Standards

### 1. Utility-First Architecture
- **Always use Tailwind utilities** instead of CSS variable injection
- **Never use style props** with CSS variables 
- **Prefer Tailwind classes** over custom styles

```tsx
// ✅ CORRECT
<div className="bg-primary text-primary p-6 rounded-lg border border-default">

// ❌ INCORRECT  
<div 
  className="bg-[var(--bg-primary)] text-[var(--text-primary)]"
  style={{ padding: 'var(--space-6)' }}
>
```

### 2. Semantic Color System
- **Use semantic tokens** instead of hardcoded colors
- **Follow color purpose** rather than appearance
- **Maintain accessibility** with proper contrast

```tsx
// ✅ CORRECT
className="text-warning bg-error border-success"

// ❌ INCORRECT
className="text-yellow-500 bg-red-500 border-green-500"
```

### 3. Button Components

**Implementation Pattern:**
```tsx
import { Button } from '@/components/ui';

// Standard usage
<Button variant="primary" size="default">Action</Button>
<Button variant="secondary" size="sm">Secondary</Button>
<Button variant="ghost" size="icon"><Icon size={16} /></Button>
```

**Available Variants:**
- `primary` - Main actions, high emphasis
- `secondary` - Secondary actions, medium emphasis  
- `ghost` - Subtle actions, low emphasis
- `outline` - Alternative secondary style
- `destructive` - Dangerous/delete actions

### 4. Modal/Overlay Patterns

**Overlay Background Standard:**
```tsx
// ✅ CORRECT - Semantic overlay token
<div className="fixed inset-0 bg-overlay flex items-center justify-center z-50">

// ❌ INCORRECT - Hardcoded overlay
<div className="fixed inset-0 bg-black bg-opacity-50">
```

**Modal Container Pattern:**
```tsx
<div className="fixed inset-0 bg-overlay flex items-center justify-center z-50">
  <div className="bg-primary rounded-xl shadow-xl border border-default max-w-md w-full p-6">
    {/* Modal content */}
  </div>
</div>
```

### 5. Form Controls

**Input Pattern:**
```tsx
<input className="w-full bg-secondary border border-default rounded-md p-3 text-primary placeholder-secondary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20" />
```

**Form Layout:**
```tsx
<div className="space-y-4">
  <div>
    <label className="block text-sm font-medium text-primary mb-1">
      Field Label
    </label>
    <input className="..." />
  </div>
</div>
```

### 6. Card Components

**Standard Card Pattern:**
```tsx
<div className="bg-surface border border-default rounded-xl p-6 shadow-sm">
  <div className="space-y-4">
    {/* Card content */}
  </div>
</div>
```

## Animation Standards

### Standardized Duration Scale
Always use semantic animation durations from our standardized scale:

```tsx
// ✅ CORRECT - Semantic durations
className="transition-all duration-150"  // Micro-interactions (hover, focus)
className="transition-all duration-200"  // State changes (active, selected)  
className="transition-all duration-300"  // Layout transitions (modal open/close)
className="transition-all duration-500"  // Complex animations (page transitions)
```

### Animation Timing Reference
| Duration | Use Case | Examples |
|----------|----------|----------|
| `150ms` | Micro-interactions | Hover states, button press, focus indicators |
| `200ms` | State changes | Active states, selection, toggle switches |
| `300ms` | Layout transitions | Modal/drawer open/close, accordion expand |
| `500ms` | Complex animations | Page transitions, multi-step workflows |

### Motion-Safe Implementation
Always respect user accessibility preferences with `motion-safe:` prefix:

```tsx
// ✅ CORRECT - Respects reduced motion preference
className="motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out"

// ✅ CORRECT - Component example
<div className="
  transform transition-all duration-200 ease-out
  motion-safe:hover:scale-105 motion-safe:hover:-translate-y-1
  hover:shadow-lg
">
  {children}
</div>
```

### Easing Functions
Use consistent easing functions for natural motion:

```tsx
// Default transitions
className="ease-out"        // Most UI transitions
className="ease-in-out"     // Balanced motion
className="ease-linear"     // Loading indicators only
```

## Accessibility Standards

### Focus Management
```tsx
// Visible focus indicators
className="focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2"

// Focus within containers
className="focus-within:border-accent-primary focus-within:ring-1 focus-within:ring-accent-primary"
```

### Semantic HTML
- Use proper heading hierarchy (`h1`, `h2`, `h3`)
- Apply `aria-label` for icon-only buttons
- Include `role` attributes for custom components
- Ensure keyboard navigation support

### Color Contrast
- All text meets WCAG AA contrast requirements
- Interactive elements have sufficient contrast
- Focus indicators are clearly visible
- Error states use accessible color combinations

## Complete Component Library

### ✅ **Core UI Components (17 Production-Ready)**

**Advanced Component Suites:**
- ✅ `ProgressRing.tsx` - Circular progress indicator with semantic colors and animations
- ✅ `Stepper.tsx` - Multi-step process navigation with orientations and states
- ✅ `HeatMapCalendar.tsx` - GitHub-style contribution calendar for data visualization
- ✅ `ColorSwatch.tsx` - Color selection with variants and palette management
- ✅ `DragOverlay.tsx` - Complete drag-and-drop system (5 specialized components)
- ✅ `TypingIndicator.tsx` - Chat typing indicators with user avatars (3 variants)
- ✅ `ToggleRow.tsx` - Settings toggle components with accessibility (3 variants)
- ✅ `Tooltip.tsx` - Advanced positioning with truncation and rich content (3 variants)

**Foundation Components:**
- ✅ `Button.tsx` - Primary button with variants (primary, secondary, ghost, outline, destructive)
- ✅ `Card.tsx` - Card component with variants (widget, card) and padding options
- ✅ `Heading.tsx` - Typography heading component with levels 1-4
- ✅ `Text.tsx` - Typography text with variants (body, secondary, tertiary, muted, caption)
- ✅ `Input.tsx` - Form input component with validation and error states

**Display & Feedback Components:**
- ✅ `Avatar.tsx` - User avatar component
- ✅ `Badge.tsx` - Status badge component
- ✅ `Progress.tsx` - Progress bar component
- ✅ `Spinner.tsx` - Loading spinner component
- ✅ `StatusBadge.tsx` - Status indicator component
- ✅ `EmptyState.tsx` - Empty state component with customizable messages
- ✅ `ErrorState.tsx` - Error state component with retry functionality

**Layout & Navigation Components:**
- ✅ `PageLayout.tsx` - Standard page wrapper with header integration
- ✅ `UnifiedHeader.tsx` - Unified header system with breadcrumbs and actions
- ✅ `TopBar.tsx` - Top navigation bar with search and user actions
- ✅ `Sidebar.tsx` - Main navigation sidebar with workspace items
- ✅ `ThemeProvider.tsx` - Theme management and context provider
- ✅ `DropdownMenu.tsx` - Dropdown menu system with triggers and content
- ✅ `FlexibleGrid.tsx` - Responsive grid system with auto-fit columns
- ✅ `AddNewCard.tsx` - Add new item card component with hover effects
- ✅ `CommandPalette.tsx` - App-wide command palette (Cmd+K) with navigation shortcuts

## Quality Gates

### Component Checklist
Before merging any component changes, verify:

- [ ] Uses Tailwind utilities exclusively
- [ ] No CSS variable injection in class names
- [ ] No style props with CSS variables
- [ ] Semantic color tokens used
- [ ] Proper accessibility attributes
- [ ] Consistent spacing patterns
- [ ] Error boundaries implemented
- [ ] Performance optimizations applied

### Design System Compliance
- [ ] Zero hardcoded colors
- [ ] Zero hardcoded spacing values
- [ ] Semantic naming conventions
- [ ] Proper component hierarchy
- [ ] Accessibility standards met
- [ ] Animation patterns followed

### Animation System Compliance
- [ ] Uses standardized duration scale (150ms, 200ms, 300ms, 500ms)
- [ ] Implements motion-safe prefixes for accessibility
- [ ] Follows proper easing functions (ease-out, ease-in-out)
- [ ] Uses GPU-accelerated properties (transform, opacity)
- [ ] Provides reduced motion alternatives
- [ ] Avoids transition-all when specific properties suffice

## Migration Guidelines

### Converting Legacy Components

**Step 1: Identify Violations**
```tsx
// Find patterns to fix:
// - className="bg-[var(--bg-primary)]"
// - style={{ padding: 'var(--space-4)' }}  
// - className="text-yellow-500"
```

**Step 2: Apply Systematic Fixes**
```tsx
// Before (violations)
<div 
  className="bg-[var(--bg-primary)] text-[var(--text-primary)]"
  style={{ padding: 'var(--space-6)', gap: 'var(--space-4)' }}
>

// After (compliant)
<div className="bg-primary text-primary p-6 gap-4">
```

**Step 3: Validate Changes**
- No CSS variable injection in className
- No style props with CSS variables  
- Semantic tokens used consistently
- Tailwind utilities applied properly

## Best Practices

### ✅ **Component Development Standards**

1. **Use Semantic Tokens Only**
   ```typescript
   // ✅ Correct
   <div className="bg-surface text-primary border-default p-6">
   
   // ❌ Never do this
   <div className="bg-[var(--bg-surface)] text-[var(--text-primary)]">
   ```

2. **Follow Animation Standards**
   ```typescript
   // ✅ Correct
   <button className="motion-safe:transition-colors motion-safe:duration-150 hover:bg-accent-primary/90">
   
   // ❌ Avoid custom timings
   <button className="transition-all duration-75">
   ```

3. **Implement Proper Accessibility**
   ```typescript
   // ✅ Include ARIA and keyboard support
   <button 
     role="button"
     aria-label="Close modal"
     onKeyDown={handleKeyDown}
     className="focus:ring-2 focus:ring-accent-primary"
   >
   ```

4. **Use TypeScript Interfaces**
   ```typescript
   // ✅ Define proper interfaces
   interface ButtonProps {
     variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive';
     size?: 'sm' | 'md' | 'lg';
     disabled?: boolean;
     children: React.ReactNode;
   }
   ```

## Troubleshooting

### Common Issues

**CSS Variable Injection Detected:**
- Replace `[var(--token)]` with semantic utility classes
- Check the design token showcase for available tokens

**Hard-coded Colors Found:**
- Replace palette values with semantic tokens
- Use state-specific tokens (success, warning, error)

**Title Case Text:**
- Convert all UI text to sentence case
- Update button labels, headings, and navigation items

**Missing Documentation:**
- Create Ladle stories for new components
- Include all variants and use cases in examples

### Resources

- **Design Token Reference:** `src/stories/DesignTokens.stories.tsx`
- **Component Examples:** All `*.stories.tsx` files in `src/components/ui/`
- **Animation Standards:** This document's Animation section
- **ESLint Rules:** `.eslintrc.design-system.json`

---

**Result:** Following these standards ensures LibreOllama maintains its **enterprise-grade design system** with consistent patterns, excellent accessibility, and comprehensive documentation. 