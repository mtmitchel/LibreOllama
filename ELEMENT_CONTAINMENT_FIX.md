# LibreOllama Canvas Element Containment Fix

## Problem Summary

We identified two core bugs with canvas elements and section containers:

1. **Creation Bug**: New elements created inside a section aren't registered as children of that section.
2. **Drop Bug**: When dragging elements into a section, they "jump" to incorrect positions due to coordinate misalignment.

### Root Cause

The issues stemmed from:
- Incorrect coordinate system translation between screen, world, and section-local coordinates
- Circular dependencies between store slices preventing proper cross-slice communication
- The `findSectionAtPoint` function using raw screen coordinates instead of transformed canvas coordinates

## Architectural Solution

### 1. Remove Circular Dependencies

The original architecture had individual store slices trying to reference each other and the combined store before it existed. This created circular dependencies.

**Solution**: Move all cross-slice operations to the combined store level, where all slices are available.

### 2. Fixed Files Created

#### `coordinateService.fixed.ts`
- Removed direct store access
- Modified `findSectionAtPoint` to accept sections array and stage as parameters
- Maintains pure utility functions without store dependencies

Key change:
```typescript
static findSectionAtPoint(
  point: { x: number; y: number }, 
  sections: SectionElement[], 
  stage?: Konva.Stage | null
): string | null
```

#### `canvasElementsStore.fixed.ts`
- Removed the problematic `handleElementDrop` implementation that tried to access the combined store
- Added a placeholder method that will be overridden in the combined store
- Kept all element-specific operations within the slice

#### `sectionStore.fixed.ts`
- Removed the `setElementParent` method that tried to access elements directly
- Simplified element containment methods to only track IDs
- Added `captureElementsInSection` method that accepts element IDs from the combined store

#### `canvasStore.enhanced.ts`
- Implements all cross-slice operations at the combined store level
- Added enhanced methods:
  - `findSectionAtPoint`: Uses fixed coordinate service with proper parameters
  - `handleElementDrop`: Handles element drops with proper coordinate conversion
  - `captureElementsAfterSectionCreation`: Captures existing elements when a section is created
  - `updateElementCoordinatesOnSectionMove`: Updates elements when sections move
  - `convertElementToAbsoluteCoordinates`: Converts element from relative to absolute
  - `convertElementToRelativeCoordinates`: Converts element from absolute to relative

## Integration Steps

### 1. Backup Current Files
```bash
# Create backups
cp src/features/canvas/utils/coordinateService.ts src/features/canvas/utils/coordinateService.backup.ts
cp src/features/canvas/stores/slices/canvasElementsStore.ts src/features/canvas/stores/slices/canvasElementsStore.backup.ts
cp src/features/canvas/stores/slices/sectionStore.ts src/features/canvas/stores/slices/sectionStore.backup.ts
cp src/features/canvas/stores/canvasStore.ts src/features/canvas/stores/canvasStore.backup.ts
```

### 2. Replace Files
```bash
# Replace with fixed versions
cp src/features/canvas/utils/coordinateService.fixed.ts src/features/canvas/utils/coordinateService.ts
cp src/features/canvas/stores/slices/canvasElementsStore.fixed.ts src/features/canvas/stores/slices/canvasElementsStore.ts
cp src/features/canvas/stores/slices/sectionStore.fixed.ts src/features/canvas/stores/slices/sectionStore.ts
cp src/features/canvas/stores/canvasStore.enhanced.ts src/features/canvas/stores/canvasStore.ts
```

### 3. Update Import Paths

If there are any components importing from the individual store files, update them to use the combined store:

```typescript
// Old
import { useCanvasElementsStore } from './stores/slices/canvasElementsStore';

// New
import { useCanvasElements } from './stores/canvasStore';
```

### 4. Update Element Creation Logic

Ensure that when elements are created, the section detection uses the new method:

```typescript
// In your element creation handler
const store = useCanvasStore.getState();
const sectionId = store.findSectionAtPoint(position);

if (sectionId) {
  newElement.sectionId = sectionId;
  // Element coordinates should be relative to section
  const section = store.getSectionById(sectionId);
  if (section) {
    newElement.x -= section.x;
    newElement.y -= section.y;
  }
}

store.addElement(newElement);

if (sectionId) {
  store.addElementToSection(newElement.id, sectionId);
}
```

### 5. Update Drag and Drop Handler

In your drag end handler:

```typescript
const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
  const elementId = e.target.id();
  const position = e.target.position();
  
  const store = useCanvasStore.getState();
  store.handleElementDrop(elementId, position);
};
```

## Testing the Fix

### Test 1: Element Creation Inside Section
1. Create a section on the canvas
2. Select a shape tool (rectangle, circle, etc.)
3. Click inside the section to create an element
4. **Expected**: Element should be created as a child of the section
5. **Verify**: Move the section and confirm the element moves with it

### Test 2: Drag Element Into Section
1. Create an element on the canvas (outside any section)
2. Create a section nearby
3. Drag the element into the section
4. **Expected**: Element should snap to correct position relative to section
5. **Verify**: No "jumping" behavior, element maintains visual position

### Test 3: Drag Element Between Sections
1. Create two sections
2. Create an element in the first section
3. Drag the element to the second section
4. **Expected**: Element transfers smoothly between sections
5. **Verify**: Coordinates update correctly, no visual jumps

### Test 4: Section Movement
1. Create a section with multiple elements inside
2. Move the section
3. **Expected**: All contained elements move with the section
4. **Verify**: Relative positions are maintained

### Test 5: Coordinate System Verification
1. Create an element at canvas position (100, 100)
2. Create a section at position (50, 50)
3. Drag the element into the section
4. **Expected**: Element's relative coordinates should be approximately (50, 50)
5. **Verify**: Check element's x, y values in the store

## Coordinate System Design

The fixed implementation uses the following coordinate system:

- **Canvas (Absolute) Coordinates**: Used for elements without a `sectionId`
- **Section-Relative Coordinates**: Used for elements with a `sectionId`
- **Automatic Transform**: Konva Groups handle the visual transform, so contained elements automatically appear at the correct position

This design eliminates the need for manual coordinate updates when sections move, as the Group transform handles positioning automatically.

## Performance Considerations

The enhanced store maintains performance by:
- Only updating coordinates when necessary (during drops and section assignment)
- Using Konva's built-in group transforms for rendering
- Avoiding unnecessary re-renders through proper state updates

## Future Enhancements

Consider implementing:
1. Nested sections (sections within sections)
2. Section locking to prevent accidental element transfers
3. Bulk element operations for better performance with many elements
4. Visual feedback during drag operations to show target section

## Troubleshooting

### Elements Not Staying in Sections
- Verify `sectionId` is set on the element
- Check that the element is in the section's `containedElementIds` array
- Ensure coordinates are relative to the section

### Coordinate Jumps
- Verify coordinate conversion is happening in `handleElementDrop`
- Check that the stage transform is being applied in `findSectionAtPoint`
- Ensure pointer position is being used when available

### Circular Dependency Errors
- Ensure you're using the enhanced store, not importing individual slices
- Verify all cross-slice operations are in the combined store
- Check that slice files don't import from the combined store