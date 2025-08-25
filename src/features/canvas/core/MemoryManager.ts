/**
 * MemoryManager - Manages Konva node lifecycle and memory cleanup
 * 
 * This class provides centralized memory management for all Konva nodes,
 * event listeners, and other resources to prevent memory leaks.
 */

import type Konva from 'konva';
import { canvasLog } from '../utils/canvasLogger';

/**
 * Memory statistics
 */
export interface MemoryStats {
  totalNodes: number;
  totalListeners: number;
  totalDisposables: number;
  nodesByType: Map<string, number>;
  estimatedMemoryMB: number;
  lastCleanup: number;
  cleanupCount: number;
}

/**
 * Memory leak information
 */
export interface MemoryLeak {
  type: 'node' | 'listener' | 'disposable';
  id: string;
  description: string;
  createdAt: number;
  age: number;
  severity: 'low' | 'medium' | 'high';
}

/**
 * Event listener info
 */
interface ListenerInfo {
  target: any;
  event: string;
  handler: Function;
  options?: any;
  createdAt: number;
}

/**
 * Node info for tracking
 */
interface NodeInfo {
  node: Konva.Node;
  type: string;
  createdAt: number;
  lastAccessed: number;
  isTemporary: boolean;
  parentId?: string;
}

/**
 * Memory manager configuration
 */
export interface MemoryManagerConfig {
  enableLogging?: boolean;
  autoCleanup?: boolean;
  cleanupInterval?: number; // ms
  maxNodeAge?: number; // ms
  maxListenerAge?: number; // ms
  warnThreshold?: number; // number of nodes
  criticalThreshold?: number; // number of nodes
}

/**
 * Memory manager for canvas resources
 */
export class MemoryManager {
  private nodeRegistry: Map<string, NodeInfo> = new Map();
  private eventListeners: Map<string, ListenerInfo[]> = new Map();
  private disposables: Map<string, () => void> = new Map();
  private config: MemoryManagerConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private stats: MemoryStats;
  private disposed: boolean = false;
  
  constructor(config: MemoryManagerConfig = {}) {
    this.config = {
      enableLogging: false,
      autoCleanup: true,
      cleanupInterval: 60000, // 1 minute
      maxNodeAge: 300000, // 5 minutes for temporary nodes
      maxListenerAge: 600000, // 10 minutes
      warnThreshold: 1000,
      criticalThreshold: 5000,
      ...config
    };
    
    this.stats = {
      totalNodes: 0,
      totalListeners: 0,
      totalDisposables: 0,
      nodesByType: new Map(),
      estimatedMemoryMB: 0,
      lastCleanup: Date.now(),
      cleanupCount: 0
    };
    
    if (this.config.autoCleanup) {
      this.startAutoCleanup();
    }
    
    if (this.config.enableLogging) {
      canvasLog.debug('[MemoryManager] Initialized');
    }
  }
  
  /**
   * Register a Konva node for tracking
   */
  public registerNode(id: string, node: Konva.Node, isTemporary: boolean = false): void {
    if (this.disposed) return;
    
    if (this.nodeRegistry.has(id)) {
      canvasLog.warn(`[MemoryManager] Node ${id} already registered`);
      return;
    }
    
    const nodeType = node.getClassName();
    const nodeInfo: NodeInfo = {
      node,
      type: nodeType,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      isTemporary,
      parentId: node.parent?.id()
    };
    
    this.nodeRegistry.set(id, nodeInfo);
    this.updateNodeTypeCount(nodeType, 1);
    this.stats.totalNodes++;
    
    // Check thresholds
    this.checkMemoryThresholds();
    
    if (this.config.enableLogging) {
      canvasLog.debug(`[MemoryManager] Registered node: ${id} (${nodeType})`);
    }
  }
  
  /**
   * Unregister a node (without destroying it)
   */
  public unregisterNode(id: string): void {
    const nodeInfo = this.nodeRegistry.get(id);
    if (!nodeInfo) return;
    
    this.nodeRegistry.delete(id);
    this.updateNodeTypeCount(nodeInfo.type, -1);
    this.stats.totalNodes--;
    
    if (this.config.enableLogging) {
      canvasLog.debug(`[MemoryManager] Unregistered node: ${id}`);
    }
  }
  
  /**
   * Destroy and unregister a node
   */
  public destroyNode(id: string): void {
    const nodeInfo = this.nodeRegistry.get(id);
    if (!nodeInfo) return;
    
    try {
      // Destroy children first
      if (nodeInfo.node.hasChildren && nodeInfo.node.hasChildren()) {
        const children = (nodeInfo.node as any).getChildren();
        children?.forEach((child: Konva.Node) => {
          if (child.id()) {
            this.destroyNode(child.id());
          }
        });
      }
      
      // Remove from parent
      if (nodeInfo.node.parent) {
        nodeInfo.node.remove();
      }
      
      // Destroy the node
      if (!nodeInfo.node.isDestroyed()) {
        nodeInfo.node.destroy();
      }
      
      // Unregister
      this.unregisterNode(id);
      
      if (this.config.enableLogging) {
        canvasLog.debug(`[MemoryManager] Destroyed node: ${id}`);
      }
    } catch (error) {
      canvasLog.error(`[MemoryManager] Error destroying node ${id}:`, error);
    }
  }
  
