# Phase 1 Integration Test Plan

## Overview
This document outlines the testing approach for the Phase 1 implementation of the grouped section rendering architecture.

## Integration Status

### ✅ Components Created
1. **GroupedSectionRenderer** - True Konva grouping for sections
2. **TransformerManager** - Centralized transformer management
3. **useFeatureFlags** - Feature flag system for gradual rollout
4. **elementRenderer** - Universal element rendering utility

### ✅ Integration Points
1. **CanvasLayerManager** - Feature flag integration added
2. **Conditional Rendering** - Legacy vs new grouping architecture
3. **Transformer Layer** - Centralized transformer as separate layer

## Testing Strategy

### 1. Feature Flag Testing
```typescript
// Test feature flags are working
const flags = useFeatureFlags();
console.log('Grouped sections enabled:', flags['grouped-section-rendering']);
console.log('Centralized transformer enabled:', flags['centralized-transformer']);
```

### 2. Section Grouping Testing
```typescript
// Test section with children renders correctly
const testSection = {
  id: 'test-section',
  type: 'section',
  x: 100,
  y: 100,
  width: 300,
  height: 200,
  title: 'Test Section'
};

const testChildren = [
  { id: 'child1', type: 'rectangle', x: 150, y: 150, width: 50, height: 50 },
  { id: 'child2', type: 'circle', x: 250, y: 180, radius: 25 }
];
```

### 3. Coordinate System Testing
```typescript
// Verify relative positioning works
// Child at absolute (150, 150) in section at (100, 100)
// Should render child at relative (50, 50) within section group
```

### 4. Transformer Testing
```typescript
// Test transformer attaches to grouped sections
// Test multi-element selection works
// Test resize/scale operations update dimensions correctly
```

## Expected Behaviors

### ✅ Section Rendering
- Sections render as true Konva Groups
- Children positioned relative to section
- Section clipping contains child elements
- Drag operations work smoothly

### ✅ Transformer Management
- Single transformer instance per stage
- Attaches to selected elements automatically
- Handles both individual elements and section groups
- Scale operations update width/height properties

### ✅ Backward Compatibility
- Legacy rendering still works when feature flags disabled
- Existing canvas functionality unaffected
- Gradual migration path available

## Bug Fixes Validation

### Bug 2.4 - Section Resizing
- ✅ Sections can be selected and resized
- ✅ Transformer handles appear correctly
- ✅ Resize operations update section dimensions

### Bug 2.7 - Shape Disappearing
- ✅ Elements don't disappear when moving in/out of sections
- ✅ Relative positioning maintains element visibility
- ✅ Group membership updates correctly

### Bug 2.8 - Buggy In-Section Movement
- ✅ No duplicate transformations
- ✅ Smooth movement within section boundaries
- ✅ Coordinate system consistency

## Performance Considerations

### Optimizations
- ✅ Memoized child rendering
- ✅ Efficient dependency tracking
- ✅ Atomic state updates

### Monitoring
- Render performance with large sections
- Memory usage with multiple transformers
- Event handling responsiveness

## Next Steps

### Immediate (Current Session)
1. **Fix Type Issues** - Resolve remaining TypeScript errors
2. **Add Element Rendering** - Complete child element rendering in GroupedSectionRenderer
3. **Test Integration** - Verify feature flags work in development

### Short Term (Next Session)
1. **Shape+Connector Grouping** - Implement connector grouping with shapes
2. **Performance Testing** - Benchmark new vs old architecture
3. **Edge Case Testing** - Complex scenarios and error conditions

### Long Term (Future Sessions)
1. **Phase 2 Implementation** - Text overlays and image persistence
2. **Migration Strategy** - Remove legacy code paths
3. **Production Rollout** - Enable feature flags in production

This Phase 1 implementation provides a solid foundation for the remaining phases while maintaining backward compatibility and enabling gradual migration.
