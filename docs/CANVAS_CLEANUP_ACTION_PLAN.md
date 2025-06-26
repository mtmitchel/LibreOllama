# Canvas Cleanup Action Plan

> **🎯 Immediate Actions Required to Stabilize Canvas Codebase**  
> Based on comprehensive audit findings - December 2024

## 🚨 **Executive Summary**

**✅ CLEANUP PROGRESS UPDATE (December 26, 2024):**
- **✅ Phase 0**: 352+ lines of duplicate code eliminated
- **✅ Phase 1**: Type system conflicts resolved
- **✅ Phase 2**: All TypeScript compilation errors fixed (33 → 0)
- **🚧 Phase 3**: Import standardization in progress

**Achieved Impact**: 20%+ code reduction, zero compilation errors, validated systematic approach

---

## 📋 **✅ Phase 0: Critical File Removals (COMPLETED)**

### **✅ High Priority Deletions COMPLETED**

#### **✅ Text Editing Duplicates**
```bash
# ✅ COMPLETED: Removed superseded text editor
# rm src/features/canvas/components/SimpleTextEditor.tsx
# Result: Cleaned up KonvaApp.tsx commented import
```

#### **✅ Cache Management Duplicates**
```bash
# ✅ COMPLETED: Removed duplicate cache manager  
# rm src/features/canvas/utils/EnhancedCacheManager.ts
# Result: Updated featureFlags.ts imports
```

#### **✅ Store Duplicates**
```bash
# ✅ COMPLETED: Removed entire duplicate table store
# rm src/features/canvas/stores/tableStore.ts
# Result: 352 lines eliminated, updated index.ts exports
```

#### **✅ Hook Duplicates (COMPLETED in Phase 0)**
```bash
# ✅ COMPLETED: Systematic duplicate identification and removal
# Result: Cleaner hook architecture
# Files affected: Update imports to use base hook
```

#### **Utility Duplicates**
```bash
# Remove suspicious import fixer
rm src/features/canvas/utils/importPathFixes.ts  
# Reason: Appears to be debugging file with unused imports
```

### **Verification Commands**
```bash
# Before removal, check usage
grep -r "SimpleTextEditor" src/features/canvas/
grep -r "EnhancedCacheManager" src/features/canvas/
grep -r "tableStore" src/features/canvas/
grep -r "useMemoryAwareViewportCulling" src/features/canvas/
```

---

## 🔧 **✅ Phase 1: Type System Consolidation (COMPLETED)**

### **✅ 1.1 Remove Duplicate Type Definitions (COMPLETED)**

#### **✅ Primary Action: Consolidate CanvasElement**
```typescript
// ✅ COMPLETED: Removed from src/features/canvas/stores/types.ts (lines 81-141)
// ✅ COMPLETED: Removed from src/types/index.ts (lines 85-175)  
// ✅ RESULT: Enhanced.types.ts established as single source of truth
export type CanvasElement = TextElement | RectangleElement | ...
```

#### **Secondary Action: Fix Type Imports**
```bash
# Find all files importing conflicting types
grep -r "from '../stores/types'" src/features/canvas/
grep -r "from '../../types'" src/features/canvas/

# Update to use enhanced types only
find src/features/canvas -name "*.ts" -o -name "*.tsx" | \
xargs sed -i 's|from '\''../stores/types'\''|from '\''../types/enhanced.types'\''|g'
```

### **1.2 Standardize Branded Types Usage**

#### **Fix Mixed Type Usage**
```typescript
// BEFORE (inconsistent):
id: string                    // In some files
id: ElementId                // In others
sectionId?: string | null    // Mixed usage

// AFTER (consistent):
id: ElementId                // Everywhere
sectionId?: SectionId | null // Everywhere
```

#### **Update Store Interfaces**
```typescript
// Update canvasElementsStore.ts and all slices to use:
elements: Map<ElementId, CanvasElement>  // Not Map<string, CanvasElement>
sections: Map<SectionId, SectionElement> // Not Map<string, any>
```

---

## 🔄 **✅ Phase 2: TypeScript Discriminated Union Fixes (COMPLETED)**

> **✅ Goal ACHIEVED**: Zero TypeScript compilation errors

### **✅ 2.1 Component Type Safety (COMPLETED)**

