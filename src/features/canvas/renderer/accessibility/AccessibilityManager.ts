/**
 * Accessibility Manager
 * Handles keyboard navigation, focus management, and ARIA support for canvas elements
 * Following the comprehensive refactoring plan for modular renderer architecture
 */

import Konva from 'konva';
import type { ElementId } from '../../types/enhanced.types';

/**
 * Store adapter interface for accessibility integration
 */
export interface AccessibilityStoreAdapter {
  getElements(): Array<[ElementId, any]>;
  getSelectedElementIds(): Set<ElementId>;
}

/**
 * Accessibility configuration
 */
export interface AccessibilityConfig {
  stage: Konva.Stage;
  nodeMap: Map<string, Konva.Node>;
  storeAdapter: AccessibilityStoreAdapter;
  onTextEditorOpen?: (elementId: ElementId, node: Konva.Node) => void;
  scheduleDraw?: (layer: 'main' | 'overlay' | 'preview') => void;
  debug?: {
    log?: boolean;
  };
}

/**
 * Focus ring styles configuration
 */
export interface FocusRingStyles {
  radius: number;
  stroke: string;
  strokeWidth: number;
  dash: number[];
  opacity: number;
  animationSpeed: number;
}

/**
 * Accessibility Manager
 * Manages keyboard navigation, focus states, and accessibility features
 */
export class AccessibilityManager {
  private config: AccessibilityConfig;
  private focusedElementId: ElementId | null = null;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private styles: FocusRingStyles;

  constructor(config: AccessibilityConfig) {
    this.config = config;

    // Default focus ring styles
    this.styles = {
      radius: 8,
      stroke: '#007AFF',
      strokeWidth: 2,
      dash: [5, 5],
      opacity: 0.8,
      animationSpeed: 50
    };

    this.setupAccessibility();

    if (this.config.debug?.log) {
      console.info('[AccessibilityManager] Initialized accessibility system');
    }
  }

  /**
   * Setup keyboard navigation and accessibility features
   */
  private setupAccessibility(): void {
    const container = this.config.stage.container();
    if (!container) {
      if (this.config.debug?.log) {
        console.warn('[AccessibilityManager] No stage container found');
      }
      return;
    }

    // Make stage focusable
    container.setAttribute('tabindex', '0');
    container.setAttribute('role', 'application');
    container.setAttribute('aria-label', 'Editable shapes canvas');

    // Setup keyboard handler
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!this.focusedElementId) return;

      const node = this.config.nodeMap.get(String(this.focusedElementId));
      if (!node) return;

      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          if (this.config.onTextEditorOpen) {
            this.config.onTextEditorOpen(this.focusedElementId, node);
          }
          break;

        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          e.preventDefault();
          this.navigateToNextElement(e.key);
          break;

