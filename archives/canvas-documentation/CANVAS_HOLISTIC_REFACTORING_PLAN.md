# Canvas Module Holistic Refactoring Plan
## Executive Summary

After comprehensive analysis of the LibreOllama Canvas architecture, I've identified that **most of the 8 reported bugs stem from the same root architectural issues**: lack of proper Konva grouping, manual coordinate conversion, and duplicate event handling. This plan provides a systematic approach to fix these issues while maintaining backward compatibility.

## Current Architecture Analysis

### ✅ Strengths
- Well-organized modular structure with clear separation of concerns
- Sophisticated state management with Zustand
- Good error boundaries and performance optimizations
- Recent fixes for multi-element dragging and section selection

### ❌ Core Issues
1. **Manual Coordinate Conversion**: Elements manually calculate absolute positions instead of using Konva Groups
2. **Duplicate Rendering Logic**: Different code paths for section children vs regular elements
3. **Event Handler Complexity**: Separate event handlers with manual coordinate conversion
4. **No True Grouping**: Related elements (shapes + connectors) aren't grouped together
5. **Transformer Conflicts**: Multiple transformers can exist simultaneously

## Bug Impact Analysis

| Bug | Root Cause | Impact | Fix Priority |
|-----|------------|--------|-------------|
| 2.1 Table Cell Text | Overlay coordination | Medium | Phase 2 |
| 2.2 Shapes/Connectors Don't Move | No grouping | High | Phase 1 |
| 2.3 Connectors Escape Sections | No clipping | Medium | Phase 2 |
| 2.4 Unable to Resize Sections | Transformer lifecycle | High | Phase 1 |
| 2.5 Images Disappear on Move | State reconciliation | Medium | Phase 2 |
| 2.6 Sections Don't Clear | Incomplete state reset | Low | Phase 3 |
| 2.7 Shapes Disappear In/Out | Manual grouping | High | Phase 1 |
| 2.8 Buggy In-Section Move/Resize | Duplicate events | High | Phase 1 |

## Phase 1: Core Grouping Architecture (High Priority)

### 1.1 Implement True Konva Grouping
**Goal**: Replace manual coordinate calculation with proper Konva Groups

```typescript
// NEW: GroupedElement wrapper for sections
<Group id={section.id} x={section.x} y={section.y}>
  <Rect {...sectionBackground} /> {/* Section background */}
  {children.map(child => 
    <ChildElement key={child.id} x={child.x} y={child.y} /> // Relative coordinates
  )}
</Group>
```

**Benefits**:
- ✅ Fixes Bug 2.7 (shapes disappear in/out of sections)
- ✅ Fixes Bug 2.8 (buggy in-section move/resize) 
- ✅ Simplifies coordinate system (always relative within groups)

### 1.2 Implement Shape+Connector Grouping
**Goal**: Group connectors with their connected shapes

```typescript
// NEW: ConnectionGroup for related elements
<Group id={`connection-${shapeId}`}>
  <Shape {...shapeProps} />
  {connectors.map(connector => 
    <Connector key={connector.id} {...connectorProps} />
  )}
</Group>
```

**Benefits**:
- ✅ Fixes Bug 2.2 (shapes and connectors don't move together)
- ✅ Enables unified drag behavior for connected elements

### 1.3 Centralized Transformer Management
**Goal**: Single transformer instance with proper lifecycle

```typescript
// NEW: TransformerManager component
const TransformerManager = ({ selectedElements, onTransform }) => {
  const transformerRef = useRef<Konva.Transformer>();
  
  useEffect(() => {
    // Attach to selected elements
    const nodes = selectedElements.map(id => stage.findOne(`#${id}`));
    transformerRef.current?.nodes(nodes);
  }, [selectedElements]);
  
  return <Transformer ref={transformerRef} onTransformEnd={onTransform} />;
};
```

**Benefits**:
- ✅ Fixes Bug 2.4 (unable to resize sections)
- ✅ Prevents transformer conflicts
- ✅ Enables multi-element transformations

## Phase 2: Rendering and Boundaries (Medium Priority)

### 2.1 Section Boundary Clipping
**Goal**: Implement proper clipping for section content

```typescript
// Enhanced SectionShape with clipping
<Group clipFunc={(ctx, shape) => {
  ctx.rect(0, 0, section.width, section.height);
}}>
  {sectionContent}
