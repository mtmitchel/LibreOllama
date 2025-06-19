# HOTFIX: Canvas Text Tool Whitespace Bug

## Quick Fix Instructions

Apply this immediate fix to prevent the canvas from breaking while you debug the root cause.

### 1. Update TextShape.tsx

Add this validation at the beginning of the TextShape component (after the hooks):

```typescript
// HOTFIX: Prevent rendering whitespace text that breaks React-Konva
if (element.text === '            ' || (element.text && element.text.trim().length === 0)) {
  // Force update to fix the element
  setTimeout(() => {
    onUpdate(element.id, { text: 'Text' });
  }, 0);
  // Return safe text for this render
  return (
    <Text
      {...konvaProps}
      id={element.id}
      text="Text"
      fontSize={element.fontSize || 24}
      fontFamily="Inter, sans-serif"
      fill="#000000"
      width={element.width || 250}
      fontStyle="normal"
      onDblClick={handleDoubleClick}
    />
  );
}
```

### 2. Update canvasElementsStore.ts

In the `updateElement` method, strengthen the validation:

```typescript
// Prevent storing empty or whitespace-only text (React-Konva issue)
if (updates.text !== undefined) {
  const trimmedText = updates.text.trim();
  if (trimmedText.length === 0 || updates.text === '            ') {
    console.warn('🔧 [ELEMENTS STORE] Preventing whitespace-only text update for element:', id);
    console.trace('Stack trace for whitespace text attempt');
    updates.text = 'Text'; // Use default text instead
  }
}
```

### 3. Add Global Monitor (Temporary)

Add this to your main App.tsx or index.tsx:

```typescript
// TEMPORARY: Debug monitor for text tool issue
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const store = (window as any).useCanvasStore?.getState();
    if (store?.elements) {
      Object.entries(store.elements).forEach(([id, element]: [string, any]) => {
        if (element.type === 'text' && element.text === '            ') {
          console.error(`🚨 Found 12 spaces in element ${id}!`);
          store.updateElement(id, { text: 'Text' });
        }
      });
    }
  }, 1000);
}
```

### 4. Test the Fix

1. Start your development server
2. Create a section and add some elements
3. Select the text tool
4. Verify elements don't disappear
5. Check console for any "Found 12 spaces" errors

## This is a temporary fix!

The debug logs will help identify where the 12 spaces are coming from. Once found, remove these hotfixes and implement a proper solution at the source.
