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

- [ ] **Design System Implementation:** Complete, exhaustive implementation of design tokens and components across ALL pages and modules. *(CRITICAL - Currently Incomplete)*
- [ ] **Legacy Code Elimination:** Remove all hardcoded styles, direct CSS variable usage, and non-standard implementations. *(CRITICAL - Widespread Issues)*
- [ ] **Component Standardization:** Ensure every UI element uses unified design system components. *(CRITICAL - Inconsistent Implementation)*
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

### Design System Audit & Cleanup (CRITICAL PRIORITY)

**REALITY CHECK: Design System Implementation is Fundamentally Incomplete**

Despite claims of having a "solid design foundation," the user experience clearly demonstrates that the design system has NOT been properly implemented across the application. There are widespread inconsistencies, legacy code, and design system violations visible throughout every page.

**MANDATORY IMMEDIATE ACTION:**
- [ ] **Exhaustive Component Inventory:** Audit every single UI element on every page to identify design system violations
- [ ] **Legacy Code Elimination:** Remove ALL hardcoded styles, direct `var()` usage, and non-standard implementations
- [ ] **Complete Design System Enforcement:** Ensure 100% compliance with design tokens and component standards
- [ ] **Cross-Module Consistency Verification:** Identical elements must look and behave identically across all pages

A comprehensive **[Design System Audit](../DESIGN_SYSTEM_AUDIT.md)** has identified specific deviations that represent a fundamental failure to implement the design system properly.

- **Phase 1: Complete Page-by-Page Audit & Cleanup (MANDATORY):**
  - [ ] **Dashboard:** Audit every widget, button, card, and spacing element for design system compliance
  - [ ] **Canvas:** Eliminate ALL `style` props, hardcoded colors, and non-Tailwind implementations
  - [ ] **Mail:** Replace ALL direct `var()` injections, custom buttons, and hardcoded styles with design system components
  - [ ] **Chat:** Complete rewrite of ChatMessageBubble and all chat components to use design system without overrides
  - [ ] **Tasks:** Verify all Kanban components, modals, and interactions use design system standards
  - [ ] **Calendar:** Ensure all calendar elements, event displays, and modals follow design system
  - [ ] **Notes:** Refactor ALL container elements and editor components to use standard design system
  - [ ] **Projects:** Remove hardcoded CSS variables from mock data and implement proper design system usage
  - [ ] **Agents:** Replace ALL direct `var()` injections and ensure consistent component usage
  - [ ] **Settings:** Verify all form controls, toggles, and layout elements use design system standards
- **Phase 2: Component Consolidation & Standardization:**
  - [ ] **Modal System:** Create single, unified modal component and refactor all existing modals to use it
  - [ ] **Button Variants:** Audit all button implementations and ensure they use the standard Button component
  - [ ] **Form Controls:** Standardize all inputs, toggles, dropdowns, and form elements across pages
  - [ ] **Card Components:** Ensure all card-like elements use the unified Card component
  - [ ] **Typography:** Verify all text elements use the Text and Heading components consistently
- **Phase 3: Cross-Module Consistency Verification:**
  - [ ] **Spacing Standards:** Ensure identical spacing patterns across all pages and components
  - [ ] **Color Usage:** Verify all color implementations use design tokens, no hardcoded values
  - [ ] **Interactive States:** Standardize hover, focus, active, and disabled states across all components
  - [ ] **Animation & Transitions:** Implement consistent animation patterns using design system standards

### Technical Debt & Refactoring

- [ ] **Design System Documentation:** Create comprehensive documentation of ACTUAL implementation status vs. intended design system
- [ ] **Component Audit Tool:** Develop automated tooling to detect design system violations and non-compliant code
- [ ] **CSS Cleanup:** Remove ALL unused, duplicate, or legacy CSS from `globals.css` and component files
- [ ] **Style Guide Enforcement:** Implement linting rules to prevent future design system violations
- [ ] **Developer Design Guide Update:** Completely rewrite `DEVELOPER_DESIGN_GUIDE.md` to reflect current reality and mandatory standards
- [ ] **Quality Gates:** Establish mandatory design system compliance checks before any UI changes can be merged 