</Group>
```

**Benefits**:
- ✅ Fixes Bug 2.3 (connectors escape sections)
- ✅ Proper visual containment

### 2.2 Unified Text Editing System
**Goal**: Consistent overlay positioning for all text elements

```typescript
// Enhanced TextEditingOverlay with cell support
const getEditingBounds = (element) => {
  if (element.type === 'table-cell') {
    return calculateCellBounds(element);
  }
  return calculateElementBounds(element);
};
```

**Benefits**:
- ✅ Fixes Bug 2.1 (table cell text not visible)
- ✅ Consistent editing experience

### 2.3 Image State Reconciliation
**Goal**: Robust image lifecycle management

```typescript
// Enhanced ImageShape with stable state
const ImageShape = ({ element }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  useEffect(() => {
    // Stable image loading with state preservation
  }, [element.url]);
};
```

**Benefits**:
- ✅ Fixes Bug 2.5 (images disappear on move)
- ✅ Reliable image handling

## Phase 3: State Management and Cleanup (Low Priority)

### 3.1 Recursive State Cleanup
**Goal**: Complete state reset for clear operations

```typescript
// Enhanced clear function
const clearCanvas = () => {
  // Clear all nested elements recursively
  clearSections();
  clearElements();
  clearConnectors();
  resetTransformers();
};
```

**Benefits**:
- ✅ Fixes Bug 2.6 (sections don't clear)
- ✅ Reliable cleanup operations

## Implementation Strategy

### Step 1: Create Compatibility Layer
```typescript
// Backward compatibility wrapper
const LegacyElementRenderer = ({ element, children }) => {
  if (useNewGrouping) {
    return <GroupedElementRenderer element={element}>{children}</GroupedElementRenderer>;
  }
  return <LegacyRenderer element={element} />;
};
```

### Step 2: Feature Flag Migration
```typescript
// Gradual rollout with feature flags
const useNewGrouping = useFeatureFlag('new-grouping-architecture');
```

### Step 3: Testing Strategy
```typescript
// Comprehensive test coverage
describe('Canvas Grouping Architecture', () => {
  it('maintains element positions during section moves');
  it('groups connectors with connected shapes');
  it('prevents transformer conflicts');
  it('clips section content properly');
});
```

## Risk Mitigation

### 1. Backward Compatibility
- ✅ Maintain existing APIs during transition
- ✅ Feature flags for gradual rollout
- ✅ Fallback to legacy behavior if needed

### 2. Performance Considerations
- ✅ Leverage existing caching mechanisms
- ✅ Optimize group transformations
- ✅ Monitor rendering performance

### 3. Testing Coverage
- ✅ Unit tests for each component
- ✅ Integration tests for user workflows
- ✅ Visual regression tests

## Expected Outcomes

### Immediate Benefits (Phase 1)
- ✅ **4 high-priority bugs fixed**
- ✅ **Simplified coordinate system**
- ✅ **Unified event handling**
- ✅ **Better performance with true grouping**

### Long-term Benefits (All Phases)
- ✅ **All 8 bugs resolved**
- ✅ **Maintainable, scalable architecture**
- ✅ **Professional-grade canvas behavior**
- ✅ **Robust foundation for future features**

## Success Metrics

1. **Bug Resolution**: All 8 identified bugs resolved
2. **Performance**: No regression in rendering performance
3. **User Experience**: Smooth, predictable interactions
4. **Code Quality**: Reduced complexity, better maintainability
5. **Test Coverage**: 90%+ coverage for canvas components

This refactoring plan addresses the root causes systematically while maintaining the existing functionality and performance characteristics of the Canvas system.
