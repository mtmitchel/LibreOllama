
import Konva from 'konva';
import { CanvasElement, ElementId, isRectangleElement } from '../../types/enhanced.types';
import { getCircleTextBounds, getEllipticalTextBounds, wrapTextManually } from '../geometry';
import { requiredRadiusForText } from '../../utils/circleAutoGrow';

// Helper for consistent stage scale
function getConsistentStageScale(stage: Konva.Stage | null): number {
    const absScale = stage?.getAbsoluteScale?.();
    return (absScale && typeof absScale.x === 'number') ? absScale.x : 1;
}

// Utility: build a group with a hit-area rect sized to width/height
function createGroupWithHitArea(id: string, width: number, height: number, draggable: boolean = true): Konva.Group {
    const group = new Konva.Group({ id, listening: true, draggable });
    const hitArea = new Konva.Rect({
        x: 0, y: 0, width, height,
        fill: 'rgba(0,0,0,0.001)',
        stroke: undefined,
        strokeWidth: 0,
        listening: true,
        hitStrokeWidth: 0,
        name: 'hit-area',
        opacity: 1
    });
    group.add(hitArea);
    return group;
}

function ensureHitAreaSize(group: Konva.Group, width: number, height: number) {
    const allHitAreas = group.find('.hit-area');
    if (allHitAreas.length > 1) {
        for (let i = 1; i < allHitAreas.length; i++) {
            allHitAreas[i].destroy();
        }
    }
    
    const hit = group.findOne((node: Konva.Node) => node.name() === 'hit-area') as Konva.Rect | undefined;
    
    if (hit) {
        hit.position({ x: 0, y: 0 });
        hit.width(width);
        hit.height(height);
        hit.fill('rgba(0,0,0,0.001)');
        hit.stroke(undefined);
        hit.strokeWidth(0);
        hit.opacity(1);
        hit.moveToBottom();
    } else {
        const newHit = new Konva.Rect({ 
            x: 0, 
            y: 0, 
            width, 
            height, 
            fill: 'rgba(0,0,0,0.001)',
            stroke: undefined,
            strokeWidth: 0,
            listening: true, 
            hitStrokeWidth: 0, 
            name: 'hit-area',
            opacity: 1
        });
        group.add(newHit);
        newHit.moveToBottom();
    }
}

export function createRectangle(el: CanvasElement, options: { updateElementCallback?: (id: string, updates: any) => void, scheduleDraw: (layer: 'main' | 'overlay' | 'preview') => void }): Konva.Group {
    const id = String(el.id);
    const w = Math.max(1, ('width' in el ? el.width : undefined) || 1);
    const h = Math.max(1, ('height' in el ? el.height : undefined) || 1);

    const group = createGroupWithHitArea(id, w, h);
    group.name('rectangle');
    group.position({ x: el.x || 0, y: el.y || 0 });

    const bg = new Konva.Rect({
        x: 0, y: 0, width: w, height: h,
        fill: ('fill' in el ? el.fill : undefined) || '#ffffff',
        stroke: ('stroke' in el ? el.stroke : undefined) || 'transparent',
        strokeWidth: ('strokeWidth' in el ? el.strokeWidth : undefined) ?? 0,
        cornerRadius: ('cornerRadius' in el ? el.cornerRadius : undefined) ?? 0,
        listening: false,
        name: 'bg',
        perfectDrawEnabled: false,
        strokeScaleEnabled: false
    });
    group.add(bg);

    if ('text' in el && el.text) {
        const pad = ('padding' in el ? el.padding : undefined) ?? 12;
        const content = new Konva.Group({ name: 'content', listening: false });
        group.add(content);

        const text = new Konva.Text({
            x: pad, y: pad,
            width: w - pad * 2,
            text: el.text,
            fontSize: ('fontSize' in el ? el.fontSize : undefined) || 14,
            fontFamily: ('fontFamily' in el ? el.fontFamily : undefined) || 'Inter, system-ui, sans-serif',
            fill: ('textColor' in el ? el.textColor : undefined) || '#111827',
            listening: false,
            name: 'label',
            perfectDrawEnabled: false
        });
        (text as any).wrap('word');
        (text as any).align(((el as any).style?.align ?? (el as any).align) || 'left');
        (text as any).lineHeight(((el as any).style?.lineHeight ?? (el as any).lineHeight) || 1.25);
        content.add(text);
    }

    return group;
}

export function updateRectangle(group: Konva.Group, el: any, options: { updateElementCallback?: (id: string, updates: any) => void, scheduleDraw: (layer: 'main' | 'overlay' | 'preview') => void }) {
    const w = Math.max(1, el.width || 1);
    let h = Math.max(1, el.height || 1);
    
    group.position({ x: el.x || 0, y: el.y || 0 });
    ensureHitAreaSize(group, w, h);

    const rect = group.findOne<Konva.Rect>('Rect.bg');
    if (rect) {
      rect.width(w);
      rect.height(h);
      rect.fill(el.fill || '#ffffff');
      rect.stroke(el.stroke || 'transparent');
      rect.strokeWidth(el.strokeWidth ?? 0);
      rect.cornerRadius((el as any).cornerRadius ?? 0);
    }

    if (el.text) {
      const basePad = (el as any).padding ?? 12;
      const pad = basePad;
      const content = group.findOne<Konva.Group>('Group.content');
      const text = content?.findOne<Konva.Text>('Text.label');
      
      if (content && text) {
        text.x(pad);
        text.y(pad);
        text.width(Math.max(1, w - pad * 2));
        text.text(el.text);
        text.fontSize(el.fontSize || 14);
        text.fontFamily(el.fontFamily || 'Inter, system-ui, sans-serif');
        text.fill(el.textColor || '#111827');
        ;(text as any).wrap('word');
        ;(text as any).align(((el as any).style?.align ?? (el as any).align) || 'left');
        ;(text as any).lineHeight(((el as any).style?.lineHeight ?? (el as any).lineHeight) || 1.25);
        try { text.visible(!((el as any).isEditing)); } catch {}

        const desiredHeight = Math.max(h, Math.ceil(text.height()) + pad * 2);
        const maxH = (el as any).maxHeight ? Math.max(1, (el as any).maxHeight) : undefined;
        const clamped = maxH ? Math.min(desiredHeight, maxH) : desiredHeight;
        
        if (clamped !== h) {
          h = clamped;
          rect?.height(h);
          try { (group as any).clip({ x: 0, y: 0, width: w, height: h }); } catch {} 
          try { (content as any).clip({ x: pad, y: pad, width: Math.max(1, w - pad * 2), height: Math.max(1, h - pad * 2) }); } catch {} 
          try { text.visible(!((el as any).isEditing)); } catch {}
          ensureHitAreaSize(group, w, h);

          if (options.updateElementCallback) {
            options.updateElementCallback(String(el.id), { height: h });
          }
        }

        try { (content as any).clip({ x: pad, y: pad, width: Math.max(1, w - pad * 2), height: Math.max(1, h - pad * 2) }); } catch {} 
      }
    }
}

