import React from 'react';
import { useUnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';
import { ToolProps } from '../ToolType';
import Konva from 'konva';
import { createElementId, ElementId } from '../../../types/enhanced.types';
import { PortKind } from '../../../types/canvas-elements';
import { findClosestPort } from '../../../utils/ports';

export const ConnectorTool: React.FC<ToolProps> = React.memo(({ stageRef, isActive, connectorType }) => {
  // Use individual selectors to avoid selector object recreation issues
  const selectedTool = useUnifiedCanvasStore((state) => state.selectedTool);
  const draft = useUnifiedCanvasStore((state) => state.draft);
  const elements = useUnifiedCanvasStore((state) => state.elements);
  const startEdgeDraft = useUnifiedCanvasStore((state) => state.startEdgeDraft);
  const updateEdgeDraftPointer = useUnifiedCanvasStore((state) => state.updateEdgeDraftPointer);
  const updateEdgeDraftSnap = useUnifiedCanvasStore((state) => state.updateEdgeDraftSnap);
  const commitEdgeDraftTo = useUnifiedCanvasStore((state) => state.commitEdgeDraftTo);
  const cancelEdgeDraft = useUnifiedCanvasStore((state) => state.cancelEdgeDraft);

  const isDrawingConnector = selectedTool === 'connector-line' || selectedTool === 'connector-arrow';

  // Use refs to avoid stale closures in event handlers
  const draftRef = React.useRef(draft);
  const cancelEdgeDraftRef = React.useRef(cancelEdgeDraft);

  // Update refs when values change
  React.useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  React.useEffect(() => {
    cancelEdgeDraftRef.current = cancelEdgeDraft;
  }, [cancelEdgeDraft]);

  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    if (isDrawingConnector && e.button === 0) { // Left click
      const stage = stageRef.current;
      if (!stage) return;
      const pointerPosition = stage.getPointerPosition();
      if (pointerPosition) {
        // Find closest port for snapping
        const snapDistance = 20; // pixels
        const closestPort = findClosestPort(pointerPosition, elements as Map<ElementId, any>, null, snapDistance);
        if (closestPort) {
          startEdgeDraft({ elementId: closestPort.port.elementId, portKind: closestPort.port.kind });
        } else {
          // No port found, start draft with dummy for free-floating
          startEdgeDraft({ elementId: createElementId('dummy-source-id'), portKind: 'CENTER' });
        }
      }
    }
  }, [isDrawingConnector, stageRef, elements, startEdgeDraft]);

  const handleMouseMove = React.useCallback((e: React.MouseEvent) => {
    if (isDrawingConnector && draftRef.current) {
      const stage = stageRef.current;
      if (!stage) return;
      const pointerPosition = stage.getPointerPosition();
      if (pointerPosition) {
        updateEdgeDraftPointer(pointerPosition);
        // Find closest port for snapping, excluding the source element
        const snapDistance = 20; // pixels
        const closestPort = findClosestPort(pointerPosition, elements as Map<ElementId, any>, draftRef.current.from.elementId, snapDistance);
        updateEdgeDraftSnap(closestPort ? { elementId: closestPort.port.elementId, portKind: closestPort.port.kind } : null);
      }
    }
  }, [isDrawingConnector, stageRef, updateEdgeDraftPointer, updateEdgeDraftSnap, elements]);

  const handleMouseUp = React.useCallback((e: React.MouseEvent) => {
    if (isDrawingConnector && draftRef.current) {
      // Commit to the current snap target or null for free-floating
      const target = draftRef.current.snap || draftRef.current.snapTarget;
      commitEdgeDraftTo(target ? { elementId: target.elementId, portKind: target.portKind } : undefined);
    }
  }, [isDrawingConnector, commitEdgeDraftTo]);

  const handleKeyDown = React.useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && draftRef.current) {
      cancelEdgeDraftRef.current();
    }
  }, []);

  React.useEffect(() => {
    if (isActive) {
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, handleKeyDown]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        cursor: isDrawingConnector ? 'crosshair' : 'default',
        pointerEvents: isDrawingConnector ? 'auto' : 'none',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    />
  );
});
