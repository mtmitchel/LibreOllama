// src/features/canvas/utils/NodePool.ts
/**
 * Node Pooling System for Konva Performance Optimization
 * Part of LibreOllama Canvas Phase 3 Implementation
 * 
 * Implements object pooling to reduce garbage collection overhead
 * as mandated by the Friday Konva Review and Developer Checklist
 */

import Konva from 'konva';
import { CanvasElement } from '../types/enhanced.types';
import { logger } from '../../../core/lib/logger';

type NodeType = 'Rect' | 'Circle' | 'Line' | 'Text' | 'Group' | 'Image';

export class NodePool {
  private static pools: Map<NodeType, Konva.Node[]> = new Map();
  private static stats = {
    created: 0,
    reused: 0,
    released: 0
  };

  private static createNode(type: NodeType): Konva.Node {
    this.stats.created++;
    
    switch (type) {
      case 'Rect':
        return new Konva.Rect();
      case 'Circle':
        return new Konva.Circle();
      case 'Line':
        return new Konva.Line();
      case 'Text':
        return new Konva.Text();
      case 'Group':
        return new Konva.Group();
      case 'Image':
        // Create a minimal image node - will be configured when used
        const imageNode = new Konva.Image({ image: undefined });
        return imageNode;
      default:
        throw new Error(`Unsupported node type for pooling: ${type}`);
    }
  }

  public static get(type: NodeType): Konva.Node {
    let pool = this.pools.get(type);
    if (!pool) {
      pool = [];
      this.pools.set(type, pool);
    }

    if (pool.length > 0) {
      const node = pool.pop()!;
      this.stats.reused++;
      
      // Reset node to clean state
      node.visible(true);
      node.listening(true);
      
      logger.log(`🔄 [NODE POOL] Reused ${type} node (pool size: ${pool.length})`);
      return node;
    }

    const newNode = this.createNode(type);
    logger.log(`🆕 [NODE POOL] Created new ${type} node`);
    return newNode;
  }

  public static release(type: NodeType, node: Konva.Node) {
    if (!node) return;
    
    // Reset properties to default state before pooling
    node.visible(false);
    node.listening(false);
    node.id('');
    node.x(0);
    node.y(0);
    
    // Type-specific resets
    if (type === 'Rect' || type === 'Circle') {
      if ('width' in node && typeof (node as any).width === 'function') {
        (node as any).width(0);
      }
      (node as any).height?.(0);
      (node as any).radius?.(0);
      (node as any).fill?.('');
      (node as any).stroke?.('');
    } else if (type === 'Text') {
      (node as any).text?.('');
      (node as any).fontSize?.(12);
    } else if (type === 'Group') {
      (node as Konva.Group).destroyChildren();
    }
    
    // Remove all event listeners
    node.off();

    const pool = this.pools.get(type);
    if (pool) {
      // Limit pool size to prevent memory bloat
      if (pool.length < 50) {
        pool.push(node);
        this.stats.released++;
        logger.log(`♻️ [NODE POOL] Released ${type} node to pool (size: ${pool.length})`);
      } else {
        logger.log(`🗑️ [NODE POOL] Pool full, destroying ${type} node`);
        node.destroy();
      }
    } else {
      this.pools.set(type, [node]);
      this.stats.released++;
    }
  }

  public static getStats() {
    return { ...this.stats };
  }

  public static clearPools() {
    this.pools.forEach((pool, type) => {
      pool.forEach(node => node.destroy());
      logger.log(`🧹 [NODE POOL] Cleared ${type} pool (${pool.length} nodes)`);
    });
    this.pools.clear();
    this.stats = { created: 0, reused: 0, released: 0 };
  }

  public static logStats() {
    const total = this.stats.created + this.stats.reused;
    const reuseRate = total > 0 ? ((this.stats.reused / total) * 100).toFixed(1) : '0';
    
    logger.log('📊 [NODE POOL] Performance Stats:', {
      created: this.stats.created,
      reused: this.stats.reused,
      released: this.stats.released,
      reuseRate: `${reuseRate}%`,
      poolSizes: Object.fromEntries(
        Array.from(this.pools.entries()).map(([type, pool]) => [type, pool.length])
      )
    });
  }
}

// Development mode: Log stats periodically
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    if (NodePool.getStats().created > 0) {
      NodePool.logStats();
    }
  }, 30000); // Every 30 seconds
}