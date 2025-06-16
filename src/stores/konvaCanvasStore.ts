// src/stores/konvaCanvasStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { ConnectorEndpoint, ConnectorStyle } from '../types/connector';
import { SectionElement, isElementInSection, convertAbsoluteToRelative, sectionTemplates } from '../types/section';
import type { RichTextSegment } from '../types/richText';
import { triggerLayerRedraw, getStageRef } from '../utils/canvasRedrawUtils';

// Re-export for backward compatibility
export type { RichTextSegment };

/**
 * Performance-optimized helper function to compare the styles of two rich text segments.
 * Uses early returns for better performance.
 */
const areStylesEqual = (seg1: Omit<RichTextSegment, 'text'>, seg2: Omit<RichTextSegment, 'text'>): boolean => {
  if (seg1.fontSize !== seg2.fontSize) return false;
  if (seg1.fontFamily !== seg2.fontFamily) return false;
  if (seg1.fontStyle !== seg2.fontStyle) return false;
  if (seg1.fontWeight !== seg2.fontWeight) return false;
  if (seg1.textDecoration !== seg2.textDecoration) return false;
  if (seg1.fill !== seg2.fill) return false;
  if (seg1.url !== seg2.url) return false;
  if (seg1.textAlign !== seg2.textAlign) return false;
  if (seg1.listType !== seg2.listType) return false;
  return true;
};

/**
 * Optimized segment merging with validation and performance enhancements.
 * Includes memory optimization for large documents.
 */
const mergeSegments = (segments: RichTextSegment[]): RichTextSegment[] => {
  if (!segments || segments.length === 0) return [];
  if (segments.length === 1) return segments[0].text ? segments : [];

  const merged: RichTextSegment[] = [];
  let currentSegment = { ...segments[0] };

  // Skip empty segments at the start
  if (!currentSegment.text) {
    let i = 1;
    while (i < segments.length && !segments[i].text) {
      i++;
    }
    if (i >= segments.length) return [];
    currentSegment = { ...segments[i] };
  }

  for (let i = 1; i < segments.length; i++) {
    const nextSegment = segments[i];
    
    // Skip empty segments
    if (!nextSegment.text) continue;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { text: currentText, ...currentStyle } = currentSegment;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { text: nextText, ...nextStyle } = nextSegment;

    if (areStylesEqual(currentStyle, nextStyle)) {
      // Merge segments with identical styles
      currentSegment.text += nextSegment.text;
    } else {
      // Push current segment and start new one
      if (currentSegment.text) {
        merged.push(currentSegment);
      }
      currentSegment = { ...nextSegment };
    }
  }

  // Add final segment if it has text
  if (currentSegment.text) {
    merged.push(currentSegment);
  }

  return merged;
};

/**
 * Validates rich text segments for data integrity.
 */
const validateRichTextSegments = (segments: RichTextSegment[]): boolean => {
  if (!Array.isArray(segments)) return false;
  
  return segments.every(segment => {
    if (!segment || typeof segment.text !== 'string') return false;
    
    // Validate optional properties have correct types
    if (segment.fontSize !== undefined && (typeof segment.fontSize !== 'number' || segment.fontSize <= 0)) return false;
    if (segment.fontFamily !== undefined && typeof segment.fontFamily !== 'string') return false;
    if (segment.fontStyle !== undefined && typeof segment.fontStyle !== 'string') return false;
    if (segment.fontWeight !== undefined && typeof segment.fontWeight !== 'string') return false;
    if (segment.textDecoration !== undefined && typeof segment.textDecoration !== 'string') return false;
    if (segment.fill !== undefined && typeof segment.fill !== 'string') return false;
    if (segment.url !== undefined && typeof segment.url !== 'string') return false;
    if (segment.textAlign !== undefined && !['left', 'center', 'right'].includes(segment.textAlign)) return false;
    if (segment.listType !== undefined && !['none', 'bullet', 'numbered'].includes(segment.listType)) return false;
    
    return true;
  });
};

/**
 * Optimized text format application with memoization for repeated operations.
 */
const memoizedFormatCache = new Map<string, RichTextSegment[]>();
const MAX_CACHE_SIZE = 100;

const getCacheKey = (segments: RichTextSegment[], formatType: string, value: any, selection: { start: number; end: number }): string => {
  return `${segments.length}-${formatType}-${JSON.stringify(value)}-${selection.start}-${selection.end}`;
};

const clearFormatCache = () => {
  if (memoizedFormatCache.size > MAX_CACHE_SIZE) {
    // Clear half the cache to prevent memory bloat
    const entries = Array.from(memoizedFormatCache.entries());
    entries.slice(0, Math.floor(entries.length / 2)).forEach(([key]) => {
      memoizedFormatCache.delete(key);
    });
  }
};


// Enhanced Table Data Model for FigJam-style functionality
export interface TableCell {
  id: string;
  text?: string; // Plain text content
  richTextSegments?: RichTextSegment[]; // Rich text content
  containedElementIds: string[]; // IDs of canvas elements inside this cell
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  padding?: number;
  isHeader?: boolean;
}

export interface TableRow {
  id: string;
  height: number;
  minHeight?: number;
  maxHeight?: number;
  isResizable?: boolean;
  backgroundColor?: string;
  isHeader?: boolean;
}

export interface TableColumn {
  id: string;
  width: number;
  minWidth?: number;
  maxWidth?: number;
  isResizable?: boolean;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right';
}

export interface TableSelection {
  type: 'cell' | 'row' | 'column' | 'table';
  cellIds?: string[];
  rowIds?: string[];
  columnIds?: string[];
  startCell?: { row: number; col: number };
  endCell?: { row: number; col: number };
}

export interface EnhancedTableData {
  rows: TableRow[];
  columns: TableColumn[];
  cells: TableCell[][]; // 2D array of cells [row][col]
  selection?: TableSelection;
  showGridLines?: boolean;
  cornerRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  defaultCellPadding?: number;
  autoResizeRows?: boolean;
  allowDragAndDrop?: boolean;
  keyboardNavigationEnabled?: boolean;
}

export interface CanvasElement {
  id: string;
  type: 'text' | 'rectangle' | 'circle' | 'line' | 'arrow' | 'pen' | 'triangle' | 'star' | 'sticky-note' | 'rich-text' | 'image' | 'connector' | 'section' | 'table';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  innerRadius?: number;
  numPoints?: number;
  text?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  points?: number[];
  sides?: number; // for star
  backgroundColor?: string; // for sticky notes
  textColor?: string; // for sticky notes
  fontSize?: number; // Default font size for text-based elements
  fontFamily?: string; // Default font family for text-based elements
  fontStyle?: string; // Font style (normal, italic, bold, bold italic)
  textAlign?: 'left' | 'center' | 'right'; // Text alignment
  textDecoration?: string; // Text decoration (underline, line-through, etc.)
  listType?: string; // List type (none, bullet, numbered)
  isHyperlink?: boolean; // Whether the text is a hyperlink
  hyperlinkUrl?: string; // URL for hyperlinks
  segments?: RichTextSegment[]; // For 'rich-text' elements
  richTextSegments?: RichTextSegment[]; // For text and sticky-note elements with rich formatting
  imageUrl?: string; // For image elements
  arrowStart?: boolean; // For lines/arrows
  arrowEnd?: boolean; // For lines/arrows
  color?: string; // General color property for shapes
  rotation?: number; // Rotation angle in degrees
  
