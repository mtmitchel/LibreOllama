import { useEffect, useRef, useCallback, useState } from 'react';
import { 
  dragDropManager, 
  DragData, 
  DropZoneConfig, 
  DragState, 
  DragFeedback 
} from '../lib/drag-drop-system';

/**
 * Hook for making elements draggable
 */
export function useDraggable(
  data: DragData | (() => DragData),
  options?: {
    feedback?: DragFeedback;
    disabled?: boolean;
    onDragStart?: (data: DragData) => void;
    onDragEnd?: (success: boolean) => void;
  }
) {
  const elementRef = useRef<HTMLElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (options?.disabled || e.button !== 0) return;

    const dragData = typeof data === 'function' ? data() : data;
    const element = elementRef.current;
    if (!element || !dragData) return;

    e.preventDefault();
    
    const startPosition = { x: e.clientX, y: e.clientY };
    
    // Start drag operation
    dragDropManager.startDrag(dragData, element, startPosition, options?.feedback);
    setIsDragging(true);
    
    options?.onDragStart?.(dragData);

    // Listen for drag end
    const unsubscribe = dragDropManager.subscribe((state) => {
      if (!state.isDragging && isDragging) {
        setIsDragging(false);
        options?.onDragEnd?.(false); // We don't know success here, but it's ended
        unsubscribe();
      }
    });
  }, [data, options, isDragging]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('mousedown', handleMouseDown);
    
    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
    };
  }, [handleMouseDown]);

  return {
    ref: elementRef,
    isDragging,
    dragProps: {
      draggable: true,
      onDragStart: (e: React.DragEvent) => {
        // Prevent default HTML5 drag to use our custom system
        e.preventDefault();
      }
    }
  };
}

/**
 * Hook for creating drop zones
 */
