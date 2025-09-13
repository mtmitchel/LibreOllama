/**
 * Screen Reader Utilities for Canvas Accessibility
 * Provides comprehensive screen reader support with ARIA integration
 */

import { CanvasElement, ElementId, ElementOrSectionId, isRectangularElement, isCircleElement, isTextElement, isRectangleElement, isTriangleElement, isStickyNoteElement, isTableElement, isImageElement, isGroupElement } from '../types/enhanced.types';
import { accessibilityManager } from './AccessibilityManager';

export interface ScreenReaderDescription {
  primary: string;
  detailed: string;
  context: string;
  actions: string[];
}

export interface AriaAttributes {
  role: string;
  label: string;
  describedBy?: string;
  expanded?: boolean;
  selected?: boolean;
  level?: number;
  posInSet?: number;
  setSize?: number;
  live?: 'off' | 'polite' | 'assertive';
}

export class ScreenReaderUtils {
  private static instance: ScreenReaderUtils;
  private ariaDescriptions: Map<ElementOrSectionId, ScreenReaderDescription> = new Map();

  private constructor() {}

  public static getInstance(): ScreenReaderUtils {
    if (!ScreenReaderUtils.instance) {
      ScreenReaderUtils.instance = new ScreenReaderUtils();
    }
    return ScreenReaderUtils.instance;
  }

  /**
   * Generate comprehensive screen reader description for canvas element
   */
  public generateElementDescription(element: CanvasElement, context?: {
    totalElements?: number;
    selectedElements?: number;
    position?: number;
  }): ScreenReaderDescription {
    const primary = this.getPrimaryDescription(element);
    const detailed = this.getDetailedDescription(element);
    const contextInfo = this.getContextDescription(element, context);
    const actions = this.getAvailableActions(element);

    const description: ScreenReaderDescription = {
      primary,
      detailed,
      context: contextInfo,
      actions
    };

    this.ariaDescriptions.set(element.id, description);
    return description;
  }

  /**
   * Get primary, concise description for element
   */
  private getPrimaryDescription(element: CanvasElement): string {
    const type = this.getElementTypeName(element);
    const position = `at ${Math.round(element.x)}, ${Math.round(element.y)}`;
    
    return `${type} ${position}`;
  }

  /**
   * Get detailed description with dimensions and properties
   */
  private getDetailedDescription(element: CanvasElement): string {
    const parts: string[] = [];
    
    // Dimensions
    if (isCircleElement(element)) {
      parts.push(`radius ${Math.round(element.radius)} pixels`);
    } else if (isRectangularElement(element)) {
      parts.push(`${Math.round(element.width)} by ${Math.round(element.height)} pixels`);
    }
    
    // Visual properties - handle based on element type
    if (isRectangleElement(element) || isCircleElement(element) || isTriangleElement(element)) {
      if (element.fill && element.fill !== 'transparent') {
        parts.push(`filled with ${this.colorToAccessibleName(element.fill)}`);
      }
      
      if (element.stroke && element.stroke !== 'transparent') {
        const strokeWidth = element.strokeWidth || 1;
        parts.push(`${strokeWidth} pixel ${this.colorToAccessibleName(element.stroke)} border`);
      }
    } else if (isStickyNoteElement(element)) {
      if (element.backgroundColor && element.backgroundColor !== 'transparent') {
        parts.push(`background color ${this.colorToAccessibleName(element.backgroundColor)}`);
      }
    }
    
    // Rotation
    if (element.rotation && element.rotation !== 0) {
      parts.push(`rotated ${Math.round(element.rotation)} degrees`);
    }
    
    // Transparency - only for elements that support opacity
    if ((isImageElement(element) || isGroupElement(element)) && element.opacity && element.opacity < 1) {
      parts.push(`${Math.round(element.opacity * 100)}% opacity`);
    }
    
    // Text content for text elements
    if (isTextElement(element) && element.text) {
      parts.push(`containing text "${element.text}"`);
    }
    
    return parts.join(', ');
  }

