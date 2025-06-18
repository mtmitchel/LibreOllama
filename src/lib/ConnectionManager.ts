// src/lib/ConnectionManager.ts
import Konva from 'konva';

export interface ConnectionPoint {
  x: number;
  y: number;
  type: 'input' | 'output' | 'bidirectional';
  id: string;
}

export interface Connection {
  id: string;
  source: { shape: Konva.Shape; point: ConnectionPoint };
  target: { shape: Konva.Shape; point: ConnectionPoint };
  line: Konva.Line;
  arrow?: Konva.Arrow;
  cleanup?: () => void;
}

export class ConnectionManager {
  private stage: Konva.Stage;
  private layer: Konva.Layer;
  private connectionLayer: Konva.Layer;
  private connections: Map<string, Connection> = new Map();
  private isDrawing = false;
  private currentConnection: Konva.Line | null = null;
  private sourceShape: Konva.Shape | null = null;
  private connectionPoints: Map<number, ConnectionPoint[]> = new Map();

  constructor(stage: Konva.Stage, layer: Konva.Layer) {
    this.stage = stage;
    this.layer = layer;
    this.connectionLayer = new Konva.Layer();
    stage.add(this.connectionLayer);
    this.setupEventListeners();
  }

  // Register shapes that can be connected
  registerConnectableShape(shape: Konva.Shape, connectionPoints: ConnectionPoint[]) {
    this.connectionPoints.set(shape._id, connectionPoints);
    this.addConnectionHandles(shape, connectionPoints);
  }

  private addConnectionHandles(shape: Konva.Shape, points: ConnectionPoint[]) {
    points.forEach((point, index) => {
      const handle = new Konva.Circle({
        x: shape.x() + point.x,
        y: shape.y() + point.y,
        radius: 6,
        fill: 'var(--accent-primary)',
        stroke: 'var(--accent-secondary)',
        strokeWidth: 2,
        opacity: 0,
        listening: true,
        name: `connection-handle-${shape._id}-${index}`,
        draggable: false
      });

      // Show handles on hover
      shape.on('mouseenter', () => {
        points.forEach((_, i) => {
          const h = this.layer.findOne(`.connection-handle-${shape._id}-${i}`);
          if (h) {
            h.opacity(1);
            h.moveToTop();
          }
        });
        this.layer.batchDraw();
      });

      shape.on('mouseleave', () => {
        if (!this.isDrawing) {
          points.forEach((_, i) => {
            const h = this.layer.findOne(`.connection-handle-${shape._id}-${i}`);
            if (h) h.opacity(0);
          });
          this.layer.batchDraw();
        }
      });

      // Handle connection start
      handle.on('mousedown', (e) => {
        e.cancelBubble = true;
        this.startConnection(shape, point, handle);
      });

      // Handle hover effects
      handle.on('mouseenter', () => {
        handle.opacity(1);
        handle.radius(8);
        this.layer.batchDraw();
      });

      handle.on('mouseleave', () => {
        if (!this.isDrawing) {
          handle.opacity(0);
          handle.radius(6);
          this.layer.batchDraw();
        }
      });

      this.layer.add(handle);
    });
  }

  private startConnection(sourceShape: Konva.Shape, sourcePoint: ConnectionPoint, _handle: Konva.Circle) {
    this.isDrawing = true;
    this.sourceShape = sourceShape;
    
    const startPos = {
      x: sourceShape.x() + sourcePoint.x,
      y: sourceShape.y() + sourcePoint.y
    };

    // Create temporary line for visual feedback
    this.currentConnection = new Konva.Line({
      points: [startPos.x, startPos.y, startPos.x, startPos.y],
      stroke: '#FF5722',
      strokeWidth: 3,
      lineCap: 'round',
      dash: [5, 5],
      listening: false
    });

    this.connectionLayer.add(this.currentConnection);
    this.connectionLayer.batchDraw();

    // Add stage mouse move listener
    this.stage.on('mousemove.connection', (_e) => {
      if (this.currentConnection && this.isDrawing) {
        const pos = this.stage.getPointerPosition();
        if (pos) {
          const points = this.currentConnection.points();
          const startX = points[0] ?? 0;
          const startY = points[1] ?? 0;
          this.currentConnection.points([startX, startY, pos.x, pos.y]);
          this.connectionLayer.batchDraw();
        }
      }
    });

    // Add stage mouse up listener
    this.stage.on('mouseup.connection', (e) => {
      this.finishConnection(e);
    });
  }

  private finishConnection(e: Konva.KonvaEventObject<MouseEvent>) {
    if (!this.isDrawing || !this.sourceShape || !this.currentConnection) return;

    const targetElement = e.target;
    const targetShape = this.findConnectableShape(targetElement);
    
    if (targetShape && targetShape !== this.sourceShape) {
      const targetPoint = this.findNearestConnectionPoint(targetShape, e);
      if (targetPoint) {
        const sourcePoint = this.connectionPoints.get(this.sourceShape._id)?.[0]; // Get first available point for simplicity
        if (sourcePoint && this.canConnect(this.sourceShape, sourcePoint, targetShape, targetPoint)) {
          this.createConnection(this.sourceShape, sourcePoint, targetShape, targetPoint);
        }
      }
    }

    // Cleanup
    this.currentConnection.destroy();
    this.currentConnection = null;
    this.isDrawing = false;
    this.sourceShape = null;
    this.stage.off('mousemove.connection');
    this.stage.off('mouseup.connection');
    this.connectionLayer.batchDraw();
  }

