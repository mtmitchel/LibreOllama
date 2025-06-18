import { KonvaNode } from '../../types/konva.types';
import { Quadtree } from './quadtree';
import { Rectangle } from './types';

export class ViewportCuller {
    private quadtree: Quadtree<KonvaNode>;

    constructor(boundary: Rectangle) {
        this.quadtree = new Quadtree<KonvaNode>(boundary, 4);
    }

    public build(nodes: KonvaNode[]) {
        this.quadtree = new Quadtree<KonvaNode>(this.quadtree.boundary, 4);
        for (const node of nodes) {
            this.quadtree.insert({ x: node.x, y: node.y, data: node });
        }
    }

    public getVisibleNodes(viewport: Rectangle): KonvaNode[] {
        return this.quadtree.query(viewport);
    }
}
