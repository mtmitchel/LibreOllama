/**
 * Canvas Validation Test - Verify canvas functionality in Tauri WebView2
 * This test will help validate that the hardware acceleration fixes work
 */

import { describe, it, expect, beforeAll } from 'vitest';

describe('Canvas Hardware Acceleration Validation', () => {
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null;

  beforeAll(() => {
    // Create a real canvas element for testing
    canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    document.body.appendChild(canvas);
  });

  it('should create 2D canvas context successfully', () => {
    ctx = canvas.getContext('2d');
    expect(ctx).not.toBeNull();
    expect(ctx).toBeInstanceOf(CanvasRenderingContext2D);
  });

  it('should support basic drawing operations', () => {
    if (!ctx) throw new Error('Canvas context not available');
    
    // Test basic drawing operations
    ctx.fillStyle = 'red';
    ctx.fillRect(10, 10, 50, 50);
    
    // Verify pixel data can be read (indicates proper context)
    const imageData = ctx.getImageData(25, 25, 1, 1);
    expect(imageData.data.length).toBe(4); // RGBA
    expect(imageData.data[0]).toBeGreaterThan(200); // Red channel should be high
  });
  it('should support canvas transformations', () => {
    if (!ctx) throw new Error('Canvas context not available');
    
    ctx.save();
    ctx.scale(2, 2);
    ctx.translate(10, 10);
    ctx.rotate(Math.PI / 4);
    
    // These operations should not throw errors
    expect(() => {
      ctx!.fillRect(0, 0, 10, 10);
    }).not.toThrow();
    
    ctx.restore();
  });

  it('should detect WebGL support (indicates GPU acceleration)', () => {
    const webglCtx = canvas.getContext('webgl') as WebGLRenderingContext | null;
    
    // In WebView2 with hardware acceleration, WebGL should be available
    expect(webglCtx).not.toBeNull();
    
    if (webglCtx) {
      const renderer = webglCtx.getParameter(webglCtx.RENDERER);
      console.log('WebGL Renderer:', renderer);
      
      // Should not be a software renderer if hardware acceleration is working
      expect(renderer).not.toMatch(/software|swiftshader/i);
    }
  });

  it('should support toDataURL for image export', () => {
    if (!ctx) throw new Error('Canvas context not available');
    
    // Draw something
    ctx.fillStyle = 'blue';
    ctx.fillRect(0, 0, 100, 100);
    
    // Export to data URL - this can fail with tainted canvas errors
    expect(() => {
      const dataUrl = canvas.toDataURL();
      expect(dataUrl).toMatch(/^data:image\/png;base64,/);
    }).not.toThrow();
  });
});

describe('Konva Integration Validation', () => {
  it('should import Konva without errors', async () => {
    const Konva = await import('konva');
    
    expect(Konva.default).toBeDefined();
    expect(Konva.default.Stage).toBeDefined();
    expect(Konva.default.Layer).toBeDefined();
    expect(Konva.default.Rect).toBeDefined();
  });

  it('should import React-Konva without errors', async () => {
    const ReactKonva = await import('react-konva');
    
    expect(ReactKonva.Stage).toBeDefined();
    expect(ReactKonva.Layer).toBeDefined();
    expect(ReactKonva.Rect).toBeDefined();
  });

  it('should create Konva stage without canvas module conflicts', async () => {
    const Konva = await import('konva');
    
    // This should not trigger Node.js canvas module loading
    expect(() => {
      const stage = new Konva.default.Stage({
        container: document.createElement('div'),
        width: 200,
        height: 200,
      });
      expect(stage).toBeDefined();
      stage.destroy();
    }).not.toThrow();
  });
});
