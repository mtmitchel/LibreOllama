import { useCallback } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { useHistoryStore } from '../store/historyStore';
import { CanvasElement, Point, Bounds } from '../types/canvas';
import { 
  getElementBounds, 
  getElementCenter, 
  pointRotate, 
  snapToGrid 
} from '../utils/geometry';
import { findSnapTargets } from '../utils/collision';
import { debounce } from '../utils/performance';
import { v4 as uuidv4 } from 'uuid';

export const useElementManipulation = () => {
  const {
    elements,
    selectedIds,
    settings,
    updateElement,
    deleteElements,
    addElement,
    selectElement,
    selectElements,
    groupElements,
    ungroupElements,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward
  } = useCanvasStore();

  const { saveState } = useHistoryStore();

  // Debounced history save
  const debouncedSaveHistory = useCallback(
    debounce((description: string) => {
      const { elements, selectedIds, viewport } = useCanvasStore.getState();
      saveState(elements, selectedIds, viewport, description);
    }, 500),
    [saveState]
  );

  // Transform operations
  const moveElements = useCallback((elementIds: string[], deltaX: number, deltaY: number, options?: {
    snapToGrid?: boolean;
    snapToElements?: boolean;
    saveHistory?: boolean;
  }) => {
    const { snapToGrid: snapGrid = settings.snapToGrid, snapToElements = true, saveHistory = true } = options || {};

    elementIds.forEach(id => {
      const element = elements[id];
      if (!element || element.locked) return;

      let newX = element.x + deltaX;
      let newY = element.y + deltaY;

      // Apply grid snapping
      if (snapGrid) {
        const snapped = snapToGrid({ x: newX, y: newY }, settings.gridSize);
        newX = snapped.x;
        newY = snapped.y;
      }

      // Apply element snapping
      if (snapToElements) {
        const newBounds = { x: newX, y: newY, width: element.width, height: element.height };
        const snapResult = findSnapTargets(
          Object.values(elements).filter(el => !elementIds.includes(el.id)),
          element,
          newBounds
        );

        if (snapResult.x !== undefined) newX = snapResult.x;
        if (snapResult.y !== undefined) newY = snapResult.y;
      }

      updateElement(id, { x: newX, y: newY, modifiedAt: Date.now() });
    });

    if (saveHistory) {
      debouncedSaveHistory('Move elements');
    }
  }, [elements, settings, updateElement, debouncedSaveHistory]);

  const resizeElements = useCallback((elementIds: string[], newBounds: Bounds, options?: {
    preserveAspectRatio?: boolean;
    resizeFromCenter?: boolean;
    saveHistory?: boolean;
  }) => {
    const { preserveAspectRatio = false, resizeFromCenter = false, saveHistory = true } = options || {};

    elementIds.forEach(id => {
      const element = elements[id];
      if (!element || element.locked) return;

      let { x, y, width, height } = newBounds;

      // Preserve aspect ratio if requested
      if (preserveAspectRatio) {
        const originalAspectRatio = element.width / element.height;
        const newAspectRatio = width / height;

        if (newAspectRatio > originalAspectRatio) {
          width = height * originalAspectRatio;
        } else {
          height = width / originalAspectRatio;
        }
      }

      // Resize from center if requested
      if (resizeFromCenter) {
        const centerX = element.x + element.width / 2;
        const centerY = element.y + element.height / 2;
        x = centerX - width / 2;
        y = centerY - height / 2;
      }

      // Ensure minimum size
      width = Math.max(width, 10);
      height = Math.max(height, 10);

      updateElement(id, { 
        x, 
        y, 
        width, 
        height, 
        modifiedAt: Date.now() 
      });
    });

    if (saveHistory) {
      debouncedSaveHistory('Resize elements');
    }
  }, [elements, updateElement, debouncedSaveHistory]);

  const rotateElements = useCallback((elementIds: string[], angle: number, origin?: Point, options?: {
    snapToAngle?: boolean;
    saveHistory?: boolean;
  }) => {
    const { snapToAngle = false, saveHistory = true } = options || {};

    elementIds.forEach(id => {
      const element = elements[id];
      if (!element || element.locked) return;

      let newRotation = element.rotation + angle;

      // Snap to common angles (15 degree increments)
      if (snapToAngle) {
        const snapIncrement = (15 * Math.PI) / 180; // 15 degrees in radians
        newRotation = Math.round(newRotation / snapIncrement) * snapIncrement;
      }

      // Normalize rotation to 0-2π range
      newRotation = newRotation % (2 * Math.PI);
      if (newRotation < 0) newRotation += 2 * Math.PI;

      let newX = element.x;
      let newY = element.y;

      // If origin is provided, rotate around that point
      if (origin) {
        const elementCenter = getElementCenter(element);
        const rotatedCenter = pointRotate(elementCenter, angle, origin);
        newX = rotatedCenter.x - element.width / 2;
        newY = rotatedCenter.y - element.height / 2;
      }

      updateElement(id, { 
        x: newX,
        y: newY,
        rotation: newRotation, 
        modifiedAt: Date.now() 
      });
    });

    if (saveHistory) {
      debouncedSaveHistory('Rotate elements');
    }
  }, [elements, updateElement, debouncedSaveHistory]);

  const scaleElements = useCallback((elementIds: string[], scaleX: number, scaleY: number, origin?: Point, options?: {
    saveHistory?: boolean;
  }) => {
    const { saveHistory = true } = options || {};

    elementIds.forEach(id => {
      const element = elements[id];
      if (!element || element.locked) return;

      const newWidth = element.width * scaleX;
      const newHeight = element.height * scaleY;

      let newX = element.x;
      let newY = element.y;

      // Scale from origin point if provided
      if (origin) {
        const elementCenter = getElementCenter(element);
        const deltaX = (elementCenter.x - origin.x) * (scaleX - 1);
        const deltaY = (elementCenter.y - origin.y) * (scaleY - 1);
        newX = element.x + deltaX;
        newY = element.y + deltaY;
      }

      updateElement(id, { 
        x: newX,
        y: newY,
        width: Math.max(newWidth, 10),
        height: Math.max(newHeight, 10),
        modifiedAt: Date.now() 
      });
    });

    if (saveHistory) {
      debouncedSaveHistory('Scale elements');
    }
  }, [elements, updateElement, debouncedSaveHistory]);

  // Duplication and cloning
  const duplicateElements = useCallback((elementIds: string[], offset: Point = { x: 20, y: 20 }) => {
    const newElements: CanvasElement[] = [];
    const newIds: string[] = [];

    elementIds.forEach(id => {
      const element = elements[id];
      if (!element) return;

      const newId = uuidv4();
      const duplicatedElement: CanvasElement = {
        ...element,
        id: newId,
        x: element.x + offset.x,
        y: element.y + offset.y,
        createdAt: Date.now(),
        modifiedAt: Date.now()
      };

      newElements.push(duplicatedElement);
      newIds.push(newId);
    });

    // Add all duplicated elements
    newElements.forEach(element => addElement(element));
    
    // Select the duplicated elements
    selectElements(newIds);

    debouncedSaveHistory('Duplicate elements');
    return newIds;
  }, [elements, addElement, selectElements, debouncedSaveHistory]);

  const cloneElements = useCallback((elementIds: string[]) => {
    return duplicateElements(elementIds, { x: 0, y: 0 });
  }, [duplicateElements]);

  // Alignment operations
  const alignElements = useCallback((elementIds: string[], alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (elementIds.length < 2) return;

    const elementsToAlign = elementIds.map(id => elements[id]).filter(Boolean);
    const bounds = elementsToAlign.map(el => getElementBounds(el));
    
    let targetValue: number;

    switch (alignment) {
      case 'left':
        targetValue = Math.min(...bounds.map(b => b.x));
        elementsToAlign.forEach((element, index) => {
          updateElement(element.id, { x: targetValue, modifiedAt: Date.now() });
        });
        break;
      case 'right':
        targetValue = Math.max(...bounds.map(b => b.x + b.width));
        elementsToAlign.forEach((element, index) => {
          updateElement(element.id, { x: targetValue - element.width, modifiedAt: Date.now() });
        });
        break;
      case 'center':
        targetValue = (Math.min(...bounds.map(b => b.x)) + Math.max(...bounds.map(b => b.x + b.width))) / 2;
        elementsToAlign.forEach((element, index) => {
          updateElement(element.id, { x: targetValue - element.width / 2, modifiedAt: Date.now() });
        });
        break;
      case 'top':
        targetValue = Math.min(...bounds.map(b => b.y));
        elementsToAlign.forEach((element, index) => {
          updateElement(element.id, { y: targetValue, modifiedAt: Date.now() });
        });
        break;
      case 'bottom':
        targetValue = Math.max(...bounds.map(b => b.y + b.height));
        elementsToAlign.forEach((element, index) => {
          updateElement(element.id, { y: targetValue - element.height, modifiedAt: Date.now() });
        });
        break;
      case 'middle':
        targetValue = (Math.min(...bounds.map(b => b.y)) + Math.max(...bounds.map(b => b.y + b.height))) / 2;
        elementsToAlign.forEach((element, index) => {
          updateElement(element.id, { y: targetValue - element.height / 2, modifiedAt: Date.now() });
        });
        break;
    }

    debouncedSaveHistory(`Align ${alignment}`);
  }, [elements, updateElement, debouncedSaveHistory]);

  const distributeElements = useCallback((elementIds: string[], direction: 'horizontal' | 'vertical') => {
    if (elementIds.length < 3) return;

    const elementsToDistribute = elementIds
      .map(id => elements[id])
      .filter(Boolean)
      .sort((a, b) => direction === 'horizontal' ? a.x - b.x : a.y - b.y);

    const first = elementsToDistribute[0];
    const last = elementsToDistribute[elementsToDistribute.length - 1];

    if (direction === 'horizontal') {
      const totalWidth = (last.x + last.width) - first.x;
      const elementWidths = elementsToDistribute.reduce((sum, el) => sum + el.width, 0);
      const totalGap = totalWidth - elementWidths;
      const gapSize = totalGap / (elementsToDistribute.length - 1);

      let currentX = first.x + first.width;
      for (let i = 1; i < elementsToDistribute.length - 1; i++) {
        currentX += gapSize;
        updateElement(elementsToDistribute[i].id, { 
          x: currentX, 
          modifiedAt: Date.now() 
        });
        currentX += elementsToDistribute[i].width;
      }
    } else {
      const totalHeight = (last.y + last.height) - first.y;
      const elementHeights = elementsToDistribute.reduce((sum, el) => sum + el.height, 0);
      const totalGap = totalHeight - elementHeights;
      const gapSize = totalGap / (elementsToDistribute.length - 1);

      let currentY = first.y + first.height;
      for (let i = 1; i < elementsToDistribute.length - 1; i++) {
        currentY += gapSize;
        updateElement(elementsToDistribute[i].id, { 
          y: currentY, 
          modifiedAt: Date.now() 
        });
        currentY += elementsToDistribute[i].height;
      }
    }

    debouncedSaveHistory(`Distribute ${direction}`);
  }, [elements, updateElement, debouncedSaveHistory]);

  // Layer operations
  const reorderElements = useCallback((elementIds: string[], operation: 'front' | 'back' | 'forward' | 'backward') => {
    switch (operation) {
      case 'front':
        bringToFront(elementIds);
        break;
      case 'back':
        sendToBack(elementIds);
        break;
      case 'forward':
        bringForward(elementIds);
        break;
      case 'backward':
        sendBackward(elementIds);
        break;
    }
    debouncedSaveHistory(`Send ${operation}`);
  }, [bringToFront, sendToBack, bringForward, sendBackward, debouncedSaveHistory]);

  // Grouping operations
  const createGroup = useCallback((elementIds: string[], name?: string) => {
    if (elementIds.length < 2) return null;

    const groupId = groupElements(elementIds);
    if (groupId && name) {
      updateElement(groupId, { 
        data: { ...elements[groupId]?.data, name },
        modifiedAt: Date.now() 
      });
    }

    debouncedSaveHistory('Create group');
    return groupId;
  }, [groupElements, updateElement, elements, debouncedSaveHistory]);

  const breakGroup = useCallback((groupId: string) => {
    ungroupElements(groupId);
    debouncedSaveHistory('Break group');
  }, [ungroupElements, debouncedSaveHistory]);

  // Style operations
  const copyStyle = useCallback((sourceId: string, targetIds: string[], properties?: string[]) => {
    const sourceElement = elements[sourceId];
    if (!sourceElement) return;

    const styleToCopy = properties ? 
      Object.fromEntries(properties.map(prop => [prop, sourceElement.style?.[prop as keyof typeof sourceElement.style]])) :
      sourceElement.style;

    targetIds.forEach(id => {
      if (id !== sourceId && elements[id]) {
        updateElement(id, { 
          style: { ...elements[id].style, ...styleToCopy },
          modifiedAt: Date.now() 
        });
      }
    });

    debouncedSaveHistory('Copy style');
  }, [elements, updateElement, debouncedSaveHistory]);

  const updateStyle = useCallback((elementIds: string[], styleUpdates: Partial<CanvasElement['style']>) => {
    elementIds.forEach(id => {
      const element = elements[id];
      if (!element || element.locked) return;

      updateElement(id, { 
        style: { ...element.style, ...styleUpdates },
        modifiedAt: Date.now() 
      });
    });

    debouncedSaveHistory('Update style');
  }, [elements, updateElement, debouncedSaveHistory]);

  // Bulk operations
  const deleteSelectedElements = useCallback(() => {
    if (selectedIds.length > 0) {
      deleteElements(selectedIds);
      debouncedSaveHistory('Delete elements');
    }
  }, [selectedIds, deleteElements, debouncedSaveHistory]);

  const lockElements = useCallback((elementIds: string[], locked: boolean = true) => {
    elementIds.forEach(id => {
      updateElement(id, { locked, modifiedAt: Date.now() });
    });
    debouncedSaveHistory(locked ? 'Lock elements' : 'Unlock elements');
  }, [updateElement, debouncedSaveHistory]);

  const toggleVisibility = useCallback((elementIds: string[], visible?: boolean) => {
    elementIds.forEach(id => {
      const element = elements[id];
      if (!element) return;

      const newVisibility = visible !== undefined ? visible : !element.visible;
      updateElement(id, { visible: newVisibility, modifiedAt: Date.now() });
    });
    debouncedSaveHistory('Toggle visibility');
  }, [elements, updateElement, debouncedSaveHistory]);

  return {
    // Transform operations
    moveElements,
    resizeElements,
    rotateElements,
    scaleElements,
    
    // Duplication
    duplicateElements,
    cloneElements,
    
    // Alignment
    alignElements,
    distributeElements,
    
    // Layer operations
    reorderElements,
    
    // Grouping
    createGroup,
    breakGroup,
    
    // Style operations
    copyStyle,
    updateStyle,
    
    // Bulk operations
    deleteSelectedElements,
    lockElements,
    toggleVisibility
  };
};

export default useElementManipulation;
