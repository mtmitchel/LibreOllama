**A REMINDER: IF A FEATURE IS ALREADY PRESENT BUT NOT LISTED IN THE MVP, DO NOT REMOVE IT.**

# General UI/UX Roadmap

This document provides a comprehensive overview of the application's design system, UI components, and the overall user experience strategy.

## Current Implementation

The application has a solid design foundation, using Tailwind CSS, a well-defined set of design tokens, and an interactive component workshop with Ladle.

### Core Architecture

- **Design Tokens:** The single source of truth for all design tokens (colors, spacing, typography, etc.) is [`/src/core/design-system/globals.css`](../../src/core/design-system/globals.css). These are exposed as CSS variables.
- **Styling:** **Tailwind CSS** is used for all styling, configured in `tailwind.config.ts` to use our design tokens.
- **Component Workshop:** We use **Ladle** (`npm run ladle`) for interactive component development, testing, and documentation. Configuration is in `.ladle/`.
- **Component Stories:** Component examples and documentation are created in `*.stories.tsx` files, located alongside the components they document. We have excellent system-level stories in `src/core/design-system/`.

## Future Work & Todos

This roadmap is aligned with the **Single-User MVP Strategy**.

### MVP Must-Haves

- [x] **Integrated Design System:** Fully integrated design tokens with Tailwind CSS. *(Existing)*
- [x] **Dark/Light Mode:** A functional toggle for dark and light themes. *(Existing)*
- [ ] **Accessibility Baseline:** Ensure core components meet WCAG standards for ARIA and keyboard navigation.

### Post-MVP Enhancements

- [ ] **Micro-interactions:** Add subtle, meaningful animations and transitions to improve user feedback.
- [ ] **Icon System Review:** Formalize the usage of `lucide-react` icons for consistency.
- [ ] **Expand Ladle Story Coverage:** Ensure all UI components in `src/components/ui/` have a corresponding `.stories.tsx` file.

### Future Vision & "Wow" Delighters

- [ ] **Contextual Command Palette (Ctrl+K):** A command palette that adapts to the current view.
- [ ] **Customizable Themes:** Allow users to create and save their own themes.
- [ ] **Built-in Onboarding Tour:** A guided tour to introduce new users to features.

### Design System Audit & Cleanup (High Priority)

A comprehensive **[Design System Audit](../DESIGN_SYSTEM_AUDIT.md)** has identified deviations from our standards. The following cleanup is a high priority.

- **Phase 1: Token & Utility Class Cleanup:**
  - [ ] **Canvas:** Refactor `style` props to use Tailwind utility classes.
  - [ ] **Mail:** Replace all direct `var()` injections and hardcoded colors with Tailwind utilities. Refactor custom buttons.
  - [ ] **Notes:** Refactor container `div` to use standard Tailwind utility classes.
  - [ ] **Agents:** Replace all direct `var()` injections with Tailwind utilities.
- **Phase 2: Architectural Refactoring:**
  - [ ] **Projects:** Refactor the data layer to remove hardcoded CSS variables from mock data.
  - [ ] **Chat:** Complete rewrite of the `ChatMessageBubble` component to properly use the design system without overrides.
- **Phase 3: Component Consolidation:**
  - [ ] **Modals:** Refactor all modal components (`Tasks`, `Calendar`) to use a single, consistent overlay style from the design system, removing hardcoded `bg-black` styles.

### Technical Debt & Refactoring

- [ ] **Formalize Design System Docs:** Ensure the `design/system/overview.md` document is kept up-to-date with the ground truth in `globals.css`.
- [ ] **CSS Cleanup:** Remove any unused or duplicate custom CSS from `globals.css` or other stylesheets.
- [ ] **Documentation:** Ensure the `DEVELOPER_DESIGN_GUIDE.md` is kept up-to-date with any changes to our workflow. 