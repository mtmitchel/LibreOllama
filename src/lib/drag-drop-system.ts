import { TaskItem, ChatMessage, CanvasItem } from './types';

/**
 * Universal drag data interface for type-safe drag-and-drop operations
 */
export interface DragData {
  type: 'task' | 'chat-message' | 'note' | 'file' | 'canvas-item';
  id: string;
  content: string;
  metadata: Record<string, any>;
  source: string; // component/module that initiated drag
}

/**
 * Drop zone configuration interface
 */
export interface DropZoneConfig {
  id: string;
  accepts: DragData['type'][];
  onDrop: (data: DragData, position?: { x: number; y: number }) => Promise<boolean>;
  onDragOver?: (data: DragData) => boolean;
  onDragEnter?: (data: DragData) => void;
  onDragLeave?: () => void;
}

/**
 * Visual feedback configuration for drag operations
 */
export interface DragFeedback {
  preview?: {
    element: HTMLElement;
    offset?: { x: number; y: number };
  };
  cursor?: string;
  opacity?: number;
}

/**
 * Drag operation state
 */
export interface DragState {
  isDragging: boolean;
  dragData: DragData | null;
  dragElement: HTMLElement | null;
  startPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
  validDropZones: string[];
  activeDropZone: string | null;
}

/**
 * Universal Drag-and-Drop Manager
 * Coordinates drag-and-drop operations across all modules with type safety
 */
export class DragDropManager {
  private static instance: DragDropManager;
  private dropZones = new Map<string, DropZoneConfig>();
  private dragState: DragState = {
    isDragging: false,
    dragData: null,
    dragElement: null,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    validDropZones: [],
    activeDropZone: null
  };
  private listeners = new Set<(state: DragState) => void>();

  static getInstance(): DragDropManager {
    if (!DragDropManager.instance) {
      DragDropManager.instance = new DragDropManager();
    }
    return DragDropManager.instance;
  }

  /**
   * Register a drop zone
   */
  registerDropZone(config: DropZoneConfig): () => void {
    this.dropZones.set(config.id, config);
    
    // Return cleanup function
    return () => {
      this.dropZones.delete(config.id);
    };
  }

  /**
   * Start a drag operation
   */
  startDrag(
    data: DragData,
    element: HTMLElement,
    position: { x: number; y: number },
    feedback?: DragFeedback
  ): void {
    // Find valid drop zones for this data type
    const validDropZones = Array.from(this.dropZones.entries())
      .filter(([_, config]) => config.accepts.includes(data.type))
      .map(([id]) => id);

    this.dragState = {
      isDragging: true,
      dragData: data,
      dragElement: element,
      startPosition: position,
      currentPosition: position,
      validDropZones,
      activeDropZone: null
    };

    // Apply visual feedback
    if (feedback) {
      this.applyDragFeedback(element, feedback);
    }

    // Add global event listeners
    this.addGlobalListeners();

    // Notify listeners
    this.notifyListeners();

    // Highlight valid drop zones
    this.highlightValidDropZones(true);
  }

  /**
   * Update drag position
   */
  updateDragPosition(position: { x: number; y: number }): void {
    if (!this.dragState.isDragging) return;

    this.dragState.currentPosition = position;

    // Check for drop zone hover
    const dropZoneId = this.getDropZoneAtPosition(position);
    
    if (dropZoneId !== this.dragState.activeDropZone) {
      // Leave previous drop zone
      if (this.dragState.activeDropZone) {
        const prevConfig = this.dropZones.get(this.dragState.activeDropZone);
        prevConfig?.onDragLeave?.();
      }

      // Enter new drop zone
      this.dragState.activeDropZone = dropZoneId;
      if (dropZoneId && this.dragState.dragData) {
        const config = this.dropZones.get(dropZoneId);
        config?.onDragEnter?.(this.dragState.dragData);
      }
    }

    // Check if drag over is valid
    if (dropZoneId && this.dragState.dragData) {
      const config = this.dropZones.get(dropZoneId);
      const isValid = config?.onDragOver?.(this.dragState.dragData) ?? true;
      
      // Update visual feedback based on validity
      this.updateDropZoneHighlight(dropZoneId, isValid);
    }

    this.notifyListeners();
  }

  /**
   * End drag operation
   */
  async endDrag(position?: { x: number; y: number }): Promise<boolean> {
    if (!this.dragState.isDragging || !this.dragState.dragData) {
      this.resetDragState();
      return false;
    }

    let success = false;
    const finalPosition = position || this.dragState.currentPosition;

    // Attempt drop if over valid drop zone
    if (this.dragState.activeDropZone) {
      const config = this.dropZones.get(this.dragState.activeDropZone);
      if (config) {
        try {
          success = await config.onDrop(this.dragState.dragData, finalPosition);
        } catch (error) {
          console.error('Drop operation failed:', error);
          success = false;
        }
      }
    }

    // Clean up
    this.resetDragState();
    this.highlightValidDropZones(false);
    this.removeGlobalListeners();
    this.notifyListeners();

    return success;
  }

