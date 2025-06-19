# Canvas Text Tool Bug Analysis & Debugging Report

## Problem Description

**Critical Bug**: In a React-Konva canvas application, selecting the text tool from the toolbar causes ALL canvas elements to disappear, making the entire canvas appear empty.

### Expected Behavior
1. User clicks the text tool in toolbar
2. Text tool becomes active 
3. User clicks on canvas to create a text element
4. All existing elements remain visible and functional

### Actual Behavior
1. User clicks the text tool in toolbar
2. **ALL elements on the canvas immediately disappear**
3. Canvas appears completely empty
4. Elements are not actually deleted from store (confirmed via debug logs)

## Technical Context

### Architecture
- **Frontend**: React + TypeScript + Vite
- **Canvas**: React-Konva (React wrapper for Konva.js)
- **State Management**: Zustand stores
- **Key Components**:
  - `KonvaToolbar.tsx` - Toolbar with tool selection
  - `TextShape.tsx` - Text element rendering component
  - `MainLayer.tsx` - Main canvas rendering layer
  - `canvasElementsStore.ts` - Element state management

### Canvas Features
- Multiple element types: rectangles, circles, triangles, stars, text, sticky notes, tables, images, connectors
- Section containment system (elements can be grouped in sections)
- Element selection, dragging, resizing
- Text editing with portal-based inline editor

## Root Cause Analysis

### Initial Hypothesis: State Clearing
**Tested**: Added debug logging to track store state changes
**Result**: ❌ **Rejected** - Elements remain in store after text tool selection

### Current Hypothesis: React-Konva Rendering Error
**Evidence**: Error logs show:
```
ReactKonvaHostConfig.js:54  Text components are not supported for now in ReactKonva. Your text is: "            "
react-reconciler.development.js:5928  TypeError: Cannot read properties of undefined (reading 'getParent')
```

**Root Cause**: When a text element is created with empty or whitespace-only text, React-Konva throws a rendering error that breaks the entire canvas rendering, making all elements disappear.

## Debugging Process & Attempts

### 1. Store State Investigation
- **Action**: Added extensive debug logging in `KonvaToolbar.tsx`
- **Finding**: Elements persist in store after tool selection
- **Conclusion**: Not a state management issue

### 2. Text Element Creation Analysis
- **Initial Fix**: Changed text element creation from `text: ''` to `text: 'Text'`
- **Location**: `KonvaToolbar.tsx` line ~189
- **Status**: ✅ **Implemented**

### 3. Text Editing Flow Investigation
- **Issue**: Text property gets set to spaces (`"            "`) during editing flow
- **Suspected Sources**:
  - Text editing utility (`textEditingUtils.tsx`)
  - TextShape component rendering logic
  - Element update/save process

### 4. Text Editing Mode Investigation
- **Action**: Temporarily disabled automatic text editing mode after element creation
- **Code**: Commented out `setEditingTextId(newElement.id)` in toolbar
- **Status**: ✅ **Implemented** but issue persists

### 5. React-Konva Validation Research
- **Finding**: React-Konva cannot render text components with whitespace-only content
- **Impact**: Even a single malformed text element breaks entire canvas rendering

## Current State of Fixes

### ✅ **Completed Fixes**
1. **Default Text Value**: Text elements now created with `'Text'` instead of empty string
2. **Debug Logging**: Comprehensive logging added for state tracking
3. **Automatic Editing Disabled**: Removed auto-entry into text editing mode

### 🔄 **Attempted but Incomplete**
1. **Text Editor Validation**: Started adding validation to prevent saving whitespace-only text
2. **Store Validation**: Began implementing validation in element update functions
3. **Component Safeguards**: Started adding protective checks in TextShape component

## Files Modified

### Primary Files
- `src/features/canvas/components/toolbar/KonvaToolbar.tsx`
  - Text element creation logic
  - Debug logging additions
  - Disabled automatic text editing

- `src/features/canvas/shapes/TextShape.tsx`
  - Text rendering and editing logic
  - Portal-based text editor integration

### Supporting Files
- `src/features/canvas/utils/textEditingUtils.tsx` - Text editing utility
- `src/features/canvas/stores/slices/canvasElementsStore.ts` - Element state management
- `test-text-tool-fix.md` - Test plan documentation

## Error Logs Analysis

### Key Error Messages
```javascript
// React-Konva error when text contains only spaces
ReactKonvaHostConfig.js:54  Text components are not supported for now in ReactKonva. Your text is: "            "

// React reconciler error that breaks rendering
react-reconciler.development.js:5928  TypeError: Cannot read properties of undefined (reading 'getParent')
    at Group.add (Container.js:59:19)
    at appendInitialChild (ReactKonvaHostConfig.js:19:20)
```

### Debug Logs Sequence
```javascript
🔧 [UI STORE] Setting selected tool: select
✅ [UI STORE] Tool changed: text -> select
🔧 [MAIN LAYER] Rendering TextShape for: element_1750342151787_aeak5vj41
// Error occurs here, breaking all rendering
```

## Outstanding Questions

1. **Where is text getting set to spaces?** 
   - Text elements are created with 'Text' but somehow become whitespace
   - Need to trace the exact flow from creation → editing → save

2. **Why does one bad text element break all rendering?**
   - React-Konva's error handling seems to cascade
   - May need error boundaries or validation layers

3. **Is the auto-editing re-enabling safe?**
   - Once we fix whitespace issue, can we restore user-friendly auto-editing?

## Next Steps for Fresh Debugger

### Immediate Investigation
1. **Trace Text Property Changes**: Add logging at every point where `element.text` is modified
2. **Identify Whitespace Source**: Find where `"            "` (12 spaces) is being set
3. **Test Minimal Reproduction**: Create isolated test case with just text element creation

### Potential Solutions
1. **Input Validation**: Prevent whitespace-only text from being saved
2. **Default Value Enforcement**: Ensure text always has meaningful content
3. **Error Boundaries**: Add React error boundaries around text components
4. **React-Konva Workarounds**: Handle edge cases in text rendering

### Testing Strategy
1. Create text element via toolbar
2. Monitor console for error messages
3. Check element.text property at each step
4. Verify canvas continues rendering other elements

## Code Locations for Investigation

### Key Functions to Debug
- `KonvaToolbar.createElementForTool()` - Element creation
- `TextShape.useEffect()` - Text editing initialization  
- `textEditingUtils.createTextEditor()` - Text editor logic
- `canvasElementsStore.updateElement()` - Element updates

### Important State Flows
1. **Tool Selection**: `setSelectedTool('text')` → element creation
2. **Element Creation**: Toolbar → store → MainLayer → TextShape
3. **Text Editing**: Double-click → portal editor → save → update
4. **Rendering**: Store state → React-Konva components → Canvas display

This bug represents a critical UX failure where a single malformed text element can break the entire canvas interface.
