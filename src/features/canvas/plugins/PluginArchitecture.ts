/**
 * Plugin Architecture for Canvas System
 * Extensible plugin system for third-party integrations and custom functionality
 */

import { CanvasElement, ElementId, CanvasTool } from '../types/enhanced.types';
import { canvasLog } from '../utils/canvasLogger';

// Plugin lifecycle states
export type PluginStatus = 'inactive' | 'loading' | 'active' | 'error' | 'disabled';

// Plugin types
export type PluginType = 
  | 'tool'           // Custom drawing/editing tools
  | 'element'        // Custom canvas elements  
  | 'export'         // Export format handlers
  | 'import'         // Import format handlers
  | 'filter'         // Visual filters and effects
  | 'analytics'      // Usage analytics
  | 'collaboration'  // Collaboration features
  | 'ai'            // AI-powered features
  | 'integration'   // External service integrations
  | 'theme'         // UI themes and styling
  | 'utility';      // General utility functions

// Plugin permission levels
export type PluginPermission =
  | 'canvas.read'           // Read canvas state
  | 'canvas.write'          // Modify canvas elements
  | 'canvas.export'         // Export canvas data
  | 'canvas.import'         // Import external data
  | 'tools.register'        // Register custom tools
  | 'elements.create'       // Create custom element types
  | 'ui.toolbar'           // Add toolbar items
  | 'ui.contextMenu'       // Add context menu items
  | 'ui.panel'             // Add side panels
  | 'storage.local'        // Access local storage
  | 'storage.remote'       // Access remote storage
  | 'network.external'     // Make external API calls
  | 'system.clipboard'     // Access system clipboard
  | 'system.filesystem';   // Access file system

// Plugin API context
export interface PluginAPI {
  // Canvas operations
  canvas: {
    getElements(): CanvasElement[];
    getElementById(id: ElementId): CanvasElement | null;
    createElement(element: Partial<CanvasElement>): ElementId;
    updateElement(id: ElementId, updates: Partial<CanvasElement>): void;
    deleteElement(id: ElementId): void;
    selectElements(ids: ElementId[]): void;
    getSelectedElements(): CanvasElement[];
    exportCanvas(format: string): Promise<string | ArrayBuffer>;
    importCanvas(data: string | ArrayBuffer, format: string): Promise<void>;
  };

  // Tool operations
  tools: {
    registerTool(tool: PluginToolDefinition): void;
    unregisterTool(toolId: string): void;
    getActiveTool(): CanvasTool | null;
    setActiveTool(tool: CanvasTool): void;
  };

  // UI operations
  ui: {
    addToolbarButton(button: PluginToolbarButton): void;
    removeToolbarButton(buttonId: string): void;
    addContextMenuItem(item: PluginContextMenuItem): void;
    removeContextMenuItem(itemId: string): void;
    showNotification(notification: PluginNotification): void;
    showModal(modal: PluginModalConfig): Promise<unknown>;
    addPanel(panel: PluginPanelConfig): void;
    removePanel(panelId: string): void;
  };

  // Event system
  events: {
    on(event: PluginEvent, handler: PluginEventHandler): void;
    off(event: PluginEvent, handler: PluginEventHandler): void;
    emit(event: PluginEvent, data?: unknown): void;
  };

  // Storage
  storage: {
    get(key: string): Promise<unknown>;
    set(key: string, value: unknown): Promise<void>;
    remove(key: string): Promise<void>;
    clear(): Promise<void>;
  };

  // Utilities
  utils: {
    generateId(): string;
    validateElement(element: unknown): boolean;
    showError(message: string): void;
    showSuccess(message: string): void;
  };
}

// Plugin manifest
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: {
    name: string;
    email?: string;
    url?: string;
  };
  homepage?: string;
  repository?: string;
  license: string;
  type: PluginType;
  permissions: PluginPermission[];
  dependencies?: {
    canvas?: string;  // Minimum canvas version
    plugins?: Record<string, string>; // Plugin dependencies
  };
  config?: {
    schema: Record<string, unknown>; // JSON schema for plugin config
    defaults: Record<string, unknown>; // Default configuration
  };
  entry: string; // Entry point file
  files: string[]; // Plugin files
  keywords?: string[];
  category?: string;
  icon?: string;
  screenshots?: string[];
}

// Plugin instance
export interface Plugin {
  manifest: PluginManifest;
  status: PluginStatus;
  instance: PluginInstance | null;
  config: Record<string, unknown>;
  error?: Error;
  loadedAt?: number;
  lastUsed?: number;
}

