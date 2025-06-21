/**
 * Comprehensive Canvas mock for Vitest
 * Prevents native canvas module loading issues in Windows/binary compatibility
 */

// Mock 2D context with all common canvas methods
const mockContext2D = {
  fillRect: () => {},
  clearRect: () => {},
  getImageData: () => ({ data: new Array(4) }),
  putImageData: () => {},
  createImageData: () => new Array(4),
  setTransform: () => {},
  drawImage: () => {},
  save: () => {},
  fillText: () => {},
  restore: () => {},
  beginPath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  closePath: () => {},
  stroke: () => {},
  translate: () => {},
  scale: () => {},
  rotate: () => {},
  arc: () => {},
  fill: () => {},
  measureText: () => ({ width: 0 }),
  transform: () => {},
  rect: () => {},
  clip: () => {},
  strokeText: () => {},
  createLinearGradient: () => ({
    addColorStop: () => {}
  }),
  createRadialGradient: () => ({
    addColorStop: () => {}
  }),
  setLineDash: () => {},
  getLineDash: () => [],
  isPointInPath: () => false,
  isPointInStroke: () => false,
};

// Mock Canvas constructor function
const MockCanvas = function(width = 800, height = 600) {
  return {
    getContext: (contextType) => {
      if (contextType === '2d') return mockContext2D;
      return null;
    },
    toDataURL: () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    width: width,
    height: height,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
};

// Mock Image constructor
const MockImage = function() {
  return {
    addEventListener: () => {},
    removeEventListener: () => {},
    width: 0,
    height: 0,
    src: '',
    onload: null,
    onerror: null,
    naturalWidth: 0,
    naturalHeight: 0,
    complete: true,
  };
};

// Export comprehensive mocks
module.exports = {
  Canvas: MockCanvas,
  Image: MockImage,
  createCanvas: MockCanvas,
  createImageData: () => new Uint8ClampedArray(4),
  loadImage: () => Promise.resolve(new MockImage()),
  registerFont: () => {},
  // For canvas/lib-extra
  default: MockCanvas,
  // Additional canvas utilities
  parseFont: () => ({}),
  createImageBitmap: () => Promise.resolve({}),
};
