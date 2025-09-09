/**
 * Core Text Editor for Canvas Elements
 * Integrates all foundational modules for comprehensive text editing
 * Following the comprehensive refactoring plan for modular renderer architecture
 */

import type Konva from 'konva';
import type { ElementId, CanvasElement } from '../../types/enhanced.types';

import { 
  getEllipticalTextBounds, 
  getCircleTextBounds, 
  getBaselineOffsetPx, 
  getCirclePadPx,
  snapToPixel,
  ceilToPixel 
} from '../geometry';

import { 
  DOMOverlayManager, 
  BrowserCompatibility, 
  FocusManager,
  type OverlayStyles 
} from '../overlay/DOMOverlayManager';

import { 
  TextEditorEventManager,
  CompositionStateManager,
  KeyboardEventUtils,
  TimerManager,
  type TextEditingEventConfig 
} from '../events/EventManager';

import { 
  TextEditingStoreManager, 
  type CanvasStoreAdapter,
  type StoreUpdateOptions 
} from '../store/StoreIntegration';

/**
 * Text editor configuration
 */
export interface TextEditorConfig {
  stage: Konva.Stage;
  storeAdapter: CanvasStoreAdapter;
  updateElementCallback?: (id: ElementId, updates: any) => void;
  refreshTransformer?: (id?: ElementId) => void;
  scheduleDraw?: (layer: 'main' | 'overlay' | 'preview') => void;
  syncSelection?: (selectedIds: Set<ElementId>) => void;
  debug?: {
    outlineOverlay?: boolean;
    log?: boolean;
    zeroBaseline?: boolean;
  };
}

/**
 * Element positioning data
 */
interface ElementPositioning {
  left: number;
  top: number;
  width: number;
  height: number;
  contentLeft: number;
  contentTop: number;
  contentWidth: number;
  contentHeight: number;
  padding: number;
}

/**
 * Text editing session state
 */
interface EditingSession {
  elementId: ElementId;
  element: CanvasElement;
  node: Konva.Group;
  textElement: HTMLElement;
  wrapperElement: HTMLElement;
  originalText?: string;
  originalDimensions?: { width?: number; height?: number; radius?: number; radiusX?: number; radiusY?: number };
  eventBinding?: any;
  isCircle: boolean;
  isSticky: boolean;
  isContentEditable: boolean;
}

/**
 * Main Text Editor Class
 * Orchestrates all text editing functionality using modular components
 */
export class CanvasTextEditor {
  private config: TextEditorConfig;
  private overlayManager: DOMOverlayManager;
  private eventManager: TextEditorEventManager;
  private compositionManager: CompositionStateManager;
  private timerManager: TimerManager;
  private storeManager: TextEditingStoreManager;
  
  // Current editing session
  private currentSession: EditingSession | null = null;

  constructor(config: TextEditorConfig) {
    this.config = config;
    this.overlayManager = new DOMOverlayManager(config.stage.container());
    this.eventManager = new TextEditorEventManager();
    this.compositionManager = new CompositionStateManager();
    this.timerManager = new TimerManager();
    this.storeManager = new TextEditingStoreManager(config.storeAdapter);
  }

