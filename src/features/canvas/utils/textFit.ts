import Konva from 'konva';

type FitOpts = {
  text: string;
  family: string;
  style?: string;
  side: number;           // square side inside the circle (after padding)
  min: number;
  max: number;
  lineHeight: number;
  wrapMode: 'scale' | 'wrap' | 'ellipsis';
};

const measureNode = new Konva.Text({
  x: 0,
  y: 0,
  listening: false,
  visible: false,
  align: 'center',
});

const cache = new Map<string, number>();

export function fitFontSizeToSquare(opts: FitOpts): number {
  const { text, family, style, side, min, max, lineHeight, wrapMode } = opts;
  const key = `${family}|${style}|${lineHeight}|${side}|${wrapMode}|${text}`;
  const cached = cache.get(key);
  if (cached) return cached;

  // base props (fontSize varies in loop)
  measureNode.fontFamily(family);
  measureNode.fontStyle(style ?? 'normal');
  measureNode.lineHeight(lineHeight);
  measureNode.align('center');
  measureNode.width(side);
  measureNode.height(side);

  let lo = Math.max(1, min);
  let hi = Math.max(lo, max);
  let best = lo;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    measureNode.fontSize(mid);

    if (wrapMode === 'scale') {
      (measureNode as any).wrap('none');
      measureNode.text(text);
      const fits = ((measureNode as any).getTextWidth?.() || 0) <= side && mid * lineHeight <= side;
      if (fits) { best = mid; lo = mid + 1; } else { hi = mid - 1; }
    } else {
      // wrap or ellipsis
      (measureNode as any).wrap('word');
      (measureNode as any).ellipsis?.(wrapMode === 'ellipsis');
      measureNode.text(text);
      const h = (measureNode as any).getTextHeight?.() || 0;
      const w = Math.min(side, (measureNode as any).getTextWidth?.() || 0);
      const fits = h <= side && w <= side;
      if (fits) { best = mid; lo = mid + 1; } else { hi = mid - 1; }
    }
  }

  cache.set(key, best);
  return best;
}

