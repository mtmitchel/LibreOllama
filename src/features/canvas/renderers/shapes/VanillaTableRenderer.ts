import Konva from 'konva';
import { TableElement } from '../../types/enhanced.types';
import { VanillaElementRenderer } from '../VanillaElementRenderer';

export class VanillaTableRenderer extends VanillaElementRenderer<TableElement> {
  private group: Konva.Group | null = null;
  private background: Konva.Rect | null = null;
  private gridGroup: Konva.Group | null = null;

  createKonvaNode(): Konva.Node {
    this.group = this.createGroup();

    this.background = new Konva.Rect({
      x: 0,
      y: 0,
      width: this.element.width,
      height: this.element.height,
      fill: '#ffffff',
      stroke: this.element.borderColor || '#d0d0d0',
      strokeWidth: this.element.borderWidth ?? 1,
    });

    this.gridGroup = new Konva.Group({ listening: false });

    this.group.add(this.background);
    this.group.add(this.gridGroup);

    this.updateKonvaNode(this.element);
    return this.group;
  }

  updateKonvaNode(element: TableElement): void {
    if (!this.group || !this.background || !this.gridGroup) return;

    this.background.width(element.width);
    this.background.height(element.height);

    // Redraw grid
    this.gridGroup.destroyChildren();

    const rows = element.rows;
    const cols = element.cols;
    const cellW = element.cellWidth ?? Math.max(20, Math.floor(element.width / Math.max(1, cols)));
    const cellH = element.cellHeight ?? Math.max(20, Math.floor(element.height / Math.max(1, rows)));

    const gridColor = element.borderColor || '#d0d0d0';
    const gridWidth = element.borderWidth ?? 1;

    // Vertical lines
    for (let c = 0; c <= cols; c++) {
      const x = c * cellW;
      this.gridGroup.add(new Konva.Line({
        points: [x, 0, x, rows * cellH],
        stroke: gridColor,
        strokeWidth: gridWidth,
      }));
    }

    // Horizontal lines
    for (let r = 0; r <= rows; r++) {
      const y = r * cellH;
      this.gridGroup.add(new Konva.Line({
        points: [0, y, cols * cellW, y],
        stroke: gridColor,
        strokeWidth: gridWidth,
      }));
    }

    this.group.getLayer()?.batchDraw();
  }

  getGroup(): Konva.Group | null { return this.group; }
}
