import { CanvasElement, CanvasState, HistoryState } from '../types/canvas';

// Storage interface for different implementations
export interface StorageAdapter {
  init(): Promise<void>;
  close(): Promise<void>;
  
  // Canvas data
  saveCanvas(canvasId: string, data: CanvasData): Promise<void>;
  loadCanvas(canvasId: string): Promise<CanvasData | null>;
  deleteCanvas(canvasId: string): Promise<void>;
  listCanvases(): Promise<CanvasMetadata[]>;
  
  // Elements
  saveElement(canvasId: string, element: CanvasElement): Promise<void>;
  saveElements(canvasId: string, elements: CanvasElement[]): Promise<void>;
  loadElements(canvasId: string): Promise<CanvasElement[]>;
  deleteElement(canvasId: string, elementId: string): Promise<void>;
  
  // History
  saveHistoryState(canvasId: string, state: HistoryState): Promise<void>;
  loadHistory(canvasId: string, limit?: number): Promise<HistoryState[]>;
  clearHistory(canvasId: string): Promise<void>;
  
  // Autosave
  enableAutosave(canvasId: string, interval: number): void;
  disableAutosave(canvasId: string): void;
  
  // Backup and sync
  exportCanvas(canvasId: string): Promise<ExportData>;
  importCanvas(data: ExportData): Promise<string>;
  
  // Settings
  saveSetting(key: string, value: any): Promise<void>;
  loadSetting<T>(key: string, defaultValue?: T): Promise<T>;
  
  // Cleanup
  optimize(): Promise<void>;
  getStorageInfo(): Promise<StorageInfo>;
}

export interface CanvasData {
  id: string;
  name: string;
  description?: string;
  elements: Record<string, CanvasElement>;
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  settings: {
    gridSize: number;
    snapToGrid: boolean;
    showGrid: boolean;
    backgroundColor: string;
  };
  metadata: {
    createdAt: number;
    modifiedAt: number;
    version: string;
    author?: string;
    tags?: string[];
  };
}

export interface CanvasMetadata {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  createdAt: number;
  modifiedAt: number;
  elementCount: number;
  size: number;
}

export interface ExportData {
  version: string;
  canvas: CanvasData;
  history?: HistoryState[];
  settings?: Record<string, any>;
  assets?: AssetData[];
}

export interface AssetData {
  id: string;
  type: 'image' | 'font' | 'video' | 'audio';
  name: string;
  data: ArrayBuffer;
  metadata: Record<string, any>;
}

export interface StorageInfo {
  totalSize: number;
  usedSize: number;
  canvasCount: number;
  elementCount: number;
  historyCount: number;
  version: string;
}

// IndexedDB implementation for web
export class IndexedDBStorage implements StorageAdapter {
  private db: IDBDatabase | null = null;
  private dbName = 'FigmaCanvas';
  private version = 1;
  private autosaveIntervals = new Map<string, NodeJS.Timeout>();

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Canvas store
        if (!db.objectStoreNames.contains('canvases')) {
          const canvasStore = db.createObjectStore('canvases', { keyPath: 'id' });
          canvasStore.createIndex('name', 'name');
          canvasStore.createIndex('modifiedAt', 'metadata.modifiedAt');
        }

        // Elements store
        if (!db.objectStoreNames.contains('elements')) {
          const elementStore = db.createObjectStore('elements', { keyPath: ['canvasId', 'id'] });
          elementStore.createIndex('canvasId', 'canvasId');
          elementStore.createIndex('type', 'type');
        }

