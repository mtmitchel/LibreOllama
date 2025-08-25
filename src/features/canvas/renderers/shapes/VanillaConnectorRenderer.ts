import Konva from 'konva';
import { ConnectorElement } from '../../types/enhanced.types';
import { VanillaElementRenderer } from '../VanillaElementRenderer';

export class VanillaConnectorRenderer extends VanillaElementRenderer<ConnectorElement> {
  private line: Konva.Line | Konva.Arrow | null = null;

  createKonvaNode(): Konva.Node {
    // Choose Arrow for arrow subtypes; default to Line
    const isArrow = this.element.subType === 'arrow';
    const NodeClass = isArrow ? Konva.Arrow : Konva.Line;

    this.line = new NodeClass({
      x: 0,
      y: 0,
      points: this.element.points || this.element.pathPoints || this.fallbackPoints(),
      listening: true,
    }) as unknown as Konva.Line | Konva.Arrow;

    this.updateKonvaNode(this.element);
    return this.line as Konva.Node;
  }

  updateKonvaNode(element: ConnectorElement): void {
    if (!this.line) return;

    const points = element.points || element.pathPoints || this.fallbackPoints();
    (this.line as any).points(points);

    const stroke = element.stroke || element.connectorStyle?.strokeColor || '#333';
    const strokeWidth = element.strokeWidth || element.connectorStyle?.strokeWidth || 2;

    (this.line as any).stroke(stroke);
    (this.line as any).strokeWidth(strokeWidth);
    (this.line as any).lineCap('round');
    (this.line as any).lineJoin('round');

    if ((this.line as any).pointerLength !== undefined) {
      (this.line as any).pointerLength(element.connectorStyle?.arrowSize ?? 12);
      (this.line as any).pointerWidth((element.connectorStyle?.arrowSize ?? 12) * 0.6);
    }

    if (element.connectorStyle?.strokeDashArray) {
      (this.line as any).dash(element.connectorStyle.strokeDashArray);
    }
  }

  private fallbackPoints(): number[] {
    // Minimal fallback line
    return [this.element.x, this.element.y, this.element.x + 100, this.element.y + 100];
  }

  getLine(): Konva.Line | Konva.Arrow | null {
    return this.line;
  }
}
