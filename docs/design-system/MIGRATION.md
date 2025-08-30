# Design System Migration (Asana-style)

Status: In progress (streamlined overview)
Last updated: 2025-08-27

Purpose
- Provide a single source of truth for the on-going migration to the Asana-inspired design system.
- Replace scattered fix plans and reports with a concise, actionable tracker.

Current snapshot
- Active token and component system in use
  - src/styles/asana-globals.css — canonical tokens and semantic aliases
  - src/styles/asana-core.css — component classes and utilities
  - src/styles/asana-layout.css — page layout primitives and spacing
- App bootstrap imports (main.tsx)
  - ../styles/asana-globals.css
  - ../styles/asana-layout.css
- Backwards-compat imports (temporary)
  - ../styles/asana-tokens.css
  - ../styles/asana-design-system.css

Coverage and progress
- Pages migrated: Sidebar and Dashboard fully styled; Tasks and Calendar largely aligned; other pages partially migrated
- Components migrated: Button, Card and several DS primitives in use; forms and overlays partially migrated
- Tokens: Consolidated and mapped; dark-mode tokens pending

What remains (prioritized)
1) Complete page migrations
   - Mail, Chat, Notes, Canvas, Projects, Agents, Settings
2) Component library alignment
   - Forms (FormControl, Select, Input, Textarea)
   - Overlays (Dialog/Modal, Toast/Alert, Tooltip)
   - Avatars, Badges, Progress indicators, Empty/Loading states
3) Theming
   - Reinstate dark mode with dedicated dark theme tokens
   - Ensure no redefinition of structural variables in themes
4) Cleanup
   - Remove deprecated css imports once unique rules are merged
   - Delete unused variations and aliases
5) QA pass
   - Visual regression, cross-browser, accessibility, performance

Migration guidelines
- One component system: Prefer src/components/ui/design-system/*
- Tokens are the source of truth: introduce or update only in asana-globals.css
- Pages use page-level styles in src/app/pages/styles/* to minimize leaks
- No hardcoded colors in components; use semantic tokens
- Reduce inline styles and Tailwind where a DS class exists

Success criteria
- Consistent styling across all pages and components
- No hardcoded colors in TSX; semantic tokens only
- Single component system in use (design-system)
- Dark and light themes supported by tokens
- Zero critical accessibility violations
- No console CSS warnings related to missing variables

Known issues
- Dark mode disabled (needs token set)
- Some widgets and forms still use mixed styling approach

Verification checklist (per migration PR)
- Visual check: looks correct in light and (when re-enabled) dark theme
- Functional check: interactive states (hover/active/focus) behave per spec
- Regression check: no layout shifts or cross-page regressions
- Accessibility check: focus ring visible, color contrast, keyboard flow

References
- Authoritative system: docs/DESIGN_SYSTEM.md
- Historical reports and inventories have been archived to docs/_archive/design-system/