  /**
   * Destroy all registered nodes
   */
  public destroyAllNodes(): void {
    const nodeIds = Array.from(this.nodeRegistry.keys());
    nodeIds.forEach(id => this.destroyNode(id));
    
    if (this.config.enableLogging) {
      canvasLog.debug(`[MemoryManager] Destroyed all nodes (${nodeIds.length})`);
    }
  }
  
  /**
   * Track an event listener
   */
  public trackEventListener(
    id: string,
    target: any,
    event: string,
    handler: Function,
    options?: any
  ): void {
    if (this.disposed) return;
    
    const listenerInfo: ListenerInfo = {
      target,
      event,
      handler,
      options,
      createdAt: Date.now()
    };
    
    if (!this.eventListeners.has(id)) {
      this.eventListeners.set(id, []);
    }
    
    this.eventListeners.get(id)!.push(listenerInfo);
    this.stats.totalListeners++;
    
    if (this.config.enableLogging) {
      canvasLog.debug(`[MemoryManager] Tracked listener: ${id} - ${event}`);
    }
  }
  
  /**
   * Remove tracked event listeners for an ID
   */
  public cleanupEventListeners(id: string): void {
    const listeners = this.eventListeners.get(id);
    if (!listeners) return;
    
    listeners.forEach(({ target, event, handler, options }) => {
      try {
        if (target.removeEventListener) {
          target.removeEventListener(event, handler, options);
        } else if (target.off) {
          target.off(event, handler);
        }
      } catch (error) {
        canvasLog.error(`[MemoryManager] Error removing listener:`, error);
      }
    });
    
    this.stats.totalListeners -= listeners.length;
    this.eventListeners.delete(id);
    
    if (this.config.enableLogging) {
      canvasLog.debug(`[MemoryManager] Cleaned up ${listeners.length} listeners for ${id}`);
    }
  }
  
  /**
   * Clean up all event listeners
   */
  public cleanupAllEventListeners(): void {
    const ids = Array.from(this.eventListeners.keys());
    ids.forEach(id => this.cleanupEventListeners(id));
  }
  
  /**
   * Register a disposable function
   */
  public registerDisposable(id: string, dispose: () => void): void {
    if (this.disposed) return;
    
    this.disposables.set(id, dispose);
    this.stats.totalDisposables++;
    
    if (this.config.enableLogging) {
      canvasLog.debug(`[MemoryManager] Registered disposable: ${id}`);
    }
  }
  
  /**
   * Run and remove a disposable
   */
  public runDisposable(id: string): void {
    const dispose = this.disposables.get(id);
    if (!dispose) return;
    
    try {
      dispose();
      this.disposables.delete(id);
      this.stats.totalDisposables--;
      
      if (this.config.enableLogging) {
        canvasLog.debug(`[MemoryManager] Ran disposable: ${id}`);
      }
    } catch (error) {
      canvasLog.error(`[MemoryManager] Error running disposable ${id}:`, error);
    }
  }
  
  /**
   * Run all disposables
   */
  public runAllDisposables(): void {
    const ids = Array.from(this.disposables.keys());
    ids.forEach(id => this.runDisposable(id));
  }
  
  /**
   * Get a node by ID
   */
  public getNode(id: string): Konva.Node | null {
    const nodeInfo = this.nodeRegistry.get(id);
    if (nodeInfo) {
      nodeInfo.lastAccessed = Date.now();
      return nodeInfo.node;
    }
    return null;
  }
  
  /**
   * Check if a node is registered
   */
  public hasNode(id: string): boolean {
    return this.nodeRegistry.has(id);
  }
  
  /**
   * Get memory statistics
   */
  public getMemoryStats(): MemoryStats {
    // Estimate memory usage
    let estimatedMemory = 0;
    
    this.nodeRegistry.forEach(nodeInfo => {
      // Rough estimation: base size + data size
      const baseSize = 0.001; // 1KB base per node
      const dataSize = this.estimateNodeDataSize(nodeInfo.node);
      estimatedMemory += baseSize + dataSize;
    });
    
    return {
      ...this.stats,
      estimatedMemoryMB: estimatedMemory,
      nodesByType: new Map(this.stats.nodesByType)
    };
  }
  
