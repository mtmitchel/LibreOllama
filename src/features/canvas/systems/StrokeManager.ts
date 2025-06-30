/**
 * Stroke Manager System
 * Handles recording, smoothing, and processing of drawing strokes
 */

import { StrokePoint, StrokeStyle, DRAWING_CONSTANTS } from '../types/drawing.types';
import { catmullRomSpline, douglasPeucker } from '../utils/algorithms/catmullRom';

export class StrokeManager {
  private recordingBuffer: StrokePoint[] = [];
  private smoothingLevel: number = DRAWING_CONSTANTS.DEFAULT_SMOOTHING;
  private simplificationTolerance: number = DRAWING_CONSTANTS.SIMPLIFICATION_TOLERANCE;
  private lastRecordedTime: number = 0;
  
  constructor(config?: {
    smoothingLevel?: number;
    simplificationTolerance?: number;
  }) {
    if (config?.smoothingLevel !== undefined) {
      this.smoothingLevel = Math.max(
        DRAWING_CONSTANTS.MIN_SMOOTHING,
        Math.min(DRAWING_CONSTANTS.MAX_SMOOTHING, config.smoothingLevel)
      );
    }
    
    if (config?.simplificationTolerance !== undefined) {
      this.simplificationTolerance = config.simplificationTolerance;
    }
  }
  
  /**
   * Start recording a new stroke
   */
  startRecording(point: StrokePoint): void {
    this.recordingBuffer = [point];
    this.lastRecordedTime = point.timestamp;
  }
  
  /**
   * Add a point to the current stroke with intelligent throttling
   */
  addPoint(point: StrokePoint): void {
    if (this.recordingBuffer.length === 0) {
      this.startRecording(point);
      return;
    }
    
    // Throttle points based on distance and time
    const lastPoint = this.recordingBuffer[this.recordingBuffer.length - 1];
    const distance = Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y);
    const timeDelta = point.timestamp - this.lastRecordedTime;
    
