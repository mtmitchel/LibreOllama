import Konva from 'konva';
import { ImageElement } from '../../types/enhanced.types';
import { VanillaElementRenderer } from '../VanillaElementRenderer';

export class VanillaImageRenderer extends VanillaElementRenderer<ImageElement> {
  private imageNode: Konva.Image | null = null;
  private htmlImage: HTMLImageElement | null = null;

  createKonvaNode(): Konva.Node {
    this.imageNode = new Konva.Image({
      x: 0,
      y: 0,
      width: this.element.width,
      height: this.element.height,
      listening: true,
    });

    void this.loadImage(this.element.imageUrl);
    return this.imageNode;
  }

  updateKonvaNode(element: ImageElement): void {
    if (!this.imageNode) return;
    this.imageNode.width(element.width);
    this.imageNode.height(element.height);

    if (this.element.imageUrl !== element.imageUrl) {
      void this.loadImage(element.imageUrl);
    }
  }

  private async loadImage(url: string): Promise<void> {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });

      this.htmlImage = img as HTMLImageElement;
      if (this.imageNode) {
        this.imageNode.image(this.htmlImage);
        this.imageNode.getLayer()?.batchDraw();
      }
    } catch (err) {
      console.error('Failed to load image', url, err);
    }
  }

  destroy(): void {
    super.destroy();
    this.htmlImage = null;
    this.imageNode = null;
  }
}
