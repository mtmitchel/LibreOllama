// Mock for @tauri-apps/api/tauri
const { jest } = require('@jest/globals');

export const invoke = jest.fn();

// Helper to reset the mock between tests
export const __resetInvokeMock = () => {
  invoke.mockReset();
};

// Helper to set up common mock responses
export const __setupInvokeMocks = (mocks) => {
  invoke.mockImplementation((command, args) => {
    if (mocks[command] !== undefined) {
      if (typeof mocks[command] === 'function') {
        return Promise.resolve(mocks[command](args));
      }
      return Promise.resolve(mocks[command]);
    }
    return Promise.reject(new Error(`Command ${command} not mocked`));
  });
};
