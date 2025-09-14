import Konva from 'konva';
import { RendererModule, ModuleContext, CanvasSnapshot } from '../../modular/types';
import { nanoid } from 'nanoid';

export class TextModule implements RendererModule {
  private ctx!: ModuleContext;
  private bound = false;
  private cursorGhost: Konva.Group | null = null;
  private textarea: HTMLTextAreaElement | null = null;
  private isCreatingText = false;
  private cursorCleanupTimer: number | null = null;

  init(ctx: ModuleContext): void {
    this.ctx = ctx;
    const stage = this.ctx.konva.getStage();
    const overlay = this.ctx.konva.getLayers().overlay;
    if (!stage || !overlay || this.bound) return;
    this.bound = true;

    // Always bind event handlers when module is registered
    // Handle text editing (double-click on existing text)
    stage.on('dblclick.modtext', (e: any) => {
      const target = e.target as Konva.Node;
      const group = this.resolveGroup(target);
      if (!group) return;
      const id = group.id?.();
      if (!id) return;
      const store = (window as any).__UNIFIED_CANVAS_STORE__;
      const el = store?.getState?.().elements?.get(id);
      if (!el || el.type !== 'text') return;

      // Critical: Stop event propagation to prevent CanvasRendererV2 from also handling this
      e.cancelBubble = true;
      e.evt?.stopPropagation?.();
      e.evt?.stopImmediatePropagation?.();

      // Mark that modular TextModule is handling this to prevent dual editing
      (window as any).__MODULAR_TEXT_EDITING__ = true;

      this.openEditor(id, el);
    });

    // Handle text creation (single-click when text tool is selected)
    stage.on('mousedown.modtext-create', (e: any) => {
      const store = (window as any).__UNIFIED_CANVAS_STORE__;
      const selectedTool = store?.getState?.().selectedTool;

      // Only handle if text tool is selected
      if (selectedTool !== 'text') return;

      // Prevent recursive creation
      if (this.isCreatingText) return;

      // Only create text on empty areas or background
      const target = e.target as Konva.Node;
      const elementGroup = target.findAncestor((node: Konva.Node) =>
        node.getClassName() === 'Group' && !!(node as Konva.Group).id(), true) as Konva.Group | null;
      if (elementGroup && elementGroup.id()) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Convert to world coordinates
      const worldPos = stage.getAbsoluteTransform().copy().invert().point(pointer);

      // Create new text element
      this.createTextElement(worldPos.x, worldPos.y);

      // Prevent event bubbling
      e.cancelBubble = true;
      e.evt?.stopPropagation?.();
      e.evt?.stopImmediatePropagation?.();
    });
  }

  sync(snapshot: CanvasSnapshot): void {
    // TextModule sync called

    const store = (window as any).__UNIFIED_CANVAS_STORE__;
    const selectedTool = store?.getState?.().selectedTool;
    const stage = this.ctx.konva.getStage();
    const overlayLayer = this.ctx.konva.getLayers().overlay;
    const mainLayer = this.ctx.konva.getLayers().main;

    // TextModule context verified

    if (!stage || !overlayLayer) {
      console.error('[TextModule] Missing required contexts - stage:', !!stage, 'overlay:', !!overlayLayer);
      return;
    }

    // QA DEBUG: Check for text elements and verify they get rendered
    const textElements = Array.from(snapshot.elements?.values() || []).filter(el => el.type === 'text');
    if (textElements.length > 0) {
      // TextModule found text elements to render:', textElements.map(el => ({ id: el.id, text: el.text })));

      // Check if these elements exist as Konva nodes
      textElements.forEach(el => {
        const existingGroup = stage.findOne(`#${el.id}`) as Konva.Group;
        // Check existing node
        if (existingGroup) {
          const textNode = existingGroup.findOne('Text');
          // Check text node
        }
      });
    } else {
      // TextModule: No text elements in snapshot');
    }

    // Handle cursor ghost for text tool
    if (selectedTool === 'text') {
      // Create cursor ghost if it doesn't exist
      if (!this.cursorGhost) {
        this.cursorGhost = new Konva.Group({ listening: false });
        const ghostText = new Konva.Text({
        });
        this.cursorGhost.add(ghostText);
        overlayLayer.add(this.cursorGhost);

        // Set cursor to crosshair
        stage.container().style.cursor = 'crosshair';

        // Update cursor position on mouse move
        stage.on('mousemove.textcursor', (e) => {
          const p = stage.getPointerPosition();
          if (!p || !this.cursorGhost) return;
          // Convert to world coordinates
          const worldPos = stage.getAbsoluteTransform().copy().invert().point(p);
          this.cursorGhost.position({ x: worldPos.x + 12, y: worldPos.y + 12 });
          overlayLayer.batchDraw();
        });

        overlayLayer.batchDraw();
      }

      // Ensure cursor ghost is visible
      if (this.cursorGhost && !this.cursorGhost.visible()) {
        this.cursorGhost.visible(true);
        overlayLayer.batchDraw();
      }
    } else {
      // Hide and clean up cursor ghost when text tool is not selected
      // Add delay to prevent immediate destruction during tool switches
      if (this.cursorGhost && !this.cursorCleanupTimer) {
        this.cursorCleanupTimer = window.setTimeout(() => {
          if (this.cursorGhost && selectedTool !== 'text') {
            this.cursorGhost.destroy();
            this.cursorGhost = null;
            stage.off('mousemove.textcursor');
            // Only reset cursor if we're not editing
            if (!this.textarea) {
              stage.container().style.cursor = 'default';
            }
            overlayLayer.batchDraw();
          }
          this.cursorCleanupTimer = null;
        }, 100); // 100ms delay to allow for continuous text creation
      }
    }

    // Clear cleanup timer if text tool is selected again
    if (selectedTool === 'text' && this.cursorCleanupTimer) {
      clearTimeout(this.cursorCleanupTimer);
      this.cursorCleanupTimer = null;
    }
  }

