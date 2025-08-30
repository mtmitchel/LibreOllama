/**
 * Integration test for the connector system
 * Tests the complete workflow from toolbar selection to edge creation
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { ElementId } from '../types/canvas-elements';
import { routeEdge } from '../utils/routing';

describe('Connector System Integration', () => {
  beforeEach(() => {
    // Reset store state
    const store = useUnifiedCanvasStore.getState();
    store.clearElements();
    store.clearSelection();
    store.setSelectedTool('select');
  });

  it('should support connector tool selection from toolbar', () => {
    const { result } = renderHook(() => useUnifiedCanvasStore());
    
    act(() => {
      result.current.setSelectedTool('connector-line');
    });
    
    expect(result.current.selectedTool).toBe('connector-line');
    
    act(() => {
      result.current.setSelectedTool('connector-arrow');
    });
    
    expect(result.current.selectedTool).toBe('connector-arrow');
  });

  it('should create draft edge when starting connection', () => {
    const { result } = renderHook(() => useUnifiedCanvasStore());
    
    // Add source element
    act(() => {
      result.current.addElement({
        id: 'source' as ElementId,
        type: 'shape',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        rotation: 0
      });
    });
    
    // Start edge draft
    act(() => {
      result.current.startEdgeDraft({
        elementId: 'source' as ElementId,
        portKind: 'E'
      });
    });
    
    const draft = result.current.draft;
    expect(draft).toBeDefined();
    expect(draft?.from.elementId).toBe('source');
    expect(draft?.from.portKind).toBe('E');
  });

  it('should update draft pointer position during mouse move', () => {
    const { result } = renderHook(() => useUnifiedCanvasStore());
    
    // Add source element and start draft
    act(() => {
      result.current.addElement({
        id: 'source' as ElementId,
        type: 'shape',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        rotation: 0
      });
      
      result.current.startEdgeDraft({
        elementId: 'source' as ElementId,
        portKind: 'E'
      });
      
      result.current.updateEdgeDraftPointer({ x: 200, y: 150 });
    });
    
    const draft = result.current.draft;
    expect(draft?.pointer.x).toBe(200);
    expect(draft?.pointer.y).toBe(150);
  });

  it('should commit edge to target element', () => {
    const { result } = renderHook(() => useUnifiedCanvasStore());
    
    act(() => {
      // Add source and target elements
      result.current.addElement({
        id: 'source' as ElementId,
        type: 'shape',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        rotation: 0
      });
      
      result.current.addElement({
        id: 'target' as ElementId,
        type: 'shape',
        x: 300,
        y: 100,
        width: 100,
        height: 100,
        rotation: 0
      });
      
      // Start draft and commit to target
      result.current.startEdgeDraft({
        elementId: 'source' as ElementId,
        portKind: 'E'
      });
      
      result.current.commitEdgeDraftTo({
        elementId: 'target' as ElementId,
        portKind: 'W'
      });
    });
    
    // Verify edge was created
    const edges = Array.from(result.current.edges.values());
    expect(edges).toHaveLength(1);
    
    const edge = edges[0];
    expect(edge.source.elementId).toBe('source');
    expect(edge.source.portKind).toBe('E');
    expect(edge.target.elementId).toBe('target');
    expect(edge.target.portKind).toBe('W');
    
    // Verify draft was cleared
    expect(result.current.draft).toBeNull();
  });

  it('should cancel draft on escape or invalid target', () => {
    const { result } = renderHook(() => useUnifiedCanvasStore());
    
    act(() => {
      result.current.addElement({
        id: 'source' as ElementId,
        type: 'shape',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        rotation: 0
      });
      
      result.current.startEdgeDraft({
        elementId: 'source' as ElementId,
        portKind: 'E'
      });
      
      result.current.cancelEdgeDraft();
    });
    
    expect(result.current.draft).toBeNull();
  });

  it('should support snapping to valid target ports', () => {
    const { result } = renderHook(() => useUnifiedCanvasStore());
    
    act(() => {
      // Add source and target elements
      result.current.addElement({
        id: 'source' as ElementId,
        type: 'shape',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        rotation: 0
      });
      
      result.current.addElement({
        id: 'target' as ElementId,
        type: 'shape',
        x: 300,
        y: 100,
        width: 100,
        height: 100,
        rotation: 0
      });
      
      // Start draft and set snap target
      result.current.startEdgeDraft({
        elementId: 'source' as ElementId,
        portKind: 'E'
      });
      
      result.current.updateEdgeDraftSnap({
        elementId: 'target' as ElementId,
        portKind: 'W'
      });
    });
    
    const draft = result.current.draft;
    expect(draft?.snapTarget?.elementId).toBe('target');
    expect(draft?.snapTarget?.portKind).toBe('W');
  });

  it('should route edges correctly using routing utility', () => {
    // Create test elements
    const sourceElement = {
      id: 'source' as ElementId,
      type: 'shape' as const,
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      rotation: 0
    };
    
    const targetElement = {
      id: 'target' as ElementId,
      type: 'shape' as const,
      x: 300,
      y: 100,
      width: 100,
      height: 100,
      rotation: 0
    };
    
    // Create test edge
    const edge = {
      id: 'edge1' as ElementId,
      type: 'edge' as const,
      source: { elementId: 'source' as ElementId, portKind: 'E' as const },
      target: { elementId: 'target' as ElementId, portKind: 'W' as const },
      routing: 'straight' as const,
      points: [],
      stroke: '#374151',
      strokeWidth: 2
    };
    
    // Test routing
    const points = routeEdge(edge, sourceElement, targetElement);
    
    expect(points).toHaveLength(4); // [x1, y1, x2, y2]
    expect(points[0]).toBe(200); // source east port x
    expect(points[1]).toBe(150); // source east port y
    expect(points[2]).toBe(300); // target west port x
    expect(points[3]).toBe(150); // target west port y
  });

  it('should prevent self-connections', () => {
    const { result } = renderHook(() => useUnifiedCanvasStore());
    
    act(() => {
      result.current.addElement({
        id: 'element' as ElementId,
        type: 'shape',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        rotation: 0
      });
      
      result.current.startEdgeDraft({
        elementId: 'element' as ElementId,
        portKind: 'E'
      });
      
      // Try to commit to the same element (should be rejected)
      const edgeId = result.current.commitEdgeDraftTo({
        elementId: 'element' as ElementId,
        portKind: 'W'
      });
    });
    
    // Should not create self-connection
    const edges = Array.from(result.current.edges.values());
    expect(edges).toHaveLength(0);
    expect(result.current.draft).toBeNull();
  });
});