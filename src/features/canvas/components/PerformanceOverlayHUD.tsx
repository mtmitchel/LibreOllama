import React from 'react';

type Snapshot = any;

export const PerformanceOverlayHUD: React.FC = () => {
  const [visible, setVisible] = React.useState(false);
  const [snap, setSnap] = React.useState<Snapshot | null>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Toggle with Alt+P
      if (e.altKey && (e.key === 'p' || e.key === 'P')) {
        setVisible(v => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  React.useEffect(() => {
    if (!visible) return;
    const id = window.setInterval(() => {
      try {
        const s = (window as any).CANVAS_PERF?.snapshot?.();
        setSnap(s || null);
      } catch {}
    }, 500);
    return () => window.clearInterval(id);
  }, [visible]);

  if (!visible) return null;

  const boxStyle: React.CSSProperties = {
    position: 'absolute',
    top: 8,
    right: 8,
    background: 'rgba(17,17,17,0.8)',
    color: '#eaeaea',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: 12,
    padding: '8px 10px',
    borderRadius: 6,
    zIndex: 9999,
    pointerEvents: 'none',
    minWidth: 240,
    maxWidth: 360,
    lineHeight: 1.35,
  };

  return (
    <div style={boxStyle} aria-live="polite">
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Canvas Perf (Alt+P)</div>
      <div>Init: {snap?.initDurationMs != null ? `${Math.round(snap.initDurationMs)} ms` : 'n/a'}</div>
      <div>FPS: {snap?.fps ? `${Math.round(snap.fps)}` : 'n/a'} (avg: {snap?.avgFrameMs ? `${snap.avgFrameMs.toFixed(2)} ms` : 'n/a'})</div>
      <div style={{ marginTop: 6, fontWeight: 600 }}>Pointer (ms)</div>
      {snap?.pointer ? (
        <div>
          {Object.entries(snap.pointer as Record<string, any>).map(([tool, s]) => (
            <div key={tool}>{tool}: n={s.count}, min={s.minMs?.toFixed?.(2)}, max={s.maxMs?.toFixed?.(2)}</div>
          ))}
        </div>
      ) : (
        <div>no data</div>
      )}
      <div style={{ marginTop: 6, fontWeight: 600 }}>batchDraw</div>
      {snap?.batchDraw ? (
        <div>
          {Object.entries(snap.batchDraw as Record<string, number>).map(([layer, n]) => (
            <div key={layer}>{layer}: {n}</div>
          ))}
        </div>
      ) : (
        <div>no data</div>
      )}
    </div>
  );
};

export default PerformanceOverlayHUD;