export function createCircle(el: any, options: { updateElementCallback?: (id: string, updates: any) => void, scheduleDraw: (layer: 'main' | 'overlay' | 'preview') => void }): Konva.Group {
    const id = String(el.id);
    const group = new Konva.Group({ id, name: 'circle', listening: true, draggable: true });
    group.position({ x: el.x || 0, y: el.y || 0 });

    const ellipse = new Konva.Ellipse({
      x: 0,
      y: 0,
      radiusX: el.radiusX || el.radius || 40,
      radiusY: el.radiusY || el.radius || 40,
      name: 'shape',
      listening: false,
      perfectDrawEnabled: false,
      strokeScaleEnabled: false,
    });
    group.add(ellipse);

    const content = new Konva.Group({ name: 'content', listening: false, x: 0, y: 0 });
    group.add(content);

    const text = new Konva.Text({
        name: 'label',
        listening: false,
        align: 'left',
    });
    content.add(text);

    const hitArea = new Konva.Rect({ name: 'hit-area', listening: true });
    group.add(hitArea);
    hitArea.moveToBottom();

    updateCircle(group, el, options);
    return group;
}

export function updateCircle(group: Konva.Group, el: any, options: { updateElementCallback?: (id: string, updates: any) => void, scheduleDraw: (layer: 'main' | 'overlay' | 'preview') => void }) {
    const radiusX = Math.max(20, el.radiusX || el.radius || 20);
    const radiusY = Math.max(20, el.radiusY || el.radius || 20);
    const strokeWidth = el.strokeWidth ?? 1;

    group.position({ x: el.x || 0, y: el.y || 0 });
    group.rotation(el.rotation || 0);

    let ellipse = group.findOne<Konva.Ellipse>('.shape');
    if (!ellipse || (radiusX !== radiusY && ellipse.getClassName() === 'Circle')) {
        const oldShape = ellipse;
        ellipse = new Konva.Ellipse({ name: 'shape', listening: false, radiusX, radiusY });
        group.add(ellipse);
        if (oldShape) {
            ellipse.moveUp();
            oldShape.destroy();
        }
    }

    ellipse.setAttrs({
        x: 0, 
        y: 0,
        radiusX,
        radiusY,
        fill: el.fill || '#ffffff',
        stroke: el.stroke || '#d1d5db',
        strokeWidth,
        strokeScaleEnabled: false,
        perfectDrawEnabled: false,
    });

    updateCircleShadow(ellipse, el.isEditing);

    const hitArea = group.findOne<Konva.Rect>('.hit-area');
    if (hitArea) {
        hitArea.setAttrs({ x: -radiusX, y: -radiusY, width: radiusX * 2, height: radiusY * 2 });
    }

    if (typeof el.text === 'string' || el.isEditing) {
        const pad = el.padding ?? 16;
        const content = group.findOne<Konva.Group>('.content');
        const textNode = content?.findOne<Konva.Text>('.label');

        if (content && textNode) {
            const clipRx = Math.max(1, radiusX - strokeWidth / 2);
            const clipRy = Math.max(1, radiusY - strokeWidth / 2);
            content.clipFunc((ctx: CanvasRenderingContext2D) => {
                ctx.ellipse(0, 0, clipRx, clipRy, 0, 0, Math.PI * 2);
            });

            textNode.text('');
            
            textNode.setAttrs({
                fontSize: el.fontSize || 14,
                fontFamily: el.fontFamily || 'Inter, system-ui, sans-serif',
                fill: el.textColor || '#374151',
                lineHeight: 1.3,
                align: 'left',
            });
            try { (textNode as any).letterSpacing?.(((el as any).letterSpacing) ?? 0); } catch {} 

            const nearlyCircle = Math.abs(radiusX - radiusY) < 0.5;
            const padding = el.padding ?? 16;
            
            let textAreaWidth: number;
            let textAreaHeight: number;
            
            if (nearlyCircle) {
              const rClip = Math.max(1, Math.min(radiusX, radiusY) - strokeWidth / 2);
              const side = Math.SQRT2 * rClip - padding * 2;
              
              if (!isFinite(side) || side <= 0) {
                textAreaWidth = 30;
                textAreaHeight = 30;
              } else {
                textAreaWidth = Math.max(30, side);
                textAreaHeight = Math.max(30, side);
              }
              
              if (!isFinite(textAreaWidth) || !isFinite(textAreaHeight)) {
                textAreaWidth = 30;
                textAreaHeight = 30;
              }
              
              textNode.setAttrs({
                width: textAreaWidth,
                height: textAreaHeight,
                wrap: 'word',
                ellipsis: false
              });
              
              if (el.text) {
                const lines = wrapTextManually(
                  el.text,
                  textAreaWidth,
                  el.fontSize || 14,
                  el.fontFamily || 'Inter, system-ui, sans-serif'
                );
                const wrappedText = lines.join('\n');
                textNode.text(wrappedText);
                (textNode as any).wrap('none');
              } else {
                textNode.text('');
              }
              
              try {
                textNode.clearCache();
                (textNode as any)._clearCache?.();
                (textNode as any).getTextWidth = null;
              } catch (e) {}
              
              const xWorld = -textAreaWidth / 2;
              const yWorld = -textAreaHeight / 2;
              textNode.position({ x: xWorld, y: yWorld });
            } else {
              const tb = getEllipticalTextBounds(radiusX, radiusY, padding, strokeWidth);
              textAreaWidth = Math.max(30, tb.width);
              textAreaHeight = Math.max(30, tb.height);
              
              textNode.setAttrs({
                width: textAreaWidth,
                height: textAreaHeight,
                wrap: 'word',
                ellipsis: false
              });
              
              if (el.text) {
                const lines = wrapTextManually(
                  el.text,
                  textAreaWidth,
                  el.fontSize || 14,
                  el.fontFamily || 'Inter, system-ui, sans-serif'
                );
                const wrappedText = lines.join('\n');
                textNode.text(wrappedText);
                (textNode as any).wrap('none');
              } else {
                textNode.text('');
              }
              
              try {
                textNode.clearCache();
                (textNode as any)._clearCache?.();
              } catch {} 
              
              const xWorld = -textAreaWidth / 2;
              const yWorld = -textAreaHeight / 2;
              textNode.position({ x: xWorld, y: yWorld });
            }
            
            const layer2 = group.getLayer();
            if (layer2) {
              layer2.batchDraw();
            }

            textNode.visible(!el.isEditing);

            try {
              if (nearlyCircle && el.isEditing) {
                const fontSize = textNode.fontSize();
                const lineHeight = (textNode as any).lineHeight?.() ?? 1.3;
                const family = textNode.fontFamily();
                const style = (textNode as any).fontStyle?.() ?? 'normal';
                const currentR = Math.max(radiusX, radiusY);
                const requiredR = requiredRadiusForText({
                  text: textNode.text() || '',
                  family,
                  style,
                  lineHeight,
                  fontSize,
                  padding: padding,
                  strokeWidth: strokeWidth || 0,
                });
                
                if (requiredR > currentR + 0.5) {
                  if (ellipse.getClassName() === 'Circle') {
                    (ellipse as any).radius(requiredR);
                  } else {
                    (ellipse as any).radiusX?.(requiredR);
                    (ellipse as any).radiusY?.(requiredR);
                  }

                  const sideR = requiredR;
                  const hitArea = group.findOne<Konva.Rect>('.hit-area');
                  if (hitArea) {
                    hitArea.setAttrs({ x: -sideR, y: -sideR, width: 2 * sideR, height: 2 * sideR });
                  }

                  const rClip = Math.max(1, requiredR - (strokeWidth || 0) / 2);
                  const sideWorld = Math.SQRT2 * rClip;
                  const innerWorld = Math.max(1, sideWorld - padding * 2);
                  const absT = group.getAbsoluteTransform();
                  const p0 = absT.point({ x: 0, y: 0 });
                  const px1 = absT.point({ x: 1, y: 0 });
                  const py1 = absT.point({ x: 0, y: 1 });
                  const sx = Math.max(1e-6, Math.abs(px1.x - p0.x));
                  const sy = Math.max(1e-6, Math.abs(py1.y - p0.y));
                  const sLim = Math.min(sx, sy);
                  const innerPx = innerWorld * sLim;
                  const widthWorld = innerPx / sx;
                  const heightWorld = innerPx / sy;
                  textNode.width(Math.max(1, widthWorld));
                  textNode.height(Math.max(1, heightWorld));
                  const xWorld = -(innerPx / 2) / sx;
                  const yWorld = -(innerPx / 2) / sy;
                  textNode.position({ x: xWorld, y: yWorld });

                  options.updateElementCallback?.(String(el.id), {
                    radius: requiredR,
                    radiusX: requiredR,
                    radiusY: requiredR,
                    width: 2 * requiredR,
                    height: 2 * requiredR,
                  });
                  options.scheduleDraw('main');
                }
              }
            } catch {} 
        }
    }
}

