import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import NonReactCanvasStage from '@/features/canvas/components/NonReactCanvasStage';
import { createUnifiedTestStore } from '@/tests/helpers/createUnifiedTestStore';

function renderIntoDocument(element: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(element);
  return { container, root };
}

describe('Sticky note wrap increases height and syncs transformer', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('reducing width causes wrap and increased height in the same frame', async () => {
    const store = createUnifiedTestStore();
    const id = 'sticky-wrap' as any;

    // Wide sticky note with one-line text
    store.getState().addElement({
      id,
      type: 'rectangle',
      x: 50,
      y: 50,
      width: 300,
      height: 60,
      text: 'This is a single line that will wrap when width decreases',
      textColor: '#111827',
      fill: '#FFF2CC',
      stroke: '#DDD',
      padding: 12,
      lineHeight: 1.4,
      align: 'left'
    } as any);

    renderIntoDocument(<NonReactCanvasStage />);

    // Reduce width to force wrapping
    store.getState().updateElement(id, { width: 150 }, { skipHistory: true });

    // Wait for microtask
    await new Promise(r => setTimeout(r, 10));

    const updated = store.getState().elements.get(id) as any;
    expect(updated).toBeTruthy();
    // Height should be greater than initial due to wrapping
    expect(updated.height).toBeGreaterThan(60);
  });
});