  destroy(): void {
    try { this.ctx?.konva?.getStage()?.off('.modtext'); } catch { /* ignore */ }
    try { this.ctx?.konva?.getStage()?.off('.modtext-create'); } catch { /* ignore */ }
    try { this.ctx?.konva?.getStage()?.off('.textcursor'); } catch { /* ignore */ }

    // Clear cursor cleanup timer
    if (this.cursorCleanupTimer) {
      clearTimeout(this.cursorCleanupTimer);
      this.cursorCleanupTimer = null;
    }

    // Clean up cursor ghost
    if (this.cursorGhost) {
      this.cursorGhost.destroy();
      this.cursorGhost = null;
    }

    // Clean up textarea if it exists
    if (this.textarea) {
      this.textarea.remove();
      this.textarea = null;
    }

    this.bound = false;
  }


  private resolveGroup(target: Konva.Node): Konva.Group | null {
    if (!target) return null;
    if (target.getClassName?.() === 'Group') return target as Konva.Group;
    const g = target.findAncestor((n: Konva.Node) => n.getClassName?.() === 'Group', true) as Konva.Group | null;
    return g || null;
  }

  private createTextElement(x: number, y: number) {
    const store = (window as any).__UNIFIED_CANVAS_STORE__;
    if (!store) return;

    // Prevent recursive creation
    this.isCreatingText = true;

    // Generate unique ID using nanoid with proper prefix
    const id = `element-${nanoid()}`;

    const textElement = {
      id,
      type: 'text',
      text: '',  // Start with empty text like monolithic system
      x,
      y,
      fontSize: 16,
      fontFamily: 'Inter, system-ui, sans-serif',
      textColor: '#111827',
      width: 150,
      height: 24,
      visible: true
    };

    try {
      // Add element to store
      store.getState().addElement(textElement);

      // Clear selection first
      store.getState().clearSelection();

      // Mark as editing and start editor immediately  
      store.getState().updateElement(id, { isEditing: true });
      
      // Start editing the new text element immediately
      // Use RAF-aware openEditor that handles CanvasRendererV2 batching
      this.openEditor(id, textElement);
      this.isCreatingText = false;
    } catch (e) {
      console.error('[TextModule] Error creating text element:', e);
      this.isCreatingText = false;
    }
  }

