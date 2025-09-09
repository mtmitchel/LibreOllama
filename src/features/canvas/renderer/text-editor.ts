import Konva from 'konva';
import { ElementId, CanvasElement } from '../types/enhanced.types';

export interface TextEditorConfig {
  onTextCommit: (elementId: ElementId, text: string) => void;
  onTextCancel?: (elementId: ElementId) => void;
  rotateWithElement?: boolean;
  autoSize?: boolean;
  minWidth?: number;
  minHeight?: number;
}

export interface EditorStyle {
  fontSize: number;
  fontFamily: string;
  color: string;
  textAlign?: string;
  lineHeight?: number;
  padding?: number;
}

/**
 * Text editing module for canvas elements
 * Handles DOM overlay creation for text and sticky note editing
 */
export class TextEditor {
  private config: TextEditorConfig;
  private stage: Konva.Stage | null = null;
  
  // Current editor state
  private currentEditor: HTMLTextAreaElement | HTMLDivElement | null = null;
  private currentEditorWrapper: HTMLDivElement | null = null;
  private currentEditorPadding: HTMLDivElement | null = null;
  private currentEditingId: ElementId | null = null;
  private currentCleanup: (() => void) | null = null;

  constructor(config: TextEditorConfig) {
    this.config = config;
  }

  /**
   * Initialize with stage reference
   */
  init(stage: Konva.Stage) {
    this.stage = stage;
  }

  /**
   * Open text editor for an element
   */
  openEditor(
    elementId: ElementId,
    element: CanvasElement,
    node: Konva.Node,
    initialText: string,
    style: EditorStyle
  ) {
    // Close any existing editor
    this.closeEditor();

    if (!this.stage) {
      console.error('TextEditor: Stage not initialized');
      return;
    }

    const isCircle = element.type === 'circle' || element.type === 'circle-text';
    const isSticky = element.type === 'sticky-note';
    const isTable = element.type === 'table';

    // Get node position in screen coordinates
    const nodeRect = node.getClientRect({ skipTransform: false });
    const containerRect = this.stage.container().getBoundingClientRect();

    // Create wrapper div for positioning
    const wrapper = document.createElement('div');
    wrapper.className = 'canvas-text-editor-wrapper';
    wrapper.style.position = 'fixed';
    wrapper.style.pointerEvents = 'auto';
    wrapper.style.zIndex = '10000';

    // Create editor element (div for circles, textarea for others)
    const editor = isCircle
      ? this.createContentEditableDiv()
      : this.createTextarea();

    // Set common attributes
    editor.setAttribute('data-role', 'canvas-text-editor');
    editor.setAttribute('data-element-id', elementId);

    // Apply text styles
    this.applyEditorStyles(editor, style, element);

    // Position wrapper based on element type
    if (isCircle) {
      this.positionCircleEditor(wrapper, nodeRect, containerRect, element);
    } else if (isSticky) {
      this.positionStickyEditor(wrapper, nodeRect, containerRect, element);
    } else if (isTable) {
      // Table cell editing handled separately
      this.positionTableEditor(wrapper, nodeRect, containerRect, element);
    } else {
      this.positionTextEditor(wrapper, nodeRect, containerRect, element);
    }

    // Add editor to wrapper
    if (isCircle) {
      // For circles, add padding div
      const padding = document.createElement('div');
      padding.style.padding = `${style.padding || 8}px`;
      padding.appendChild(editor);
      wrapper.appendChild(padding);
      this.currentEditorPadding = padding;
    } else {
      wrapper.appendChild(editor);
    }

    // Set initial text
    if (isCircle) {
      (editor as HTMLDivElement).innerText = initialText;
    } else {
      (editor as HTMLTextAreaElement).value = initialText;
    }

    // Add to DOM
    document.body.appendChild(wrapper);

    // Store references
    this.currentEditor = editor;
    this.currentEditorWrapper = wrapper;
    this.currentEditingId = elementId;

    // Set up event handlers
    this.setupEventHandlers(editor, elementId, isCircle);

    // Focus editor
    this.focusEditor(editor);

    // Hide node text while editing
    this.hideNodeText(node);
  }

  /**
   * Create textarea element
   */
  private createTextarea(): HTMLTextAreaElement {
    const textarea = document.createElement('textarea');
    textarea.style.width = '100%';
    textarea.style.height = '100%';
    textarea.style.border = 'none';
    textarea.style.outline = 'none';
    textarea.style.background = 'transparent';
    textarea.style.resize = 'none';
    textarea.style.overflow = 'hidden';
    textarea.style.boxSizing = 'border-box';
    return textarea;
  }

