
import { describe, it, expect } from 'vitest';
import Konva from 'konva';

describe('Minimal Konva Import Test', () => {
  it('should create a Konva stage without hanging', () => {
    const stage = new Konva.Stage({
      container: document.createElement('div'),
      width: 200,
      height: 200,
    });

    const layer = new Konva.Layer();
    stage.add(layer);

    expect(stage).toBeDefined();
    expect(layer).toBeDefined();
    expect(stage.width()).toBe(200);
  });
});