// Plugin instance interface
export interface PluginInstance {
  activate(api: PluginAPI, config: Record<string, unknown>): Promise<void>;
  deactivate(): Promise<void>;
  onConfigChange?(config: Record<string, unknown>): Promise<void>;
  getInfo?(): PluginInfo;
}

export interface PluginInfo {
  status: string;
  usage: {
    elementsCreated?: number;
    toolsRegistered?: number;
    apiCalls?: number;
  };
  performance: {
    memoryUsage?: number;
    executionTime?: number;
  };
}

// Plugin tool definition
export interface PluginToolDefinition {
  id: string;
  name: string;
  icon: string;
  cursor: string;
  category?: string;
  shortcuts?: string[];
  config?: Record<string, unknown>;
  handlers: {
    onActivate?: () => void;
    onDeactivate?: () => void;
    onPointerDown?: (event: PointerEvent) => void;
    onPointerMove?: (event: PointerEvent) => void;
    onPointerUp?: (event: PointerEvent) => void;
    onKeyDown?: (event: KeyboardEvent) => void;
  };
}

// Plugin UI components
export interface PluginToolbarButton {
  id: string;
  label: string;
  icon: string;
  tooltip?: string;
  position?: 'start' | 'end' | number;
  onClick: () => void;
  disabled?: boolean;
  visible?: boolean;
}

export interface PluginContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  submenu?: PluginContextMenuItem[];
  separator?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  visible?: boolean;
}

export interface PluginNotification {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  duration?: number;
  actions?: Array<{
    label: string;
    onClick: () => void;
  }>;
}

export interface PluginModalConfig {
  title: string;
  content: React.ReactNode | string;
  size?: 'small' | 'medium' | 'large';
  closable?: boolean;
  actions?: Array<{
    label: string;
    type?: 'primary' | 'secondary' | 'danger';
    onClick: (close: () => void) => void;
  }>;
}

export interface PluginPanelConfig {
  id: string;
  title: string;
  icon?: string;
  position: 'left' | 'right' | 'bottom';
  width?: number;
  height?: number;
  resizable?: boolean;
  collapsible?: boolean;
  content: React.ReactNode;
}

// Plugin events
export type PluginEvent =
  | 'canvas.elementCreated'
  | 'canvas.elementUpdated'
  | 'canvas.elementDeleted'
  | 'canvas.selectionChanged'
  | 'canvas.viewportChanged'
  | 'tool.changed'
  | 'plugin.activated'
  | 'plugin.deactivated'
  | 'config.changed';

export type PluginEventHandler = (data?: unknown) => void;

// Plugin manager
export class PluginManager {
  private static instance: PluginManager;
  private plugins: Map<string, Plugin> = new Map();
  private eventHandlers: Map<PluginEvent, Set<PluginEventHandler>> = new Map();
  private api: PluginAPI;
  private securityValidator: PluginSecurityValidator;

  private constructor() {
    this.api = this.createPluginAPI();
    this.securityValidator = new PluginSecurityValidator();
  }

