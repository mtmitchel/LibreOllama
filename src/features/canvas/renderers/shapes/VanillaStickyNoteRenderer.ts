import Konva from 'konva';
import { StickyNoteElement } from '../../types/enhanced.types';
import { VanillaElementRenderer } from '../VanillaElementRenderer';

export class VanillaStickyNoteRenderer extends VanillaElementRenderer<StickyNoteElement> {
  private group: Konva.Group | null = null;
  private rect: Konva.Rect | null = null;
  private text: Konva.Text | null = null;

  createKonvaNode(): Konva.Node {
    this.group = this.createGroup();

    this.rect = new Konva.Rect({
      x: 0,
      y: 0,
      width: this.element.width,
      height: this.element.height,
      cornerRadius: 8,
      fill: this.element.backgroundColor || '#fff8b3',
      stroke: '#e2c044',
      strokeWidth: 1,
    });

    this.text = new Konva.Text({
      x: 8,
      y: 8,
      text: this.element.text || '',
      fontSize: this.element.fontSize || 16,
      fontFamily: this.element.fontFamily || 'Inter, Arial',
      fill: this.element.textColor || '#333',
      width: this.element.width - 16,
      listening: false,
      align: this.element.textAlign || 'left',
    });

    this.group.add(this.rect);
    this.group.add(this.text);

    this.updateKonvaNode(this.element);
    return this.group;
  }

  updateKonvaNode(element: StickyNoteElement): void {
    if (!this.group || !this.rect || !this.text) return;

    this.rect.width(element.width);
    this.rect.height(element.height);
    this.rect.fill(element.backgroundColor || '#fff8b3');

    this.text.text(element.text || '');
    this.text.width(Math.max(0, element.width - 16));
    if (element.textColor) this.text.fill(element.textColor);
    if (element.fontSize) this.text.fontSize(element.fontSize);
    if (element.fontFamily) this.text.fontFamily(element.fontFamily);
    if (element.textAlign) this.text.align(element.textAlign);

    this.applyStrokeProperties(this.rect, element);
  }

  getGroup(): Konva.Group | null {
    return this.group;
  }
}
