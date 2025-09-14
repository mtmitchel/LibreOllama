import Konva from 'konva';
import { RendererModule, ModuleContext, CanvasSnapshot, CanvasElement } from '../../modular/types';
import { TextElement } from '../../../types/enhanced.types';
import { nanoid } from 'nanoid';
import { worldToScreen, screenToWorld } from '../../../utils/coords';

/**
 * Unified TextModule that handles both text rendering and editing
 * Combines functionality from TextModule and TextRenderingModule
 */
export class TextModule implements RendererModule {
  private ctx!: ModuleContext;
  private bound = false;

  // Rendering state
  private nodeMap: Map<string, Konva.Node> = new Map();

  // Editing state
  private cursorGhost: Konva.Group | null = null;
  private textarea: HTMLTextAreaElement | null = null;
  private isCreatingText = false;
  private cursorCleanupTimer: number | null = null;
  
  // Create or return overlay root anchored to the stage container's parent
  private ensureOverlayRoot(): HTMLDivElement | null {
    const stage = this.ctx?.konva?.getStage?.();
    if (!stage) return null;
    const container = stage.container();
    const id = '__canvas_overlay_root__';
    let root = container.parentElement?.querySelector<HTMLDivElement>('#' + id);
    if (!root) {
      root = document.createElement('div');
      root.id = id;
      Object.assign(root.style, {
        position: 'absolute',
        inset: '0',
        pointerEvents: 'none',
        zIndex: '2',
      } as CSSStyleDeclaration);
      container.parentElement?.appendChild(root);
      const parent = container.parentElement as HTMLElement;
      const cs = getComputedStyle(parent);
      if (cs.position === 'static') parent.style.position = 'relative';
    }
    return root;
  }

