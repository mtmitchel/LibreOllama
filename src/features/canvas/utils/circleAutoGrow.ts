import Konva from 'konva';

type GrowOpts = {
  text: string;
  family: string;
  style?: string;
  lineHeight: number;
  fontSize: number;   // desired fixed font size
  padding: number;
};

const measureNode = new Konva.Text({ x: 0, y: 0, visible: false, listening: false, align: 'center' });

/**
 * Compute minimal circle radius to contain text inside the inscribed square
 * for a fixed font size (growCircle mode).
 */
export function requiredRadiusForText(opts: GrowOpts & { strokeWidth?: number }): number {
  const { text, family, style, lineHeight, fontSize } = opts;
  const padding = Math.max(0, opts.padding);
  const strokeWidth = Math.max(0, opts.strokeWidth ?? 0);
  
  console.log('[requiredRadiusForText] Input parameters:', {
    textLength: text.length,
    textPreview: text.substring(0, 50).replace(/\n/g, '\\n'),
    family,
    style,
    lineHeight,
    fontSize,
    padding,
    strokeWidth
  });

  measureNode.fontFamily(family);
  measureNode.fontStyle(style ?? 'normal');
  measureNode.lineHeight(lineHeight);
  measureNode.fontSize(fontSize);
  measureNode.align('center');

  // quick seed using no-wrap width (auto width, no explicit height)
  (measureNode as any).wrap('none');
  try { (measureNode as any).width?.('auto'); } catch { /* keep default */ }
  measureNode.text(text);
  // side: required CONTENT side length (world units) to fit the text without wrapping
  const initialWidth = (measureNode as any).getTextWidth?.() || 0;
  const minHeightFromFont = fontSize * lineHeight;
  let side = Math.ceil(Math.max(initialWidth, minHeightFromFont));
  if (!isFinite(side) || side <= 0) {
    side = Math.ceil(Math.max(1, minHeightFromFont || fontSize || 12));
  }
  
  console.log('[requiredRadiusForText] Initial measurement:', {
    initialWidth,
    minHeightFromFont,
    initialSide: side,
    textHasNewlines: text.includes('\n')
  });

  // refine with wrap inside square; iterate to convergence (few steps)
  for (let i = 0; i < 4; i++) {
    (measureNode as any).wrap('word');
    measureNode.width(side);
    // ❌ DON'T set height - let content determine height naturally
    measureNode.text(text);
    
    // Use getSelfRect() to get actual content dimensions
    const selfRect = measureNode.getSelfRect();
    const h = Number.isFinite(selfRect?.height) ? selfRect.height : 0;
    const wRaw = Number.isFinite(selfRect?.width) ? selfRect.width : 0;
    const w = Math.min(side, Math.max(0, wRaw));
    let need = Math.ceil(Math.max(w, h));
    if (!isFinite(need) || need <= 0) need = Math.ceil(Math.max(1, minHeightFromFont));
    
    console.log(`[requiredRadiusForText] Iteration ${i}:`, {
      currentSide: side,
      measuredHeight: h,
      measuredWidth: w,
      needed: need,
      willBreak: need <= side
    });
    
    if (need <= side) break;
    side = need;
  }

  // Geometry mapping:
  // contentSide = sqrt(2) * (r - stroke/2) - 2*padding
  // Solve for r:
  // r = (contentSide + 2*padding)/sqrt(2) + stroke/2
  const safeSide = isFinite(side) && side > 0 ? side : Math.max(1, minHeightFromFont);
  const r = (safeSide + 2 * padding) / Math.SQRT2 + strokeWidth / 2;
  const resultRaw = Math.ceil(r);
  const result = isFinite(resultRaw) && resultRaw > 0 ? resultRaw : Math.max(1, Math.ceil((minHeightFromFont + 2 * padding) / Math.SQRT2 + strokeWidth / 2));
  
  console.log('[requiredRadiusForText] Final calculation:', {
    finalSide: side,
    padding,
    strokeWidth,
    rawRadius: r,
    finalRadius: result
  });
  
  return result;
}
