// src/features/canvas/components/edges/DraftEdge.tsx
import React, { useMemo } from 'react';
import { Line, Circle } from 'react-konva';
import { useUnifiedCanvasStore } from '../../stores/unifiedCanvasStore';
import { toWorldPort } from '../../utils/ports';

/**
 * DraftEdge - Live ghost edge rendering in Overlay layer
 * Shows the edge being created with snapping feedback
 */
export const DraftEdge: React.FC = React.memo(() => {
  // Get draft state from store
  const draft = useUnifiedCanvasStore(state => state.draft);
  const elements = useUnifiedCanvasStore(state => state.elements);

  // Calculate draft edge points
  const draftPoints = useMemo(() => {
    if (!draft) return null;

    // Get source element and port position
    const sourceElement = elements.get(draft.from.elementId);
    if (!sourceElement || sourceElement.type === 'edge') return null;

    const sourcePort = sourceElement.ports?.find(p => p.kind === draft.from.portKind);
    if (!sourcePort) return null;

    const sourceWorld = toWorldPort(sourceElement, sourcePort);
    
    // Use snap position if available, otherwise use pointer position
    let endWorld = draft.toWorld || sourceWorld;
    if (draft.snap) {
      const snapElement = elements.get(draft.snap.elementId);
      if (snapElement && snapElement.type !== 'edge') {
        const snapPort = snapElement.ports?.find(p => p.kind === draft.snap!.portKind);
        if (snapPort) {
          endWorld = toWorldPort(snapElement, snapPort);
        }
      }
    }

    return [sourceWorld.x, sourceWorld.y, endWorld.x, endWorld.y];
  }, [draft, elements]);

  // Don't render if no draft or invalid points
  if (!draft || !draftPoints) return null;

  return (
    <>
      {/* Draft edge line */}
      <Line
        points={draftPoints}
        stroke="#6b7280"
        strokeWidth={2}
        dash={[6, 4]}
        lineCap="round"
        lineJoin="round"
        listening={false}
        perfectDrawEnabled={false}
        opacity={0.8}
      />
      
      {/* Endpoint indicators */}
      {/* Source port indicator */}
      <Circle
        x={draftPoints[0]}
        y={draftPoints[1]}
        radius={4}
        fill="#3B82F6"
        stroke="#ffffff"
        strokeWidth={2}
        listening={false}
        opacity={0.9}
      />
      
      {/* Target port indicator (different color if snapped) */}
      <Circle
        x={draftPoints[2]}
        y={draftPoints[3]}
        radius={draft.snap ? 6 : 4}
        fill={draft.snap ? "#10B981" : "#6b7280"}
        stroke="#ffffff"
        strokeWidth={2}
        listening={false}
        opacity={0.9}
      />
      
      {/* Snap target highlight ring */}
      {draft.snap && (
        <Circle
          x={draftPoints[2]}
          y={draftPoints[3]}
          radius={12}
          fill="transparent"
          stroke="#10B981"
          strokeWidth={2}
          dash={[4, 4]}
          listening={false}
          opacity={0.6}
        />
      )}
    </>
  );
});

DraftEdge.displayName = 'DraftEdge';
// Archived (2025-09-01): Legacy react-konva edge components.
