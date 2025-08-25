import { KonvaDirectRenderer } from './KonvaDirectRenderer';

let _directRenderer: KonvaDirectRenderer | null = null;

export function setDirectRenderer(renderer: KonvaDirectRenderer | null) {
  _directRenderer = renderer;
}

export function getDirectRenderer(): KonvaDirectRenderer | null {
  return _directRenderer;
}