        case 'Escape':
          e.preventDefault();
          this.clearFocus();
          break;
      }
    };

    this.keyHandler = handleKeyDown;
    container.addEventListener('keydown', handleKeyDown);

    if (this.config.debug?.log) {
      console.info('[AccessibilityManager] Keyboard navigation setup complete');
    }
  }

  /**
   * Navigate to the next element based on arrow key direction
   */
  private navigateToNextElement(direction: string): void {
    try {
      const elements = this.config.storeAdapter.getElements();
      if (elements.length === 0) return;

      let currentIndex = elements.findIndex(([id]) => id === this.focusedElementId);
      let nextIndex = currentIndex;

      switch (direction) {
        case 'ArrowRight':
        case 'ArrowDown':
          nextIndex = (currentIndex + 1) % elements.length;
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          nextIndex = currentIndex <= 0 ? elements.length - 1 : currentIndex - 1;
          break;
      }

      const [nextId] = elements[nextIndex];
      this.setFocusedElement(nextId);
    } catch (error) {
      if (this.config.debug?.log) {
        console.warn('[AccessibilityManager] Failed to navigate to next element:', error);
      }
    }
  }

  /**
   * Set the focused element and update visual indicators
   */
  setFocusedElement(elementId: ElementId): void {
    try {
      // Clear previous focus indicator
      this.clearFocusIndicator();

      this.focusedElementId = elementId;

      const node = this.config.nodeMap.get(String(elementId));
      if (!node) return;

      // Add focus ring for visual indication
      this.addFocusRing(node);

      if (this.config.debug?.log) {
        console.info(`[AccessibilityManager] Focus set to element: ${elementId}`);
      }

      // Trigger redraw
      if (this.config.scheduleDraw) {
        this.config.scheduleDraw('main');
      }
    } catch (error) {
      if (this.config.debug?.log) {
        console.error('[AccessibilityManager] Failed to set focused element:', error);
      }
    }
  }

  /**
   * Clear the current focus state
   */
  clearFocus(): void {
    this.clearFocusIndicator();
    this.focusedElementId = null;

    if (this.config.debug?.log) {
      console.info('[AccessibilityManager] Focus cleared');
    }

    // Trigger redraw
    if (this.config.scheduleDraw) {
      this.config.scheduleDraw('main');
    }
  }

  /**
   * Get the currently focused element ID
   */
  getFocusedElementId(): ElementId | null {
    return this.focusedElementId;
  }

  /**
   * Check if an element is currently focused
   */
  isElementFocused(elementId: ElementId): boolean {
    return this.focusedElementId === elementId;
  }

  /**
   * Add focus ring visual indicator to a node
   */
  private addFocusRing(node: Konva.Node): void {
    try {
      const group = node.parent as Konva.Group;
      if (!group) return;

      // Calculate focus ring radius based on node bounds
      const clientRect = node.getClientRect();
      const radius = Math.max(clientRect.width, clientRect.height) / 2 + this.styles.radius;

      // Create focus ring
      const focusRing = new Konva.Circle({
        name: 'focus-ring',
        x: node.x(),
        y: node.y(),
        radius,
        stroke: this.styles.stroke,
        strokeWidth: this.styles.strokeWidth,
        dash: this.styles.dash,
        opacity: this.styles.opacity,
        listening: false,
        perfectDrawEnabled: false
      });

      group.add(focusRing);
      focusRing.moveToBottom();

      // Animate the focus ring
      const anim = new Konva.Animation((frame) => {
        if (frame?.time) {
          focusRing.dashOffset(-frame.time / this.styles.animationSpeed);
        }
      }, group.getLayer());

      anim.start();
      (focusRing as any).focusAnimation = anim;

      if (this.config.debug?.log) {
        console.info('[AccessibilityManager] Focus ring added');
      }
    } catch (error) {
      if (this.config.debug?.log) {
        console.warn('[AccessibilityManager] Failed to add focus ring:', error);
      }
    }
  }

  /**
   * Clear focus ring visual indicator
   */
  private clearFocusIndicator(): void {
    try {
      if (!this.focusedElementId) return;

      const prevNode = this.config.nodeMap.get(String(this.focusedElementId));
      if (prevNode?.parent) {
        const group = prevNode.parent as Konva.Group;
        const focusRing = group.findOne('.focus-ring');
        if (focusRing) {
          // Stop animation
          const anim = (focusRing as any).focusAnimation;
          if (anim) {
            anim.stop();
          }
          focusRing.destroy();
        }
      }

      if (this.config.debug?.log) {
        console.info('[AccessibilityManager] Focus indicator cleared');
      }
    } catch (error) {
      if (this.config.debug?.log) {
        console.warn('[AccessibilityManager] Failed to clear focus indicator:', error);
      }
    }
  }

  /**
   * Setup ARIA attributes for text editor elements
   */
  setupTextEditorAccessibility(element: HTMLElement, isMultiline: boolean = false): void {
    try {
      element.setAttribute('role', 'textbox');
      element.setAttribute('aria-multiline', isMultiline.toString());
      
      if (!element.hasAttribute('tabindex')) {
        element.setAttribute('tabindex', '0');
      }

      // Add autofocus attribute for some browsers
      try {
        element.setAttribute('autofocus', 'true');
      } catch (error) {
        // Ignore autofocus errors in some browsers
      }

      if (this.config.debug?.log) {
        console.info('[AccessibilityManager] Text editor accessibility setup complete');
      }
    } catch (error) {
      if (this.config.debug?.log) {
        console.warn('[AccessibilityManager] Failed to setup text editor accessibility:', error);
      }
    }
  }

  /**
   * Enhanced focus management for text editor elements with retry mechanism
   */
  async focusTextEditor(element: HTMLElement, options?: { preventScroll?: boolean }): Promise<void> {
    const focusOptions = { preventScroll: true, ...options };

    try {
      // Immediate focus attempt
      (element as any).focus(focusOptions);

      // Setup retry mechanism for browsers that need it
      const focusTimers: number[] = [];
      
      const tryFocus = () => {
        try {
          if (document.activeElement !== element) {
            (element as any).focus(focusOptions);
          }
        } catch (error) {
          if (this.config.debug?.log) {
            console.warn('[AccessibilityManager] Focus retry failed:', error);
          }
        }
      };

      // Schedule multiple focus attempts
      const scheduleRetries = () => {
        focusTimers.push(setTimeout(tryFocus, 0) as unknown as number);
        focusTimers.push(setTimeout(tryFocus, 50) as unknown as number);
        focusTimers.push(setTimeout(tryFocus, 150) as unknown as number);
        
        requestAnimationFrame(tryFocus);
      };

      scheduleRetries();

      // Store timers for cleanup
      (element as any).__focusTimers = focusTimers;

      if (this.config.debug?.log) {
        console.info('[AccessibilityManager] Text editor focus scheduled with retries');
      }
    } catch (error) {
      if (this.config.debug?.log) {
        console.error('[AccessibilityManager] Failed to focus text editor:', error);
      }
    }
  }

  /**
   * Clean up focus timers for text editor elements
   */
  cleanupTextEditorFocus(element: HTMLElement): void {
    try {
      const timers: number[] = (element as any).__focusTimers || [];
      timers.forEach(timer => clearTimeout(timer));
      delete (element as any).__focusTimers;

      if (this.config.debug?.log && timers.length > 0) {
        console.info(`[AccessibilityManager] Cleaned up ${timers.length} focus timers`);
      }
    } catch (error) {
      if (this.config.debug?.log) {
        console.warn('[AccessibilityManager] Failed to cleanup focus timers:', error);
      }
    }
  }

  /**
   * Update focus ring styles
   */
  updateStyles(styles: Partial<FocusRingStyles>): void {
    this.styles = { ...this.styles, ...styles };
  }

  /**
   * Destroy accessibility manager and cleanup resources
   */
  destroy(): void {
    try {
      // Clear focus state
      this.clearFocus();

      // Remove keyboard event listener
      if (this.keyHandler) {
        const container = this.config.stage.container();
        if (container) {
          container.removeEventListener('keydown', this.keyHandler);
        }
        this.keyHandler = null;
      }

      if (this.config.debug?.log) {
        console.info('[AccessibilityManager] Accessibility system destroyed');
      }
    } catch (error) {
      if (this.config.debug?.log) {
        console.error('[AccessibilityManager] Failed to destroy accessibility system:', error);
      }
    }
  }
}