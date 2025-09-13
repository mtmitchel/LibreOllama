import { nanoid } from 'nanoid';
// Removed unused import: produce
import { 
  CanvasElement, 
  ElementId, 
  ElementOrSectionId,
  SectionId,
  CircleElement,
  MarkerElement,
  HighlighterElement,
  PenElement,
  StickyNoteElement,
  isTableElement,
  TableCell,
  GroupId
} from '../../types/enhanced.types';
import { StoreModule, StoreSet, StoreGet } from './types';

/**
 * Element module state
 */
export interface ElementState {
  // Sticky note defaults (migrated from stickyNoteModule)
  stickyNoteDefaults?: {
    colors: string[];
    size: { width: number; height: number };
  };

  elements: Map<string, CanvasElement>;
  elementOrder: (ElementId | SectionId)[];
}

/**
 * Element module actions
 */
export interface ElementActions {
  // Core CRUD operations
  getElementById: (id: ElementOrSectionId) => CanvasElement | undefined;
  addElement: (element: CanvasElement) => void;
  createElement: (type: string, position: { x: number; y: number }) => void;
  updateElement: (id: ElementOrSectionId, updates: Partial<CanvasElement>, options?: { skipHistory?: boolean; skipValidation?: boolean }) => void;
  batchUpdate: (updates: Array<{ id: ElementOrSectionId; updates: Partial<CanvasElement> }>, options?: { skipHistory?: boolean; skipValidation?: boolean }) => void;
  deleteElement: (id: ElementOrSectionId) => void;
  deleteSelectedElements: () => void;
  
  // High-performance operations
  addElementFast: (element: CanvasElement) => void;
  addElementDrawing: (element: CanvasElement) => void; // Optimized for drawing operations
  
  
  // Utility operations
  clearAllElements: () => void;

  // Sticky note container operations (migrated)
  enableStickyNoteContainer: (stickyNoteId: ElementId, options?: { allowedTypes?: string[]; clipChildren?: boolean; maxChildren?: number }) => void;
  addElementToStickyNote: (elementId: ElementId, stickyNoteId: ElementId) => void;
  removeElementFromStickyNote: (elementId: ElementId, stickyNoteId: ElementId) => void;
  findStickyNoteAtPoint: (point: { x: number; y: number }) => ElementId | null;
  isStickyNoteContainer: (stickyNoteId: ElementId) => boolean;
  getStickyNoteChildren: (stickyNoteId: ElementId) => CanvasElement[];
  constrainElementToStickyNote: (elementId: ElementId, stickyNoteId: ElementId) => void;
  clearStickyNoteChildren: (stickyNoteId: ElementId) => void;
  createStickyNoteContainerDemo: () => ElementId;

  // Table operations (migrated)
  updateTableCell: (tableId: ElementId, row: number, col: number, value: string) => void;
  addTableRow: (tableId: ElementId, position?: number) => void;
  removeTableRow: (tableId: ElementId, rowIndex: number) => void;
  addTableColumn: (tableId: ElementId, position?: number) => void;
  removeTableColumn: (tableId: ElementId, colIndex: number) => void;
  resizeTableCell: (tableId: ElementId, rowIndex: number, colIndex: number, width?: number, height?: number) => void;
  
  // Import/Export operations
  exportElements: () => void;
  importElements: (elements: CanvasElement[]) => void;
  
  // Grouping operations for individual elements (moved from unified store)
  isElementInGroup: (elementId: ElementId) => GroupId | null; // Changed return type
  setElementGroup: (elementId: ElementId, groupId: GroupId | null) => void;

  // FigJam-style Text Resize / Mode actions
  setTextMode: (id: ElementId, mode: 'autoWidth' | 'autoHeight' | 'fixed') => void;
  resizeTextLive: (
    id: ElementId,
    size: { fontSize?: number; width?: number; height?: number },
    options?: { skipHistory?: boolean }
  ) => void;
  commitTextResize: (
    id: ElementId,
    size: { fontSize: number; width: number; height: number },
    options?: { skipHistory?: boolean }
  ) => void;
}

/**
 * Creates the element module
 */