function updateCircleShadow(ellipse: Konva.Ellipse, isEditing: boolean) {
    if (!isEditing) {
      ellipse.shadowColor('#000');
      ellipse.shadowOpacity(0.08);
      ellipse.shadowBlur(8);
      ellipse.shadowOffset({ x: 0, y: 1 });
    } else {
      ellipse.shadowColor('#007ACC');
      ellipse.shadowOpacity(0.03);
      ellipse.shadowBlur(2);
      ellipse.shadowOffset({ x: 0, y: 0 });
    }
}

export function createTriangle(el: any, options: { updateElementCallback?: (id: string, updates: any) => void, scheduleDraw: (layer: 'main' | 'overlay' | 'preview') => void }): Konva.Group {
    const id = String(el.id);
    const w = Math.max(1, el.width || 180);
    const h = Math.max(1, el.height || 180);
    const group = createGroupWithHitArea(id, w, h);
    group.name('triangle');
    group.position({ x: el.x || 0, y: el.y || 0 });

    const points = [
      Math.round(w / 2), 0,
      w, h,
      0, h,
    ];

    const tri = new Konva.Line({
      points,
      closed: true,
      fill: el.fill || '#ffffff',
      stroke: el.stroke || '#d1d5db',
      strokeWidth: el.strokeWidth ?? 1,
      listening: false,
      perfectDrawEnabled: false,
      name: 'shape'
    });
    try { (tri as any).strokeScaleEnabled(false); } catch {} 
    tri.shadowColor('#000');
    tri.shadowOpacity(0.08);
    tri.shadowBlur(8);
    tri.shadowOffset({ x: 0, y: 1 });
    group.add(tri);

    if (typeof el.text === 'string') {
      const pad = (el as any).padding ?? 12;
      let content = group.findOne<Konva.Group>('Group.content');
      if (!content) {
        content = new Konva.Group({ name: 'content', listening: false });
        try {
          (content as any).clipFunc((ctx: CanvasRenderingContext2D) => {
            ctx.beginPath();
            ctx.moveTo(w / 2, 0);
            ctx.lineTo(w, h);
            ctx.lineTo(0, h);
            ctx.closePath();
          });
        } catch {} 
        group.add(content);
      }
      let text = group.findOne<Konva.Text>('Text.label');
      if (!text) {
        text = new Konva.Text({ name: 'label', listening: false });
        (content as Konva.Group).add(text);
      }
      text.text(el.text || '');
      text.fontSize(el.fontSize || 14);
      text.fontFamily(el.fontFamily || 'Inter, system-ui, sans-serif');
      text.fill(el.textColor || '#111827');
      ;(text as any).wrap('word');
      ;(text as any).align('center');
      const y0 = Math.max(pad, Math.floor(h * 0.55));
      const topWidth = Math.max(1, Math.floor((w * y0) / Math.max(1, h)));
      const innerW = Math.max(1, topWidth - pad * 2);
      text.width(innerW);
      text.x(Math.max(0, Math.floor((w - innerW) / 2)));
      text.y(y0);
      try { text.moveToTop(); text.visible(!((el as any).isEditing)); } catch {} 
      const measuredH = Math.ceil(text.height());
      const innerH = Math.max(1, h - y0 - pad);
      if (measuredH > innerH) {
        const newH = measuredH + pad * 2;
        tri.points([Math.round(w / 2), 0, w, newH, 0, newH]);
        ensureHitAreaSize(group, w, newH);
        if (options.updateElementCallback) {
          options.updateElementCallback(id, { height: newH });
        }
      }
    }
    return group;
}

