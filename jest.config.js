/** @type {import('jest').Config} */
export default {
  // Test environment
  testEnvironment: 'jsdom',
  
  // File extensions to process
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    // Transform files with these extensions - Minimal for ESM
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      tsconfig: 'tsconfig.jest.json',
      isolatedModules: true // Faster compilation
    }]
  },
  
  // Module name mapping for path aliases and static assets
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
    // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup-new.ts', '@testing-library/jest-dom'],
  
  // Test patterns
  testMatch: [
    '<rootDir>/src/tests/**/*.test.(ts|tsx)',
    '<rootDir>/src/tests/**/*.spec.(ts|tsx)'
  ],  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/src-tauri/',
    '<rootDir>/archives/'
  ],
  
  // Coverage configuration
  collectCoverage: false, // Disable coverage for now to focus on tests
  collectCoverageFrom: [
    'src/features/canvas/**/*.{ts,tsx}',
    '!src/features/canvas/**/*.d.ts',
    '!src/features/canvas/**/*.stories.{ts,tsx}',
    '!src/features/canvas/**/__tests__/**',
    '!src/features/canvas/**/index.{ts,tsx}'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Mock configuration
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // ESM support
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  
  // Transform ignore patterns for node_modules  
  transformIgnorePatterns: [
    'node_modules/(?!(konva|react-konva|react-konva-utils)/)'
  ],

  // Module paths
  modulePaths: ['<rootDir>']
};