  /**
   * Get contextual information about element's position in canvas
   */
  private getContextDescription(element: CanvasElement, context?: {
    totalElements?: number;
    selectedElements?: number;
    position?: number;
  }): string {
    const parts: string[] = [];
    
    if (context?.position && context?.totalElements) {
      parts.push(`item ${context.position} of ${context.totalElements}`);
    }
    
    if (context?.selectedElements && context.selectedElements > 1) {
      parts.push(`part of ${context.selectedElements} selected elements`);
    }
    
    if (element.isLocked) {
      parts.push('locked element');
    }
    
    return parts.join(', ');
  }

  /**
   * Get available actions for element
   */
  private getAvailableActions(element: CanvasElement): string[] {
    const actions: string[] = ['Select'];
    
    if (!element.isLocked) {
      actions.push('Move', 'Resize', 'Delete');
      
      if (element.type === 'text') {
        actions.push('Edit text');
      }
      
      actions.push('Change properties');
    }
    
    actions.push('Copy', 'Duplicate');
    
    return actions;
  }

  /**
   * Convert element type to accessible name
   */
  private getElementTypeName(element: CanvasElement): string {
    const typeNames: Record<string, string> = {
      'rectangle': 'Rectangle',
      'circle': 'Circle',
      'triangle': 'Triangle',
      'text': 'Text',
      'sticky-note': 'Sticky note',
      'image': 'Image',
      'connector': 'Connection line',
      'pen': 'Drawing',
      'marker': 'Marker drawing',
      'highlighter': 'Highlight',
      'section': 'Section container'
    };
    
    return typeNames[element.type] || 'Canvas element';
  }

  /**
   * Convert color values to accessible color names
   */
  private colorToAccessibleName(color: string): string {
    // Basic color mapping
    const colorNames: Record<string, string> = {
      '#000000': 'black',
      '#ffffff': 'white',
      '#ff0000': 'red',
      '#00ff00': 'green',
      '#0000ff': 'blue',
      '#ffff00': 'yellow',
      '#ff00ff': 'magenta',
      '#00ffff': 'cyan',
      '#ffa500': 'orange',
      '#800080': 'purple',
      '#a52a2a': 'brown',
      '#808080': 'gray',
      '#ffc0cb': 'pink'
    };
    
    const normalizedColor = color.toLowerCase();
    if (colorNames[normalizedColor]) {
      return colorNames[normalizedColor];
    }
    
    // Try to extract color information from hex/rgb
    if (color.startsWith('#')) {
      return this.describeHexColor(color);
    }
    
    if (color.startsWith('rgb')) {
      return this.describeRgbColor(color);
    }
    
    return color; // Return as-is if can't be described
  }

  /**
   * Describe hex color in accessible terms
   */
  private describeHexColor(hex: string): string {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;
    
    return this.describeRgbValues(rgb.r, rgb.g, rgb.b);
  }

  /**
   * Describe RGB color in accessible terms
   */
  private describeRgbColor(rgbString: string): string {
    const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return rgbString;
    
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    
    return this.describeRgbValues(r, g, b);
  }

  /**
   * Describe RGB values in accessible color terms
   */
  private describeRgbValues(r: number, g: number, b: number): string {
    // Determine dominant color channel
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    
    // Check for grayscale
    if (max - min < 30) {
      if (max < 50) return 'dark gray';
      if (max < 128) return 'gray';
      if (max < 200) return 'light gray';
      return 'white';
    }
    
    // Determine color family
    let colorFamily = '';
    if (r === max && g > b) colorFamily = 'orange-red';
    else if (r === max && b > g) colorFamily = 'red-purple';
    else if (r === max) colorFamily = 'red';
    else if (g === max && r > b) colorFamily = 'yellow-green';
    else if (g === max && b > r) colorFamily = 'green-blue';
    else if (g === max) colorFamily = 'green';
    else if (b === max && r > g) colorFamily = 'blue-purple';
    else if (b === max && g > r) colorFamily = 'blue-green';
    else colorFamily = 'blue';
    
    // Determine lightness
    const lightness = (max + min) / 2;
    let lightnessDesc = '';
    if (lightness < 64) lightnessDesc = 'dark ';
    else if (lightness > 192) lightnessDesc = 'light ';
    
    return lightnessDesc + colorFamily;
  }

