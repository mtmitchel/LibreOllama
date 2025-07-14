# LibreOllama Design System v2.0

## 1. Introduction

**Purpose:** This document outlines the design system for LibreOllama Workspace. Its purpose is to ensure visual and experiential consistency across the entire application, streamline the design and development process, and provide a shared language for all team members.

**Core Philosophy:** LibreOllama embraces a refined, subtle aesthetic with generous whitespace, soft colors, and thoughtful contrast levels that reduce visual fatigue while maintaining excellent accessibility.

## 2. Foundations

### 2.1. Color Palette

The color palette is designed to be subtle, refined, and accessible for both light and dark themes. All colors match the comprehensive mockups and prioritize user comfort with reduced visual noise.

#### **Primary Accent Colors**
```css
--accent-primary: #6366f1    /* Indigo 500 - Primary actions, highlights */
--accent-secondary: #4f46e5  /* Indigo 600 - Hover/pressed states */
--accent-soft: rgba(224, 231, 255, 0.3)    /* Indigo 100/30 - Subtle backgrounds */
--accent-ghost: rgba(224, 231, 255, 0.1)   /* Indigo 100/10 - Very subtle highlights */
--accent-text: #4f46e5      /* Indigo 600 - Accent text color */
```

#### **Background Colors (Light Theme)**
```css
--bg-primary: #fafafa       /* Gray 50 - Main app background */
--bg-secondary: #ffffff     /* White - Content areas */
--bg-tertiary: rgba(244, 244, 245, 0.6)    /* Gray 100/60 - Subtle sections */
--bg-surface: rgba(255, 255, 255, 0.8)     /* White/80 - Cards, panels */
--bg-elevated: rgba(249, 250, 251, 0.8)    /* Gray 50/80 - Modals, elevated content */
--bg-overlay: rgba(255, 255, 255, 0.8)     /* Overlay backgrounds */
```

#### **Text Colors (Light Theme)**
```css
--text-primary: #18181b     /* Gray 900 - Primary content text */
--text-secondary: #52525b   /* Gray 600 - Secondary text */
--text-tertiary: #71717a    /* Gray 500 - Tertiary/helper text */
--text-muted: #a1a1aa       /* Gray 400 - Muted/disabled text */
--text-inverted: #ffffff    /* White - Text on dark backgrounds */
```

#### **Border Colors (Light Theme)**
```css
--border-primary: rgba(228, 228, 231, 0.6)   /* Gray 200/60 - Primary borders */
--border-default: rgba(228, 228, 231, 0.6)   /* Gray 200/60 - Standard borders */
--border-subtle: rgba(228, 228, 231, 0.4)    /* Gray 200/40 - Subtle borders */
--border-focus: #6366f1     /* Indigo 500 - Focus states */
```

#### **Interactive States**
```css
--hover-bg: rgba(244, 244, 245, 0.4)         /* Gray 100/40 - Hover backgrounds */
--active-bg: rgba(224, 231, 255, 0.5)        /* Indigo 100/50 - Active backgrounds */
--selected-bg: #eef2ff      /* Indigo 50 - Selected item backgrounds */
--selected-border: #c7d2fe  /* Indigo 200 - Selected item borders */
--selected-text: #4338ca    /* Indigo 700 - Selected item text */
```

#### **Semantic Status Colors**
```css
--success: #10b981          /* Green 500 - Success states */
--success-fg: #059669       /* Green 600 - Success text */
--success-ghost: #f0fdf4    /* Green 50 - Success backgrounds */

--warning: #f59e0b          /* Amber 500 - Warning states */
--warning-fg: #d97706       /* Amber 600 - Warning text */
--warning-ghost: #fffbeb    /* Amber 50 - Warning backgrounds */

--error: #ef4444            /* Red 500 - Error states */
--error-fg: #dc2626         /* Red 600 - Error text */
--error-ghost: #fef2f2      /* Red 50 - Error backgrounds */
```

#### **Component-Specific Colors**
```css
--chat-bubble-bg: #fafafa                     /* Gray 50 - Chat bubble backgrounds */
--chat-bubble-border: rgba(228, 228, 231, 0.6) /* Gray 200/60 - Chat bubble borders */
--input-bg: #fafafa         /* Gray 50 - Input field backgrounds */
--card-bg: rgba(255, 255, 255, 0.8)          /* White/80 - Card backgrounds */
--sidebar-bg: rgba(249, 250, 251, 0.8)       /* Gray 50/80 - Sidebar backgrounds */
--header-bg: rgba(255, 255, 255, 0.8)        /* White/80 - Header backgrounds */
```

