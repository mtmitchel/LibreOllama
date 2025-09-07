/**
 * DOM Editor Overlay Module
 * Manages contenteditable and textarea overlays for text editing
 * Ensures same-frame sync with canvas elements
 */

import type Konva from 'konva';
import { inscribedSquare, inscribedRectangle } from '../geometry';
import { measureText, getCircleTextLayout, getRectangleTextLayout } from '../text-layout';
import { CircleTextContract } from '../circle-text-contract';
import type { ElementId, CanvasElement, CircleElement, EditorState } from '../types';

export interface OverlayConfig {
  autoFitDuringTyping?: boolean;
  editorClipEnabled?: boolean;
  minFontSize?: number;
  maxFontSize?: number;
}

export interface MountResult {
  wrapper: HTMLDivElement;
  editor: HTMLTextAreaElement | HTMLDivElement;
  pad?: HTMLDivElement;
}

export class EditorOverlay {
  private container: HTMLDivElement | null = null;
  private currentMount: MountResult | null = null;
  private currentElementId: ElementId | null = null;
  private config: OverlayConfig;
  private rafId: number = 0;
  private inputCallback?: (id: ElementId, text: string) => void;
  private blurCallback?: (id: ElementId) => void;
  private measureCallback?: (id: ElementId, metrics: any) => void;
  private circleContract: CircleTextContract;

  constructor(config: OverlayConfig = {}) {
    this.config = {
      autoFitDuringTyping: false,
      editorClipEnabled: true,
      minFontSize: 8,
      maxFontSize: 72,
      ...config
    };
    
    // Initialize circle text contract
    this.circleContract = new CircleTextContract({ padPx: 8 });
  }

  /**
   * Set the container element for overlays
   */
  setContainer(container: HTMLDivElement): void {
    this.container = container;
  }

  /**
   * Set callbacks for editor events
   */
  setCallbacks(callbacks: {
    onInput?: (id: ElementId, text: string) => void;
    onBlur?: (id: ElementId) => void;
    onMeasure?: (id: ElementId, metrics: any) => void;
  }): void {
    this.inputCallback = callbacks.onInput;
    this.blurCallback = callbacks.onBlur;
    this.measureCallback = callbacks.onMeasure;
  }