  private findConnectableShape(target: Konva.Node): Konva.Shape | null {
    if (target instanceof Konva.Shape && this.connectionPoints.has(target._id)) {
      return target;
    }
    return null;
  }

  private findNearestConnectionPoint(shape: Konva.Shape, _e: Konva.KonvaEventObject<MouseEvent>): ConnectionPoint | null {
    const points = this.connectionPoints.get(shape._id);
    if (!points) return null;

    const pointerPos = this.stage.getPointerPosition();
    if (!pointerPos) return null;

    let nearestPoint: ConnectionPoint | null = null;
    let minDistance = 30; // Maximum snap distance

    points.forEach(point => {
      const pointWorldPos = {
        x: shape.x() + point.x,
        y: shape.y() + point.y
      };

      const distance = Math.sqrt(
        Math.pow(pointerPos.x - pointWorldPos.x, 2) + 
        Math.pow(pointerPos.y - pointWorldPos.y, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = point;
      }
    });

    return nearestPoint;
  }

  private canConnect(sourceShape: Konva.Shape, sourcePoint: ConnectionPoint, targetShape: Konva.Shape, targetPoint: ConnectionPoint): boolean {
    // Prevent self-connections
    if (sourceShape === targetShape) return false;

    // Check connection type compatibility
    if (sourcePoint.type === 'output' && targetPoint.type === 'output') return false;
    if (sourcePoint.type === 'input' && targetPoint.type === 'input') return false;

    // Check for existing connections
    const existingConnection = Array.from(this.connections.values()).find(conn => 
      (conn.source.shape === sourceShape && conn.target.shape === targetShape) ||
      (conn.source.shape === targetShape && conn.target.shape === sourceShape)
    );

    return !existingConnection;
  }

  private createConnection(sourceShape: Konva.Shape, sourcePoint: ConnectionPoint, targetShape: Konva.Shape, targetPoint: ConnectionPoint) {
    const connectionId = `connection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const points = this.calculateConnectionPoints(sourceShape, sourcePoint, targetShape, targetPoint);
    
    // Create arrow for connection
    const arrow = new Konva.Arrow({
      points: points,
      stroke: 'var(--accent-primary)',
      strokeWidth: 2,
      fill: 'var(--accent-primary)',
      pointerLength: 8,
      pointerWidth: 6,
      listening: true,
      name: `connection-${connectionId}`
    });

    // Add hover effects
    arrow.on('mouseenter', () => {
      arrow.strokeWidth(3);
      arrow.stroke('var(--accent-secondary)');
      this.connectionLayer.batchDraw();
    });

    arrow.on('mouseleave', () => {
      arrow.strokeWidth(2);
      arrow.stroke('var(--accent-primary)');
      this.connectionLayer.batchDraw();
    });

    // Add double-click to delete
    arrow.on('dblclick', () => {
      this.deleteConnection(connectionId);
    });

    this.connectionLayer.add(arrow);

    const connection: Connection = {
      id: connectionId,
      source: { shape: sourceShape, point: sourcePoint },
      target: { shape: targetShape, point: targetPoint },
      line: arrow,
      arrow: arrow
    };

    this.connections.set(connectionId, connection);
    this.setupConnectionUpdates(connection);
    this.connectionLayer.batchDraw();
  }

  private calculateConnectionPoints(sourceShape: Konva.Shape, sourcePoint: ConnectionPoint, targetShape: Konva.Shape, targetPoint: ConnectionPoint): number[] {
    const sourcePos = {
      x: sourceShape.x() + sourcePoint.x,
      y: sourceShape.y() + sourcePoint.y
    };

    const targetPos = {
      x: targetShape.x() + targetPoint.x,
      y: targetShape.y() + targetPoint.y
    };

    // Create bezier curve for smooth connection
    const controlOffset = Math.abs(targetPos.x - sourcePos.x) * 0.5;
    
    return [
      sourcePos.x, sourcePos.y,
      sourcePos.x + controlOffset, sourcePos.y,
      targetPos.x - controlOffset, targetPos.y,
      targetPos.x, targetPos.y
    ];
  }

  private setupConnectionUpdates(connection: Connection) {
    const updateConnection = () => {
      const newPoints = this.calculateConnectionPoints(
        connection.source.shape, 
        connection.source.point,
        connection.target.shape, 
        connection.target.point
      );
      connection.arrow?.points(newPoints);
      this.connectionLayer.batchDraw();
    };

    // Update on drag
    connection.source.shape.on('dragmove', updateConnection);
    connection.target.shape.on('dragmove', updateConnection);

    // Update on transform
    connection.source.shape.on('transform', updateConnection);
    connection.target.shape.on('transform', updateConnection);

    // Store cleanup functions
    connection.cleanup = () => {
      connection.source.shape.off('dragmove', updateConnection);
      connection.target.shape.off('dragmove', updateConnection);
      connection.source.shape.off('transform', updateConnection);
      connection.target.shape.off('transform', updateConnection);
    };
  }

  deleteConnection(connectionId: string) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.arrow?.destroy();
      connection.cleanup?.();
      this.connections.delete(connectionId);
      this.connectionLayer.batchDraw();
    }
  }

  private setupEventListeners() {
    // Additional event listeners can be added here
  }

  // Public methods for external use
  getAllConnections(): Connection[] {
    return Array.from(this.connections.values());
  }

  clearAllConnections() {
    this.connections.forEach(connection => {
      connection.arrow?.destroy();
      connection.cleanup?.();
    });
    this.connections.clear();
    this.connectionLayer.batchDraw();
  }

  destroy() {
    this.clearAllConnections();
    this.connectionLayer.destroy();
  }
}