  /**
   * Detect potential memory leaks
   */
  public detectLeaks(): MemoryLeak[] {
    const leaks: MemoryLeak[] = [];
    const now = Date.now();
    
    // Check for old temporary nodes
    this.nodeRegistry.forEach((nodeInfo, id) => {
      const age = now - nodeInfo.createdAt;
      
      if (nodeInfo.isTemporary && age > this.config.maxNodeAge!) {
        leaks.push({
          type: 'node',
          id,
          description: `Temporary ${nodeInfo.type} node older than ${this.config.maxNodeAge}ms`,
          createdAt: nodeInfo.createdAt,
          age,
          severity: age > this.config.maxNodeAge! * 2 ? 'high' : 'medium'
        });
      }
    });
    
    // Check for old event listeners
    this.eventListeners.forEach((listeners, id) => {
      listeners.forEach(listener => {
        const age = now - listener.createdAt;
        
        if (age > this.config.maxListenerAge!) {
          leaks.push({
            type: 'listener',
            id,
            description: `Event listener (${listener.event}) older than ${this.config.maxListenerAge}ms`,
            createdAt: listener.createdAt,
            age,
            severity: age > this.config.maxListenerAge! * 2 ? 'high' : 'medium'
          });
        }
      });
    });
    
    return leaks;
  }
  
  /**
   * Perform cleanup of old resources
   */
  public cleanup(): void {
    if (this.disposed) return;
    
    const now = Date.now();
    const nodesToDestroy: string[] = [];
    
    // Clean up old temporary nodes
    this.nodeRegistry.forEach((nodeInfo, id) => {
      if (nodeInfo.isTemporary) {
        const age = now - nodeInfo.createdAt;
        if (age > this.config.maxNodeAge!) {
          nodesToDestroy.push(id);
        }
      }
    });
    
    nodesToDestroy.forEach(id => this.destroyNode(id));
    
    // Update stats
    this.stats.lastCleanup = now;
    this.stats.cleanupCount++;
    
    if (this.config.enableLogging && nodesToDestroy.length > 0) {
      canvasLog.debug(`[MemoryManager] Cleanup: removed ${nodesToDestroy.length} old nodes`);
    }
  }
  
  /**
   * Force garbage collection (if available)
   */
  public forceGarbageCollection(): void {
    if (typeof (global as any).gc === 'function') {
      (global as any).gc();
      canvasLog.debug('[MemoryManager] Forced garbage collection');
    }
  }
  
  /**
   * Dispose the memory manager
   */
  public dispose(): void {
    if (this.disposed) return;
    
    if (this.config.enableLogging) {
      canvasLog.debug('[MemoryManager] Disposing');
    }
    
    // Stop auto cleanup
    this.stopAutoCleanup();
    
    // Clean up all resources
    this.destroyAllNodes();
    this.cleanupAllEventListeners();
    this.runAllDisposables();
    
    // Clear registries
    this.nodeRegistry.clear();
    this.eventListeners.clear();
    this.disposables.clear();
    
    this.disposed = true;
  }
  
  // Private helper methods
  
  private startAutoCleanup(): void {
    if (this.cleanupTimer) return;
    
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval!);
  }
  
  private stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
  
  private updateNodeTypeCount(type: string, delta: number): void {
    const current = this.stats.nodesByType.get(type) || 0;
    const newCount = current + delta;
    
    if (newCount <= 0) {
      this.stats.nodesByType.delete(type);
    } else {
      this.stats.nodesByType.set(type, newCount);
    }
  }
  
  private estimateNodeDataSize(node: Konva.Node): number {
    // Rough estimation based on node type and properties
    let size = 0;
    
    // Check for image data
    if ((node as any).image) {
      const image = (node as any).image();
      if (image) {
        size += (image.width * image.height * 4) / (1024 * 1024); // RGBA bytes to MB
      }
    }
    
    // Check for path data
    if ((node as any).data) {
      const data = (node as any).data();
      if (typeof data === 'string') {
        size += data.length / (1024 * 1024); // String length to MB
      }
    }
    
    // Check for points (lines, polygons)
    if ((node as any).points) {
      const points = (node as any).points();
      if (Array.isArray(points)) {
        size += (points.length * 8) / (1024 * 1024); // 8 bytes per coordinate
      }
    }
    
    return size;
  }
  
  private checkMemoryThresholds(): void {
    const nodeCount = this.nodeRegistry.size;
    
    if (nodeCount >= this.config.criticalThreshold!) {
      canvasLog.error(`[MemoryManager] CRITICAL: ${nodeCount} nodes registered (threshold: ${this.config.criticalThreshold})`);
      // Could trigger emergency cleanup here
      this.cleanup();
    } else if (nodeCount >= this.config.warnThreshold!) {
      canvasLog.warn(`[MemoryManager] WARNING: ${nodeCount} nodes registered (threshold: ${this.config.warnThreshold})`);
    }
  }
}