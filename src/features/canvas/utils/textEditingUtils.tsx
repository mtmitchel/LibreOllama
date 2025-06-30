// src/features/canvas/utils/textEditingUtils.tsx
import { designSystem } from '../../../core/design-system';
import Konva from 'konva';
import { ElementId } from '../types/enhanced.types';

/**
 * CANVAS-NATIVE TEXT EDITING UTILITIES
 * Supporting the new FigJam-style text editing system
 */

export interface CanvasTextConfig {
  PADDING: number;
  MIN_WIDTH: number;
  MIN_HEIGHT: number;
  MAX_WIDTH: number;
  MAX_HEIGHT: number;
  LINE_HEIGHT: number;
  FONT_WEIGHT: string;
  LETTER_SPACING: number; // Number, not string for Konva compatibility
  EDIT_BACKGROUND: string;
  EDIT_BORDER: string;
  CURSOR_COLOR: string;
  CURSOR_WIDTH: number;
  FONT_COLOR: string;
}

export const CANVAS_TEXT_CONFIG: CanvasTextConfig = {
  PADDING: 8,
  MIN_WIDTH: 80,
  MIN_HEIGHT: 32,
  MAX_WIDTH: 800,
  MAX_HEIGHT: 600,
  LINE_HEIGHT: 1.25,
  FONT_WEIGHT: '400',
  LETTER_SPACING: 0, // Number, not string for Konva compatibility
  EDIT_BACKGROUND: 'rgba(59, 130, 246, 0.1)',
  EDIT_BORDER: '#3b82f6',
  CURSOR_COLOR: '#3b82f6',
  CURSOR_WIDTH: 2,
  FONT_COLOR: '#000000',
} as const;

/**
 * Measure text dimensions using Konva's native text measurement
 */
export const measureTextDimensions = (
  text: string, 
  fontSize: number, 
  fontFamily: string, 
  maxWidth: number = 600,
  enforceMinimums: boolean = true
) => {
  if (!text || text.trim().length === 0) {
    return {
      width: enforceMinimums ? CANVAS_TEXT_CONFIG.MIN_WIDTH : 20,
      height: enforceMinimums ? CANVAS_TEXT_CONFIG.MIN_HEIGHT : Math.ceil(fontSize * CANVAS_TEXT_CONFIG.LINE_HEIGHT),
    };
  }

  // Create temporary Konva Text node for accurate measurement
  const tempText = new Konva.Text({
    text: text,
    fontSize: fontSize,
    fontFamily: fontFamily,
    fontWeight: CANVAS_TEXT_CONFIG.FONT_WEIGHT,
    lineHeight: CANVAS_TEXT_CONFIG.LINE_HEIGHT,
    letterSpacing: CANVAS_TEXT_CONFIG.LETTER_SPACING,
    // Don't set width for single-line text to get natural width
    ...(text.includes('\n') && { wrap: 'word', width: maxWidth - CANVAS_TEXT_CONFIG.PADDING }),
  });

  const textWidth = tempText.getTextWidth();
  const textHeight = tempText.height(); // Use height() instead of deprecated getTextHeight()

  // Clean up
  tempText.destroy();

  // Calculate final dimensions with padding
  const finalWidth = textWidth + CANVAS_TEXT_CONFIG.PADDING;
  const finalHeight = textHeight + CANVAS_TEXT_CONFIG.PADDING / 2; // Less vertical padding

  return {
    width: enforceMinimums 
      ? Math.min(Math.max(finalWidth, CANVAS_TEXT_CONFIG.MIN_WIDTH), maxWidth)
      : Math.min(finalWidth, maxWidth),
    height: enforceMinimums 
      ? Math.max(finalHeight, CANVAS_TEXT_CONFIG.MIN_HEIGHT)
      : finalHeight,
  };
};

/**
 * Calculate cursor position within text
 */
