// PIXI React v8 compatibility layer
// This file provides proper exports and types for @pixi/react v8

import { Application as PixiApplication, createRoot, extend, useApplication, useTick } from '@pixi/react';
import * as PIXI from 'pixi.js';

// Extend PIXI with all components to make them available as JSX elements
extend(PIXI);

// For backwards compatibility, create component references that match the old API
// These will be used in the existing code that imports { Stage, Container, Graphics, etc }
// In v8, these are used as lowercase JSX elements, but we'll provide compatibility

// Stage is now Application in v8
export const Stage = PixiApplication;
export const Application = PixiApplication;

// Create compatibility wrappers for components that are now lowercase JSX elements
// These forward refs will allow the existing uppercase imports to work
import React from 'react';

export const Container = React.forwardRef<any, any>((props, ref) => {
  return React.createElement('container', { ...props, ref });
});

export const Graphics = React.forwardRef<any, any>((props, ref) => {
  return React.createElement('graphics', { ...props, ref });
});

export const Text = React.forwardRef<any, any>((props, ref) => {
  return React.createElement('text', { ...props, ref });
});

export const Sprite = React.forwardRef<any, any>((props, ref) => {
  return React.createElement('sprite', { ...props, ref });
});

// Set display names for debugging
Container.displayName = 'Container';
Graphics.displayName = 'Graphics';
Text.displayName = 'Text';
Sprite.displayName = 'Sprite';

// Re-export hooks and utilities
export { createRoot, extend, useApplication as useApp, useTick };

// Re-export PIXI types
export type { 
  FederatedPointerEvent,
  FederatedMouseEvent,
  FederatedWheelEvent,
  Container as PIXIContainer,
  Graphics as PIXIGraphics,
  Text as PIXIText,
  Sprite as PIXISprite,
  Application as PIXIApplication
} from 'pixi.js';

console.log('PIXI compatibility layer loaded - using real @pixi/react v8 components');