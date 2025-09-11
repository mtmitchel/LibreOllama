import React from 'react';

export const DevHud: React.FC = () => {
  if (process.env.NODE_ENV !== 'development') return null;
  const buf = (window as any).__PARITY_PROBES__?.buffer as Array<any> | undefined;
  if (!buf) return null;
  const events = [...buf].slice(-50).reverse();

  const boxStyle: React.CSSProperties = {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 420,
    maxHeight: 260,
    overflow: 'auto',
    background: 'rgba(17,24,39,0.75)',
    color: '#E5E7EB',
    fontSize: 12,
    lineHeight: 1.4,
    padding: 8,
    borderRadius: 8,
    pointerEvents: 'auto',
  };

  return (
    <div style={boxStyle} aria-label="Canvas Dev HUD" role="region">
      <div style={{ marginBottom: 6, fontWeight: 600 }}>Parity Probes (latest 50)</div>
      {events.map((e, idx) => (
        <div key={idx} style={{ opacity: 0.9 }}>
          <code>{e.type}</code> · <span>{new Date(e.ts).toLocaleTimeString()}</span>
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(e.data)}</pre>
        </div>
      ))}
    </div>
  );
};

export default DevHud;