  private openEditor(elId: string, el: any) {
    // Prevent opening multiple editors simultaneously
    if (this.textarea) {
      return;
    }

    const stage = this.ctx.konva.getStage();
    const mainLayer = this.ctx.konva.getLayers().main;
    const overlayLayer = this.ctx.konva.getLayers().overlay;
    if (!stage || !mainLayer) return;

    // Direct node lookup using correct selectors that match CanvasRendererV2's actual node structure
    const group = mainLayer.findOne(`#${elId}`) as Konva.Group;
    if (!group) {
      console.warn('[TextModule] Could not find group for element:', elId);
      return;
    }

    // Find the text node using the same selector patterns as CanvasRendererV2
    // CanvasRendererV2 uses: Text.text, Text, or .text (fallback chain)
    const ktext = group.findOne<Konva.Text>('Text.text') ||
                  group.findOne<Konva.Text>('Text') ||
                  group.findOne<Konva.Text>('.text');

    // Find the hit area by name (not class selector)
    // ShapesModule creates hit areas with name: 'hit-area'
    const frame = group.findOne((node: Konva.Node) => node.name() === 'hit-area') as Konva.Rect;

    if (!ktext || !frame) {
      console.warn('[TextModule] Could not find text or frame nodes in group - text:', !!ktext, 'frame:', !!frame);
      return;
    }

    // Nodes found, proceed with editor setup
    // Nodes found, proceed with editor setup
    this.setupTextEditor(elId, el, group, ktext, frame, stage, mainLayer, overlayLayer || undefined);
  }

