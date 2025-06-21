# Jest Test Suite Audit Report

## Executive Summary
The current test suite has a foundation but lacks critical coverage for Tauri integration, canvas components, and state management. Major gaps exist in mocking Tauri APIs and testing the full data lifecycle from UI interactions through Rust commands.

## Current Test Coverage Analysis

### Existing Tests (To Keep)
| Test File | Status | Notes |
|-----------|--------|-------|
| `layers/CanvasLayerManager.test.tsx` | ✅ Keep | Good coverage for layer rendering |
| `performance/canvas.performance.test.tsx` | ✅ Keep | Essential performance benchmarks |
| `setup/jest.setup.ts` | ✅ Keep | Good foundation for Konva mocks |
| `utils/testUtils.tsx` | ✅ Keep | Excellent test utilities |

### Tests to Archive
| Test File | Reason | Action |
|-----------|--------|--------|
| `canvas-rendering-validation.ts` | Non-Jest format, outdated | Archive |
| `canvas-sections-advanced-tests.ts` | Non-Jest format, redundant | Archive |
| `canvas-sections-validation.ts` | Non-Jest format, outdated | Archive |
| `phase1-test-suite.ts` | Non-Jest format, obsolete | Archive |
| `rich-text-formatting-fixes-test.ts` | Non-Jest format | Archive |
| `run-canvas-sections-tests.ts` | Runner script, not a test | Archive |
| `table-cell-editing-refactor-test.ts` | Non-Jest format | Archive |
| `ts-node-loader.js` | Obsolete loader | Archive |

## Critical Gaps Identified

### 1. **Tauri Integration (CRITICAL PRIORITY)**
- **Missing**: `@tauri-apps/api` mocks
- **Impact**: Cannot test any component that uses Rust commands
- **Components Affected**: All components using `invoke` or `listen`

### 2. **Canvas Store Testing**
- **Missing**: Tests for all store slices
- **Files to Test**:
  - `canvasElementsStore.ts`
  - `canvasHistoryStore.ts`
  - `canvasUIStore.ts`
  - `sectionStore.ts`
  - `selectionStore.ts`
  - `tableStore.ts`
  - `textEditingStore.ts`
  - `viewportStore.ts`

### 3. **Shape Components**
- **Missing**: Tests for all shape components except basic coverage
- **Components to Test**:
  - `CircleShape.tsx`
  - `TextShape.tsx`
  - `StarShape.tsx`
  - `StickyNoteShape.tsx`
  - `SectionShape.tsx`
  - `ImageShape.tsx`
  - `PenShape.tsx`

### 4. **Canvas Components**
- **Missing**: Core canvas component tests
- **Components to Test**:
  - `KonvaCanvas.tsx`
  - `CanvasContainer.tsx`
  - `CanvasEventHandler.tsx`
  - `TransformerManager.tsx`
  - `ConnectorManager.tsx`

### 5. **Integration Tests**
- **Missing**: Full data flow tests
- **Scenarios to Test**:
  - Save canvas → Rust → Load canvas
  - Multi-select → Transform → Save state
  - Event from Rust → UI update

## Archive Script

```bash
#!/bin/bash
# archive_old_tests.sh

# Create archive directory if it doesn't exist
mkdir -p "C:\Projects\LibreOllama\src\tests\_archive"

# Move outdated test files to archive
mv "C:\Projects\LibreOllama\src\tests\canvas-rendering-validation.ts" "C:\Projects\LibreOllama\src\tests\_archive\"
mv "C:\Projects\LibreOllama\src\tests\canvas-sections-advanced-tests.ts" "C:\Projects\LibreOllama\src\tests\_archive\"
mv "C:\Projects\LibreOllama\src\tests\canvas-sections-validation.ts" "C:\Projects\LibreOllama\src\tests\_archive\"
mv "C:\Projects\LibreOllama\src\tests\phase1-test-suite.ts" "C:\Projects\LibreOllama\src\tests\_archive\"
mv "C:\Projects\LibreOllama\src\tests\rich-text-formatting-fixes-test.ts" "C:\Projects\LibreOllama\src\tests\_archive\"
mv "C:\Projects\LibreOllama\src\tests\run-canvas-sections-tests.ts" "C:\Projects\LibreOllama\src\tests\_archive\"
mv "C:\Projects\LibreOllama\src\tests\table-cell-editing-refactor-test.ts" "C:\Projects\LibreOllama\src\tests\_archive\"
mv "C:\Projects\LibreOllama\src\tests\ts-node-loader.js" "C:\Projects\LibreOllama\src\tests\_archive\"

echo "Old test files archived successfully"
```

## Next Phase: Test Generation Priority
1. Create Tauri API mocks (CRITICAL)
2. Test canvas store slices
3. Test shape components
4. Test core canvas components
5. Create integration tests
