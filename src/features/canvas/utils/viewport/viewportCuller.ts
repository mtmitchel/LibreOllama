import { CanvasElement } from '../../types/enhanced.types';
import { QuadTree } from '../spatial/Quadtree';
import { BoundingBox, ViewportBounds } from '../../types/enhanced.types';

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class ViewportCuller {
    private quadtree: Quadtree;

    constructor(boundary: Rectangle) {
        const bounds: BoundingBox = {
            x: boundary.x,
            y: boundary.y,
            width: boundary.width,
            height: boundary.height
        };
        this.quadtree = new Quadtree(bounds);
    }

    public build(elements: CanvasElement[]) {
        this.quadtree.clear();
        for (const element of elements) {
            // Convert stores/types CanvasElement to enhanced.types CanvasElement
            this.quadtree.insert(element as any);
        }
    }

    public getVisibleElements(viewport: Rectangle): string[] {
        const viewportBounds: ViewportBounds = {
            left: viewport.x,
            top: viewport.y,
            right: viewport.x + viewport.width,
            bottom: viewport.y + viewport.height
        };
        return this.quadtree.query(viewportBounds);
    }
}