export const createElementModule = (
  set: StoreSet,
  get: StoreGet
): StoreModule<ElementState, ElementActions> => {
  // Cast the set and get functions to work with any state for flexibility
  const setState = set as any;
  const getState = get as any;
  
  // RAF batching for edge reflow
  let rafEdgeReflow = 0;
  const scheduleEdgeReflow = () => {
    if (rafEdgeReflow) return;
    rafEdgeReflow = requestAnimationFrame(() => {
      rafEdgeReflow = 0;
      try {
        const computeEdges = (getState() as any).computeAndCommitDirtyEdges;
        if (computeEdges && typeof computeEdges === 'function') {
          computeEdges();
        }
      } catch (e) {
        console.warn('[elementModule] Failed to compute dirty edges:', e);
      }
    });
  };
  // Type guards for elements with dimensions
  const hasRadius = (el: CanvasElement): el is CircleElement => 
    el.type === 'circle' && 'radius' in el;
    
  const hasDimensions = (el: CanvasElement): el is CanvasElement & { width: number; height: number } =>
    'width' in el && 'height' in el;

  const getElementCenter = (element: CanvasElement): { x: number; y: number } => {
    let width = 0;
    let height = 0;
    
    if (hasRadius(element)) {
      width = element.radius ? element.radius * 2 : 0;
      height = element.radius ? element.radius * 2 : 0;
    } else if (hasDimensions(element)) {
      width = element.width;
      height = element.height;
    }
    
    return {
      x: element.x + width / 2,
      y: element.y + height / 2,
    };
  };

  const ensureEnhancedTableDataConsistency = (table: any) => {
    if (!table.enhancedTableData) {
      table.enhancedTableData = {
        rows: [],
        columns: [],
        cells: []
      };
    }

    // Ensure rows array matches table.rows
    while (table.enhancedTableData.rows.length < table.rows) {
      table.enhancedTableData.rows.push({ height: 40, id: `row-${nanoid()}` });
    }
    while (table.enhancedTableData.rows.length > table.rows) {
      table.enhancedTableData.rows.pop();
    }

    // Ensure columns array matches table.cols
    while (table.enhancedTableData.columns.length < table.cols) {
      table.enhancedTableData.columns.push({ width: 120, id: `col-${nanoid()}` });
    }
    while (table.enhancedTableData.columns.length > table.cols) {
      table.enhancedTableData.columns.pop();
    }

    // Ensure cells array dimensions match table.rows and table.cols
    // Create a new cells array to avoid direct mutation issues and ensure reactivity
    const newCells: TableCell[][] = [];
    for (let r = 0; r < table.rows; r++) {
      newCells[r] = [];
      for (let c = 0; c < table.cols; c++) {
        // Preserve existing cell content if available, otherwise create empty cell
        newCells[r][c] = table.enhancedTableData.cells[r]?.[c] || { content: '', text: '' };
      }
    }
    table.enhancedTableData.cells = newCells;
  };

  return {
    state: {
      stickyNoteDefaults: {
        colors: ['#FFF2CC', '#FFE599', '#FFD966', '#F4B183', '#F8CBAD'],
        size: { width: 200, height: 150 },
      },
      elements: new Map(),
      elementOrder: [],
    },
    
    actions: {
      getElementById: (id) => getState().elements.get(id),
      
      addElement: (element) => {
        setState((state: any) => {
          // Comprehensive defensive checks with auto-recovery
          if (!state.elements || !(state.elements instanceof Map)) {
            console.warn('[ElementModule] Auto-recovering corrupted elements Map');
            state.elements = new Map();
          }
          if (!Array.isArray(state.elementOrder)) {
            console.warn('[ElementModule] Auto-recovering corrupted elementOrder array');
            state.elementOrder = [];
          }
          // Create a new Map to ensure proper change detection
          const newElements = new Map(state.elements);
          newElements.set(element.id, element);
          state.elements = newElements;
          state.elementOrder.push(element.id);
        });
        getState().addToHistory('addElement');
      },
      addElementFast: (element) => {
        setState((state: any) => {
          // Defensive checks even in fast path
          if (!state.elements || !(state.elements instanceof Map)) {
            state.elements = new Map();
          }
          if (!Array.isArray(state.elementOrder)) {
            state.elementOrder = [];
          }
          // Direct map insertion without creating new Map reference for performance
          state.elements.set(element.id, element);
          state.elementOrder.push(element.id);
        });
      },

      // Ultra-lightweight path for drawing strokes - skips history for real-time drawing
      addElementDrawing: (element) => {
        setState((state: any) => {
          // Minimal checks for maximum performance
          if (!state.elements || !(state.elements instanceof Map)) state.elements = new Map();
          if (!state.elementOrder || !Array.isArray(state.elementOrder)) state.elementOrder = [];
          
          // Create a new Map reference ONCE per stroke to trigger subscribers
          const newElements = new Map(state.elements);
          newElements.set(element.id, element);
          state.elements = newElements;
          state.elementOrder = [...state.elementOrder, element.id];
        });
        
        // Keep history disabled for drawing commits
      },

      createElement: (type, position) => {
        const newElement = { id: nanoid(), type, ...position } as CanvasElement;
        getState().addElement(newElement);
      },

      updateElement: (id, updates, options = {}) => {
        // ATOMICITY: Default to skipHistory=true for intermediate updates
        // History should only be added on final events (onDragEnd, onTransformEnd, text-edit commit)
        const { skipHistory = true, skipValidation = false } = options;
        
        setState((state: any) => {
          const element = state.elements.get(id);
          if (element) {
            const oldX = element.x;
            const oldY = element.y;

            // Create a new element object to ensure proper change detection
            const updatedElement = { ...element, ...updates };

            // If element is in a section, constrain its position
            if (updatedElement.sectionId) {
              const section = state.sections?.get(updatedElement.sectionId);
              if (section) {
                const elementWidth = hasDimensions(updatedElement) ? updatedElement.width : 0;
                const elementHeight = hasDimensions(updatedElement) ? updatedElement.height : 0;
                updatedElement.x = Math.max(section.x, Math.min(updatedElement.x, section.x + section.width - elementWidth));
                updatedElement.y = Math.max(section.y, Math.min(updatedElement.y, section.y + section.height - elementHeight));
              }
            }

            // Compute group move delta before committing
            const movedX = updates.x !== undefined ? (updates.x - element.x) : 0;
            const movedY = updates.y !== undefined ? (updates.y - element.y) : 0;

            // Update the Map and replace reference to trigger subscribers/re-render
            state.elements.set(id, updatedElement);
            state.elements = new Map(state.elements);

            // If element belongs to a group, move its siblings by same delta (unison move)
            if (updatedElement.groupId && (updates.x !== undefined || updates.y !== undefined)) {
              const groupId = updatedElement.groupId;
              if (movedX !== 0 || movedY !== 0) {
                const movedSiblingIds: ElementId[] = [];
                for (const [otherId, otherEl] of state.elements.entries()) {
                  if (otherId === id) continue;
                  if ((otherEl as any).groupId === groupId) {
                    // Move sibling by same delta (do not resize)
                    const next = { ...otherEl, x: (otherEl as any).x + movedX, y: (otherEl as any).y + movedY, updatedAt: Date.now() } as any;
                    state.elements.set(otherId, next);
                    movedSiblingIds.push(otherId as ElementId);
                  }
                }
                // Replace Map to ensure subscribers fire
                state.elements = new Map(state.elements);
                // Mark edges connected to moved siblings as dirty for reflow
                try {
                  const reflowEdges = (getState() as any).reflowEdgesForElement;
                  if (reflowEdges && typeof reflowEdges === 'function') {
                    movedSiblingIds.forEach((sid) => reflowEdges(sid));
                    scheduleEdgeReflow();
                    // Immediate compute as a safety net
                    try { (getState() as any).computeAndCommitDirtyEdges?.(); } catch {}
                  }
                } catch (e) {
                  console.warn('[elementModule] Failed to reflow edges for group move:', e);
                }
              }
            }
            
            // If position/size changed, trigger edge reflow
            if (updates.x !== undefined || updates.y !== undefined ||
                ('width' in updates && updates.width !== undefined) ||
                ('height' in updates && updates.height !== undefined) ||
                updates.rotation !== undefined) {
              // Mark connected edges as dirty for reflow
              try {
                const reflowEdges = (getState() as any).reflowEdgesForElement;
                if (reflowEdges && typeof reflowEdges === 'function') {
                  reflowEdges(id);
                  // Schedule RAF to recompute dirty edges
                  scheduleEdgeReflow();
                  // Immediate compute as a safety net
                  try { (getState() as any).computeAndCommitDirtyEdges?.(); } catch {}
                }
              } catch (e) {
                console.warn('[elementModule] Failed to reflow edges:', e);
              }
            }

            // If it's a section, update its children
            if (updatedElement.type === 'section') {
              const oldSectionId = updatedElement.sectionId;
              const hasPositionChanged = updates.x !== undefined || updates.y !== undefined;
      
              if (hasPositionChanged) {
                const newCenter = getElementCenter(updatedElement);
                const newSectionId = getState().findSectionAtPoint?.(newCenter);
      
                if (oldSectionId && oldSectionId !== newSectionId) {
                  // Remove from old section
                  const oldSection = state.sections?.get(oldSectionId);
                  if (oldSection) {
                    oldSection.childElementIds = oldSection.childElementIds.filter((childId: ElementId) => childId !== id);
                  }
                }
      
                if (newSectionId && oldSectionId !== newSectionId) {
                  // Add to new section
                  const newSection = state.sections?.get(newSectionId);
                  if (newSection) {
                    newSection.childElementIds.push(id);
                  }
                }
                
                updatedElement.sectionId = newSectionId || undefined;
                // Update the element again with the new sectionId
                state.elements.set(id, updatedElement);
              }
            }

            // If sticky note moved, move its children by same delta
            if (updatedElement.type === 'sticky-note' && updatedElement.childElementIds && (updates.x !== undefined || updates.y !== undefined)) {
              const deltaX = (updates.x ?? element.x) - oldX;
              const deltaY = (updates.y ?? element.y) - oldY;
              // Moving sticky note children
              if (deltaX !== 0 || deltaY !== 0) {
                updatedElement.childElementIds.forEach((childId: ElementId) => {
                  const child = state.elements.get(childId);
                  if (child) {
                    // Moving child element
                    
                    let movedChild = { ...child, x: child.x + deltaX, y: child.y + deltaY };
                    
                    // For stroke elements (pen, marker, highlighter), also update the points array
                    if (child.type === 'pen' || child.type === 'marker' || child.type === 'highlighter') {
                      const strokeChild = child as MarkerElement | HighlighterElement | PenElement;
                      if (strokeChild.points && Array.isArray(strokeChild.points)) {
                        // Updating stroke points for child
                        const updatedPoints = strokeChild.points.map((point: number, index: number) => {
                          return index % 2 === 0 ? point + deltaX : point + deltaY;
                        });
                        movedChild = { ...movedChild, points: updatedPoints };
                      }
                    }
                    
                    state.elements.set(childId, movedChild);
                  }
                });
              }
            }
          }
        });
        
        if (!skipHistory) {
          getState().addToHistory('updateElement');
        }
      },

      batchUpdate: (updates, options = {}) => {
        const { skipHistory = false, skipValidation = false } = options;
        
        // Cancel any pending RAF to prevent multiple batches
        const rafId = (getState() as any).rafId;
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
        
        // Schedule batch update in next animation frame
        const newRafId = requestAnimationFrame(() => {
          setState((state: any) => {
            // Clear RAF ID
            (state as any).rafId = null;
            
            const movedElements: ElementId[] = [];
            updates.forEach(({ id, updates: elementUpdates }) => {
              const element = state.elements.get(id);
              if (element) {
                // Track if this element moved/resized
                if (elementUpdates.x !== undefined || elementUpdates.y !== undefined ||
                    ('width' in elementUpdates && elementUpdates.width !== undefined) ||
                    ('height' in elementUpdates && elementUpdates.height !== undefined) ||
                    elementUpdates.rotation !== undefined) {
                  movedElements.push(id as ElementId);
                }
                
                if (skipValidation) {
                  // Fast path: direct assignment for performance
                  Object.assign(element, elementUpdates);
                } else {
                  // Full validation path: create new object
                  const updatedElement = { ...element, ...elementUpdates };
                
                // Apply section constraints if needed
                if (updatedElement.sectionId) {
                  const section = state.sections?.get(updatedElement.sectionId);
                  if (section) {
                    let elementWidth = 0;
                    let elementHeight = 0;
                    
                    if (hasRadius(updatedElement)) {
                      elementWidth = updatedElement.radius ? updatedElement.radius * 2 : 0;
                      elementHeight = updatedElement.radius ? updatedElement.radius * 2 : 0;
                    } else if (hasDimensions(updatedElement)) {
                      elementWidth = updatedElement.width;
                      elementHeight = updatedElement.height;
                    }
                    
                    updatedElement.x = Math.max(section.x, Math.min(updatedElement.x, section.x + section.width - elementWidth));
                    updatedElement.y = Math.max(section.y, Math.min(updatedElement.y, section.y + section.height - elementHeight));
                  }
                }
                
                state.elements.set(id, updatedElement);
              }
            }
          });
            
            // Trigger edge reflow for all moved elements
            if (movedElements.length > 0) {
              try {
                const reflowEdges = (getState() as any).reflowEdgesForElement;
                if (reflowEdges && typeof reflowEdges === 'function') {
                  movedElements.forEach(elementId => reflowEdges(elementId));
                  scheduleEdgeReflow();
                }
              } catch (e) {
                console.warn('[elementModule] Failed to reflow edges in batch:', e);
              }
            }
          });
          
          if (!skipHistory) {
            getState().addToHistory('batchUpdate');
          }
        });
        
        // Store RAF ID for potential cancellation
        set({ rafId: newRafId } as any);
      },

      deleteElement: (id) => {
        setState((state: any) => {
          if (!state.elements.has(id)) return;
      
          const elementToDelete = state.elements.get(id);
          if (elementToDelete?.sectionId) {
            const section = state.sections?.get(elementToDelete.sectionId);
            if (section) {
              section.childElementIds = section.childElementIds.filter((childId: ElementId) => childId !== id);
            }
          }
      
          state.elements.delete(id);
          state.elementOrder = state.elementOrder.filter((elementId: ElementId) => elementId !== id);
          state.selectedElementIds?.delete(id as ElementId);
        });
        getState().addToHistory('deleteElement');
      },

      deleteSelectedElements: () => {
        const { selectedElementIds } = getState();
        setState((state: any) => {
          for (const id of selectedElementIds) {
            if (!state.elements.has(id)) continue;
            const elementToDelete = state.elements.get(id);
            if (elementToDelete?.sectionId) {
              const section = state.sections?.get(elementToDelete.sectionId);
              if (section) {
                section.childElementIds = section.childElementIds.filter((childId: ElementId) => childId !== id);
              }
            }
            state.elements.delete(id);
            state.elementOrder = state.elementOrder.filter((elementId: ElementId) => elementId !== id);
          }
          state.selectedElementIds.clear();
        });
        getState().addToHistory('deleteSelectedElements');
      },

      clearAllElements: () => {
        setState((state: any) => {
          state.elements = new Map();
          state.elementOrder = [];
          state.selectedElementIds = new Set();
          state.lastSelectedElementId = null;
          state.sections = new Map();
          state.sectionElementMap = new Map();
        });
        getState().addToHistory('clearAllElements');
      },

      // Sticky note operations (migrated)
      enableStickyNoteContainer: (stickyNoteId, options = {}) => {
        setState((state: any) => {
          const stickyNote = state.elements.get(stickyNoteId);
          if (stickyNote && stickyNote.type === 'sticky-note') {
            const updatedStickyNote: StickyNoteElement = {
              ...(stickyNote as StickyNoteElement),
              isContainer: true,
              childElementIds: (stickyNote as any).childElementIds || [],
              allowedChildTypes: options.allowedTypes || ['pen', 'marker', 'highlighter', 'text', 'rich-text', 'connector', 'image', 'table'],
              clipChildren: options.clipChildren ?? true,
              maxChildElements: options.maxChildren || 20
            };
            state.elements.set(stickyNoteId, updatedStickyNote);
          }
        });
        getState().addToHistory('enableStickyNoteContainer');
      },

      addElementToStickyNote: (elementId, stickyNoteId) => {
        setState((state: any) => {
          const stickyNote = state.elements.get(stickyNoteId) as StickyNoteElement | undefined;
          const element = state.elements.get(elementId);
          
          if (stickyNote && element && stickyNote.type === 'sticky-note') {
            if (!stickyNote.isContainer) return;

            if (stickyNote.allowedChildTypes && !stickyNote.allowedChildTypes.includes(element.type)) return;

            const currentChildCount = stickyNote.childElementIds?.length || 0;
            if (stickyNote.maxChildElements && currentChildCount >= stickyNote.maxChildElements) return;

            const updatedStickyNote: StickyNoteElement = {
              ...stickyNote,
              childElementIds: [...(stickyNote.childElementIds || []), elementId]
            };
            state.elements.set(stickyNoteId, updatedStickyNote);

            const updatedElement = {
              ...element,
              parentId: stickyNoteId,
              stickyNoteId: stickyNoteId
            } as any;
            state.elements.set(elementId, updatedElement);
          }
        });
        getState().addToHistory('addElementToStickyNote');
      },

      removeElementFromStickyNote: (elementId, stickyNoteId) => {
        setState((state: any) => {
          const stickyNote = state.elements.get(stickyNoteId) as StickyNoteElement | undefined;
          const element = state.elements.get(elementId);
          
          if (stickyNote && element && stickyNote.type === 'sticky-note') {
            const updatedStickyNote: StickyNoteElement = {
              ...stickyNote,
              childElementIds: (stickyNote.childElementIds || []).filter((id: ElementId) => id !== elementId)
            };
            state.elements.set(stickyNoteId, updatedStickyNote);

            const updatedElement = {
              ...element,
              parentId: undefined,
              stickyNoteId: undefined
            } as any;
            state.elements.set(elementId, updatedElement);
          }
        });
        getState().addToHistory('removeElementFromStickyNote');
      },

      findStickyNoteAtPoint: (point) => {
        const { elements } = getState();
        for (const [id, element] of elements) {
          if (element.type === 'sticky-note' && (element as any).isContainer) {
            if (
              point.x >= element.x &&
              point.x <= element.x + (element as any).width &&
              point.y >= element.y &&
              point.y <= element.y + (element as any).height
            ) {
              return id as ElementId;
            }
          }
        }
        return null;
      },

      isStickyNoteContainer: (stickyNoteId) => {
        const { elements } = getState();
        const stickyNote = elements.get(stickyNoteId) as StickyNoteElement | undefined;
        return stickyNote?.type === 'sticky-note' && stickyNote.isContainer === true;
      },

      getStickyNoteChildren: (stickyNoteId) => {
        const { elements } = getState();
        const stickyNote = elements.get(stickyNoteId) as StickyNoteElement | undefined;
        if (stickyNote?.type === 'sticky-note' && stickyNote.childElementIds) {
          return stickyNote.childElementIds
            .map((id: ElementId) => elements.get(id))
            .filter(Boolean) as CanvasElement[];
        }
        return [];
      },

      constrainElementToStickyNote: (elementId, stickyNoteId) => {
        setState((state: any) => {
          const stickyNote = state.elements.get(stickyNoteId) as StickyNoteElement | undefined;
          const element = state.elements.get(elementId) as CanvasElement | undefined;
          
          if (stickyNote && element && stickyNote.type === 'sticky-note' && stickyNote.clipChildren) {
            const padding = 10;
            const constrainedX = Math.max(
              stickyNote.x + padding,
              Math.min(element.x, stickyNote.x + stickyNote.width - ((element as any).width || 0) - padding)
            );
            const constrainedY = Math.max(
              stickyNote.y + padding,
              Math.min(element.y, stickyNote.y + stickyNote.height - ((element as any).height || 0) - padding)
            );

            if (constrainedX !== element.x || constrainedY !== element.y) {
              const updatedElement = { ...element, x: constrainedX, y: constrainedY } as any;
              state.elements.set(elementId, updatedElement);
            }
          }
        });
      },

      clearStickyNoteChildren: (stickyNoteId) => {
        const { getStickyNoteChildren, removeElementFromStickyNote } = getState();
        const children = getStickyNoteChildren(stickyNoteId);
        children.forEach((child: CanvasElement) => {
          removeElementFromStickyNote(child.id, stickyNoteId);
        });
        getState().addToHistory('clearStickyNoteChildren');
      },

      createStickyNoteContainerDemo: () => {
        const { addElement, enableStickyNoteContainer } = getState();
        const stickyNote: StickyNoteElement = {
          id: nanoid() as ElementId,
          type: 'sticky-note',
          x: 200,
          y: 150,
          width: 300,
          height: 250,
          text: 'Container Demo\n\nTry drawing on this sticky note!',
          backgroundColor: '#FFF2CC',
          textColor: '#1F2937',
          fontSize: 14,
          fontFamily: 'Inter, sans-serif',
          isContainer: true,
          childElementIds: [],
          allowedChildTypes: ['pen', 'marker', 'highlighter', 'text', 'rich-text', 'connector', 'image', 'table'],
          clipChildren: true,
          maxChildElements: 10,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isLocked: false,
          isHidden: false
        };
        addElement(stickyNote);
        setTimeout(() => {
          const testPoint = { x: 350, y: 275 };
          const foundStickyNote = getState().findStickyNoteAtPoint(testPoint);
        }, 100);
        return stickyNote.id;
      },

      // Table operations (migrated)
      updateTableCell: (tableId, row, col, value) => {
        setState((state: any) => {
          const table = state.elements.get(tableId);
          if (table && (table as any).type === 'table') {
            ensureEnhancedTableDataConsistency(table);

            if (table.enhancedTableData.cells[row] && table.enhancedTableData.cells[row][col]) {
              // Create new cell object
              const newCell = { content: value, text: value };
              // Create new row array with updated cell
              const updatedRow = [...table.enhancedTableData.cells[row]];
              updatedRow[col] = newCell;
              // Create new cells array with updated row
              const updatedCells = [...table.enhancedTableData.cells];
              updatedCells[row] = updatedRow;

              // Create new enhancedTableData object
              const newEnhancedData = { ...table.enhancedTableData, cells: updatedCells };
              // Create new table object to trigger reactivity
              const newTable = { ...table, enhancedTableData: newEnhancedData, updatedAt: Date.now() };

              state.elements.set(tableId, newTable);
              state.elements = new Map(state.elements); // Trigger map update
            }
          }
        });
        getState().addToHistory('updateTableCell');
      },

      addTableRow: (tableId, position = -1) => {
        setState((state: any) => {
          const table = state.elements.get(tableId);
          if (table && (table as any).type === 'table') {
            ensureEnhancedTableDataConsistency(table);

            const insertIndex = position === -1 ? table.rows : Math.max(0, Math.min(position, table.rows));
            
            // Update table dimensions
            table.rows += 1;
            table.height += 40; // Assuming default row height

            // Add new row to enhancedTableData.rows
            table.enhancedTableData.rows.splice(insertIndex, 0, { height: 40, id: `row-${nanoid()}` });

            // Add new row of empty cells to enhancedTableData.cells
            const newRowCells = Array(table.cols).fill(null).map(() => ({ content: '', text: '' }));
            table.enhancedTableData.cells.splice(insertIndex, 0, newRowCells);
            
            table.updatedAt = Date.now();
            state.elements = new Map(state.elements); // Force subscriber updates by replacing Map reference
            // Trigger transformer refresh for real-time resize frame adjustment
            setTimeout(() => {
              try {
                const refreshTransformer = (window as any).__REFRESH_TRANSFORMER__;
                if (refreshTransformer && typeof refreshTransformer === 'function') {
                  refreshTransformer(tableId);
                }
              } catch (e) {
                console.warn('[elementModule] Failed to refresh transformer:', e);
              }
            }, 16); // Next animation frame
          }
        });
        getState().addToHistory('addTableRow');
      },

      removeTableRow: (tableId, rowIndex) => {
        setState((state: any) => {
          const table = state.elements.get(tableId);
          if (table && (table as any).type === 'table' && table.rows > 1 && rowIndex >= 0 && rowIndex < table.rows) {
            ensureEnhancedTableDataConsistency(table);

            // Update table dimensions
            table.rows -= 1;
            table.height -= table.enhancedTableData.rows[rowIndex]?.height || 40; // Use actual row height if available

            // Remove row from enhancedTableData.rows
            table.enhancedTableData.rows.splice(rowIndex, 1);
            // Remove row of cells from enhancedTableData.cells
            table.enhancedTableData.cells.splice(rowIndex, 1);
            
            table.updatedAt = Date.now();
            state.elements = new Map(state.elements); // Force subscriber updates by replacing Map reference
            // Trigger transformer refresh for real-time resize frame adjustment
            setTimeout(() => {
              try {
                const refreshTransformer = (window as any).__REFRESH_TRANSFORMER__;
                if (refreshTransformer && typeof refreshTransformer === 'function') {
                  refreshTransformer(tableId);
                }
              } catch (e) {
                console.warn('[elementModule] Failed to refresh transformer:', e);
              }
            }, 16); // Next animation frame
          }
        });
        getState().addToHistory('removeTableRow');
      },

      addTableColumn: (tableId, position = -1) => {
        setState((state: any) => {
          const table = state.elements.get(tableId);
          if (table && (table as any).type === 'table') {
            ensureEnhancedTableDataConsistency(table);

            const insertIndex = position === -1 ? table.cols : Math.max(0, Math.min(position, table.cols));
            
            // Update table dimensions
            table.cols += 1;
            table.width += 120; // Assuming default column width

            // Add new column to enhancedTableData.columns
            table.enhancedTableData.columns.splice(insertIndex, 0, { width: 120, id: `col-${nanoid()}` });

            // Add new cell to each row in enhancedTableData.cells
            table.enhancedTableData.cells.forEach((row: TableCell[]) => {
              row.splice(insertIndex, 0, { content: '', text: '' });
            });
            
            table.updatedAt = Date.now();
            state.elements = new Map(state.elements); // Force subscriber updates by replacing Map reference
            // Trigger transformer refresh for real-time resize frame adjustment
            setTimeout(() => {
              try {
                const refreshTransformer = (window as any).__REFRESH_TRANSFORMER__;
                if (refreshTransformer && typeof refreshTransformer === 'function') {
                  refreshTransformer(tableId);
                }
              } catch (e) {
                console.warn('[elementModule] Failed to refresh transformer:', e);
              }
            }, 16); // Next animation frame
          }
        });
        getState().addToHistory('addTableColumn');
      },

      removeTableColumn: (tableId, colIndex) => {
        setState((state: any) => {
          const table = state.elements.get(tableId);
          if (table && (table as any).type === 'table' && table.cols > 1 && colIndex >= 0 && colIndex < table.cols) {
            ensureEnhancedTableDataConsistency(table);

            // Update table dimensions
            table.cols -= 1;
            table.width -= table.enhancedTableData.columns[colIndex]?.width || 120; // Use actual column width if available

            // Remove column from enhancedTableData.columns
            table.enhancedTableData.columns.splice(colIndex, 1);
            // Remove cell from each row in enhancedTableData.cells
            table.enhancedTableData.cells.forEach((row: TableCell[]) => {
              row.splice(colIndex, 1);
            });
            
            table.updatedAt = Date.now();
            state.elements = new Map(state.elements); // Force subscriber updates by replacing Map reference
            // Trigger transformer refresh for real-time resize frame adjustment
            setTimeout(() => {
              try {
                const refreshTransformer = (window as any).__REFRESH_TRANSFORMER__;
                if (refreshTransformer && typeof refreshTransformer === 'function') {
                  refreshTransformer(tableId);
                }
              } catch (e) {
                console.warn('[elementModule] Failed to refresh transformer:', e);
              }
            }, 16); // Next animation frame
          }
        });
        getState().addToHistory('removeTableColumn');
      },

      resizeTableCell: (tableId, rowIndex, colIndex, width, height) => {
        setState((state: any) => {
          const table = state.elements.get(tableId);
          if (table && (table as any).type === 'table') {
            ensureEnhancedTableDataConsistency(table);

            if (width !== undefined && table.enhancedTableData.columns[colIndex]) {
              const oldWidth = table.enhancedTableData.columns[colIndex].width || 120;
              table.enhancedTableData.columns[colIndex].width = Math.max(60, width);
              table.width += (table.enhancedTableData.columns[colIndex].width - oldWidth);
            }
            if (height !== undefined && table.enhancedTableData.rows[rowIndex]) {
              const oldHeight = table.enhancedTableData.rows[rowIndex].height || 40;
              table.enhancedTableData.rows[rowIndex].height = Math.max(30, height);
              table.height += (table.enhancedTableData.rows[rowIndex].height - oldHeight);
            }
            table.updatedAt = Date.now();
            state.elements = new Map(state.elements);
          }
        });
        getState().addToHistory('resizeTableCell');
      },

      // --- FigJam-style Text Resize / Mode actions ---
      setTextMode: (id, mode) => {
        setState((state: any) => {
          const el = state.elements.get(id);
          if (!el) return;
          if (el.type !== 'text' && el.type !== 'sticky-note') return;
          state.elements.set(id, { ...el, mode, updatedAt: Date.now() });
        });
        getState().addToHistory('setTextMode');
      },

      resizeTextLive: (id, size, options = {}) => {
        const { skipHistory = true } = options;
        setState((state: any) => {
          const el = state.elements.get(id);
          if (!el) return;
          if (el.type !== 'text' && el.type !== 'sticky-note') return;
          const next: any = { ...el };
          if (typeof size.fontSize === 'number') next.fontSize = size.fontSize;
          if (typeof size.width === 'number') next.width = Math.max(1, size.width);
          if (typeof size.height === 'number') next.height = Math.max(1, size.height);
          next.updatedAt = Date.now();
          state.elements.set(id, next);
        });
        if (!skipHistory) getState().addToHistory('resizeTextLive');
      },

      commitTextResize: (id, size, options = {}) => {
        const { skipHistory = false } = options;
        setState((state: any) => {
          const el = state.elements.get(id);
          if (!el) return;
          if (el.type !== 'text' && el.type !== 'sticky-note') return;
          state.elements.set(id, {
            ...el,
            fontSize: size.fontSize,
            width: Math.max(1, size.width),
            height: Math.max(1, size.height),
            updatedAt: Date.now(),
          });
        });
        if (!skipHistory) getState().addToHistory('commitTextResize');
      },

      exportElements: () => {
        const { elements } = getState();
        const elementsArray = Array.from(elements.values());
        const dataStr = JSON.stringify(elementsArray, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'canvas-elements.json';
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
      },

      importElements: (elements: CanvasElement[]) => {
        // Normalize various possible incoming shapes into a CanvasElement[]
        const normalize = (src: any): CanvasElement[] => {
          if (!src) return [];
          // Already an array
          if (Array.isArray(src)) return src as CanvasElement[];
          // Map of elements
          if (src instanceof Map) return Array.from(src.values()) as CanvasElement[];
          // Object with elements property
          if (Array.isArray(src?.elements)) return src.elements as CanvasElement[];
          // Persisted entries array [[id, element], ...]
          const entries = src?.state?.elements || src?.elements;
          if (Array.isArray(entries) && entries.length > 0) {
            if (Array.isArray(entries[0]) && entries[0].length === 2) {
              return entries.map((e: any) => e[1]) as CanvasElement[];
            }
            if (typeof entries[0] === 'object') {
              return entries as CanvasElement[];
            }
          }
          // Plain object keyed by id
          if (typeof src === 'object') {
            const values = Object.values(src);
            if (values.length && typeof values[0] === 'object') {
              return values as CanvasElement[];
            }
          }
          return [];
        };

        const normalized = normalize(elements as any);
        if (!Array.isArray(normalized)) {
          console.warn('[ElementModule.importElements] Expected an array, got:', typeof elements);
          return;
        }

        setState((state: any) => {
          // Clear existing elements
          if (!state.elements || !(state.elements instanceof Map)) state.elements = new Map();
          state.elements.clear();
          state.elementOrder = [];
          state.selectedElementIds?.clear?.();
          state.lastSelectedElementId = null;
          
          // Add imported elements
          normalized.forEach((element: CanvasElement) => {
            if (!element || !element.id) return;
            state.elements.set(element.id, element);
            state.elementOrder.push(element.id);
          });
        });
        getState().addToHistory('importElements');
      },

      isElementInGroup: (elementId: ElementId) => {
        const element = getState().elements.get(elementId);
        return element?.groupId || null; // Return groupId or null
      },

      setElementGroup: (elementId: ElementId, groupId: GroupId | null) => {
        setState((state: any) => {
          const element = state.elements.get(elementId);
          if (element) {
            state.elements.set(elementId, { ...element, groupId });
          }
        });
      },
    },
  };
};
