/**
 * Event Delegation System for Canvas Layers
 * Phase 4.4 of Canvas Master Plan
 * 
 * Implements efficient event delegation to reduce the number of 
 * active event listeners on individual shapes
 */

import { KonvaEventObject } from 'konva/lib/Node';
import { KonvaNode } from '../../types/konva.types';

export interface EventDelegationConfig {
  enableDrag?: boolean;
  enableClick?: boolean;
  enableHover?: boolean;
  enableSelection?: boolean;
}

export interface DelegatedEventHandlers {
  onElementClick?: (elementId: string, event: KonvaEventObject<MouseEvent>) => void;
  onElementDragStart?: (elementId: string, event: KonvaEventObject<DragEvent>) => void;
  onElementDragMove?: (elementId: string, event: KonvaEventObject<DragEvent>) => void;
  onElementDragEnd?: (elementId: string, event: KonvaEventObject<DragEvent>) => void;
  onElementHover?: (elementId: string, event: KonvaEventObject<MouseEvent>) => void;
  onElementHoverEnd?: (elementId: string, event: KonvaEventObject<MouseEvent>) => void;
}

/**
 * Creates event delegation handlers for a canvas layer
 * Replaces individual shape listeners with a single layer listener
 */
export function createEventDelegation(
  config: EventDelegationConfig,
  handlers: DelegatedEventHandlers
) {
  const getElementId = (target: any): string | null => {
    // Walk up the Konva node tree to find an element with an ID
    let current = target;
    while (current) {
      if (current.attrs?.elementId || current.attrs?.id) {
        return current.attrs.elementId || current.attrs.id;
      }
      current = current.parent;
    }
    return null;
  };

  const delegatedHandlers: Record<string, (event: KonvaEventObject<any>) => void> = {};

  if (config.enableClick && handlers.onElementClick) {
    delegatedHandlers.click = (event: KonvaEventObject<MouseEvent>) => {
      const elementId = getElementId(event.target);
      if (elementId) {
        handlers.onElementClick!(elementId, event);
      }
    };
  }

  if (config.enableDrag) {
    if (handlers.onElementDragStart) {
      delegatedHandlers.dragstart = (event: KonvaEventObject<DragEvent>) => {
        const elementId = getElementId(event.target);
        if (elementId) {
          handlers.onElementDragStart!(elementId, event);
        }
      };
    }

    if (handlers.onElementDragMove) {
      delegatedHandlers.dragmove = (event: KonvaEventObject<DragEvent>) => {
        const elementId = getElementId(event.target);
        if (elementId) {
          handlers.onElementDragMove!(elementId, event);
        }
      };
    }

    if (handlers.onElementDragEnd) {
      delegatedHandlers.dragend = (event: KonvaEventObject<DragEvent>) => {
        const elementId = getElementId(event.target);
        if (elementId) {
          handlers.onElementDragEnd!(elementId, event);
        }
      };
    }
  }

  if (config.enableHover) {
    if (handlers.onElementHover) {
      delegatedHandlers.mouseenter = (event: KonvaEventObject<MouseEvent>) => {
        const elementId = getElementId(event.target);
        if (elementId) {
          handlers.onElementHover!(elementId, event);
        }
      };
    }

    if (handlers.onElementHoverEnd) {
      delegatedHandlers.mouseleave = (event: KonvaEventObject<MouseEvent>) => {
        const elementId = getElementId(event.target);
        if (elementId) {
          handlers.onElementHoverEnd!(elementId, event);
        }
      };
    }
  }

  return delegatedHandlers;
}

/**
 * Utility to mark non-interactive elements
 * Applies listening={false} to improve performance
 */
export function makeNonInteractive<T extends { listening?: boolean }>(props: T): T {
  return {
    ...props,
    listening: false
  };
}

/**
 * Utility to optimize layer properties for performance
 */
export function optimizeLayerProps<T extends { 
  listening?: boolean;
  perfectDrawEnabled?: boolean;
}>(props: T, isInteractive: boolean = true): T {
  return {
    ...props,
    listening: isInteractive,
    perfectDrawEnabled: false // Disable extra drawing pass for better performance
  };
}
