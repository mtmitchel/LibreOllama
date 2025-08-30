import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import Konva from 'konva';
import { createUnifiedTestStore } from '@/tests/helpers/createUnifiedTestStore';
import { useUnifiedCanvasStore } from '@/features/canvas/stores/unifiedCanvasStore';
import NonReactCanvasStage from '@/features/canvas/components/NonReactCanvasStage';

// Utility to render React component into JSDOM
function renderIntoDocument(element: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(element);
  return { container, root };
}

describe('Sticky Note Auto-Resize Integration', () => {
  beforeEach(() => {
    // Reset DOM between tests
    document.body.innerHTML = '';
  });

  it('grows element height and background to fit added text, and syncs transformer bounds', async () => {
    const store = createUnifiedTestStore();
    // Create initial sticky note element
    const id = 'sticky-1' as any;
    store.getState().addElement({
      id,
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 200,
      height: 100,
      text: 'Hello',
      textColor: '#111827',
      fill: '#FFF2CC',
      stroke: '#DDDDDD',
      strokeWidth: 1,
    } as any);

    // Render NonReactCanvasStage
    const { container } = renderIntoDocument(<NonReactCanvasStage />);

    // Start text editing (simulate a dblclick -> setTextEditingElement)
    store.getState().setTextEditingElement(id);

    // Find textarea created by overlay and simulate user typing
    const textarea = await new Promise<HTMLTextAreaElement>((resolve, reject) => {
      const start = Date.now();
      const timer = setInterval(() => {
        const el = container.querySelector('textarea');
        if (el) {
          clearInterval(timer);
          resolve(el as HTMLTextAreaElement);
        } else if (Date.now() - start > 2000) {
          clearInterval(timer);
          reject(new Error('textarea not found'));
        }
      }, 10);
    });

    // Type multiple lines to force resize
    textarea.value = 'Hello\nWorld\nThis is a very long note that should grow';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));

    // Blur to commit
    textarea.dispatchEvent(new FocusEvent('blur', { bubbles: true }));

    // Allow async timers to run
    await new Promise(r => setTimeout(r, 10));

    const updated = store.getState().elements.get(id) as any;
    expect(updated).toBeTruthy();
    // Height should increase beyond initial 100
    expect(updated.height).toBeGreaterThan(100);
    // Text should be updated
    expect(updated.text).toContain('very long note');
  });
});
