// Main export for @tauri-apps/api
const { jest } = require('@jest/globals');

export * from './tauri';
export * from './event';

// Additional exports that might be used
export const app = {
  getVersion: jest.fn(() => Promise.resolve('1.0.0')),
  getName: jest.fn(() => Promise.resolve('LibreOllama')),
  getTauriVersion: jest.fn(() => Promise.resolve('2.0.0')),
};

export const window = {
  appWindow: {
    setTitle: jest.fn(() => Promise.resolve()),
    close: jest.fn(() => Promise.resolve()),
    minimize: jest.fn(() => Promise.resolve()),
    maximize: jest.fn(() => Promise.resolve()),
    unmaximize: jest.fn(() => Promise.resolve()),
    isMaximized: jest.fn(() => Promise.resolve(false)),
    setFullscreen: jest.fn(() => Promise.resolve()),
    isFullscreen: jest.fn(() => Promise.resolve(false)),
    show: jest.fn(() => Promise.resolve()),
    hide: jest.fn(() => Promise.resolve()),
  },
};

export const fs = {
  readTextFile: jest.fn(() => Promise.resolve('')),
  writeTextFile: jest.fn(() => Promise.resolve()),
  readBinaryFile: jest.fn(() => Promise.resolve(new Uint8Array())),
  writeBinaryFile: jest.fn(() => Promise.resolve()),
  exists: jest.fn(() => Promise.resolve(true)),
  createDir: jest.fn(() => Promise.resolve()),
  removeFile: jest.fn(() => Promise.resolve()),
  removeDir: jest.fn(() => Promise.resolve()),
};

export const path = {
  appDir: jest.fn(() => Promise.resolve('/app')),
  appConfigDir: jest.fn(() => Promise.resolve('/app/config')),
  appDataDir: jest.fn(() => Promise.resolve('/app/data')),
  appLocalDataDir: jest.fn(() => Promise.resolve('/app/local')),
  appCacheDir: jest.fn(() => Promise.resolve('/app/cache')),
  appLogDir: jest.fn(() => Promise.resolve('/app/logs')),
  join: jest.fn((...paths) => Promise.resolve(paths.join('/'))),
  basename: jest.fn((path) => Promise.resolve(path.split('/').pop())),
  dirname: jest.fn((path) => Promise.resolve(path.split('/').slice(0, -1).join('/'))),
};
