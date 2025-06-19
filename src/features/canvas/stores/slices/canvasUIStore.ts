// src/stores/slices/canvasUIStore.ts
/**
 * Canvas UI Store - UI state management
 * Part of the LibreOllama Canvas Architecture Enhancement - Phase 2
 */

import { StateCreator } from 'zustand';
import { Draft } from 'immer';
import { PerformanceMonitor } from '../../../../utils/performance/PerformanceMonitor';

export interface ModalState {
  id: string;
  type: 'confirm' | 'input' | 'select' | 'custom';
  title: string;
  content?: string;
  isVisible: boolean;
  data?: any;
  onConfirm?: (result?: any) => void;
  onCancel?: () => void;
}

export interface TooltipState {
  id: string;
  content: string;
  position: { x: number; y: number };
  isVisible: boolean;
  delay?: number;
}

export interface CanvasUIState {
  // Tool selection
  selectedTool: string;
  availableTools: string[];
  toolGroups: Record<string, string[]>;
  
  // Sidebar and panel states
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  bottomPanelOpen: boolean;
  propertiesPanelOpen: boolean;
  layersPanelOpen: boolean;
  
  // Panel sizes and positions
  panelSizes: {
    leftSidebar: number;
    rightSidebar: number;
    bottomPanel: number;
    propertiesPanel: number;
  };
  
  // Cursor states
  cursorType: 'default' | 'pointer' | 'grab' | 'grabbing' | 'crosshair' | 'text' | 'move' | 'resize';
  customCursor?: string; // CSS cursor value
  
  // Hover effects
  hoveredElementId: string | null;
  hoveredToolId: string | null;
  hoveredUIComponent: string | null;
  
  // Modal and overlay management
  activeModal: ModalState | null;
  modalStack: ModalState[];
  overlayVisible: boolean;
  
  // Tooltip management
  activeTooltip: TooltipState | null;
  tooltipQueue: TooltipState[];
  
  // Context menus
  contextMenu: {
    isVisible: boolean;
    position: { x: number; y: number };
    items: Array<{
      id: string;
      label: string;
      icon?: string;
      shortcut?: string;
      disabled?: boolean;
      separator?: boolean;
      action?: () => void;
    }>;
  } | null;
  
  // Loading states
  loadingStates: Record<string, boolean>;
  globalLoading: boolean;
  
  // Notification system
  notifications: Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message?: string;
    duration?: number;
    timestamp: number;
    isVisible: boolean;
  }>;
  
  // Performance tracking
  uiMetrics: {
    toolSwitches: number;
    panelToggles: number;
    modalOpens: number;
    lastUIUpdate: number;
  };
  
  // Connector snapping state
  hoveredSnapPoint: { x: number; y: number; elementId?: string; anchor?: string } | null;
  
  // Tool operations
  setSelectedTool: (tool: string) => void;
  getSelectedTool: () => string;
  getAvailableTools: () => string[];
  addTool: (toolId: string, groupId?: string) => void;
  removeTool: (toolId: string) => void;
  
  // Panel operations
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  toggleBottomPanel: () => void;
  togglePropertiesPanel: () => void;
  toggleLayersPanel: () => void;
  setPanelSize: (panel: keyof CanvasUIState['panelSizes'], size: number) => void;
  
  // Cursor operations
  setCursorType: (cursor: CanvasUIState['cursorType'], custom?: string) => void;
  resetCursor: () => void;
  
  // Hover operations
  setHoveredElement: (elementId: string | null) => void;
  setHoveredTool: (toolId: string | null) => void;
  setHoveredUIComponent: (componentId: string | null) => void;
  setHoveredSnapPoint: (point: { x: number; y: number; elementId?: string; anchor?: string } | null) => void;
  clearAllHover: () => void;
  
  // Modal operations
  showModal: (modal: Omit<ModalState, 'id' | 'isVisible'>) => string;
  hideModal: (modalId?: string) => void;
  hideAllModals: () => void;
  getCurrentModal: () => ModalState | null;
  
  // Tooltip operations
  showTooltip: (content: string, position: { x: number; y: number }, delay?: number) => string;
  hideTooltip: (tooltipId?: string) => void;
  hideAllTooltips: () => void;
  
  // Context menu operations
  showContextMenu: (position: { x: number; y: number }, items: Array<{
    id: string;
    label: string;
    icon?: string;
    shortcut?: string;
    disabled?: boolean;
    separator?: boolean;
    action?: () => void;
  }>) => void;
  hideContextMenu: () => void;
  
  // Loading state operations
  setLoading: (key: string, loading: boolean) => void;
  setGlobalLoading: (loading: boolean) => void;
  isLoading: (key?: string) => boolean;
  
  // Notification operations
  showNotification: (notification: Omit<CanvasUIState['notifications'][0], 'id' | 'timestamp' | 'isVisible'>) => string;
  hideNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  
  // Performance utilities
  getUIPerformance: () => { toolSwitches: number; panelToggles: number; modalOpens: number };
  resetUIMetrics: () => void;
}