  /**
   * Open text editor for an element
   * @param elementId - Element ID to edit
   * @param node - Konva node
   * @param element - Element data
   */
  async openEditor(elementId: ElementId, node: Konva.Group, element: CanvasElement): Promise<void> {
    // Close any existing editor first
    this.closeCurrentEditor();

    console.info('[TextEditor] Opening editor for', elementId);

    try {
      // Determine element characteristics
      const isCircle = this.isCircleElement(element);
      const isSticky = this.isStickyElement(element);
      const isContentEditable = isCircle; // Circles use contenteditable for better text flow

      // Calculate positioning
      const positioning = this.calculateElementPositioning(element, node, isCircle, isSticky);

      // Create DOM overlay
      const initialText = this.getElementText(element);
      const styles = this.buildOverlayStyles(element, positioning, isCircle, isSticky);
      
      const textElement = this.overlayManager.createTextOverlay(
        isContentEditable,
        initialText,
        styles
      );

      // Position overlay
      this.overlayManager.updateOverlayPosition(
        textElement,
        positioning.contentLeft,
        positioning.contentTop,
        positioning.contentWidth,
        positioning.contentHeight
      );

      // Apply browser compatibility fixes
      const textColor = this.getElementTextColor(element);
      BrowserCompatibility.applyTextVisibilityFixes(textElement, textColor);
      
      if (!isCircle && this.isRectangleElement(element)) {
        BrowserCompatibility.applyEdgeTextFixes(textElement);
      }

      // Create editing session
      const session: EditingSession = {
        elementId,
        element,
        node,
        textElement,
        wrapperElement: textElement.parentElement!,
        originalText: initialText,
        originalDimensions: this.captureOriginalDimensions(element),
        isCircle,
        isSticky,
        isContentEditable
      };

      // Set up events
      await this.setupEditingEvents(session);

      // Start editing session in store
      this.storeManager.startEditing(elementId, initialText);

      // Hide transformer and prepare visual state
      this.prepareEditingVisualState(session);

      // Focus the editor
      await FocusManager.focusWithRetry(textElement);

      // Store session
      this.currentSession = session;

      console.info('[TextEditor] Editor opened successfully for', elementId);

    } catch (error) {
      console.error('[TextEditor] Failed to open editor:', error);
      this.closeCurrentEditor();
      throw error;
    }
  }

  /**
   * Close current editing session
   */
  closeCurrentEditor(): void {
    if (!this.currentSession) return;

    console.info('[TextEditor] Closing editor for', this.currentSession.elementId);

    try {
      // Clean up events
      this.eventManager.cleanupElement(this.currentSession.elementId);
      this.compositionManager.endComposition(this.currentSession.elementId);
      this.timerManager.clearTimers(this.currentSession.elementId);
      FocusManager.clearFocusTimers(this.currentSession.textElement);

      // Remove overlay
      this.overlayManager.removeOverlay(this.currentSession.textElement);

      // Restore visual state
      this.restoreEditingVisualState(this.currentSession);

      // Clear session
      this.currentSession = null;

    } catch (error) {
      console.error('[TextEditor] Error closing editor:', error);
    }
  }

  /**
   * Commit current editing session
   */
  commitCurrentEdit(): void {
    if (!this.currentSession) return;

    const session = this.currentSession;
    console.info('[TextEditor] Committing edit for', session.elementId);

    try {
      // Get final text and dimensions
      const finalText = this.getTextElementValue(session.textElement, session.isContentEditable);
      const finalDimensions = this.calculateFinalDimensions(session, finalText);

      // Commit to store
      this.storeManager.commitEditing(session.elementId, finalText, finalDimensions);

      // Refresh transformer if dimensions changed
      if (finalDimensions && this.config.refreshTransformer) {
        this.config.refreshTransformer(session.elementId);
      }

      // Schedule redraw
      if (this.config.scheduleDraw) {
        this.config.scheduleDraw('main');
        if (finalDimensions) {
          this.config.scheduleDraw('overlay');
        }
      }

    } catch (error) {
      console.error('[TextEditor] Error committing edit:', error);
    } finally {
      this.closeCurrentEditor();
    }
  }

  /**
   * Cancel current editing session
   */
  cancelCurrentEdit(): void {
    if (!this.currentSession) return;

    const session = this.currentSession;
    console.info('[TextEditor] Canceling edit for', session.elementId);

    try {
      // Cancel in store (restore original state)
      this.storeManager.cancelEditing(
        session.elementId,
        session.originalText,
        session.originalDimensions
      );

    } catch (error) {
      console.error('[TextEditor] Error canceling edit:', error);
    } finally {
      this.closeCurrentEditor();
    }
  }

  /**
   * Check if currently editing an element
   * @param elementId - Element ID to check
   */
  isEditingElement(elementId: ElementId): boolean {
    return this.currentSession?.elementId === elementId;
  }

  /**
   * Get current editing element ID
   */
  getCurrentEditingId(): ElementId | null {
    return this.currentSession?.elementId || null;
  }

