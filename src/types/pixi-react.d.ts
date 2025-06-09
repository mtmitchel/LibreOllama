// Type definitions for @pixi/react v8
// Note: @pixi/react v8 uses extend() to register components, so types are handled differently
declare module '@pixi/react' {
  import { ComponentProps } from 'react';
  import { Graphics as PixiGraphics, Sprite as PixiSprite, Text as PixiText } from 'pixi.js';

  // Basic component interfaces for extended components
  interface GraphicsProps {
    interactive?: boolean;
    draw?: (g: any) => void;
    x?: number;
    y?: number;
    cursor?: string;
    pointerdown?: (event: any) => void;
    pointertap?: (event: any) => void;
    eventMode?: string;
    [key: string]: any;
  }

  interface SpriteProps {
    interactive?: boolean;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    image?: string;
    cursor?: string;
    pointerdown?: (event: any) => void;
    [key: string]: any;
  }

  interface TextProps {
    interactive?: boolean;
    x?: number;
    y?: number;
    text?: string;
    style?: any;
    cursor?: string;
    pointerdown?: (event: any) => void;
    pointertap?: (event: any) => void;
    [key: string]: any;
  }

  interface ContainerProps {
    x?: number;
    y?: number;
    scale?: { x: number; y: number } | number;
    interactive?: boolean;
    [key: string]: any;
  }

  // Export functions available in @pixi/react v8
  export function extend(components: Record<string, any>): void;
  export function useApplication(): any;
  export function useExtend(): any;
  export function useTick(callback: (delta: number) => void): void;
  export function createRoot(canvas: HTMLCanvasElement): any;
  
  // Application component (Stage equivalent)
  export const Application: React.FC<{
    width?: number;
    height?: number;
    options?: any;
    onMount?: (app: any) => void;
    children?: React.ReactNode;
  }>;
}