export function updateTriangle(group: Konva.Group, el: any, options: { updateElementCallback?: (id: string, updates: any) => void, scheduleDraw: (layer: 'main' | 'overlay' | 'preview') => void }) {
    const w = Math.max(1, el.width || 1);
    const h = Math.max(1, el.height || 1);
    group.position({ x: el.x || 0, y: el.y || 0 });
    ensureHitAreaSize(group, w, h);

    let tri = group.findOne<Konva.Line>((node: any) => node.name() === 'shape' && node.getClassName() === 'Line');
    if (!tri) {
      const existingShapes = group.find((node: any) => node.name() === 'shape');
      existingShapes.forEach(shape => shape.destroy());
      
      tri = new Konva.Line({ name: 'shape', listening: false, closed: true });
      group.add(tri);
    }
    const points = [
      Math.round(w / 2), 0,
      w, h,
      0, h,
    ];
    tri.points(points);
    tri.closed(true);
    tri.fill(el.fill || '#ffffff');
    tri.stroke(el.stroke || '#d1d5db');
    tri.strokeWidth(el.strokeWidth ?? 1);
    tri.perfectDrawEnabled(false);
    try { (tri as any).strokeScaleEnabled(false); } catch {} 
    tri.shadowColor('#000');
    tri.shadowOpacity(0.08);
    tri.shadowBlur(8);
    tri.shadowOffset({ x: 0, y: 1 });

    if (typeof el.text === 'string') {
      const pad = (el as any).padding ?? 12;
      let content = group.findOne<Konva.Group>('Group.content');
      if (!content) {
        content = new Konva.Group({ name: 'content', listening: false });
        group.add(content);
      }
      try {
        (content as any).clipFunc((ctx: CanvasRenderingContext2D) => {
          ctx.beginPath();
          ctx.moveTo(w / 2, 0);
          ctx.lineTo(w, h);
          ctx.lineTo(0, h);
          ctx.closePath();
        });
      } catch {} 
      let text = group.findOne<Konva.Text>('Text.label');
      if (!text) {
        text = new Konva.Text({ name: 'label', listening: false });
        (content as Konva.Group).add(text);
      }
      const innerWmax = Math.max(1, w - pad * 2);
      text.text(el.text || '');
      text.fontSize(el.fontSize || 14);
      text.fontFamily(el.fontFamily || 'Inter, system-ui, sans-serif');
      text.fill(el.textColor || '#111827');
      ;(text as any).wrap('word');
      ;(text as any).align('center');
      const y0 = Math.max(pad, Math.floor(h * 0.55));
      const topWidth = Math.max(1, Math.floor((w * y0) / Math.max(1, h)));
      const innerW = Math.min(innerWmax, Math.max(1, topWidth - pad * 2));
      text.width(innerW);
      text.x(Math.max(0, Math.floor((w - innerW) / 2)));
      text.y(y0);
      try { text.moveToTop(); text.visible(!((el as any).isEditing)); } catch {} 
      const measuredH = Math.ceil(text.height());
      const innerH = Math.max(1, h - y0 - pad);
      if (measuredH > innerH) {
        const newH = measuredH + pad * 2;
        tri.points([Math.round(w / 2), 0, w, newH, 0, newH]);
        ensureHitAreaSize(group, w, newH);
        if (options.updateElementCallback) {
          options.updateElementCallback(String(el.id), { height: newH });
        }
      }
    }
}

export function createText(el: any, options: { updateElementCallback?: (id: string, updates: any) => void, scheduleDraw: (layer: 'main' | 'overlay' | 'preview') => void }): Konva.Group {
    const id = String(el.id);
    const w = Math.max(1, el.width || 1);
    const h = Math.max(1, el.height || 1);

    const group = createGroupWithHitArea(id, w, h);
    group.name('text');
    group.position({ x: Math.round(el.x || 0), y: Math.round(el.y || 0) });

    const text = new Konva.Text({
      x: 0, y: 0,
      text: el.text || '',
      fontSize: el.fontSize || 14,
      fontFamily: el.fontFamily || 'Inter, system-ui, sans-serif',
      fontStyle: (el as any).fontStyle || 'normal',
      fill: el.textColor || '#111827',
      listening: false,
      name: 'text',
      stroke: undefined,
      strokeWidth: 0,
      perfectDrawEnabled: false,
      visible: !!(el.text && el.text.trim())
    });
    (text as any).wrap('none');
    (text as any).align((el as any).align || 'left');
    if ((el as any).lineHeight) (text as any).lineHeight((el as any).lineHeight);

    group.add(text);
    try {
      const measuredH = Math.ceil(text.height());
      const minClickableH = Math.max(24, Math.ceil((el.fontSize || 14) * 1.1));
      const targetH = Math.max(minClickableH, measuredH || 0);
      const minClickableW = Math.max(60, Math.ceil((el.fontSize || 14) * 3));
      const targetW = Math.max(minClickableW, w || 1);
      ensureHitAreaSize(group, targetW, targetH);
    } catch {} 
    return group;
}

export function updateText(group: Konva.Group, el: any, options: { updateElementCallback?: (id: string, updates: any) => void, scheduleDraw: (layer: 'main' | 'overlay' | 'preview') => void }) {
    const w = Math.max(1, el.width || 1);
    group.position({ x: el.x || 0, y: el.y || 0 });

    const text = group.findOne<Konva.Text>('Text.text');
    if (text) {
      text.text(el.text || '');
      text.fontSize(el.fontSize || 14);
      text.fontFamily(el.fontFamily || 'Inter, system-ui, sans-serif');
      try { (text as any).fontStyle((el as any).fontStyle || 'normal'); } catch {} 
      text.fill(el.textColor || '#111827');
      try { (text as any).width(undefined); } catch {} 
      (text as any).wrap('none');
      (text as any).align((el as any).align || 'left');
      if ((el as any).lineHeight) (text as any).lineHeight((el as any).lineHeight);

      try {
        let measuredW = 0;
        try { measuredW = Math.ceil((text as any).getTextWidth?.() || 0); } catch { measuredW = Math.ceil(text.width()); } 
        try { (text as any).width(Math.max(w, measuredW)); } catch {} 
        const measuredH = Math.ceil(text.height());
        const minClickableH = Math.max(24, Math.ceil((el.fontSize || 14) * 1.1));
        const targetH = Math.max(minClickableH, measuredH || 0);
        const minClickableW = Math.max(60, Math.ceil((el.fontSize || 14) * 3));
        const targetW = Math.max(minClickableW, measuredW || w || 1);
        ensureHitAreaSize(group, targetW, targetH);
      } catch {} 
    } else {
      const minClickableH = Math.max(24, Math.ceil((el.fontSize || 14) * 1.1));
      const minClickableW = Math.max(60, Math.ceil((el.fontSize || 14) * 3));
      const targetW = Math.max(minClickableW, w || 1);
      ensureHitAreaSize(group, targetW, Math.max(minClickableH, Math.max(1, el.height || 1)));
    }
}

export function createConnector(el: any, options: { updateElementCallback?: (id: string, updates: any) => void, scheduleDraw: (layer: 'main' | 'overlay' | 'preview') => void }): Konva.Line | Konva.Arrow {
    const points = Array.isArray(el.points) && el.points.length >= 4
      ? [...el.points]
      : (el.startPoint && el.endPoint ? [el.startPoint.x, el.startPoint.y, el.endPoint.x, el.endPoint.y] : [] as number[]);
    if (points.length < 4) {
      points.push(0,0,0,0);
    }
    
    let connectorNode: Konva.Line | Konva.Arrow;
    
    const isArrow = el.subType === 'arrow' || el.connectorType === 'arrow';
    
    if (isArrow) {
      connectorNode = new Konva.Arrow({
        points,
        stroke: el.stroke || '#374151',
        strokeWidth: el.strokeWidth || 2,
        hitStrokeWidth: Math.max(40, (el.strokeWidth || 2) * 4),
        lineCap: 'round',
        lineJoin: 'round',
        pointerLength: 12,
        pointerWidth: 10,
        fill: el.stroke || '#374151',
        listening: true,
        strokeScaleEnabled: false,
        perfectDrawEnabled: false,
        id: el.id
      });
    } else {
      connectorNode = new Konva.Line({
        points,
        stroke: el.stroke || '#374151',
        strokeWidth: el.strokeWidth || 2,
        hitStrokeWidth: Math.max(40, (el.strokeWidth || 2) * 4),
        lineCap: 'round',
        lineJoin: 'round',
        listening: true,
        strokeScaleEnabled: false,
        perfectDrawEnabled: false,
        id: el.id
      });
    }
    
    connectorNode.setAttr('kind', 'edge');
    try { (connectorNode as any).tension?.((el as any).curved ? 0.5 : 0); } catch {} 
    
    
    return connectorNode;
}

