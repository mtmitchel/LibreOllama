import Konva from 'konva';

// Convert screen pointer to content coordinates accounting for stage pan/zoom
export function getContentPointer(stage: Konva.Stage | null): { x: number; y: number } | null {
  if (!stage) return null;
  const p = stage.getPointerPosition();
  if (!p) return null;
  const scaleX = stage.scaleX() || 1;
  const scaleY = stage.scaleY() || 1;
  const x = (p.x - stage.x()) / scaleX;
  const y = (p.y - stage.y()) / scaleY;
  return { x, y };
}
