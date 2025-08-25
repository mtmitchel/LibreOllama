// src/features/canvas/core/StickyPreview.ts
import Konva from 'konva';

/**
 * Simple floating DOM preview for sticky notes.
 * Renders a lightweight DOM box that follows a Konva node using absolute transforms.
 */
class StickyPreviewManager {
  private frame: HTMLDivElement | null = null;
  private content: HTMLDivElement | null = null;
  private visible = false;

  private ensureFrame() {
    // If already created, enforce current styles and remove any debug markers
    if (this.frame) {
      try {
        this.frame.style.border = 'none';
        this.frame.style.outline = 'none';
        // Remove any existing center dot added during debugging
        const existingDot = this.frame.querySelector('[data-center-dot="1"]');
        if (existingDot && existingDot.parentElement) existingDot.parentElement.removeChild(existingDot);
      } catch {}
      return;
    }

    const frame = document.createElement('div');
    frame.style.position = 'fixed';
    frame.style.pointerEvents = 'none';
    // Keep preview below floating menus; toolbar popovers will set a higher z-index
    frame.style.zIndex = '5000';
    frame.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    frame.style.border = 'none';
    frame.style.outline = 'none';
    frame.style.borderRadius = '6px';
    frame.style.background = '#fef3c7'; // Sticky note yellow
    frame.style.opacity = '0.9';
    frame.style.display = 'block';
    // No transform offset - will be centered on cursor

    const inner = document.createElement('div');
    inner.style.padding = '8px 10px';
    inner.style.color = 'black';
    // No default text - empty preview
    inner.style.fontFamily = 'Inter, system-ui, Arial';
    inner.style.fontSize = '14px';
    inner.style.lineHeight = '1.3';
    inner.style.whiteSpace = 'pre-wrap';

    frame.appendChild(inner);
    document.body.appendChild(frame);

    this.frame = frame;
    this.content = inner;
  }

  show(stage: Konva.Stage, node: Konva.Node, text: string) {
    this.ensureFrame();
    if (!this.frame || !this.content) return;
    this.content.textContent = text || '';
    this.visible = true;
    this.frame.style.display = 'block';
    this.update(stage, node);
  }

  // Direct coordinate API (stage units → CSS) for tool hover previews
  showAt(stage: Konva.Stage, x: number, y: number, width: number, height: number, text: string = '') {
    this.showAtWithColor(stage, x, y, width, height, text, '#fef3c7');
  }

  // Direct coordinate API with custom color
  showAtWithColor(stage: Konva.Stage, x: number, y: number, width: number, height: number, text: string = '', color: string = '#fef3c7') {
    this.ensureFrame();
    if (!this.frame || !this.content) return;
    const box = stage.container().getBoundingClientRect();
    const scale = (stage.scaleX?.() ?? 1);
    const wCss = Math.max(60, Math.round(width * scale));
    const hCss = Math.max(40, Math.round(height * scale));
    let left = Math.round(box.left + x * scale);
    let top = Math.round(box.top + y * scale);
    
    // Center the preview on the cursor FIRST
    left -= wCss / 2;
    top -= hCss / 2;
    
    // Clamp to viewport to avoid any scrollbars/overshoot visuals
    left = Math.max(0, Math.min(left, (window.innerWidth || document.documentElement.clientWidth) - wCss));
    top = Math.max(0, Math.min(top, (window.innerHeight || document.documentElement.clientHeight) - hCss));
    
    // No empirical offsets; center should align with cursor now
    
    this.content.textContent = text; // Only show text if explicitly provided
    this.visible = true;
    
    this.frame.style.display = 'block';
    this.frame.style.visibility = 'visible';
    this.frame.style.left = `${left}px`;
    this.frame.style.top = `${top}px`;
    this.frame.style.transform = 'none';
    this.frame.style.width = `${wCss}px`;
    this.frame.style.height = `${hCss}px`;
    this.frame.style.background = color; // Use the provided color
    
    // Final positioning debug - let's see if the issue is visual vs mathematical
    console.log(`🎯 Preview positioned at ${left},${top} with cursor theoretically at center`);
    console.log(`🎯 If cursor appears off-center, it's a browser/CSS issue, not our math`);
  }

  update(stage: Konva.Stage, node: Konva.Node) {
    if (!this.visible || !this.frame) return;
    try {
      const abs = node.getAbsoluteTransform();
      const pt = abs.point({ x: 0, y: 0 });
      const box = stage.container().getBoundingClientRect();
      const bbox = (node as any).getClientRect ? (node as any).getClientRect({ relativeTo: stage }) : { width: (node as any).width?.() ?? 120, height: (node as any).height?.() ?? 80 };
      const left = Math.round(box.left + pt.x);
      const top = Math.round(box.top + pt.y);
      this.frame.style.transform = `translate3d(${left}px, ${top}px, 0)`;
      this.frame.style.width = `${Math.max(60, Math.round(bbox.width))}px`;
      this.frame.style.height = `${Math.max(40, Math.round(bbox.height))}px`;
    } catch {}
  }

  hide() {
    if (!this.frame) return;
    this.visible = false;
    this.frame.style.display = 'none';
  }

  destroy() {
    try {
      if (this.frame && this.frame.parentElement) {
        this.frame.parentElement.removeChild(this.frame);
      }
    } catch {}
    this.frame = null;
    this.content = null;
    this.visible = false;
  }
}

export const StickyPreview = new StickyPreviewManager();


