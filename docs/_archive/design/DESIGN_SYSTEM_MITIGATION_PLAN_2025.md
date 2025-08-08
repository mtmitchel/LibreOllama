# Design System Mitigation Plan
**Date**: January 2025  
**Priority**: CRITICAL  
**Based on**: Component Audit Report findings

## Executive Summary
The design system migration is fundamentally broken. Only CSS files were changed, not component implementations. This plan outlines systematic fixes to properly implement the Asana design system across all pages.

## Reference Implementation
**The Notes page (`src/features/notes/components/NotesPage.tsx`) is our ONLY correct implementation.**

### Correct Pattern from Notes:
```jsx
<div className="flex h-full gap-6 bg-primary p-6">
  <Sidebar isOpen={isOpen} onToggle={toggle} />
  <div className="border-border-primary flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
    {/* Content */}
  </div>
  <ContextSidebar isOpen={isOpen} />
</div>
```

Key elements:
- `p-6` (24px padding) wrapper
- `gap-6` (24px gap) between components  
- Proper sidebar components
- Card wrapper for main content
- Consistent spacing throughout

## Phase 1: Critical Foundation (Day 1)

### 1.1 Create Core CSS Framework
**Priority**: IMMEDIATE

1. **Consolidate CSS files**
   - Create `src/styles/asana-core.css` as single source of truth
   - Define all base classes with proper padding
   - Remove conflicting CSS files

2. **Define standard page wrapper**
   ```css
   .asana-app-layout {
     display: flex;
     height: 100vh;
     padding: 24px;
     gap: 24px;
     background: #FAFBFC;
   }
   ```

3. **Create component classes**
   - `.asana-sidebar` - Standard sidebar
   - `.asana-content` - Main content area
   - `.asana-card` - Card wrapper
   - `.asana-button-*` - Button variants
   - `.asana-input-*` - Input variants

### 1.2 Update Base Page Component
Create a standard page template component that all pages will use.

## Phase 2: Systematic Page Updates (Days 2-3)

### Order of Implementation:
1. **Dashboard** - Simplest structure
2. **Chat** - Has sidebar pattern
3. **Mail** - Already has good sidebar
4. **Projects** - Fix broken sidebar
5. **Agents** - Add sidebar structure
6. **Settings** - Update content area
7. **Canvas** - Fix toolbar and structure
8. **Calendar** - Major restructure needed
9. **Tasks** - Major restructure needed

### For Each Page:

#### Step 1: Add Proper Wrapper
```jsx
// BEFORE
<div className="asana-page">
  {/* content */}
</div>

// AFTER  
<div className="asana-app-layout">
  {/* content with proper spacing */}
</div>
```

#### Step 2: Fix Sidebar Structure
- Ensure sidebar follows Notes pattern
- Remove any custom implementations
- Use consistent sidebar component

#### Step 3: Remove Tailwind Classes
- Replace all Tailwind utilities with Asana classes
- Document each replacement in changelog

#### Step 4: Test and Verify
- Check padding visually
- Verify no horizontal scroll
- Ensure consistent spacing

## Phase 3: Component Library (Day 4)

### 3.1 Create Reusable Components

#### Button Component
```jsx
// AsanaButton.tsx
export const AsanaButton = ({ variant = 'primary', size = 'medium', children, ...props }) => {
  const className = `asana-btn asana-btn-${variant} asana-btn-${size}`;
  return <button className={className} {...props}>{children}</button>;
};
```

#### Card Component
```jsx
// AsanaCard.tsx
export const AsanaCard = ({ children, padding = true }) => {
  const className = padding ? 'asana-card asana-card-padded' : 'asana-card';
  return <div className={className}>{children}</div>;
};
```

### 3.2 Replace UI Library Components
- Audit current `components/ui` usage
- Create Asana equivalents
- Systematic replacement

## Phase 4: Testing & Validation (Day 5)

### 4.1 Visual Testing
- Screenshot each page
- Compare with Asana reference
- Document discrepancies

### 4.2 Functional Testing
- Test all interactions
- Verify modals/dropdowns
- Check responsive behavior

### 4.3 Performance Testing
- Check for CSS conflicts
- Verify no duplicate styles
- Optimize final bundle

## Implementation Schedule

### Day 1 (Today):
- [ ] Create asana-core.css
- [ ] Update Dashboard page
- [ ] Update Chat page
- [ ] Document in CHANGELOG

### Day 2:
- [ ] Update Mail page
- [ ] Fix Projects page completely
- [ ] Update Agents page
- [ ] Document changes

### Day 3:
- [ ] Update Settings page
- [ ] Fix Canvas page
- [ ] Document changes

### Day 4:
- [ ] Restructure Calendar page
- [ ] Restructure Tasks page
- [ ] Create component library
- [ ] Document changes

### Day 5:
- [ ] Final testing
- [ ] Bug fixes
- [ ] Documentation update
- [ ] Final changelog entry

## Success Metrics

### Must Have:
- ✅ All pages have 24px padding wrapper
- ✅ No horizontal scrolling
- ✅ Consistent spacing between all components
- ✅ All Tailwind classes removed
- ✅ Single CSS source of truth

### Should Have:
- ✅ Reusable component library
- ✅ Consistent sidebars across pages
- ✅ Proper empty states
- ✅ Consistent modals

### Nice to Have:
- ✅ Animation consistency
- ✅ Hover state consistency
- ✅ Focus state consistency

## Risk Mitigation

### Potential Issues:
1. **Breaking existing functionality**
   - Solution: Test each change incrementally
   - Create feature branch for changes

2. **CSS conflicts**
   - Solution: Use specific class names
   - Remove old CSS files systematically

3. **Component dependencies**
   - Solution: Update imports carefully
   - Test each component in isolation

## Rollback Plan
If critical issues arise:
1. Git reset to commit `ee7b3662`
2. Re-apply changes incrementally
3. Test more thoroughly

## Documentation Requirements

### For Each Change:
1. Update CHANGELOG.md with:
   - Page/component affected
   - Classes changed
   - Visual impact
   
2. Update component documentation
3. Add inline comments for complex changes
4. Screenshot before/after for major changes

## Definition of Done

A page is considered "done" when:
- [ ] Has proper 24px padding wrapper
- [ ] No Tailwind classes remain
- [ ] Follows Notes page structure
- [ ] All components use Asana classes
- [ ] No horizontal scroll
- [ ] Consistent spacing throughout
- [ ] Documented in changelog
- [ ] Visually tested
- [ ] Functionally tested