  public static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager();
    }
    return PluginManager.instance;
  }

  /**
   * Register a plugin
   */
  public async registerPlugin(manifest: PluginManifest, code: string): Promise<void> {
    try {
      // Validate manifest
      this.validateManifest(manifest);

      // Security validation
      await this.securityValidator.validatePlugin(manifest, code);

      // Check dependencies
      this.checkDependencies(manifest);

      const plugin: Plugin = {
        manifest,
        status: 'inactive',
        instance: null,
        config: manifest.config?.defaults || {}
      };

      this.plugins.set(manifest.id, plugin);
      canvasLog.info('🔌 [PluginManager] Plugin registered:', manifest.name);

    } catch (error) {
      canvasLog.error('🔌 [PluginManager] Plugin registration failed:', manifest.id, error);
      throw error;
    }
  }

  /**
   * Activate a plugin
   */
  public async activatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    if (plugin.status === 'active') {
      canvasLog.warn('🔌 [PluginManager] Plugin already active:', pluginId);
      return;
    }

    try {
      plugin.status = 'loading';
      
      // Load plugin instance
      const instance = await this.loadPluginInstance(plugin);
      
      // Activate plugin
      await instance.activate(this.api, plugin.config);
      
      plugin.instance = instance;
      plugin.status = 'active';
      plugin.loadedAt = Date.now();
      
      this.emit('plugin.activated', { pluginId });
      canvasLog.info('🔌 [PluginManager] Plugin activated:', plugin.manifest.name);

    } catch (error) {
      plugin.status = 'error';
      plugin.error = error instanceof Error ? error : new Error(String(error));
      canvasLog.error('🔌 [PluginManager] Plugin activation failed:', pluginId, error);
      throw error;
    }
  }

  /**
   * Deactivate a plugin
   */
  public async deactivatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin || plugin.status !== 'active' || !plugin.instance) {
      return;
    }

    try {
      await plugin.instance.deactivate();
      plugin.instance = null;
      plugin.status = 'inactive';
      
      this.emit('plugin.deactivated', { pluginId });
      canvasLog.info('🔌 [PluginManager] Plugin deactivated:', plugin.manifest.name);

    } catch (error) {
      canvasLog.error('🔌 [PluginManager] Plugin deactivation failed:', pluginId, error);
      throw error;
    }
  }

  /**
   * Unregister a plugin
   */
  public async unregisterPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return;

    // Deactivate if active
    if (plugin.status === 'active') {
      await this.deactivatePlugin(pluginId);
    }

    this.plugins.delete(pluginId);
    canvasLog.info('🔌 [PluginManager] Plugin unregistered:', pluginId);
  }

  /**
   * Get all plugins
   */
  public getPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get active plugins
   */
  public getActivePlugins(): Plugin[] {
    return this.getPlugins().filter(plugin => plugin.status === 'active');
  }

  /**
   * Get plugin by ID
   */
  public getPlugin(pluginId: string): Plugin | null {
    return this.plugins.get(pluginId) || null;
  }

  /**
   * Update plugin configuration
   */
  public async updatePluginConfig(pluginId: string, config: Record<string, unknown>): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    plugin.config = { ...plugin.config, ...config };

    if (plugin.status === 'active' && plugin.instance?.onConfigChange) {
      await plugin.instance.onConfigChange(plugin.config);
    }

    this.emit('config.changed', { pluginId, config });
  }

  private validateManifest(manifest: PluginManifest): void {
    const required = ['id', 'name', 'version', 'type', 'permissions', 'entry'];
    const missing = required.filter(field => !manifest[field as keyof PluginManifest]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required manifest fields: ${missing.join(', ')}`);
    }

    if (this.plugins.has(manifest.id)) {
      throw new Error(`Plugin with ID '${manifest.id}' already exists`);
    }
  }

  private checkDependencies(manifest: PluginManifest): void {
    if (!manifest.dependencies) return;

    // Check plugin dependencies
    if (manifest.dependencies.plugins) {
      for (const [depId, depVersion] of Object.entries(manifest.dependencies.plugins)) {
        const depPlugin = this.plugins.get(depId);
        if (!depPlugin) {
          throw new Error(`Missing dependency: ${depId}`);
        }
        // Version checking would be implemented here
      }
    }
  }

  private async loadPluginInstance(plugin: Plugin): Promise<PluginInstance> {
    // In a real implementation, this would load the plugin code securely
    // For now, we'll simulate plugin loading
    return {
      async activate(api: PluginAPI, config: Record<string, unknown>): Promise<void> {
        canvasLog.debug('🔌 [Plugin] Activating:', plugin.manifest.name);
      },
      async deactivate(): Promise<void> {
        canvasLog.debug('🔌 [Plugin] Deactivating:', plugin.manifest.name);
      }
    };
  }

  private createPluginAPI(): PluginAPI {
    return {
      canvas: {
        getElements: () => {
          // Integration with canvas store
          return [];
        },
        getElementById: (id: ElementId) => {
          // Integration with canvas store
          return null;
        },
        createElement: (element: Partial<CanvasElement>) => {
          // Integration with canvas store
          return 'new-element-id' as ElementId;
        },
        updateElement: (id: ElementId, updates: Partial<CanvasElement>) => {
          // Integration with canvas store
        },
        deleteElement: (id: ElementId) => {
          // Integration with canvas store
        },
        selectElements: (ids: ElementId[]) => {
          // Integration with canvas store
        },
        getSelectedElements: () => {
          // Integration with canvas store
          return [];
        },
        exportCanvas: async (format: string) => {
          // Integration with export system
          return '';
        },
        importCanvas: async (data: string | ArrayBuffer, format: string) => {
          // Integration with import system
        }
      },
      tools: {
        registerTool: (tool: PluginToolDefinition) => {
          // Integration with tool system
        },
        unregisterTool: (toolId: string) => {
          // Integration with tool system
        },
        getActiveTool: () => {
          // Integration with tool system
          return null;
        },
        setActiveTool: (tool: CanvasTool) => {
          // Integration with tool system
        }
      },
      ui: {
        addToolbarButton: (button: PluginToolbarButton) => {
          // Integration with UI system
        },
        removeToolbarButton: (buttonId: string) => {
          // Integration with UI system
        },
        addContextMenuItem: (item: PluginContextMenuItem) => {
          // Integration with UI system
        },
        removeContextMenuItem: (itemId: string) => {
          // Integration with UI system
        },
        showNotification: (notification: PluginNotification) => {
          // Integration with notification system
        },
        showModal: async (modal: PluginModalConfig) => {
          // Integration with modal system
          return {};
        },
        addPanel: (panel: PluginPanelConfig) => {
          // Integration with panel system
        },
        removePanel: (panelId: string) => {
          // Integration with panel system
        }
      },
      events: {
        on: (event: PluginEvent, handler: PluginEventHandler) => {
          this.on(event, handler);
        },
        off: (event: PluginEvent, handler: PluginEventHandler) => {
          this.off(event, handler);
        },
        emit: (event: PluginEvent, data?: unknown) => {
          this.emit(event, data);
        }
      },
      storage: {
        get: async (key: string) => {
          // Integration with storage system
          return null;
        },
        set: async (key: string, value: unknown) => {
          // Integration with storage system
        },
        remove: async (key: string) => {
          // Integration with storage system
        },
        clear: async () => {
          // Integration with storage system
        }
      },
      utils: {
        generateId: () => {
          return `plugin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        },
        validateElement: (element: unknown) => {
          // Integration with validation system
          return true;
        },
        showError: (message: string) => {
          canvasLog.error('🔌 [Plugin]', message);
        },
        showSuccess: (message: string) => {
          canvasLog.info('🔌 [Plugin]', message);
        }
      }
    };
  }

  private on(event: PluginEvent, handler: PluginEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  private off(event: PluginEvent, handler: PluginEventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  private emit(event: PluginEvent, data?: unknown): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          canvasLog.error('🔌 [PluginManager] Event handler error:', error);
        }
      });
    }
  }
}

