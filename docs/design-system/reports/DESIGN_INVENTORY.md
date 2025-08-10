# LibreOllama design inventory (pages, components, styles)

Last updated: 2025-02-07

## Canonical sources
- Tokens and semantic aliases: `src/styles/asana-globals.css`
- Component classes and utilities: `src/styles/asana-core.css`
- Page layout primitives: `src/styles/asana-layout.css`
- Authoritative design system doc: `docs/DESIGN_SYSTEM.md`
- Supporting spec: `docs/design-system/ASANA_DESIGN_SYSTEM_COMPLETE.md`

## App bootstrap imports
- `src/app/main.tsx`
  - `../styles/asana-globals.css`
  - `../styles/asana-tokens.css` (compat; slated for removal post-merge)
  - `../styles/asana-design-system.css` (compat; slated for removal post-merge)
  - `../styles/asana-layout.css`

## Page → style mapping (current)
- `src/app/pages/Dashboard.tsx`
  - `../../styles/asana-core.css`
  - `./styles/dashboard-asana-v3.css`
- `src/app/pages/Settings.tsx`
  - `./styles/settings-asana-v2.css`
- `src/app/pages/Projects.tsx`
  - `./styles/page-asana-v2.css`
- `src/app/pages/Notes.tsx`
  - `./styles/page-asana-v2.css`
- `src/app/pages/Mail.tsx`
  - `./styles/mail-asana-v2.css`
- `src/app/pages/Chat.tsx`
  - `./styles/chat-asana.css`
- `src/app/pages/Canvas.tsx`
  - `./styles/page-asana-v2.css`
- `src/app/pages/Agents.tsx`
  - `./styles/page-asana-v2.css`
- `src/app/pages/CalendarCustom.tsx`
  - `./styles/calendar-asana.css`
  - `./styles/calendar-custom.css`
- `src/app/pages/TasksAsanaClean.tsx`
  - `./styles/TasksAsanaClean.css`
  - `../../styles/asana-tokens.css` (compat)
  - `../../styles/asana-design-system.css` (compat)

## Component-level styles
- `src/components/ui/index.tsx`
  - `./ui-asana.css` (to be merged into `src/styles/asana-core.css` after diff)
- Various Kanban/Task components import `../../styles/asana-design-system.css` (compat)

## Duplicative/overlapping CSS (to merge)
- Tokens overlap: `src/styles/asana-tokens.css` ↔ `src/styles/asana-globals.css`
- Component classes overlap: `src/styles/asana-design-system.css` ↔ `src/styles/asana-core.css` ↔ `src/components/ui/ui-asana.css`
- Page variants: `dashboard-asana.css` / `dashboard-asana-v2.css` / `dashboard-asana-v3.css` (in use: v3)

## Consolidation steps (tracked in migration status)
- [ ] Merge any unique tokens from `asana-tokens.css` into `asana-globals.css` and remove the extra import
- [ ] Merge unique component rules from `asana-design-system.css` and `ui-asana.css` into `asana-core.css`
- [ ] Standardize page imports to `page-asana-v2.css` and `dashboard-asana-v3.css`; remove older variants once pages are verified
- [ ] Keep `calendar-asana.css` and `TasksAsanaClean.css` as reference exemplars
- [ ] Verify no horizontal scrollbar; enforce 24px page padding and component gaps
- [ ] Preserve focus rings, reduced-motion behavior, and contrast variables

## Design-system components (authoritative)
Source: `src/components/ui/design-system/index.ts`
- Interactive: Button, Select (NativeSelect), Toggle, ContextMenu
- Overlays: Popover, Dropdown (ActionMenu, SelectDropdown), Tooltip, Dialog, ConfirmDialog, Toast
- Data/display: Badge (Count/Status/Group), Tag (Hash/Color/Group/Input), Avatar (Group/User/Bot/Team), ProgressRing (Bar/Spinner/Steps), HeatMapCalendar (ActivityCalendar)
- Layout: Stack (VStack/HStack/FormStack/ListStack/ButtonGroup), Grid (GridItem/CardGrid/DashboardGrid/SidebarLayout/MasonryGrid/AutoGrid), Box (Center/Square/Circle/Flex/AspectRatio), Container (Section/Page/Article/Hero)
- Forms: FormControl (Label/Helper/Error/Success/Hint/Input/Textarea/Group, useFormControl)

## Notes
- Archived/unused CSS will be moved to `src/styles/_archive/unused/` as verified unused to avoid breaking functionality.
- This inventory will be updated as consolidation proceeds.
