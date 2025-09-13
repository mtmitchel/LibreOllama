// Temporary comment to force TS re-evaluation
import { EdgeElement, NodeElement, EdgeRouting } from '../types/canvas-elements';
import { getPortWorldCoordinates, PortKind } from './ports';
import { CanvasElement, isRectangularElement, isCircleElement, CircleElement, RectangleElement } from '../types/enhanced.types';

/**
 * Calculates the path points for an edge based on its routing type.
 * @param edge The edge element.
 * @param sourceElement The source element connected to the edge.
 * @param targetElement The target element connected to the edge.
 * @returns An array of numbers representing the path points [x1, y1, x2, y2, ...].
 */
export function updateEdgeGeometry(edge: EdgeElement, sourceElement: CanvasElement, targetElement: CanvasElement): { points: number[] } {
    const sourcePort = getPortWorldCoordinates(sourceElement, edge.source.portKind);
    const targetPort = getPortWorldCoordinates(targetElement, edge.target.portKind);

    if (!sourcePort || !targetPort) {
        // Fallback to straight line if ports are not defined
        return { points: [sourceElement.x, sourceElement.y, targetElement.x, targetElement.y] };
    }

    switch (edge.routing) {
        case 'straight':
            return straightLineRouting(sourcePort, targetPort);
        case 'orthogonal':
            return orthogonalRouting(sourcePort, targetPort, sourceElement, targetElement, edge);
        // case 'curved':
        //     return curvedRouting(sourcePort, targetPort);
        default:
            return straightLineRouting(sourcePort, targetPort);
    }
}

/**
 * Straight line routing: A simple two-point path from source to target.
 */
function straightLineRouting(source: { x: number; y: number }, target: { x: number; y: number }): { points: number[] } {
    return { points: [source.x, source.y, target.x, target.y] };
}

/**
 * Calculates straight line route between two ports.
 * @param sourcePort The source port.
 * @param targetPort The target port.
 * @returns Array of points [x1, y1, x2, y2].
 */
export function calculateStraightLineRoute(sourcePort: { x: number; y: number }, targetPort: { x: number; y: number }): number[] {
    return [sourcePort.x, sourcePort.y, targetPort.x, targetPort.y];
}

/**
 * Calculates orthogonal (L-shaped) route between two ports.
 * @param sourcePort The source port.
 * @param targetPort The target port.
 * @param clearance The clearance distance from ports.
 * @returns Array of points for the orthogonal path.
 */
export function calculateOrthogonalRoute(
    sourcePort: { x: number; y: number },
    targetPort: { x: number; y: number },
    clearance: number = 8
): number[] {
    const points: number[] = [];

    // Start point
    points.push(sourcePort.x, sourcePort.y);

    // Calculate two possible orthogonal paths (H-V and V-H)
    const pathHV = [sourcePort.x, sourcePort.y, sourcePort.x, targetPort.y, targetPort.x, targetPort.y];
    const pathVH = [sourcePort.x, sourcePort.y, targetPort.x, sourcePort.y, targetPort.x, targetPort.y];

    // Choose the shorter path
    const distHV = Math.hypot(pathHV[0] - pathHV[2], pathHV[1] - pathHV[3]) + Math.hypot(pathHV[2] - pathHV[4], pathHV[3] - pathHV[5]);
    const distVH = Math.hypot(pathVH[0] - pathVH[2], pathVH[1] - pathVH[3]) + Math.hypot(pathVH[2] - pathVH[4], pathVH[3] - pathVH[5]);

    const chosenPath = distHV < distVH ? pathHV : pathVH;
    points.push(...chosenPath.slice(2)); // Add intermediate and end points

    return points;
}

/**
 * Calculates curved (mindmap style) route between two ports.
 * @param sourcePort The source port.
 * @param targetPort The target port.
 * @returns Array of points for the curved path.
 */
export function calculateCurvedRoute(sourcePort: { x: number; y: number }, targetPort: { x: number; y: number }): number[] {
    // Simple curved path using quadratic Bezier curve
    const midX = (sourcePort.x + targetPort.x) / 2;
    const midY = (sourcePort.y + targetPort.y) / 2;

    // Control point with horizontal bias
    const controlX = midX + (targetPort.x - sourcePort.x) * 0.3;
    const controlY = midY;

    // For Konva, we can approximate with multiple points
    const steps = 10;
    const points: number[] = [];

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = (1 - t) * (1 - t) * sourcePort.x + 2 * (1 - t) * t * controlX + t * t * targetPort.x;
        const y = (1 - t) * (1 - t) * sourcePort.y + 2 * (1 - t) * t * controlY + t * t * targetPort.y;
        points.push(x, y);
    }

    return points;
}

/**
 * Orthogonal (L-shaped) routing.
 * Uses port normal vectors for proper entry/exit paths, with a default 8px clearance.
 * Optimizes paths by choosing between Horizontal→Vertical or Vertical→Horizontal based on total length.
 * Merges tiny/collinear segments for cleaner routes.
 */
function orthogonalRouting(
    source: { x: number; y: number },
    target: { x: number; y: number },
    sourceElement: CanvasElement,
    targetElement: CanvasElement,
    edge: EdgeElement,
    clearance: number = 8
): { points: number[] } {
    const points: number[] = [];

    // Determine port normals (simplified for now, assuming cardinal ports)
    const getPortNormal = (portKind: PortKind) => {
        switch (portKind) {
            case 'N': return { dx: 0, dy: -1 };
            case 'S': return { dx: 0, dy: 1 };
            case 'E': return { dx: 1, dy: 0 };
            case 'W': return { dx: -1, dy: 0 };
            default: return { dx: 0, dy: 0 }; // Center or custom ports
        }
    };

    const sourceNormal = getPortNormal(edge.source.portKind);
    const targetNormal = getPortNormal(edge.target.portKind);

    // Start point with initial clearance
    points.push(source.x, source.y);
    const p1x = source.x + sourceNormal.dx * clearance;
    const p1y = source.y + sourceNormal.dy * clearance;
    points.push(p1x, p1y);

    // End point with initial clearance
    const p2x = target.x + targetNormal.dx * clearance;
    const p2y = target.y + targetNormal.dy * clearance;

    // Calculate two possible orthogonal paths (H-V and V-H)
    const pathHV = [p1x, p1y, p1x, p2y, p2x, p2y];
    const pathVH = [p1x, p1y, p2x, p1y, p2x, p2y];

    // Choose the shorter path
    const distHV = Math.hypot(pathHV[0] - pathHV[2], pathHV[1] - pathHV[3]) + Math.hypot(pathHV[2] - pathHV[4], pathHV[3] - pathHV[5]);
    const distVH = Math.hypot(pathVH[0] - pathVH[2], pathVH[1] - pathVH[3]) + Math.hypot(pathVH[2] - pathVH[4], pathVH[3] - pathVH[5]);

    const chosenPath = distHV < distVH ? pathHV : pathVH;
    points.push(...chosenPath.slice(2)); // Add intermediate and end points

    // Add the final target point
    points.push(target.x, target.y);

    // TODO: Merge tiny/collinear segments for cleaner routes

    return { points };
}

/**
 * Curved routing (Mindmap Style).
 * Creates organic-looking curved paths using three control points, with a slight horizontal bias.
 */
// function curvedRouting(source: { x: number; y: number }, target: { x: number; y: number }): { points: number[] } {
//     // Implement curved routing logic here
//     // This will likely involve Bezier curves or similar
//     return { points: [source.x, source.y, target.x, target.y] }; // Placeholder
// }
