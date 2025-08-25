import Konva from 'konva';
import { ElementId } from '../types/enhanced.types';
import { useUnifiedCanvasStore } from '../store/useCanvasStore';

interface OpenEditorOptions {
  initialText: string;
  fontSize?: number;
  fontFamily?: string;
  align?: 'left' | 'center' | 'right';
  screen?: { left: number; top: number; width?: number; height?: number };
  mode?: 'single' | 'multiline';
}

/**
 * Imperative DOM textarea overlay for editing a Konva.Text element.
 * Handles IME composition, Enter/Esc, blur commit, and empty-text deletion.
 */
export function openTextEditorOverlay(stage: Konva.Stage, node: Konva.Text, elementId: ElementId, opts: OpenEditorOptions = {}) {
  const store = useUnifiedCanvasStore.getState();
  store.setTextEditingElement(elementId);
  
  // Keep the original text node visible only for placeholder; hide for real edits
  const originalVisible = node.visible();
  try {
    const editingExisting = !!(opts.initialText && opts.initialText !== 'Add text');
    if (editingExisting) {
      node.visible(false);
      node.getLayer()?.batchDraw();
    }
  } catch {}

  // Align overlay to the background-rect within the group for true box origin
  const stageBox = stage.container().getBoundingClientRect();
  const parentGroup = node.getParent() as Konva.Group;
  const bgRect = parentGroup?.findOne('[name="background-rect"]') as Konva.Rect | null;
  const groupTransform = (parentGroup || node).getAbsoluteTransform();
  const originPoint = groupTransform.point({ x: bgRect ? bgRect.x() : 0, y: bgRect ? bgRect.y() : 0 });
  const cssLeft = stageBox.left + originPoint.x;
  const cssTop = stageBox.top + originPoint.y;

  const frame = document.createElement('div');
  const textarea = document.createElement('textarea');
  // If we are editing an existing text, preload the value and hide the Konva text
  const isPlaceholder = (opts.initialText || '') === 'Add text';
  textarea.value = isPlaceholder ? '' : (opts.initialText || '');
  textarea.setAttribute('spellcheck', 'false');
  textarea.setAttribute('wrap', 'off');
  
  frame.style.position = 'absolute';
  frame.style.left = `${cssLeft}px`;
  frame.style.top = `${cssTop}px`;
  
  // Use group dimensions (includes padding/border) and convert to CSS px via stage scale
  const scale = stage.scaleX() || 1;
  const groupWidth = bgRect ? bgRect.width() : (parentGroup ? parentGroup.width() : node.width());
  const groupHeight = bgRect ? bgRect.height() : (parentGroup ? parentGroup.height() : node.height());
  const fontSize = node.fontSize();
  const fontFamily = node.fontFamily();
  const lineHeight = node.lineHeight();
  // Padding: prefer background-rect offsets; fallback to text node local x/y (e.g., sticky notes)
  const rectPadX = bgRect ? Math.abs(bgRect.x()) : Math.max(0, (node.x?.() as number) || 0);
  const rectPadY = bgRect ? Math.abs(bgRect.y()) : Math.max(0, (node.y?.() as number) || 0);
  const caretBuffer = 1; // minimal buffer to keep caret inside without visible gap
  
  frame.style.width = `${groupWidth * scale}px`;
  frame.style.height = `${groupHeight * scale}px`;
  frame.style.zIndex = '10000';
  
  // Mirror exact Konva text styling (use rect offsets as padding so text aligns)
  textarea.style.border = 'none';
  textarea.style.outline = 'none';
  textarea.style.margin = '0';
  // Add 1px safety on the left and right so caret never crosses the stroke
  textarea.style.padding = `${rectPadY}px ${rectPadX + 1}px ${rectPadY}px ${rectPadX + 1}px`;
  textarea.style.boxSizing = 'border-box';
  textarea.style.fontSize = `${fontSize}px`;
  textarea.style.fontFamily = fontFamily;
  textarea.style.lineHeight = String(lineHeight);
  textarea.style.width = '100%';
  textarea.style.height = '100%';
  textarea.style.resize = 'none';
  const isMultiline = (opts.mode === 'multiline');
  textarea.style.overflow = 'hidden'; // keep text within box
  textarea.style.whiteSpace = isMultiline ? 'pre-wrap' : 'nowrap';
  textarea.style.wordWrap = isMultiline ? 'break-word' : 'normal';
  
  textarea.style.outline = 'none !important';
  textarea.style.background = 'transparent';
  
  // Placeholder color handling: gray if initial is 'Add text'
  if ((opts.initialText || '') === 'Add text') {
    textarea.style.color = '#9CA3AF';
  } else {
    textarea.style.color = node.fill?.() as string || '#111827';
  }
  textarea.style.resize = 'none';
  textarea.style.overflow = 'hidden';
  textarea.style.zIndex = '10001';
  textarea.style.whiteSpace = isMultiline ? 'pre-wrap' : 'nowrap';
  textarea.style.wordWrap = isMultiline ? 'break-word' : 'normal';
  textarea.style.wordBreak = 'keep-all';
  textarea.style.textAlign = (opts.align ?? (node.align?.() as any) ?? 'left') as any;

  frame.appendChild(textarea);
  document.body.appendChild(frame);

  let composing = false;
  let startedTyping = false;

  const positionFrame = () => {
    try {
      const parent = node.getParent() as Konva.Group;
      const rect = parent?.findOne('[name="background-rect"]') as Konva.Rect | null;
      const t = (parent || node).getAbsoluteTransform();
      const p = t.point({ x: rect ? rect.x() : 0, y: rect ? rect.y() : 0 });
      const sb = stage.container().getBoundingClientRect();
      frame.style.left = `${sb.left + p.x}px`;
      frame.style.top = `${sb.top + p.y}px`;
    } catch {}
  };

  const onInput = () => {
    // If user started entering actual text, mark editing state
    if (!startedTyping && textarea.value.length > 0) {
      startedTyping = true;
      try { node.visible(false); node.getLayer()?.batchDraw(); } catch {}
    }

    // For multiline sticky notes, keep width fixed and wrap text; for single-line, auto-resize width
    const value = textarea.value;
    const absScale = (node.getAbsoluteScale && node.getAbsoluteScale().x) ? node.getAbsoluteScale().x : (stage.scaleX() || 1);
    const group = node.getParent() as Konva.Group;
    if (group) {
      const backgroundRect = group.findOne('[name="background-rect"]') as Konva.Rect | null;
      const hitArea = group.findOne('[name="hit-area"]') as Konva.Rect | null;
      const allRects = group.find('Rect') as Konva.Rect[];
      const textNode = group.findOne('Text') as Konva.Text | null;
      const padX = backgroundRect ? Math.abs(backgroundRect.x()) : Math.max(0, (node.x?.() as number) || 0);
      const padY = backgroundRect ? Math.abs(backgroundRect.y()) : Math.max(0, (node.y?.() as number) || 0);

      if (isMultiline) {
        // Keep frame width fixed to group width; wrap within inner width
        frame.style.width = `${groupWidth * scale}px`;
        textarea.style.width = '100%';
        // Autosize height to content to compute scrollHeight
        const prevH = textarea.style.height;
        textarea.style.height = 'auto';
        const contentCssHeight = Math.max(1, textarea.scrollHeight);
        textarea.style.height = prevH || '100%';
        // Apply new CSS height to frame for immediate visual parity
        frame.style.height = `${contentCssHeight}px`;

        const konvaGroupHeight = Math.max(1, contentCssHeight / absScale);
        const padInner = Math.max(0, (node.x?.() as number) || padX);
        const innerKonvaWidth = Math.max(1, (groupWidth - padInner * 2));
        const innerKonvaHeight = Math.max(1, (konvaGroupHeight - padY * 2));

        if (textNode) {
          textNode.fontSize(fontSize);
          textNode.fontFamily(fontFamily);
          textNode.lineHeight(lineHeight as number);
          textNode.wrap('word');
          textNode.text(value);
          textNode.width(innerKonvaWidth);
          textNode.height(innerKonvaHeight);
        }
        if (backgroundRect) {
          backgroundRect.height(konvaGroupHeight);
          backgroundRect.clearCache();
        }
        if (hitArea) {
          hitArea.height(konvaGroupHeight);
          hitArea.clearCache();
        }
        group.height(konvaGroupHeight);
        group.clearCache();
      } else {
        // Single-line auto-width behavior (text boxes)
        // Temporarily autosize textarea to content to read scrollWidth accurately
        const prevWidthStyle = textarea.style.width;
        textarea.style.width = 'auto';
        const contentCssWidth = Math.max(1, textarea.scrollWidth);
        textarea.style.width = prevWidthStyle || '100%';

        const strokeW = backgroundRect ? (backgroundRect.strokeWidth?.() as number) || 1 : 1;
        const frameCssWidth = contentCssWidth;
        frame.style.width = `${frameCssWidth}px`;
        textarea.style.width = '100%';
        textarea.style.overflow = 'hidden';
        try { (textarea as any).scrollLeft = 0; } catch {}

        const konvaCaretExtra = (Math.ceil(strokeW) + 1) / absScale;
        const konvaGroupWidth = frameCssWidth / absScale + konvaCaretExtra;
        const konvaTextWidth = Math.max(1, konvaGroupWidth - padX * 2);

        if (textNode) {
          textNode.fontSize(fontSize);
          textNode.fontFamily(fontFamily);
          textNode.lineHeight(lineHeight as number);
          textNode.wrap('none');
          textNode.text(value);
          textNode.width(Math.max(1, konvaTextWidth + 2));
        }

        if (backgroundRect) {
          backgroundRect.width(Math.max(1, konvaGroupWidth));
          backgroundRect.clearCache();
        }
        if (!backgroundRect && allRects && allRects.length > 0) {
          for (const r of allRects) {
            r.width(Math.max(1, konvaGroupWidth));
            try { r.clearCache(); } catch {}
          }
        }
        if (hitArea) {
          hitArea.width(Math.max(1, konvaGroupWidth));
          hitArea.clearCache();
        }
        group.width(Math.max(1, konvaGroupWidth));
        group.clearCache();
      }

      // Debug: log live measurements for this element
      try {
        // eslint-disable-next-line no-console
        console.log('[TextResize]', {
          elementId,
          value,
          absScale,
          cssWidth: contentCssWidth,
          konvaGroupWidth,
          konvaTextWidth,
          padX,
          rectW: backgroundRect ? backgroundRect.width() : undefined,
        });
      } catch {}

      const layer = group.getLayer();
      if (layer) layer.batchDraw();
    }

    positionFrame();
  };

  const commit = (cancel?: boolean) => {
    const valueNow = (textarea.value ?? '').replace(/\t/g, '  ');
    const trimmed = valueNow.trim();
    const wasPlaceholder = (opts.initialText || '') === 'Add text';

    // If user cancels, restore original visibility and do nothing
    if (cancel) {
      cleanup();
      return;
    }

    // If user typed nothing and it was an existing text (not placeholder), keep original
    const finalText = trimmed.length === 0 ? (wasPlaceholder ? 'Add text' : (opts.initialText || '')) : trimmed;

    cleanup();
    if (isMultiline) {
      // Persist final multiline height and ensure text node width remains inner width
      const absScale = (node.getAbsoluteScale && node.getAbsoluteScale().x) ? node.getAbsoluteScale().x : (stage.scaleX() || 1);
      const cssHeight = Math.max(1, textarea.scrollHeight);
      const targetGroupHeight = cssHeight / absScale;
      store.updateElement(
        elementId,
        { text: finalText, height: targetGroupHeight as any, updatedAt: Date.now() } as any
      );
      try {
        const group = node.getParent() as Konva.Group;
        const rect = group?.findOne('[name="background-rect"]') as Konva.Rect | null;
        const padX = rect ? Math.abs(rect.x()) : Math.max(0, (node.x?.() as number) || 0);
        const padInner2 = Math.max(0, (node.x?.() as number) || padX);
        const innerW = Math.max(1, group.width() - padInner2 * 2);
        node.width(innerW);
      } catch {}
    } else {
      // Text box: adjust width based on final DOM width
      const absScale = (node.getAbsoluteScale && node.getAbsoluteScale().x) ? node.getAbsoluteScale().x : (stage.scaleX() || 1);
      const cssWidth = Math.max(1, textarea.scrollWidth);
      const targetGroupWidth = cssWidth / absScale;
      store.updateElement(
        elementId,
        { type: 'text' as any, text: finalText, width: targetGroupWidth as any, updatedAt: Date.now() } as any
      );
    }
    store.setTextEditingElement(null);

    const group = node.getParent();
    if (group && (group as any)._enableSelection) {
      (group as any)._enableSelection();
    }
    try { store.selectElement(elementId as any, false); } catch {}
  };

  const cleanup = () => {
    textarea.removeEventListener('input', onInput);
    textarea.removeEventListener('compositionstart', onCompStart);
    textarea.removeEventListener('compositionend', onCompEnd);
    textarea.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('mousedown', onOutsideMouseDown, true);
    if (document.body.contains(frame)) document.body.removeChild(frame);
    try { stage.off('scaleXChange', handleStageTransform); } catch {}
    try { stage.off('scaleYChange', handleStageTransform); } catch {}
    try { stage.off('xChange', handleStageTransform); } catch {}
    try { stage.off('yChange', handleStageTransform); } catch {}
    
    node.visible(originalVisible);
    node.getLayer()?.batchDraw();
  };

  const handleStageTransform = () => {
    positionFrame();
    onInput();
  };
  
  const onCompStart = () => { composing = true; };
  const onCompEnd = () => { composing = false; onInput(); };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); commit(true); }
    else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); commit(false); }
    else {
      // Hide Konva placeholder on first actual typing (not navigation keys)
      if (!startedTyping && e.key.length === 1) {
        startedTyping = true;
        textarea.style.color = node.fill?.() as string || '#111827';
        try { node.visible(false); node.getLayer()?.batchDraw(); } catch {}
      }
      onInput();
    }
  };
  const onOutsideMouseDown = (e: MouseEvent) => {
    // Honor UI flag to block initial outside-click while placing the element
    try {
      const s = useUnifiedCanvasStore.getState();
      if ((s as any).blockOutsideClicks) return;
    } catch {}
    const target = e.target as Node;
    if (!frame.contains(target)) {
      try { e.stopImmediatePropagation?.(); } catch {}
      try { e.stopPropagation(); } catch {}
      try { e.preventDefault(); } catch {}
      commit(false);
    }
  };

  textarea.addEventListener('input', onInput);
  textarea.addEventListener('compositionstart', onCompStart);
  textarea.addEventListener('compositionend', onCompEnd);
  textarea.addEventListener('keydown', onKeyDown);
  
  // Delay attaching the outside click handler to prevent immediate closure
  // from the same click that created the text box
  setTimeout(() => {
    window.addEventListener('mousedown', onOutsideMouseDown, true);
  }, 50);
  
  try { stage.on('scaleXChange', handleStageTransform); } catch {}
  try { stage.on('scaleYChange', handleStageTransform); } catch {}
  try { stage.on('xChange', handleStageTransform); } catch {}
  try { stage.on('yChange', handleStageTransform); } catch {}

  requestAnimationFrame(() => {
    textarea.focus();
    textarea.style.outline = 'none';
    textarea.style.caretColor = (node.fill?.() as string) || '#111827';
    if (textarea.value) {
      try {
        textarea.setSelectionRange(0, 0);
      } catch {}
    }
    onInput(); // Initial resize
  });

  return { commit, dispose: cleanup };
}
