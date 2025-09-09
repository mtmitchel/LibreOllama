/**
 * DOM Overlay Management System
 * Centralized DOM overlay creation, styling, and browser compatibility fixes
 * Following the comprehensive refactoring plan for modular renderer architecture
 */

/**
 * Browser compatibility utilities for text editing
 */
export class BrowserCompatibility {
  /**
   * Apply browser-specific text visibility fixes
   * @param element - DOM element to fix
   * @param textColor - Text color to apply
   */
  static applyTextVisibilityFixes(element: HTMLElement, textColor: string): void {
    try {
      // Force text visibility with strong overrides in case of global CSS
      (element.style as any).setProperty('color', textColor, 'important');
    } catch {
      element.style.color = textColor;
    }
    
    try {
      (element.style as any).setProperty('-webkit-text-fill-color', textColor, 'important');
    } catch {
      (element.style as any).webkitTextFillColor = textColor;
    }
    
    try {
      (element.style as any).setProperty('opacity', '1', 'important');
      (element.style as any).setProperty('visibility', 'visible', 'important');
      (element.style as any).setProperty('mix-blend-mode', 'normal', 'important');
      (element.style as any).setProperty('filter', 'none', 'important');
      (element.style as any).setProperty('text-shadow', 'none', 'important');
    } catch (e) {
      console.warn('Failed to apply text visibility fixes:', e);
    }
  }

  /**
   * Apply Edge-specific text rendering fixes
   * @param element - DOM element to fix
   */
  static applyEdgeTextFixes(element: HTMLElement): void {
    // Ensure proper text rendering for left-aligned text in Edge
    element.style.textRendering = 'optimizeLegibility';
    (element.style as any).webkitFontSmoothing = 'antialiased';
    (element.style as any).mozOsxFontSmoothing = 'grayscale';
    
    // Additional contrast fix for Edge
    element.style.textDecoration = 'none';
    element.style.textIndent = '0px';
    
    // Force explicit font properties to prevent Edge defaults
    element.style.fontWeight = 'normal';
    element.style.fontStyle = 'normal';
    element.style.fontVariant = 'normal';
  }

  /**
   * Force text visibility for input debugging
   * @param element - Input element
   * @param fallbackColor - Fallback color to use
   */
  static forceTextVisibility(element: HTMLElement, fallbackColor: string = '#000000'): void {
    const computed = window.getComputedStyle(element);
    
    if (computed.opacity === '0' || computed.color === 'transparent' || computed.visibility === 'hidden') {
      console.warn('[DOM] Text is invisible! Forcing visibility...');
      (element.style as any).setProperty('color', fallbackColor, 'important');
      (element.style as any).setProperty('-webkit-text-fill-color', fallbackColor, 'important');
      (element.style as any).setProperty('opacity', '1', 'important');
      (element.style as any).setProperty('visibility', 'visible', 'important');
      (element.style as any).setProperty('background', 'white', 'important');
    }
  }
}

/**
 * Overlay styling configurations
 */
export interface OverlayStyles {
  position?: string;
  left?: string;
  top?: string;
  width?: string;
  height?: string;
  background?: string;
  border?: string;
  borderRadius?: string;
  fontFamily?: string;
  fontSize?: string;
  lineHeight?: string;
  padding?: string;
  margin?: string;
  resize?: string;
  outline?: string;
  boxShadow?: string;
  zIndex?: string;
  pointerEvents?: string;
  whiteSpace?: string;
  wordBreak?: string;
  overflowWrap?: string;
  textAlign?: string;
}

/**
 * DOM Overlay Manager for text editing overlays
 */