  // Connector-specific properties
  subType?: 'line' | 'arrow'; // For connector elements
  startPoint?: ConnectorEndpoint; // For connector elements
  endPoint?: ConnectorEndpoint; // For connector elements
  connectorStyle?: ConnectorStyle; // For connector elements
  pathPoints?: number[]; // Calculated path for connector elements
  
  // Section membership - NEW field for tracking which section contains this element
  sectionId?: string | null;
  
  // Lock and visibility states
  isLocked?: boolean;
  isHidden?: boolean;
  
  // Table-specific properties
  rows?: number;
  cols?: number;
  cellWidth?: number;
  cellHeight?: number;
  tableData?: string[][];
  borderColor?: string;
  headerBackgroundColor?: string;
  cellBackgroundColor?: string;
  enhancedTableData?: EnhancedTableData;
}

interface HistoryState {
  elements: Record<string, CanvasElement>;
  timestamp: number;
  action: string;
}

interface Canvas {
  id: string;
  name: string;
  elements: Record<string, CanvasElement>;
  sections: Record<string, SectionElement>;
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
}

interface CanvasState {
  // Multiple canvases support
  canvases: Record<string, Canvas>;
  currentCanvasId: string | null;
  
  // Current canvas state
  elements: Record<string, CanvasElement>;
  sections: Record<string, SectionElement>;
  selectedTool: string;
  selectedElementId: string | null;
  editingTextId: string | null; // ID of the text element currently being edited
  canvasSize: { width: number; height: number };
  
  // Canvas redraw management
  canvasRedrawRequired: boolean;
  stageRefs: Set<React.RefObject<any>>;
  
  // History management
  history: HistoryState[];
  historyIndex: number;
  maxHistorySize: number;
  
  // Resize debouncing
  resizeTimeout?: NodeJS.Timeout;
  
  // Actions
  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  setSelectedTool: (tool: string) => void;
  setSelectedElement: (id: string | null) => void;
  clearCanvas: () => void;
  exportCanvas: () => CanvasElement[];
  importCanvas: (elements: CanvasElement[]) => void;
  