  /**
   * Create contenteditable div for circles
   */
  private createContentEditableDiv(): HTMLDivElement {
    const div = document.createElement('div');
    div.contentEditable = 'true';
    div.setAttribute('role', 'textbox');
    div.setAttribute('aria-multiline', 'true');
    div.style.width = '100%';
    div.style.height = '100%';
    div.style.border = 'none';
    div.style.outline = 'none';
    div.style.background = 'transparent';
    div.style.wordWrap = 'break-word';
    div.style.overflowWrap = 'break-word';
    return div;
  }

  /**
   * Apply text styles to editor
   */
  private applyEditorStyles(
    editor: HTMLElement,
    style: EditorStyle,
    element: CanvasElement
  ) {
    editor.style.fontSize = `${style.fontSize}px`;
    editor.style.fontFamily = style.fontFamily;
    editor.style.color = style.color;
    editor.style.lineHeight = style.lineHeight ? `${style.lineHeight}` : '1.2';
    
    if (style.textAlign) {
      editor.style.textAlign = style.textAlign;
    }

    // Ensure text is visible
    (editor.style as any).webkitTextFillColor = style.color;
  }

  /**
   * Position editor for circle elements
   */
  private positionCircleEditor(
    wrapper: HTMLDivElement,
    nodeRect: DOMRect,
    containerRect: DOMRect,
    element: CanvasElement
  ) {
    // Circle uses centered square overlay
    const radius = (element as any).radius || 50;
    const scale = this.stage?.scaleX() || 1;
    const side = (radius * 2 * scale) / Math.sqrt(2);
    
    const centerX = containerRect.left + nodeRect.x + nodeRect.width / 2;
    const centerY = containerRect.top + nodeRect.y + nodeRect.height / 2;

    wrapper.style.left = `${centerX}px`;
    wrapper.style.top = `${centerY}px`;
    wrapper.style.width = `${side}px`;
    wrapper.style.height = `${side}px`;
    wrapper.style.transform = 'translate(-50%, -50%)';
  }

  /**
   * Position editor for sticky notes
   */
  private positionStickyEditor(
    wrapper: HTMLDivElement,
    nodeRect: DOMRect,
    containerRect: DOMRect,
    element: CanvasElement
  ) {
    wrapper.style.left = `${containerRect.left + nodeRect.x}px`;
    wrapper.style.top = `${containerRect.top + nodeRect.y}px`;
    wrapper.style.width = `${nodeRect.width}px`;
    wrapper.style.height = `${nodeRect.height}px`;
  }

  /**
   * Position editor for table cells
   */
  private positionTableEditor(
    wrapper: HTMLDivElement,
    nodeRect: DOMRect,
    containerRect: DOMRect,
    element: CanvasElement
  ) {
    // Table cell positioning would need cell-specific coordinates
    // This is a simplified version
    wrapper.style.left = `${containerRect.left + nodeRect.x}px`;
    wrapper.style.top = `${containerRect.top + nodeRect.y}px`;
    wrapper.style.width = `${nodeRect.width}px`;
    wrapper.style.height = `${nodeRect.height}px`;
  }

  /**
   * Position editor for text elements
   */
  private positionTextEditor(
    wrapper: HTMLDivElement,
    nodeRect: DOMRect,
    containerRect: DOMRect,
    element: CanvasElement
  ) {
    const padding = 4;
    wrapper.style.left = `${containerRect.left + nodeRect.x - padding}px`;
    wrapper.style.top = `${containerRect.top + nodeRect.y - padding}px`;
    wrapper.style.width = `${nodeRect.width + padding * 2}px`;
    wrapper.style.height = `${nodeRect.height + padding * 2}px`;
  }

