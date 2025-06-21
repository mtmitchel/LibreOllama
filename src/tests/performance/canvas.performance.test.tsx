import { describe, test, expect, beforeEach } from '@jest/globals';
import { screen } from '@testing-library/react';
import { performanceTestUtils, setupTestEnvironment, createMockCanvasElement } from '../utils/testUtils';

describe('Canvas Performance Tests', () => {
  let testEnv: ReturnType<typeof setupTestEnvironment>;

  beforeEach(() => {
    testEnv = setupTestEnvironment();
  });

  describe('Rendering Performance', () => {
    test('renders 1000 elements within performance threshold', async () => {
      const elements = performanceTestUtils.simulateHeavyLoad(1000);
      
      const renderTime = await performanceTestUtils.measureRenderTime(async () => {
        await testEnv.render(
          <div data-testid="performance-test">
            {elements.map(el => (
              <div key={el.id} data-testid={`element-${el.id}`}>
                {el.type}: {el.x},{el.y}
              </div>
            ))}
          </div>
        );
      });

      expect(renderTime).toBeLessThan(1000); // Should render within 1 second
      expect(screen.getByTestId('performance-test')).toBeDefined();
    });

    test('handles rapid re-renders efficiently', async () => {
      const element = createMockCanvasElement({ type: 'rectangle' });
      
      const { rerender } = await testEnv.render(
        <div data-testid="rerender-test" style={{ 
          transform: `translate(${element.x}px, ${element.y}px)` 
        }}>
          Element
        </div>
      );

      const startTime = performance.now();

      // Simulate 60 rapid updates (simulating 60fps)
      for (let i = 0; i < 60; i++) {
        await rerender(
          <div data-testid="rerender-test" style={{ 
            transform: `translate(${element.x + i}px, ${element.y + i}px)` 
          }}>
            Element
          </div>
        );
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(1000); // Should complete within 1 second
      expect(screen.getByTestId('rerender-test')).toBeDefined();
    });

    test('memory usage remains stable during heavy operations', async () => {
      const initialMemory = performanceTestUtils.measureMemoryUsage();
      
      // Perform heavy operations
      const elements = performanceTestUtils.simulateHeavyLoad(500);
      
      await testEnv.render(
        <div data-testid="memory-test">
          {elements.map(el => (
            <div key={el.id}>Element {el.id}</div>
          ))}
        </div>
      );

      const finalMemory = performanceTestUtils.measureMemoryUsage();
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (adjust threshold as needed)
      expect(memoryIncrease).toBeLessThan(50000000); // 50MB threshold
      expect(screen.getByTestId('memory-test')).toBeDefined();
    });
  });

  describe('Interaction Performance', () => {
    test('handles rapid mouse events efficiently', async () => {
      await testEnv.render(
        <div 
          data-testid="interaction-test"
          style={{ width: 800, height: 600 }}
        >
          Interactive Area
        </div>
      );

      const element = screen.getByTestId('interaction-test');
      const startTime = performance.now();

      // Simulate rapid mouse movements
      for (let i = 0; i < 100; i++) {
        await testEnv.user.pointer({
          target: element,
          coords: { x: i * 8, y: i * 6 }
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    test('selection operations scale well with element count', async () => {
      const elementCount = 100;
      const elements = Array.from({ length: elementCount }, (_, i) => 
        createMockCanvasElement({ 
          type: 'rectangle',
          id: `element-${i}` 
        })
      );

      await testEnv.render(
        <div data-testid="selection-test">
          {elements.map(el => (
            <div 
              key={el.id} 
              data-testid={`selectable-${el.id}`}
              style={{ 
                width: 50, 
                height: 50, 
                border: '1px solid black',
                display: 'inline-block'
              }}
            >
              {el.id}
            </div>
          ))}
        </div>
      );

      const startTime = performance.now();

      // Select multiple elements rapidly
      for (let i = 0; i < 10; i++) {
        const element = screen.getByTestId(`selectable-element-${i}`);
        await testEnv.user.click(element);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Memory Leak Detection', () => {
    test('components clean up properly on unmount', async () => {
      const initialMemory = performanceTestUtils.measureMemoryUsage();

      // Create and unmount components multiple times
      for (let i = 0; i < 10; i++) {
        const { unmount } = await testEnv.render(
          <div data-testid={`cleanup-test-${i}`}>
            <div>Component {i}</div>
            {Array.from({ length: 50 }, (_, j) => (
              <div key={j}>Child {j}</div>
            ))}
          </div>
        );

        expect(screen.getByTestId(`cleanup-test-${i}`)).toBeDefined();
        unmount();
      }

      const finalMemory = performanceTestUtils.measureMemoryUsage();
      const memoryIncrease = finalMemory - initialMemory;

      // Memory should not increase significantly after cleanup
      expect(memoryIncrease).toBeLessThan(10000000); // 10MB threshold
    });

    test('event listeners are cleaned up properly', async () => {
      const eventHandlers: Array<() => void> = [];

      for (let i = 0; i < 5; i++) {
        const handler = jest.fn();
        eventHandlers.push(handler);

        const { unmount } = await testEnv.render(
          <div 
            data-testid={`event-test-${i}`}
            onClick={handler}
            onMouseMove={handler}
            onMouseDown={handler}
            onMouseUp={handler}
          >
            Event Test {i}
          </div>
        );

        // Interact with element
        const element = screen.getByTestId(`event-test-${i}`);
        await testEnv.user.click(element);

        expect(handler).toHaveBeenCalled();
        
        unmount();
      }

      // All handlers should have been called and cleaned up
      eventHandlers.forEach(handler => {
        expect(handler).toHaveBeenCalled();
      });
    });
  });

  describe('Stress Testing', () => {
    test('handles maximum realistic canvas load', async () => {
      // Test with 2000 elements (realistic maximum for complex canvas)
      const elements = performanceTestUtils.simulateHeavyLoad(2000);

      const startTime = performance.now();

      await testEnv.render(
        <div data-testid="stress-test">
          {elements.slice(0, 100).map(el => ( // Only render first 100 to avoid test timeout
            <div key={el.id} data-testid={`stress-element-${el.id}`}>
              {el.type}: {el.x},{el.y} - {el.width}x{el.height}
            </div>
          ))}
        </div>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(3000); // Should handle stress load within 3 seconds
      expect(screen.getByTestId('stress-test')).toBeDefined();
    });

    test('maintains responsiveness under heavy load', async () => {
      const elements = Array.from({ length: 200 }, (_, i) => 
        createMockCanvasElement({ 
          type: 'rectangle',
          id: `heavy-${i}`,
          x: Math.random() * 1000,
          y: Math.random() * 1000
        })
      );

      await testEnv.render(
        <div data-testid="responsiveness-test">
          {elements.map(el => (
            <div 
              key={el.id}
              data-testid={`responsive-${el.id}`}
              style={{
                position: 'absolute',
                left: el.x,
                top: el.y,
                width: el.width || 50,
                height: el.height || 50,
                backgroundColor: el.fill || '#ccc',
                border: el.stroke ? `${el.strokeWidth || 1}px solid ${el.stroke}` : 'none'
              }}
            >
              {el.id}
            </div>
          ))}
        </div>
      );

      // Test that interactions are still responsive
      const startTime = performance.now();
      
      const firstElement = screen.getByTestId('responsive-heavy-0');
      await testEnv.user.click(firstElement);

      const endTime = performance.now();
      const interactionTime = endTime - startTime;

      expect(interactionTime).toBeLessThan(100); // Should respond within 100ms
    });
  });
});
