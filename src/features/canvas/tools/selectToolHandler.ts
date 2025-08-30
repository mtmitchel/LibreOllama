
import { KonvaEventObject } from 'konva/lib/Node';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { ElementId, ElementOrSectionId } from '../types/enhanced.types';
import { ToolEventHandler } from '../utils/CanvasEventManager';

export const selectToolHandler: ToolEventHandler = {
  onMouseDown(e: KonvaEventObject<MouseEvent>): boolean {
    const { selectElement, clearSelection } = useUnifiedCanvasStore.getState();
    const target = e.target;
    let elementId = target.id();

    if (!elementId && target.parent) {
      elementId = target.parent.id();
    }

    if (elementId) {
      selectElement(elementId as ElementId, e.evt.ctrlKey || e.evt.metaKey);
    } else {
      clearSelection();
    }
    return true;
  },

  onDragMove(e: KonvaEventObject<DragEvent>): boolean {
    const { updateElement } = useUnifiedCanvasStore.getState();
    const target = e.target;
    const elementId = target.id();
    if (elementId) {
      updateElement(elementId as ElementOrSectionId, {
        x: target.x(),
        y: target.y(),
      });
    }
    return true;
  },

  onDragEnd(e: KonvaEventObject<DragEvent>): boolean {
    const { updateElement } = useUnifiedCanvasStore.getState();
    const target = e.target;
    const elementId = target.id();
    if (elementId) {
      updateElement(elementId as ElementOrSectionId, {
        x: target.x(),
        y: target.y(),
      });
    }
    return true;
  },

  onTransformEnd(e: KonvaEventObject<Event>): boolean {
    const { updateElement } = useUnifiedCanvasStore.getState();
    const target = e.target;
    const elementId = target.id();
    if (elementId) {
      updateElement(elementId as ElementOrSectionId, {
        x: target.x(),
        y: target.y(),
        width: target.width() * target.scaleX(),
        height: target.height() * target.scaleY(),
      });
      target.scaleX(1);
      target.scaleY(1);
    }
    return true;
  },
};
