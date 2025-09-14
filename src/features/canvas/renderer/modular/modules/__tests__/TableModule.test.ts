import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TableModule } from '../TableModule';
import { ModuleContext, CanvasSnapshot } from '../../types';
import { TableElement } from '../../../../types/enhanced.types';
import type { Layer } from 'konva/lib/Layer';

// Mock Konva
vi.mock('konva', () => ({
  default: {
    Group: class {
      private attrs: any = {};
      private children: any[] = [];

      constructor(config?: any) {
        Object.assign(this.attrs, config);
      }

      id() { return this.attrs.id; }
      x() { return this.attrs.x || 0; }
      y() { return this.attrs.y || 0; }
      width() { return this.attrs.width; }
      height() { return this.attrs.height; }
      name() { return this.attrs.name; }
      position(pos: any) { Object.assign(this.attrs, pos); }
      add(child: any) { this.children.push(child); }
      findOne(selector: string) { return null; }
      destroyChildren() { this.children = []; }
      destroy() { this.children = []; }
      setAttr(key: string, value: any) { this.attrs[key] = value; }
      on() {}
      getAbsoluteTransform() {
        return {
          copy() {
            return {
              invert() {
                return {
                  point(p: any) { return p; }
                };
              }
            };
          }
        };
      }
      getClientRect() {
        return { x: this.attrs.x || 0, y: this.attrs.y || 0, width: this.attrs.width || 0, height: this.attrs.height || 0 };
      }
    },
    Rect: class {
      constructor(config?: any) {}
      width() {}
      height() {}
      fill() {}
      stroke() {}
      strokeWidth() {}
    },
    Text: class {
      constructor(config?: any) {}
    },
    Line: class {
      constructor(config?: any) {}
    }
  }
}));

describe('TableModule', () => {
  let module: TableModule;
  let mockContext: ModuleContext;
  let mockSnapshot: CanvasSnapshot;

  beforeEach(async () => {
    module = new TableModule();

    // Mock context
    mockContext = {
      store: {
        subscribe: vi.fn(),
        getSnapshot: vi.fn(),
        selectElement: vi.fn(),
        eraseAtPoint: vi.fn(),
        eraseInPath: vi.fn(),
        startDrawing: vi.fn(),
        updateDrawing: vi.fn(),
        finishDrawing: vi.fn(),
      },
      konva: {
        getStage: vi.fn(() => null),
        getLayers: vi.fn(() => ({
          background: null,
          main: {
            add: vi.fn(),
            batchDraw: vi.fn(),
          } as unknown as Layer,
          preview: null,
          overlay: null,
        })),
      },
      overlay: {},
    };

    // Mock snapshot
    mockSnapshot = {
      elements: new Map(),
      selection: new Set(),
      viewport: { x: 0, y: 0, scale: 1 },
      history: {},
    };

    await module.init(mockContext);
  });

  it('should initialize without errors', async () => {
    expect(module).toBeDefined();
  });

  it('should handle empty snapshot', () => {
    expect(() => {
      module.sync(mockSnapshot);
    }).not.toThrow();
  });

  it('should create table nodes for table elements', () => {
    const tableElement: TableElement = {
      id: 'table-1' as any,
      type: 'table',
      x: 100,
      y: 200,
      width: 300,
      height: 200,
      rows: 3,
      cols: 4,
      borderColor: '#333',
      borderWidth: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    mockSnapshot.elements.set('table-1', tableElement);

    expect(() => {
      module.sync(mockSnapshot);
    }).not.toThrow();
  });

  it('should handle table elements with enhanced data', () => {
    const tableElement: TableElement = {
      id: 'table-2' as any,
      type: 'table',
      x: 50,
      y: 50,
      width: 400,
      height: 300,
      rows: 2,
      cols: 3,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      enhancedTableData: {
        rows: [{ height: 150 }, { height: 150 }],
        columns: [{ width: 133 }, { width: 133 }, { width: 134 }],
        cells: [
          [
            { content: 'Header 1' },
            { content: 'Header 2' },
            { content: 'Header 3' }
          ],
          [
            { content: 'Cell 1' },
            { content: 'Cell 2' },
            { content: 'Cell 3' }
          ]
        ],
        styling: {
          headerBackgroundColor: '#f0f0f0',
          alternateRowColor: '#fafafa',
          fontSize: 14,
          fontFamily: 'Arial',
        }
      }
    };

    mockSnapshot.elements.set('table-2', tableElement);

    expect(() => {
      module.sync(mockSnapshot);
    }).not.toThrow();
  });

  it('should remove table nodes when elements are deleted', () => {
    const tableElement: TableElement = {
      id: 'table-3' as any,
      type: 'table',
      x: 0,
      y: 0,
      width: 200,
      height: 100,
      rows: 2,
      cols: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Add table
    mockSnapshot.elements.set('table-3', tableElement);
    module.sync(mockSnapshot);

    // Remove table
    mockSnapshot.elements.delete('table-3');
    expect(() => {
      module.sync(mockSnapshot);
    }).not.toThrow();
  });

  it('should handle selection changes', () => {
    const tableElement: TableElement = {
      id: 'table-4' as any,
      type: 'table',
      x: 0,
      y: 0,
      width: 200,
      height: 100,
      rows: 2,
      cols: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    mockSnapshot.elements.set('table-4', tableElement);
    mockSnapshot.selection.add('table-4');

    expect(() => {
      module.sync(mockSnapshot);
    }).not.toThrow();
  });

  it('should destroy cleanly', () => {
    const tableElement: TableElement = {
      id: 'table-5' as any,
      type: 'table',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rows: 1,
      cols: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    mockSnapshot.elements.set('table-5', tableElement);
    module.sync(mockSnapshot);

    expect(() => {
      module.destroy();
    }).not.toThrow();
  });
});