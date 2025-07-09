/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DEV: boolean;
  // Add other environment variables here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Window type extensions for Tauri and Electron APIs
declare global {
  interface Window {
    __TAURI__?: {
      app: {
        getName: () => Promise<string>;
        getVersion: () => Promise<string>;
      };
      invoke: (command: string, args?: any) => Promise<any>;
      // Add other Tauri API methods as needed
    };
    __TAURI_INTERNALS__?: any;
    __TAURI_METADATA__?: {
      version: string;
    };
    electronAPI?: {
      openFile: (filePath: string) => Promise<void>;
      // Add other Electron API methods as needed
    };
  }
  
  // Global types for test environment
  var __TAURI__: any;
  var __TAURI_INTERNALS__: any;
  var __TAURI_METADATA__: any;
}
