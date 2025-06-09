// Fix for Text Content Not Updating Live
// Location: Around line 339 in Canvas.tsx

// BEFORE:
// onChange={(e) => setEditingTextValue(e.target.value)}

// AFTER:
onChange={(e) => {
  const newValue = e.target.value;
  setEditingTextValue(newValue);
  // Update element content immediately for live updates
  updateElement(isEditingText, { content: newValue });
}}