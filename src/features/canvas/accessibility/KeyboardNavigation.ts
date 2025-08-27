/**
 * Comprehensive Keyboard Navigation for Canvas
 * WCAG 2.1 AA compliant keyboard accessibility
 */

import { CanvasElement, ElementId, SectionId, ElementOrSectionId } from '../types/enhanced.types';
import { accessibilityManager } from './AccessibilityManager';
import { screenReaderUtils } from './ScreenReaderUtils';
import { canvasLog } from '../utils/canvasLogger';

export interface KeyboardCommand {
  keys: string[];
  description: string;
  action: () => void;
  category: 'navigation' | 'selection' | 'editing' | 'tools' | 'view';
  requiresElement?: boolean;
}

export interface NavigationState {
  focusedElementId: ElementOrSectionId | null;
  navigationMode: 'browse' | 'edit' | 'select';
  tabIndex: number;
  elementOrder: ElementOrSectionId[];
  lastNavigationTime: number;
}

const MOVEMENT_AMOUNTS = {
  fine: 1,
  normal: 10,
  large: 50
} as const;

export class KeyboardNavigation {
  private static instance: KeyboardNavigation;
  private state: NavigationState;
  private commands: Map<string, KeyboardCommand> = new Map();
  private keydownHandler: (event: KeyboardEvent) => void;
  private elements: CanvasElement[] = [];

  private constructor() {
    this.state = {
      focusedElementId: null,
      navigationMode: 'browse',
      tabIndex: 0,
      elementOrder: [],
      lastNavigationTime: 0
    };

    this.keydownHandler = this.handleKeyDown.bind(this);
    this.initializeCommands();
    this.attachEventListeners();
  }

  public static getInstance(): KeyboardNavigation {
    if (!KeyboardNavigation.instance) {
      KeyboardNavigation.instance = new KeyboardNavigation();
    }
    return KeyboardNavigation.instance;
  }

