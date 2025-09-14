import { ElementId, PortKind } from '../types/canvas-elements';
import { CanvasElement, isCircleElement, isRectangularElement, CircleElement, RectangleElement, SectionElement, isSectionElement, isRectangleElement } from '../types/enhanced.types';

export type { PortKind };
import Konva from 'konva';

export interface Port {
    id: string; // Unique ID for the port
    kind: PortKind; // Type of port (N, S, E, W, CENTER, CUSTOM)
    elementId: ElementId; // The ID of the element this port belongs to
    x: number; // World X coordinate of the port
    y: number; // World Y coordinate of the port
    nx: number; // Normalized X coordinate relative to element center (-0.5 to 0.5)
    ny: number; // Normalized Y coordinate relative to element center (-0.5 to 0.5)
}

/**
 * Calculates the world coordinates of a port for a given element.
 * @param element The canvas element.
 * @param portKind The kind of port (N, S, E, W, CENTER).
 * @returns The world coordinates {x, y} of the port, or null if no port is defined for the element type.
 */
export function getPortWorldCoordinates(element: CanvasElement, portKind: PortKind, zoom: number = 1): { x: number; y: number } | null {
    let elementWidth = 0;
    let elementHeight = 0;

    if (isCircleElement(element)) {
        elementWidth = element.radius * 2;
        elementHeight = element.radius * 2;
    } else if (isRectangleElement(element)) {
        elementWidth = (element as RectangleElement).width;
        elementHeight = (element as RectangleElement).height;
    } else {
        // Elements without explicit width/height or radius don't have standard ports
        return null;
    }

    const centerX = element.x + elementWidth / 2;
    const centerY = element.y + elementHeight / 2;

    // Adjust for zoom if necessary, though port positions are typically in world coordinates
    // and visual indicators might scale with zoom. The coordinates themselves remain world.
    // This 'zoom' parameter is more for visual adjustments of the indicator, not the port itself.

    switch (portKind) {
        case 'CENTER':
            return { x: centerX, y: centerY };
        case 'N':
            return { x: centerX, y: element.y };
        case 'S':
            return { x: centerX, y: element.y + elementHeight };
        case 'E':
            return { x: element.x + elementWidth, y: centerY };
        case 'W':
            return { x: element.x, y: centerY };
        // Add other cardinal directions or custom ports if needed
        default:
            return null;
    }
}

/**
 * Generates a list of standard ports for a given element.
 * @param element The canvas element.
 * @returns An array of Port objects.
 */
export function generateElementPorts(element: CanvasElement): Port[] {
    const ports: Port[] = [];
    let elementWidth = 0;
    let elementHeight = 0;

    // Exclude SectionElements from having ports
    if (isSectionElement(element)) {
        return [];
    }

    // Determine dimensions based on element type
    if (isCircleElement(element)) {
        elementWidth = element.radius * 2;
        elementHeight = element.radius * 2;
    } else if (isRectangleElement(element)) {
        elementWidth = (element as RectangleElement).width;
        elementHeight = (element as RectangleElement).height;
    } else {
        // Only rectangular and circular elements have predefined ports for now
        return [];
    }

    const centerX = element.x + elementWidth / 2;
    const centerY = element.y + elementHeight / 2;

    const addPort = (kind: PortKind, x: number, y: number, nx: number, ny: number) => {
        ports.push({
            id: `${element.id}-${kind}`,
            kind,
            elementId: element.id,
            x, y, nx, ny
        });
    };

    // Center port
    addPort('CENTER', centerX, centerY, 0, 0);

    // Cardinal ports
    if (isRectangularElement(element) || isCircleElement(element)) { // Both types have N,S,E,W
        addPort('N', centerX, element.y, 0, -0.5);
        addPort('S', centerX, element.y + elementHeight, 0, 0.5);
        addPort('E', element.x + elementWidth, centerY, 0.5, 0);
        addPort('W', element.x, centerY, -0.5, 0);
    }

    return ports;
}

export interface SnapPortResult {
    port: Port;
    distance: number;
}

/**
 * Finds the closest snap target (port) for a given world point.
 * @param worldPoint The current pointer position in world coordinates.
 * @param elements A map of all canvas elements.
 * @param excludeElementId An optional element ID to exclude from snapping (e.g., the source element).
 * @param snapDistance The maximum distance for snapping.
 * @returns The closest Port if found, otherwise null.
 */
export function findClosestPort(
    worldPoint: { x: number; y: number },
    elements: Map<ElementId, CanvasElement>,
    excludeElementId: ElementId | null,
    snapDistance: number
): SnapPortResult | null {
    let closestPort: Port | null = null;
    let minDistance = snapDistance;

    for (const element of elements.values()) {
        // Exclude the source element itself
        if (element.id === excludeElementId) {
            continue;
        }

        // Only consider elements that can have ports (rectangular or circular)
        if (!isRectangleElement(element) && !isCircleElement(element)) {
            continue;
        }

        const candidatePorts = generateElementPorts(element);

        for (const port of candidatePorts) {
            const dist = Math.hypot(port.x - worldPoint.x, port.y - worldPoint.y);
            if (dist < minDistance) {
                minDistance = dist;
                closestPort = port;
            }
        }
    }

    if (closestPort) {
      return { port: closestPort, distance: minDistance };
    }

    return null;
}