### 2.2. Dark Theme Colors

#### **Background Colors (Dark Theme)**
```css
--bg-primary: #18181b       /* Gray 900 - Main app background */
--bg-secondary: #1f1f23     /* Gray 850 - Content areas */
--bg-tertiary: rgba(39, 39, 42, 0.5)         /* Gray 800/50 - Subtle sections */
--bg-surface: rgba(31, 31, 35, 0.5)          /* Gray 850/50 - Cards, panels */
--bg-elevated: rgba(24, 24, 27, 0.95)        /* Gray 900/95 - Modals */
--bg-overlay: rgba(24, 24, 27, 0.8)          /* Gray 900/80 - Overlays */
```

#### **Text Colors (Dark Theme)**
```css
--text-primary: #f4f4f5     /* Gray 100 - Primary content text */
--text-secondary: #d4d4d8   /* Gray 300 - Secondary text */
--text-tertiary: #a1a1aa    /* Gray 400 - Tertiary text */
--text-muted: #71717a       /* Gray 500 - Muted text */
--text-inverted: #18181b    /* Gray 900 - Text on light backgrounds */
```

### 2.3. Typography

**Font Family:** Inter, system-ui, sans-serif

**Font Scale:**
- **Page Titles:** 28px-32px, Bold (700)
- **Section Titles:** 18px-20px, Semi-Bold (600)  
- **Body Text:** 14px-16px, Regular (400) or Medium (500)
- **Secondary Text:** 12px-14px, Regular (400)
- **Small Text:** 11px-12px, Regular (400)

**Line Heights:** Body 1.5-1.6, Headings 1.2-1.4

**Text Case:** Sentence case for all UI text (not title case)

### 2.4. Spacing & Layout

**Grid System:** 4px base unit with 8px grid alignment

**Spacing Scale:**
```css
--space-1: 4px      --space-2: 8px      --space-3: 12px
--space-4: 16px     --space-5: 20px     --space-6: 24px
--space-8: 32px     --space-10: 40px    --space-12: 48px
```

**Border Radius:**
```css
--radius-sm: 2px    --radius-md: 6px    --radius-lg: 8px
--radius-xl: 12px   --radius-2xl: 16px  --radius-full: 9999px
```

### 2.5. Semantic Token Usage

#### **Available Tailwind Classes:**

**Text Colors:**
- `text-primary` - Primary content text
- `text-secondary` - Secondary text  
- `text-tertiary` - Helper text
- `text-muted` - Disabled/muted text
- `text-accent-primary` - Accent colored text
- `text-success`, `text-warning`, `text-error` - Status colors

**Background Colors:**
- `bg-primary` - Main app background
- `bg-secondary` - Content areas
- `bg-tertiary` - Subtle sections
- `bg-surface` - Cards and panels
- `bg-elevated` - Modals and elevated content
- `bg-accent-primary` - Primary accent background
- `bg-accent-soft` - Subtle accent background
- `bg-success-ghost`, `bg-warning-ghost`, `bg-error-ghost` - Status backgrounds

**Border Colors:**
- `border-default` - Standard borders
- `border-subtle` - Subtle borders
- `border-primary` - Primary borders
- `border-accent-primary` - Accent borders
- `border-success`, `border-warning`, `border-error` - Status borders

## 3. Implementation Guidelines

### 3.1. Required Patterns

✅ **Use semantic Tailwind utilities:**
```tsx
className="bg-surface text-primary border-default"
```

❌ **Never use CSS variable injection:**
```tsx
className="bg-[var(--bg-surface)]"  // BANNED
```

❌ **Never use hardcoded colors:**
```tsx
className="text-gray-600 bg-blue-500"  // BANNED
```

### 3.2. Color Application Rules

1. **Primary accent sparingly** - Use `accent-primary` only for key actions and highlights
2. **Subtle by default** - Prefer `bg-surface` and `text-secondary` for most content
3. **Status colors meaningfully** - Use `success`/`warning`/`error` only for actual status
4. **Consistent hierarchy** - Follow text color hierarchy (primary → secondary → tertiary → muted)

### 3.3. Accessibility Standards

- **WCAG 2.1 AA compliance** - All color combinations meet contrast requirements
- **Focus indicators** - Clear focus states using `border-focus`
- **Motion respect** - Reduced motion patterns for accessibility
- **Color independence** - Never rely solely on color to convey information

---

**Note:** This design system reflects the actual implemented colors that match the comprehensive mockups. All components across the application use these semantic tokens for consistent, maintainable styling.