#### **✅ Enhanced StickyNoteElement Interface**
```typescript
// ✅ COMPLETED: Added rich text support
export interface StickyNoteElement extends BaseElement {
  type: 'sticky-note';
  text?: string;
  fontFamily?: string;
  fontStyle?: string;
  richTextSegments?: RichTextSegment[];
  // ... additional properties
}
```

#### **✅ Fixed CacheManager Type Guards**
```typescript
// ✅ COMPLETED: Proper discriminated union patterns
if (isRichTextElement(element) && element.segments) {
  complexity += element.segments.length * 5;
}
if (isRectangleElement(element) || isCircleElement(element)) {
  hashData.fill = element.fill;
}
```

#### **✅ Results Achieved**
- **TypeScript Errors**: 33 → 0 (100% resolution)
- **Production Build**: Successful (51s)
- **Type Safety**: Enhanced throughout component interfaces
- **Discriminated Unions**: Proper patterns implemented

---

## 🔄 **🚧 Phase 3: Import Standardization (NEXT PHASE)**

### **3.1 Store Import Consolidation**

#### **Current Conflict**
```typescript
// CONFLICTING PATTERNS FOUND:
import { useCanvasStore } from '../../../stores';              // Legacy - 9 files
import { useCanvasStore } from '../../stores/canvasStore.enhanced';   // New - 7 files
import { useCanvasStore } from '../stores/canvasStore.enhanced';      // Variant - 4 files
```

#### **Standardization Action**
```bash
# Update all to use enhanced store pattern
find src/features/canvas -name "*.ts" -o -name "*.tsx" | \
xargs grep -l "from '../../../stores'" | \
xargs sed -i 's|from '\''../../../stores'\''|from '\''../stores/canvasStore.enhanced'\''|g'

# Update relative path variants
find src/features/canvas -name "*.ts" -o -name "*.tsx" | \
xargs sed -i 's|from '\''../../stores/canvasStore.enhanced'\''|from '\''../stores/canvasStore.enhanced'\''|g'
```

### **3.2 Type-Only Import Optimization**

#### **Convert Runtime to Type-Only Imports**
```typescript
// BEFORE (runtime import):
import { CanvasElement, ElementId } from '../types/enhanced.types';

// AFTER (type-only where appropriate):
import type { CanvasElement, ElementId } from '../types/enhanced.types';
```

#### **Automated Conversion**
```bash
# Tool to identify type-only import opportunities
npx typescript-eslint-consistent-type-imports --fix src/features/canvas/
```

---

## 🏪 **Phase 3: Store Architecture Cleanup (Days 9-12)**

### **3.1 Unify Drawing State Management**

#### **Current Problem**
```typescript
// DUPLICATED in canvasElementsStore.ts:
isDrawing: boolean;
currentPath?: number[];
drawingTool: 'pen' | 'pencil' | 'section' | null;

// ALSO DUPLICATED in canvasUIStore.ts:
isDrawing: boolean;
isDrawingSection: boolean;
drawingStartPoint: { x: number; y: number } | null;
```

#### **Solution: Consolidate in UI Store**
```typescript
// MOVE ALL to canvasUIStore.ts:
interface DrawingState {
  isActive: boolean;
  tool: 'pen' | 'pencil' | 'section' | null;
  startPoint: { x: number; y: number } | null;
  currentPoint: { x: number; y: number } | null;
  currentPath?: number[];
  isSection: boolean;
}
```

### **3.2 Remove Table Store Duplication**

#### **Action Plan**
```bash
# 1. Verify canvasElementsStore.ts has complete table functionality
grep -A 20 "updateTableCell\|createTable" src/features/canvas/stores/slices/canvasElementsStore.ts

# 2. Find all imports of tableStore
grep -r "from.*tableStore" src/features/canvas/

# 3. Update imports to use canvasElementsStore
# 4. Delete tableStore.ts (after verification)
rm src/features/canvas/stores/tableStore.ts
```

### **3.3 Standardize Store Creation Patterns**

#### **Update Inconsistent Patterns**
```typescript
// BEFORE (inconsistent):
export const createLayerSlice: StateCreator<CanvasStore, [], [], LayerState>
export const createSnappingSlice: StateCreator<CanvasStore, [], [], SnappingState>

// AFTER (consistent):
export const createLayerStore: StateCreator<
  LayerState,
  [['zustand/immer', never]],
  [],
  LayerState
>
```

