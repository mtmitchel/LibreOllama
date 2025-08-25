// vitest.setup.ts

import { vi } from 'vitest';
import React from 'react';
import { enableMapSet } from 'immer';

enableMapSet();

// Removed react-konva mock - no longer using react-konva
// vi.mock('react-konva', async (importOriginal) => {
  const actual = await importOriginal();

  // This factory creates a simple div-based mock for any Konva component
  const MockComponent = (name: string) => {
    return ({ children, ...props }: any) => {
      // Pass all props through, including data-testid
      return React.createElement('div', { 'data-testid': `konva-${name.toLowerCase()}`, ...props }, children);
    };
  };

  return {
    ...actual,
    Stage: MockComponent('Stage'),
    Layer: MockComponent('Layer'),
    Group: MockComponent('Group'),
    Rect: MockComponent('Rect'),
    Circle: MockComponent('Circle'),
    Text: MockComponent('Text'),
    Image: MockComponent('Image'),
    Line: MockComponent('Line'),
    Arrow: MockComponent('Arrow'),
    Transformer: MockComponent('Transformer'),
    Star: MockComponent('Star'),
    // Add any other Konva components used in the project
  };
});