    // Add point if moved enough distance or enough time has passed
    if (distance > DRAWING_CONSTANTS.MIN_POINT_DISTANCE || timeDelta > 16) { // 60fps threshold
      // Calculate velocity for dynamic width
      const velocity = distance / Math.max(timeDelta, 1);
      
      const enhancedPoint: StrokePoint = {
        ...point,
        velocity
      };
      
      this.recordingBuffer.push(enhancedPoint);
      this.lastRecordedTime = point.timestamp;
      
      // Prevent buffer overflow
      if (this.recordingBuffer.length > DRAWING_CONSTANTS.MAX_STROKE_POINTS) {
        // Remove middle points, keeping start and end
        const start = this.recordingBuffer.slice(0, 100);
        const end = this.recordingBuffer.slice(-100);
        this.recordingBuffer = [...start, ...end];
      }
    }
  }
  
  /**
   * Finish recording and return processed stroke points
   */
  finishRecording(): number[] {
    if (this.recordingBuffer.length < 2) {
      return [];
    }
    
    // Apply smoothing algorithm
    const smoothed = this.applySmoothingAlgorithm(this.recordingBuffer);
    
    // Simplify path to reduce points
    const simplified = douglasPeucker(smoothed, this.simplificationTolerance);
    
    // Convert to flat array format [x1, y1, x2, y2, ...]
    return simplified.flatMap(p => [p.x, p.y]);
  }
  
  /**
   * Get current stroke points for live preview
   */
  getCurrentPoints(): number[] {
    if (this.recordingBuffer.length < 2) {
      return [];
    }
    
    // Apply lighter smoothing for real-time preview
    const lightSmoothed = this.applySmoothingAlgorithm(
      this.recordingBuffer, 
      this.smoothingLevel * 0.5
    );
    
    return lightSmoothed.flatMap(p => [p.x, p.y]);
  }
  
  /**
   * Apply smoothing algorithm to stroke points
   */
  private applySmoothingAlgorithm(points: StrokePoint[], customSmoothness?: number): StrokePoint[] {
    if (points.length < 3) return points;
    
    const smoothness = customSmoothness ?? this.smoothingLevel;
    
    // Use Catmull-Rom spline for smooth curves
    return catmullRomSpline(points, smoothness);
  }
  
  /**
   * Calculate variable width based on pressure and velocity
   */
  calculateVariableWidth(
    point: StrokePoint, 
    style: { 
      widthVariation: boolean;
      minWidth: number;
      maxWidth: number;
      pressureSensitive: boolean;
    }
  ): number {
    if (!style.widthVariation) return (style.minWidth + style.maxWidth) / 2;
    
    let widthFactor = 0.5; // Default middle width
    
    // Use pressure if available and enabled
    if (style.pressureSensitive && point.pressure !== undefined) {
      // Apply pressure curve for more natural feel
      widthFactor = Math.pow(point.pressure, 1 / DRAWING_CONSTANTS.PRESSURE_CURVE);
    } else if (point.velocity !== undefined) {
      // Fallback to velocity-based width (slower = thicker)
      const normalizedVelocity = Math.min(point.velocity / 100, 1); // Normalize to 0-1
      widthFactor = 1 - normalizedVelocity * 0.6; // Inverse relationship
    }
    
    // Interpolate between min and max width
    return style.minWidth + (style.maxWidth - style.minWidth) * widthFactor;
  }
  
  /**
   * Analyze stroke characteristics
   */
  analyzeStroke(points: StrokePoint[]): {
    length: number;
    averageSpeed: number;
    complexity: number;
    bounds: { x: number; y: number; width: number; height: number };
  } {
    if (points.length < 2) {
      return { length: 0, averageSpeed: 0, complexity: 0, bounds: { x: 0, y: 0, width: 0, height: 0 } };
    }
    
    let totalLength = 0;
    let totalSpeed = 0;
    let directionChanges = 0;
    let lastDirection = 0;
    
    let minX = points[0].x, maxX = points[0].x;
    let minY = points[0].y, maxY = points[0].y;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      
      // Calculate segment length
      const segmentLength = Math.hypot(curr.x - prev.x, curr.y - prev.y);
      totalLength += segmentLength;
      
      // Calculate speed
      const timeDelta = curr.timestamp - prev.timestamp;
      if (timeDelta > 0) {
        totalSpeed += segmentLength / timeDelta;
      }
      
      // Track direction changes for complexity
      const direction = Math.atan2(curr.y - prev.y, curr.x - prev.x);
      if (i > 1) {
        const angleDiff = Math.abs(direction - lastDirection);
        if (angleDiff > Math.PI / 4) { // 45 degree threshold
          directionChanges++;
        }
      }
      lastDirection = direction;
      
      // Update bounds
      minX = Math.min(minX, curr.x);
      maxX = Math.max(maxX, curr.x);
      minY = Math.min(minY, curr.y);
      maxY = Math.max(maxY, curr.y);
    }
    
    const averageSpeed = totalSpeed / (points.length - 1);
    const complexity = Math.min(directionChanges / points.length, 1); // Normalize to 0-1
    
    return {
      length: totalLength,
      averageSpeed,
      complexity,
      bounds: {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      }
    };
  }
  
  /**
   * Cancel current recording
   */
  cancelRecording(): void {
    this.recordingBuffer = [];
  }
  
  /**
   * Get raw recorded points (for editing)
   */
  getRawPoints(): StrokePoint[] {
    return [...this.recordingBuffer];
  }
  
  /**
   * Update smoothing settings
   */
  updateSettings(settings: {
    smoothingLevel?: number;
    simplificationTolerance?: number;
  }): void {
    if (settings.smoothingLevel !== undefined) {
      this.smoothingLevel = Math.max(
        DRAWING_CONSTANTS.MIN_SMOOTHING,
        Math.min(DRAWING_CONSTANTS.MAX_SMOOTHING, settings.smoothingLevel)
      );
    }
    
    if (settings.simplificationTolerance !== undefined) {
      this.simplificationTolerance = settings.simplificationTolerance;
    }
  }
  
  /**
   * Static method to create variable-width stroke from points
   */
  static createVariableWidthStroke(
    points: StrokePoint[],
    style: {
      minWidth: number;
      maxWidth: number;
      pressureSensitive: boolean;
    }
  ): { points: number[]; widths: number[] } {
    const manager = new StrokeManager();
    const flatPoints: number[] = [];
    const widths: number[] = [];
    
    points.forEach(point => {
      flatPoints.push(point.x, point.y);
      const width = manager.calculateVariableWidth(point, {
        widthVariation: true,
        ...style
      });
      widths.push(width);
    });
    
    return { points: flatPoints, widths };
  }
} 