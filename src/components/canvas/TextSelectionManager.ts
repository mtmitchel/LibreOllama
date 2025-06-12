// src/components/canvas/TextSelectionManager.ts
interface TextSelection {
  elementId: string;
  startIndex: number;
  endIndex: number;
  bounds: { x: number; y: number; width: number; height: number };
  selectedText: string;
}

class TextSelectionManager {
  private selection: TextSelection | null = null;
  private isSelecting = false;

  detectTextSelection(textElement: any, pointerPos: { x: number; y: number }) {
    // const text = textElement.text(); // Unused
    // const fontSize = textElement.fontSize(); // Unused
    
    // Calculate character position based on pointer
    const charIndex = this.getCharacterIndex(textElement, pointerPos);
    
    return {
      elementId: textElement.attrs.customId, // Assuming elements have a customId in attrs
      charIndex,
      bounds: this.getCharacterBounds(textElement, charIndex)
    };
  }

  private getCharacterIndex(textElement: any, pointerPos: { x: number; y: number }): number {
    const text = textElement.text();
    const fontSize = textElement.fontSize();
    const x = pointerPos.x - textElement.x();
    const y = pointerPos.y - textElement.y();
    
    // Approximate character width (adjust based on font)
    const charWidth = fontSize * 0.6;
    const lineHeight = fontSize * 1.2;
    
    const lineIndex = Math.floor(y / lineHeight);
    const charIndexInLine = Math.floor(x / charWidth);
    
    // Calculate absolute character index
    const lines = text.split('\n');
    let absoluteIndex = 0;
    
    for (let i = 0; i < lineIndex; i++) {
      if (lines[i]) {
        absoluteIndex += lines[i].length + 1; // +1 for newline character
      }
    }
    absoluteIndex += charIndexInLine;
    
    return Math.max(0, Math.min(absoluteIndex, text.length));
  }

  private getCharacterBounds(textElement: any, charIndex: number): { x: number; y: number; width: number; height: number } {
    const text = textElement.text();
    const fontSize = textElement.fontSize();
    const charWidth = fontSize * 0.6;
    const lineHeight = fontSize * 1.2;
    
    let currentLine = 0;
    let charsInLine = 0;
    let x = 0;
    let y = 0;

    for (let i = 0; i < charIndex; i++) {
      if (text[i] === '\n') {
        currentLine++;
        charsInLine = 0;
      } else {
        charsInLine++;
      }
    }

    x = textElement.x() + charsInLine * charWidth;
    y = textElement.y() + currentLine * lineHeight;
    
    return {
      x,
      y,
      width: charWidth, // Simplified, actual width depends on char
      height: lineHeight
    };
  }

  startSelection(textElement: any, pointerPos: { x: number; y: number }) {
    this.isSelecting = true;
    const initialSelection = this.detectTextSelection(textElement, pointerPos);
    this.selection = {
      elementId: initialSelection.elementId,
      startIndex: initialSelection.charIndex,
      endIndex: initialSelection.charIndex,
      bounds: initialSelection.bounds, // Will update as selection grows
      selectedText: ''
    };
  }

  updateSelection(textElement: any, pointerPos: { x: number; y: number }) {
    if (!this.isSelecting || !this.selection) return;

    const currentSelection = this.detectTextSelection(textElement, pointerPos);
    this.selection.endIndex = currentSelection.charIndex;

    // Update bounds and selectedText (simplified)
    const start = Math.min(this.selection.startIndex, this.selection.endIndex);
    const end = Math.max(this.selection.startIndex, this.selection.endIndex);
    this.selection.selectedText = textElement.text().substring(start, end);
    
    // Bounds calculation would need to span the entire selection
    // For simplicity, we're not fully implementing dynamic bounds update here
  }

  endSelection(): TextSelection | null {
    this.isSelecting = false;
    const finalSelection = this.selection;
    // this.selection = null; // Optionally clear after getting it
    return finalSelection;
  }

  getSelection(): TextSelection | null {
    return this.selection;
  }

  clearSelection() {
    this.selection = null;
    this.isSelecting = false;
  }
}

export default TextSelectionManager;
