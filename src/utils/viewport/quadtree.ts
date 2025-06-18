import { Rectangle } from './types';

export class Quadtree<T> {
    public boundary: Rectangle;
    private capacity: number;
    private points: { x: number; y: number; data: T }[] = [];
    private divided = false;

    private northeast: Quadtree<T> | null = null;
    private northwest: Quadtree<T> | null = null;
    private southeast: Quadtree<T> | null = null;
    private southwest: Quadtree<T> | null = null;

    constructor(boundary: Rectangle, capacity: number) {
        this.boundary = boundary;
        this.capacity = capacity;
    }

    public insert(point: { x: number; y: number; data: T }): boolean {
        if (!this.boundary.contains(point)) {
            return false;
        }

        if (this.points.length < this.capacity) {
            this.points.push(point);
            return true;
        }

        if (!this.divided) {
            this.subdivide();
        }

        if (this.northeast?.insert(point)) return true;
        if (this.northwest?.insert(point)) return true;
        if (this.southeast?.insert(point)) return true;
        if (this.southwest?.insert(point)) return true;

        return false;
    }

    private subdivide() {
        const { x, y, width, height } = this.boundary;
        const hw = width / 2;
        const hh = height / 2;

        const ne = new Rectangle(x + hw, y, hw, hh);
        this.northeast = new Quadtree<T>(ne, this.capacity);

        const nw = new Rectangle(x, y, hw, hh);
        this.northwest = new Quadtree<T>(nw, this.capacity);

        const se = new Rectangle(x + hw, y + hh, hw, hh);
        this.southeast = new Quadtree<T>(se, this.capacity);

        const sw = new Rectangle(x, y + hh, hw, hh);
        this.southwest = new Quadtree<T>(sw, this.capacity);

        this.divided = true;
    }

    public query(range: Rectangle, found: T[] = []): T[] {
        if (!this.boundary.intersects(range)) {
            return found;
        }

        for (const point of this.points) {
            if (range.contains(point)) {
                found.push(point.data);
            }
        }

        if (this.divided) {
            this.northwest?.query(range, found);
            this.northeast?.query(range, found);
            this.southwest?.query(range, found);
            this.southeast?.query(range, found);
        }

        return found;
    }
}
