# Design System Audit

This document tracks the adoption of the LibreOllama Design System across all major pages and features of the application. The goal is to achieve 100% adoption and eliminate all legacy and one-off styling.

**Disclaimer:** This audit is a high-level overview based on the analysis of a single, representative component file for each feature area. A full, comprehensive audit would require inspecting every component within a feature. This document serves as a starting point to identify recurring patterns and prioritize refactoring efforts.

**Legend:**
- ✅ **Full Adoption:** The page exclusively uses design system tokens and components. No legacy styles.
- 🟡 **Partial Adoption:** The page primarily uses the design system but contains some legacy styles or custom components that need to be refactored.
- ❌ **No Adoption:** The page is a placeholder or uses a significant amount of legacy styling.

---

| Page / Feature | Adoption Status | Notes & Action Items |
|---|---|---|
| **Tasks** | 🟡 Partial | - **Overall:** Very high adoption. A great template for other pages.<br>- **Action Item:** The `SimpleTaskModal` uses a hardcoded `bg-black bg-opacity-50` for its overlay. This should be replaced with a design system token like `bg-overlay`. |
| **Canvas** | 🟡 Partial | - **Overall:** The page structure uses design tokens, but incorrectly.<br>- **Action Item:** Refactor the page to use Tailwind utility classes (e.g., `p-layout-gutter`) instead of `style` props with CSS variables (e.g., `style={{ padding: 'var(--space-layout-gutter)' }}`). |
| **Mail** | 🟡 Partial | - **Overall:** Mixed adoption. Component contains multiple legacy patterns.<br>- **Action Items:**<br>  - Replace direct CSS variable injection in class names (e.g., `border-[var(--border-default)]`) with Tailwind utilities (e.g., `border-border-default`).<br>  - Remove hardcoded colors (e.g., `text-yellow-500`) and use system tokens.<br>  - Replace custom button with the shared `Button` component. |
| **Calendar** | 🟡 Partial | - **Overall:** Excellent adoption of components and tokens.<br>- **Action Item:** The `ScheduleTaskModal` uses a hardcoded `bg-black bg-opacity-50` for its overlay. Replace with a system token like `bg-overlay`. |
| **Dashboard** | ✅ Full | - **Overall:** Excellent adoption. This page is a model for implementing the design system correctly. |
| **Projects** | 🟡 Partial | - **Overall:** Strong component usage, but with a significant anti-pattern in the data layer.<br>- **Action Item:** Refactor the `mockProjects` data. Remove hardcoded CSS variables (e.g., `color: 'var(--primary)'`) and replace them with semantic token names (e.g., `color: 'primary'`). The rendering component should map the token name to the appropriate style. |
| **Agents** | 🟡 Partial | - **Overall:** Good component usage, but incorrect styling implementation.<br>- **Action Items:**<br>  - Replace all direct CSS variable injection in class names (e.g., `bg-[var(--accent-ghost)]`) with Tailwind utility classes.<br>  - Refactor custom hover styles on buttons to use standard `Button` variants for consistency. |
| **Notes** | 🟡 Partial | - **Overall:** Component structure is good, but container styling is incorrect.<br>- **Action Item:** Refactor the main container `div` to use standard Tailwind utility classes (e.g., `p-4`, `gap-4`) instead of direct CSS variable injection in class names (e.g., `p-[var(--space-4)]`). |
| **Chat** | ❌ No Adoption | - **Overall:** This component has very poor adoption and requires a full refactor.<br>- **Action Items:**<br>  - Rewrite the component to remove all direct CSS variable injections (`var(...)`) and use standard Tailwind utility classes.<br>  - Remove functions that generate custom class strings (`getUserMessageStyles`) and use component variants instead.<br>  - Eliminate all style overrides on shared components like `Button` and `Card`. The component's appearance should be governed by the design system, not by local, one-off styles. | 