/**
 * Rich Text Utilities for cursor position management in contentEditable elements
 * 
 * These utilities help manage cursor position in contentEditable elements that may contain
 * nested HTML elements like spans, bold, italic, and other styled content.
 */

/**
 * Represents an absolute cursor position within a contentEditable element
 */
export interface CursorPosition {
  /** Absolute character position from the start of the content */
  position: number;
  /** Reference to the contentEditable element */
  element: HTMLElement;
}

/**
 * Calculate the absolute cursor position within a contentEditable element
 * 
 * This function walks through the DOM tree of a contentEditable element and calculates
 * the absolute character position based on a given node and offset. It handles nested
 * elements and counts only the actual text content.
 * 
 * @param containerElement - The contentEditable container element
 * @param targetNode - The text node where the cursor is located
 * @param offset - The character offset within the target node
 * @returns The absolute character position from the start of the content
 * 
 * @example
 * ```typescript
 * const selection = window.getSelection();
 * if (selection && selection.rangeCount > 0) {
 *   const range = selection.getRangeAt(0);
 *   const position = getTextPosition(
 *     contentEditableElement,
 *     range.startContainer,
 *     range.startOffset
 *   );
 *   console.log('Cursor at position:', position);
 * }
 * ```
 */
export function getTextPosition(
  containerElement: HTMLElement,
  targetNode: Node,
  offset: number
): number {
  let position = 0;
  
  /**
   * Recursively walk through the DOM tree and count characters
   */
  function walkNode(node: Node): boolean {
    if (node === targetNode) {
      position += offset;
      return true; // Found the target node, stop walking
    }
    
    if (node.nodeType === Node.TEXT_NODE) {
      // Text node - count all characters
      const textLength = node.textContent?.length || 0;
      
      if (node === targetNode) {
        position += Math.min(offset, textLength);
        return true;
      } else {
        position += textLength;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Element node - walk through children
      const children = Array.from(node.childNodes);
      for (const child of children) {
        if (walkNode(child)) {
          return true; // Found target in this subtree
        }
      }
    }
    
    return false; // Target not found in this subtree
  }
  
  // Start walking from the container element
  walkNode(containerElement);
  
  return position;
}

/**
 * Restore cursor position to a specific absolute position within a contentEditable element
 * 
 * This function walks through the DOM tree and places the cursor at the specified
 * absolute character position. It handles nested elements and creates a proper
 * selection range.
 * 
 * @param containerElement - The contentEditable container element
 * @param targetPosition - The absolute character position where to place the cursor
 * @returns True if the position was successfully restored, false otherwise
 * 
 * @example
 * ```typescript
 * // Save cursor position
 * const selection = window.getSelection();
 * if (selection && selection.rangeCount > 0) {
 *   const range = selection.getRangeAt(0);
 *   const savedPosition = getTextPosition(
 *     contentEditableElement,
 *     range.startContainer,
 *     range.startOffset
 *   );
 *   
 *   // ... perform some text operations ...
 *   
 *   // Restore cursor position
 *   restoreCursorPosition(contentEditableElement, savedPosition);
 * }
 * ```
 */
export function restoreCursorPosition(
  containerElement: HTMLElement,
  targetPosition: number
): boolean {
  let currentPosition = 0;
  let targetNode: Node | null = null;
  let targetOffset = 0;
  
  /**
   * Recursively walk through the DOM tree to find the target position
   */
  function walkNode(node: Node): boolean {
    if (node.nodeType === Node.TEXT_NODE) {
      // Text node - check if target position is within this node
      const textLength = node.textContent?.length || 0;
      
      if (currentPosition + textLength >= targetPosition) {
        // Target position is within this text node
        targetNode = node;
        targetOffset = targetPosition - currentPosition;
        return true; // Found the target position
      } else {
        // Target position is beyond this node
        currentPosition += textLength;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Element node - walk through children
      const children = Array.from(node.childNodes);
      for (const child of children) {
        if (walkNode(child)) {
          return true; // Found target in this subtree
        }
      }
      
      // If this is a block element or br, it might contribute to position
      const tagName = (node as Element).tagName?.toLowerCase();
      if (tagName === 'br' || tagName === 'div' || tagName === 'p') {
        // These elements might represent line breaks
        if (currentPosition === targetPosition) {
          targetNode = node;
          targetOffset = 0;
          return true;
        }
      }
    }
    
    return false; // Target not found in this subtree
  }
  
  // Walk the DOM tree to find the target position
  walkNode(containerElement);
  
  // If no target node found, place cursor at the end
  if (!targetNode) {
    const lastTextNode = getLastTextNode(containerElement);
    if (lastTextNode) {
      targetNode = lastTextNode;
      targetOffset = lastTextNode.textContent?.length || 0;
    } else {
      // No text nodes, place cursor in the container
      targetNode = containerElement;
      targetOffset = 0;
    }
  }
  
  // Create and apply the selection range
  try {
    const selection = window.getSelection();
    if (!selection) return false;
    
    const range = document.createRange();
    
    if (targetNode.nodeType === Node.TEXT_NODE) {
      // Place cursor within text node
      range.setStart(targetNode, Math.min(targetOffset, targetNode.textContent?.length || 0));
      range.setEnd(targetNode, Math.min(targetOffset, targetNode.textContent?.length || 0));
    } else {
      // Place cursor at the beginning or end of element
      if (targetOffset === 0) {
        range.setStartBefore(targetNode);
        range.setEndBefore(targetNode);
      } else {
        range.setStartAfter(targetNode);
        range.setEndAfter(targetNode);
      }
    }
    
    selection.removeAllRanges();
    selection.addRange(range);
    
    return true;
  } catch (error) {
    console.warn('Failed to restore cursor position:', error);
    return false;
  }
}

/**
 * Get the current cursor position within a contentEditable element
 * 
 * @param containerElement - The contentEditable container element
 * @returns CursorPosition object with position and element reference, or null if no selection
 * 
 * @example
 * ```typescript
 * const cursorPos = getCurrentCursorPosition(contentEditableElement);
 * if (cursorPos) {
 *   console.log('Current position:', cursorPos.position);
 * }
 * ```
 */
export function getCurrentCursorPosition(containerElement: HTMLElement): CursorPosition | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }
  
  const range = selection.getRangeAt(0);
  const position = getTextPosition(containerElement, range.startContainer, range.startOffset);
  
  return {
    position,
    element: containerElement
  };
}

