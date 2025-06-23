/**
 * Universal Canvas Mock for Vite, Vitest, and Tauri
 * A single, consolidated mock to prevent conflicts and ensure consistency.
 */

// Mock 2D Context with all necessary methods for Konva
const createMockContext2D = () => ({
  // Drawing rectangles
  fillRect: () => {},
  clearRect: () => {},
  strokeRect: () => {},

  // Drawing text
  fillText: () => {},
  strokeText: () => {},
  measureText: () => ({ width: 12, height: 12 }),

  // Line styles
  lineWidth: 1,
  lineCap: 'butt',
  lineJoin: 'miter',
  miterLimit: 10,

  // Colors and styles
  fillStyle: '#000000',
  strokeStyle: '#000000',
  globalAlpha: 1.0,
  globalCompositeOperation: 'source-over',

  // Gradients and patterns
  createLinearGradient: () => ({ addColorStop: () => {} }),
  createRadialGradient: () => ({ addColorStop: () => {} }),
  createPattern: () => ({}),

  // Paths
  beginPath: () => {},
  closePath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  quadraticCurveTo: () => {},
  bezierCurveTo: () => {},
  arc: () => {},
  arcTo: () => {},
  ellipse: () => {},
  rect: () => {},

  // Path drawing methods
  fill: () => {},
  stroke: () => {},
  clip: () => {},
  isPointInPath: () => false,
  isPointInStroke: () => false,

  // Transformations
  scale: () => {},
  rotate: () => {},
  translate: () => {},
  transform: () => {},
  setTransform: () => {},
  resetTransform: () => {},

  // State
  save: () => {},
  restore: () => {},

  // Image data
  createImageData: (width: number, height: number) => ({ data: new Uint8ClampedArray(width * height * 4), width, height }),
  getImageData: (_x: number, _y: number, width: number, height: number) => ({ data: new Uint8ClampedArray(width * height * 4), width, height }),
  putImageData: () => {},

  // Drawing images
  drawImage: () => {},

  // Line dash
  setLineDash: () => {},
  getLineDash: () => [],
  lineDashOffset: 0,

  // Text
  font: '10px sans-serif',
  textAlign: 'start',
  textBaseline: 'alphabetic',
  direction: 'inherit',

  // Shadows
  shadowBlur: 0,
  shadowColor: 'rgba(0, 0, 0, 0)',
  shadowOffsetX: 0,
  shadowOffsetY: 0,

  // Image smoothing
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'low',

  // Filters
  filter: 'none',
});

// Mock Canvas Element
const createMockCanvas = (width = 300, height = 150) => ({
  width,
  height,
  getContext: (contextType: string) => {
    if (contextType === '2d') {
      return createMockContext2D();
    }
    return null;
  },
  toDataURL: () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  toBuffer: () => Buffer.alloc(0),
  addEventListener: () => {},
  removeEventListener: () => {},
  style: {},
});

// Mock Image
const createMockImage = () => {
    const img: {
        width: number;
        height: number;
        naturalWidth: number;
        naturalHeight: number;
        complete: boolean;
        src: string;
        _src?: string;
        onload: (() => void) | null;
        onerror: (() => void) | null;
        addEventListener: (event: string, callback: () => void) => void;
        removeEventListener: () => void;
    } = {
        width: 0,
        height: 0,
        naturalWidth: 0,
        naturalHeight: 0,
        complete: true,
        src: '',
        onload: null,
        onerror: null,
        addEventListener: (event, callback) => {
            if (event === 'load') {
                img.onload = callback;
            }
        },
        removeEventListener: () => {},
    };
    // When src is set, simulate image loading
    Object.defineProperty(img, 'src', {
        set(value: string) {
            (img as any)._src = value;
            if (img.onload) {
                // Use timeout to simulate async loading
                setTimeout(img.onload, 5);
            }
        },
        get(): string {
            return (img as any)._src || '';
        }
    });
    return img;
};


// Main Canvas module exports
export const createCanvas = createMockCanvas;
export const Canvas = createMockCanvas;
export const Image = createMockImage;
export const createImageData = (width = 1, height = 1) => ({
  data: new Uint8ClampedArray(width * height * 4),
  width,
  height
});

export const loadImage = (src: string) => {
  return new Promise((resolve) => {
    const img = createMockImage();
    img.src = src;
    img.onload = () => resolve(img);
  });
};

export const registerFont = () => {};

// Default export for compatibility
export default {
  createCanvas,
  Canvas,
  Image,
  createImageData,
  loadImage,
  registerFont,
};
