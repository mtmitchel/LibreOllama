/* Parity probe utilities (dev-only). Safe no-ops in production. */

type ProbeEventType =
  | 'selection'
  | 'text-commit'
  | 'connector'
  | 'transform'
  | 'drag';

interface ProbeEvent<T = any> {
  type: ProbeEventType;
  ts: number;
  data: T;
}

declare global {
  interface Window {
    __PARITY_PROBES__?: { buffer: ProbeEvent[]; push: (e: ProbeEvent) => void };
  }
}

function getBuffer(): { buffer: ProbeEvent[]; push: (e: ProbeEvent) => void } | null {
  if (typeof window === 'undefined') return null;
  if (process.env.NODE_ENV !== 'development') return null;
  if (!window.__PARITY_PROBES__) {
    const buf: ProbeEvent[] = [];
    window.__PARITY_PROBES__ = {
      buffer: buf,
      push: (e: ProbeEvent) => {
        try {
          buf.push(e);
          // Cap to last 200 events
          if (buf.length > 200) buf.splice(0, buf.length - 200);
        } catch {}
      },
    };
  }
  return window.__PARITY_PROBES__!;
}

function pushEvent<T>(type: ProbeEventType, data: T): void {
  const sink = getBuffer();
  if (!sink) return;
  sink.push({ type, ts: Date.now(), data });
}

export function captureSelectionProbe(payload: {
  selectionIds: string[];
  bbox?: { x: number; y: number; width: number; height: number } | null;
}): void {
  pushEvent('selection', payload);
}

export function captureTextCommitProbe(payload: {
  id: string;
  text: string;
  metrics: { width: number; height: number };
  frame: { width: number; height: number };
  inset: { x: number; y: number };
  viewportScale: { x: number; y: number };
}): void {
  pushEvent('text-commit', payload);
}

export function captureTransformProbe(payload: {
  id: string;
  kind: 'resize' | 'rotate' | 'drag';
  before?: { x?: number; y?: number; width?: number; height?: number; rotation?: number };
  after?: { x?: number; y?: number; width?: number; height?: number; rotation?: number };
}): void {
  pushEvent('transform', payload);
}

export function captureConnectorProbe(payload: {
  id?: string;
  sourceId?: string;
  targetId?: string;
  snapped: boolean;
  threshold: number;
  endpoints?: { x1: number; y1: number; x2: number; y2: number };
}): void {
  pushEvent('connector', payload);
}

export function isDevHudEnabled(): boolean {
  try {
    if (process.env.NODE_ENV !== 'development') return false;
    return typeof localStorage !== 'undefined' && localStorage.getItem('CANVAS_DEV_HUD') === '1';
  } catch {
    return false;
  }
}