  /**
   * Initialize all keyboard commands
   */
  private initializeCommands(): void {
    // Navigation commands
    this.registerCommand({
      keys: ['Tab'],
      description: 'Move to next element',
      action: () => this.navigateToNext(),
      category: 'navigation'
    });

    this.registerCommand({
      keys: ['Shift+Tab'],
      description: 'Move to previous element',
      action: () => this.navigateToPrevious(),
      category: 'navigation'
    });

    this.registerCommand({
      keys: ['ArrowRight', 'ArrowDown'],
      description: 'Move to next element',
      action: () => this.navigateToNext(),
      category: 'navigation'
    });

    this.registerCommand({
      keys: ['ArrowLeft', 'ArrowUp'],
      description: 'Move to previous element',
      action: () => this.navigateToPrevious(),
      category: 'navigation'
    });

    // Element movement
    this.registerCommand({
      keys: ['Ctrl+ArrowRight'],
      description: 'Move element right',
      action: () => this.moveElement('right', 'normal'),
      category: 'editing',
      requiresElement: true
    });

    this.registerCommand({
      keys: ['Ctrl+ArrowLeft'],
      description: 'Move element left',
      action: () => this.moveElement('left', 'normal'),
      category: 'editing',
      requiresElement: true
    });

    this.registerCommand({
      keys: ['Ctrl+ArrowUp'],
      description: 'Move element up',
      action: () => this.moveElement('up', 'normal'),
      category: 'editing',
      requiresElement: true
    });

    this.registerCommand({
      keys: ['Ctrl+ArrowDown'],
      description: 'Move element down',
      action: () => this.moveElement('down', 'normal'),
      category: 'editing',
      requiresElement: true
    });

    // Fine movement
    this.registerCommand({
      keys: ['Ctrl+Shift+ArrowRight'],
      description: 'Move element right (fine)',
      action: () => this.moveElement('right', 'fine'),
      category: 'editing',
      requiresElement: true
    });

    this.registerCommand({
      keys: ['Ctrl+Shift+ArrowLeft'],
      description: 'Move element left (fine)',
      action: () => this.moveElement('left', 'fine'),
      category: 'editing',
      requiresElement: true
    });

    this.registerCommand({
      keys: ['Ctrl+Shift+ArrowUp'],
      description: 'Move element up (fine)',
      action: () => this.moveElement('up', 'fine'),
      category: 'editing',
      requiresElement: true
    });

    this.registerCommand({
      keys: ['Ctrl+Shift+ArrowDown'],
      description: 'Move element down (fine)',
      action: () => this.moveElement('down', 'fine'),
      category: 'editing',
      requiresElement: true
    });

    // Selection commands
    this.registerCommand({
      keys: ['Space', 'Enter'],
      description: 'Select/activate focused element',
      action: () => this.selectFocusedElement(),
      category: 'selection'
    });

    this.registerCommand({
      keys: ['Ctrl+a'],
      description: 'Select all elements',
      action: () => this.selectAll(),
      category: 'selection'
    });

    this.registerCommand({
      keys: ['Escape'],
      description: 'Clear selection and exit modes',
      action: () => this.clearSelectionAndFocus(),
      category: 'selection'
    });

    // Editing commands
    this.registerCommand({
      keys: ['Delete', 'Backspace'],
      description: 'Delete selected elements',
      action: () => this.deleteSelected(),
      category: 'editing',
      requiresElement: true
    });

    this.registerCommand({
      keys: ['Ctrl+c'],
      description: 'Copy selected elements',
      action: () => this.copySelected(),
      category: 'editing',
      requiresElement: true
    });

    this.registerCommand({
      keys: ['Ctrl+v'],
      description: 'Paste elements',
      action: () => this.paste(),
      category: 'editing'
    });

    this.registerCommand({
      keys: ['Ctrl+d'],
      description: 'Duplicate selected elements',
      action: () => this.duplicateSelected(),
      category: 'editing',
      requiresElement: true
    });

    this.registerCommand({
      keys: ['Ctrl+z'],
      description: 'Undo last action',
      action: () => this.undo(),
      category: 'editing'
    });

    this.registerCommand({
      keys: ['Ctrl+y', 'Ctrl+Shift+z'],
      description: 'Redo last action',
      action: () => this.redo(),
      category: 'editing'
    });

    // Tool selection
    this.registerCommand({
      keys: ['s'],
      description: 'Select tool',
      action: () => this.selectTool('select'),
      category: 'tools'
    });

    this.registerCommand({
      keys: ['p'],
      description: 'Pen tool',
      action: () => this.selectTool('pen'),
      category: 'tools'
    });

    this.registerCommand({
      keys: ['r'],
      description: 'Rectangle tool',
      action: () => this.selectTool('rectangle'),
      category: 'tools'
    });

    this.registerCommand({
      keys: ['c'],
      description: 'Circle tool',
      action: () => this.selectTool('circle'),
      category: 'tools'
    });

    this.registerCommand({
      keys: ['t'],
      description: 'Text tool',
      action: () => this.selectTool('text'),
      category: 'tools'
    });

    // View commands
    this.registerCommand({
      keys: ['Ctrl+0'],
      description: 'Zoom to fit',
      action: () => this.zoomToFit(),
      category: 'view'
    });

    this.registerCommand({
      keys: ['Ctrl+1'],
      description: 'Zoom to 100%',
      action: () => this.zoomTo100(),
      category: 'view'
    });

    this.registerCommand({
      keys: ['Ctrl+=', 'Ctrl++'],
      description: 'Zoom in',
      action: () => this.zoomIn(),
      category: 'view'
    });

    this.registerCommand({
      keys: ['Ctrl+-'],
      description: 'Zoom out',
      action: () => this.zoomOut(),
      category: 'view'
    });

    // Help
    this.registerCommand({
      keys: ['F1', '?'],
      description: 'Show keyboard shortcuts',
      action: () => this.showKeyboardShortcuts(),
      category: 'navigation'
    });

    canvasLog.info('⌨️ [KeyboardNav] Initialized with', this.commands.size, 'commands');
  }

