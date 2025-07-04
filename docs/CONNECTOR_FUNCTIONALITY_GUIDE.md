# 🔗 Connector Functionality Guide

> **Status**: Updated after connector selection and interaction fixes

## Overview

The LibreOllama Canvas connector system has been fixed and enhanced to provide proper selection, resizing, rotation, and movement capabilities. This guide explains how to use connectors and what functionality is available.

## ✅ Fixed Issues

### 1. **Selection System Fixed**
- ✅ Connectors can now be properly selected after creation
- ✅ Click detection improved with larger hit areas
- ✅ Selection feedback enhanced with blue shadows and outlines

### 2. **Interaction System Enhanced**
- ✅ Simplified drag handling prevents position reset issues
- ✅ Fixed coordinate system for proper positioning
- ✅ Improved endpoint handle interaction for resizing
- ✅ Better visual feedback during selection and interaction

### 3. **Architecture Improvements**
- ✅ Removed complex optimization code that was causing instability
- ✅ Fixed Map vs Object issue in element iteration
- ✅ Streamlined event handling for better reliability

## 🎯 How to Use Connectors

### Creating Connectors

1. **Select Connector Tool**
   - Click the Line (—) or Arrow (→) tool in the toolbar
   - Your cursor should show a crosshair

2. **Draw Connector**
   - Click and drag on the canvas
   - Minimum drag distance of 10px required to create connector
   - Release mouse to complete the connector

3. **Smart Snapping** (Enhanced)
   - Connectors will snap to nearby elements (within 20px)
   - Blue circles indicate snap points
   - Supports center, top, bottom, left, right anchor points

### Selecting Connectors

1. **Click to Select**
   - Click anywhere on the connector line
   - Selected connectors show:
     - Blue shadow effect
     - Blue dashed outline
     - Blue endpoint handles (circles)

2. **Multi-Select**
   - Hold Ctrl/Cmd and click to add to selection
   - Works with other elements too

### Interacting with Selected Connectors

#### ↔️ **Resizing Connectors**
- **Drag blue endpoint handles** to change length and direction
- Minimum length of 20px enforced
- Maximum length of 2000px enforced
- Handles provide visual feedback on hover

#### 🔄 **Moving Connectors**
- **Drag the connector body** (anywhere on the line) to move entire connector
- All points (start, end, intermediate) move together
- Maintains relative positioning

#### 🎨 **Visual Feedback**
- **Selected State**: Blue shadow, dashed outline, endpoint handles
- **Hover State**: Cursor changes to indicate interaction type
- **Dragging**: Smooth real-time updates

## 🛠️ Technical Details

### Connector Types Supported
- **Line Connectors**: Straight lines between two points
- **Arrow Connectors**: Lines with arrowheads at the end
- **Curved Connectors**: Support for bezier curves (basic implementation)

### Coordinate System
- Connectors use absolute positioning
- Start and end points stored as `{ x, y }` coordinates
- Intermediate points supported for complex paths

### Selection Architecture
- Connectors excluded from standard Konva transformer
- Custom selection and interaction system in `ConnectorShape` component
- Larger hit areas (3x stroke width) for easier selection

## 🧪 Testing Connector Functionality

### Quick Test Script
```javascript
// Run in browser console on canvas page
testConnectorFunctionality()
```

### Manual Testing Steps

1. **Test Creation**
   - Select Line or Arrow tool
   - Draw several connectors of different sizes
   - Verify minimum distance requirement (10px)

2. **Test Selection**
   - Click on each connector
   - Verify blue visual feedback appears
   - Test multi-select with Ctrl/Cmd+click

3. **Test Resizing**
   - Select a connector
   - Drag blue endpoint handles
   - Verify connector length changes smoothly
   - Test minimum/maximum length constraints

4. **Test Movement**
   - Select a connector
   - Drag the connector body (not handles)
   - Verify entire connector moves together

5. **Test Snapping**
   - Create some shapes first
   - Draw connectors near shapes
   - Verify blue snap indicators appear
   - Verify connectors snap to anchor points

## 🐛 Troubleshooting

### Connector Not Selectable
- Ensure connector was created properly (check in console with test script)
- Try clicking closer to the line itself
- Check if connector has proper ID and is in store

### Handles Not Appearing
- Verify connector is actually selected (check `selectedElementIds` in store)
- Ensure `onUpdate` prop is passed to ConnectorShape
- Check browser console for any errors

### Position Reset Issues
- This should now be fixed with simplified drag handling
- If still occurring, check console for coordinate calculation errors

### Snapping Not Working
- Fixed issue with `Object.values()` vs `Array.from(elements.values())`
- Verify elements exist in the store to snap to
- Check 20px snap distance is reasonable for your zoom level

## 📋 Known Limitations

### Current Limitations
- **Rotation**: No rotation handles (only resize/move)
- **Style Changes**: No UI for changing color/width after creation
- **Advanced Curves**: Limited curved connector support
- **Connection Points**: Auto-connection to shape edges not fully implemented

### Future Enhancements (Planned)
- [ ] Rotation handles for connectors
- [ ] Properties panel for color/width modification
- [ ] Advanced curved connector tools
- [ ] Smart routing around obstacles
- [ ] Auto-connection to shape edges
- [ ] Connector labels and annotations

## 💡 Best Practices

### For Users
1. **Create Longer Connectors**: Easier to select and manipulate
2. **Use Snapping**: Helps create cleaner diagrams
3. **Select Before Manipulating**: Always click to select first
4. **Visual Confirmation**: Look for blue feedback to confirm selection

### For Developers
1. **Test After Changes**: Use the test script to verify functionality
2. **Check Console**: Monitor for errors during connector operations
3. **Validate Store State**: Ensure connectors are properly added to store
4. **Coordinate Systems**: Be careful with absolute vs relative positioning

## 🔧 Advanced Usage

### Programmatic Connector Creation
```javascript
const store = useUnifiedCanvasStore.getState();
const connector = {
  id: 'custom-connector-' + Date.now(),
  type: 'connector',
  subType: 'arrow',
  x: 0,
  y: 0,
  startPoint: { x: 100, y: 100 },
  endPoint: { x: 200, y: 150 },
  connectorStyle: {
    strokeColor: '#FF0000',
    strokeWidth: 3,
    endArrow: 'solid'
  },
  createdAt: Date.now(),
  updatedAt: Date.now()
};
store.addElement(connector);
```

### Checking Connector State
```javascript
const store = useUnifiedCanvasStore.getState();
const connectors = Array.from(store.elements.values())
  .filter(el => el.type === 'connector');
console.log('Connectors:', connectors);
```

---

**Status**: ✅ **CONNECTOR FUNCTIONALITY RESTORED**

The connector system now provides reliable selection, resizing, and movement capabilities that match user expectations for professional design tools. 