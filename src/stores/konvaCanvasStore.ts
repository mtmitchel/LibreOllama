// src/stores/konvaCanvasStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { ConnectorEndpoint, ConnectorStyle } from '../types/connector';
import { SectionElement, isElementInSection, convertAbsoluteToRelative, sectionTemplates } from '../types/section';

// Helper function to compare the styles of two rich text segments.
const areStylesEqual = (seg1: Omit<RichTextSegment, 'text'>, seg2: Omit<RichTextSegment, 'text'>): boolean => {
  return seg1.fontSize === seg2.fontSize &&
         seg1.fontFamily === seg2.fontFamily &&
         seg1.fontStyle === seg2.fontStyle &&
         seg1.fontWeight === seg2.fontWeight &&
         seg1.textDecoration === seg2.textDecoration &&
         seg1.fill === seg2.fill &&
         seg1.url === seg2.url;
};

// Helper function to merge adjacent rich text segments that have identical styles.
const mergeSegments = (segments: RichTextSegment[]): RichTextSegment[] => {
  if (segments.length < 2) {
    return segments;
  }

  const merged: RichTextSegment[] = [];
  let currentSegment = { ...segments[0] };

  for (let i = 1; i < segments.length; i++) {
    const nextSegment = segments[i];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { text: currentText, ...currentStyle } = currentSegment;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { text: nextText, ...nextStyle } = nextSegment;

    if (areStylesEqual(currentStyle, nextStyle)) {
      currentSegment.text += nextSegment.text;
    } else {
      merged.push(currentSegment);
      currentSegment = { ...nextSegment };
    }
  }
  merged.push(currentSegment);

  return merged.filter(s => s.text); // Ensure no empty segments are returned
};

// Interface for individual styled segments within a rich text element
export interface RichTextSegment {
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string; // e.g., 'normal', 'italic'
  fontWeight?: string; // e.g., 'normal', 'bold'
  textDecoration?: string; // e.g., 'underline', 'line-through', or ''
  fill?: string; // Text color for this segment
  url?: string; // Optional URL for clickable links
}

export interface CanvasElement {
  id: string;
  type: 'text' | 'rectangle' | 'circle' | 'line' | 'arrow' | 'pen' | 'triangle' | 'star' | 'sticky-note' | 'rich-text' | 'image' | 'connector' | 'section';
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
  textDecoration?: string; // Text decoration (underline, line-through, etc.)
  listType?: string; // List type (none, bullet, numbered)
  isHyperlink?: boolean; // Whether the text is a hyperlink
  hyperlinkUrl?: string; // URL for hyperlinks
  segments?: RichTextSegment[]; // For 'rich-text' elements
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
}

interface HistoryState {
  elements: Record<string, CanvasElement>;
  timestamp: number;
  action: string;
}

interface CanvasState {
  elements: Record<string, CanvasElement>;
  sections: Record<string, SectionElement>;
  selectedTool: string;
  selectedElementId: string | null;
  editingTextId: string | null; // ID of the text element currently being edited
  canvasSize: { width: number; height: number };
  
  // History management
  history: HistoryState[];
  historyIndex: number;
  maxHistorySize: number;
  
  // Actions
  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
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

  // Rich text formatting
  applyTextFormat: (elementId: string, format: Partial<RichTextSegment>, selection: { start: number; end: number }) => void;

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
}

export const useKonvaCanvasStore = create<CanvasState>()(
  immer((set, get) => ({
    elements: {},
    sections: {},
    selectedTool: 'select',
    selectedElementId: null,
    editingTextId: null,
    canvasSize: { width: 800, height: 600 },
    
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
      console.log('🏪 [STORE DEBUG] === updateElement called ===');
      console.log('🏪 [STORE DEBUG] Element ID:', id);
      console.log('🏪 [STORE DEBUG] Updates to apply:', updates);
      
      const currentElement = get().elements[id];
      console.log('🏪 [STORE DEBUG] Current element before update:', currentElement);
      
      set((state) => {
        if (state.elements[id]) {
          console.log('🏪 [STORE DEBUG] Element found, applying updates...');
          Object.assign(state.elements[id], updates);
          console.log('🏪 [STORE DEBUG] Element after update:', state.elements[id]);
        } else {
          console.log('❌ [STORE DEBUG] Element not found in store!');
        }
      });
      
      const updatedElement = get().elements[id];
      console.log('🏪 [STORE DEBUG] Final element state:', updatedElement);
      
      get().addToHistory(`Update element`);
      console.log('🏪 [STORE DEBUG] updateElement completed');
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

    setSelectedTool: (tool) => {
      set((state) => {
        state.selectedTool = tool;
      });
    },

    setSelectedElement: (id) => {
      console.log('🏪 [STORE DEBUG] === setSelectedElement called ===');
      console.log('🏪 [STORE DEBUG] New selected ID:', id);
      console.log('🏪 [STORE DEBUG] Previous selected ID:', get().selectedElementId);
      console.log('🏪 [STORE DEBUG] Element exists in store:', id ? !!get().elements[id] : 'N/A');
      console.log('🏪 [STORE DEBUG] Section exists in store:', id ? !!get().sections[id] : 'N/A');
      
      set((state) => {
        state.selectedElementId = id;
      });
      
      console.log('🏪 [STORE DEBUG] Selection updated to:', get().selectedElementId);
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
      });
      get().addToHistory('Apply text format');
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
  }))
);