export const createCanvasUIStore: StateCreator<
  CanvasUIState,
  [['zustand/immer', never]],
  [],
  CanvasUIState
> = (set, get) => ({
  // Initial state
  selectedTool: 'select',
  availableTools: ['select', 'rectangle', 'circle', 'text', 'pen', 'arrow', 'sticky-note'],
  toolGroups: {
    selection: ['select', 'lasso'],
    shapes: ['rectangle', 'circle', 'triangle', 'star'],
    drawing: ['pen', 'brush', 'eraser'],
    text: ['text', 'sticky-note'],
    connectors: ['arrow', 'line', 'connector']
  },
  
  // Panel states
  leftSidebarOpen: true,
  rightSidebarOpen: false,
  bottomPanelOpen: false,
  propertiesPanelOpen: true,
  layersPanelOpen: false,
  
  // Panel sizes
  panelSizes: {
    leftSidebar: 300,
    rightSidebar: 300,
    bottomPanel: 200,
    propertiesPanel: 300
  },
  
  // Cursor and interaction states
  cursorType: 'default',
  hoveredElementId: null,
  hoveredToolId: null,
  hoveredUIComponent: null,
  
  // Modal and overlay states
  activeModal: null,
  modalStack: [],
  overlayVisible: false,
  
  // Tooltip states
  activeTooltip: null,
  tooltipQueue: [],
  
  // Context menu state
  contextMenu: null,
  
  // Loading states
  loadingStates: {},
  globalLoading: false,
  
  // Notifications
  notifications: [],
  
  // Performance metrics
  uiMetrics: {
    toolSwitches: 0,
    panelToggles: 0,
    modalOpens: 0,
    lastUIUpdate: 0
  },

  // Connector snapping state
  hoveredSnapPoint: null,

  // Tool operations
  setSelectedTool: (tool: string) => {
    const endTiming = PerformanceMonitor.startTiming('setSelectedTool');
    
    try {
      console.log('🔧 [UI STORE] Setting selected tool:', tool);
      
      set((state: Draft<CanvasUIState>) => {
        const previousTool = state.selectedTool;
        state.selectedTool = tool;
        state.uiMetrics.toolSwitches++;
        state.uiMetrics.lastUIUpdate = performance.now();
        
        console.log('✅ [UI STORE] Tool changed:', previousTool, '->', tool);
      });
      
      PerformanceMonitor.recordMetric('toolSwitch', 1, 'interaction', {
        from: get().selectedTool,
        to: tool
      });
    } finally {
      endTiming();
    }
  },

  getSelectedTool: (): string => {
    return get().selectedTool;
  },

  getAvailableTools: (): string[] => {
    return [...get().availableTools];
  },

  addTool: (toolId: string, groupId?: string) => {
    set((state: Draft<CanvasUIState>) => {
      if (!state.availableTools.includes(toolId)) {
        state.availableTools.push(toolId);
        
        if (groupId && state.toolGroups[groupId]) {
          state.toolGroups[groupId].push(toolId);
        }
        
        console.log('🔧 [UI STORE] Tool added:', toolId, groupId ? `to group ${groupId}` : '');
      }
    });
  },

  removeTool: (toolId: string) => {
    set((state: Draft<CanvasUIState>) => {
      state.availableTools = state.availableTools.filter(tool => tool !== toolId);
      
      // Remove from tool groups
      Object.keys(state.toolGroups).forEach(groupId => {
        if (state.toolGroups[groupId]) {
          state.toolGroups[groupId] = state.toolGroups[groupId].filter(tool => tool !== toolId);
        }
      });
      
      // Reset selected tool if it was removed
      if (state.selectedTool === toolId) {
        state.selectedTool = state.availableTools[0] || 'select';
      }
      
      console.log('🔧 [UI STORE] Tool removed:', toolId);
    });
  },

  // Panel operations
  toggleLeftSidebar: () => {
    set((state: Draft<CanvasUIState>) => {
      state.leftSidebarOpen = !state.leftSidebarOpen;
      state.uiMetrics.panelToggles++;
      state.uiMetrics.lastUIUpdate = performance.now();
    });
    
    PerformanceMonitor.recordMetric('panelToggle', 1, 'interaction', { panel: 'leftSidebar' });
    console.log('📱 [UI STORE] Left sidebar toggled:', get().leftSidebarOpen);
  },

  toggleRightSidebar: () => {
    set((state: Draft<CanvasUIState>) => {
      state.rightSidebarOpen = !state.rightSidebarOpen;
      state.uiMetrics.panelToggles++;
      state.uiMetrics.lastUIUpdate = performance.now();
    });
    
    PerformanceMonitor.recordMetric('panelToggle', 1, 'interaction', { panel: 'rightSidebar' });
    console.log('📱 [UI STORE] Right sidebar toggled:', get().rightSidebarOpen);
  },

  toggleBottomPanel: () => {
    set((state: Draft<CanvasUIState>) => {
      state.bottomPanelOpen = !state.bottomPanelOpen;
      state.uiMetrics.panelToggles++;
      state.uiMetrics.lastUIUpdate = performance.now();
    });
    
    PerformanceMonitor.recordMetric('panelToggle', 1, 'interaction', { panel: 'bottomPanel' });
    console.log('📱 [UI STORE] Bottom panel toggled:', get().bottomPanelOpen);
  },

  togglePropertiesPanel: () => {
    set((state: Draft<CanvasUIState>) => {
      state.propertiesPanelOpen = !state.propertiesPanelOpen;
      state.uiMetrics.panelToggles++;
      state.uiMetrics.lastUIUpdate = performance.now();
    });
    
    PerformanceMonitor.recordMetric('panelToggle', 1, 'interaction', { panel: 'propertiesPanel' });
    console.log('📱 [UI STORE] Properties panel toggled:', get().propertiesPanelOpen);
  },

  toggleLayersPanel: () => {
    set((state: Draft<CanvasUIState>) => {
      state.layersPanelOpen = !state.layersPanelOpen;
      state.uiMetrics.panelToggles++;
      state.uiMetrics.lastUIUpdate = performance.now();
    });
    
    PerformanceMonitor.recordMetric('panelToggle', 1, 'interaction', { panel: 'layersPanel' });
    console.log('📱 [UI STORE] Layers panel toggled:', get().layersPanelOpen);
  },

  setPanelSize: (panel: keyof CanvasUIState['panelSizes'], size: number) => {
    set((state: Draft<CanvasUIState>) => {
      state.panelSizes[panel] = Math.max(100, Math.min(800, size));
      state.uiMetrics.lastUIUpdate = performance.now();
    });
    
    console.log('📱 [UI STORE] Panel size set:', panel, size);
  },

  // Cursor operations
  setCursorType: (cursor: CanvasUIState['cursorType'], custom?: string) => {
    set((state: Draft<CanvasUIState>) => {
      state.cursorType = cursor;
      if (custom !== undefined) {
        state.customCursor = custom;
      }
    });
  },

  resetCursor: () => {
    set((state: Draft<CanvasUIState>) => {
      state.cursorType = 'default';
      delete state.customCursor;
    });
  },

  // Hover operations
  setHoveredElement: (elementId: string | null) => {
    set((state: Draft<CanvasUIState>) => {
      state.hoveredElementId = elementId;
    });
  },

  setHoveredTool: (toolId: string | null) => {
    set((state: Draft<CanvasUIState>) => {
      state.hoveredToolId = toolId;
    });
  },

  setHoveredUIComponent: (componentId: string | null) => {
    set((state: Draft<CanvasUIState>) => {
      state.hoveredUIComponent = componentId;
    });
  },

  setHoveredSnapPoint: (point: { x: number; y: number; elementId?: string; anchor?: string } | null) => {
    set((state: Draft<CanvasUIState>) => {
      state.hoveredSnapPoint = point;
    });
  },

  clearAllHover: () => {
    set((state: Draft<CanvasUIState>) => {
      state.hoveredElementId = null;
      state.hoveredToolId = null;
      state.hoveredUIComponent = null;
    });
  },

  // Modal operations
  showModal: (modal: Omit<ModalState, 'id' | 'isVisible'>): string => {
    const modalId = `modal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    set((state: Draft<CanvasUIState>) => {
      const newModal: ModalState = {
        ...modal,
        id: modalId,
        isVisible: true
      };
      
      // Add current modal to stack if exists
      if (state.activeModal) {
        state.modalStack.push(state.activeModal);
      }
      
      state.activeModal = newModal;
      state.overlayVisible = true;
      state.uiMetrics.modalOpens++;
      state.uiMetrics.lastUIUpdate = performance.now();
    });
    
    PerformanceMonitor.recordMetric('modalShow', 1, 'interaction', { type: modal.type });
    console.log('🔔 [UI STORE] Modal shown:', modalId, modal.type);
    
    return modalId;
  },

  hideModal: (modalId?: string) => {
    set((state: Draft<CanvasUIState>) => {
      if (modalId && state.activeModal?.id !== modalId) {
        // Remove from stack if not active modal
        state.modalStack = state.modalStack.filter(modal => modal.id !== modalId);
        return;
      }
      
      // Hide active modal
      if (state.activeModal) {
        state.activeModal.isVisible = false;
        
        // Restore previous modal from stack
        if (state.modalStack.length > 0) {
          state.activeModal = state.modalStack.pop()!;
        } else {
          state.activeModal = null;
          state.overlayVisible = false;
        }
      }
    });
    
    PerformanceMonitor.recordMetric('modalHide', 1, 'interaction');
    console.log('🔔 [UI STORE] Modal hidden:', modalId || 'active');
  },

  hideAllModals: () => {
    set((state: Draft<CanvasUIState>) => {
      state.activeModal = null;
      state.modalStack = [];
      state.overlayVisible = false;
    });
    
    console.log('🔔 [UI STORE] All modals hidden');
  },

  getCurrentModal: (): ModalState | null => {
    return get().activeModal;
  },

  // Tooltip operations
  showTooltip: (content: string, position: { x: number; y: number }, delay: number = 500): string => {
    const tooltipId = `tooltip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    setTimeout(() => {
      set((state: Draft<CanvasUIState>) => {
        const newTooltip: TooltipState = {
          id: tooltipId,
          content,
          position,
          isVisible: true,
          delay
        };
        
        // Hide existing tooltip
        if (state.activeTooltip) {
          state.tooltipQueue.push(state.activeTooltip);
        }
        
        state.activeTooltip = newTooltip;
      });
    }, delay);
    
    return tooltipId;
  },

  hideTooltip: (tooltipId?: string) => {
    set((state: Draft<CanvasUIState>) => {
      if (tooltipId && state.activeTooltip?.id !== tooltipId) {
        state.tooltipQueue = state.tooltipQueue.filter(tooltip => tooltip.id !== tooltipId);
        return;
      }
      
      if (state.activeTooltip) {
        state.activeTooltip.isVisible = false;
        
        if (state.tooltipQueue.length > 0) {
          state.activeTooltip = state.tooltipQueue.shift()!;
        } else {
          state.activeTooltip = null;
        }
      }
    });
  },

  hideAllTooltips: () => {
    set((state: Draft<CanvasUIState>) => {
      state.activeTooltip = null;
      state.tooltipQueue = [];
    });
  },

  // Context menu operations
  showContextMenu: (position: { x: number; y: number }, items: Array<{
    id: string;
    label: string;
    icon?: string;
    shortcut?: string;
    disabled?: boolean;
    separator?: boolean;
    action?: () => void;
  }>) => {
    set((state: Draft<CanvasUIState>) => {
      state.contextMenu = {
        isVisible: true,
        position,
        items
      };
    });
    
    PerformanceMonitor.recordMetric('contextMenuShow', 1, 'interaction');
    console.log('📋 [UI STORE] Context menu shown at:', position);
  },

  hideContextMenu: () => {
    set((state: Draft<CanvasUIState>) => {
      state.contextMenu = null;
    });
    
    console.log('📋 [UI STORE] Context menu hidden');
  },

  // Loading state operations
  setLoading: (key: string, loading: boolean) => {
    set((state: Draft<CanvasUIState>) => {
      if (loading) {
        state.loadingStates[key] = true;
      } else {
        delete state.loadingStates[key];
      }
    });
  },

  setGlobalLoading: (loading: boolean) => {
    set((state: Draft<CanvasUIState>) => {
      state.globalLoading = loading;
    });
  },

  isLoading: (key?: string): boolean => {
    const state = get();
    if (key) {
      return !!state.loadingStates[key];
    }
    return state.globalLoading || Object.keys(state.loadingStates).length > 0;
  },

  // Notification operations
  showNotification: (notification: Omit<CanvasUIState['notifications'][0], 'id' | 'timestamp' | 'isVisible'>): string => {
    const notificationId = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    set((state: Draft<CanvasUIState>) => {
      const newNotification = {
        ...notification,
        id: notificationId,
        timestamp: Date.now(),
        isVisible: true
      };
      
      state.notifications.push(newNotification);
      
      // Auto-hide after duration
      if (newNotification.duration) {
        setTimeout(() => {
          get().hideNotification(notificationId);
        }, newNotification.duration);
      }
    });
    
    return notificationId;
  },

  hideNotification: (notificationId: string) => {
    set((state: Draft<CanvasUIState>) => {
      const notification = state.notifications.find(notif => notif.id === notificationId);
      if (notification) {
        notification.isVisible = false;
      }
    });
  },

  clearAllNotifications: () => {
    set((state: Draft<CanvasUIState>) => {
      state.notifications = [];
    });
  },

  // Performance utilities
  getUIPerformance: () => {
    const metrics = get().uiMetrics;
    return {
      toolSwitches: metrics.toolSwitches,
      panelToggles: metrics.panelToggles,
      modalOpens: metrics.modalOpens
    };
  },

  resetUIMetrics: () => {
    set((state: Draft<CanvasUIState>) => {
      state.uiMetrics = {
        toolSwitches: 0,
        panelToggles: 0,
        modalOpens: 0,
        lastUIUpdate: 0
      };
    });
  }
});