// vitest.setup.ts
import { enableMapSet } from 'immer';
import { vi } from 'vitest';
import React from 'react';

// THIS IS THE FIX FOR ZUSTAND/IMMER - Enable MapSet support for stores that use Set
enableMapSet();

// A simple dummy component that renders its children inside a div.
// It accepts all props but does nothing with them, preventing React warnings.
const createDummyKonvaComponent = (displayName: string) => {
  const Component = React.forwardRef<HTMLDivElement, any>(({ children, ...props }, ref) => {
    // We create a div with a data-testid to make it findable in tests.
    return React.createElement('div', { 'data-testid': `mock-${displayName.toLowerCase()}`, ref, ...props }, children);
  });
  Component.displayName = displayName;
  return Component;
};

// This is the core of the solution. We are manually creating a fake react-konva library.
vi.mock('react-konva', () => ({
  // Default export is required for some imports
  default: createDummyKonvaComponent('KonvaDefault'),
  // Manually list and create a dummy component for EVERY Konva component used in our app.
  Stage: createDummyKonvaComponent('Stage'),
  Layer: createDummyKonvaComponent('Layer'),
  Rect: createDummyKonvaComponent('Rect'),
  Circle: createDummyKonvaComponent('Circle'),
  Text: createDummyKonvaComponent('Text'),
  Line: createDummyKonvaComponent('Line'),
  Group: createDummyKonvaComponent('Group'),
  Image: createDummyKonvaComponent('Image'),
  Star: createDummyKonvaComponent('Star'),
  // Konva object for any imperative calls
  Konva: {
    Node: {
      create: vi.fn(),
    },
  },
}));
