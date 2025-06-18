# Migration Checklist for Element Containment Fix

## Pre-Migration Steps

- [ ] Create a new branch for the migration
- [ ] Backup the current working state
- [ ] Run existing tests to establish baseline
- [ ] Document any custom modifications in current code

## File Replacement

- [ ] Replace `src/features/canvas/utils/coordinateService.ts` with fixed version
- [ ] Replace `src/features/canvas/stores/slices/canvasElementsStore.ts` with fixed version
- [ ] Replace `src/features/canvas/stores/slices/sectionStore.ts` with fixed version
- [ ] Replace `src/features/canvas/stores/canvasStore.ts` with enhanced version

## Code Updates Required

### 1. Update Shape Creation Components

- [ ] Locate all shape creation handlers
- [ ] Update to use new section detection:

```typescript
// Example: In ShapeCreator component
const handleShapeCreate = (position: { x: number; y: number }, shapeType: string) => {
  const store = useCanvasStore.getState();
  
  // Find section at creation point
  const sectionId = store.findSectionAtPoint(position);
  
  // Create element with appropriate coordinates
  const newElement: CanvasElement = {
    id: `${shapeType}-${Date.now()}`,
    type: shapeType,
    x: position.x,
    y: position.y,
    width: 100,
    height: 100,
    // ... other properties
  };
  
  // If creating in a section, convert to relative coordinates
  if (sectionId) {
    const section = store.getSectionById(sectionId);
    if (section) {
      newElement.x -= section.x;
      newElement.y -= section.y;
      newElement.sectionId = sectionId;
    }
  }
  
  // Add element
  store.addElement(newElement);
  
  // Update section containment
  if (sectionId) {
    store.addElementToSection(newElement.id, sectionId);
  }
};
```

### 2. Update Konva Shape Components

- [ ] Update drag end handlers in shape components:

```typescript
// Example: In KonvaShape component
const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
  const node = e.target;
  const elementId = node.id();
  const position = node.position();
  
  // Use the new handleElementDrop method
  const store = useCanvasStore.getState();
  store.handleElementDrop(elementId, position);
  
  // Update the element's stored position
  store.updateElement(elementId, {
    x: position.x,
    y: position.y
  });
};
```

### 3. Update Section Creation

- [ ] Update section creation to capture existing elements:

```typescript
// Example: In SectionCreator component
const handleSectionCreate = (x: number, y: number, width: number, height: number) => {
  const store = useCanvasStore.getState();
  
  // Create the section
  const sectionId = store.createSection(x, y, width, height, 'New Section');
  
  // Capture any existing elements within the section bounds
  store.captureElementsAfterSectionCreation(sectionId);
};
```

### 4. Update Import Statements

- [ ] Find and replace individual store imports:

```typescript
// OLD - Remove these imports
import { useCanvasElementsStore } from './stores/slices/canvasElementsStore';
import { useSectionStore } from './stores/slices/sectionStore';

// NEW - Use combined store
import { useCanvasStore, useCanvasElements, useSections } from './stores/canvasStore';
```

### 5. Update Component Hooks

- [ ] Replace individual store hooks with combined store hooks:

```typescript
// OLD
const { elements, addElement } = useCanvasElementsStore();
const { sections, createSection } = useSectionStore();

// NEW
const { elements, addElement } = useCanvasElements();
const { sections, createSection } = useSections();
// OR use the full store
const store = useCanvasStore();
```

## Testing Checklist

### Unit Tests
- [ ] Test `findSectionAtPoint` with various coordinates
- [ ] Test `handleElementDrop` with different scenarios
- [ ] Test coordinate conversions (absolute ↔ relative)
- [ ] Test section containment updates

### Integration Tests
- [ ] Run the provided test suite: `runElementContainmentTests()`
- [ ] Test element creation in sections
- [ ] Test drag and drop between sections
- [ ] Test section movement with contained elements
- [ ] Test section deletion (elements should become free)

### Manual Testing
- [ ] Create shapes inside sections
- [ ] Drag shapes into sections (no jumping)
- [ ] Drag shapes between sections
- [ ] Move sections with elements inside
- [ ] Delete sections and verify elements remain
- [ ] Undo/redo operations with sections

## Performance Verification

- [ ] Monitor render performance with many elements
- [ ] Check for unnecessary re-renders
- [ ] Verify coordinate updates are efficient
- [ ] Test with 100+ elements and multiple sections

## Rollback Plan

If issues arise:

1. [ ] Revert to backup branch
2. [ ] Document specific issues encountered
3. [ ] Create minimal reproduction cases
4. [ ] Consider incremental migration approach

## Post-Migration

- [ ] Update documentation
- [ ] Brief team on architectural changes
- [ ] Monitor for any regression issues
- [ ] Plan for future enhancements (nested sections, etc.)

## Sign-off

- [ ] Development team approval
- [ ] QA verification complete
- [ ] Performance benchmarks acceptable
- [ ] Documentation updated
- [ ] Merge to main branch