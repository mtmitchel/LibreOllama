/**
 * Shape Creator Utilities
 * Helper functions to create canvas elements quickly
 */

import { nanoid } from 'nanoid';
import { 
  RectangleElement, 
  CircleElement, 
  TextElement, 
  StickyNoteElement,
  TriangleElement,
  SectionElement,
  TableElement,
  ElementId,
  SectionId
} from '../types/enhanced.types';

export function createRectangle(x: number, y: number, width = 100, height = 100): RectangleElement {
  return {
    id: nanoid() as ElementId,
    type: 'rectangle',
    x,
    y,
    width,
    height,
    fill: '#FFFFFF',
    stroke: '#9CA3AF',
    strokeWidth: 2,
    cornerRadius: 4,
    text: '',
    fontSize: 14,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    textColor: '#1F2937',
    textAlign: 'center' as const,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isLocked: false,
    isHidden: false
  };
}

export function createCircle(x: number, y: number, radius = 50): CircleElement {
  return {
    id: nanoid() as ElementId,
    type: 'circle',
    x: x - radius, // Center the circle
    y: y - radius,
    radius,
    fill: '#FFFFFF',
    stroke: '#9CA3AF',
    strokeWidth: 2,
    text: '',
    fontSize: 14,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    textColor: '#1F2937',
    textAlign: 'center' as const,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isLocked: false,
    isHidden: false
  };
}

export function createText(x: number, y: number, text = 'Text'): TextElement {
  return {
    id: nanoid() as ElementId,
    type: 'text',
    x,
    y,
    text,
    fontSize: 16,
    fontFamily: 'Inter, sans-serif',
    fill: '#1F2937',
    width: 100,
    height: 24,
    textAlign: 'left',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isLocked: false,
    isHidden: false
  };
}

export function createStickyNote(x: number, y: number, color = '#FBBF24'): StickyNoteElement {
  return {
    id: nanoid() as ElementId,
    type: 'sticky-note',
    x,
    y,
    width: 150,
    height: 150,
    text: 'Sticky note',
    backgroundColor: color,
    textColor: '#1F2937',
    fontSize: 14,
    fontFamily: 'Inter, sans-serif',
    textAlign: 'left',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isLocked: false,
    isHidden: false
  };
}

export function createTriangle(x: number, y: number, size = 60): TriangleElement {
  const height = size * Math.sqrt(3) / 2;
  return {
    id: nanoid() as ElementId,
    type: 'triangle',
    x,
    y,
    width: size,
    height,
    points: [
      x + size / 2, y,        // Top point
      x, y + height,          // Bottom left
      x + size, y + height,   // Bottom right
      x + size / 2, y         // Close path
    ],
    fill: '#FFFFFF',
    stroke: '#9CA3AF',
    strokeWidth: 2,
    text: '',
    fontSize: 14,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    textColor: '#1F2937',
    textAlign: 'center' as const,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isLocked: false,
    isHidden: false
  };
}

export function createMindmap(x: number, y: number, size = 140): RectangleElement {
  return {
    id: nanoid() as ElementId,
    type: 'rectangle',
    x,
    y,
    width: size,
    height: size * 0.5, // More oval-like proportions for mindmap nodes
    fill: '#F3F4F6', // Soft gray background
    stroke: '#6366F1', // Indigo border
    strokeWidth: 2,
    cornerRadius: 25, // Very rounded for bubble effect
    text: '', // Add text property for editing
    fontSize: 14,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    textColor: '#1F2937',
    textAlign: 'center' as const,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isLocked: false,
    isHidden: false
  };
}

export function createSection(x: number, y: number, width = 400, height = 300): SectionElement {
  return {
    id: nanoid() as SectionId,
    type: 'section',
    x,
    y,
    width,
    height,
    title: 'New Section',
    childElementIds: [],
    backgroundColor: 'rgba(240, 240, 240, 0.5)',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isLocked: false,
    isHidden: false
  };
}

export function createTable(x: number, y: number, rows = 3, cols = 3): TableElement {
  return {
    id: nanoid() as ElementId,
    type: 'table',
    x,
    y,
    width: cols * 100,
    height: rows * 40,
    rows,
    cols,
    enhancedTableData: {
      rows: Array.from({ length: rows }, (_, i) => ({ height: 40, id: `row-${i}` })),
      columns: Array.from({ length: cols }, (_, i) => ({ width: 120, id: `col-${i}` })),
      cells: Array.from({ length: rows }, () => 
        Array.from({ length: cols }, () => ({ content: '', text: '' }))
      )
    },
    tableData: Array(rows).fill(null).map(() => 
      Array(cols).fill('')
    ),
    borderColor: '#E5E7EB',
    borderWidth: 1,
    cellPadding: 8,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isLocked: false,
    isHidden: false
  };
}

// Quick shape creation map for the toolbar
export const SHAPE_CREATORS = {
  rectangle: createRectangle,
  circle: createCircle,
  triangle: createTriangle,
  mindmap: createMindmap,
  text: createText,
  'sticky-note': createStickyNote,
  section: createSection,
  table: createTable,
} as const;

export type ShapeType = keyof typeof SHAPE_CREATORS; 