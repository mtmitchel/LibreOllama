import { vi } from 'vitest'

// Hoist all canvas-related mocks BEFORE any imports happen
vi.hoisted(() => {
  // Mock the canvas module completely
  vi.mock('canvas', () => ({
    createCanvas: vi.fn(() => ({
      getContext: vi.fn(() => ({
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        fillText: vi.fn(),
        strokeText: vi.fn(),
        measureText: vi.fn(() => ({ width: 0 })),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        scale: vi.fn(),
        transform: vi.fn(),
        setTransform: vi.fn(),
        resetTransform: vi.fn(),
        createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        createPattern: vi.fn(),
        putImageData: vi.fn(),
        getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 })),
        drawImage: vi.fn(),
        beginPath: vi.fn(),
        closePath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        bezierCurveTo: vi.fn(),
        quadraticCurveTo: vi.fn(),
        arc: vi.fn(),
        arcTo: vi.fn(),
        ellipse: vi.fn(),
        rect: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        clip: vi.fn(),
        isPointInPath: vi.fn(() => false),
        isPointInStroke: vi.fn(() => false),
        canvas: {
          width: 800,
          height: 600,
          toDataURL: vi.fn(() => 'data:image/png;base64,'),
          toBuffer: vi.fn(() => Buffer.alloc(0))
        }
      })),
      width: 800,
      height: 600,
      toDataURL: vi.fn(() => 'data:image/png;base64,'),
      toBuffer: vi.fn(() => Buffer.alloc(0))
    })),
    Canvas: vi.fn(),
    CanvasRenderingContext2D: vi.fn(),
    Image: vi.fn(() => ({
      onload: null,
      onerror: null,
      src: '',
      width: 0,
      height: 0
    })),
    ImageData: vi.fn(),
    loadImage: vi.fn(() => Promise.resolve({
      width: 100,
      height: 100,
      src: 'mock-image'
    })),
    registerFont: vi.fn(),
    deregisterAllFonts: vi.fn(),
    parseFont: vi.fn(() => ({})),
    default: {
      createCanvas: vi.fn(() => ({
        getContext: vi.fn(() => ({})),
        width: 800,
        height: 600
      }))
    }
  }))
  // Mock canvas native bindings
  vi.mock('canvas/lib/bindings', () => ({}))
  vi.mock('canvas/lib-extra', () => ({}))
  vi.mock('canvas/build/Release/canvas.node', () => ({}))
})

// Set up canvas mock for JSDOM
Object.defineProperty(window, 'HTMLCanvasElement', {
  value: class HTMLCanvasElement {
    getContext() {
      return {
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        fillText: vi.fn(),
        strokeText: vi.fn(),
        measureText: vi.fn(() => ({ width: 0 })),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        scale: vi.fn(),
        transform: vi.fn(),
        setTransform: vi.fn(),
        resetTransform: vi.fn(),
        createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        createPattern: vi.fn(),
        putImageData: vi.fn(),
        getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 })),
        drawImage: vi.fn(),
        beginPath: vi.fn(),
        closePath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        bezierCurveTo: vi.fn(),
        quadraticCurveTo: vi.fn(),
        arc: vi.fn(),
        arcTo: vi.fn(),
        ellipse: vi.fn(),
        rect: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        clip: vi.fn(),
        isPointInPath: vi.fn(() => false),
        isPointInStroke: vi.fn(() => false),
        canvas: {
          width: 800,
          height: 600,
          toDataURL: vi.fn(() => 'data:image/png;base64,')
        }
      }
    }
    
    toDataURL() {
      return 'data:image/png;base64,'
    }
    
    width = 800
    height = 600
  }
})

console.log('✅ Hoisted canvas mocks loaded')
