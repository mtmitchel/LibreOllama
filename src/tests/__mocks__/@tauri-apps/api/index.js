// Main export for @tauri-apps/api
import { vi } from 'vitest';

export * from './tauri';
export * from './event';

// Additional exports that might be used
export const app = {
  getVersion: vi.fn(() => Promise.resolve('1.0.0')),
  getName: vi.fn(() => Promise.resolve('LibreOllama')),
  getTauriVersion: vi.fn(() => Promise.resolve('2.0.0')),
};

export const window = {
  appWindow: {
    setTitle: vi.fn(() => Promise.resolve()),
    close: vi.fn(() => Promise.resolve()),
    minimize: vi.fn(() => Promise.resolve()),
    maximize: vi.fn(() => Promise.resolve()),
    unmaximize: vi.fn(() => Promise.resolve()),
    isMaximized: vi.fn(() => Promise.resolve(false)),
    setFullscreen: vi.fn(() => Promise.resolve()),
    isFullscreen: vi.fn(() => Promise.resolve(false)),
    show: vi.fn(() => Promise.resolve()),
    hide: vi.fn(() => Promise.resolve()),
  },
};

export const fs = {
  readTextFile: vi.fn(() => Promise.resolve('')),
  writeTextFile: vi.fn(() => Promise.resolve()),
  readBinaryFile: vi.fn(() => Promise.resolve(new Uint8Array())),
  writeBinaryFile: vi.fn(() => Promise.resolve()),
  exists: vi.fn(() => Promise.resolve(true)),
  createDir: vi.fn(() => Promise.resolve()),
  removeFile: vi.fn(() => Promise.resolve()),
  removeDir: vi.fn(() => Promise.resolve()),
};

export const path = {
  appDir: vi.fn(() => Promise.resolve('/app')),
  appConfigDir: vi.fn(() => Promise.resolve('/app/config')),
  appDataDir: vi.fn(() => Promise.resolve('/app/data')),
  appLocalDataDir: vi.fn(() => Promise.resolve('/app/local')),
  appCacheDir: vi.fn(() => Promise.resolve('/app/cache')),
  appLogDir: vi.fn(() => Promise.resolve('/app/logs')),
  join: vi.fn((...paths) => Promise.resolve(paths.join('/'))),
  basename: vi.fn((path) => Promise.resolve(path.split('/').pop())),
  dirname: vi.fn((path) => Promise.resolve(path.split('/').slice(0, -1).join('/'))),
};
