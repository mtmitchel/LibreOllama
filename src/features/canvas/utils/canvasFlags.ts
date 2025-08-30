// src/features/canvas/utils/canvasFlags.ts
// Simple feature-flag helper for controlling which canvas implementation to mount

const LS_KEY = 'USE_NEW_CANVAS';

export function readNewCanvasFlag(): boolean {
  try {
    const ls = localStorage.getItem(LS_KEY);
    if (ls === 'true') return true;
    if (ls === 'false') return false;
  } catch {}
  // Fallback to Vite env (use VITE_ prefix)
  try {
    // @ts-ignore
    const envVal = (import.meta as any)?.env?.VITE_USE_NEW_CANVAS;
    if (envVal === 'true') return true;
    if (envVal === 'false') return false;
  } catch {}
  // Safety-first default: use legacy (false)
  return false;
}

export function setNewCanvasFlag(value: boolean): void {
  try {
    localStorage.setItem(LS_KEY, value ? 'true' : 'false');
  } catch {}
}

export function installRollbackShortcuts(): void {
  try {
    // Attach emergency helpers on window for quick toggling
    (window as any).CANVAS_ENABLE_NEW_CANVAS = () => {
      setNewCanvasFlag(true);
      window.location.reload();
    };
    (window as any).CANVAS_EMERGENCY_ROLLBACK = () => {
      setNewCanvasFlag(false);
      window.location.reload();
    };
  } catch {}
}
