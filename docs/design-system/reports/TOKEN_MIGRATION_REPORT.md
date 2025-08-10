# CSS Token System Migration Report

## Critical Findings

### Current State: CATASTROPHIC FRAGMENTATION
- **322 unique CSS variables** used across codebase
- **88 variables** defined in design-tokens.css
- **~30 variables** defined in asana-tokens.css  
- **~50+ variables** defined in asana-design-system.css
- **Multiple naming conventions** in use simultaneously

### Major Issues Identified

1. **Missing Variable Definitions** (234+ variables)
   - Variables used but never defined anywhere
   - Will cause runtime CSS failures

2. **Conflicting Definitions**
   - Same concept defined multiple ways:
     - `--text-primary` vs `--asana-text-primary`
     - `--bg-canvas` vs `--asana-bg-canvas`
     - `--border-default` vs `--asana-border-default`

3. **Hardcoded Fallbacks**
   - Many components have fallback values: `var(--text-primary, #18181b)`
   - Indicates lack of confidence in token system

4. **Component-Specific Variables**
   - Calendar: `--cal-*` prefix (30+ variables)
   - Sticky notes: `--stickynote-*` prefix
   - These should be in component-scoped CSS, not global

## Recovery Plan

### Immediate Actions Required

1. **Create Comprehensive Token Audit**
   - Document every variable currently in use
   - Identify which component uses each variable
   - Determine canonical naming for each concept

2. **Unified Token System**
   - Single file: `design-system-tokens.css`
   - Consistent naming convention
   - No prefixes except for component-specific scoping

3. **Migration Mapping**
   - Create alias file for backwards compatibility
   - Gradually migrate components to canonical names
   - Remove aliases once migration complete

### Token Categories to Consolidate

1. **Colors**
   - Primary/Brand
   - Backgrounds (canvas, primary, secondary, etc.)
   - Text (primary, secondary, muted, etc.)
   - Borders
   - Semantic (success, error, warning)

2. **Typography**
   - Font families
   - Font sizes (using T-shirt sizing or numeric scale)
   - Font weights
   - Line heights

3. **Spacing**
   - Consistent 8px grid system
   - Named sizes (xs, sm, md, lg, xl, 2xl, etc.)

4. **Layout**
   - Container widths
   - Header heights
   - Sidebar widths
   - Z-index scale

5. **Animation**
   - Durations
   - Easing functions
   - Transition properties

## Recommended Token Structure

```css
:root {
  /* =================================
     COLOR PALETTE
     ================================= */
  
  /* Brand */
  --color-brand-primary: #796EFF;
  --color-brand-primary-hover: #6B5FE6;
  
  /* Neutral Scale */
  --color-neutral-0: #FFFFFF;
  --color-neutral-50: #FAFBFC;
  --color-neutral-100: #F6F7F8;
  --color-neutral-200: #E8E9EA;
  /* ... etc */
  
  /* Semantic Aliases */
  --bg-canvas: var(--color-neutral-50);
  --bg-primary: var(--color-neutral-0);
  --text-primary: var(--color-neutral-900);
  /* ... etc */
}
```

## Next Steps

1. **Phase 1**: Audit and document (COMPLETE)
2. **Phase 2**: Create unified token file with ALL variables
3. **Phase 3**: Add backwards compatibility aliases
4. **Phase 4**: Migrate components systematically
5. **Phase 5**: Remove deprecated aliases

## Risk Assessment

**Current Risk Level: CRITICAL**
- Application styling is unpredictable
- New development will introduce more fragmentation
- Testing is unreliable due to missing variables

**Time to Resolution**: 
- Full consolidation: 2-3 days
- Component migration: 1-2 weeks
- Complete cleanup: 3-4 weeks