  /**
   * Convert hex to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Generate ARIA attributes for canvas element
   */
  public generateAriaAttributes(element: CanvasElement, options?: {
    selected?: boolean;
    position?: number;
    totalElements?: number;
    expanded?: boolean;
  }): AriaAttributes {
    const description = this.ariaDescriptions.get(element.id) || 
                      this.generateElementDescription(element);
    
    const attributes: AriaAttributes = {
      role: this.getAriaRole(element),
      label: description.primary,
      describedBy: `element-${element.id}-details`
    };
    
    if (options?.selected !== undefined) {
      attributes.selected = options.selected;
    }
    
    if (options?.position && options?.totalElements) {
      attributes.posInSet = options.position;
      attributes.setSize = options.totalElements;
    }
    
    if (options?.expanded !== undefined) {
      attributes.expanded = options.expanded;
    }
    
    return attributes;
  }

  /**
   * Get appropriate ARIA role for element type
   */
  private getAriaRole(element: CanvasElement): string {
    const roleMap: Record<string, string> = {
      'text': 'text',
      'sticky-note': 'note',
      'section': 'group',
      'image': 'img',
      'connector': 'presentation'
    };
    
    return roleMap[element.type] || 'graphics-object';
  }

  /**
   * Create detailed description element for ARIA
   */
  public createAriaDescriptionElement(elementId: ElementId): HTMLElement | null {
    const description = this.ariaDescriptions.get(elementId);
    if (!description) return null;
    
    const detailsElement = document.createElement('div');
    detailsElement.id = `element-${elementId}-details`;
    detailsElement.setAttribute('aria-hidden', 'true');
    detailsElement.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    
    const content = [
      description.detailed,
      description.context,
      `Available actions: ${description.actions.join(', ')}`
    ].filter(Boolean).join('. ');
    
    detailsElement.textContent = content;
    
    return detailsElement;
  }

  /**
   * Announce element selection change
   */
  public announceSelectionChange(selectedElements: CanvasElement[]): void {
    if (selectedElements.length === 0) {
      accessibilityManager.announce('Selection cleared', 'medium');
      return;
    }
    
    if (selectedElements.length === 1) {
      const description = this.generateElementDescription(selectedElements[0]);
      accessibilityManager.announce(`Selected ${description.primary}`, 'medium');
      return;
    }
    
    const types = selectedElements.reduce((acc, element) => {
      const typeName = this.getElementTypeName(element);
      acc[typeName] = (acc[typeName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const typeDescriptions = Object.entries(types).map(([type, count]) => 
      count === 1 ? type : `${count} ${type.toLowerCase()}s`
    );
    
    const message = `Selected ${typeDescriptions.join(', ')}. Total: ${selectedElements.length} elements`;
    accessibilityManager.announce(message, 'medium');
  }

  /**
   * Announce element creation
   */
  public announceElementCreation(element: CanvasElement): void {
    const typeName = this.getElementTypeName(element);
    const position = `at ${Math.round(element.x)}, ${Math.round(element.y)}`;
    accessibilityManager.announce(`Created ${typeName} ${position}`, 'medium');
  }

  /**
   * Announce element deletion
   */
  public announceElementDeletion(elements: CanvasElement[]): void {
    if (elements.length === 1) {
      const typeName = this.getElementTypeName(elements[0]);
      accessibilityManager.announce(`Deleted ${typeName}`, 'medium');
    } else {
      accessibilityManager.announce(`Deleted ${elements.length} elements`, 'medium');
    }
  }

  /**
   * Announce element movement
   */
  public announceElementMovement(element: CanvasElement, newX: number, newY: number): void {
    const typeName = this.getElementTypeName(element);
    const newPosition = `to ${Math.round(newX)}, ${Math.round(newY)}`;
    accessibilityManager.announce(`Moved ${typeName} ${newPosition}`, 'low');
  }

  /**
   * Clear cached descriptions
   */
  public clearDescriptions(): void {
    this.ariaDescriptions.clear();
  }
}

// Export singleton instance
export const screenReaderUtils = ScreenReaderUtils.getInstance();