export function updateConnector(node: Konva.Line | Konva.Arrow, el: any, options: { updateElementCallback?: (id: string, updates: any) => void, scheduleDraw: (layer: 'main' | 'overlay' | 'preview') => void }): void {
    const points = Array.isArray(el.points) && el.points.length >= 4
      ? [...el.points]
      : (el.startPoint && el.endPoint ? [el.startPoint.x, el.startPoint.y, el.endPoint.x, el.endPoint.y] : node.points());
    
    node.position({ x: 0, y: 0 });
    node.points(points);
    node.stroke(el.stroke || '#374151');
    node.strokeWidth(el.strokeWidth || 2);
    node.hitStrokeWidth(Math.max(20, (el.strokeWidth || 2) * 3));
    try { (node as any).tension?.((el as any).curved ? 0.5 : 0); } catch {} 
    
    const isArrow = el.subType === 'arrow' || el.connectorType === 'arrow';
    if (node.getClassName() === 'Arrow' && isArrow) {
      const arrowNode = node as Konva.Arrow;
      arrowNode.pointerLength(12);
      arrowNode.pointerWidth(10);
      arrowNode.fill(el.stroke || '#374151');
    }
}

export function createTable(el: any, options: { updateElementCallback?: (id: string, updates: any) => void, scheduleDraw: (layer: 'main' | 'overlay' | 'preview') => void }): Konva.Group {
    const id = String(el.id);
    const rows = Math.max(1, el.rows || (el.enhancedTableData?.rows?.length || 1));
    const cols = Math.max(1, el.cols || (el.enhancedTableData?.columns?.length || 1));

    let w = Math.max(1, el.width || (cols * (el.cellWidth || 120)));
    let h = Math.max(1, el.height || (rows * (el.cellHeight || 36)));

    const group = createGroupWithHitArea(id, w, h, true);
    group.name('table');
    group.position({ x: el.x || 0, y: el.y || 0 });

    const frame = new Konva.Rect({
      x: 0, y: 0, width: w, height: h,
      fill: (el as any).fill || '#ffffff',
      stroke: (el as any).borderColor || '#d1d5db',
      strokeWidth: (el as any).borderWidth ?? 1,
      listening: false,
      name: 'frame',
      perfectDrawEnabled: false,
      strokeScaleEnabled: false,
    });
    group.add(frame);

    const bgrows = new Konva.Group({ name: 'bgrows', listening: false });
    group.add(bgrows);

    const grid = new Konva.Group({ name: 'grid', listening: false });
    group.add(grid);

    const cells = new Konva.Group({ name: 'cells', listening: false });
    group.add(cells);

    layoutTable(group, el, options);

    try { group.setAttr('__rows', rows); group.setAttr('__cols', cols); group.setAttr('__tableId', id); } catch {} 

    return group;
}

export function updateTable(group: Konva.Group, el: any, options: { updateElementCallback?: (id: string, updates: any) => void, scheduleDraw: (layer: 'main' | 'overlay' | 'preview') => void }) {
    const w = Math.max(1, el.width || 1);
    const h = Math.max(1, el.height || 1);
    group.position({ x: el.x || 0, y: el.y || 0 });

    const frame = group.findOne<Konva.Rect>('.frame');
    if (frame) {
      frame.position({ x: 0, y: 0 });
      frame.width(w);
      frame.height(h);
      frame.stroke((el as any).borderColor || '#d1d5db');
      frame.strokeWidth((el as any).borderWidth ?? 1);
      (frame as any).strokeScaleEnabled(false);
    }

    layoutTable(group, el, options);

    ensureHitAreaSize(group, w, h);
    options.scheduleDraw('main');
}

function layoutTable(group: Konva.Group, el: any, options: { updateElementCallback?: (id: string, updates: any) => void, scheduleDraw: (layer: 'main' | 'overlay' | 'preview') => void }) {
    const rows = Math.max(1, el.rows || (el.enhancedTableData?.rows?.length || 1));
    const cols = Math.max(1, el.cols || (el.enhancedTableData?.columns?.length || 1));
    const w = Math.max(1, el.width || 1);
    const h = Math.max(1, el.height || 1);
    const cellW = Math.max(1, Math.floor(w / cols));
    const cellH = Math.max(1, Math.floor(h / rows));
    const innerW = w;
    const innerH = h;

    const gridGroup = group.findOne<Konva.Group>('.grid');
    const cellsGroup = group.findOne<Konva.Group>('.cells');
    let bgRowsGroup = group.findOne<Konva.Group>('.bgrows');
    if (!bgRowsGroup) {
      bgRowsGroup = new Konva.Group({ name: 'bgrows', listening: false });
      group.add(bgRowsGroup);
      bgRowsGroup.moveToBottom();
    }
    if (!gridGroup || !cellsGroup) return;

    try { (bgRowsGroup as Konva.Group).destroyChildren(); } catch {} 
    try { gridGroup.destroyChildren(); } catch {} 
    try { cellsGroup.destroyChildren(); } catch {} 

    const stroke = (el as any).borderColor || '#9ca3af';
    const strokeWidth = (el as any).borderWidth ?? 1;

    const styling = (el as any).enhancedTableData?.styling || {};
    const headerBg = styling.headerBackgroundColor || '#f3f4f6';
    const altBg = styling.alternateRowColor || '#f9fafb';
    for (let r = 0; r < rows; r++) {
      const y = r * cellH;
      const fill = r === 0 ? headerBg : (r % 2 === 1 ? altBg : 'transparent');
      if (fill && fill !== 'transparent') {
        (bgRowsGroup as Konva.Group).add(new Konva.Rect({ x: 0, y, width: innerW, height: cellH, fill, listening: false }));
      }
    }

    for (let c = 1; c < cols; c++) {
      const x = Math.round(c * cellW);
      gridGroup.add(new Konva.Line({ points: [x, 0, x, innerH], stroke, strokeWidth, listening: false }));
    }
    for (let r = 1; r < rows; r++) {
      const y = Math.round(r * cellH);
      gridGroup.add(new Konva.Line({ points: [0, y, innerW, y], stroke, strokeWidth, listening: false }));
    }

    const pad = (el as any).cellPadding ?? 0;
    const data = (el as any).enhancedTableData?.cells || (el as any).tableData?.cells || (el as any).tableData || [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const content = Array.isArray(data) && data[r] && data[r][c] ? (data[r][c].content ?? data[r][c].text ?? '') : '';
        const tx = new Konva.Text({
          x: c * cellW,
          y: r * cellH,
          width: Math.max(1, cellW),
          height: Math.max(1, cellH),
          text: String(content),
          fontSize: (el as any).fontSize || 13,
          fontFamily: (el as any).fontFamily || 'Inter, system-ui, sans-serif',
          fill: (el as any).textColor || '#111827',
          listening: false,
          name: `cell-text-${r}-${c}`,
          perfectDrawEnabled: false,
        });
        (tx as any).wrap('word');
        (tx as any).align('center');
        (tx as any).verticalAlign('middle');
        (tx as any).lineHeight(1.25);
        cellsGroup.add(tx);
      }
    }

    ensureHitAreaSize(group, Math.max(w, innerW), Math.max(h, innerH));
    options.scheduleDraw('main');
}

