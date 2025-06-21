import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Stage, Layer } from 'react-konva';

const KonvaProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <Stage width={800} height={600}>
      <Layer>{children}</Layer>
    </Stage>
  );
};

const renderWithKonva = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: KonvaProvider, ...options });

const renderInKonva = renderWithKonva; // Alias for backward compatibility

export * from '@testing-library/react';
export { renderWithKonva, renderInKonva };
