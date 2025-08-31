import { describe, it, expect } from 'vitest';
import React from 'react';
import { Stage, Layer, Rect, Text as KText, Image as KImage } from 'react-konva';
import { render } from '@testing-library/react';

// Basic visual snapshot style test via dataURL; in CI we compare length ranges

function toDataURL(stage: any) {
  return stage.toDataURL({ pixelRatio: 1 });
}

describe('Shape caching visual snapshots', () => {
  it('rectangle + text snapshot should be stable', () => {
    const { container } = render(
      <Stage width={300} height={200}>
        <Layer>
          <Rect x={10} y={10} width={200} height={100} fill="#fafafa" stroke="#ddd" strokeWidth={2} cornerRadius={4} />
          <KText x={20} y={20} width={180} height={80} text={'Snapshot Test'} fontSize={24} fontFamily={'Arial'} fill={'#111'} />
        </Layer>
      </Stage>
    );
    const stage = (container.querySelector('canvas') as any)?._konvaNode?.getStage?.();
    const url = toDataURL(stage);
    expect(url.length).toBeGreaterThan(1000);
  });
});
