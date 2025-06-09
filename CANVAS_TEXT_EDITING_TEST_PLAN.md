# Canvas Text Editing Test Plan

## Overview
This test plan validates the pendingDoubleClick protection mechanism implemented to prevent race conditions between element double-click detection and canvas state clearing.

## Implementation Details Under Test
- **pendingDoubleClick state** in canvasStore
- **300ms double-click timeout** in TextElement and StickyNote components
- **Protection checks** in Canvas.tsx and useCanvasEvents.ts

## Test Scenarios

### 1. Text Element Re-editing
#### Test Case 1.1: Basic Re-edit
- **Steps:**
  1. Create a new text element by clicking the text tool and clicking on canvas
  2. Type some text (e.g., "Test Text")
  3. Click elsewhere on the canvas to deselect
  4. Double-click on the text element
- **Expected Result:** Text element enters edit mode with cursor visible

#### Test Case 1.2: Move and Re-edit
- **Steps:**
  1. Create a text element with content
  2. Move the element to a different position
  3. Click on empty canvas area
  4. Double-click the text element
- **Expected Result:** Text element enters edit mode at new position

#### Test Case 1.3: Multiple Text Elements
- **Steps:**
  1. Create 3 text elements with different content
  2. Click on canvas to deselect all
  3. Double-click each text element in sequence
- **Expected Result:** Each element enters edit mode independently

### 2. Sticky Note Re-editing
#### Test Case 2.1: Basic Re-edit
- **Steps:**
  1. Create a new sticky note
  2. Type content in the sticky note
  3. Click elsewhere on canvas
  4. Double-click the sticky note
- **Expected Result:** Sticky note enters edit mode

#### Test Case 2.2: Color Change and Re-edit
- **Steps:**
  1. Create a sticky note with content
  2. Change its color using the toolbar
  3. Click on canvas
  4. Double-click the sticky note
- **Expected Result:** Sticky note maintains color and enters edit mode

### 3. Edge Cases

#### Test Case 3.1: Rapid Clicking
- **Steps:**
  1. Create a text element
  2. Click rapidly (5-10 times) on the text element
  3. Wait for system to stabilize
  4. Double-click normally
- **Expected Result:** No console errors, element enters edit mode properly

#### Test Case 3.2: Click Between Elements
- **Steps:**
  1. Create two text elements close together
  2. Click rapidly between them
  3. Double-click on one element
- **Expected Result:** Only the double-clicked element enters edit mode

#### Test Case 3.3: Canvas Click While Editing
- **Steps:**
  1. Enter edit mode on a text element
  2. Click on empty canvas area
  3. Double-click the same element again
- **Expected Result:** Element exits edit mode on canvas click, re-enters on double-click

#### Test Case 3.4: Fast Element Switching
- **Steps:**
  1. Create 3 text elements
  2. Double-click first element to edit
  3. Immediately double-click second element
  4. Immediately double-click third element
- **Expected Result:** Each element properly enters/exits edit mode in sequence

### 4. Event Propagation Tests

#### Test Case 4.1: Click Event Propagation
- **Steps:**
  1. Create a text element
  2. Single-click on the element
  3. Observe console for any duplicate events
- **Expected Result:** Single click event, no propagation to canvas

#### Test Case 4.2: Double-Click Event Propagation
- **Steps:**
  1. Create a text element
  2. Double-click on the element
  3. Monitor console for event logs
- **Expected Result:** Double-click properly handled, no canvas clear triggered

### 5. Race Condition Tests

#### Test Case 5.1: Simultaneous Actions
- **Steps:**
  1. Create a text element
  2. Start dragging and quickly double-click
- **Expected Result:** Either drag or edit mode, not both

#### Test Case 5.2: Tool Switch During Edit
- **Steps:**
  1. Enter edit mode on a text element
  2. Quickly switch to another tool
  3. Click on canvas
- **Expected Result:** Clean exit from edit mode, new tool active

## Console Monitoring Checklist
During all tests, monitor for:
- [ ] No "Cannot read property of undefined" errors
- [ ] No "Maximum update depth exceeded" warnings
- [ ] No duplicate event handler calls
- [ ] No race condition warnings
- [ ] Proper cleanup of event listeners

## Performance Metrics
- Double-click response time should be < 300ms
- No UI freezing or lag during rapid interactions
- Memory usage should remain stable

## Validation Criteria
The fix is considered successful if:
1. ✓ Event propagation is properly stopped
2. ✓ Double-click detection is reliable (95%+ success rate)
3. ✓ Canvas handlers don't interfere with editing state
4. ✓ No race conditions occur during normal or edge case usage
5. ✓ Console remains error-free during all test scenarios

## Known Limitations
Document any discovered limitations or edge cases that may require future attention.

## Test Results Summary
(To be filled during testing)

| Test Case | Status | Notes |
|-----------|--------|-------|
| 1.1 Basic Re-edit | - | - |
| 1.2 Move and Re-edit | - | - |
| 1.3 Multiple Elements | - | - |
| 2.1 Sticky Note Basic | - | - |
| 2.2 Color Change | - | - |
| 3.1 Rapid Clicking | - | - |
| 3.2 Click Between | - | - |
| 3.3 Canvas Click | - | - |
| 3.4 Fast Switching | - | - |
| 4.1 Click Propagation | - | - |
| 4.2 Double-Click | - | - |
| 5.1 Simultaneous | - | - |
| 5.2 Tool Switch | - | - |