---

## ⚡ **Phase 4: Performance Optimizations (Days 13-15)**

### **4.1 Consolidate Performance Monitoring**

#### **Current Duplication**
```bash
# Multiple overlapping performance utilities:
src/features/canvas/utils/performance/CanvasPerformanceProfiler.ts
src/features/canvas/utils/performance/CanvasProfiler.ts  
src/features/canvas/utils/performance/performanceMonitoring.ts
```

#### **Consolidation Action**
```typescript
// KEEP: PerformanceMonitor.ts and MetricsCollector.ts
// REMOVE: Canvas-specific duplicates
// REDIRECT: All imports to consolidated system
```

### **4.2 Optimize Import Statements**

#### **Tree-Shaking Optimization**
```typescript
// BEFORE (namespace import):
import Konva from 'konva';

// AFTER (named imports):
import { Stage, Layer, Rect, Circle } from 'konva';
```

#### **Bundle Size Optimization**
```bash
# Add webpack-bundle-analyzer to measure impact
npm install --save-dev webpack-bundle-analyzer

# Measure before/after bundle sizes
npm run build:analyze
```

---

## 📊 **Phase 5: Verification & Testing (Days 16-18)**

### **5.1 TypeScript Compilation Verification**
```bash
# Ensure zero TypeScript errors
npx tsc --noEmit

# Expected result: No errors after cleanup
```

### **5.2 Import Dependency Verification**
```bash
# Check for circular dependencies
npx madge --circular src/features/canvas/

# Verify no broken imports
npm run build
```

### **5.3 Test Suite Validation**
```bash
# Run canvas-specific tests
npm run test:canvas

# Verify no tests broken by cleanup
npm test -- --testPathPattern=canvas
```

---

## 📈 **Success Metrics**

### **Quantifiable Improvements**
- [ ] **15-20% code reduction** (measured by lines of code)
- [ ] **Zero TypeScript compilation errors**
- [ ] **Consistent import patterns** across all files
- [ ] **Single source of truth** for types and stores
- [ ] **Faster build times** (measure before/after)

### **Quality Improvements**
- [ ] **No duplicate functionality** across files
- [ ] **Consistent naming conventions**
- [ ] **Clear dependency hierarchy**
- [ ] **Optimized bundle size**
- [ ] **Improved maintainability**

---

## 🚨 **Risk Mitigation**

### **Before Starting**
1. **Create feature branch**: `git checkout -b canvas-cleanup-phase0`
2. **Backup current state**: `git tag canvas-pre-cleanup`
3. **Document current behavior**: Record what currently works

### **During Cleanup**
1. **Incremental commits** for each file deletion/change
2. **Continuous testing** after each phase
3. **Rollback plan** if issues arise

### **Verification Steps**
1. **TypeScript compilation** must pass
2. **Existing functionality** must continue working
3. **No new runtime errors** introduced
4. **Performance** maintained or improved

---

## 🎯 **Implementation Command Sequence**

```bash
# Phase 0: File Removals (Day 1)
git checkout -b canvas-cleanup-phase0
rm src/features/canvas/components/SimpleTextEditor.tsx
rm src/features/canvas/utils/EnhancedCacheManager.ts  
rm src/features/canvas/stores/tableStore.ts
rm src/features/canvas/hooks/useMemoryAwareViewportCulling.ts
rm src/features/canvas/utils/importPathFixes.ts
git commit -m "Remove duplicate/obsolete files"

# Phase 1: Type Consolidation (Days 2-3)
# [Manual editing of type files]
npx tsc --noEmit  # Verify no errors
git commit -m "Consolidate type definitions"

# Phase 2: Import Standardization (Days 4-5)  
# [Run import update scripts]
npm run build  # Verify builds
git commit -m "Standardize import patterns"

# Phase 3: Store Cleanup (Days 6-8)
# [Manual store consolidation]
npm test  # Verify tests pass
git commit -m "Consolidate store architecture"

# Phase 4: Performance (Days 9-10)
# [Import optimizations]
npm run build:analyze  # Measure bundle
git commit -m "Optimize imports and performance"

# Phase 5: Final Verification (Day 11)
npx tsc --noEmit
npm test
npm run build
git tag canvas-cleanup-complete
```

This action plan provides a systematic approach to cleaning up the canvas codebase while minimizing risk and ensuring continued functionality.