// Minimal test utils stub to satisfy imports in tests
export function renderWithProviders(node: any, options?: any) {
  return { rerender: () => {}, unmount: () => {} } as any;
}
export function createTestStore() {
  return {} as any;
}
export const waitForTick = () => new Promise((r) => setTimeout(r, 0));

// Additional named exports expected by tests
export function renderWithKonva(node: any, options?: any) {
  return renderWithProviders(node, options);
}
export function createMockCanvasElement(overrides: any = {}) {
  return { id: 'mock-id', type: 'text', x: 0, y: 0, width: 10, height: 10, createdAt: Date.now(), updatedAt: Date.now(), ...overrides };
}