  /**
   * Set up event handlers for editor
   */
  private setupEventHandlers(
    editor: HTMLElement,
    elementId: ElementId,
    isContentEditable: boolean
  ) {
    const commit = () => {
      const text = isContentEditable
        ? (editor as HTMLDivElement).innerText
        : (editor as HTMLTextAreaElement).value;
      
      this.config.onTextCommit(elementId, text);
      this.closeEditor();
    };

    const cancel = () => {
      this.config.onTextCancel?.(elementId);
      this.closeEditor();
    };

    // Keyboard handlers
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      } else if (e.key === 'Enter' && !e.shiftKey && !isContentEditable) {
        e.preventDefault();
        commit();
      }
      // Stop propagation to prevent canvas shortcuts
      e.stopPropagation();
    };

    // Blur handler
    const onBlur = () => {
      // Small delay to check if focus moved to another editor element
      setTimeout(() => {
        if (!document.activeElement?.hasAttribute('data-role') ||
            document.activeElement?.getAttribute('data-role') !== 'canvas-text-editor') {
          commit();
        }
      }, 100);
    };

    // Input handler for auto-sizing
    const onInput = () => {
      if (this.config.autoSize && !isContentEditable) {
        this.autoSizeTextarea(editor as HTMLTextAreaElement);
      }
    };

    editor.addEventListener('keydown', onKeyDown);
    editor.addEventListener('blur', onBlur);
    if (!isContentEditable) {
      editor.addEventListener('input', onInput);
    }

    // Store cleanup function
    this.currentCleanup = () => {
      editor.removeEventListener('keydown', onKeyDown);
      editor.removeEventListener('blur', onBlur);
      if (!isContentEditable) {
        editor.removeEventListener('input', onInput);
      }
    };
  }

  /**
   * Auto-size textarea to fit content
   */
  private autoSizeTextarea(textarea: HTMLTextAreaElement) {
    // Reset height to auto to get scroll height
    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    
    // Set height to fit content
    const minHeight = this.config.minHeight || 20;
    const newHeight = Math.max(minHeight, scrollHeight);
    textarea.style.height = `${newHeight}px`;

    // Also adjust width if needed
    if (this.config.autoSize) {
      textarea.style.width = 'auto';
      const scrollWidth = textarea.scrollWidth;
      const minWidth = this.config.minWidth || 50;
      const newWidth = Math.max(minWidth, scrollWidth);
      textarea.style.width = `${newWidth}px`;
      
      // Update wrapper size
      if (this.currentEditorWrapper) {
        this.currentEditorWrapper.style.width = `${newWidth}px`;
        this.currentEditorWrapper.style.height = `${newHeight}px`;
      }
    }
  }

  /**
   * Focus the editor
   */
  private focusEditor(editor: HTMLElement) {
    // Try multiple times to ensure focus
    const tryFocus = () => {
      try {
        editor.focus();
        if (editor instanceof HTMLTextAreaElement) {
          editor.select();
        } else {
          // Select all text in contenteditable
          const range = document.createRange();
          range.selectNodeContents(editor);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      } catch (e) {
        console.warn('Failed to focus editor:', e);
      }
    };

    tryFocus();
    setTimeout(tryFocus, 50);
    setTimeout(tryFocus, 150);
  }

  /**
   * Hide node text while editing
   */
  private hideNodeText(node: Konva.Node) {
    // Find text nodes within the group and hide them
    if (node instanceof Konva.Group) {
      const textNodes = node.find('Text');
      textNodes.forEach(textNode => {
        textNode.visible(false);
      });
    } else if (node instanceof Konva.Text) {
      node.visible(false);
    }
  }

  /**
   * Show node text after editing
   */
  private showNodeText(nodeId: string) {
    // This would need access to the node map
    // For now, rely on the renderer to handle this
  }

  /**
   * Update editor position (for live updates during transforms)
   */
  updatePosition(nodeRect: DOMRect) {
    if (!this.currentEditorWrapper || !this.stage) return;

    const containerRect = this.stage.container().getBoundingClientRect();
    
    // Update wrapper position
    this.currentEditorWrapper.style.left = `${containerRect.left + nodeRect.x}px`;
    this.currentEditorWrapper.style.top = `${containerRect.top + nodeRect.y}px`;
  }

  /**
   * Check if currently editing
   */
  isEditing(): boolean {
    return this.currentEditor !== null;
  }

  /**
   * Get currently editing element ID
   */
  getCurrentEditingId(): ElementId | null {
    return this.currentEditingId;
  }

  /**
   * Close the current editor
   */
  closeEditor() {
    if (this.currentCleanup) {
      this.currentCleanup();
      this.currentCleanup = null;
    }

    if (this.currentEditorWrapper) {
      this.currentEditorWrapper.remove();
      this.currentEditorWrapper = null;
    }

    this.currentEditor = null;
    this.currentEditorPadding = null;
    this.currentEditingId = null;
  }

  /**
   * Clean up
   */
  destroy() {
    this.closeEditor();
    this.stage = null;
  }
}