  init(ctx: ModuleContext): void {
    console.log('[TextModule] init() called');
    this.ctx = ctx;
    const stage = this.ctx.konva.getStage();
    const overlay = this.ctx.konva.getLayers().overlay;
    console.log('[TextModule] Stage:', !!stage, 'Overlay:', !!overlay, 'Already bound:', this.bound);
    if (!stage || !overlay || this.bound) return;
    this.bound = true;
    console.log('[TextModule] Setting up event listeners...');

    // Cursor ghost for text tool (hover preview)
    const ensureCursorGhost = () => {
      if (this.cursorGhost) return this.cursorGhost;
      const g = new Konva.Group({ listening: false, name: 'text-cursor-ghost' });
      const t = new Konva.Text({ text: 'Text', fontSize: 24, fill: '#2b2b2b' });
      g.add(t);
      overlay.add(g);
      overlay.batchDraw();
      this.cursorGhost = g;
      return g;
    };

    const destroyCursorGhost = () => {
      try { this.cursorGhost?.destroy(); } catch {}
      this.cursorGhost = null;
      overlay.batchDraw();
    };

    // Track cursor when text tool is active
    stage.on('mousemove.textcursor', (e: any) => {
      const store = (window as any).__UNIFIED_CANVAS_STORE__;
      const selectedTool = store?.getState?.().selectedTool;
      if (selectedTool !== 'text') { destroyCursorGhost(); return; }
      const p = stage.getPointerPosition();
      if (!p) return;
      const g = ensureCursorGhost();
      g.position({ x: p.x + 12, y: p.y + 12 });
      overlay.batchDraw();
    });

    
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

      e.cancelBubble = true;
      e.evt?.stopPropagation?.();
      e.evt?.stopImmediatePropagation?.();
      (window as any).__MODULAR_TEXT_EDITING__ = true;

      this.openEditor(id, el);
    });

    // Handle text creation (single-click when text tool is selected)
    stage.on('mousedown.modtext-create', (e: any) => {
      console.log('[TextModule] Canvas mousedown event fired');
      const store = (window as any).__UNIFIED_CANVAS_STORE__;
      const selectedTool = store?.getState?.().selectedTool;
      console.log('[TextModule] Current selected tool:', selectedTool);

      if (selectedTool !== 'text') {
        console.log('[TextModule] Not text tool, ignoring click');
        return;
      }
      if (this.isCreatingText) {
        console.log('[TextModule] Already creating text, ignoring click');
        return;
      }

      const target = e.target as Konva.Node;
      console.log('[TextModule] Click target:', target?.getClassName?.(), 'name:', target?.name?.());

      if (target !== stage && target.parent !== stage) {
        const group = this.resolveGroup(target);
        if (group && group.name() === 'text') {
          console.log('[TextModule] Clicked on existing text, ignoring for creation');
          return;
        }
      }

      console.log('[TextModule] Creating new text element...');
      e.cancelBubble = true;
      this.isCreatingText = true;

      const pointer = stage.getPointerPosition();
      if (!pointer) {
        console.log('[TextModule] No pointer position available');
        this.isCreatingText = false;
        return;
      }

      // 🔥 PERPLEXITY RECOMMENDATION: Use Konva's built-in relative positioning
      // Try getRelativePointerPosition() first as recommended
      const mainLayer = stage.getLayers().find(l => l.name() === 'main-layer');
      const worldPos = mainLayer?.getRelativePointerPosition() || screenToWorld(stage, pointer);

      console.log('[TextModule] Creating text at screen:', pointer, 'world:', worldPos, 'method:', mainLayer?.getRelativePointerPosition() ? 'getRelativePointerPosition' : 'screenToWorld');

      const id = `element-${nanoid()}`;
      const textElement = {
        id,
        type: 'text' as const,
        x: worldPos.x,  // ✅ Correct: Store in world coordinates for canvas data model
        y: worldPos.y,  // ✅ Correct: Store in world coordinates for canvas data model
        text: '', // Start with empty text
        fontSize: 24, // Match legacy/new spec default
        fontFamily: 'Inter, system-ui, sans-serif', // Legacy default
        fill: '#111827', // Legacy text color
        width: 1,
        height: undefined,
        rotation: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      console.log('[TextModule] Text element created:', textElement);

      const addElement = store?.getState?.().addElement;
      const selectElement = store?.getState?.().selectElement;
      const setSelectedTool = store?.getState?.().setSelectedTool;
      if (addElement) {
        console.log('[TextModule] Adding element to store...');
        addElement(textElement);
        console.log('[TextModule] Element added to store');
        // Immediately switch to select tool and select the new element so transformer appears after commit
        try { setSelectedTool?.('select'); } catch {}
        try { selectElement?.(id, false); } catch {}
        try { stage.container().style.cursor = 'default'; } catch {}
      } else {
        console.error('[TextModule] No addElement function found in store!');
      }

      // Immediately open editor for new text element
      console.log('[TextModule] Opening editor for element:', id);
      // Ensure node exists before opening editor (sync happens async)
      let tries = 0;
      const tryOpen = () => {
        const node = this.nodeMap.get(id) || mainLayer?.findOne?.(`#${id}`) as Konva.Node | undefined;
        if (node) {
          this.openEditor(id, textElement);
          this.isCreatingText = false;
          return;
        }
        if (tries++ < 12) {
          requestAnimationFrame(tryOpen);
        } else {
          console.warn('[TextModule] Could not find node for new text element to open editor');
          this.isCreatingText = false;
        }
      };
      requestAnimationFrame(tryOpen);
    });

      console.log('[TextModule] Event listeners set up complete');
  }

  /**
   * Sync method handles both rendering and UI updates
   */
  sync(snapshot: CanvasSnapshot): void {
    if (!this.ctx) return;

    const mainLayer = this.ctx.konva.getLayers().main;
    const overlayLayer = this.ctx.konva.getLayers().overlay;
    if (!mainLayer) return;

    // RENDERING: Process text elements from snapshot
    const textElements = Array.from(snapshot.elements.values()).filter(el => this.isTextElement(el));

    textElements.forEach((element) => {
      const id = String(element.id);
      let group = this.nodeMap.get(id) as Konva.Group;

      if (!group) {
        // Create new text element
        group = new Konva.Group({
          id,
          name: 'text',
          x: element.x,
          y: element.y,
          rotation: element.rotation ?? 0,
          draggable: true,
          width: element.width || undefined,
          height: element.height || undefined,
        });

        const text = new Konva.Text({
          name: 'text', // Important: allows old editing system to find this node
          text: element.text || '', // Empty text for new elements
          fontSize: element.fontSize || 24,
          fontFamily: element.fontFamily || 'Inter, system-ui, sans-serif',
          fill: element.fill || '#111827', // Legacy text color
          align: element.textAlign || 'left',
          lineHeight: element.lineHeight || 1.3, // Legacy default
          padding: element.padding || 0, // Legacy uses no padding on Konva text
          width: element.width || undefined,
          height: element.height || undefined,
          verticalAlign: 'middle',
        });
        try { (text as any).wrap('none'); (text as any).width(undefined); } catch {}

        const hitAreaWidth = element.width || text.width();
        const hitAreaHeight = element.height || text.height();

        const hitArea = new Konva.Rect({
          name: 'hit-area',
          width: hitAreaWidth,
          height: hitAreaHeight,
          fill: 'transparent',
          listening: true,
        });

        group.add(hitArea);
        group.add(text);
        mainLayer.add(group);
        this.nodeMap.set(id, group);
        this.setupDragHandling(group, element.id as string);

      } else {
        // Update existing text element
        group.position({ x: element.x, y: element.y });
        group.rotation(element.rotation || 0);
        group.width(element.width || undefined);
        group.height(element.height || undefined);

        const text = group.findOne('.text') as Konva.Text;
        if (text) {
          text.text(element.text || ''); // Empty text, no placeholder
          text.fontSize(element.fontSize || 24);
          text.fontFamily(element.fontFamily || 'Inter, system-ui, sans-serif');
          text.fill(element.fill || '#111827'); // Legacy text color
          text.align(element.textAlign || 'left');
          text.lineHeight(element.lineHeight || 1.3); // Legacy default
          text.padding(element.padding || 0); // Legacy uses no padding
          try { (text as any).wrap('none'); } catch {}
          text.width(element.width || undefined);
          text.height(element.height || undefined);
          text.verticalAlign('middle');

          const hitArea = group.findOne('.hit-area') as Konva.Rect;
          if (hitArea) {
            hitArea.width(element.width || text.width());
            hitArea.height(element.height || text.height());
          }
        }
      }
    });

    // Clean up removed elements
    const elementIds = new Set(textElements.map(el => String(el.id)));
    for (const [nodeId, node] of this.nodeMap.entries()) {
      if (!elementIds.has(nodeId)) {
        node.destroy();
        this.nodeMap.delete(nodeId);
      }
    }

    // UI: Handle cursor for text tool (removed unwanted placeholder text)
    const store = (window as any).__UNIFIED_CANVAS_STORE__;
    const selectedTool = store?.getState?.().selectedTool;
    const stage = this.ctx.konva.getStage();

    if (selectedTool === 'text' && stage) {
      // Only change cursor, no placeholder text
      stage.container().style.cursor = 'crosshair';
    } else if (stage) {
      stage.container().style.cursor = 'default';
    }

    // Clean up any existing cursor ghost from previous implementation
    if (this.cursorGhost) {
      this.cursorGhost.destroy();
      this.cursorGhost = null;
    }

    mainLayer.batchDraw();
  }

  destroy(): void {
    // Clean up all nodes
    for (const [id, node] of this.nodeMap.entries()) {
      try {
        node.destroy();
      } catch { /* ignore */ }
    }
    this.nodeMap.clear();

    // Clean up cursor ghost
    if (this.cursorGhost) {
      this.cursorGhost.destroy();
      this.cursorGhost = null;
    }

    // Clean up textarea
    if (this.textarea) {
      this.textarea.remove();
      this.textarea = null;
    }

    // Unbind events
    const stage = this.ctx?.konva?.getStage();
    if (stage) {
      stage.off('.modtext');
      stage.off('.modtext-create');
      stage.off('.textcursor');
    }

    // Remove cursor ghost if present
    try { this.cursorGhost?.destroy(); } catch {}
    this.cursorGhost = null;

    this.bound = false;
  }

  private isTextElement(element: CanvasElement): element is TextElement {
    return element.type === 'text';
  }

  private setupDragHandling(group: Konva.Group, elementId: string): void {
    group.draggable(true);
    group.on('dragend', () => {
      const store = (window as any).__UNIFIED_CANVAS_STORE__;
      try {
        store?.getState?.().updateElement?.(String(elementId), {
          x: group.x(),
          y: group.y()
        });
      } catch { /* ignore */ }
    });
  }

  private resolveGroup(target: Konva.Node): Konva.Group | null {
    if (!target) return null;
    if (target.getClassName?.() === 'Group') return target as Konva.Group;
    const g = target.findAncestor((n: Konva.Node) => n.getClassName?.() === 'Group', true) as Konva.Group | null;
    return g || null;
  }

  private openEditor(elId: string, el: any): void {
    console.log('[TextModule] openEditor called for element:', elId, el);
    const stage = this.ctx.konva.getStage();
    const mainLayer = this.ctx.konva.getLayers().main;
    console.log('[TextModule] Stage and mainLayer available:', !!stage, !!mainLayer);
    if (!stage || !mainLayer) return;

    const node = mainLayer.findOne(`#${elId}`) as Konva.Group;
    console.log('[TextModule] Found Konva node:', !!node, node?.getAttrs?.());
    if (!node) return;

    // Close any existing editor
    this.closeCurrentEditor();

    // Determine element type for specialized behavior
    const isCircle = el.type === 'circle' || el.type === 'ellipse';
    const isSticky = el.type === 'sticky';
    const isTriangle = el.type === 'triangle';
    const isShapeLike = isCircle || isSticky || isTriangle || el.type === 'rectangle';

    // Store current text node visibility (legacy behavior)
    const textNode = node.findOne<Konva.Text>('Text.text') || node.findOne<Konva.Text>('Text') || node.findOne<Konva.Text>('.text');
    const prevTextVisible = textNode ? textNode.visible() : true;

    // Hide text node during editing for plain text only (legacy behavior)
    const isPlainText = !(isSticky || isShapeLike || isTriangle || isCircle);
    if (textNode && isPlainText && !isSticky) {
      textNode.visible(false);
      mainLayer.batchDraw();
    }

    // For plain text editing and measurements, force Konva.Text lineHeight to 1
    // to avoid inflated bbox height from default 1.3 lineHeight.
    let prevKonvaLineHeight: number | undefined;
    if (textNode && isPlainText && !isSticky) {
      try {
        prevKonvaLineHeight = textNode.lineHeight();
        textNode.lineHeight(1);
      } catch {}
    }

    // Disable transformer during editing
    try {
      if ((this as any).transformer) {
        (this as any).transformer.visible(false);
        this.ctx.konva.getLayers().overlay?.batchDraw();
      }
    } catch {}

    // Create wrapper div for positioning
    const editWrapper = document.createElement('div');
    editWrapper.style.position = 'fixed';
    editWrapper.style.pointerEvents = 'auto';
    editWrapper.style.zIndex = '2147483647';
    editWrapper.style.background = 'transparent';
    editWrapper.style.border = 'none';
    editWrapper.style.outline = 'none';

    // Create inner padding div for circles
    let padDiv: HTMLElement | null = null;
    if (isCircle) {
      padDiv = document.createElement('div');
      padDiv.style.width = '100%';
      padDiv.style.height = '100%';
      padDiv.style.boxSizing = 'border-box';
      padDiv.style.display = 'flex';
      padDiv.style.alignItems = 'center';
      padDiv.style.justifyContent = 'center';
      editWrapper.appendChild(padDiv);
      (this as any).currentEditorPad = padDiv;
    }

    // Create input element (textarea for most, contentEditable div for circles)
    let ta: HTMLElement;
    if (isCircle) {
      ta = document.createElement('div');
      ta.contentEditable = 'true';
      (ta as HTMLDivElement).innerText = el.text || '';
    } else {
      ta = document.createElement('textarea');
      (ta as HTMLTextAreaElement).value = el.text || '';
      // Ensure UA doesn't default to multi-row height which inflates scrollHeight
      try { (ta as HTMLTextAreaElement).setAttribute('rows', '1'); } catch {}
    }

    // EXACT legacy styling from CanvasRendererV2
    const stageScale = stage.scaleX();
    const fontSize = Math.max(1, (el.fontSize || 14) * stageScale); // Scale with stage
    const fontFamily = el.fontFamily || 'Inter, system-ui, sans-serif';
    const lineHeight = el.lineHeight ?? 1.3;
    const textColor = el.fill || '#111827'; // Legacy text color

    ta.style.fontSize = `${fontSize}px`;
    ta.style.fontFamily = fontFamily;
    ta.style.color = textColor;
    // For plain text we want a tight, baseline-aligned line-height.
    // Use exact pixel line-height equal to font size to avoid extra bottom leading.
    ta.style.lineHeight = String(lineHeight);
    ta.style.background = 'white'; // Legacy: white background for plain text
    ta.style.border = '1px solid #3B82F6'; // Legacy: blue border
    ta.style.borderRadius = '4px'; // Legacy: 4px border radius (NOT zero!)
    ta.style.outline = 'none';
    ta.style.resize = 'none';
    ta.style.overflow = 'hidden'; // Legacy uses hidden
    ta.style.boxSizing = 'content-box'; // Legacy uses content-box
    ta.style.whiteSpace = 'pre'; // Legacy uses pre for plain text
    ta.style.wordBreak = 'normal'; // Legacy uses normal for plain text
    ta.style.caretColor = '#3B82F6'; // Legacy: blue caret
    ta.style.padding = '0'; // Legacy: no padding on textarea itself
    ta.style.margin = '0';
    ta.style.minHeight = '0px';

    if (!isCircle) {
      ta.style.width = '100%';
      ta.style.height = '100%'; // Legacy uses 100%
    } else {
      // Circle-specific styling
      ta.style.textAlign = 'center';
      ta.style.width = '100%';
      ta.style.height = '100%';
      ta.style.display = 'flex';
      ta.style.alignItems = 'center';
      ta.style.justifyContent = 'center';
      ta.style.padding = '0';
      ta.style.margin = '0';
    }

    // Override line-height for plain text after base style assignment
    if (!isCircle && !isSticky && !isShapeLike) {
      ta.style.lineHeight = `${fontSize}px`;
    }

    // Add to wrapper
    if (padDiv) {
      padDiv.appendChild(ta);
    } else {
      editWrapper.appendChild(ta);
    }

    console.log('[TextModule] Mounting editWrapper at document.body to avoid Konva container clipping');
    // Temporarily relax Konva container overflow to avoid any platform-specific clipping
    const containerEl = stage.container();
    const prevOverflow = containerEl.style.overflow;
    try { containerEl.style.overflow = 'visible'; } catch {}
    (this as any).__prevOverflow = prevOverflow;
    document.body.appendChild(editWrapper);
    (this as any).currentEditor = ta;
    (this as any).currentEditorWrapper = editWrapper;
    (this as any).currentEditingId = elId;
    console.log('[TextModule] EditWrapper added to DOM');

    // Step 3: Convert world coordinates to proper screen coordinates for DOM editor placement
    const padWorld = 8; // Default padding in world coordinates

    // Calculate initial positioning based on element type using proper coordinate transformation
    let contentLeft = 0, contentTop = 0, contentWidth = 0, contentHeight = 0;

    if (!isCircle && !isSticky && !isShapeLike) {
      // Plain text: Convert world coordinates to screen coordinates for DOM editor
      const group = node as Konva.Group;
      const textNode = group.findOne<Konva.Text>('Text.text') || group.findOne<Konva.Text>('Text') || group.findOne<Konva.Text>('.text');
      const containerRect = stage.container().getBoundingClientRect();

      if (textNode) {
        // Layer-aware coordinate handling with validation
        const worldPos = { x: el.x, y: el.y };  // Element position in world coordinates

        // Compute screen position using layer-aware helper (returns CSS pixels)
        const screenPos = worldToScreen(stage, worldPos);

        // Validate screenPos before using it
        if (!screenPos || isNaN(screenPos.x) || isNaN(screenPos.y)) {
          console.error('[TextModule] Invalid screenPos detected:', screenPos, 'using fallback');
          // Fallback to direct positioning in CSS pixels
          contentLeft = containerRect.left + worldPos.x;
          contentTop = containerRect.top + worldPos.y;
        } else {
          // Use CSS pixel coordinates for both browser and Tauri WebView
          contentLeft = containerRect.left + screenPos.x;
          contentTop = containerRect.top + screenPos.y;
        }

        // Snap to device pixels
        const dpr = window.devicePixelRatio || 1;
        const snap = (v: number) => Math.round(v * dpr) / dpr;
        const stageScale = Math.max(1e-6, stage.scaleX());
        contentLeft = snap(contentLeft);
        contentTop = snap(contentTop);

        // Derive a compact initial width that hugs the cursor
        // Measure natural glyph width; if empty, fall back to min width based on font size
        let glyphW = 0;
        try {
          (textNode as any).text(el.text || '');
          (textNode as any).wrap?.('none'); (textNode as any).width?.(undefined); (textNode as any)._clearCache?.();
          glyphW = Math.max(0, Math.ceil(((textNode as any).getTextWidth?.() || 0) as number));
        } catch {}
        const baseFont = Math.max(1, el.fontSize || 24);
        // Make initial box visible but compact: ~0.5em minimum width, at least 8px
        const minWorldW = Math.max(8, Math.ceil(baseFont * 0.5));
        const paddingWorld = 0;
        const widthWorld = Math.max(minWorldW, glyphW + paddingWorld);
        contentWidth = snap(widthWorld * stageScale);

        // Height: use Konva text bbox if available to avoid descender clipping
        let bboxHWorld = 0;
        try {
          const bbox = (textNode as any).getClientRect?.({ skipTransform: true, skipStroke: true, skipShadow: true });
          bboxHWorld = Math.max(0, Math.ceil(bbox?.height || 0));
        } catch {}
        // Height: start at exactly 1.0 line (font size px) and a tiny guard
        const fallbackHWorld = Math.ceil(baseFont * 1.0);
        const guardPx = 2; // minimal bottom guard; avoid large descender padding
        contentHeight = snap(Math.max(1, (Math.max(bboxHWorld, fallbackHWorld) * stageScale) + guardPx));

        console.log('[TextModule] Final positioning result:', {
          element: { x: el.x, y: el.y },
          worldPos, screenPos,
          containerRect: { left: containerRect.left, top: containerRect.top },
          final: { left: contentLeft, top: contentTop, width: contentWidth, height: contentHeight }
        });
      } else {
        // Fallback if textNode not found - still use proper coordinate conversion
        const worldPos = { x: el.x, y: el.y };
        const screenPos = worldToScreen(stage, worldPos);
        const dpr = window.devicePixelRatio || 1;
        const snap = (v: number) => Math.round(v * dpr) / dpr;
        const stageScale = Math.max(1e-6, stage.scaleX());
        // Apply screen coordinates directly to DOM editor with compact initial size
        contentLeft = snap(containerRect.left + screenPos.x);
        contentTop = snap(containerRect.top + screenPos.y);
        const baseFont = Math.max(1, el.fontSize || 24);
        const minWorldW = Math.max(8, Math.ceil(baseFont * 0.5));
        const paddingWorld = 0;
        const widthWorld = minWorldW + paddingWorld;
        contentWidth = snap(widthWorld * stageScale);
        const fallbackHWorld = Math.ceil(baseFont * 1.0);
        const guardPx = 2;
        contentHeight = snap(Math.max(1, (fallbackHWorld * stageScale) + guardPx));
      }

      editWrapper.style.left = `${contentLeft}px`;
      editWrapper.style.top = `${contentTop}px`;
      editWrapper.style.width = `${contentWidth}px`;
      editWrapper.style.height = `${contentHeight}px`;
    }

    // IME composition state
    let composing = false;
    ta.addEventListener('compositionstart', () => { composing = true; });
    ta.addEventListener('compositionend', () => { composing = false; });

    // Measurement functions based on element type
    const measureStickyConsistent = () => {
      if (!textNode) return;

      const containerRect = stage.container().getBoundingClientRect();
      const stageScale = stage.scaleX();
      const rect = node.getClientRect({ skipTransform: false, skipShadow: true, skipStroke: true });

      let l = containerRect.left + rect.x + padWorld * stageScale;
      let t = containerRect.top + rect.y + padWorld * stageScale;
      let w = Math.max(4, rect.width - padWorld * stageScale * 2);
      let h: number;

      // Triangle-specific positioning
      if (isTriangle) {
        const triangleTextOffsetWorld = Math.max(padWorld, (el.height || 0) * 0.55);
        const triangleOffsetPx = triangleTextOffsetWorld * stageScale;
        const topWidthPx = Math.max(4, rect.width * (triangleTextOffsetWorld / Math.max(1, el.height || 1)));
        l = containerRect.left + rect.x + Math.max(0, Math.floor((rect.width - topWidthPx) / 2)) + padWorld * stageScale;
        t = containerRect.top + rect.y + triangleOffsetPx;
        w = Math.max(4, topWidthPx - padWorld * stageScale * 2);
      }

      // Auto-height calculation
      const baselineOffsetPx = 0; // Simplified for now
      ta.style.height = 'auto';
      const scrollH = (ta as HTMLTextAreaElement).scrollHeight;
      h = Math.max(fontSize * 1.5, scrollH + baselineOffsetPx + 6);

      // Apply positioning
      editWrapper.style.left = `${l}px`;
      editWrapper.style.top = `${t}px`;
      editWrapper.style.width = `${w}px`;
      editWrapper.style.height = `${h}px`;

      // Update store with new dimensions
      const store = (window as any).__UNIFIED_CANVAS_STORE__;
      const text = (ta as HTMLTextAreaElement).value;
      const worldW = w / stageScale;
      const worldH = h / stageScale;

      store?.getState?.().updateElement?.(elId, {
        text,
        width: worldW,
        height: worldH
      }, { skipHistory: true });
    };

    const measurePlain = () => {
      if (!textNode) return;
      const group = node as Konva.Group;
      const hitArea = group.findOne('.hit-area') as Konva.Rect;
      const stageScale = Math.max(1e-6, stage.scaleX());
      // Mirror textarea value into Konva.Text and measure natural width
      textNode.text((ta as HTMLTextAreaElement).value || '');
      try { (textNode as any).wrap('none'); (textNode as any).width(undefined); (textNode as any)._clearCache?.(); } catch {}
      const glyphW = Math.ceil(((textNode as any).getTextWidth?.() || 0) as number);
      const baseFont = Math.max(1, textNode.fontSize?.() || 24);
      // Visible but compact minimum (~0.5em), never less than 8px in world units
      const minWorldW = Math.max(8, Math.ceil(baseFont * 0.5));
      const padding = 0;
      const neededWorldW = Math.max(minWorldW, glyphW + padding);

      // Resize frame and DOM overlay to hug text perfectly
      if (hitArea && Math.abs(hitArea.width() - neededWorldW) > 0.25) {
        hitArea.width(neededWorldW);
        (editWrapper as HTMLElement).style.width = `${neededWorldW * stageScale}px`;
        (ta as HTMLElement).style.width = `${neededWorldW * stageScale}px`;
        mainLayer.batchDraw();
      }
      // Height hugs exactly one text line; prefer Konva bbox, but never below 1x font size
      let hPx = 0;
      try {
        const bbox = (textNode as any).getClientRect?.({ skipTransform: true, skipStroke: true, skipShadow: true });
        const bboxHWorld = Math.max(0, Math.ceil(bbox?.height || 0));
        const baseFontPx = Math.max(1, Math.ceil((textNode.fontSize?.() || 24) * stageScale));
        hPx = Math.max(baseFontPx, Math.ceil(bboxHWorld * stageScale));
      } catch {}
      // DOM fallback if bbox not available
      try {
        (ta as HTMLElement).style.height = 'auto';
        // Keep at least one line of text; rows=1 avoids UA multi-row default
        hPx = Math.max(hPx, Math.ceil((ta as HTMLTextAreaElement).scrollHeight));
      } catch {}
      const guard = 2; // minimal guard to prevent descender clipping
      const finalH = hPx + guard;
      (ta as HTMLElement).style.height = `${finalH}px`;
      (editWrapper as HTMLElement).style.height = `${finalH}px`;

      // Store update (skip history)
      const store = (window as any).__UNIFIED_CANVAS_STORE__;
      store?.getState?.().updateElement?.(elId, { text: (ta as HTMLTextAreaElement).value, width: neededWorldW }, { skipHistory: true });
    };

    // Circle-specific measurement and growth logic
    if (isCircle) {
      let pendingGrowRAF = 0;
      ta.addEventListener('input', () => {
        if (composing) return;

        // Sync text to store
        try {
          const store = (window as any).__UNIFIED_CANVAS_STORE__;
          const val = (ta as HTMLDivElement).innerText ?? '';
          store?.getState()?.updateElement?.(elId, { text: val }, { skipHistory: true });
        } catch {}

        // Coalesce growth into single RAF
        if (pendingGrowRAF) cancelAnimationFrame(pendingGrowRAF);
        pendingGrowRAF = requestAnimationFrame(() => {
          try {
            const group = node as Konva.Group;
            const ellipse = group.findOne<Konva.Ellipse>('Ellipse.shape') || group.findOne<Konva.Circle>('Circle.shape');
            if (!ellipse) return;

            // Get current radius and scale
            const absT = (ellipse as Konva.Shape).getAbsoluteTransform();
            const p0 = absT.point({ x: 0, y: 0 });
            const px = absT.point({ x: 1, y: 0 });
            const py = absT.point({ x: 0, y: 1 });
            const sx = Math.abs(px.x - p0.x);
            const sy = Math.abs(py.y - p0.y);
            const sLim = Math.min(Math.max(sx, 1e-6), Math.max(sy, 1e-6));

            const strokeWidth = (ellipse as any).strokeWidth?.() ?? (el.strokeWidth ?? 1);
            const r0 = (ellipse as any).radius?.() ?? (ellipse as any).radiusX?.() ?? (el.radius || 65);
            const padPxFixed = 8 * sLim; // Padding in screen pixels
            const rClipWorld = Math.max(1, r0 - strokeWidth / 2);
            const sidePx = Math.SQRT2 * rClipWorld * sLim;
            const contentSidePx = Math.max(4, sidePx - 2 * padPxFixed);

            // Measure content with ghost element
            const base = window.getComputedStyle(ta as HTMLElement);
            const fontPx = parseFloat(base.fontSize || '14') || 14;
            const safetyBufferPx = Math.max(4, Math.ceil(fontPx * 0.5));

            const measureForSide = (contentPx: number) => {
              const ghost = document.createElement('div');
              Object.assign(ghost.style, {
                position: 'fixed',
                left: '-99999px',
                top: '-99999px',
                visibility: 'hidden',
                pointerEvents: 'none',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                fontSize: base.fontSize,
                fontFamily: base.fontFamily,
                lineHeight: base.lineHeight,
                letterSpacing: base.letterSpacing,
                width: `${Math.max(4, Math.round(contentPx))}px`
              });
              ghost.innerText = ((ta as HTMLDivElement).innerText ?? '').length ? (ta as HTMLDivElement).innerText : ' ';
              document.body.appendChild(ghost);
              const h = ghost.scrollHeight;
              const w = ghost.scrollWidth;
              document.body.removeChild(ghost);
              return { h: Math.max(4, h), w: Math.max(4, w) };
            };

            // Iterative measurement convergence
            let neededContentPx = contentSidePx;
            for (let i = 0; i < 5; i++) {
              const m = measureForSide(neededContentPx);
              const next = Math.max(neededContentPx, m.h + safetyBufferPx, m.w + safetyBufferPx);
              if (Math.abs(next - neededContentPx) < 0.5) {
                neededContentPx = next;
                break;
              }
              neededContentPx = next;
            }

            // Include live editor dimensions
            const liveH = Math.max(4, (ta as HTMLElement).scrollHeight + safetyBufferPx);
            const liveW = Math.max(4, (ta as HTMLElement).scrollWidth + safetyBufferPx);
            neededContentPx = Math.max(neededContentPx, liveH, liveW);

            // Calculate new radius
            const dpr = window.devicePixelRatio || 1;
            const snapWorld = (v: number) => Math.ceil(v * dpr) / dpr;
            const neededSidePx = neededContentPx + 2 * padPxFixed;
            const rWorldRaw = (neededSidePx / Math.SQRT2) / sLim + strokeWidth / 2;
            const targetR = snapWorld(rWorldRaw);

            const growNeeded = targetR > r0 + 0.5;
            if (growNeeded) {
              // Update circle dimensions
              const sidePxFromWorld = Math.ceil((Math.SQRT2 * (targetR - strokeWidth / 2) * sLim) * dpr) / dpr;
              const cRect = stage.container().getBoundingClientRect();
              const center = group.getAbsoluteTransform().point({ x: 0, y: 0 });
              const cx = cRect.left + center.x;
              const cy = cRect.top + center.y;

              editWrapper.style.left = `${Math.round(cx)}px`;
              editWrapper.style.top = `${Math.round(cy)}px`;
              editWrapper.style.width = `${Math.round(sidePxFromWorld)}px`;
              editWrapper.style.height = `${Math.round(sidePxFromWorld)}px`;
              editWrapper.style.transform = 'translate(-50%, -50%)';

              if (padDiv) {
                padDiv.style.padding = `${padPxFixed}px`;
              }

              // Update Konva shape
              const shapeEllipse = group.findOne<Konva.Ellipse>('Ellipse.shape');
              const shapeCircle = group.findOne<Konva.Circle>('Circle.shape');
              if (shapeEllipse) {
                shapeEllipse.radiusX(targetR);
                shapeEllipse.radiusY(targetR);
                shapeEllipse.position({ x: 0, y: 0 });
              } else if (shapeCircle) {
                shapeCircle.radius(targetR);
                shapeCircle.position({ x: 0, y: 0 });
              }

              mainLayer.batchDraw();

              // Update store
              const store = (window as any).__UNIFIED_CANVAS_STORE__;
              store?.getState?.().updateElement?.(elId, {
                radius: targetR,
                radiusX: targetR,
                radiusY: targetR,
                width: targetR * 2,
                height: targetR * 2
              });
            }
          } catch {}
          pendingGrowRAF = 0;
        });
      });
    } else if (isSticky || isShapeLike) {
      ta.addEventListener('input', () => {
        if (composing) return;
        measureStickyConsistent();

        // Keep store in sync
        try {
          const store = (window as any).__UNIFIED_CANVAS_STORE__;
          store?.getState?.().updateElement?.(elId, { text: (ta as HTMLTextAreaElement).value }, { skipHistory: true });
        } catch {}
      });
    } else {
      ta.addEventListener('input', () => { if (!composing) measurePlain(); });
    }

    // Commit and cancel functions
    const commit = () => {
      const group = node as Konva.Group;
      const ktext = textNode!;
      const frame = group.findOne('.hit-area') as Konva.Rect;
      // Make text visible and measure natural bounds
      try { ktext.visible(true); (ktext as any).wrap('none'); (ktext as any).width(undefined); ktext._clearCache?.(); } catch {}
      const bbox = ktext.getClientRect({ skipTransform: true, skipStroke: true, skipShadow: true });
      const glyphW = Math.max(1, Math.ceil(((ktext as any).getTextWidth?.() || bbox.width) as number));
      const h = Math.max(1, Math.ceil(bbox.height));
      // Tighten frame and position text
      if (frame) {
        frame.width(glyphW); frame.height(h); frame.x(0); frame.y(0);
      }
      ktext.position({ x: -bbox.x, y: -bbox.y });
      try { (group as any).clip({ x: 0, y: 0, width: glyphW, height: h }); } catch {}

      // Update store and close editor
      const store = (window as any).__UNIFIED_CANVAS_STORE__;
      const nextText = isCircle ? ((ta as HTMLDivElement).innerText ?? '') : (ta as HTMLTextAreaElement).value;
      store?.getState?.().updateElement?.(elId, { text: nextText, width: glyphW, height: h, isEditing: false });
      // Ensure selection and cursor state are correct post-commit
      try { store?.getState?.().selectElement?.(elId, false); } catch {}
      try { store?.getState?.().setSelectedTool?.('select'); } catch {}
      try { stage.container().style.cursor = 'default'; } catch {}

      this.closeCurrentEditor();
      (this as any).currentEditingId = null;
    };

    const cancel = () => {
      this.closeCurrentEditor();
      const store = (window as any).__UNIFIED_CANVAS_STORE__;
      store?.getState?.().updateElement?.(elId, { isEditing: false });
      (this as any).currentEditingId = null;
    };

    // Event handlers - exact specification behavior
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        // Enter without Shift: save and exit
        e.preventDefault();
        commit();
        return;
      }
      if (e.key === 'Escape') {
        // Escape: cancel edit
        e.preventDefault();
        cancel();
        return;
      }
      // Shift+Enter: allow new line (default behavior)
    };

    const onBlur = () => {
      commit();
    };

    // Bind events with proper propagation control
    ta.addEventListener('keydown', (ev) => {
      ev.stopPropagation();
      onKeyDown(ev as any);
    }, { capture: true } as any);
    ta.addEventListener('mousedown', (evt) => {
      evt.stopPropagation();
      evt.stopImmediatePropagation?.();
    }, { capture: true } as any);
    ta.addEventListener('pointerdown', (evt) => {
      evt.stopPropagation();
      evt.stopImmediatePropagation?.();
    }, { capture: true } as any);
    ta.addEventListener('blur', onBlur);

    // Click outside handler
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (target === ta || (target && editWrapper.contains(target))) return;
      setTimeout(() => {
        if (document.activeElement === ta) ta.blur();
      }, 0);
    };
    document.addEventListener('mousedown', onDocMouseDown, true);

    // Step 4: Pan/zoom handler using worldToScreen coordinate conversion
    const onStageTransform = () => {
      if (isCircle) {
        // Update circle editor position during transform
        const store = (window as any).__UNIFIED_CANVAS_STORE__;
        const live = store?.getState()?.elements?.get(elId) || el;
        const absT = (node as Konva.Group).getAbsoluteTransform();
        const center = absT.point({ x: 0, y: 0 });
        const cRect = stage.container().getBoundingClientRect();
        editWrapper.style.left = `${Math.round(cRect.left + center.x)}px`;
        editWrapper.style.top = `${Math.round(cRect.top + center.y)}px`;
      } else if (isSticky || isShapeLike) {
        // Sticky notes and shapes: recalculate position during pan/zoom
        measureStickyConsistent();
      } else {
        // Plain text: Use proper coordinate conversion during transforms
        const store = (window as any).__UNIFIED_CANVAS_STORE__;
        const live = store?.getState()?.elements?.get(elId) || el;

        const containerRect = stage.container().getBoundingClientRect();

        // ✅ FIXED: Use consistent coordinate conversion during pan/zoom
        const worldPos = { x: live.x, y: live.y };
        const screenPos = worldToScreen(stage, worldPos);

        // Apply screen coordinates directly to DOM editor
        const newLeft = containerRect.left + screenPos.x;
        const newTop = containerRect.top + screenPos.y;

        editWrapper.style.left = `${newLeft}px`;
        editWrapper.style.top = `${newTop}px`;

        console.log('[TextModule] Transform update with fixed coordinates:', {
          worldPos, screenPos,
          containerRect: { left: containerRect.left, top: containerRect.top },
          final: { left: newLeft, top: newTop }
        });
      }
    };

    // Subscribe to transform events
    const onWheel = () => onStageTransform();
    const onDragMove = () => onStageTransform();
    stage.container()?.addEventListener('wheel', onWheel, { passive: true });
    stage.on('dragmove.editor', onDragMove);

    // Initial measurement
    console.log('[TextModule] Determining measurement type - isCircle:', isCircle, 'isSticky:', isSticky, 'isShapeLike:', isShapeLike);
    if (isCircle) {
      console.log('[TextModule] Circle: no initial measure needed');
      // Circle overlay already sized, no initial measure needed
    } else if (isSticky || isShapeLike) {
      console.log('[TextModule] Calling measureStickyConsistent...');
      measureStickyConsistent();
    } else {
      console.log('[TextModule] Calling measurePlain...');
      measurePlain();
    }

    // Set editing state
    const store = (window as any).__UNIFIED_CANVAS_STORE__;
    store?.getState?.().updateElement?.(elId, { isEditing: true });

    // Focus and place caret at the end (no full highlight on re-edit)
    ta.focus();
    if (isCircle) {
      try {
        const sel = window.getSelection?.();
        const range = document.createRange();
        range.selectNodeContents(ta);
        range.collapse(false); // caret at end
        sel?.removeAllRanges();
        sel?.addRange(range);
      } catch {}
    } else {
      try {
        const input = ta as HTMLTextAreaElement;
        const len = input.value.length;
        input.setSelectionRange(len, len);
      } catch {
        // Fallback in case immediate setSelectionRange fails due to layout
        setTimeout(() => {
          try {
            const input = ta as HTMLTextAreaElement;
            const len = input.value.length;
            input.setSelectionRange(len, len);
          } catch {}
        }, 0);
      }
    }

    // Store cleanup function
    (this as any)._closeEditor = () => {
      ta.removeEventListener('keydown', onKeyDown as EventListener);
      ta.removeEventListener('blur', onBlur);
      document.removeEventListener('mousedown', onDocMouseDown, true);
      stage.container()?.removeEventListener('wheel', onWheel);
      stage.off('dragmove.editor', onDragMove as any);

      try {
        editWrapper.remove();
      } catch {}

      if (textNode && prevTextVisible !== undefined) {
        textNode.visible(prevTextVisible);
        // Restore original Konva.Text lineHeight after editing session
        try {
          if (prevKonvaLineHeight !== undefined) textNode.lineHeight(prevKonvaLineHeight);
        } catch {}
        mainLayer.batchDraw();
      }

      try {
        if ((this as any).transformer) {
          (this as any).transformer.visible(true);
          this.ctx.konva.getLayers().overlay?.batchDraw();
        }
      } catch {}

      (this as any).currentEditor = undefined;
      (this as any).currentEditorWrapper = undefined;
      (this as any).currentEditorPad = undefined;
      try { delete (window as any).__MODULAR_TEXT_EDITING__; } catch {}
      // Restore container overflow
      try { if ((this as any).__prevOverflow !== undefined) { stage.container().style.overflow = (this as any).__prevOverflow; (this as any).__prevOverflow = undefined; } } catch {}
    };
  }

  private closeCurrentEditor(): void {
    const closer = (this as any)._closeEditor as (() => void) | undefined;
    if (closer) {
      closer();
    } else {
      if (this.textarea) {
        this.textarea.remove();
        this.textarea = null;
      }
      try {
        const editWrapper = (this as any).currentEditorWrapper;
        if (editWrapper) editWrapper.remove();
      } catch {}
    }
  }
}
