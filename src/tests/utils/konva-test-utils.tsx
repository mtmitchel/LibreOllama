
import { render } from '@testing-library/react';
import React from 'react';
import { Stage, Layer } from 'react-konva';

const renderInKonva = (ui: React.ReactElement) => {
  return render(
    <Stage>
      <Layer>{ui}</Layer>
    </Stage>
  );
};

export { renderInKonva };
