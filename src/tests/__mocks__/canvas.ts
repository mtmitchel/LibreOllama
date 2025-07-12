/*
  Mock for the `canvas` package to allow Konva's node build to load in the Vitest environment.
  Provides minimal APIs used by Konva.
*/
const buildCtx = (): any => ({
  // Transformations
  scale: () => {}, rotate: () => {}, translate: () => {}, transform: () => {}, setTransform: () => {},
  // State
  save: () => {}, restore: () => {},
  // Paths
  beginPath: () => {}, closePath: () => {}, moveTo: () => {}, lineTo: () => {}, bezierCurveTo: () => {},
  quadraticCurveTo: () => {}, arc: () => {}, rect: () => {},
  // Drawing
  fill: () => {}, stroke: () => {}, clearRect: () => {}, drawImage: () => {},
  // Text
  measureText: () => ({ width: 0 }), fillText: () => {}, strokeText: () => {},
  // Clip / composite
  clip: () => {}, globalCompositeOperation: 'source-over',
  // Konva checks
  canvas: null,
});

// Canvas class is provided globally by vitest.hoisted.setup.ts
// Re-export it here for CommonJS consumers of `require('canvas').Canvas`
export const Canvas = (globalThis as any).Canvas;

export class Image {
  src: string = '';
  constructor() {}
}

export const createCanvas = (w: number, h: number) => {
  const el = document.createElement('canvas');
  el.width = w;
  el.height = h;

  const ctx = buildCtx();
  ctx.canvas = el;

  // Konva caches context on the canvas under several keys
  (el as any).getContext = () => ctx;
  (el as any).context = ctx;
  (el as any)._context = ctx;

  return el;
};

export const DOMMatrix = (globalThis as any).DOMMatrix || class {};

export default {
  Canvas,
  Image,
  createCanvas,
  DOMMatrix,
};

// Provide minimal Konva.Stage stub with `on` for tests that rely on direct Stage instance
import Konva from 'konva';
if (Konva && (Konva as any).Stage && !(Konva as any).Stage.prototype.on) {
  (Konva as any).Stage.prototype.on = () => {};
}
  if (Konva && (Konva as any).Stage) {
    const proto = (Konva as any).Stage.prototype;
    if (!proto.off) proto.off = () => {};
    if (!proto.destroy) proto.destroy = () => {};
  } 