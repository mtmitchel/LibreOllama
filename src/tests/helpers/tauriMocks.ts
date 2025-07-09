/**
 * Tauri Mocks for Testing
 * Provides comprehensive mocking for Tauri API calls and event system
 */

import { vi } from 'vitest';

// Mock Tauri event system
export const mockTauriEvent = {
  listen: vi.fn().mockResolvedValue(() => {}),
  emit: vi.fn().mockResolvedValue(undefined),
  once: vi.fn().mockResolvedValue(undefined),
};

// Mock Tauri invoke system
export const mockTauriInvoke = vi.fn();

// Mock Tauri core functions
export const mockTauriCore = {
  transformCallback: vi.fn((fn: any) => fn),
  invoke: mockTauriInvoke,
  convertFileSrc: vi.fn((src: string) => src),
  Channel: vi.fn().mockImplementation(() => ({
    onmessage: vi.fn(),
    send: vi.fn(),
  })),
};

// Setup comprehensive Tauri mocks
export function setupTauriMocks() {
  // Set up Tauri environment indicators
  (global as any).__TAURI_INTERNALS__ = {};
  (global as any).__TAURI_METADATA__ = { version: '2.0.0' };
  
  // Mock the global Tauri object
  (global as any).__TAURI__ = {
    invoke: mockTauriInvoke,
    event: mockTauriEvent,
    core: mockTauriCore,
    transformCallback: mockTauriCore.transformCallback,
    app: {
      getName: vi.fn().mockResolvedValue('LibreOllama'),
      getVersion: vi.fn().mockResolvedValue('1.0.0'),
    },
    fs: {
      readTextFile: vi.fn(),
      writeTextFile: vi.fn(),
      exists: vi.fn(),
      createDir: vi.fn(),
    },
    path: {
      join: vi.fn(),
      resolve: vi.fn(),
    },
    os: {
      platform: vi.fn().mockResolvedValue('win32'),
    },
  };

  // Mock Tauri modules with more comprehensive coverage
  vi.mock('@tauri-apps/api/core', () => ({
    invoke: mockTauriInvoke,
    transformCallback: mockTauriCore.transformCallback,
    Channel: mockTauriCore.Channel,
    isTauri: vi.fn().mockReturnValue(true),
  }));

  vi.mock('@tauri-apps/api/event', () => ({
    listen: mockTauriEvent.listen,
    emit: mockTauriEvent.emit,
    once: mockTauriEvent.once,
  }));

  vi.mock('@tauri-apps/api/app', () => ({
    getName: (global as any).__TAURI__.app.getName,
    getVersion: (global as any).__TAURI__.app.getVersion,
  }));

  // Mock Tauri opener plugin
  vi.mock('@tauri-apps/plugin-opener', () => ({
    openUrl: vi.fn().mockResolvedValue(undefined),
  }));

  // Mock the Gmail sync service to prevent Tauri initialization issues
  vi.mock('../../features/mail/services/gmailSyncService', () => ({
    gmailSyncService: {
      syncMessages: vi.fn().mockResolvedValue(undefined),
      initializeTauriEventListeners: vi.fn(),
      startPeriodicSync: vi.fn(),
      stopPeriodicSync: vi.fn(),
    },
    default: vi.fn().mockImplementation(() => ({
      syncMessages: vi.fn().mockResolvedValue(undefined),
      initializeTauriEventListeners: vi.fn(),
      startPeriodicSync: vi.fn(),
      stopPeriodicSync: vi.fn(),
    })),
  }));

  // Mock fetch for user profile requests
  originalFetch = global.fetch;
  global.fetch = vi.fn((url: string, options?: any) => {
    if (url.includes('googleapis.com/oauth2/v2/userinfo')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve({
          id: 'google-user-123',
          email: 'user@example.com',
          name: 'Test User',
          picture: 'https://example.com/avatar.jpg',
          verified_email: true,
        }),
        text: () => Promise.resolve('{}'),
      } as Response);
    }
    // Call original fetch for other requests or return mock response
    if (originalFetch) {
      return originalFetch(url, options);
    }
    return Promise.resolve({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: () => Promise.reject('Not found'),
      text: () => Promise.resolve('Not found'),
    } as Response);
  }) as any;

  // Mock specific Gmail-related Tauri commands
  mockTauriInvoke.mockImplementation((command: string, args?: any) => {
    switch (command) {
      case 'start_gmail_oauth':
        return Promise.resolve({
          auth_url: 'https://accounts.google.com/oauth/authorize?test=true',
          state: 'test-state-' + Math.random(),
          code_verifier: 'test-verifier'
        });
      
      case 'complete_gmail_oauth':
        return Promise.resolve({
          access_token: 'ya29.test_access_token',
          refresh_token: '1//test_refresh_token',
          expires_in: 3600,
          token_type: 'Bearer'
        });
      
      case 'start_oauth_callback_server_and_wait':
        return Promise.resolve({
          code: 'test-auth-code',
          state: args?.expectedState || 'test-state'
        });
      
      case 'send_gmail_message':
        return Promise.resolve({
          success: true,
          messageId: 'sent-' + Math.random(),
        });
      
      case 'save_draft':
        return Promise.resolve({
          success: true,
          draftId: 'draft-' + Math.random(),
        });
      
      case 'download_attachment':
        return Promise.resolve({
          success: true,
          filePath: 'C:\\Downloads\\' + (args?.filename || 'attachment.pdf'),
        });
      
      case 'refresh_token':
        return Promise.resolve({
          success: true,
          newAccessToken: 'ya29.new_access_token',
          expiresIn: 3600
        });
      
      case 'refresh_gmail_token':
        return Promise.resolve({
          access_token: 'ya29.new_access_token',
          refresh_token: args?.refreshToken,
          expires_in: 3600,
          token_type: 'Bearer'
        });
      
      case 'get_accounts':
        return Promise.resolve([
          {
            id: 'account-1',
            email: 'test@gmail.com',
            name: 'Test User',
          }
        ]);
      
      case 'remove_account':
        return Promise.resolve({ success: true });
      
      case 'greet':
        return Promise.resolve(`Hello, ${args?.name || 'World'}!`);
      
      default:
        console.warn(`[TAURI MOCK] Unhandled command: ${command}`);
        return Promise.resolve({ success: true });
    }
  });

  console.log('🔧 [TEST] Tauri mocks initialized');
}

// Store original fetch for cleanup
let originalFetch: typeof fetch | undefined;

// Clean up Tauri mocks
export function cleanupTauriMocks() {
  vi.clearAllMocks();
  delete (global as any).__TAURI__;
  delete (global as any).__TAURI_INTERNALS__;
  delete (global as any).__TAURI_METADATA__;
  
  // Restore original fetch if it was stored
  if (originalFetch) {
    global.fetch = originalFetch;
  }
}

// Helper to mock specific Tauri command responses
export function mockTauriCommand(command: string, response: any) {
  mockTauriInvoke.mockImplementation((cmd: string, args?: any) => {
    if (cmd === command) {
      return Promise.resolve(response);
    }
    return mockTauriInvoke.getMockImplementation()?.(cmd, args);
  });
}

// Helper to simulate Tauri errors
export function mockTauriError(command: string, error: Error | string) {
  mockTauriInvoke.mockImplementation((cmd: string, args?: any) => {
    if (cmd === command) {
      return Promise.reject(typeof error === 'string' ? new Error(error) : error);
    }
    return mockTauriInvoke.getMockImplementation()?.(cmd, args);
  });
} 