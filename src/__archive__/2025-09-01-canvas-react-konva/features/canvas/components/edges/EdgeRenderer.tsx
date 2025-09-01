// src/features/canvas/components/edges/EdgeRenderer.tsx
import React from 'react';
import { Group } from 'react-konva';
import { useUnifiedCanvasStore } from '../../stores/unifiedCanvasStore';
import { useShallow } from 'zustand/react/shallow';
import { EdgeNode } from './EdgeNode';
import { EdgeElement } from '../../types/canvas-elements';

/**
 * EdgeRenderer - Renders all edges in the Main layer
 * Integrates with the existing layer system
 */
export const EdgeRenderer: React.FC = React.memo(() => {
  // Get all edges from store
  const { edges, selectedElementIds, selectElement } = useUnifiedCanvasStore(
    useShallow((state) => ({
      edges: state.edges,
      selectedElementIds: state.selectedElementIds,
      selectElement: state.selectElement,
    }))
  );

  // Convert edges Map to array for rendering
  const edgeArray = React.useMemo(() => {
    return Array.from(edges.values());
  }, [edges]);

  // Handle edge selection
  const handleEdgeSelect = React.useCallback((edgeId: string) => {
    selectElement(edgeId as any); // Cast to ElementId for compatibility
  }, [selectElement]);

  if (edgeArray.length === 0) return null;

  return (
    <Group name="edges" listening={false}>
      {edgeArray.map((edge) => (
        <EdgeNode
          key={edge.id}
          edge={edge}
          isSelected={selectedElementIds.has(edge.id)}
          onSelect={handleEdgeSelect}
        />
      ))}
    </Group>
  );
});

EdgeRenderer.displayName = 'EdgeRenderer';
// Archived (2025-09-01): Legacy react-konva edge components.
