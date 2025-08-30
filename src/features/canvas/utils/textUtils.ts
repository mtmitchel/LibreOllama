
export function measureText(text: string, fontSize: number, fontFamily: string): { width: number; height: number } {
  if (typeof document === 'undefined') {
    // Fallback for non-browser environments
    return { width: text.length * fontSize * 0.6, height: fontSize };
  }
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { width: text.length * fontSize * 0.6, height: fontSize };
  }
  ctx.font = `${fontSize}px ${fontFamily}`;
  const metrics = ctx.measureText(text);
  return { width: metrics.width, height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent };
}