export class DOMOverlayManager {
  private overlayRoot: HTMLDivElement | null = null;
  private container: HTMLElement | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.ensureOverlayRoot();
  }

  /**
   * Ensure overlay root exists and is properly configured
   */
  private ensureOverlayRoot(): HTMLDivElement | null {
    if (!this.container) return null;
    
    const id = '__canvas_overlay_root__';
    let root = this.container.parentElement?.querySelector<HTMLDivElement>('#' + id);
    
    if (!root) {
      root = document.createElement('div');
      root.id = id;
      Object.assign(root.style, {
        position: 'absolute',
        inset: '0',
        pointerEvents: 'none', // overlay UI controls can flip this to 'auto' locally
        zIndex: '2',           // above Konva container (which defaults to zIndex: 0/1)
      });
      
      // Position root relative to the container's offset parent
      this.container.parentElement?.appendChild(root);
      
      // Ensure the container's parent is positioned
      const parent = this.container.parentElement as HTMLElement;
      const cs = getComputedStyle(parent);
      if (cs.position === 'static') {
        parent.style.position = 'relative';
      }
    }
    
    this.overlayRoot = root;
    return root;
  }

  /**
   * Get the overlay root element
   */
  getOverlayRoot(): HTMLDivElement | null {
    return this.overlayRoot || this.ensureOverlayRoot();
  }

  /**
   * Create a text editing overlay element
   * @param isContentEditable - Whether to use contenteditable or textarea
   * @param initialText - Initial text content
   * @param styles - Styling configuration
   * @returns Created overlay element
   */
  createTextOverlay(
    isContentEditable: boolean = false,
    initialText: string = '',
    styles: OverlayStyles = {}
  ): HTMLElement {
    const overlayRoot = this.getOverlayRoot();
    if (!overlayRoot) {
      throw new Error('Failed to create overlay root');
    }

    // Create wrapper for positioning
    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.pointerEvents = 'auto';
    
    // Create the actual input element
    const element = isContentEditable 
      ? document.createElement('div')
      : document.createElement('textarea');

    if (isContentEditable) {
      (element as HTMLDivElement).contentEditable = 'true';
      (element as HTMLDivElement).innerHTML = initialText;
    } else {
      (element as HTMLTextAreaElement).value = initialText;
    }

    // Apply default styles
    const defaultStyles: OverlayStyles = {
      position: 'absolute',
      left: '0px',
      top: '0px',
      background: 'white',
      border: 'none',
      borderRadius: '8px',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '14px',
      lineHeight: '1.2',
      padding: '8px',
      margin: '0',
      resize: 'none',
      outline: 'none',
      boxShadow: 'none',
      zIndex: '10',
      pointerEvents: 'auto',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      overflowWrap: 'break-word',
      ...styles
    };

    // Apply styles to the input element
    Object.assign(element.style, defaultStyles);

    // Add to wrapper and overlay
    wrapper.appendChild(element);
    overlayRoot.appendChild(wrapper);

    return element;
  }

  /**
   * Remove an overlay element
   * @param element - Element to remove
   */
  removeOverlay(element: HTMLElement): void {
    try {
      // Remove the wrapper if it exists
      const wrapper = element.parentElement;
      if (wrapper && wrapper.parentElement === this.overlayRoot) {
        wrapper.remove();
      } else {
        element.remove();
      }
    } catch (e) {
      console.warn('Failed to remove overlay element:', e);
    }
  }

  /**
   * Update overlay positioning
   * @param element - Element to position
   * @param left - Left position in pixels
   * @param top - Top position in pixels
   * @param width - Width in pixels
   * @param height - Height in pixels
   */
  updateOverlayPosition(
    element: HTMLElement,
    left: number,
    top: number,
    width?: number,
    height?: number
  ): void {
    const wrapper = element.parentElement;
    if (wrapper) {
      wrapper.style.left = `${left}px`;
      wrapper.style.top = `${top}px`;
      if (width !== undefined) wrapper.style.width = `${width}px`;
      if (height !== undefined) wrapper.style.height = `${height}px`;
    }
    
    if (width !== undefined) element.style.width = `${width}px`;
    if (height !== undefined) element.style.height = `${height}px`;
  }

  /**
   * Clean up all overlays
   */
  cleanup(): void {
    if (this.overlayRoot) {
      this.overlayRoot.innerHTML = '';
    }
  }

  /**
   * Get container bounding rectangle
   */
  getContainerRect(): DOMRect | null {
    return this.container?.getBoundingClientRect() || null;
  }
}

