# Design System Audit

This document tracks the adoption of the LibreOllama Design System across all major pages and features of the application. The goal is to achieve consistent implementation and eliminate legacy and non-standard styling.

**Note:** This audit is a high-level overview based on analysis of representative component files for each feature area. A comprehensive audit would require inspecting every component within each feature. This document serves as a starting point to identify patterns and prioritize improvements.

**Legend:**
- ✅ **Good Adoption:** The page primarily uses design system tokens and components with minimal issues.
- 🟡 **Partial Adoption:** The page uses the design system but contains some legacy styles or non-standard implementations.
- ❌ **Limited Adoption:** The page uses significant legacy styling or non-standard patterns.

---

| Page / Feature | Adoption Status | Notes & Action Items |
|---|---|---|
| **Tasks** | 🟡 Partial | - **Overall:** Good adoption of design system components and tokens.<br>- **Action Item:** The `SimpleTaskModal` uses hardcoded `bg-black bg-opacity-50` for overlay. Consider using a design system token like `bg-overlay`. |
| **Canvas** | 🟡 Partial | - **Overall:** Page structure uses design tokens but inconsistently.<br>- **Action Item:** Consider refactoring to use Tailwind utility classes (e.g., `p-layout-gutter`) instead of `style` props with CSS variables (e.g., `style={{ padding: 'var(--space-layout-gutter)' }}`). |
| **Mail** | 🟡 Partial | - **Overall:** Mixed adoption with some legacy patterns.<br>- **Action Items:**<br>  - Replace direct CSS variable injection in class names (e.g., `border-[var(--border-default)]`) with Tailwind utilities (e.g., `border-border-default`).<br>  - Remove hardcoded colors (e.g., `text-yellow-500`) and use system tokens.<br>  - Consider using the shared `Button` component instead of custom buttons. |
| **Calendar** | 🟡 Partial | - **Overall:** Good adoption of components and tokens.<br>- **Action Item:** The `ScheduleTaskModal` uses hardcoded `bg-black bg-opacity-50` for overlay. Consider using a system token like `bg-overlay`. |
| **Dashboard** | ✅ Good | - **Overall:** Good adoption of design system patterns. This page demonstrates proper implementation of the design system. |
| **Projects** | 🟡 Partial | - **Overall:** Good component usage, but some implementation inconsistencies.<br>- **Action Item:** Consider refactoring `mockProjects` data to remove hardcoded CSS variables (e.g., `color: 'var(--primary)'`) and use semantic token names (e.g., `color: 'primary'`). The rendering component should handle token-to-style mapping. |
| **Agents** | 🟡 Partial | - **Overall:** Good component usage, but some styling inconsistencies.<br>- **Action Items:**<br>  - Replace direct CSS variable injection in class names (e.g., `bg-[var(--accent-ghost)]`) with Tailwind utility classes.<br>  - Consider using standard `Button` variants for consistency instead of custom hover styles. |
| **Notes** | 🟡 Partial | - **Overall:** Good component structure, but some container styling inconsistencies.<br>- **Action Item:** Consider refactoring container `div` elements to use standard Tailwind utility classes (e.g., `p-4`, `gap-4`) instead of direct CSS variable injection (e.g., `p-[var(--space-4)]`). |
| **Chat** | ❌ Limited | - **Overall:** This component requires attention to improve design system adoption.<br>- **Action Items:**<br>  - Consider rewriting component to remove direct CSS variable injections (`var(...)`) and use standard Tailwind utility classes.<br>  - Remove functions that generate custom class strings (`getUserMessageStyles`) and use component variants instead.<br>  - Consider eliminating style overrides on shared components like `Button` and `Card` to maintain consistency. | 