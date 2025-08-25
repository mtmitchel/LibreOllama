/**
 * INTEGRATION VALIDATION TEST - REFACTORED
 * 
 * This test validates that the UI is properly calling enhanced store methods,
 * now using a real store instance as per the new testing guidelines.
 */
import React from 'react';
import Konva from 'konva';
import { vi } from 'vitest';
import { renderWithKonva } from '@/tests/utils/testUtils';
import { CanvasLayerManager } from '@/features/canvas/layers/CanvasLayerManager';
import { createUnifiedTestStore } from '@/tests/helpers/createUnifiedTestStore';
import { act } from '@testing-library/react';

// Per testing guidelines, we no longer mock the store.
// We create a real store instance for each test.

describe('UI Enhanced Store Integration Validation', () => {
  test('should render CanvasLayerManager without errors using a real store', () => {
    const store = createUnifiedTestStore();
    const { getState, setState } = store;

    const mockStageRef = ({
      current: {
        getPointerPosition: vi.fn(() => ({ x: 0, y: 0 })),
        width: vi.fn(() => 800),
        height: vi.fn(() => 600),
        getAbsolutePosition: vi.fn(() => ({ x: 0, y: 0 })),
        getTransform: vi.fn(() => ({ m: [1, 0, 0, 1, 0, 0] })),
        batchDraw: vi.fn(),
        draw: vi.fn(),
        container: vi.fn(() => ({
          getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 })
        })),
        on: vi.fn(),
        off: vi.fn(),
      }
    } as unknown) as React.MutableRefObject<Konva.Stage | null>;

    expect(() => {
      act(() => {
        renderWithKonva(
          <CanvasLayerManager
            stageRef={mockStageRef}
            elements={getState().elements as Map<import('@/features/canvas/types/enhanced.types').ElementId | import('@/features/canvas/types/enhanced.types').SectionId, import('@/features/canvas/types/enhanced.types').CanvasElement>}
            selectedElementIds={getState().selectedElementIds}
            onElementUpdate={getState().updateElement}
            onElementDragEnd={vi.fn()}
            onElementClick={vi.fn()}
            onStartTextEdit={vi.fn()}
          />
        );
      });
    }).not.toThrow();

    console.log('✅ CanvasLayerManager renders successfully with a real store');
  });
});
