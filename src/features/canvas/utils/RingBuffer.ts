/**
 * RingBuffer Implementation for Canvas History
 * 
 * A circular buffer with a fixed maximum size that automatically
 * overwrites the oldest entries when the buffer is full.
 * 
 * This is used for the canvas history to prevent unbounded memory growth
 * while maintaining a fixed number of undo/redo operations.
 */

export class RingBuffer<T> {
  private buffer: (T | undefined)[];
  private head: number = 0;
  private tail: number = 0;
  private size: number = 0;
  private readonly capacity: number;

  constructor(capacity: number) {
    if (capacity <= 0) {
      throw new Error('RingBuffer capacity must be greater than 0');
    }
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }

  /**
   * Add an item to the buffer
   * If the buffer is full, the oldest item is overwritten
   */
  push(item: T): void {
    this.buffer[this.tail] = item;
    
    if (this.size < this.capacity) {
      this.size++;
    } else {
      // Buffer is full, move head forward
      this.head = (this.head + 1) % this.capacity;
    }
    
    this.tail = (this.tail + 1) % this.capacity;
  }

  /**
   * Remove and return the most recent item
   */
  pop(): T | undefined {
    if (this.size === 0) {
      return undefined;
    }

    this.tail = (this.tail - 1 + this.capacity) % this.capacity;
    const item = this.buffer[this.tail];
    this.buffer[this.tail] = undefined;
    this.size--;

    return item;
  }

  /**
   * Get an item at a specific index (0 is oldest, size-1 is newest)
   */
  get(index: number): T | undefined {
    if (index < 0 || index >= this.size) {
      return undefined;
    }

    const actualIndex = (this.head + index) % this.capacity;
    return this.buffer[actualIndex];
  }

  /**
   * Set an item at a specific index
   */
  set(index: number, item: T): boolean {
    if (index < 0 || index >= this.size) {
      return false;
    }

    const actualIndex = (this.head + index) % this.capacity;
    this.buffer[actualIndex] = item;
    return true;
  }

  /**
   * Get the current size of the buffer
   */
  getSize(): number {
    return this.size;
  }

  /**
   * Get the maximum capacity of the buffer
   */
  getCapacity(): number {
    return this.capacity;
  }

  /**
   * Check if the buffer is empty
   */
  isEmpty(): boolean {
    return this.size === 0;
  }

  /**
   * Check if the buffer is full
   */
  isFull(): boolean {
    return this.size === this.capacity;
  }

  /**
   * Clear the buffer
   */
  clear(): void {
    this.buffer = new Array(this.capacity);
    this.head = 0;
    this.tail = 0;
    this.size = 0;
  }

  /**
   * Convert the buffer to an array (oldest to newest)
   */
  toArray(): T[] {
    const result: T[] = [];
    
    for (let i = 0; i < this.size; i++) {
      const item = this.get(i);
      if (item !== undefined) {
        result.push(item);
      }
    }
    
    return result;
  }

  /**
   * Iterate over the buffer (oldest to newest)
   */
  forEach(callback: (item: T, index: number) => void): void {
    for (let i = 0; i < this.size; i++) {
      const item = this.get(i);
      if (item !== undefined) {
        callback(item, i);
      }
    }
  }

  /**
   * Find an item in the buffer
   */
  find(predicate: (item: T, index: number) => boolean): T | undefined {
    for (let i = 0; i < this.size; i++) {
      const item = this.get(i);
      if (item !== undefined && predicate(item, i)) {
        return item;
      }
    }
    return undefined;
  }

  /**
   * Remove items from the end of the buffer (newest items)
   * This is useful for removing redo history when a new action is performed
   */
  truncate(newSize: number): void {
    if (newSize < 0 || newSize > this.size) {
      return;
    }

    // Remove items from the tail backwards
    while (this.size > newSize) {
      this.pop();
    }
  }

  /**
   * Get a slice of the buffer as an array
   */
  slice(start: number, end?: number): T[] {
    const actualEnd = end ?? this.size;
    const result: T[] = [];

    for (let i = start; i < actualEnd && i < this.size; i++) {
      const item = this.get(i);
      if (item !== undefined) {
        result.push(item);
      }
    }

    return result;
  }

  /**
   * Get statistics about the buffer
   */
  getStats(): {
    size: number;
    capacity: number;
    utilization: number;
    head: number;
    tail: number;
  } {
    return {
      size: this.size,
      capacity: this.capacity,
      utilization: this.size / this.capacity,
      head: this.head,
      tail: this.tail
    };
  }
}

// Type-specific RingBuffer for History entries
export interface HistoryEntry {
  id: string;
  timestamp: number;
  action: string;
  patches: any[];
  inversePatches: any[];
  metadata?: {
    elementIds?: string[];
    operationType?: 'create' | 'update' | 'delete' | 'move' | 'format';
    affectedCount?: number;
  };
}

export class HistoryRingBuffer extends RingBuffer<HistoryEntry> {
  constructor(capacity: number = 50) {
    super(capacity);
  }

  /**
   * Get the total memory usage estimate for all history entries
   */
  getMemoryUsage(): number {
    let totalSize = 0;
    
    this.forEach(entry => {
      // Rough estimate: 100 bytes base + patches size
      totalSize += 100;
      totalSize += JSON.stringify(entry.patches).length;
      totalSize += JSON.stringify(entry.inversePatches).length;
    });
    
    return totalSize;
  }

  /**
   * Find entries within a time range
   */
  findEntriesInTimeRange(startTime: number, endTime: number): HistoryEntry[] {
    const entries: HistoryEntry[] = [];
    
    this.forEach(entry => {
      if (entry.timestamp >= startTime && entry.timestamp <= endTime) {
        entries.push(entry);
      }
    });
    
    return entries;
  }

  /**
   * Compact consecutive similar operations
   */
  compact(): void {
    const compacted: HistoryEntry[] = [];
    let lastEntry: HistoryEntry | null = null;

    this.forEach(entry => {
      if (
        lastEntry &&
        lastEntry.action === entry.action &&
        entry.timestamp - lastEntry.timestamp < 1000 && // Within 1 second
        lastEntry.metadata?.operationType === entry.metadata?.operationType
      ) {
        // Merge with previous entry
        lastEntry.patches.push(...entry.patches);
        lastEntry.inversePatches.unshift(...entry.inversePatches);
        lastEntry.timestamp = entry.timestamp;
      } else {
        // Keep as separate entry
        compacted.push(entry);
        lastEntry = entry;
      }
    });

    // Rebuild the buffer with compacted entries
    this.clear();
    compacted.forEach(entry => this.push(entry));
  }
}
