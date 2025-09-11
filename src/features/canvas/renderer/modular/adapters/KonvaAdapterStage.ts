import type Konva from 'konva';
import type { KonvaAdapter } from '../../modular/types';

export class KonvaAdapterStage implements KonvaAdapter {
  constructor(private stage: Konva.Stage | null, private layers: { background: Konva.Layer | null; main: Konva.Layer | null; preview: Konva.Layer | null; overlay: Konva.Layer | null }) {}

  getStage(): Konva.Stage | null {
    return this.stage;
  }

  getLayers() {
    return this.layers;
  }
}