export function createImage(el: any, options: { updateElementCallback?: (id: string, updates: any) => void, scheduleDraw: (layer: 'main' | 'overlay' | 'preview') => void }): Konva.Group {
    const id = String(el.id);
    const w = Math.max(1, el.width || 100);
    const h = Math.max(1, el.height || 100);
    
    const group = createGroupWithHitArea(id, w, h);
    group.name('image');
    group.position({ x: el.x || 0, y: el.y || 0 });
    
    const imageNode = new Konva.Image({ listening: false, name: 'image-content' } as any);
    imageNode.position({ x: 0, y: 0 });
    imageNode.width(w);
    imageNode.height(h);
    
    if (el.imageUrl) {
      const imgElement = new Image();
      imgElement.onload = () => {
        imageNode.image(imgElement);
        group.getLayer()?.batchDraw();
      };
      imgElement.src = el.imageUrl;
    }
    
    group.add(imageNode);
    return group;
}

export function updateImage(group: Konva.Group, el: any, options: { updateElementCallback?: (id: string, updates: any) => void, scheduleDraw: (layer: 'main' | 'overlay' | 'preview') => void }) {
    const w = Math.max(1, el.width || 100);
    const h = Math.max(1, el.height || 100);
    
    group.position({ x: el.x || 0, y: el.y || 0 });
    ensureHitAreaSize(group, w, h);
    
    const imageNode = group.findOne<Konva.Image>('.image-content');
    if (imageNode) {
      imageNode.width(w);
      imageNode.height(h);
      
      if (el.imageUrl && (!imageNode.image() || (imageNode.image() as HTMLImageElement).src !== el.imageUrl)) {
        const imgElement = new Image();
        imgElement.onload = () => {
          imageNode.image(imgElement);
          group.getLayer()?.batchDraw();
        };
        imgElement.src = el.imageUrl;
      }
    }
}

export function createStickyNote(el: any, options: { updateElementCallback?: (id: string, updates: any) => void, scheduleDraw: (layer: 'main' | 'overlay' | 'preview') => void }): Konva.Group {
    const id = String(el.id);
    const w = Math.max(1, el.width || 200);
    const h = Math.max(1, el.height || 150);

    const group = createGroupWithHitArea(id, w, h, true);
    group.name('sticky-note');
    group.position({ x: Math.round(el.x || 0), y: Math.round(el.y || 0) });
    try { (group as any).width?.(w); (group as any).height?.(h); } catch {} 
    try { group.setAttr('__layoutW', w); group.setAttr('__layoutH', h); } catch {} 

    const bg = new Konva.Rect({
      x: 0, y: 0, width: w, height: h,
      fill: el.backgroundColor || el.fill || '#fef08a',
      stroke: (el as any).stroke || 'transparent',
      strokeWidth: 0,
      cornerRadius: 4,
      shadowColor: 'transparent',
      shadowBlur: 0,
      shadowOffset: { x: 0, y: 0 },
      shadowOpacity: 0,
      listening: false,
      name: 'frame',
      perfectDrawEnabled: false,
      strokeScaleEnabled: false
    });
    group.add(bg);

    const pad = 12;
    const text = new Konva.Text({
      x: pad, y: pad,
      width: w - pad * 2,
      height: h - pad * 2,
      text: el.text || '',
      fontSize: el.fontSize || 14,
      fontFamily: el.fontFamily || 'Inter, system-ui, sans-serif',
      fill: el.textColor || '#451a03',
      listening: false,
      name: 'text',
      perfectDrawEnabled: false
    });
    (text as any).wrap('word');
    (text as any).align('left');
    if ((el as any).lineHeight) (text as any).lineHeight((el as any).lineHeight);
    else (text as any).lineHeight(1.25);
    if ((el as any).letterSpacing !== undefined) (text as any).letterSpacing((el as any).letterSpacing);

    group.add(text);

    return group;
}

export function updateStickyNote(group: Konva.Group, el: any, options: { updateElementCallback?: (id: string, updates: any) => void, scheduleDraw: (layer: 'main' | 'overlay' | 'preview') => void }) {
    const w = Math.max(1, el.width || 200);
    const h = Math.max(1, el.height || 150);
    
    group.position({ x: el.x || 0, y: el.y || 0 });
    try { (group as any).width?.(w); (group as any).height?.(h); } catch {} 
    try { group.setAttr('__layoutW', w); group.setAttr('__layoutH', h); } catch {} 
    ensureHitAreaSize(group, w, h);

    const bg = group.findOne<Konva.Rect>('.frame');
    if (bg) {
      bg.position({ x: 0, y: 0 });
      bg.width(w);
      bg.height(h);
      bg.fill(el.backgroundColor || el.fill || '#fef08a');
      if ((el as any).style?.stroke) {
        bg.stroke((el as any).style.stroke.color);
        bg.strokeWidth((el as any).style.stroke.width);
        (bg as any).strokeScaleEnabled(false);
      } else {
        bg.stroke((el as any).stroke || 'transparent');
        bg.strokeWidth(0);
        (bg as any).strokeScaleEnabled(false);
      }
      try { (bg as any).shadowForHitEnabled?.(false); } catch {} 
      try { (bg as any).shadowForStrokeEnabled?.(false); } catch {} 
    }

    const text = group.findOne<Konva.Text>('.text');
    if (text) {
      const pad = (el as any).style?.padding ?? 12;
      text.position({ x: pad, y: pad });
      text.width(Math.max(1, w - pad * 2));
      text.height(Math.max(1, h - pad * 2));
      text.text(el.text || '');
      text.fontSize((el as any).style?.fontSize ?? (el.fontSize || 14));
      text.fontFamily((el as any).style?.fontFamily ?? (el.fontFamily || 'Inter, system-ui, sans-serif'));
      (text as any).lineHeight((el as any).style?.lineHeight ?? 1.25);
      text.fill((el as any).style?.textFill ?? (el.textColor || '#451a03'));
      (text as any).wrap('word');
      (text as any).align('left');
    }
}

