/**
 * KonvaNodePool - High-performance node recycling for Konva elements
 * 
 * Provides object pooling to reduce garbage collection overhead during
 * rapid element creation/destruction (especially drawing operations).
 * 
 * Expected performance benefit: ~25-30% in rapid drawing scenarios
 */

import Konva from 'konva';
import { canvasLog } from './canvasLogger';

function isVerbose(): boolean {
  try {
    if (process.env.NODE_ENV !== 'development') return false;
    const ls = localStorage.getItem('CANVAS_VERBOSE');
    return ls === 'true';
  } catch {
    return process.env.NODE_ENV === 'development';
  }
}

function debugLog(...args: any[]) {
  if (isVerbose()) {
    // eslint-disable-next-line no-console
    canvasLog.debug(...args);
  }
}

interface PoolStats {
  created: number;
  reused: number;
  released: number;
  maxPoolSize: number;
  currentPoolSize: number;
}

export class KonvaNodePool {
  private pools = new Map<string, Konva.Node[]>();
  private maxPoolSize = 50; // Prevent memory bloat
  private stats = new Map<string, PoolStats>();
  private lastCleanup = 0;
  private cleanupInterval = 30000; // 30 seconds

  /**
   * Acquire a node from the pool or create a new one
   */
  acquire(type: string): Konva.Node {
    const pool = this.pools.get(type) || [];
    let node: Konva.Node;

    if (pool.length > 0) {
      node = pool.pop()!;
      this.updateStats(type, 'reused');
      
      // Reset node to default state
      this.resetNode(node);
      
      debugLog(`[KonvaNodePool] Reused ${type} node from pool (${pool.length} remaining)`);
    } else {
      node = this.createNode(type);
      this.updateStats(type, 'created');
      
      debugLog(`[KonvaNodePool] Created new ${type} node`);
    }

    // Update pool reference
    this.pools.set(type, pool);
    
    // Periodic cleanup
    this.performPeriodicCleanup();
    
    return node;
  }

  /**
   * Release a node back to the pool
   */
  release(node: Konva.Node, type: string): void {
    const pool = this.pools.get(type) || [];
    
    // Don't exceed max pool size
    if (pool.length >= this.maxPoolSize) {
      node.destroy();
      debugLog(`[KonvaNodePool] Pool for ${type} full, destroying node`);
      return;
    }

    // Reset node state before pooling
    this.resetNode(node);
    
    // Remove from parent if attached
    if (node.getParent()) {
      node.remove();
    }

    pool.push(node);
    this.pools.set(type, pool);
    this.updateStats(type, 'released');
    
    debugLog(`[KonvaNodePool] Released ${type} node to pool (${pool.length} total)`);
  }

  /**
   * Factory method to create nodes based on type
   */
  private createNode(type: string): Konva.Node {
    switch (type) {
      case 'line':
        return new Konva.Line({
          points: [],
          stroke: '#000000',
          strokeWidth: 1,
          lineCap: 'round',
          lineJoin: 'round'
        });
      
      case 'rect':
        return new Konva.Rect({
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          fill: '#cccccc',
          stroke: '#000000',
          strokeWidth: 1
        });
      
      case 'circle':
        return new Konva.Circle({
          x: 0,
          y: 0,
          radius: 50,
          fill: '#cccccc',
          stroke: '#000000',
          strokeWidth: 1
        });
      
      case 'text':
        return new Konva.Text({
          x: 0,
          y: 0,
          text: '',
          fontSize: 16,
          fontFamily: 'Arial',
          fill: '#000000'
        });
      
      case 'group':
        return new Konva.Group({
          x: 0,
          y: 0
        });
      
      case 'image':
        return new Konva.Image({
          x: 0,
          y: 0,
          image: undefined
        });

      case 'transformer':
        return new Konva.Transformer({
          rotateAnchorOffset: 60,
          enabledAnchors: [
            'top-left', 'top-center', 'top-right',
            'middle-left', 'middle-right', 
            'bottom-left', 'bottom-center', 'bottom-right'
          ]
        });

      default:
        canvasLog.warn(`[KonvaNodePool] Unknown node type: ${type}, creating Group`);
        return new Konva.Group();
    }
  }