export function useDropZone(
  config: Omit<DropZoneConfig, 'id'> & { id?: string },
  dependencies: any[] = []
) {
  const elementRef = useRef<HTMLElement>(null);
  const configRef = useRef(config);
  const [isValidDrop, setIsValidDrop] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);

  // Update config ref when dependencies change
  useEffect(() => {
    configRef.current = config;
  }, dependencies);

  const dropZoneId = config.id || `drop-zone-${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Set drop zone data attribute
    element.setAttribute('data-drop-zone', dropZoneId);

    // Register drop zone
    const dropZoneConfig: DropZoneConfig = {
      id: dropZoneId,
      accepts: configRef.current.accepts,
      onDrop: configRef.current.onDrop,
      onDragOver: (data) => {
        const result = configRef.current.onDragOver?.(data) ?? true;
        setIsValidDrop(result);
        return result;
      },
      onDragEnter: (data) => {
        setIsActive(true);
        configRef.current.onDragEnter?.(data);
      },
      onDragLeave: () => {
        setIsActive(false);
        setIsValidDrop(false);
        configRef.current.onDragLeave?.();
      }
    };

    const unregister = dragDropManager.registerDropZone(dropZoneConfig);

    // Subscribe to drag state changes
    const unsubscribe = dragDropManager.subscribe((state) => {
      setDragState(state);
      
      // Reset states when drag ends
      if (!state.isDragging) {
        setIsActive(false);
        setIsValidDrop(false);
      }
    });

    return () => {
      unregister();
      unsubscribe();
      element.removeAttribute('data-drop-zone');
    };
  }, [dropZoneId]);

  const canAccept = dragState?.dragData ? 
    config.accepts.includes(dragState.dragData.type) : false;

  return {
    ref: elementRef,
    isActive,
    isValidDrop,
    canAccept,
    isDragOver: dragState?.activeDropZone === dropZoneId,
    dragData: dragState?.dragData,
    dropProps: {
      'data-drop-zone': dropZoneId,
      className: `
        ${isActive ? 'drop-zone-active' : ''}
        ${isValidDrop ? 'drop-zone-valid' : ''}
        ${canAccept ? 'drop-zone-can-accept' : ''}
      `.trim()
    }
  };
}

/**
 * Hook for accessing global drag state
 */
export function useDragState() {
  const [dragState, setDragState] = useState<DragState>(dragDropManager.getDragState());

  useEffect(() => {
    const unsubscribe = dragDropManager.subscribe(setDragState);
    return unsubscribe;
  }, []);

  return {
    ...dragState,
    isDraggingType: (type: DragData['type']) => dragDropManager.isDraggingType(type),
    cancelDrag: () => dragDropManager.cancelDrag()
  };
}

/**
 * Hook for handling file drops
 */
export function useFileDrop(
  onDrop: (files: File[]) => void,
  options?: {
    accept?: string[];
    multiple?: boolean;
    disabled?: boolean;
  }
) {
  const elementRef = useRef<HTMLElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: DragEvent) => {
    if (options?.disabled) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    
    setIsDragOver(true);
  }, [options?.disabled]);

  const handleDragLeave = useCallback((e: DragEvent) => {
    if (options?.disabled) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Only set to false if we're leaving the element entirely
    const rect = elementRef.current?.getBoundingClientRect();
    if (rect && (
      e.clientX < rect.left || 
      e.clientX > rect.right || 
      e.clientY < rect.top || 
      e.clientY > rect.bottom
    )) {
      setIsDragOver(false);
    }
  }, [options?.disabled]);

  const handleDrop = useCallback((e: DragEvent) => {
    if (options?.disabled) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer?.files || []);
    
    if (files.length === 0) return;

    // Filter by accepted types if specified
    const filteredFiles = options?.accept ? 
      files.filter(file => options.accept!.some(type => file.type.match(type))) :
      files;

    // Limit to single file if multiple not allowed
    const finalFiles = options?.multiple === false ? 
      filteredFiles.slice(0, 1) : 
      filteredFiles;

    if (finalFiles.length > 0) {
      onDrop(finalFiles);
    }
  }, [onDrop, options]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('dragover', handleDragOver);
    element.addEventListener('dragleave', handleDragLeave);
    element.addEventListener('drop', handleDrop);

    return () => {
      element.removeEventListener('dragover', handleDragOver);
      element.removeEventListener('dragleave', handleDragLeave);
      element.removeEventListener('drop', handleDrop);
    };
  }, [handleDragOver, handleDragLeave, handleDrop]);

  return {
    ref: elementRef,
    isDragOver,
    fileDropProps: {
      onDragOver: (e: React.DragEvent) => e.preventDefault(),
      onDrop: (e: React.DragEvent) => e.preventDefault()
    }
  };
}

/**
 * Hook for keyboard accessibility alternatives
 */
export function useDragDropKeyboard(
  onAction: (action: 'cut' | 'copy' | 'paste') => void,
  options?: {
    disabled?: boolean;
  }
) {
  useEffect(() => {
    if (options?.disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'x':
            e.preventDefault();
            onAction('cut');
            break;
          case 'c':
            e.preventDefault();
            onAction('copy');
            break;
          case 'v':
            e.preventDefault();
            onAction('paste');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onAction, options?.disabled]);
}

/**
 * Utility hook for creating drag previews
 */
export function useDragPreview() {
  const createPreview = useCallback((element: HTMLElement, content?: string): HTMLElement => {
    const preview = element.cloneNode(true) as HTMLElement;
    
    // Style the preview
    preview.style.position = 'fixed';
    preview.style.pointerEvents = 'none';
    preview.style.zIndex = '9999';
    preview.style.opacity = '0.8';
    preview.style.transform = 'rotate(5deg)';
    preview.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
    
    // Override content if provided
    if (content) {
      preview.textContent = content;
    }
    
    // Add to body temporarily
    document.body.appendChild(preview);
    
    return preview;
  }, []);

  const removePreview = useCallback((preview: HTMLElement) => {
    if (preview.parentNode) {
      preview.parentNode.removeChild(preview);
    }
  }, []);

  return { createPreview, removePreview };
}