  // History actions
  addToHistory: (action: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;

  // Rich text formatting with enhanced error handling
  applyTextFormat: (elementId: string, format: Partial<RichTextSegment>, selection: { start: number; end: number }) => void;
  validateRichTextElement: (elementId: string) => boolean;
  optimizeRichTextSegments: (elementId: string) => void;

  // Inline text editing
  setEditingTextId: (id: string | null) => void;
  updateElementText: (elementId: string, newText: string) => void;

  // Section operations
  createSection: (section: SectionElement) => void;
  createSectionFromTemplate: (templateId: string, position: { x: number; y: number }) => void;
  updateSection: (id: string, updates: Partial<SectionElement>) => void;
  deleteSection: (id: string) => void;
  addElementToSection: (elementId: string, sectionId: string) => void;
  removeElementFromSection: (elementId: string) => void;
  getSectionContainingElement: (elementId: string) => SectionElement | null;
  moveSection: (sectionId: string, deltaX: number, deltaY: number) => void;
  toggleSectionVisibility: (sectionId: string) => void;
  lockSection: (sectionId: string, lockBackground?: boolean) => void;
  updateElementSection: (elementId: string, newX: number, newY: number) => void;
  handleSectionDragEnd: (sectionId: string, newPosition: { x: number; y: number }) => void;
  
  // NEW: Set element's section membership with optional relative position
  setElementSection: (elementId: string, sectionId: string | null, newRelativePos?: { x: number; y: number }) => void;
  
  // Helper methods for section management
  getElementsBySection: (sectionId: string) => CanvasElement[];
  getFreeElements: () => CanvasElement[]; // Elements not in any section
  
  // Enhanced Table Operations
  createEnhancedTable: (x: number, y: number, rows?: number, cols?: number) => string;
  updateTableCell: (tableId: string, rowIndex: number, colIndex: number, updates: Partial<TableCell>) => void;
  addTableRow: (tableId: string, insertIndex?: number) => void;
  addTableColumn: (tableId: string, insertIndex?: number) => void;
  removeTableRow: (tableId: string, rowIndex: number) => void;
  removeTableColumn: (tableId: string, colIndex: number) => void;
  resizeTableRow: (tableId: string, rowIndex: number, newHeight: number) => void;
  resizeTableColumn: (tableId: string, colIndex: number, newWidth: number) => void;
  setTableSelection: (tableId: string, selection: TableSelection | null) => void;
  addElementToTableCell: (tableId: string, rowIndex: number, colIndex: number, elementId: string) => void;

  // Multiple canvas management
  createCanvas: (name: string) => string;
  switchCanvas: (canvasId: string) => void;
  deleteCanvas: (canvasId: string) => void;
  renameCanvas: (canvasId: string, newName: string) => void;
  duplicateCanvas: (canvasId: string) => string;
  updateCanvasThumbnail: (canvasId: string, thumbnail: string) => void;
  saveCurrentCanvas: () => void;

  // Canvas redraw bridge methods
  registerStageRef: (stageRef: React.RefObject<any>) => void;
  unregisterStageRef: (stageRef: React.RefObject<any>) => void;
  triggerCanvasRedraw: (immediate?: boolean) => void;
  setCanvasRedrawRequired: (required: boolean) => void;
}

export const useKonvaCanvasStore = create<CanvasState>()(
  immer((set, get) => ({
    // Multiple canvases support
    canvases: {},
    currentCanvasId: null,
    
    // Current canvas state
    elements: {},
    sections: {},
    selectedTool: 'select',
    selectedElementId: null,
    editingTextId: null,
    canvasSize: { width: 800, height: 600 },
    
    // Canvas redraw state
    canvasRedrawRequired: false,
    stageRefs: new Set(),
    
    // History state
    history: [],
    historyIndex: -1,
    maxHistorySize: 50,

    addToHistory: (action: string) => {
      set((state) => {
        const newHistoryState: HistoryState = {
          elements: JSON.parse(JSON.stringify(state.elements)),
          timestamp: Date.now(),
          action
        };

        // Remove any history after current index (when undoing then making new changes)
        state.history = state.history.slice(0, state.historyIndex + 1);
        
        // Add new state
        state.history.push(newHistoryState);
        
        // Limit history size
        if (state.history.length > state.maxHistorySize) {
          state.history = state.history.slice(-state.maxHistorySize);
        }
        
        state.historyIndex = state.history.length - 1;
      });
    },

    addElement: (element) => {
      console.log('🏪 Store: Adding element', element);
      
      // If element doesn't have a sectionId, check if it should be auto-added to a section
      if (!element.sectionId) {
        const { sections } = get();
        
        // Find the most appropriate section (smallest one that contains the element)
        let targetSection: any = null;
        let smallestArea = Infinity;
        
        Object.values(sections).forEach(section => {
          if (isElementInSection(element, section)) {
            const sectionArea = section.width * section.height;
            if (sectionArea < smallestArea) {
              smallestArea = sectionArea;
              targetSection = section;
            }
          }
        });
        
        if (targetSection) {
          console.log('📦 Auto-adding element to best-fit section:', element.id, '->', targetSection.id);
          // Set the sectionId on the element
          element.sectionId = targetSection.id;
          
          // Convert absolute coordinates to section-relative
          const relativeCoords = convertAbsoluteToRelative(element, targetSection);
          element.x = relativeCoords.x;
          element.y = relativeCoords.y;
        }
      }
      
      set((state) => {
        state.elements[element.id] = element;
        state.selectedElementId = element.id;
        
        // If element has a sectionId, add it to the section's containedElementIds
        if (element.sectionId && state.sections[element.sectionId]) {
          const section = state.sections[element.sectionId];
          if (!section.containedElementIds.includes(element.id)) {
            section.containedElementIds.push(element.id);
          }
        }
      });
      
      console.log('✅ Element added to store:', element.id, element);
      console.log('📊 Total elements in store:', Object.keys(get().elements).length);
      get().addToHistory(`Add ${element.type}`);
    },

    updateElement: (id, updates) => {
      set((state) => {
        if (state.elements[id]) {
          Object.assign(state.elements[id], updates);
        }
      });
      
      get().addToHistory(`Update element`);
    },

    deleteElement: (id) => {
      const element = get().elements[id];
      const section = get().sections[id];
      
      if (section) {
        // Use the existing deleteSection function for sections
        get().deleteSection(id);
        return;
      }
      
      set((state) => {
        delete state.elements[id];
        if (state.selectedElementId === id) {
          state.selectedElementId = null;
        }
      });
      get().addToHistory(`Delete ${element?.type || 'element'}`);
    },

    duplicateElement: (id) => {
      const element = get().elements[id];
      if (!element) return;
      
      const newId = `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const offset = 20; // Offset for duplicated element
      
      const duplicatedElement: CanvasElement = {
        ...element,
        id: newId,
        x: element.x + offset,
        y: element.y + offset,
      };
      
      // Handle section duplication separately
      if (element.type === 'section') {
        const section = get().sections[id];
        if (!section) return;
        
        const newSectionId = `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const duplicatedSection: SectionElement = {
          ...section,
          id: newSectionId,
          x: section.x + offset,
          y: section.y + offset,
          containedElementIds: [],
          title: `${section.title} (Copy)`
        };
        
        set((state) => {
          state.sections[newSectionId] = duplicatedSection;
          state.elements[newSectionId] = duplicatedSection as any;
          state.selectedElementId = newSectionId;
        });
        
        // Duplicate contained elements
        section.containedElementIds.forEach(containedId => {
          const containedElement = get().elements[containedId];
          if (containedElement) {
            const newContainedId = `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const duplicatedContained: CanvasElement = {
              ...containedElement,
              id: newContainedId,
              sectionId: newSectionId
            };
            
            set((state) => {
              state.elements[newContainedId] = duplicatedContained;
              state.sections[newSectionId].containedElementIds.push(newContainedId);
            });
          }
        });
      } else {
        // Regular element duplication
        get().addElement(duplicatedElement);
      }
      
      get().addToHistory(`Duplicate ${element.type}`);
    },

    setSelectedTool: (tool) => {
      set((state) => {
        state.selectedTool = tool;
      });
    },

    setSelectedElement: (id) => {
      set((state) => {
        state.selectedElementId = id;
      });
    },

    clearCanvas: () => {
      set((state) => {
        state.elements = {};
        state.sections = {};
        state.selectedElementId = null;
      });
      get().addToHistory('Clear canvas');
    },

    exportCanvas: () => {
      const { elements } = get();
      return Object.values(elements);
    },

    importCanvas: (elements) => {
      set((state) => {
        state.elements = {};
        elements.forEach(element => {
          state.elements[element.id] = element;
        });
        state.selectedElementId = null;
      });
      get().addToHistory('Import canvas');
    },

    undo: () => {
      const { history, historyIndex } = get();
      if (historyIndex > 0) {
        set((state) => {
          state.historyIndex--;
          // Use the 'history' from the destructured 'get()' directly
          const previousState = history[state.historyIndex]; 
          state.elements = JSON.parse(JSON.stringify(previousState.elements));
          state.selectedElementId = null;
        });
      }
    },

    redo: () => {
      const { historyIndex, history } = get();
      if (historyIndex < history.length - 1) {
        set((state) => {
          state.historyIndex++;
          // Use the 'history' from the destructured 'get()' directly
          const nextState = history[state.historyIndex]; 
          state.elements = JSON.parse(JSON.stringify(nextState.elements));
          state.selectedElementId = null;
        });
      }
    },

    canUndo: () => {
      const { historyIndex } = get();
      return historyIndex > 0;
    },

    canRedo: () => {
      const { history, historyIndex } = get();
      return historyIndex < history.length - 1;
    },

    clearHistory: () => {
      set((state) => {
        state.history = [];
        state.historyIndex = -1;
      });
    },

    applyTextFormat: (elementId, format, selection) => {
      try {
        set((state) => {
          const element = state.elements[elementId];
          if (!element) return;

          // If it's a simple 'text' element, convert it to 'rich-text' first.
          if (element.type === 'text') {
            const text = element.text || '';
            state.elements[elementId] = {
              ...element,
              type: 'rich-text',
              text: undefined,
              segments: [{ text }],
            };
          }

          const richTextElement = state.elements[elementId];
          if (richTextElement.type !== 'rich-text' || !richTextElement.segments) return;

          // Validate input segments
          if (!validateRichTextSegments(richTextElement.segments)) {
            console.error('[CANVAS STORE] Invalid rich text segments detected');
            return;
          }

          const newSegments: RichTextSegment[] = [];
          let currentIndex = 0;

          richTextElement.segments.forEach(segment => {
            const segmentStart = currentIndex;
            const segmentEnd = segmentStart + segment.text.length;
            const { text, ...style } = segment;

            // Dissect the segment into three parts: before, during, and after the selection.
            const beforeText = text.substring(0, Math.max(0, selection.start - segmentStart));
            const duringText = text.substring(
              Math.max(0, selection.start - segmentStart),
              Math.min(text.length, selection.end - segmentStart)
            );
            const afterText = text.substring(Math.min(text.length, selection.end - segmentStart));

            if (beforeText) {
              newSegments.push({ ...style, text: beforeText });
            }
            if (duringText) {
              newSegments.push({ ...style, ...format, text: duringText });
            }
            if (afterText) {
              newSegments.push({ ...style, text: afterText });
            }
            
            currentIndex = segmentEnd;
          });

          richTextElement.segments = mergeSegments(newSegments);
          
          // Clear format cache when segments are modified
          clearFormatCache();
        });
        get().addToHistory('Apply text format');
      } catch (error) {
        console.error('[CANVAS STORE] Error applying text format:', error);
      }
    },

    validateRichTextElement: (elementId) => {
      const { elements } = get();
      const element = elements[elementId];
      
      if (!element) return false;
      
      if (element.type === 'rich-text' && element.segments) {
        return validateRichTextSegments(element.segments);
      }
      
      if (element.richTextSegments) {
        return validateRichTextSegments(element.richTextSegments);
      }
      
      return true; // Text elements without rich text segments are valid
    },

    optimizeRichTextSegments: (elementId) => {
      set((state) => {
        const element = state.elements[elementId];
        if (!element) return;
        
        try {
          if (element.type === 'rich-text' && element.segments) {
            element.segments = mergeSegments(element.segments);
          }
          
          if (element.richTextSegments) {
            element.richTextSegments = mergeSegments(element.richTextSegments);
          }
          
          // Clear format cache after optimization
          clearFormatCache();
        } catch (error) {
          console.error('[CANVAS STORE] Error optimizing rich text segments:', error);
        }
      });
    },

    setEditingTextId: (id) => {
      set((state) => {
        state.editingTextId = id;
        if (id !== null) {
          // Optionally, ensure the element being edited is also the selected element
          state.selectedElementId = id;
        }
      });
    },

    updateElementText: (elementId, newText) => {
      set((state) => {
        const element = state.elements[elementId];
        if (element) {
          if (element.type === 'text') {
            element.text = newText;
          } else if (element.type === 'rich-text' && element.segments) {
            // When updating rich text, preserve the style of the first segment.
            // A more advanced implementation could involve diffing, but this is a good baseline.
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { text, ...firstSegmentStyle } = element.segments[0];

            element.segments = [{ ...firstSegmentStyle, text: newText }];
            element.text = undefined; // Ensure plain text is not used for rich-text
          }
        }
      });
      get().addToHistory(`Edit text for element ${elementId}`);
    },

    // Section operations
    createSection: (section) => {
      console.log('🗂️ Creating section:', section);
      set((state) => {
        state.sections[section.id] = section;
        // Also add to elements for consistency
        state.elements[section.id] = section as any;
        state.selectedElementId = section.id;
      });
      get().addToHistory('Create section');
    },

    updateSection: (id, updates) => {
      console.log('🗂️ Updating section:', id, updates);
      set((state) => {
        if (state.sections[id]) {
          Object.assign(state.sections[id], updates);
          // Also update in elements
          if (state.elements[id]) {
            Object.assign(state.elements[id], updates);
          }
        }
      });
      get().addToHistory('Update section');
    },

    deleteSection: (id) => {
      console.log('🗑️ Deleting section:', id);
      const section = get().sections[id];
      if (!section) return;
      
      set((state) => {
        // Remove all elements from the section first
        section.containedElementIds.forEach(elementId => {
          // Just remove the section association, don't delete the elements
          const element = state.elements[elementId];
          if (element) {
            // Elements retain their positions when section is deleted
          }
        });
        
        delete state.sections[id];
        
        if (state.selectedElementId === id) {
          state.selectedElementId = null;
        }
      });
      get().addToHistory('Delete section');
    },

    addElementToSection: (elementId, sectionId) => {
      console.log('➕ Adding element to section:', elementId, '->', sectionId);
      set((state) => {
        const section = state.sections[sectionId];
        const element = state.elements[elementId];
        
        if (section && element && element.type !== 'section') {
          // Remove from any current section
          Object.values(state.sections).forEach(s => {
            s.containedElementIds = s.containedElementIds.filter(id => id !== elementId);
          });
          
          // Convert to section-relative coordinates if moving from absolute
          if (!element.sectionId) {
            const relativeCoords = convertAbsoluteToRelative(element, section);
            element.x = relativeCoords.x;
            element.y = relativeCoords.y;
          }
          
          // Set the sectionId on the element
          element.sectionId = sectionId;
          
          // Add to new section
          if (!section.containedElementIds.includes(elementId)) {
            section.containedElementIds.push(elementId);
          }
        }
      });
    },

    removeElementFromSection: (elementId) => {
      console.log('➖ Removing element from section:', elementId);
      set((state) => {
        const element = state.elements[elementId];
        if (!element) return;
        
        // Find the current section
        const currentSection = element.sectionId ? state.sections[element.sectionId] : null;
        
        if (currentSection) {
          // Convert from section-relative to absolute coordinates
          element.x = currentSection.x + element.x;
          element.y = currentSection.y + element.y;
        }
        
        // Clear the sectionId
        element.sectionId = null;
        
        // Remove from all sections
        Object.values(state.sections).forEach(section => {
          section.containedElementIds = section.containedElementIds.filter(id => id !== elementId);
        });
      });
    },

    getSectionContainingElement: (elementId) => {
      const { sections } = get();
      return Object.values(sections).find(section => 
        section.containedElementIds.includes(elementId)
      ) || null;
    },

    moveSection: (sectionId, deltaX, deltaY) => {
      const { sections } = get();
      const section = sections[sectionId];
      if (!section || section.isLocked) return;
      
      console.log('🔍 [STORE DEBUG] === Move Section ===');
      console.log('🔍 [STORE DEBUG] Section ID:', sectionId);
      console.log('🔍 [STORE DEBUG] Delta:', { deltaX, deltaY });
      console.log('🔍 [STORE DEBUG] Current section position:', { x: section.x, y: section.y });
      console.log('🔍 [STORE DEBUG] Contained elements:', section.containedElementIds);
      
      set((state) => {
        // ONLY move the section itself - children will move automatically via Konva Group
        state.sections[sectionId].x += deltaX;
        state.sections[sectionId].y += deltaY;
        
        // Also update in elements if exists
        if (state.elements[sectionId]) {
          state.elements[sectionId].x += deltaX;
          state.elements[sectionId].y += deltaY;
        }
        
        console.log('🔍 [STORE DEBUG] New section position:', {
          x: state.sections[sectionId].x,
          y: state.sections[sectionId].y
        });
      });
      
      // DO NOT update children positions - Konva's Group handles this automatically
      // When using relative coordinates, children move with the Group transform
      
      get().addToHistory(`Move section ${section.title}`);
    },

    toggleSectionVisibility: (sectionId) => {
      console.log('👁️ Toggling section visibility:', sectionId);
      set((state) => {
        const section = state.sections[sectionId];
        if (section) {
          section.isHidden = !section.isHidden;
          // Also update in elements
          if (state.elements[sectionId]) {
            (state.elements[sectionId] as any).isHidden = section.isHidden;
          }
        }
      });
      get().addToHistory('Toggle section visibility');
    },

    lockSection: (sectionId, lockBackground = false) => {
      console.log('🔒 Locking section:', sectionId);
      set((state) => {
        const section = state.sections[sectionId];
        if (section) {
          section.isLocked = !section.isLocked;
          // Also update in elements
          if (state.elements[sectionId]) {
            (state.elements[sectionId] as any).isLocked = section.isLocked;
          }
          
          // Optionally lock all contained elements
          if (lockBackground) {
            section.containedElementIds.forEach(elementId => {
              if (state.elements[elementId]) {
                (state.elements[elementId] as any).isLocked = section.isLocked;
              }
            });
          }
        }
      });
      get().addToHistory('Lock section');
    },

    updateElementSection: (elementId, newX, newY) => {
      set((state) => {
        const element = state.elements[elementId];
        if (!element) return;
        
        // Get current section from element's sectionId
        const currentSection = element.sectionId ? state.sections[element.sectionId] : null;
        
        // Calculate absolute position
        let absoluteX: number, absoluteY: number;
        if (currentSection) {
          // Convert from section-relative to absolute
          absoluteX = currentSection.x + newX;
          absoluteY = currentSection.y + newY;
        } else {
          // Already absolute
          absoluteX = newX;
          absoluteY = newY;
        }
        
        // Create a temporary element with absolute coordinates for section detection
        const tempElement = {
          ...element,
          x: absoluteX,
          y: absoluteY
        };
        
        // Find new section based on absolute position
        const newSection = Object.values(state.sections).find(section =>
          isElementInSection(tempElement, section)
        );
        
        // Remove from current section's containedElementIds
        if (currentSection) {
          currentSection.containedElementIds = currentSection.containedElementIds.filter(id => id !== elementId);
        }
        
        if (newSection) {
          // Moving to a section - convert to section-relative coordinates
          const relativeCoords = convertAbsoluteToRelative(tempElement, newSection);
          state.elements[elementId].x = relativeCoords.x;
          state.elements[elementId].y = relativeCoords.y;
          state.elements[elementId].sectionId = newSection.id;
          
          if (!newSection.containedElementIds.includes(elementId)) {
            newSection.containedElementIds.push(elementId);
          }
        } else {
          // Moving to canvas (no section) - use absolute coordinates
          state.elements[elementId].x = absoluteX;
          state.elements[elementId].y = absoluteY;
          state.elements[elementId].sectionId = null;
        }
      });
    },

    handleSectionDragEnd: (sectionId: string, newPosition: { x: number; y: number }) => {
      console.log('🎯 Section drag end:', sectionId, newPosition);
      set((state) => {
        const section = state.sections[sectionId];
        if (section && !section.isLocked) {
          // Update ONLY section position
          state.sections[sectionId].x = newPosition.x;
          state.sections[sectionId].y = newPosition.y;
          
          // Also update in elements if section exists there
          if (state.elements[sectionId]) {
            state.elements[sectionId].x = newPosition.x;
            state.elements[sectionId].y = newPosition.y;
          }
          
          // DO NOT update child element positions
          // With the new coordinate system, children use relative coordinates
          // and Konva Groups handle the transform automatically
        }
      });
      get().addToHistory('Move section');
    },

    createSectionFromTemplate: (templateId: string, position: { x: number; y: number }) => {
      const template = sectionTemplates[templateId];
      if (!template) {
        console.warn('Template not found:', templateId);
        return;
      }
      
      const sectionId = `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create the section
      const newSection: SectionElement = {
        id: sectionId,
        type: 'section',
        x: position.x,
        y: position.y,
        width: template.width,
        height: template.height,
        title: template.title,
        backgroundColor: template.backgroundColor,
        borderColor: template.borderColor,
        borderWidth: 2,
        cornerRadius: 8,
        isHidden: false,
        isLocked: false,
        containedElementIds: [],
        templateType: templateId
      };
      
      console.log('📦 Creating section from template:', templateId, newSection);
      
      set((state) => {
        state.sections[sectionId] = newSection;
        // Also add to elements for unified selection handling
        state.elements[sectionId] = newSection as any;
      });
      
      // Create template elements with section-relative coordinates
      template.elements.forEach((templateElement: any, index: number) => {
        const elementId = `${sectionId}_element_${index}`;
        const element: CanvasElement = {
          id: elementId,
          type: templateElement.type as any,
          x: templateElement.x, // Section-relative coordinates
          y: templateElement.y, // Section-relative coordinates
          sectionId: sectionId, // Set the sectionId
          text: templateElement.text || '',
          fontSize: templateElement.fontSize || 14,
          fill: templateElement.fill || '#000000',
          width: templateElement.width || 200,
          height: templateElement.height || 100,
          ...(templateElement.type === 'sticky-note' && {
            backgroundColor: '#FBBF24',
            textColor: '#000000'
          })
        };
        
        set((state) => {
          state.elements[elementId] = element;
          state.sections[sectionId].containedElementIds.push(elementId);
        });
      });
      
      get().addToHistory(`Create section from template: ${template.title}`);
    },

    // NEW: Set element's section membership with proper coordinate handling
    setElementSection: (elementId: string, sectionId: string | null, newRelativePos?: { x: number; y: number }) => {
      set((state) => {
        const element = state.elements[elementId];
        if (!element || element.type === 'section') return;
        
        // Remove from current section if any
        Object.values(state.sections).forEach(section => {
          section.containedElementIds = section.containedElementIds.filter(id => id !== elementId);
        });
        
        // Update element's sectionId
        element.sectionId = sectionId;
        
        if (sectionId && state.sections[sectionId]) {
          // Add to new section
          const section = state.sections[sectionId];
          if (!section.containedElementIds.includes(elementId)) {
            section.containedElementIds.push(elementId);
          }
          
          // If new relative position is provided, use it
          if (newRelativePos) {
            element.x = newRelativePos.x;
            element.y = newRelativePos.y;
          }
          // Otherwise, keep current position (caller should handle coordinate conversion)
        }
      });
      get().addToHistory('Update element section');
    },

    // Helper: Get all elements in a specific section
    getElementsBySection: (sectionId: string) => {
      const { elements } = get();
      return Object.values(elements).filter(
        element => element.sectionId === sectionId && element.type !== 'section'
      );
    },

    // Helper: Get all elements not in any section (free elements)
    getFreeElements: () => {
      const { elements } = get();
      return Object.values(elements).filter(
        element => !element.sectionId && element.type !== 'section'
      );
    },

    // Enhanced Table Operations
    createEnhancedTable: (x: number, y: number, rows?: number, cols?: number) => {
      const tableId = `table_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create table rows
      const tableRows: TableRow[] = Array(rows || 3).fill(null).map((_, index) => ({
        id: `row_${tableId}_${index}`,
        height: index === 0 ? 60 : 50, // Header row slightly taller
        minHeight: 30,
        isResizable: true,
        isHeader: index === 0
      }));
      
      // Create table columns
      const tableColumns: TableColumn[] = Array(cols || 3).fill(null).map((_, index) => ({
        id: `col_${tableId}_${index}`,
        width: 120,
        minWidth: 60,
        isResizable: true,
        textAlign: 'left'
      }));
      
      // Create table cells
      const tableCells: TableCell[][] = Array(rows || 3).fill(null).map((_, rowIndex) =>
        Array(cols || 3).fill(null).map((_, colIndex) => ({
          id: `cell_${tableId}_${rowIndex}_${colIndex}`,
          text: rowIndex === 0 ? `Header ${colIndex + 1}` : '',
          containedElementIds: [],
          backgroundColor: rowIndex === 0 ? '#F3F4F6' : '#FFFFFF',
          textColor: '#1E293B',
          fontSize: 14,
          fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
          textAlign: 'left',
          verticalAlign: 'middle',
          padding: 8,
          isHeader: rowIndex === 0
        }))
      );
      
      const enhancedTableData: EnhancedTableData = {
        rows: tableRows,
        columns: tableColumns,
        cells: tableCells,
        showGridLines: true,
        cornerRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        defaultCellPadding: 8,
        autoResizeRows: true,
        allowDragAndDrop: true,
        keyboardNavigationEnabled: true
      };
      
      const tableElement: CanvasElement = {
        id: tableId,
        type: 'table',
        x,
        y,
        width: (cols || 3) * 120,
        height: (rows || 3) * 50 + 10, // Extra height for header
        enhancedTableData,
        // Keep backward compatibility
        rows: rows || 3,
        cols: cols || 3,
        cellWidth: 120,
        cellHeight: 50,
        tableData: tableCells.map(row => row.map(cell => cell.text || '')),
        borderColor: '#E5E7EB',
        headerBackgroundColor: '#F3F4F6',
        cellBackgroundColor: '#FFFFFF'
      };
      
      get().addElement(tableElement);
      return tableId;
    },

    updateTableCell: (tableId: string, rowIndex: number, colIndex: number, updates: Partial<TableCell>) => {
      console.log('🏪 [STORE DEBUG] ===========================');
      console.log('🏪 [STORE DEBUG] === updateTableCell called ===');
      console.log('🏪 [STORE DEBUG] ===========================');
      console.log('🏪 [STORE DEBUG] Table ID:', tableId);
      console.log('🏪 [STORE DEBUG] Row/Col indices:', { rowIndex, colIndex });
      console.log('🏪 [STORE DEBUG] Updates to apply:', updates);
      console.log('🏪 [STORE DEBUG] Current store state - elements count:', Object.keys(get().elements).length);
      
      set((state) => {
        console.log('🏪 [STORE DEBUG] === Inside set function ===');
        const element = state.elements[tableId];
        console.log('🏪 [STORE DEBUG] Element lookup result:', {
          found: !!element,
          type: element?.type,
          hasEnhancedTableData: !!element?.enhancedTableData
        });
        
        if (!element || element.type !== 'table' || !element.enhancedTableData) {
          console.log('🏪 [STORE DEBUG] ❌ Element validation failed');
          console.log('🏪 [STORE DEBUG] Element exists:', !!element);
          console.log('🏪 [STORE DEBUG] Element type:', element?.type);
          console.log('🏪 [STORE DEBUG] Has enhanced table data:', !!element?.enhancedTableData);
          if (element?.enhancedTableData) {
            console.log('🏪 [STORE DEBUG] Table data structure:', {
              rowsCount: element.enhancedTableData.rows?.length,
              colsCount: element.enhancedTableData.columns?.length,
              cellsStructure: element.enhancedTableData.cells?.length
            });
          }
          return;
        }
        
        console.log('🏪 [STORE DEBUG] ✅ Element validation passed');
        console.log('🏪 [STORE DEBUG] Table structure:', {
          rows: element.enhancedTableData.rows?.length,
          columns: element.enhancedTableData.columns?.length,
          cellsArrayLength: element.enhancedTableData.cells?.length
        });
        
        const cell = element.enhancedTableData.cells[rowIndex]?.[colIndex];
        console.log('🏪 [STORE DEBUG] Cell lookup:', {
          cellExists: !!cell,
          currentText: cell?.text,
          cellId: cell?.id
        });
        
        if (!cell) {
          console.log('🏪 [STORE DEBUG] ❌ Cell not found at position [' + rowIndex + '][' + colIndex + ']');
          return;
        }
        
        console.log('🏪 [STORE DEBUG] ✅ Cell found, proceeding with update...');
        console.log('🏪 [STORE DEBUG] Original cell data:', cell);
        
        // Create a new cells array to trigger re-render
        const newCells = element.enhancedTableData.cells.map((row, rIdx) =>
          row.map((cellInRow, cIdx) => {
            if (rIdx === rowIndex && cIdx === colIndex) {
              const updatedCell = { ...cellInRow, ...updates };
              console.log('🏪 [STORE DEBUG] ✅ Cell updated:', {
                before: cellInRow,
                after: updatedCell,
                updateApplied: updates
              });
              return updatedCell;
            }
            return cellInRow;
          })
        );
        
        console.log('🏪 [STORE DEBUG] New cells array created');
        
        // Update the element with new cells array
        const oldTableData = element.enhancedTableData;
        element.enhancedTableData = {
          ...oldTableData,
          cells: newCells
        };
        
        console.log('🏪 [STORE DEBUG] Enhanced table data updated');
        
        // Force a new element reference to trigger re-render
        const oldElement = state.elements[tableId];
        state.elements[tableId] = { ...oldElement, enhancedTableData: element.enhancedTableData };
        
        console.log('🏪 [STORE DEBUG] ✅ Element reference updated in store');
        console.log('🏪 [STORE DEBUG] Updated element structure:', {
          id: state.elements[tableId].id,
          type: state.elements[tableId].type,
          hasEnhancedTableData: !!state.elements[tableId].enhancedTableData,
          cellCount: state.elements[tableId].enhancedTableData?.cells?.length
        });
        
        // Update backward compatibility data
        if (updates.text !== undefined && element.tableData) {
          if (!element.tableData[rowIndex]) {
            element.tableData[rowIndex] = [];
          }
          element.tableData[rowIndex][colIndex] = updates.text;
          console.log('🏪 [STORE DEBUG] ✅ Legacy tableData updated:', element.tableData[rowIndex][colIndex]);
        }
      });
      
      console.log('🏪 [STORE DEBUG] === Store update completed ===');
      console.log('🏪 [STORE DEBUG] Adding to history...');
      get().addToHistory(`Update table cell [${rowIndex}, ${colIndex}]`);
      
      // FIXED: Trigger immediate canvas redraw after table cell update
      console.log('🏪 [STORE DEBUG] Triggering canvas redraw...');
      get().triggerCanvasRedraw(true);
      console.log('🏪 [STORE DEBUG] ===========================');
    },

    addTableRow: (tableId: string, insertIndex?: number) => {
      set((state) => {
        const element = state.elements[tableId];
        if (!element || element.type !== 'table' || !element.enhancedTableData) return;
        
        const { enhancedTableData } = element;
        const actualIndex = insertIndex ?? enhancedTableData.rows.length;
        
        // Create new row
        const newRow: TableRow = {
          id: `row_${tableId}_${Date.now()}`,
          height: 50,
          minHeight: 30,
          isResizable: true,
          isHeader: false
        };
        
        // Create new cells for this row
        const newCells: TableCell[] = enhancedTableData.columns.map((_, colIndex) => ({
          id: `cell_${tableId}_${actualIndex}_${colIndex}_${Date.now()}`,
          text: '',
          containedElementIds: [],
          backgroundColor: '#FFFFFF',
          textColor: '#1E293B',
          fontSize: 14,
          fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
          textAlign: 'left',
          verticalAlign: 'middle',
          padding: 8,
          isHeader: false
        }));
        
        // Insert row and cells
        enhancedTableData.rows.splice(actualIndex, 0, newRow);
        enhancedTableData.cells.splice(actualIndex, 0, newCells);
        
        // Update backward compatibility
        element.rows = enhancedTableData.rows.length;
        if (element.tableData) {
          element.tableData.splice(actualIndex, 0, newCells.map(cell => cell.text || ''));
        }
        
        // Update table height
        element.height = enhancedTableData.rows.reduce((sum, row) => sum + row.height, 0);
      });
      
      get().addToHistory('Add table row');
    },

    addTableColumn: (tableId: string, insertIndex?: number) => {
      set((state) => {
        const element = state.elements[tableId];
        if (!element || element.type !== 'table' || !element.enhancedTableData) return;
        
        const { enhancedTableData } = element;
        const actualIndex = insertIndex ?? enhancedTableData.columns.length;
        
        // Create new column
        const newColumn: TableColumn = {
          id: `col_${tableId}_${Date.now()}`,
          width: 120,
          minWidth: 60,
          isResizable: true,
          textAlign: 'left'
        };
        
        // Insert column
        enhancedTableData.columns.splice(actualIndex, 0, newColumn);
        
        // Add new cells to each row
        enhancedTableData.cells.forEach((row, rowIndex) => {
          const newCell: TableCell = {
            id: `cell_${tableId}_${rowIndex}_${actualIndex}_${Date.now()}`,
            text: '',
            containedElementIds: [],
            backgroundColor: rowIndex === 0 ? '#F3F4F6' : '#FFFFFF',
            textColor: '#1E293B',
            fontSize: 14,
            fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
            textAlign: 'left',
            verticalAlign: 'middle',
            padding: 8,
            isHeader: rowIndex === 0
          };
          row.splice(actualIndex, 0, newCell);
        });
        
        // Update backward compatibility
        element.cols = enhancedTableData.columns.length;
        if (element.tableData) {
          element.tableData.forEach((row) => {
            row.splice(actualIndex, 0, '');
          });
        }
        
        // Update table width
        element.width = enhancedTableData.columns.reduce((sum, col) => sum + col.width, 0);
      });
      
      get().addToHistory('Add table column');
    },

    removeTableRow: (tableId: string, rowIndex: number) => {
      set((state) => {
        const element = state.elements[tableId];
        if (!element || element.type !== 'table' || !element.enhancedTableData) return;
        
        const { enhancedTableData } = element;
        if (rowIndex < 0 || rowIndex >= enhancedTableData.rows.length) return;
        
        // Remove any contained elements from cells in this row
        enhancedTableData.cells[rowIndex].forEach(cell => {
          cell.containedElementIds.forEach(elementId => {
            delete state.elements[elementId];
          });
        });
        
        // Remove row and cells
        enhancedTableData.rows.splice(rowIndex, 1);
        enhancedTableData.cells.splice(rowIndex, 1);
        
        // Update backward compatibility
        element.rows = enhancedTableData.rows.length;
        if (element.tableData) {
          element.tableData.splice(rowIndex, 1);
        }
        
        // Update table height
        element.height = enhancedTableData.rows.reduce((sum, row) => sum + row.height, 0);
      });
      
      get().addToHistory('Remove table row');
    },

    removeTableColumn: (tableId: string, colIndex: number) => {
      set((state) => {
        const element = state.elements[tableId];
        if (!element || element.type !== 'table' || !element.enhancedTableData) return;
        
        const { enhancedTableData } = element;
        if (colIndex < 0 || colIndex >= enhancedTableData.columns.length) return;
        
        // Remove any contained elements from cells in this column
        enhancedTableData.cells.forEach(row => {
          const cell = row[colIndex];
          if (cell) {
            cell.containedElementIds.forEach(elementId => {
              delete state.elements[elementId];
            });
          }
        });
        
        // Remove column and cells
        enhancedTableData.columns.splice(colIndex, 1);
        enhancedTableData.cells.forEach(row => {
          row.splice(colIndex, 1);
        });
        
        // Update backward compatibility
        element.cols = enhancedTableData.columns.length;
        if (element.tableData) {
          element.tableData.forEach(row => {
            row.splice(colIndex, 1);
          });
        }
        
        // Update table width
        element.width = enhancedTableData.columns.reduce((sum, col) => sum + col.width, 0);
      });
      
      get().addToHistory('Remove table column');
    },

    resizeTableRow: (tableId: string, rowIndex: number, newHeight: number) => {
      set((state) => {
        const element = state.elements[tableId];
        if (!element || element.type !== 'table' || !element.enhancedTableData) return;
        
        const row = element.enhancedTableData.rows[rowIndex];
        if (!row) return;
        
        const minHeight = row.minHeight || 30;
        const maxHeight = row.maxHeight || 200;
        row.height = Math.max(minHeight, Math.min(maxHeight, newHeight));
        
        // Update table height
        element.height = element.enhancedTableData.rows.reduce((sum, r) => sum + r.height, 0);
      });
      
      get().addToHistory('Resize table row');
    },

    resizeTableColumn: (tableId: string, colIndex: number, newWidth: number) => {
      set((state) => {
        const element = state.elements[tableId];
        if (!element || element.type !== 'table' || !element.enhancedTableData) return;
        
        const column = element.enhancedTableData.columns[colIndex];
        if (!column) return;
        
        const minWidth = column.minWidth || 50;
        const maxWidth = column.maxWidth || 500;
        column.width = Math.max(minWidth, Math.min(maxWidth, newWidth));
        
        // Update table width
        element.width = element.enhancedTableData.columns.reduce((sum, col) => sum + col.width, 0);
      });
      
      get().addToHistory('Resize table column');
    },

    resizeTable: (tableId: string, newWidth: number, newHeight: number) => {
      set((state) => {
        const element = state.elements[tableId];
        if (!element || element.type !== 'table' || !element.enhancedTableData) return;
        
        element.width = newWidth;
        element.height = newHeight;
        
        // Prevent multiple history entries during resize with debouncing
        if (state.resizeTimeout) {
          clearTimeout(state.resizeTimeout);
        }
        
        state.resizeTimeout = setTimeout(() => {
          get().addToHistory('Resize table');
          set((state) => {
            state.resizeTimeout = undefined;
          });
        }, 300);
      });
    },

    setTableSelection: (tableId: string, selection: TableSelection | null) => {
      set((state) => {
        const element = state.elements[tableId];
        if (!element || element.type !== 'table' || !element.enhancedTableData) return;
        
        element.enhancedTableData.selection = selection || undefined;
      });
    },

    addElementToTableCell: (tableId: string, rowIndex: number, colIndex: number, elementId: string) => {
      set((state) => {
        const element = state.elements[tableId];
        const targetElement = state.elements[elementId];
        
        if (!element || !targetElement || element.type !== 'table' || !element.enhancedTableData) return;
        
        const cell = element.enhancedTableData.cells[rowIndex]?.[colIndex];
        if (!cell) return;
        
        // Remove element from any existing cell
        Object.values(state.elements).forEach(el => {
          if (el.type === 'table' && el.enhancedTableData) {
            el.enhancedTableData.cells.forEach(row => {
              row.forEach(c => {
                c.containedElementIds = c.containedElementIds.filter(id => id !== elementId);
              });
            });
          }
        });
        
        // Add to new cell
        if (!cell.containedElementIds.includes(elementId)) {
          cell.containedElementIds.push(elementId);
        }
        
        // Convert element coordinates to be relative to the cell
        // This will be handled in the rendering component
      });
      
      get().addToHistory('Add element to table cell');
    },

    // Multiple canvas management
    createCanvas: (name: string) => {
      const canvasId = `canvas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newCanvas: Canvas = {
        id: canvasId,
        name,
        elements: {},
        sections: {},
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      set((state) => {
        state.canvases[canvasId] = newCanvas;
        if (!state.currentCanvasId) {
          state.currentCanvasId = canvasId;
        }
      });
      
      return canvasId;
    },

    switchCanvas: (canvasId: string) => {
      const { canvases } = get();
      if (!canvases[canvasId]) return;
      
      // Save current canvas state
      get().saveCurrentCanvas();
      
      set((state) => {
        state.currentCanvasId = canvasId;
        state.elements = { ...canvases[canvasId].elements };
        state.sections = { ...canvases[canvasId].sections };
        state.selectedElementId = null;
        state.editingTextId = null;
      });
    },

    deleteCanvas: (canvasId: string) => {
      set((state) => {
        delete state.canvases[canvasId];
        if (state.currentCanvasId === canvasId) {
          const remainingCanvases = Object.keys(state.canvases);
          state.currentCanvasId = remainingCanvases.length > 0 ? remainingCanvases[0] : null;
          if (state.currentCanvasId) {
            const newCanvas = state.canvases[state.currentCanvasId];
            state.elements = { ...newCanvas.elements };
            state.sections = { ...newCanvas.sections };
          } else {
            state.elements = {};
            state.sections = {};
          }
        }
      });
    },

    renameCanvas: (canvasId: string, newName: string) => {
      set((state) => {
        if (state.canvases[canvasId]) {
          state.canvases[canvasId].name = newName;
          state.canvases[canvasId].updatedAt = Date.now();
        }
      });
    },

    duplicateCanvas: (canvasId: string) => {
      const { canvases } = get();
      const sourceCanvas = canvases[canvasId];
      if (!sourceCanvas) return '';
      
      const newCanvasId = `canvas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const duplicatedCanvas: Canvas = {
        id: newCanvasId,
        name: `${sourceCanvas.name} (Copy)`,
        elements: JSON.parse(JSON.stringify(sourceCanvas.elements)),
        sections: JSON.parse(JSON.stringify(sourceCanvas.sections)),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      set((state) => {
        state.canvases[newCanvasId] = duplicatedCanvas;
      });
      
      return newCanvasId;
    },

    updateCanvasThumbnail: (canvasId: string, thumbnail: string) => {
      set((state) => {
        if (state.canvases[canvasId]) {
          state.canvases[canvasId].thumbnail = thumbnail;
          state.canvases[canvasId].updatedAt = Date.now();
        }
      });
    },

    saveCurrentCanvas: () => {
      const { currentCanvasId, elements, sections, canvases } = get();
      if (!currentCanvasId || !canvases[currentCanvasId]) return;
      
      set((state) => {
        state.canvases[currentCanvasId].elements = { ...elements };
        state.canvases[currentCanvasId].sections = { ...sections };
        state.canvases[currentCanvasId].updatedAt = Date.now();
      });
    },

    // Canvas redraw bridge methods
    registerStageRef: (stageRef: React.RefObject<any>) => {
      set((state) => {
        state.stageRefs.add(stageRef);
      });
    },

    unregisterStageRef: (stageRef: React.RefObject<any>) => {
      set((state) => {
        state.stageRefs.delete(stageRef);
      });
    },

    triggerCanvasRedraw: (immediate: boolean = true) => {
      const { stageRefs } = get();
      
      // Try registered stage refs first
      let redrawn = false;
      stageRefs.forEach(stageRef => {
        if (triggerLayerRedraw(stageRef, { immediate, debug: false })) {
          redrawn = true;
        }
      });
      
      // Fallback to DOM search if no registered refs worked
      if (!redrawn) {
        const fallbackStageRef = getStageRef();
        if (fallbackStageRef) {
          triggerLayerRedraw(fallbackStageRef, { immediate, debug: false });
        }
      }
      
      // Reset redraw flag
      set((state) => {
        state.canvasRedrawRequired = false;
      });
    },

    setCanvasRedrawRequired: (required: boolean) => {
      set((state) => {
        state.canvasRedrawRequired = required;
        
        // If redraw is required, trigger it immediately
        if (required) {
          // Use setTimeout to avoid calling get() during set()
          setTimeout(() => {
            get().triggerCanvasRedraw(true);
          }, 0);
        }
      });
    },
  }))
);