export function createCircleText(el: any, options: { updateElementCallback?: (id: string, updates: any) => void, scheduleDraw: (layer: 'main' | 'overlay' | 'preview') => void }): Konva.Group {
    const id = String(el.id);
    let r = (el.radius ?? (Math.min(el.width || 0, el.height || 0) / 2));
    if (!r || r <= 0) r = 40;
    const group = new Konva.Group({ id, name: 'circle-text', listening: true, draggable: true });
    group.position({ x: el.x || 0, y: el.y || 0 });

    let circle = new Konva.Circle({ name: 'Circle', listening: true });
    group.add(circle);

    let textNode = new Konva.Text({ name: 'Text', listening: false, align: 'left' });
    group.add(textNode);

    const hit = new Konva.Rect({ name: 'hit-area', listening: true, x: -r, y: -r, width: r * 2, height: r * 2, fill: 'rgba(0,0,0,0.001)' });
    group.add(hit);

    syncCircleText(el as any, group, options);
    return group;
}

export function updateCircleText(group: Konva.Group, el: any, options: { updateElementCallback?: (id: string, updates: any) => void, scheduleDraw: (layer: 'main' | 'overlay' | 'preview') => void }) {
    syncCircleText(el as any, group, options);
}

function syncCircleText(el: any, group: Konva.Group, options: { updateElementCallback?: (id: string, updates: any) => void, scheduleDraw: (layer: 'main' | 'overlay' | 'preview') => void }) {
    const id = String(el.id);
    group.position({ x: el.x || 0, y: el.y || 0 });
    group.rotation(el.rotation || 0);
    group.scale({ x: 1, y: 1 });

    let circle = group.findOne<Konva.Circle>('Circle');
    if (!circle) { circle = new Konva.Circle({ name: 'Circle', listening: true }); group.add(circle); }
    let textNode = group.findOne<Konva.Text>('Text');
    if (!textNode) { textNode = new Konva.Text({ name: 'Text', listening: false, align: 'left', verticalAlign: 'middle' as any }); group.add(textNode); }
    let hit = group.findOne<Konva.Rect>('Rect.hit-area') as Konva.Rect | null;
    if (!hit) { hit = new Konva.Rect({ name: 'hit-area', listening: true, fill: 'rgba(0,0,0,0.001)' }); group.add(hit); }

    let radiusX = el.radiusX || el.radius || (el.width ? el.width / 2 : 40);
    let radiusY = el.radiusY || el.radius || (el.height ? el.height / 2 : 40);
    if (radiusX <= 0) radiusX = 40;
    if (radiusY <= 0) radiusY = 40;
    
    const pad = Math.max(0, (el.padding ?? 12));
    const strokeWidth = el.strokeWidth ?? 1;
    let textBounds = getEllipticalTextBounds(radiusX, radiusY, pad, strokeWidth);
    let textAreaWidth = textBounds.width;
    let textAreaHeight = textBounds.height;
    if (Math.abs(radiusX - radiusY) < 0.001) {
      const rClip = Math.max(1, radiusX - strokeWidth / 2);
      const side = Math.max(1, Math.SQRT2 * rClip - 2 * pad);
      textAreaWidth = side;
      textAreaHeight = side;
    }
    
    if (!isFinite(textAreaWidth) || textAreaWidth <= 0) {
      textAreaWidth = 100;
    } else if (textAreaWidth < 30) {
      textAreaWidth = 30;
    }

    if (!isFinite(textAreaHeight) || textAreaHeight <= 0) {
      textAreaHeight = 100;
    } else if (textAreaHeight < 30) {
      textAreaHeight = 30;
    }

    if (radiusX === radiusY) {
      circle.setAttrs({ x: 0, y: 0, radius: radiusX, fill: el.fill || '#ffffff', stroke: el.stroke || '#d1d5db', strokeWidth: el.strokeWidth ?? 1 });
    } else {
      if (circle.getClassName() === 'Circle') {
        const ellipse = new Konva.Ellipse({
          x: 0, y: 0,
          radiusX, radiusY,
          fill: el.fill || '#ffffff', 
          stroke: el.stroke || '#d1d5db', 
          strokeWidth: el.strokeWidth ?? 1,
          name: 'Circle'
        });
        try { (ellipse as any).strokeScaleEnabled(false); } catch {} 
        circle.destroy();
        group.add(ellipse);
        circle = ellipse as any;
      } else {
        (circle as any).radiusX?.(radiusX);
        (circle as any).radiusY?.(radiusY);
        circle.setAttrs({ fill: el.fill || '#ffffff', stroke: el.stroke || '#d1d5db', strokeWidth: el.strokeWidth ?? 1 });
      }
    }
    try { (circle as any).strokeScaleEnabled(false); } catch {} 

    const maxRadius = Math.max(radiusX, radiusY);
    hit.setAttrs({ x: -maxRadius, y: -maxRadius, width: 2 * maxRadius, height: 2 * maxRadius });

    const minFont = Math.max(1, el.minFont ?? 10);
    const maxFont = Math.max(minFont, el.maxFont ?? 240);
    const lineHeight = el.lineHeight ?? 1.3;
    const wrapMode: 'scale' | 'wrap' | 'ellipsis' = el.textFit ?? 'wrap';

    const fontSize: number = el.fontSize || 14;

    const innerPad = Math.max(0, (el.padding ?? 12));

    let content = group.findOne<Konva.Group>('Group.text-content');
    if (!content) {
      content = new Konva.Group({ name: 'text-content', listening: false });
      group.add(content);
      textNode.moveTo(content);
    }
    
    const rxClip = Math.max(1, radiusX - pad - strokeWidth / 2);
    const ryClip = Math.max(1, radiusY - pad - strokeWidth / 2);
    try {
      (content as any).clipFunc((ctx: CanvasRenderingContext2D) => {
        ctx.beginPath();
        ctx.ellipse(0, 0, rxClip, ryClip, 0, 0, Math.PI * 2);
      });
    } catch {} 

    textNode.setAttrs({
      width: textAreaWidth,
      height: textAreaHeight,
      wrap: 'word',
      ellipsis: false,
    } as any);
    
    const useManualWrapping = true;
    
    if (useManualWrapping && el.text) {
      const lines = wrapTextManually(
        el.text,
        textAreaWidth,
        fontSize,
        el.fontFamily || 'Inter, system-ui, sans-serif'
      );
      const wrappedText = lines.join('\n');
      textNode.text(wrappedText);
      (textNode as any).wrap('none');
    } else {
      textNode.text('');
      textNode.text(el.text || '');
    }
    
    textNode.setAttrs({
      x: -textAreaWidth / 2,
      y: -textAreaHeight / 2,
      fontFamily: el.fontFamily || 'Inter, system-ui, sans-serif',
      fontStyle: el.fontStyle || 'normal',
      fontSize,
      lineHeight,
      fill: el.textColor || '#111827',
      align: 'left',
      listening: false,
    } as any);
    
    try {
      textNode.clearCache();
      (textNode as any).getTextWidth = null;
      (textNode as any)._clearCache?.();
      (textNode as any)._requestDraw?.();
    } catch (e) {}
    
    try { (textNode as any).letterSpacing?.((el as any).letterSpacing ?? 0); } catch {} 
    
    const layer = group.getLayer();
    if (layer) {
      layer.batchDraw();
    }

    const absT = group.getAbsoluteTransform();
    const p0 = absT.point({ x: 0, y: 0 });
    const px1 = absT.point({ x: 1, y: 0 });
    const py1 = absT.point({ x: 0, y: 1 });
    const sx = Math.max(1e-6, Math.abs(px1.x - p0.x));
    const sy = Math.max(1e-6, Math.abs(py1.y - p0.y));
    const sLim = Math.min(sx, sy);
    const nearlyCircle = Math.abs(radiusX - radiusY) < 0.5;
    if (nearlyCircle) {
      const widthToUse = textAreaWidth;
      const heightToUse = textAreaHeight;
      
      textNode.width(Math.max(1, widthToUse));
      textNode.height(Math.max(1, heightToUse));
      const xWorld = -widthToUse / 2;
      const yWorld = -heightToUse / 2;
      textNode.position({ x: xWorld, y: yWorld });
      
      try { 
        (textNode as any)._clearCache?.();
        (textNode as any).clearCache?.();
      } catch {} 
    } else {
      const innerW = Math.max(1, textAreaWidth - pad * 2);
      const innerH = Math.max(1, textAreaHeight - pad * 2);
      const innerWPx = innerW * sLim;
      const innerHPx = innerH * sLim;
      const widthWorld = innerWPx / sx;
      const heightWorld = innerHPx / sy;
      textNode.width(Math.max(1, widthWorld));
      textNode.height(Math.max(1, heightWorld));
      const xWorld = -(innerWPx / 2) / sx;
      const yWorld = -(innerHPx / 2) / sy;
      textNode.position({ x: xWorld, y: yWorld });
      
      try { 
        (textNode as any)._clearCache?.();
        (textNode as any).clearCache?.();
      } catch {} 
    }

    try {
      const nearlyCircle = Math.abs(radiusX - radiusY) < 0.5;
      if (nearlyCircle && el.isEditing) {
        const currentFontSize = textNode.fontSize();
        const family = textNode.fontFamily();
        const style = (textNode as any).fontStyle?.() ?? 'normal';
        const currentR = Math.max(radiusX, radiusY);
        const requiredR = requiredRadiusForText({
          text: textNode.text() || '',
          family,
          style,
          lineHeight,
          fontSize: currentFontSize,
          padding: pad,
          strokeWidth: strokeWidth || 0,
        });
        if (requiredR > currentR + 0.5) {
          const dpr = (window.devicePixelRatio || 1);
          const snapWorld = (v: number) => Math.ceil(v * dpr) / dpr;
          const rWorld = snapWorld(requiredR);

          radiusX = rWorld;
          radiusY = rWorld;
          if (circle && circle.getClassName() === 'Circle') {
            (circle as any).radius(rWorld);
          } else if (circle) {
            (circle as any).radiusX?.(rWorld);
            (circle as any).radiusY?.(rWorld);
          }
          hit.setAttrs({ x: -rWorld, y: -rWorld, width: 2 * rWorld, height: 2 * rWorld });
          const rClip = Math.max(1, rWorld - (strokeWidth || 0) / 2);
          const side = Math.SQRT2 * rClip;
          const innerPad2 = pad;
          const innerSide = Math.max(1, side - innerPad2 * 2);
          const abs2 = group.getAbsoluteTransform();
          const p02 = abs2.point({ x: 0, y: 0 });
          const px2 = abs2.point({ x: 1, y: 0 });
          const py2 = abs2.point({ x: 0, y: 1 });
          const sx2 = Math.max(1e-6, Math.abs(px2.x - p02.x));
          const sy2 = Math.max(1e-6, Math.abs(py2.y - p02.y));
          const widthWorld2 = innerSide / sx2;
          const heightWorld2 = innerSide / sy2;
          textNode.width(Math.max(1, widthWorld2));
          textNode.height(Math.max(1, heightWorld2));
          const xWorld2 = -(innerSide / 2) / sx2;
          const yWorld2 = -(innerSide / 2) / sy2;
          textNode.position({ x: xWorld2, y: yWorld2 });
          (options.updateElementCallback as any)?.(id, { radius: rWorld, radiusX: rWorld, radiusY: rWorld, width: 2 * rWorld, height: 2 * rWorld });
          options.scheduleDraw('main');
        }
      }
    } catch {} 

    try { textNode.visible(!el.isEditing); } catch {} 
}