  /**
   * Cancel drag operation
   */
  cancelDrag(): void {
    this.resetDragState();
    this.highlightValidDropZones(false);
    this.removeGlobalListeners();
    this.notifyListeners();
  }

  /**
   * Subscribe to drag state changes
   */
  subscribe(listener: (state: DragState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get current drag state
   */
  getDragState(): DragState {
    return { ...this.dragState };
  }

  /**
   * Check if currently dragging specific type
   */
  isDraggingType(type: DragData['type']): boolean {
    return this.dragState.isDragging && this.dragState.dragData?.type === type;
  }

  // Private methods

  private resetDragState(): void {
    if (this.dragState.dragElement) {
      this.removeDragFeedback(this.dragState.dragElement);
    }

    this.dragState = {
      isDragging: false,
      dragData: null,
      dragElement: null,
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
      validDropZones: [],
      activeDropZone: null
    };
  }

  private applyDragFeedback(element: HTMLElement, feedback: DragFeedback): void {
    if (feedback.opacity !== undefined) {
      element.style.opacity = feedback.opacity.toString();
    }
    if (feedback.cursor) {
      element.style.cursor = feedback.cursor;
    }
    element.classList.add('dragging');
  }

  private removeDragFeedback(element: HTMLElement): void {
    element.style.opacity = '';
    element.style.cursor = '';
    element.classList.remove('dragging');
  }

  private highlightValidDropZones(highlight: boolean): void {
    this.dragState.validDropZones.forEach(zoneId => {
      const element = document.querySelector(`[data-drop-zone="${zoneId}"]`);
      if (element) {
        if (highlight) {
          element.classList.add('drop-zone-valid');
        } else {
          element.classList.remove('drop-zone-valid', 'drop-zone-active', 'drop-zone-invalid');
        }
      }
    });
  }

  private updateDropZoneHighlight(zoneId: string, isValid: boolean): void {
    const element = document.querySelector(`[data-drop-zone="${zoneId}"]`);
    if (element) {
      element.classList.remove('drop-zone-active', 'drop-zone-invalid');
      element.classList.add(isValid ? 'drop-zone-active' : 'drop-zone-invalid');
    }
  }

  private getDropZoneAtPosition(position: { x: number; y: number }): string | null {
    const element = document.elementFromPoint(position.x, position.y);
    if (!element) return null;

    // Find closest drop zone
    const dropZoneElement = element.closest('[data-drop-zone]');
    if (!dropZoneElement) return null;

    const zoneId = dropZoneElement.getAttribute('data-drop-zone');
    return zoneId && this.dragState.validDropZones.includes(zoneId) ? zoneId : null;
  }

  private addGlobalListeners(): void {
    document.addEventListener('mousemove', this.handleGlobalMouseMove);
    document.addEventListener('mouseup', this.handleGlobalMouseUp);
    document.addEventListener('keydown', this.handleGlobalKeyDown);
  }

  private removeGlobalListeners(): void {
    document.removeEventListener('mousemove', this.handleGlobalMouseMove);
    document.removeEventListener('mouseup', this.handleGlobalMouseUp);
    document.removeEventListener('keydown', this.handleGlobalKeyDown);
  }

  private handleGlobalMouseMove = (e: MouseEvent): void => {
    this.updateDragPosition({ x: e.clientX, y: e.clientY });
  };

  private handleGlobalMouseUp = (e: MouseEvent): void => {
    this.endDrag({ x: e.clientX, y: e.clientY });
  };

  private handleGlobalKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      this.cancelDrag();
    }
  };

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.dragState));
  }
}

/**
 * Utility functions for creating drag data from different content types
 */
export class DragDataFactory {
  /**
   * Create drag data from a task
   */
  static fromTask(task: TaskItem, source: string): DragData {
    return {
      type: 'task',
      id: task.id,
      content: task.title,
      metadata: {
        description: task.description,
        status: task.status,
        priority: task.priority,
        energyLevel: task.energyLevel,
        estimatedMinutes: task.estimatedMinutes,
        tags: task.tags,
        dueDate: task.dueDate,
        originalTask: task
      },
      source
    };
  }

  /**
   * Create drag data from a chat message
   */
  static fromChatMessage(message: ChatMessage, source: string): DragData {
    return {
      type: 'chat-message',
      id: message.id,
      content: message.content,
      metadata: {
        role: message.role,
        timestamp: message.timestamp,
        imageUrl: message.imageUrl,
        originalMessage: message
      },
      source
    };
  }