export const calculateCursorPosition = (
  text: string,
  cursorIndex: number,
  fontSize: number,
  fontFamily: string
): { x: number; y: number } => {
  const textBeforeCursor = text.slice(0, cursorIndex);
  
  // Create temporary text node to measure cursor position
  const tempText = new Konva.Text({
    text: textBeforeCursor,
    fontSize: fontSize,
    fontFamily: fontFamily,
    fontWeight: CANVAS_TEXT_CONFIG.FONT_WEIGHT,
    lineHeight: CANVAS_TEXT_CONFIG.LINE_HEIGHT,
  });
  
  const cursorX = tempText.getTextWidth();
  const cursorY = 0; // Simplified for single-line cursor
  
  tempText.destroy();
  
  return {
    x: cursorX + CANVAS_TEXT_CONFIG.PADDING / 2,
    y: cursorY + CANVAS_TEXT_CONFIG.PADDING / 2,
  };
};

/**
 * Validate text input for canvas text elements
 */
export const validateTextInput = (text: string, maxLength: number = 1000): string => {
  if (!text) return '';
  
  // Remove control characters except newlines and tabs
  const cleaned = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Limit length
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength) : cleaned;
};

/**
 * Format text for display (handle empty states)
 */
export const formatDisplayText = (text: string, placeholder: string = 'Text'): string => {
  if (!text || text.trim().length === 0) {
    return placeholder;
  }
  return text;
};

/**
 * Calculate optimal font size based on container dimensions
 */
export const calculateOptimalFontSize = (
  text: string,
  containerWidth: number,
  containerHeight: number,
  fontFamily: string,
  minFontSize: number = 8,
  maxFontSize: number = 72
): number => {
  if (!text || text.trim().length === 0) {
    return 16; // Default font size
  }

  let fontSize = maxFontSize;
  
  while (fontSize > minFontSize) {
    const dimensions = measureTextDimensions(text, fontSize, fontFamily, containerWidth);
    
    if (dimensions.width <= containerWidth && dimensions.height <= containerHeight) {
      return fontSize;
    }
    
    fontSize -= 1;
  }
  
  return minFontSize;
};

/**
 * Text editing state management interface
 */
export interface TextEditingState {
  text: string;
  cursorPosition: number;
  isEditing: boolean;
}

/**
 * Create initial text editing state
 */
export const createTextEditingState = (initialText: string = ''): TextEditingState => ({
  text: initialText,
  cursorPosition: initialText.length,
  isEditing: false,
});

/**
 * Handle keyboard input for text editing
 */
export const handleTextKeyboardInput = (
  currentState: TextEditingState,
  keyEvent: KeyboardEvent
): TextEditingState => {
  const { text, cursorPosition } = currentState;
  let newText = text;
  let newCursorPosition = cursorPosition;

  switch (keyEvent.key) {
    case 'Backspace':
      if (cursorPosition > 0) {
        newText = text.slice(0, cursorPosition - 1) + text.slice(cursorPosition);
        newCursorPosition = cursorPosition - 1;
      }
      break;
      
    case 'Delete':
      if (cursorPosition < text.length) {
        newText = text.slice(0, cursorPosition) + text.slice(cursorPosition + 1);
      }
      break;
      
    case 'ArrowLeft':
      newCursorPosition = Math.max(0, cursorPosition - 1);
      break;
      
    case 'ArrowRight':
      newCursorPosition = Math.min(text.length, cursorPosition + 1);
      break;
      
    case 'Home':
      newCursorPosition = 0;
      break;
      
    case 'End':
      newCursorPosition = text.length;
      break;
      
    default:
      if (keyEvent.key.length === 1) {
        // Regular character input
        const validatedChar = validateTextInput(keyEvent.key);
        if (validatedChar) {
          newText = text.slice(0, cursorPosition) + validatedChar + text.slice(cursorPosition);
          newCursorPosition = cursorPosition + 1;
        }
      }
  }

  return {
    ...currentState,
    text: validateTextInput(newText),
    cursorPosition: newCursorPosition,
  };
};

/**
 * Legacy function compatibility - now returns empty cleanup
 * The old DOM-based editor is no longer used
 */
export const createTextEditor = (): (() => void) => {
  console.warn('[textEditingUtils] createTextEditor is deprecated. Use canvas-native text editing instead.');
  return () => {}; // No-op cleanup
};

