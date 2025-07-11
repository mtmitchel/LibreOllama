**A REMINDER: IF A FEATURE IS ALREADY PRESENT BUT NOT LISTED IN THE MVP, DO NOT DELETE IT.**

# General UI/UX Roadmap

This document provides a comprehensive overview of the application's design system, UI components, and the overall user experience strategy.

## Current Implementation

The application has a design foundation using Tailwind CSS, defined design tokens, and an interactive component workshop with Ladle.

### Core Architecture

- **Design Tokens:** Design tokens (colors, spacing, typography, etc.) are defined in [`/src/core/design-system/globals.css`](../../src/core/design-system/globals.css) as CSS variables.
- **Styling:** **Tailwind CSS** is used for styling, configured in `tailwind.config.ts` to use design tokens.
- **Component Workshop:** **Ladle** (`npm run ladle`) is used for interactive component development, testing, and documentation. Configuration is in `.ladle/`.
- **Component Stories:** Component examples and documentation are created in `*.stories.tsx` files, located alongside the components they document. System-level stories exist in `src/core/design-system/`.

## Future Work & Todos

This roadmap is aligned with the **Single-User MVP Strategy**.

### MVP Must-Haves

- [ ] **Design System Consistency:** Improve consistency of design token usage across all pages and modules.
- [ ] **Component Standardization:** Ensure UI elements use unified design system components where possible.
- [x] **Dark/Light Mode:** A functional toggle for dark and light themes. *(Existing)*
- [ ] **Accessibility Baseline:** Ensure core components meet WCAG standards for ARIA and keyboard navigation.

### Post-MVP Enhancements

- [ ] **Micro-interactions:** Add subtle, meaningful animations and transitions to improve user feedback.
- [ ] **Icon System Review:** Formalize the usage of `lucide-react` icons for consistency.
- [ ] **Expand Ladle Story Coverage:** Ensure all UI components in `src/components/ui/` have corresponding `.stories.tsx` files.

### Future Vision & "Wow" Delighters

- [ ] **Contextual Command Palette (Ctrl+K):** A command palette that adapts to the current view.
- [ ] **Customizable Themes:** Allow users to create and save their own themes.
- [ ] **Built-in Onboarding Tour:** A guided tour to introduce new users to features.

### Design System Improvements

The design system implementation has room for improvement across various pages and components.

**Areas for Enhancement:**
- [ ] **Component Inventory:** Conduct a comprehensive audit of all UI elements to identify design system compliance.
- [ ] **Legacy Code Cleanup:** Remove hardcoded styles and direct `var()` usage in favor of Tailwind utility classes.
- [ ] **Cross-Module Consistency:** Ensure similar elements look and behave consistently across all pages.

A comprehensive **[Design System Audit](../DESIGN_SYSTEM_AUDIT.md)** has identified specific areas that could benefit from improved design system adoption.

- **Phase 1: Page-by-Page Review:**
  - [ ] **Dashboard:** Review all widgets, buttons, cards, and spacing for design system compliance
  - [ ] **Canvas:** Address `style` props and hardcoded implementations
  - [ ] **Mail:** Replace direct `var()` injections and custom buttons with design system components
  - [ ] **Chat:** Improve design system adoption in ChatMessageBubble and related components
  - [ ] **Tasks:** Verify all Kanban components and modals use design system standards
  - [ ] **Calendar:** Ensure all calendar elements and event displays follow design system
  - [ ] **Notes:** Refactor container elements to use standard design system patterns
  - [ ] **Projects:** Address hardcoded CSS variables in data structures
  - [ ] **Agents:** Replace direct `var()` injections with proper component usage
  - [ ] **Settings:** Verify all form controls and layout elements use design system standards
- **Phase 2: Component Consolidation:**
  - [ ] **Modal System:** Create unified modal component and refactor existing modals
  - [ ] **Button Variants:** Ensure all button implementations use the standard Button component
  - [ ] **Form Controls:** Standardize all inputs, toggles, dropdowns, and form elements
  - [ ] **Card Components:** Ensure all card-like elements use the unified Card component
  - [ ] **Typography:** Verify all text elements use Text and Heading components consistently
- **Phase 3: Consistency Verification:**
  - [ ] **Spacing Standards:** Ensure consistent spacing patterns across all pages
  - [ ] **Color Usage:** Verify all color implementations use design tokens
  - [ ] **Interactive States:** Standardize hover, focus, active, and disabled states
  - [ ] **Animation & Transitions:** Implement consistent animation patterns

### Technical Debt & Refactoring

- [ ] **Design System Documentation:** Create comprehensive documentation of implementation standards
- [ ] **Component Audit Tool:** Develop tooling to detect design system violations
- [ ] **CSS Cleanup:** Remove unused, duplicate, or legacy CSS from `globals.css` and component files
- [ ] **Style Guide Enforcement:** Implement linting rules to prevent future design system violations
- [ ] **Developer Design Guide Update:** Update `DEVELOPER_DESIGN_GUIDE.md` to reflect current practices and standards
- [ ] **Quality Gates:** Establish design system compliance checks for UI changes 