  /**
   * Mount editor overlay for an element
   */
  mount(element: CanvasElement, group: Konva.Group): MountResult | null {
    if (!this.container) return null;

    // Unmount any existing editor
    this.unmount();

    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'canvas-editor-wrapper';
    wrapper.style.position = 'absolute';
    wrapper.style.pointerEvents = 'auto';
    wrapper.style.zIndex = '1000';

    // Create editor based on element type
    let editor: HTMLTextAreaElement | HTMLDivElement;
    let pad: HTMLDivElement | undefined;

    if (element.type === 'circle') {
      // Use contract for circle text
      const measurement = this.circleContract.calculate(element as CircleElement, group);
      const result = this.createCircleEditor(element as CircleElement, group, measurement);
      editor = result.editor;
      pad = result.pad;
      
      // Structure: wrapper -> pad -> editor
      wrapper.appendChild(pad);
      pad.appendChild(editor);
      
      // Apply contract positioning
      const centerScreen = this.getScreenCenter(group);
      this.circleContract.applyToDOM(wrapper, pad, editor, measurement, centerScreen);
    } else {
      editor = this.createDefaultEditor(element);
      wrapper.appendChild(editor);
    }

    // Position wrapper
    this.updatePosition(wrapper, group);

    // Add to container
    this.container.appendChild(wrapper);

    // Set up event handlers
    this.setupEventHandlers(editor, element.id);

    // Store current mount
    this.currentMount = { wrapper, editor, pad };
    this.currentElementId = element.id;

    // Focus editor
    requestAnimationFrame(() => {
      editor.focus();
      if (editor instanceof HTMLTextAreaElement) {
        editor.select();
      } else {
        const range = document.createRange();
        range.selectNodeContents(editor);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    });

    return this.currentMount;
  }

  /**
   * Update overlay position and size
   */
  update(element: CanvasElement, group: Konva.Group): void {
    if (!this.currentMount || this.currentElementId !== element.id) return;

    const { wrapper, editor, pad } = this.currentMount;

    // Update position
    this.updatePosition(wrapper, group);

    // Update size for circles using contract
    if (element.type === 'circle' && pad) {
      const measurement = this.circleContract.calculate(element as CircleElement, group);
      const centerScreen = this.getScreenCenter(group);
      
      // Apply contract update (editor is HTMLDivElement for circles)
      this.circleContract.applyToDOM(wrapper, pad, editor as HTMLDivElement, measurement, centerScreen);
      
      if ((window as any).__CANVAS_TEXT_DEBUG__) {
        console.log('Circle editor updated:', {
          sidePx: measurement.sidePx,
          contentWpx: measurement.contentWpx,
          isSquare: measurement.contentWpx === measurement.contentHpx
        });
      }
    }
  }

  /**
   * Unmount current editor overlay
   */
  unmount(): void {
    if (this.currentMount) {
      cancelAnimationFrame(this.rafId);
      
      // Trigger blur callback
      if (this.blurCallback && this.currentElementId) {
        this.blurCallback(this.currentElementId);
      }

      // Remove from DOM
      this.currentMount.wrapper.remove();
      this.currentMount = null;
      this.currentElementId = null;
    }
  }

  /**
   * Measure text for auto-grow
   */
  measure(text: string, element: CanvasElement): any {
    if (element.type === 'circle') {
      const circle = element as CircleElement;
      return measureText(
        text,
        circle.fontSize || 14,
        circle.fontFamily || 'Inter, system-ui, sans-serif'
      );
    }
    return null;
  }

  /**
   * Get screen center of a group
   */
  private getScreenCenter(group: Konva.Group): { x: number; y: number } {
    const stage = group.getStage();
    if (!stage) return { x: 0, y: 0 };
    
    const absTransform = group.getAbsoluteTransform();
    const worldCenter = { x: 0, y: 0 };
    const screenCenter = absTransform.point(worldCenter);
    
    const container = stage.container();
    const rect = container.getBoundingClientRect();
    
    return {
      x: rect.left + screenCenter.x,
      y: rect.top + screenCenter.y
    };
  }

  /**
   * Create circle-specific editor with clipping
   */
  private createCircleEditor(element: CircleElement, group: Konva.Group, measurement: any): { editor: HTMLDivElement; pad: HTMLDivElement } {
    // Create padding container
    const pad = document.createElement('div');
    
    if (this.config.editorClipEnabled) {
      pad.style.borderRadius = '50%';
      pad.style.overflow = 'hidden';
    }

    // Create contenteditable
    const editor = document.createElement('div');
    editor.className = 'canvas-text-editor circle-text';
    
    // Set font properties and wrap behavior - contract handles layout and sizing
    editor.style.fontFamily = element.fontFamily || 'Inter, system-ui, sans-serif';
    editor.style.fontSize = `${element.fontSize || 14}px`;
    editor.style.whiteSpace = 'pre-wrap';
    (editor.style as any).overflowWrap = 'break-word';
    editor.style.color = '#000';
    
    // CRITICAL: Ensure no flex/centering from CSS classes
    editor.style.display = 'block';
    editor.style.textAlign = 'left';
    editor.style.alignItems = 'unset';
    editor.style.justifyContent = 'unset';
    
    // Set initial text
    editor.textContent = element.text || '';
    
    // Debug visualization
    if ((window as any).__CANVAS_TEXT_DEBUG__) {
      editor.style.outline = '1px solid blue';
      editor.style.background = 'rgba(0, 100, 255, 0.05)';
      pad.style.outline = '1px solid red';
      console.log('Circle editor created with contract - LEFT TOP aligned');
    }

    return { editor, pad };
  }

  /**
   * Create default text editor
   */
  private createDefaultEditor(element: CanvasElement): HTMLTextAreaElement {
    const editor = document.createElement('textarea');
    editor.className = 'canvas-text-editor';
    editor.style.position = 'absolute';
    editor.style.padding = '12px';
    editor.style.margin = '0';
    editor.style.border = '2px solid #007AFF';
    editor.style.borderRadius = '4px';
    editor.style.outline = 'none';
    editor.style.background = 'white';
    editor.style.resize = 'none';
    editor.style.overflow = 'hidden';
    editor.style.fontFamily = 'Inter, system-ui, sans-serif';
    editor.style.fontSize = '14px';
    editor.style.lineHeight = '1.5';
    
    // Set dimensions based on element type
    if ('width' in element && 'height' in element) {
      editor.style.width = `${element.width}px`;
      editor.style.height = `${element.height}px`;
    }
    
    // Set initial text
    if ('text' in element) {
      editor.value = (element as any).text || '';
    }

    return editor;
  }

  /**
   * Update wrapper position based on group transform
   */
  private updatePosition(wrapper: HTMLDivElement, group: Konva.Group): void {
    const stage = group.getStage();
    if (!stage) return;

    const absTransform = group.getAbsoluteTransform();
    const pos = absTransform.point({ x: 0, y: 0 });
    const scale = group.getAbsoluteScale();

    wrapper.style.left = `${pos.x}px`;
    wrapper.style.top = `${pos.y}px`;
    wrapper.style.transform = `translate(-50%, -50%) scale(${scale.x}, ${scale.y})`;
    wrapper.style.transformOrigin = 'center';
  }

  /**
   * Set up event handlers for editor
   */
  private setupEventHandlers(editor: HTMLTextAreaElement | HTMLDivElement, elementId: ElementId): void {
    // Input handler with RAF batching
    const handleInput = () => {
      cancelAnimationFrame(this.rafId);
      this.rafId = requestAnimationFrame(() => {
        const text = editor instanceof HTMLTextAreaElement 
          ? editor.value 
          : editor.textContent || '';
        
        if (this.inputCallback) {
          this.inputCallback(elementId, text);
        }
      });
    };

    // Blur handler
    const handleBlur = () => {
      setTimeout(() => {
        if (this.blurCallback) {
          this.blurCallback(elementId);
        }
        this.unmount();
      }, 100);
    };

    // Prevent event propagation
    const stopPropagation = (e: Event) => {
      e.stopPropagation();
    };

    // Add event listeners
    editor.addEventListener('input', handleInput);
    editor.addEventListener('blur', handleBlur);
    editor.addEventListener('mousedown', stopPropagation);
    editor.addEventListener('mouseup', stopPropagation);
    editor.addEventListener('click', stopPropagation);
    editor.addEventListener('dblclick', stopPropagation);
    
    // Handle special keys
    editor.addEventListener('keydown', (e: KeyboardEvent) => {
      e.stopPropagation();
      
      if (e.key === 'Escape') {
        editor.blur();
      } else if (e.key === 'Enter' && e.shiftKey) {
        // Allow shift+enter for new lines
      } else if (e.key === 'Enter' && !e.shiftKey && editor instanceof HTMLTextAreaElement) {
        // Single enter commits for textarea
        e.preventDefault();
        editor.blur();
      }
    });

    // Sanitize pasted content for contenteditable
    if (editor instanceof HTMLDivElement) {
      editor.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = e.clipboardData?.getData('text/plain') || '';
        document.execCommand('insertText', false, text);
      });
    }
  }

  /**
   * Get current editor state
   */
  getState(): EditorState {
    const text = this.currentMount?.editor instanceof HTMLTextAreaElement
      ? this.currentMount.editor.value
      : this.currentMount?.editor.textContent || '';

    return {
      elementId: this.currentElementId,
      isActive: this.currentMount !== null,
      text
    };
  }

  /**
   * Dispose of the overlay manager
   */
  dispose(): void {
    this.unmount();
    this.container = null;
    this.inputCallback = undefined;
    this.blurCallback = undefined;
    this.measureCallback = undefined;
  }
}