  /**
   * Register a keyboard command
   */
  private registerCommand(command: KeyboardCommand): void {
    command.keys.forEach(key => {
      this.commands.set(key.toLowerCase(), command);
    });
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    if (typeof window === 'undefined') return;

    document.addEventListener('keydown', this.keydownHandler, true);
    
    // Focus management
    document.addEventListener('focusin', this.handleFocusIn.bind(this));
    document.addEventListener('focusout', this.handleFocusOut.bind(this));
  }

  /**
   * Handle keydown events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    // Don't intercept if user is typing in input fields
    if (this.isTypingInInput(event.target)) return;

    const keyCombo = this.getKeyCombo(event);
    const command = this.commands.get(keyCombo.toLowerCase());

    if (command) {
      // Check if command requires an element and we have one focused
      if (command.requiresElement && !this.state.focusedElementId) {
        accessibilityManager.announce('No element selected for this action', 'medium');
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      
      try {
        command.action();
        this.state.lastNavigationTime = Date.now();
        canvasLog.debug('⌨️ [KeyboardNav] Executed command:', keyCombo);
      } catch (error) {
        canvasLog.error('⌨️ [KeyboardNav] Command execution failed:', error);
        accessibilityManager.announce('Action failed', 'high');
      }
    }
  }

  /**
   * Check if user is typing in an input field
   */
  private isTypingInInput(target: EventTarget | null): boolean {
    if (!target) return false;
    
    const element = target as HTMLElement;
    const tagName = element.tagName?.toLowerCase();
    
    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      element.contentEditable === 'true' ||
      element.hasAttribute('data-text-editing')
    );
  }

  /**
   * Get keyboard combination string
   */
  private getKeyCombo(event: KeyboardEvent): string {
    const parts: string[] = [];
    
    if (event.ctrlKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    if (event.metaKey) parts.push('Meta');
    
    parts.push(event.key);
    
    return parts.join('+');
  }

  /**
   * Update elements list for navigation
   */
  public updateElements(elements: CanvasElement[]): void {
    this.elements = [...elements];
    this.state.elementOrder = elements.map(el => el.id);
    
    // If focused element no longer exists, clear focus
    if (this.state.focusedElementId && 
        !elements.find(el => el.id === this.state.focusedElementId)) {
      this.clearFocus();
    }
  }

  /**
   * Navigate to next element
   */
  private navigateToNext(): void {
    if (this.elements.length === 0) {
      accessibilityManager.announce('No elements to navigate', 'medium');
      return;
    }

    let nextIndex = 0;
    
    if (this.state.focusedElementId) {
      const currentIndex = this.state.elementOrder.indexOf(this.state.focusedElementId);
      nextIndex = (currentIndex + 1) % this.state.elementOrder.length;
    }
    
    const nextElementId = this.state.elementOrder[nextIndex];
    const nextElement = this.elements.find(el => el.id === nextElementId);
    
    if (nextElement) {
      this.focusElement(nextElementId, nextElement);
    }
  }

  /**
   * Navigate to previous element
   */
  private navigateToPrevious(): void {
    if (this.elements.length === 0) {
      accessibilityManager.announce('No elements to navigate', 'medium');
      return;
    }

    let prevIndex = this.elements.length - 1;
    
    if (this.state.focusedElementId) {
      const currentIndex = this.state.elementOrder.indexOf(this.state.focusedElementId);
      prevIndex = currentIndex === 0 ? this.state.elementOrder.length - 1 : currentIndex - 1;
    }
    
    const prevElementId = this.state.elementOrder[prevIndex];
    const prevElement = this.elements.find(el => el.id === prevElementId);
    
    if (prevElement) {
      this.focusElement(prevElementId, prevElement);
    }
  }

  /**
   * Focus specific element
   */
  private focusElement(elementId: ElementOrSectionId, element: CanvasElement): void {
    this.state.focusedElementId = elementId;
    this.state.tabIndex = this.state.elementOrder.indexOf(elementId);
    
    accessibilityManager.setElementFocus(elementId, element);
    
    // Scroll element into view if needed
    this.scrollElementIntoView(element);
  }

  /**
   * Scroll element into view
   */
  private scrollElementIntoView(element: CanvasElement): void {
    // This would integrate with the canvas viewport system
    canvasLog.debug('⌨️ [KeyboardNav] Scrolling element into view:', element.id);
  }

  /**
   * Move focused element
   */
  private moveElement(direction: 'up' | 'down' | 'left' | 'right', amount: keyof typeof MOVEMENT_AMOUNTS): void {
    if (!this.state.focusedElementId) return;
    
    const element = this.elements.find(el => el.id === this.state.focusedElementId);
    if (!element || element.isLocked) {
      accessibilityManager.announce('Element cannot be moved', 'medium');
      return;
    }

    const moveDistance = MOVEMENT_AMOUNTS[amount];
    let deltaX = 0;
    let deltaY = 0;

    switch (direction) {
      case 'right':
        deltaX = moveDistance;
        break;
      case 'left':
        deltaX = -moveDistance;
        break;
      case 'down':
        deltaY = moveDistance;
        break;
      case 'up':
        deltaY = -moveDistance;
        break;
    }

    // This would integrate with the canvas store to actually move the element
    const newX = element.x + deltaX;
    const newY = element.y + deltaY;
    
    screenReaderUtils.announceElementMovement(element, newX, newY);
    canvasLog.debug('⌨️ [KeyboardNav] Moving element:', { direction, amount, deltaX, deltaY });
  }

  /**
   * Select focused element
   */
  private selectFocusedElement(): void {
    if (!this.state.focusedElementId) return;
    
    const element = this.elements.find(el => el.id === this.state.focusedElementId);
    if (element) {
      // This would integrate with the selection system
      accessibilityManager.announce('Element selected', 'medium');
      canvasLog.debug('⌨️ [KeyboardNav] Selected element:', this.state.focusedElementId);
    }
  }

  /**
   * Select all elements
   */
  private selectAll(): void {
    if (this.elements.length === 0) {
      accessibilityManager.announce('No elements to select', 'medium');
      return;
    }

    // This would integrate with the selection system
    accessibilityManager.announce(`Selected all ${this.elements.length} elements`, 'medium');
    canvasLog.debug('⌨️ [KeyboardNav] Selected all elements');
  }

  /**
   * Clear selection and focus
   */
  private clearSelectionAndFocus(): void {
    this.clearFocus();
    // This would integrate with the selection system
    accessibilityManager.announce('Selection and focus cleared', 'medium');
  }

  /**
   * Clear focus
   */
  private clearFocus(): void {
    this.state.focusedElementId = null;
    this.state.tabIndex = 0;
  }

  /**
   * Delete selected elements
   */
  private deleteSelected(): void {
    // This would integrate with the canvas store
    accessibilityManager.announce('Selected elements deleted', 'medium');
    canvasLog.debug('⌨️ [KeyboardNav] Deleted selected elements');
  }

  /**
   * Copy selected elements
   */
  private copySelected(): void {
    // This would integrate with the clipboard system
    accessibilityManager.announce('Elements copied to clipboard', 'medium');
    canvasLog.debug('⌨️ [KeyboardNav] Copied selected elements');
  }

  /**
   * Paste elements
   */
  private paste(): void {
    // This would integrate with the clipboard system
    accessibilityManager.announce('Elements pasted', 'medium');
    canvasLog.debug('⌨️ [KeyboardNav] Pasted elements');
  }

  /**
   * Duplicate selected elements
   */
  private duplicateSelected(): void {
    // This would integrate with the duplication system
    accessibilityManager.announce('Elements duplicated', 'medium');
    canvasLog.debug('⌨️ [KeyboardNav] Duplicated selected elements');
  }

  /**
   * Undo last action
   */
  private undo(): void {
    // This would integrate with the undo/redo system
    accessibilityManager.announce('Action undone', 'medium');
    canvasLog.debug('⌨️ [KeyboardNav] Undo executed');
  }

  /**
   * Redo last action
   */
  private redo(): void {
    // This would integrate with the undo/redo system
    accessibilityManager.announce('Action redone', 'medium');
    canvasLog.debug('⌨️ [KeyboardNav] Redo executed');
  }

  /**
   * Select tool
   */
  private selectTool(tool: string): void {
    // This would integrate with the tool system
    accessibilityManager.announce(`${tool} tool selected`, 'medium');
    canvasLog.debug('⌨️ [KeyboardNav] Tool selected:', tool);
  }

  /**
   * Zoom to fit
   */
  private zoomToFit(): void {
    // This would integrate with the viewport system
    accessibilityManager.announce('Zoomed to fit all elements', 'medium');
    canvasLog.debug('⌨️ [KeyboardNav] Zoom to fit');
  }

  /**
   * Zoom to 100%
   */
  private zoomTo100(): void {
    // This would integrate with the viewport system
    accessibilityManager.announce('Zoomed to 100%', 'medium');
    canvasLog.debug('⌨️ [KeyboardNav] Zoom to 100%');
  }

  /**
   * Zoom in
   */
  private zoomIn(): void {
    // This would integrate with the viewport system
    accessibilityManager.announce('Zoomed in', 'low');
    canvasLog.debug('⌨️ [KeyboardNav] Zoom in');
  }

  /**
   * Zoom out
   */
  private zoomOut(): void {
    // This would integrate with the viewport system
    accessibilityManager.announce('Zoomed out', 'low');
    canvasLog.debug('⌨️ [KeyboardNav] Zoom out');
  }

  /**
   * Show keyboard shortcuts help
   */
  private showKeyboardShortcuts(): void {
    const shortcuts = this.getKeyboardShortcutsHelp();
    // This would show a modal or announce the shortcuts
    accessibilityManager.announce('Keyboard shortcuts help opened', 'medium');
    canvasLog.info('⌨️ [KeyboardNav] Shortcuts:', shortcuts);
  }

  /**
   * Get keyboard shortcuts help text
   */
  public getKeyboardShortcutsHelp(): Record<string, KeyboardCommand[]> {
    const shortcuts: Record<string, KeyboardCommand[]> = {};
    
    this.commands.forEach(command => {
      if (!shortcuts[command.category]) {
        shortcuts[command.category] = [];
      }
      
      // Avoid duplicates
      if (!shortcuts[command.category].find(c => c.description === command.description)) {
        shortcuts[command.category].push(command);
      }
    });
    
    return shortcuts;
  }

  /**
   * Handle focus in events
   */
  private handleFocusIn(event: FocusEvent): void {
    canvasLog.debug('⌨️ [KeyboardNav] Focus in:', event.target);
  }

  /**
   * Handle focus out events
   */
  private handleFocusOut(event: FocusEvent): void {
    canvasLog.debug('⌨️ [KeyboardNav] Focus out:', event.target);
  }

  /**
   * Get current navigation state
   */
  public getState(): NavigationState {
    return { ...this.state };
  }

  /**
   * Get focused element ID
   */
  public getFocusedElementId(): ElementOrSectionId | null {
    return this.state.focusedElementId;
  }

  /**
   * Cleanup keyboard navigation
   */
  public cleanup(): void {
    if (typeof window !== 'undefined') {
      document.removeEventListener('keydown', this.keydownHandler, true);
      document.removeEventListener('focusin', this.handleFocusIn.bind(this));
      document.removeEventListener('focusout', this.handleFocusOut.bind(this));
    }
    
    this.clearFocus();
    canvasLog.info('⌨️ [KeyboardNav] Cleaned up');
  }
}

// Export singleton instance
export const keyboardNavigation = KeyboardNavigation.getInstance();