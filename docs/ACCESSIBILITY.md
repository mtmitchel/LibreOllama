# Accessibility Essentials

Status: Current (streamlined)
Last updated: 2025-08-27

Goal
- Provide a concise, practical checklist for building and reviewing accessible UI.
- Replaces the long-form Accessibility Guidelines (moved to docs/_archive/).

Core principles
- Perceivable: Provide text alternatives, sufficient color contrast, and meaningful structure.
- Operable: Full keyboard support, focus visible, no keyboard traps.
- Understandable: Clear labels, helpful errors, predictable navigation.
- Robust: Proper semantic HTML and ARIA where necessary.

Design tokens and contrast
- Use semantic tokens (e.g., var(--text-primary), var(--bg-primary), var(--border-default)).
- Minimum contrast: 4.5:1 for body text, 3:1 for large text and UI affordances.
- Never hardcode colors in TSX; prefer semantic tokens to inherit contrast improvements.

Keyboard and focus
- All interactive elements focusable in logical order.
- Always show a visible focus ring; do not remove outline.
- Esc closes modals/menus; trap focus inside dialogs while open.

Forms
- Label every control; associate labels via for/id or wrap.
- Provide helper text and error messages with role="alert" or aria-live=polite.
- Group related inputs with fieldset/legend or FormControl groups.

ARIA basics
- Prefer native elements; use ARIA only when necessary.
- role=dialog with aria-modal=true for modals; label with aria-labelledby.
- role=menu/menuitem for context menus; manage roving tabindex for lists.

Testing checklist
- Axe-core: zero critical violations on key pages (Dashboard, Mail, Calendar, Notes, Settings).
- Keyboard-only: full workflows without mouse.
- Screen reader spot checks: headings, landmarks, form labels announced correctly.
- Color-blind simulation: ensure state and intent conveyed beyond color alone.

Resources
- WCAG 2.2 AA (target)
- WAI-ARIA Authoring Practices

For full details, see archived docs in docs/_archive/accessibility/.
