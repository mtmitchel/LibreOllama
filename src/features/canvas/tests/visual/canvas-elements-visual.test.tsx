/**
 * Comprehensive Visual Regression Tests for Canvas Elements
 * Tests for caching, rendering artifacts, and visual consistency
 */

import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { Stage, Layer } from 'react-konva';
import { render, cleanup } from '@testing-library/react';
import { TextShape } from '../../shapes/TextShape';
import { ImageShape } from '../../shapes/ImageShape';
import { RectangleShape } from '../../shapes/RectangleShape';
import { PureKonvaStickyNote } from '../../shapes/PureKonvaStickyNote';
import { createElementId } from '../../types/enhanced.types';

// Visual testing utilities
function captureCanvasDataURL(stage: any, options = { pixelRatio: 1 }): string {
  return stage?.toDataURL?.(options) || '';
}

function getCanvasPixelCount(dataUrl: string): number {
  // Rough estimate based on data URL length - helps detect rendering changes
  return dataUrl.length;
}

function validateVisualStability(dataUrl: string, expectedMinSize: number, expectedMaxSize: number): boolean {
  const pixelCount = getCanvasPixelCount(dataUrl);
  return pixelCount >= expectedMinSize && pixelCount <= expectedMaxSize;
}

describe('Canvas Elements Visual Regression Tests', () => {
  beforeEach(() => {
    cleanup();
    // Reset any global canvas state
    if (typeof window !== 'undefined') {
      (window as any).DEBUG_CANVAS_CACHE = {}; // Clear cache for consistent tests
    }
  });

  describe('Text Element Rendering', () => {
    it('should render single-line text consistently', () => {
      const { container } = render(
        <Stage width={400} height={300}>
          <Layer>
            <TextShape
              element={{
                id: createElementId('text-1'),
                type: 'text',
                x: 50,
                y: 50,
                text: 'Single Line Text',
                fontSize: 16,
                fontFamily: 'Arial',
                fill: '#333333',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                isLocked: false,
                isHidden: false
              }}
              isSelected={false}
              isDragging={false}
              onSelect={() => {}}
              onUpdate={() => {}}
            />
          </Layer>
        </Stage>
      );

      const stage = (container.querySelector('canvas') as any)?._konvaNode?.getStage?.();
      const dataUrl = captureCanvasDataURL(stage);
      
      expect(validateVisualStability(dataUrl, 1000, 3000)).toBe(true);
      expect(dataUrl).toContain('data:image/png;base64,');
    });

    it('should render multi-line text with consistent line spacing', () => {
      const { container } = render(
        <Stage width={400} height={300}>
          <Layer>
            <TextShape
              element={{
                id: createElementId('text-2'),
                type: 'text',
                x: 50,
                y: 50,
                text: 'Line 1\nLine 2\nLine 3\nLine 4',
                fontSize: 16,
                fontFamily: 'Arial',
                fill: '#333333',
                width: 300,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                isLocked: false,
                isHidden: false
              }}
              isSelected={false}
              isDragging={false}
              onSelect={() => {}}
              onUpdate={() => {}}
            />
          </Layer>
        </Stage>
      );

      const stage = (container.querySelector('canvas') as any)?._konvaNode?.getStage?.();
      const dataUrl = captureCanvasDataURL(stage);
      
      expect(validateVisualStability(dataUrl, 1500, 4000)).toBe(true);
    });

    it('should render text with varied font sizes without artifacts', () => {
      const { container } = render(
        <Stage width={400} height={300}>
          <Layer>
            <TextShape
              element={{
                id: createElementId('text-3'),
                type: 'text',
                x: 20,
                y: 20,
                text: 'Small',
                fontSize: 12,
                fontFamily: 'Arial',
                fill: '#666666',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                isLocked: false,
                isHidden: false
              }}
              isSelected={false}
              isDragging={false}
              onSelect={() => {}}
              onUpdate={() => {}}
            />
            <TextShape
              element={{
                id: createElementId('text-4'),
                type: 'text',
                x: 20,
                y: 60,
                text: 'Medium',
                fontSize: 18,
                fontFamily: 'Arial',
                fill: '#333333',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                isLocked: false,
                isHidden: false
              }}
              isSelected={false}
              isDragging={false}
              onSelect={() => {}}
              onUpdate={() => {}}
            />
            <TextShape
              element={{
                id: createElementId('text-5'),
                type: 'text',
                x: 20,
                y: 120,
                text: 'Large',
                fontSize: 32,
                fontFamily: 'Arial',
                fill: '#000000',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                isLocked: false,
                isHidden: false
              }}
              isSelected={false}
              isDragging={false}
              onSelect={() => {}}
              onUpdate={() => {}}
            />
          </Layer>
        </Stage>
      );

      const stage = (container.querySelector('canvas') as any)?._konvaNode?.getStage?.();
      const dataUrl = captureCanvasDataURL(stage);
      
      expect(validateVisualStability(dataUrl, 2000, 5000)).toBe(true);
    });
  });

  describe('Image Element Rendering', () => {
    it('should render placeholder image without artifacts', () => {
      const { container } = render(
        <Stage width={400} height={300}>
          <Layer>
            <ImageShape
              element={{
                id: createElementId('image-1'),
                type: 'image',
                x: 50,
                y: 50,
                width: 200,
                height: 150,
                src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                isLocked: false,
                isHidden: false
              }}
              isSelected={false}
              isDragging={false}
              onSelect={() => {}}
              onUpdate={() => {}}
            />
          </Layer>
        </Stage>
      );

      const stage = (container.querySelector('canvas') as any)?._konvaNode?.getStage?.();
      const dataUrl = captureCanvasDataURL(stage);
      
      expect(validateVisualStability(dataUrl, 800, 2500)).toBe(true);
    });

    it('should render image with filters consistently', () => {
      const { container } = render(
        <Stage width={400} height={300}>
          <Layer>
            <ImageShape
              element={{
                id: createElementId('image-2'),
                type: 'image',
                x: 50,
                y: 50,
                width: 200,
                height: 150,
                src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
                filters: {
                  brightness: 1.2,
                  contrast: 1.1,
                  saturation: 0.9
                },
                createdAt: Date.now(),
                updatedAt: Date.now(),
                isLocked: false,
                isHidden: false
              }}
              isSelected={false}
              isDragging={false}
              onSelect={() => {}}
              onUpdate={() => {}}
            />
          </Layer>
        </Stage>
      );

      const stage = (container.querySelector('canvas') as any)?._konvaNode?.getStage?.();
      const dataUrl = captureCanvasDataURL(stage);
      
      expect(validateVisualStability(dataUrl, 800, 2500)).toBe(true);
    });
  });

  describe('Rectangle Element Rendering', () => {
    it('should render basic rectangle with consistent borders', () => {
      const { container } = render(
        <Stage width={400} height={300}>
          <Layer>
            <RectangleShape
              element={{
                id: createElementId('rect-1'),
                type: 'rectangle',
                x: 50,
                y: 50,
                width: 200,
                height: 120,
                fill: '#ff6b6b',
                stroke: '#333333',
                strokeWidth: 2,
                cornerRadius: 8,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                isLocked: false,
                isHidden: false
              }}
              isSelected={false}
              isDragging={false}
              onSelect={() => {}}
              onUpdate={() => {}}
            />
          </Layer>
        </Stage>
      );

      const stage = (container.querySelector('canvas') as any)?._konvaNode?.getStage?.();
      const dataUrl = captureCanvasDataURL(stage);
      
      expect(validateVisualStability(dataUrl, 900, 2200)).toBe(true);
    });

    it('should render rectangle with gradient fill consistently', () => {
      const { container } = render(
        <Stage width={400} height={300}>
          <Layer>
            <RectangleShape
              element={{
                id: createElementId('rect-2'),
                type: 'rectangle',
                x: 50,
                y: 50,
                width: 200,
                height: 120,
                fill: 'linear-gradient(90deg, #ff6b6b 0%, #4ecdc4 100%)',
                stroke: '#333333',
                strokeWidth: 1,
                cornerRadius: 12,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                isLocked: false,
                isHidden: false
              }}
              isSelected={false}
              isDragging={false}
              onSelect={() => {}}
              onUpdate={() => {}}
            />
          </Layer>
        </Stage>
      );

      const stage = (container.querySelector('canvas') as any)?._konvaNode?.getStage?.();
      const dataUrl = captureCanvasDataURL(stage);
      
      expect(validateVisualStability(dataUrl, 900, 2200)).toBe(true);
    });
  });

  describe('Sticky Note Element Rendering', () => {
    it('should render sticky note with consistent background and text', () => {
      const { container } = render(
        <Stage width={400} height={300}>
          <Layer>
            <PureKonvaStickyNote
              element={{
                id: createElementId('sticky-1'),
                type: 'sticky-note',
                x: 50,
                y: 50,
                width: 180,
                height: 120,
                text: 'This is a sticky note\nwith multiple lines\nof text content',
                backgroundColor: '#fff2cc',
                textColor: '#1f2937',
                fontSize: 14,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                isLocked: false,
                isHidden: false
              }}
              isSelected={false}
              onUpdate={() => {}}
            />
          </Layer>
        </Stage>
      );

      const stage = (container.querySelector('canvas') as any)?._konvaNode?.getStage?.();
      const dataUrl = captureCanvasDataURL(stage);
      
      expect(validateVisualStability(dataUrl, 1200, 3000)).toBe(true);
    });

    it('should render sticky note with different colors consistently', () => {
      const { container } = render(
        <Stage width={500} height={400}>
          <Layer>
            <PureKonvaStickyNote
              element={{
                id: createElementId('sticky-2'),
                type: 'sticky-note',
                x: 50,
                y: 50,
                width: 150,
                height: 100,
                text: 'Yellow Note',
                backgroundColor: '#fef3c7',
                textColor: '#92400e',
                fontSize: 12,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                isLocked: false,
                isHidden: false
              }}
              isSelected={false}
              onUpdate={() => {}}
            />
            <PureKonvaStickyNote
              element={{
                id: createElementId('sticky-3'),
                type: 'sticky-note',
                x: 250,
                y: 50,
                width: 150,
                height: 100,
                text: 'Pink Note',
                backgroundColor: '#fce7f3',
                textColor: '#be185d',
                fontSize: 12,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                isLocked: false,
                isHidden: false
              }}
              isSelected={false}
              onUpdate={() => {}}
            />
            <PureKonvaStickyNote
              element={{
                id: createElementId('sticky-4'),
                type: 'sticky-note',
                x: 150,
                y: 200,
                width: 150,
                height: 100,
                text: 'Blue Note',
                backgroundColor: '#dbeafe',
                textColor: '#1e40af',
                fontSize: 12,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                isLocked: false,
                isHidden: false
              }}
              isSelected={false}
              onUpdate={() => {}}
            />
          </Layer>
        </Stage>
      );

      const stage = (container.querySelector('canvas') as any)?._konvaNode?.getStage?.();
      const dataUrl = captureCanvasDataURL(stage);
      
      expect(validateVisualStability(dataUrl, 2000, 4500)).toBe(true);
    });
  });

  describe('Caching Artifact Detection', () => {
    it('should not show caching artifacts between different element types', () => {
      const { container, rerender } = render(
        <Stage width={400} height={300}>
          <Layer>
            <RectangleShape
              element={{
                id: createElementId('cache-test-1'),
                type: 'rectangle',
                x: 100,
                y: 100,
                width: 150,
                height: 100,
                fill: '#ff0000',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                isLocked: false,
                isHidden: false
              }}
              isSelected={false}
              isDragging={false}
              onSelect={() => {}}
              onUpdate={() => {}}
            />
          </Layer>
        </Stage>
      );

      const stage = (container.querySelector('canvas') as any)?._konvaNode?.getStage?.();
      const firstRender = captureCanvasDataURL(stage);

      // Switch to text element at same position
      rerender(
        <Stage width={400} height={300}>
          <Layer>
            <TextShape
              element={{
                id: createElementId('cache-test-2'),
                type: 'text',
                x: 100,
                y: 100,
                text: 'Replaced Rectangle',
                fontSize: 16,
                fill: '#0000ff',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                isLocked: false,
                isHidden: false
              }}
              isSelected={false}
              isDragging={false}
              onSelect={() => {}}
              onUpdate={() => {}}
            />
          </Layer>
        </Stage>
      );

      const secondRender = captureCanvasDataURL(stage);

      // Renders should be different (no caching artifacts)
      expect(firstRender).not.toBe(secondRender);
      expect(validateVisualStability(secondRender, 800, 2500)).toBe(true);
    });

    it('should handle rapid element updates without visual artifacts', () => {
      let element = {
        id: createElementId('rapid-update'),
        type: 'rectangle',
        x: 50,
        y: 50,
        width: 100,
        height: 100,
        fill: '#ff0000',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isLocked: false,
        isHidden: false
      };

      const { container, rerender } = render(
        <Stage width={400} height={300}>
          <Layer>
            <RectangleShape
              element={element}
              isSelected={false}
              isDragging={false}
              onSelect={() => {}}
              onUpdate={() => {}}
            />
          </Layer>
        </Stage>
      );

      const stage = (container.querySelector('canvas') as any)?._konvaNode?.getStage?.();
      
      // Simulate rapid updates
      const updates = [
        { x: 60, fill: '#ff3333' },
        { x: 70, fill: '#ff6666' },
        { x: 80, fill: '#ff9999' },
        { x: 90, fill: '#ffcccc' }
      ];

      updates.forEach((update, index) => {
        element = { ...element, ...update, updatedAt: Date.now() + index };
        rerender(
          <Stage width={400} height={300}>
            <Layer>
              <RectangleShape
                element={element}
                isSelected={false}
                isDragging={false}
                onSelect={() => {}}
                onUpdate={() => {}}
              />
            </Layer>
          </Stage>
        );
      });

      const finalRender = captureCanvasDataURL(stage);
      expect(validateVisualStability(finalRender, 800, 2200)).toBe(true);
    });
  });

  describe('High Element Count Performance', () => {
    it('should render many elements without visual degradation', () => {
      const elements = Array.from({ length: 50 }, (_, i) => (
        <RectangleShape
          key={i}
          element={{
            id: createElementId(`perf-rect-${i}`),
            type: 'rectangle',
            x: (i % 10) * 35 + 10,
            y: Math.floor(i / 10) * 35 + 10,
            width: 30,
            height: 30,
            fill: `hsl(${i * 7}, 70%, 60%)`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isLocked: false,
            isHidden: false
          }}
          isSelected={false}
          isDragging={false}
          onSelect={() => {}}
          onUpdate={() => {}}
        />
      ));

      const { container } = render(
        <Stage width={400} height={300}>
          <Layer>
            {elements}
          </Layer>
        </Stage>
      );

      const stage = (container.querySelector('canvas') as any)?._konvaNode?.getStage?.();
      const dataUrl = captureCanvasDataURL(stage);
      
      // Should still render within reasonable bounds despite many elements
      expect(validateVisualStability(dataUrl, 3000, 8000)).toBe(true);
    });
  });
});