// Plugin security validator
class PluginSecurityValidator {
  private dangerousPatterns = [
    /eval\s*\(/,
    /Function\s*\(/,
    /document\.write/,
    /window\.location/,
    /localStorage/,
    /sessionStorage/,
    /XMLHttpRequest/,
    /fetch\s*\(/,
    /import\s*\(/,
    /require\s*\(/
  ];

  public async validatePlugin(manifest: PluginManifest, code: string): Promise<void> {
    // Validate permissions
    this.validatePermissions(manifest.permissions);
    
    // Validate code patterns
    this.validateCode(code);
    
    // Additional security checks would go here
    canvasLog.debug('🔐 [SecurityValidator] Plugin validation passed:', manifest.id);
  }

  private validatePermissions(permissions: PluginPermission[]): void {
    const validPermissions: PluginPermission[] = [
      'canvas.read', 'canvas.write', 'canvas.export', 'canvas.import',
      'tools.register', 'elements.create', 'ui.toolbar', 'ui.contextMenu',
      'ui.panel', 'storage.local', 'storage.remote', 'network.external',
      'system.clipboard', 'system.filesystem'
    ];

    const invalid = permissions.filter(p => !validPermissions.includes(p));
    if (invalid.length > 0) {
      throw new Error(`Invalid permissions: ${invalid.join(', ')}`);
    }
  }

  private validateCode(code: string): void {
    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(code)) {
        throw new Error(`Potentially unsafe code pattern detected: ${pattern.source}`);
      }
    }
  }
}

// Export singleton instance
export const pluginManager = PluginManager.getInstance();

// Helper functions for plugin development
export const createPlugin = (definition: {
  manifest: PluginManifest;
  activate: (api: PluginAPI, config: Record<string, unknown>) => Promise<void>;
  deactivate: () => Promise<void>;
  onConfigChange?: (config: Record<string, unknown>) => Promise<void>;
}): PluginInstance => {
  return {
    activate: definition.activate,
    deactivate: definition.deactivate,
    onConfigChange: definition.onConfigChange
  };
};