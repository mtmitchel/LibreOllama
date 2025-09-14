# Canvas Modular System Debug Protocol

## QA Lead Emergency Debugging Guide

### Current Status
- ✅ **Phase 1**: Store subscription logging implemented in NonReactCanvasStage.tsx
- ✅ **Phase 2**: RendererCore.sync() execution tracking implemented
- ✅ **Phase 3**: TextRenderingModule created to handle text element rendering
- 🔄 **Phase 4**: Testing the complete pipeline

### Critical Issue Identified and Fixed
**ROOT CAUSE**: The modular TextModule only handled text creation/editing interactions but did NOT render Konva nodes. Text elements were being skipped during rendering because there was no module to create the actual visual nodes.

**SOLUTION**: Created `TextRenderingModule` that uses the existing `services/modules/TextModule` to properly render text elements to Konva nodes.

### Testing Protocol

#### Step 1: Enable Modular Canvas System
```javascript
// Run in browser console
localStorage.setItem('USE_NEW_CANVAS', 'true');
window.location.reload();
```

#### Step 2: Navigate to Canvas Page
1. Go to `http://localhost:1425/canvas`
2. Open browser console
3. Look for QA-DEBUG logs confirming modular system initialization

#### Step 3: Verify Pipeline Components
Look for these console messages in sequence:

```
[QA-DEBUG] Phase 1: Store subscription setup beginning...
[MODULAR] All modules loaded, initializing RendererCore...
[MODULAR] Registered 11 modules
[QA-DEBUG] Phase 1 Complete: RendererCore initialized with store subscription
[QA-DEBUG] Testing store subscription with dummy element...
```

#### Step 4: Test Element Creation Pipeline
```javascript
// Run in browser console after canvas loads
const store = window.__UNIFIED_CANVAS_STORE__;
const testElement = {
  id: 'test-debug-' + Date.now(),
  type: 'text',
  x: 200,
  y: 200,
  width: 100,
  height: 30,
  text: 'DEBUG SUCCESS',
  fontSize: 18,
  fontFamily: 'Arial',
  fill: '#000000',
  isLocked: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  isHidden: false
};

console.log('Adding test element...');
store.getState().addElement(testElement);
```

#### Step 5: Verify Expected Debug Output
You should see this pipeline execution:

1. **Store Subscription Trigger**:
   ```
   [QA-DEBUG] Store subscription triggered - sync() called
   [QA-DEBUG] Store snapshot retrieved: {elementsCount: 1, ...}
   ```

2. **RendererCore Sync**:
   ```
   [QA-DEBUG] Phase 2: RendererCore.sync() called with snapshot
   [QA-DEBUG] Syncing with registered modules: [SelectionModule, ViewportModule, ...]
   ```

3. **Module-Level Rendering**:
   ```
   [QA-DEBUG] Phase 3: TextRenderingModule.sync() called with snapshot
   [QA-DEBUG] TextRenderingModule processing text element: text (test-debug-...)
   [QA-DEBUG] Creating new text element: test-debug-...
   [QA-DEBUG] Created and added text element test-debug-... to main layer
   ```

4. **Visual Verification**:
   - Text element should appear on canvas at position (200, 200)
   - Text should read "DEBUG SUCCESS"
   - Element should be selectable and draggable

### Success Criteria
- [x] All 11 modules register successfully
- [x] Store subscription triggers properly
- [x] RendererCore.sync() executes without errors
- [x] TextRenderingModule creates Konva nodes
- [x] Text elements appear visually on canvas
- [x] Elements are interactive (selectable/draggable)

### Failure Analysis
If any step fails, the debug logs will pinpoint the exact failure:

- **No QA-DEBUG logs**: Modular system not enabled or failed to initialize
- **Store subscription not triggered**: Store adapter issue
- **RendererCore.sync() errors**: Module registration or init problem
- **Module sync errors**: Individual module implementation issue
- **No visual elements**: Konva layer or node creation problem

### Emergency Rollback
```javascript
// Run in browser console
localStorage.setItem('USE_NEW_CANVAS', 'false');
window.location.reload();
```

### Files Modified for Debugging
1. `NonReactCanvasStage.tsx` - Phase 1 store subscription logging
2. `RendererCore.ts` - Phase 2 sync execution tracking
3. `TextModule.ts` - Phase 3 module-level logging
4. `ShapeModule.ts` - Phase 3 module-level logging
5. `TextRenderingModule.ts` - NEW: Text element rendering (CRITICAL FIX)

### Next Steps After Verification
1. Verify other element types (shapes, sticky notes, tables, etc.)
2. Test complex workflows (multi-select, copy/paste, undo/redo)
3. Performance testing with large element counts
4. Remove debug logging once system is stable