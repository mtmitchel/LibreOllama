import Konva from 'konva';
import { ElementId } from '../types/canvas-elements';

export interface ConnectorHandleCallbacks {
  onStartDrag?: (elementId: ElementId, x: number, y: number) => void;
  onStartDragEnd?: (elementId: ElementId, x: number, y: number) => void;
  onEndDrag?: (elementId: ElementId, x: number, y: number) => void;
  onEndDragEnd?: (elementId: ElementId, x: number, y: number) => void;
}

export class ConnectorHandles {
  private startHandle: Konva.Circle;
  private endHandle: Konva.Circle;
  private previewLine?: Konva.Line;
  private elementId: ElementId;
  private overlayLayer: Konva.Layer;
  private callbacks: ConnectorHandleCallbacks;
  
  constructor(
    elementId: ElementId,
    overlayLayer: Konva.Layer,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    callbacks: ConnectorHandleCallbacks = {}
  ) {
    this.elementId = elementId;
    this.overlayLayer = overlayLayer;
    this.callbacks = callbacks;
    
    // Create visual handles for endpoints
    this.startHandle = new Konva.Circle({
      x: startX,
      y: startY,
      radius: 6,
      fill: '#10b981',
      stroke: '#ffffff',
      strokeWidth: 2,
      draggable: true,
      name: 'connector-start-handle',
      listening: true,
      hitStrokeWidth: 20, // Larger hit area
    });
    
    this.endHandle = new Konva.Circle({
      x: endX,
      y: endY,
      radius: 6,
      fill: '#10b981',
      stroke: '#ffffff',
      strokeWidth: 2,
      draggable: true,
      name: 'connector-end-handle',
      listening: true,
      hitStrokeWidth: 20, // Larger hit area
    });
    
    this.attachEventHandlers();
    
    // Add handles to overlay layer
    overlayLayer.add(this.startHandle);
    overlayLayer.add(this.endHandle);
  }
  
  private attachEventHandlers() {
    // Handle start point dragging
    this.startHandle.on('dragmove', (e) => {
      const pos = e.target.position();
      this.showPreview();
      this.callbacks.onStartDrag?.(this.elementId, pos.x, pos.y);
    });
    
    this.startHandle.on('dragend', (e) => {
      const pos = e.target.position();
      this.hidePreview();
      this.callbacks.onStartDragEnd?.(this.elementId, pos.x, pos.y);
    });
    
    // Handle end point dragging
    this.endHandle.on('dragmove', (e) => {
      const pos = e.target.position();
      this.showPreview();
      this.callbacks.onEndDrag?.(this.elementId, pos.x, pos.y);
    });
    
    this.endHandle.on('dragend', (e) => {
      const pos = e.target.position();
      this.hidePreview();
      this.callbacks.onEndDragEnd?.(this.elementId, pos.x, pos.y);
    });
    
    // Visual feedback on hover
    this.startHandle.on('mouseenter', () => {
      this.startHandle.strokeWidth(3);
      this.startHandle.radius(8);
      this.overlayLayer.batchDraw();
      document.body.style.cursor = 'move';
    });
    
    this.startHandle.on('mouseleave', () => {
      this.startHandle.strokeWidth(2);
      this.startHandle.radius(6);
      this.overlayLayer.batchDraw();
      document.body.style.cursor = 'default';
    });
    
    this.endHandle.on('mouseenter', () => {
      this.endHandle.strokeWidth(3);
      this.endHandle.radius(8);
      this.overlayLayer.batchDraw();
      document.body.style.cursor = 'move';
    });
    
    this.endHandle.on('mouseleave', () => {
      this.endHandle.strokeWidth(2);
      this.endHandle.radius(6);
      this.overlayLayer.batchDraw();
      document.body.style.cursor = 'default';
    });
  }
  
  private showPreview() {
    if (!this.previewLine) {
      const startPos = this.startHandle.position();
      const endPos = this.endHandle.position();
      
      this.previewLine = new Konva.Line({
        points: [startPos.x, startPos.y, endPos.x, endPos.y],
        stroke: '#10b981',
        strokeWidth: 2,
        dash: [5, 5],
        opacity: 0.5,
        listening: false,
      });
      
      this.overlayLayer.add(this.previewLine);
      this.previewLine.moveToBottom(); // Keep preview behind handles
    } else {
      const startPos = this.startHandle.position();
      const endPos = this.endHandle.position();
      this.previewLine.points([startPos.x, startPos.y, endPos.x, endPos.y]);
    }
    
    this.overlayLayer.batchDraw();
  }
  
  private hidePreview() {
    if (this.previewLine) {
      this.previewLine.destroy();
      this.previewLine = undefined;
      this.overlayLayer.batchDraw();
    }
  }
  
  public updatePositions(startX: number, startY: number, endX: number, endY: number) {
    this.startHandle.position({ x: startX, y: startY });
    this.endHandle.position({ x: endX, y: endY });
    this.overlayLayer.batchDraw();
  }
  
  public destroy() {
    this.startHandle.off();
    this.endHandle.off();
    this.startHandle.destroy();
    this.endHandle.destroy();
    this.hidePreview();
  }
  
  public hide() {
    this.startHandle.visible(false);
    this.endHandle.visible(false);
    this.hidePreview();
    this.overlayLayer.batchDraw();
  }
  
  public show() {
    this.startHandle.visible(true);
    this.endHandle.visible(true);
    this.overlayLayer.batchDraw();
  }
}