  /**
   * Cleanup all resources
   */
  destroy(): void {
    this.closeCurrentEditor();
    this.eventManager.cleanupAll();
    this.compositionManager.clearAll();
    this.timerManager.clearAllTimers();
    this.overlayManager.cleanup();
  }

  // Private helper methods

  private isCircleElement(element: CanvasElement): boolean {
    return element.type === 'circle' || element.type === 'circle-text';
  }

  private isStickyElement(element: CanvasElement): boolean {
    return element.type === 'sticky';
  }

  private isRectangleElement(element: CanvasElement): boolean {
    return element.type === 'rectangle';
  }

  private getElementText(element: CanvasElement): string {
    return (element as any).text || '';
  }

  private getElementTextColor(element: CanvasElement): string {
    return (element as any).color || (element as any).textColor || '#111827';
  }

  private getTextElementValue(textElement: HTMLElement, isContentEditable: boolean): string {
    if (isContentEditable) {
      return (textElement as HTMLDivElement).innerText || '';
    } else {
      return (textElement as HTMLTextAreaElement).value || '';
    }
  }

  private calculateElementPositioning(
    element: CanvasElement, 
    node: Konva.Group, 
    isCircle: boolean, 
    isSticky: boolean
  ): ElementPositioning {
    const containerRect = this.config.stage.container().getBoundingClientRect();
    const stageScale = this.getStageScale();
    
    // Get element bounds from Konva node
    const rect = node.getClientRect({ skipTransform: false });
    const left = containerRect.left + rect.x;
    const top = containerRect.top + rect.y;
    const width = rect.width;
    const height = rect.height;

    let contentLeft = left;
    let contentTop = top;
    let contentWidth = width;
    let contentHeight = height;
    let padding = 8;

    if (isCircle) {
      // Circle positioning with inscribed square
      padding = getCirclePadPx(element);
      const radius = (element as any).radius || 50;
      const bounds = getCircleTextBounds(radius, padding / stageScale);
      
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      const scaledWidth = bounds.width * stageScale;
      const scaledHeight = bounds.height * stageScale;
      
      contentLeft = centerX - scaledWidth / 2;
      contentTop = centerY - scaledHeight / 2;
      contentWidth = scaledWidth;
      contentHeight = scaledHeight;
    } else {
      // Rectangle/sticky positioning
      const padPx = padding;
      contentLeft = left + padPx;
      contentTop = top + padPx;
      contentWidth = Math.max(4, width - padPx * 2);
      contentHeight = Math.max(4, height - padPx * 2);
    }

    return {
      left,
      top,
      width,
      height,
      contentLeft: Math.round(contentLeft),
      contentTop: Math.round(contentTop),
      contentWidth: Math.round(contentWidth),
      contentHeight: Math.round(contentHeight),
      padding
    };
  }

  private buildOverlayStyles(
    element: CanvasElement, 
    positioning: ElementPositioning, 
    isCircle: boolean, 
    isSticky: boolean
  ): OverlayStyles {
    const fontSize = (element as any).fontSize || 14;
    const fontFamily = (element as any).fontFamily || 'Inter, system-ui, sans-serif';
    const lineHeight = (element as any).lineHeight || 1.2;
    const textColor = this.getElementTextColor(element);
    const backgroundColor = (element as any).fill || 'white';

    const styles: OverlayStyles = {
      fontFamily,
      fontSize: `${fontSize}px`,
      lineHeight: String(lineHeight),
      background: backgroundColor,
      color: textColor,
      padding: `${positioning.padding}px`,
      border: 'none',
      outline: 'none',
      resize: 'none',
      overflow: 'hidden'
    };

    if (isCircle) {
      styles.borderRadius = '50%';
      styles.textAlign = 'center';
    } else if (isSticky) {
      styles.borderRadius = '8px';
    }

    return styles;
  }

  private async setupEditingEvents(session: EditingSession): Promise<void> {
    const eventConfig: TextEditingEventConfig = {
      onKeyDown: this.createKeyDownHandler(session),
      onBlur: this.createBlurHandler(session),
      onInput: this.createInputHandler(session),
      onCompositionStart: () => this.compositionManager.startComposition(session.elementId),
      onCompositionEnd: () => this.compositionManager.endComposition(session.elementId),
      onStageTransform: () => this.handleStageTransform(session),
      onDocumentMouseDown: this.createDocumentMouseDownHandler(session)
    };

    session.eventBinding = this.eventManager.bindTextEditingEvents(
      session.elementId,
      session.textElement,
      session.wrapperElement,
      this.config.stage,
      eventConfig
    );
  }

