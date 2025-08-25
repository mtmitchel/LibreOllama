import Konva from 'konva';
import { MarkerElement } from '../../types/enhanced.types';
import { VanillaElementRenderer } from '../VanillaElementRenderer';

export class VanillaMarkerRenderer extends VanillaElementRenderer<MarkerElement> {
  private line: Konva.Line | null = null;

  createKonvaNode(): Konva.Node {
    this.line = new Konva.Line({
      x: 0,
      y: 0,
      points: this.element.points || [],
      listening: true,
    });
    this.updateKonvaNode(this.element);
    return this.line;
  }

  updateKonvaNode(element: MarkerElement): void {
    if (!this.line) return;

    this.line.points(element.points || []);

    // Apply marker style
    const s = element.style;
    this.line.stroke(s.color);
    this.line.strokeWidth(s.width);
    this.line.lineCap(s.lineCap as any);
    this.line.lineJoin(s.lineJoin as any);
    this.line.opacity(s.opacity);
    this.line.globalCompositeOperation('source-over');

    // Performance
    this.line.perfectDrawEnabled(false);
    this.line.shadowForStrokeEnabled(false);
  }

  getLine(): Konva.Line | null { return this.line; }
}
