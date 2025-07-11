# Developer's Guide to the Design System

This guide provides developers with practical information for working with the LibreOllama design system. For visual guidelines, philosophy, and mockups, please refer to the documents in the `/design` directory.

## 1. Core Principles

- **Token-Based:** The system uses design tokens defined as CSS variables. Use these tokens instead of hardcoded values (e.g., `#FFFFFF`, `16px`).
- **Component-Driven:** UI components are built and tested in isolation using [Ladle](https://ladle.dev/).
- **Utility-First:** The system uses [Tailwind CSS](https://tailwindcss.com/) for styling. Prefer utility classes over custom CSS.

## 2. Source of Truth

- **CSS Variables:** Design tokens are defined in [`/src/core/design-system/globals.css`](../../src/core/design-system/globals.css). This is the primary reference for available variables.
- **Tailwind Config:** CSS variables are mapped to Tailwind's theme in [`tailwind.config.ts`](../../tailwind.config.ts). This enables usage with standard Tailwind utility classes (e.g., `bg-bg-primary`, `text-text-primary`).

## 3. The Component Explorer (Ladle)

**Ladle** is used to view, test, and document React components in an interactive environment.

- **How to run it:**
  ```bash
  npm run ladle
  ```
- **What it's for:**
    - Viewing available UI components
    - Testing components in different states and themes
    - Seeing examples of the design system in action
    - Ensuring new components work properly before integration

## 4. Writing Component Stories

The component explorer is populated by "story" files that document components.

- **Convention:** For components in `src/components/ui/`, create a corresponding `*.stories.tsx` file.
- **Location:** Story files are located alongside the components they document (e.g., `Button.stories.tsx` next to `Button.tsx`).
- **Best Practices:**
    - Create stories for major variants of a component
    - Use Ladle's controls for interactive testing of props
    - Include brief descriptions explaining each story's purpose

## 5. System Stories

System stories in `src/core/design-system/` document the design system itself.

**Key System Stories:**
- `DesignTokens.stories.tsx`: Displays the color palette and typography scale
- `ThemeComparison.stories.tsx`: Shows components in light and dark themes
- `LoadingStates.stories.tsx` & `ErrorStates.stories.tsx`: Document patterns for loading and error states
- `AccessibilityAudit.stories.tsx`: Testing and verification of component accessibility 