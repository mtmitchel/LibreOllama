/*
  CommonJS stub for the `canvas` package to allow Konva’s node build to load in Vitest.
  Provides just the minimal APIs that Konva expects.
*/
const buildCtx = () => ({
  // Transformations
  scale() {}, rotate() {}, translate() {}, transform() {}, setTransform() {},
  // State
  save() {}, restore() {},
  // Paths
  beginPath() {}, closePath() {}, moveTo() {}, lineTo() {}, bezierCurveTo() {}, quadraticCurveTo() {}, arc() {}, rect() {},
  // Drawing
  fill() {}, stroke() {}, clearRect() {}, drawImage() {},
  // Text
  measureText() { return { width: 0 }; }, fillText() {}, strokeText() {},
  // Clip / composite
  clip() {}, globalCompositeOperation: 'source-over',
  // Konva checks
  canvas: null,
});

const Canvas = globalThis.Canvas;

class Image {
  constructor() {
    this.src = '';
  }
}

function createCanvas(w = 0, h = 0) {
  const el = typeof document !== 'undefined' ? document.createElement('canvas') : {};
  el.width = w;
  el.height = h;

  const ctx = buildCtx();
  ctx.canvas = el;

  // Konva caches context on the canvas under these keys
  el.getContext = () => ctx;
  el.context = ctx;
  el._context = ctx;

  return el;
}

const DOMMatrix = globalThis.DOMMatrix || class {};

const stub = {
  Canvas,
  Image,
  createCanvas,
  DOMMatrix,
};

// Attempt to patch Konva.Stage prototype with no-op handlers when Konva is available
try {
  const Konva = require('konva');
  if (Konva && Konva.Stage) {
    const proto = Konva.Stage.prototype;
    if (!proto.on) proto.on = () => {};
    if (!proto.off) proto.off = () => {};
    if (!proto.destroy) proto.destroy = () => {};
  }
} catch (_) {
  // Ignore – Konva may not be loaded yet or circular require in progress
}

module.exports = Object.assign({}, stub, { default: stub }); 