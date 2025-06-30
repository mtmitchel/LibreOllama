import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Stage, Layer } from 'react-konva';

/**
 * Render Konva components with Stage and Layer wrapper
 * THIS IS THE PREFERRED RENDERER FOR ALL KONVA COMPONENTS.
 * It was moved here to resolve a circular dependency/mocking issue in Vitest.
 */
export const renderWithKonva = (ui: ReactElement, options: Omit<RenderOptions, 'wrapper'> = {}) => {
  return render(
    <Stage width={800} height={600}>
      <Layer>
        {ui}
      </Layer>
    </Stage>,
    options
  );
};