  /**
   * Reset node to default/clean state
   */
  private resetNode(node: Konva.Node): void {
    // Reset transform
    node.setAttrs({
      x: 0,
      y: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      skewX: 0,
      skewY: 0,
      offsetX: 0,
      offsetY: 0
    });

    // Reset visibility and interaction
    node.visible(true);
    node.listening(true);
    
    // Clear cache
    node.clearCache();
    
    // Remove all event listeners
    node.off();
    
    // Type-specific resets
    if (node instanceof Konva.Line) {
      node.points([]);
    } else if (node instanceof Konva.Text) {
      node.text('');
    } else if (node instanceof Konva.Image) {
      node.image(undefined);
    } else if (node instanceof Konva.Transformer) {
      node.nodes([]);
    }
  }

  /**
   * Update pool statistics
   */
  private updateStats(type: string, operation: 'created' | 'reused' | 'released'): void {
    if (!this.stats.has(type)) {
      this.stats.set(type, {
        created: 0,
        reused: 0,
        released: 0,
        maxPoolSize: this.maxPoolSize,
        currentPoolSize: 0
      });
    }

    const stats = this.stats.get(type)!;
    stats[operation]++;
    
    const pool = this.pools.get(type);
    stats.currentPoolSize = pool ? pool.length : 0;
  }

  /**
   * Get pool statistics for monitoring
   */
  getStats(): Map<string, PoolStats> {
    // Update current pool sizes
    for (const [type, stats] of this.stats) {
      const pool = this.pools.get(type);
      stats.currentPoolSize = pool ? pool.length : 0;
    }
    
    return new Map(this.stats);
  }

  /**
   * Get efficiency metrics
   */
  getEfficiencyMetrics(): { reuseRate: number; totalNodes: number; pooledNodes: number } {
    let totalCreated = 0;
    let totalReused = 0;
    let totalPooled = 0;
    
    for (const stats of this.stats.values()) {
      totalCreated += stats.created;
      totalReused += stats.reused;
      totalPooled += stats.currentPoolSize;
    }
    
    const totalNodes = totalCreated + totalReused;
    const reuseRate = totalNodes > 0 ? (totalReused / totalNodes) * 100 : 0;
    
    return {
      reuseRate: Math.round(reuseRate * 100) / 100,
      totalNodes,
      pooledNodes: totalPooled
    };
  }

  /**
   * Clear a specific pool or all pools
   */
  clearPool(type?: string): void {
    if (type) {
      const pool = this.pools.get(type);
      if (pool) {
        pool.forEach(node => node.destroy());
        this.pools.delete(type);
        this.stats.delete(type);
        debugLog(`[KonvaNodePool] Cleared ${type} pool`);
      }
    } else {
      // Clear all pools
      for (const [poolType, pool] of this.pools) {
        pool.forEach(node => node.destroy());
      }
      this.pools.clear();
      this.stats.clear();
      debugLog('[KonvaNodePool] Cleared all pools');
    }
  }

  /**
   * Perform periodic cleanup to prevent memory buildup
   */
  private performPeriodicCleanup(): void {
    const now = Date.now();
    if (now - this.lastCleanup > this.cleanupInterval) {
      this.lastCleanup = now;
      
      // Trim oversized pools
      let trimmed = 0;
      for (const [type, pool] of this.pools) {
        if (pool.length > this.maxPoolSize * 0.8) {
          const trimCount = Math.floor(pool.length * 0.3); // Remove 30%
          const trimmedNodes = pool.splice(0, trimCount);
          trimmedNodes.forEach(node => node.destroy());
          trimmed += trimCount;
        }
      }
      
      if (trimmed > 0) {
        debugLog(`[KonvaNodePool] Periodic cleanup: trimmed ${trimmed} nodes`);
      }
    }
  }

  /**
   * Log current pool status (for debugging)
   */
  logStatus(): void {
    const metrics = this.getEfficiencyMetrics();
    const poolSizes: Record<string, number> = {};
    
    for (const [type, pool] of this.pools) {
      poolSizes[type] = pool.length;
    }
    
    canvasLog.info('[KonvaNodePool] Status:', {
      reuseRate: `${metrics.reuseRate}%`,
      totalNodes: metrics.totalNodes,
      pooledNodes: metrics.pooledNodes,
      poolSizes,
      maxPoolSize: this.maxPoolSize
    });
  }
}

// Global pool instance
export const globalKonvaPool = new KonvaNodePool();

// Convenience functions
export const acquireNode = (type: string): Konva.Node => globalKonvaPool.acquire(type);
export const releaseNode = (node: Konva.Node, type: string): void => globalKonvaPool.release(node, type);
export const getPoolStats = () => globalKonvaPool.getStats();
export const getPoolEfficiency = () => globalKonvaPool.getEfficiencyMetrics();