/**
 * Save the current cursor position and return a restore function
 * 
 * @param containerElement - The contentEditable container element
 * @returns A function that can be called to restore the cursor position, or null if no selection
 * 
 * @example
 * ```typescript
 * const restoreCursor = saveCursorPosition(contentEditableElement);
 * 
 * // ... perform text operations ...
 * 
 * if (restoreCursor) {
 *   restoreCursor(); // Restore the cursor to its saved position
 * }
 * ```
 */
export function saveCursorPosition(containerElement: HTMLElement): (() => boolean) | null {
  const cursorPos = getCurrentCursorPosition(containerElement);
  if (!cursorPos) {
    return null;
  }
  
  return () => restoreCursorPosition(containerElement, cursorPos.position);
}

/**
 * Helper function to find the last text node in an element
 */
function getLastTextNode(element: HTMLElement): Text | null {
  let lastTextNode: Text | null = null;
  
  function walkNode(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      lastTextNode = node as Text;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const children = Array.from(node.childNodes);
      for (const child of children) {
        walkNode(child);
      }
    }
  }
  
  walkNode(element);
  return lastTextNode;
}

/**
 * Get the total text length of a contentEditable element (excluding HTML tags)
 * 
 * @param containerElement - The contentEditable container element
 * @returns The total number of characters in the text content
 */
export function getTextLength(containerElement: HTMLElement): number {
  return containerElement.textContent?.length || 0;
}

/**
 * Check if a given position is valid within a contentEditable element
 * 
 * @param containerElement - The contentEditable container element
 * @param position - The position to validate
 * @returns True if the position is valid (0 <= position <= text length)
 */
export function isValidPosition(containerElement: HTMLElement, position: number): boolean {
  const textLength = getTextLength(containerElement);
  return position >= 0 && position <= textLength;
}