export function createLine(el: CanvasElement, options: { updateElementCallback?: (id: string, updates: any) => void, scheduleDraw: (layer: 'main' | 'overlay' | 'preview') => void }): Konva.Line {
    const line = new Konva.Line();
    line.id(String(el.id));
    line.name(el.type);
    line.listening(true);
    line.perfectDrawEnabled(false);
    updateLine(line, el, options);
    return line;
}

export function updateLine(line: Konva.Line, el: CanvasElement, options: { updateElementCallback?: (id: string, updates: any) => void, scheduleDraw: (layer: 'main' | 'overlay' | 'preview') => void }) {
    line.position({ x: 0, y: 0 });
    line.points((el as any).points || []);
    line.stroke((el as any).color || '#000000');

    let style = { color: '#000000', width: 2, opacity: 1, blendMode: 'source-over' } as any;
    
    if (el.type === 'pen') {
      style = { color: (el as any).style?.color || (el as any).color || '#000000', width: (el as any).style?.width || (el as any).strokeWidth || 2, opacity: (el as any).style?.opacity ?? 1, blendMode: (el as any).style?.blendMode || 'source-over' };
    } else if (el.type === 'marker') {
      style = { color: (el as any).style?.color || (el as any).color || '#000000', width: (el as any).style?.width || (el as any).strokeWidth || 8, opacity: (el as any).style?.opacity ?? 0.7, blendMode: (el as any).style?.blendMode || 'multiply' };
    } else if (el.type === 'highlighter') {
      style = { color: (el as any).style?.color || (el as any).color || '#f7e36d', width: (el as any).style?.width || (el as any).strokeWidth || 12, opacity: (el as any).style?.opacity ?? 0.5, blendMode: (el as any).style?.blendMode || 'multiply' };
    }

    if (line) {
      line.stroke(style.color || '#000000');
      line.strokeWidth(style.width || 12);
      line.opacity(style.opacity ?? 0.5);
      line.globalCompositeOperation(style.blendMode || 'multiply');
      line.lineCap('round');
      line.lineJoin('round');
    }
}