  /**
   * Create drag data from a note block
   */
  static fromNote(noteId: string, content: string, source: string, metadata?: Record<string, any>): DragData {
    return {
      type: 'note',
      id: noteId,
      content,
      metadata: {
        ...metadata,
        originalContent: content
      },
      source
    };
  }

  /**
   * Create drag data from a file
   */
  static fromFile(file: File, source: string): DragData {
    return {
      type: 'file',
      id: `file-${Date.now()}`,
      content: file.name,
      metadata: {
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        file
      },
      source
    };
  }

  /**
   * Create drag data from a canvas item
   */
  static fromCanvasItem(item: CanvasItem, source: string): DragData {
    return {
      type: 'canvas-item',
      id: item.id,
      content: item.content,
      metadata: {
        itemType: item.type,
        position: item.position,
        size: item.size,
        originalItem: item
      },
      source
    };
  }
}

/**
 * Utility functions for drop operations
 */
export class DropOperations {
  /**
   * Convert task to calendar event
   */
  static async taskToCalendarEvent(
    dragData: DragData,
    targetDate: Date,
    duration?: number
  ): Promise<any> {
    if (dragData.type !== 'task') {
      throw new Error('Invalid drag data type for calendar event creation');
    }

    const task = dragData.metadata.originalTask as TaskItem;
    const eventDuration = duration || task.estimatedMinutes || 60;

    return {
      id: `event-${Date.now()}`,
      title: task.title,
      description: task.description,
      start: targetDate,
      end: new Date(targetDate.getTime() + eventDuration * 60000),
      taskId: task.id,
      color: task.priority === 'high' ? '#ef4444' : 
             task.priority === 'medium' ? '#f59e0b' : '#10b981',
      metadata: {
        originalTask: task,
        energyLevel: task.energyLevel,
        tags: task.tags
      }
    };
  }

  /**
   * Convert chat message to canvas sticky note
   */
  static async chatMessageToStickyNote(
    dragData: DragData,
    position: { x: number; y: number }
  ): Promise<CanvasItem> {
    if (dragData.type !== 'chat-message') {
      throw new Error('Invalid drag data type for sticky note creation');
    }

    const message = dragData.metadata.originalMessage as ChatMessage;

    return {
      id: `sticky-${Date.now()}`,
      type: 'chat-snippet',
      position,
      size: { width: 250, height: 150 },
      content: message.content,
      metadata: {
        color: message.role === 'user' ? '#dbeafe' : '#f3e8ff',
        fontSize: 14,
        fontWeight: 'normal' as const,
        sourceId: message.id,
        zIndex: Date.now(),
        // Additional metadata as Record<string, any>
        sourceType: 'chat-message',
        timestamp: message.timestamp,
        author: message.role
      },
      connections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Convert content to note block
   */
  static async contentToNoteBlock(
    dragData: DragData,
    _targetNoteId: string
  ): Promise<any> {
    const timestamp = new Date().toISOString();
    
    switch (dragData.type) {
      case 'chat-message':
        return {
          id: `block-${Date.now()}`,
          type: 'text',
          content: `**Chat Message (${dragData.metadata.role}):**\n${dragData.content}`,
          metadata: {
            sourceType: 'chat-message',
            sourceId: dragData.id,
            timestamp: dragData.metadata.timestamp
          },
          createdAt: timestamp,
          updatedAt: timestamp
        };

      case 'task':
        return {
          id: `block-${Date.now()}`,
          type: 'text',
          content: `**Task:** ${dragData.content}\n${dragData.metadata.description || ''}`,
          metadata: {
            sourceType: 'task',
            sourceId: dragData.id,
            priority: dragData.metadata.priority,
            status: dragData.metadata.status
          },
          createdAt: timestamp,
          updatedAt: timestamp
        };

      case 'file':
        return {
          id: `block-${Date.now()}`,
          type: dragData.metadata.type?.startsWith('image/') ? 'image' : 'text',
          content: dragData.metadata.type?.startsWith('image/') ? '' : `**File:** ${dragData.content}`,
          metadata: {
            sourceType: 'file',
            fileName: dragData.content,
            fileSize: dragData.metadata.size,
            fileType: dragData.metadata.type,
            url: dragData.metadata.type?.startsWith('image/') ? URL.createObjectURL(dragData.metadata.file) : undefined
          },
          createdAt: timestamp,
          updatedAt: timestamp
        };

      default:
        return {
          id: `block-${Date.now()}`,
          type: 'text',
          content: dragData.content,
          metadata: {
            sourceType: dragData.type,
            sourceId: dragData.id
          },
          createdAt: timestamp,
          updatedAt: timestamp
        };
    }
  }
}

// Export singleton instance
export const dragDropManager = DragDropManager.getInstance();