/**
 * Focus management utilities for overlay elements
 */
export class FocusManager {
  /**
   * Focus an element with retry attempts
   * @param element - Element to focus
   * @param attempts - Number of retry attempts
   */
  static async focusWithRetry(element: HTMLElement, attempts: number = 3): Promise<void> {
    const timers: number[] = [];
    
    const tryFocus = () => {
      try {
        if (document.activeElement !== element) {
          (element as any).focus({ preventScroll: true });
          
          // Handle selection for different element types
          if (element.tagName === 'TEXTAREA') {
            const len = (element as HTMLTextAreaElement).value?.length ?? 0;
            (element as HTMLTextAreaElement).setSelectionRange(len, len);
          } else if (element.contentEditable === 'true') {
            const sel = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(element);
            range.collapse(false);
            sel?.removeAllRanges();
            sel?.addRange(range);
          }
        }
      } catch (e) {
        console.warn('Failed to focus element:', e);
      }
    };

    // Try immediate focus
    tryFocus();

    // Schedule retry attempts
    for (let i = 0; i < attempts; i++) {
      const delay = [0, 50, 150][i] || 50;
      const timer = setTimeout(tryFocus, delay) as unknown as number;
      timers.push(timer);
    }

    // Store timers for cleanup
    (element as any).__focusTimers = timers;
  }

  /**
   * Clear focus timers from an element
   * @param element - Element to clean up
   */
  static clearFocusTimers(element: HTMLElement): void {
    try {
      const timers: number[] = (element as any).__focusTimers || [];
      timers.forEach((timer) => clearTimeout(timer));
      delete (element as any).__focusTimers;
    } catch (e) {
      console.warn('Failed to clear focus timers:', e);
    }
  }
}

/**
 * Overlay event management utilities
 */
export class OverlayEventManager {
  /**
   * Set up focus event handlers for an overlay element
   * @param element - Element to set up
   * @param wrapper - Wrapper element
   */
  static setupFocusHandlers(element: HTMLElement, wrapper: HTMLElement): void {
    const focusElement = (evt: Event) => {
      try {
        if (document.activeElement !== element) {
          (element as any).focus({ preventScroll: true });
          
          if (element.tagName === 'TEXTAREA') {
            const len = (element as HTMLTextAreaElement).value?.length ?? 0;
            (element as HTMLTextAreaElement).setSelectionRange(len, len);
          }
        }
      } catch (e) {
        console.warn('Failed to focus element in event handler:', e);
      }
    };

    wrapper.addEventListener('mousedown', focusElement, true);
    wrapper.addEventListener('pointerdown', focusElement, true);
  }

  /**
   * Set up input event debugging
   * @param element - Element to monitor
   */
  static setupInputDebugging(element: HTMLElement): void {
    // Monitor beforeinput events
    element.addEventListener('beforeinput', (e) => {
      console.log('[DOM] beforeinput event:', {
        inputType: (e as any).inputType,
        data: (e as any).data,
        color: element.style.color,
        webkitTextFillColor: (element.style as any).webkitTextFillColor,
        opacity: element.style.opacity,
        visibility: element.style.visibility,
        background: element.style.background,
        value: (element as any).value || (element as any).innerHTML
      });
      
      // Force visibility on input
      BrowserCompatibility.applyTextVisibilityFixes(element, element.style.color || '#111827');
    });

    // Monitor input events  
    element.addEventListener('input', (e) => {
      const computed = window.getComputedStyle(element);
      console.log('[DOM] input event fired:', {
        value: (element as any).value || (element as any).innerHTML,
        color: element.style.color,
        webkitTextFillColor: (element.style as any).webkitTextFillColor,
        opacity: element.style.opacity,
        computedColor: computed.color,
        computedWebkitTextFillColor: computed.webkitTextFillColor || computed.getPropertyValue('-webkit-text-fill-color'),
        computedOpacity: computed.opacity,
        computedVisibility: computed.visibility
      });
      
      // Check and force visibility if needed
      BrowserCompatibility.forceTextVisibility(element);
    }, { capture: true });
  }
}