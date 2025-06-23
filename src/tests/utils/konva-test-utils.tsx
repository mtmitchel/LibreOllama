import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
// import { Stage, Layer } from 'react-konva';
import { vi } from 'vitest';

const KonvaProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <div data-testid="konva-container">
      {children}
    </div>
  );
};

const renderWithKonva = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: KonvaProvider, ...options });

const renderInKonva = renderWithKonva; // Alias for backward compatibility

// Canvas test utilities
const mockCanvasElement = {
  getContext: () => ({
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    measureText: vi.fn(() => ({ width: 100 })),
  }),
  toDataURL: vi.fn(() => 'data:image/png;base64,mock'),
};

// Helper to find canvas elements in the DOM
const findCanvasElement = (container: HTMLElement) => {
  return container.querySelector('canvas');
};

export * from '@testing-library/react';
export { renderWithKonva, renderInKonva, mockCanvasElement, findCanvasElement };