  private createKeyDownHandler(session: EditingSession) {
    return (event: KeyboardEvent) => {
      if (KeyboardEventUtils.isEscape(event)) {
        event.preventDefault();
        this.cancelCurrentEdit();
      } else if (KeyboardEventUtils.isCommitCombination(event)) {
        // Let Enter work normally for multi-line editing
        // Commit on blur or explicit action instead
      }
    };
  }

  private createBlurHandler(session: EditingSession) {
    return (event: FocusEvent) => {
      // Delay to allow for focus to move to other parts of the editor
      setTimeout(() => {
        if (this.currentSession === session && 
            !session.wrapperElement.contains(document.activeElement)) {
          this.commitCurrentEdit();
        }
      }, 100);
    };
  }

  private createInputHandler(session: EditingSession) {
    return (event: Event) => {
      // Skip updates during composition
      if (this.compositionManager.isComposing(session.elementId)) {
        return;
      }

      try {
        // Get current text
        const currentText = this.getTextElementValue(session.textElement, session.isContentEditable);
        
        // Update store with live text
        this.storeManager.updateTextLive(session.elementId, currentText, true);

        // Handle auto-resize for dynamic elements
        if (session.isCircle || session.isSticky) {
          this.handleAutoResize(session, currentText);
        }

        // Force text visibility if needed
        BrowserCompatibility.forceTextVisibility(session.textElement);

      } catch (error) {
        console.warn('[TextEditor] Error handling input:', error);
      }
    };
  }

  private createDocumentMouseDownHandler(session: EditingSession) {
    return (event: MouseEvent) => {
      // Check if click is outside the editor
      if (!session.wrapperElement.contains(event.target as Node) &&
          !session.node.getStage()?.container().contains(event.target as Node)) {
        this.commitCurrentEdit();
      }
    };
  }

  private handleStageTransform(session: EditingSession): void {
    // Recalculate positioning when stage transforms (zoom/pan)
    try {
      const positioning = this.calculateElementPositioning(
        session.element,
        session.node,
        session.isCircle,
        session.isSticky
      );

      this.overlayManager.updateOverlayPosition(
        session.textElement,
        positioning.contentLeft,
        positioning.contentTop,
        positioning.contentWidth,
        positioning.contentHeight
      );
    } catch (error) {
      console.warn('[TextEditor] Error handling stage transform:', error);
    }
  }

  private handleAutoResize(session: EditingSession, currentText: string): void {
    // TODO: Implement auto-resize logic for circles and sticky notes
    // This would involve measuring text dimensions and updating element size
    console.debug('[TextEditor] Auto-resize not yet implemented');
  }

  private prepareEditingVisualState(session: EditingSession): void {
    // Hide transformer during editing
    try {
      // This would typically hide the transformer/selection handles
      if (this.config.refreshTransformer) {
        this.config.refreshTransformer();
      }
    } catch (error) {
      console.warn('[TextEditor] Error preparing visual state:', error);
    }
  }

  private restoreEditingVisualState(session: EditingSession): void {
    // Restore transformer after editing
    try {
      if (this.config.refreshTransformer) {
        this.config.refreshTransformer(session.elementId);
      }
    } catch (error) {
      console.warn('[TextEditor] Error restoring visual state:', error);
    }
  }

  private captureOriginalDimensions(element: CanvasElement): any {
    return {
      width: (element as any).width,
      height: (element as any).height,
      radius: (element as any).radius,
      radiusX: (element as any).radiusX,
      radiusY: (element as any).radiusY
    };
  }

  private calculateFinalDimensions(session: EditingSession, finalText: string): any {
    // TODO: Calculate final dimensions based on text content
    // For now, return undefined (no dimension changes)
    return undefined;
  }

  private getStageScale(): number {
    return this.config.stage.scaleX() || 1;
  }
}