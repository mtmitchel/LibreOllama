# Developer's Guide to the Design System

This guide provides developers with the practical information needed to work with the LibreOllama design system. For visual guidelines, philosophy, and mockups, please refer to the documents in the `/design` directory.

## 1. Core Principles

- **Token-Based:** Our system is token-based. **Never use hardcoded values** (e.g., `#FFFFFF`, `16px`). All colors, spacing, fonts, etc., are defined as CSS variables.
- **Component-Driven:** We build and test UI components in isolation using [Ladle](https://ladle.dev/).
- **Utility-First:** We use [Tailwind CSS](https://tailwindcss.com/) for styling. Always prefer utility classes over custom CSS.

## 2. Source of Truth

- **CSS Variables:** The master list of all design tokens is defined in [`/src/core/design-system/globals.css`](../../src/core/design-system/globals.css). If you need to know what variable to use, look here first.
- **Tailwind Config:** These CSS variables are then mapped to Tailwind's theme in [`tailwind.config.ts`](../../tailwind.config.ts). This allows you to use them with standard Tailwind utility classes (e.g., `bg-bg-primary`, `text-text-primary`).

## 3. The Component Explorer (Ladle)

We use **Ladle** to view, test, and document our React components in an interactive workshop environment.

- **How to run it:**
  ```bash
  npm run ladle
  ```
- **What it's for:**
    - Viewing all available UI components.
    - Testing components in different states and themes.
    - Seeing live examples of the design system in action.
    - Ensuring new components conform to the system before integrating them.

## 4. Writing Component Stories

The component explorer is populated by "story" files. These are the foundation of our component documentation.

- **Convention:** For any component you create or modify in `src/components/ui/`, there should be a corresponding `*.stories.tsx` file.
- **Location:** Story files live alongside the components they are documenting (e.g., `Button.stories.tsx` is next to `Button.tsx`).
- **Best Practices:**
    - Create stories for all major variants of a component.
    - Use Ladle's controls to allow for interactive testing of props.
    - Write a brief description for each story explaining its purpose.

## 5. System Stories

In addition to component stories, we have "system stories" located in `src/core/design-system/`. These stories document the design system itself.

**Key System Stories:**
- `DesignTokens.stories.tsx`: Displays the full color palette and typography scale.
- `ThemeComparison.stories.tsx`: Shows components in both light and dark themes side-by-side.
- `LoadingStates.stories.tsx` & `ErrorStates.stories.tsx`: Document our patterns for loading and error states.
- `AccessibilityAudit.stories.tsx`: A place to test and verify component accessibility. 