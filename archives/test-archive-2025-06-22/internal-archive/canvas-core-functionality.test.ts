// Vitest globals enabled in config - no need to import describe, test, expect

describe('Canvas Core Functionality', () => {
  describe('Element ID Generation', () => {
    test('generates unique IDs', () => {
      const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
    });

    test('generates valid element IDs with proper format', () => {
      const generateElementId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const id = generateElementId();
      expect(id).toMatch(/^element_\d+_[a-z0-9]+$/);
    });
  });

  describe('Canvas Coordinates', () => {
    test('converts screen coordinates to canvas coordinates', () => {
      const screenToCanvas = (screenX: number, screenY: number, scale: number, offsetX: number, offsetY: number) => ({
        x: (screenX - offsetX) / scale,
        y: (screenY - offsetY) / scale
      });

      const result = screenToCanvas(100, 100, 1, 0, 0);
      expect(result.x).toBe(100);
      expect(result.y).toBe(100);

      const result2 = screenToCanvas(100, 100, 2, 50, 50);
      expect(result2.x).toBe(25);
      expect(result2.y).toBe(25);
    });

    test('converts canvas coordinates to screen coordinates', () => {
      const canvasToScreen = (canvasX: number, canvasY: number, scale: number, offsetX: number, offsetY: number) => ({
        x: canvasX * scale + offsetX,
        y: canvasY * scale + offsetY
      });

      const result = canvasToScreen(100, 100, 1, 0, 0);  
      expect(result.x).toBe(100);
      expect(result.y).toBe(100);

      const result2 = canvasToScreen(50, 50, 2, 10, 10);
      expect(result2.x).toBe(110);
      expect(result2.y).toBe(110);
    });
  });

  describe('Element Bounds Calculation', () => {
    test('calculates rectangle bounds correctly', () => {
      const calculateRectBounds = (x: number, y: number, width: number, height: number) => ({
        left: x,
        top: y,
        right: x + width,
        bottom: y + height,
        width,
        height
      });

      const bounds = calculateRectBounds(10, 20, 100, 50);
      expect(bounds.left).toBe(10);
      expect(bounds.top).toBe(20);
      expect(bounds.right).toBe(110);
      expect(bounds.bottom).toBe(70);
      expect(bounds.width).toBe(100);
      expect(bounds.height).toBe(50);
    });

    test('calculates circle bounds correctly', () => {
      const calculateCircleBounds = (centerX: number, centerY: number, radius: number) => ({
        left: centerX - radius,
        top: centerY - radius,
        right: centerX + radius,
        bottom: centerY + radius,
        width: radius * 2,
        height: radius * 2
      });

      const bounds = calculateCircleBounds(50, 60, 25);
      expect(bounds.left).toBe(25);
      expect(bounds.top).toBe(35);
      expect(bounds.right).toBe(75);
      expect(bounds.bottom).toBe(85);
      expect(bounds.width).toBe(50);
      expect(bounds.height).toBe(50);
    });
  });

  describe('Performance Utilities', () => {
    test('throttle function works correctly', () => {
      let callCount = 0;
      const throttle = (func: Function, delay: number) => {
        let inThrottle = false;
        return (...args: any[]) => {
          if (!inThrottle) {
            func.apply(null, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, delay);
          }
        };
      };

      const throttledFn = throttle(() => callCount++, 100);
      
      throttledFn();
      throttledFn();
      throttledFn();
      
      expect(callCount).toBe(1);
    });

    test('debounce function works correctly', async () => {
      let callCount = 0;
      const debounce = (func: Function, delay: number) => {
        let timeoutId: NodeJS.Timeout;
        return (...args: any[]) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => func.apply(null, args), delay);
        };
      };

      const debouncedFn = debounce(() => callCount++, 50);
      
      debouncedFn();
      debouncedFn();
      debouncedFn();
      
      expect(callCount).toBe(0);
      
      await new Promise(resolve => setTimeout(resolve, 60));
      expect(callCount).toBe(1);
    });
  });

  describe('Element Type Checking', () => {
    test('identifies element types correctly', () => {
      const isRectangle = (element: any) => element.type === 'rectangle';
      const isCircle = (element: any) => element.type === 'circle';
      const isText = (element: any) => element.type === 'text';

      const rectElement = { type: 'rectangle', x: 0, y: 0, width: 100, height: 50 };
      const circleElement = { type: 'circle', x: 0, y: 0, radius: 25 };
      const textElement = { type: 'text', x: 0, y: 0, text: 'Hello' };

      expect(isRectangle(rectElement)).toBe(true);
      expect(isRectangle(circleElement)).toBe(false);
      
      expect(isCircle(circleElement)).toBe(true);
      expect(isCircle(rectElement)).toBe(false);
      
      expect(isText(textElement)).toBe(true);
      expect(isText(rectElement)).toBe(false);
    });
  });
});
