// src/features/canvas/types/canvas-elements.ts
// Import the ElementId from enhanced.types to maintain consistency
import { ElementId } from './enhanced.types';

// Use the same branding approach for PortId
type Brand<K, T> = K & { __brand: T };
export type PortId = Brand<string, 'PortId'>;

// Helper function to create PortId safely
export const createPortId = (id: string): PortId => id as PortId;

export type PortKind =
  | 'N'|'S'|'E'|'W'
  | 'NE'|'NW'|'SE'|'SW'
  | 'CENTER'|'CUSTOM';

export type BaseElement = {
  id: ElementId;
  x: number; y: number;
  width: number; height: number;
  rotation?: number; // degrees
};

export type ElementPort = {
  id: PortId;
  kind: PortKind;
  // normalized element-local coords in [-0.5, 0.5]
  nx: number;
  ny: number;
};

export type NodeElement = BaseElement & {
  type: 'shape' | 'text' | 'sticky';
  ports?: ElementPort[];
};

export type EdgeEndpoint = {
  elementId: ElementId;
  portKind: PortKind;
};

export type EdgeRouting = 'straight' | 'orthogonal';
export type EdgeMarker  = 'none' | 'arrow' | 'diamond' | 'circle';

export type EdgeElement = BaseElement & {
  type: 'edge';
  source: EdgeEndpoint;
  target: EdgeEndpoint;
  routing: EdgeRouting;
  points: number[];           // world polyline [x1,y1,x2,y2,...] (derived)
  markerStart?: EdgeMarker;
  markerEnd?: EdgeMarker;
  stroke: string;
  strokeWidth: number;
  selectable?: boolean;
};

export type CanvasElement = NodeElement | EdgeElement;