        // History store
        if (!db.objectStoreNames.contains('history')) {
          const historyStore = db.createObjectStore('history', { keyPath: ['canvasId', 'id'] });
          historyStore.createIndex('canvasId', 'canvasId');
          historyStore.createIndex('timestamp', 'timestamp');
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        // Assets store
        if (!db.objectStoreNames.contains('assets')) {
          const assetStore = db.createObjectStore('assets', { keyPath: 'id' });
          assetStore.createIndex('type', 'type');
          assetStore.createIndex('canvasId', 'canvasId');
        }
      };
    });
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    
    // Clear autosave intervals
    this.autosaveIntervals.forEach(interval => clearInterval(interval));
    this.autosaveIntervals.clear();
  }

  async saveCanvas(canvasId: string, data: CanvasData): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['canvases'], 'readwrite');
      const store = transaction.objectStore('canvases');
      
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async loadCanvas(canvasId: string): Promise<CanvasData | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['canvases'], 'readonly');
      const store = transaction.objectStore('canvases');
      
      const request = store.get(canvasId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteCanvas(canvasId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['canvases', 'elements', 'history'], 'readwrite');
      
      // Delete canvas
      const canvasStore = transaction.objectStore('canvases');
      canvasStore.delete(canvasId);
      
      // Delete elements
      const elementStore = transaction.objectStore('elements');
      const elementIndex = elementStore.index('canvasId');
      elementIndex.openCursor(IDBKeyRange.only(canvasId)).onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
      
      // Delete history
      const historyStore = transaction.objectStore('history');
      const historyIndex = historyStore.index('canvasId');
      historyIndex.openCursor(IDBKeyRange.only(canvasId)).onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async listCanvases(): Promise<CanvasMetadata[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['canvases'], 'readonly');
      const store = transaction.objectStore('canvases');
      
      const request = store.getAll();
      request.onsuccess = () => {
        const canvases = request.result.map((canvas: CanvasData) => ({
          id: canvas.id,
          name: canvas.name,
          description: canvas.description,
          createdAt: canvas.metadata.createdAt,
          modifiedAt: canvas.metadata.modifiedAt,
          elementCount: Object.keys(canvas.elements).length,
          size: JSON.stringify(canvas).length
        }));
        resolve(canvases);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveElement(canvasId: string, element: CanvasElement): Promise<void> {
    return this.saveElements(canvasId, [element]);
  }

  async saveElements(canvasId: string, elements: CanvasElement[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['elements'], 'readwrite');
      const store = transaction.objectStore('elements');
      
      elements.forEach(element => {
        store.put({ ...element, canvasId });
      });
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async loadElements(canvasId: string): Promise<CanvasElement[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['elements'], 'readonly');
      const store = transaction.objectStore('elements');
      const index = store.index('canvasId');
      
      const request = index.getAll(canvasId);
      request.onsuccess = () => {
        const elements = request.result.map(item => {
          const { canvasId, ...element } = item;
          return element;
        });
        resolve(elements);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteElement(canvasId: string, elementId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['elements'], 'readwrite');
      const store = transaction.objectStore('elements');
      
      const request = store.delete([canvasId, elementId]);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveHistoryState(canvasId: string, state: HistoryState): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['history'], 'readwrite');
      const store = transaction.objectStore('history');
      
      const request = store.put({ ...state, canvasId });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async loadHistory(canvasId: string, limit = 50): Promise<HistoryState[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['history'], 'readonly');
      const store = transaction.objectStore('history');
      const index = store.index('canvasId');
      
      const request = index.getAll(canvasId);
      request.onsuccess = () => {
        const history = request.result
          .map(item => {
            const { canvasId, ...state } = item;
            return state;
          })
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, limit);
        resolve(history);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearHistory(canvasId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['history'], 'readwrite');
      const store = transaction.objectStore('history');
      const index = store.index('canvasId');
      
      index.openCursor(IDBKeyRange.only(canvasId)).onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  enableAutosave(canvasId: string, interval: number): void {
    this.disableAutosave(canvasId);
    
    // Note: In a real implementation, this would need to be connected to the canvas store
    // For now, it's just a placeholder
    const intervalId = setInterval(() => {
      // Auto-save logic would go here
      console.log(`Autosaving canvas ${canvasId}`);
    }, interval);
    
    this.autosaveIntervals.set(canvasId, intervalId);
  }

  disableAutosave(canvasId: string): void {
    const intervalId = this.autosaveIntervals.get(canvasId);
    if (intervalId) {
      clearInterval(intervalId);
      this.autosaveIntervals.delete(canvasId);
    }
  }

  async exportCanvas(canvasId: string): Promise<ExportData> {
    const canvas = await this.loadCanvas(canvasId);
    if (!canvas) throw new Error('Canvas not found');
    
    const history = await this.loadHistory(canvasId);
    
    return {
      version: '1.0.0',
      canvas,
      history
    };
  }

  async importCanvas(data: ExportData): Promise<string> {
    const canvasId = data.canvas.id;
    
    await this.saveCanvas(canvasId, data.canvas);
    
    if (data.history) {
      for (const state of data.history) {
        await this.saveHistoryState(canvasId, state);
      }
    }
    
    return canvasId;
  }

  async saveSetting(key: string, value: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      
      const request = store.put({ key, value });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async loadSetting<T>(key: string, defaultValue?: T): Promise<T> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : defaultValue);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async optimize(): Promise<void> {
    // IndexedDB doesn't need manual optimization
    // This could implement cleanup of old history entries, etc.
  }

  async getStorageInfo(): Promise<StorageInfo> {
    if (!this.db) throw new Error('Database not initialized');

    const canvases = await this.listCanvases();
    
    return {
      totalSize: 0, // Would need to calculate actual size
      usedSize: 0,
      canvasCount: canvases.length,
      elementCount: canvases.reduce((sum, canvas) => sum + canvas.elementCount, 0),
      historyCount: 0, // Would need to count all history entries
      version: this.version.toString()
    };
  }
}

// SQLCipher storage adapter (for Tauri/desktop app)
export class SQLCipherStorage implements StorageAdapter {
  private dbPath: string;
  private password: string;

  constructor(dbPath: string, password: string) {
    this.dbPath = dbPath;
    this.password = password;
  }

  async init(): Promise<void> {
    // Implementation would use Tauri's SQL plugin with SQLCipher
    // This is a placeholder for the interface
    throw new Error('SQLCipher storage not implemented in web version');
  }

  async close(): Promise<void> {
    // Close database connection
  }

  async saveCanvas(canvasId: string, data: CanvasData): Promise<void> {
    // SQL implementation
  }

  async loadCanvas(canvasId: string): Promise<CanvasData | null> {
    // SQL implementation
    return null;
  }

  async deleteCanvas(canvasId: string): Promise<void> {
    // SQL implementation
  }

  async listCanvases(): Promise<CanvasMetadata[]> {
    // SQL implementation
    return [];
  }

  async saveElement(canvasId: string, element: CanvasElement): Promise<void> {
    // SQL implementation
  }

  async saveElements(canvasId: string, elements: CanvasElement[]): Promise<void> {
    // SQL implementation
  }

  async loadElements(canvasId: string): Promise<CanvasElement[]> {
    // SQL implementation
    return [];
  }

  async deleteElement(canvasId: string, elementId: string): Promise<void> {
    // SQL implementation
  }

  async saveHistoryState(canvasId: string, state: HistoryState): Promise<void> {
    // SQL implementation
  }

  async loadHistory(canvasId: string, limit?: number): Promise<HistoryState[]> {
    // SQL implementation
    return [];
  }

  async clearHistory(canvasId: string): Promise<void> {
    // SQL implementation
  }

  enableAutosave(canvasId: string, interval: number): void {
    // Implementation
  }

  disableAutosave(canvasId: string): void {
    // Implementation
  }

  async exportCanvas(canvasId: string): Promise<ExportData> {
    // SQL implementation
    throw new Error('Not implemented');
  }

  async importCanvas(data: ExportData): Promise<string> {
    // SQL implementation
    return '';
  }

  async saveSetting(key: string, value: any): Promise<void> {
    // SQL implementation
  }

  async loadSetting<T>(key: string, defaultValue?: T): Promise<T> {
    // SQL implementation
    return defaultValue as T;
  }

  async optimize(): Promise<void> {
    // SQL VACUUM, etc.
  }

  async getStorageInfo(): Promise<StorageInfo> {
    // SQL implementation
    return {
      totalSize: 0,
      usedSize: 0,
      canvasCount: 0,
      elementCount: 0,
      historyCount: 0,
      version: '1.0.0'
    };
  }
}

// Storage manager that handles switching between implementations
export class StorageManager {
  private adapter: StorageAdapter;
  private autosaveEnabled = false;
  private autosaveInterval = 30000; // 30 seconds

  constructor(adapter: StorageAdapter) {
    this.adapter = adapter;
  }

  async init(): Promise<void> {
    await this.adapter.init();
  }

  async close(): Promise<void> {
    await this.adapter.close();
  }

  getAdapter(): StorageAdapter {
    return this.adapter;
  }

  async switchAdapter(newAdapter: StorageAdapter): Promise<void> {
    await this.adapter.close();
    this.adapter = newAdapter;
    await this.adapter.init();
  }

  // Convenience methods that delegate to the adapter
  async saveCanvas(canvasId: string, data: CanvasData): Promise<void> {
    return this.adapter.saveCanvas(canvasId, data);
  }

  async loadCanvas(canvasId: string): Promise<CanvasData | null> {
    return this.adapter.loadCanvas(canvasId);
  }

  async listCanvases(): Promise<CanvasMetadata[]> {
    return this.adapter.listCanvases();
  }

  async enableAutosave(canvasId: string): Promise<void> {
    this.adapter.enableAutosave(canvasId, this.autosaveInterval);
    this.autosaveEnabled = true;
  }

  async disableAutosave(canvasId: string): Promise<void> {
    this.adapter.disableAutosave(canvasId);
    this.autosaveEnabled = false;
  }

  setAutosaveInterval(interval: number): void {
    this.autosaveInterval = interval;
  }

  getAutosaveInterval(): number {
    return this.autosaveInterval;
  }

  isAutosaveEnabled(): boolean {
    return this.autosaveEnabled;
  }
}

// Factory function to create storage adapter based on environment
export const createStorageAdapter = (
  type: 'indexeddb' | 'sqlcipher',
  options?: { dbPath?: string; password?: string }
): StorageAdapter => {
  switch (type) {
    case 'indexeddb':
      return new IndexedDBStorage();
    case 'sqlcipher':
      if (!options?.dbPath || !options?.password) {
        throw new Error('SQLCipher requires dbPath and password');
      }
      return new SQLCipherStorage(options.dbPath, options.password);
    default:
      throw new Error(`Unknown storage type: ${type}`);
  }
};

// Default storage manager instance
export const defaultStorageManager = new StorageManager(
  createStorageAdapter('indexeddb')
);