  private setupTextEditor(elId: string, el: any, group: Konva.Group, ktext: Konva.Text, frame: Konva.Rect, stage: Konva.Stage, mainLayer: Konva.Layer, overlayLayer: Konva.Layer | undefined) {

    // Hide all transformers while editing
    // Hide modular SelectionModule transformer if it exists
    if (overlayLayer) {
      const modularTransformer = overlayLayer.findOne('Transformer') as Konva.Transformer;
      if (modularTransformer) {
        modularTransformer.visible(false);
        overlayLayer.batchDraw();
      }
    }

    // Also hide monolithic transformer if it exists
    const monolithicTransformer = (window as any).__CANVAS_TRANSFORMER__ as Konva.Transformer;
    if (monolithicTransformer) {
      monolithicTransformer.visible(false);
      monolithicTransformer.getLayer()?.batchDraw();
    }

    // Hide the Konva text during editing
    ktext.visible(false);
    mainLayer.batchDraw();

    // Mark element as editing to prevent renderer from interfering
    const store = (window as any).__UNIFIED_CANVAS_STORE__;
    try {
      store?.getState?.().updateElement?.(elId, { isEditing: true });
    } catch { /* ignore */ }

    // Freeze stage panning during edit
    stage.draggable(false);

    // Create textarea for editing
    this.textarea = document.createElement('textarea');
    const textarea = this.textarea;

    // Identify as an active canvas text editor to bypass global shortcuts
    textarea.setAttribute('data-role', 'canvas-text-editor');
    textarea.setAttribute('data-text-editing', 'true');

    // Get viewport scale
    const scale = stage.getAbsoluteScale();
    const scaleX = scale.x;
    const scaleY = scale.y;

    // Convert world coordinates to DOM coordinates
    const containerRect = stage.container().getBoundingClientRect();
    const worldX = group.x();
    const worldY = group.y();
    const stagePos = stage.getAbsoluteTransform().point({ x: worldX, y: worldY });
    const domX = containerRect.left + stagePos.x;
    const domY = containerRect.top + stagePos.y;

    // Style the textarea
    Object.assign(textarea.style, {
      position: 'fixed',
      left: `${domX}px`,
      top: `${domY}px`,
      width: `${Math.max(150, frame.width() * scaleX)}px`,
      height: `${Math.max(24, frame.height() * scaleY)}px`,
      fontSize: `${el.fontSize * scaleX}px`,
      fontFamily: el.fontFamily || 'Inter, system-ui, sans-serif',
      color: el.textColor || '#111827',
      background: 'white',
      border: '1px solid #3B82F6',
      borderRadius: '4px',
      outline: 'none',
      resize: 'none',
      overflow: 'hidden',
      zIndex: '10000',
      padding: '4px',
      lineHeight: '1.2'
    } as CSSStyleDeclaration);

    // Set initial value
    textarea.value = el.text || '';

    // Prevent stage from stealing focus
    ['pointerdown', 'mousedown', 'touchstart', 'wheel'].forEach(ev =>
      textarea.addEventListener(ev, e => e.stopPropagation(), { capture: true, passive: false })
    );

    // Append to body
    document.body.appendChild(textarea);

    // Focus and select all
    textarea.focus();
    setTimeout(() => textarea.setSelectionRange(textarea.value.length, textarea.value.length), 0);

    // Live resize handler
    const liveGrow = () => {
      // Update text in Konva for measurement
      ktext.text(textarea.value || ' ');  // Use space for empty to maintain height

      // Measure content width
      const textWidth = Math.ceil(ktext.getTextWidth());
      const padding = 10;
      const minWorldWidth = Math.max(12, Math.ceil(ktext.fontSize()));
      const neededWorldW = Math.max(minWorldWidth, textWidth + padding);

      // Update frame width
      frame.width(neededWorldW);

      // Update textarea width
      textarea.style.width = `${neededWorldW * scaleX}px`;

      // Update textarea height for multi-line
      textarea.style.height = 'auto';
      const textHeight = Math.max(ktext.fontSize() * scaleY + 2, textarea.scrollHeight);
      textarea.style.height = `${textHeight}px`;

      // Update store with new dimensions and text
      try {
        store?.getState?.().updateElement?.(elId, {
          text: textarea.value,
          width: neededWorldW,
          height: Math.ceil(textHeight / scaleY)
        });
      } catch { /* ignore */ }

      // Redraw to show changes
      mainLayer.batchDraw();
    };

    // Finalize text (commit or cancel)
    const finalizeText = (mode: 'commit' | 'cancel') => {
      if (mode === 'commit' && textarea.value.trim().length) {
        // Show Konva text with final value
        ktext.visible(true);
        ktext.text(textarea.value);
        ktext.width(undefined); // Remove width constraint to measure natural size

        // Clear cache to get accurate measurements
        ktext._clearCache();

        // Get the text's bounding box
        const bbox = ktext.getClientRect({ skipTransform: true, skipStroke: true, skipShadow: true });
        const textWidth = Math.ceil(ktext.getTextWidth());
        const finalWidth = Math.max(1, textWidth || bbox.width);
        const finalHeight = Math.ceil(Math.max(1, bbox.height));

        // Update frame to exactly match text bounds
        frame.width(finalWidth);
        frame.height(finalHeight);

        // Position text to align with frame origin
        ktext.position({ x: -bbox.x, y: -bbox.y });

        // Clip the group to the exact text rect so transformer hugs perfectly
        try {
          (group as any).clip({ x: 0, y: 0, width: finalWidth, height: finalHeight });
        } catch { /* ignore */ }

        // Update store with final text and dimensions
        try {
          store?.getState?.().updateElement?.(elId, {
            text: textarea.value,
            width: finalWidth,
            height: finalHeight,
            x: group.x(),
            y: group.y(),
            isEditing: false
          });
        } catch { /* ignore */ }

        // Select the element to show transformer
        try {
          store?.getState?.().clearSelection?.();
          store?.getState?.().selectElement?.(elId, false);
        } catch { /* ignore */ }

        // Make the group draggable
        group.draggable(true);

        // Set up drag handler
        group.on('dragend', () => {
          try {
            store?.getState?.().updateElement?.(elId, {
              x: group.x(),
              y: group.y()
            });
          } catch { /* ignore */ }
        });

        mainLayer.batchDraw();
      } else {
        // Cancel or empty: delete the element
        try {
          store?.getState?.().updateElement?.(elId, { isEditing: false });
        } catch { /* ignore */ }
        try {
          store?.getState?.().deleteElement?.(elId);
        } catch { /* ignore */ }
      }

      // Clean up textarea
      if (this.textarea) {
        this.textarea.remove();
        this.textarea = null;
      }

      // Restore transformers
      if (overlayLayer) {
        const modularTransformer = overlayLayer.findOne('Transformer') as Konva.Transformer;
        if (modularTransformer) {
          modularTransformer.visible(true);
          overlayLayer.batchDraw();
        }
      }

      const monolithicTransformer = (window as any).__CANVAS_TRANSFORMER__ as Konva.Transformer;
      if (monolithicTransformer) {
        monolithicTransformer.visible(true);
        monolithicTransformer.getLayer()?.batchDraw();
      }

      // Keep stage non-draggable so element drags work
      stage.draggable(false);

      // Clear modular text editing flag
      (window as any).__MODULAR_TEXT_EDITING__ = false;

      console.info('[TextModule] Finalized text:', mode);
    };

    // Event handlers
    textarea.addEventListener('input', liveGrow);

    textarea.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        finalizeText('commit');
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        finalizeText('cancel');
      }
    });

    textarea.addEventListener('blur', () => {
      // Use RAF-aware delay to prevent accidental blur and sync with render cycle
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (this.textarea === textarea) {
            finalizeText('commit');
          }
        });
      });
    });

    console.info('[TextModule] Text editor opened for element:', elId);
  }
}