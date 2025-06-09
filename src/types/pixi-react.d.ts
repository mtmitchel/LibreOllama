// Type augmentation for @pixi/react to fix interactive property issue
declare module '@pixi/react' {
  import { ComponentProps } from 'react';
  import { Graphics as PixiGraphics, Sprite as PixiSprite, Text as PixiText } from 'pixi.js';

  // Extend Graphics props to include interactive property
  interface GraphicsProps extends Partial<PixiGraphics> {
    interactive?: boolean;
    draw?: (g: PixiGraphics) => void;
    x?: number;
    y?: number;
    cursor?: string;
    pointerdown?: (event: any) => void;
    pointertap?: (event: any) => void;
  }

  // Extend Sprite props to include interactive property
  interface SpriteProps extends Partial<PixiSprite> {
    interactive?: boolean;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    image?: string;
    cursor?: string;
    pointerdown?: (event: any) => void;
  }
  // Extend Text props to include interactive property and fix style issue
  interface TextProps extends Partial<PixiText> {
    interactive?: boolean;
    x?: number;
    y?: number;
    text?: string;
    style?: any; // Allow partial style objects
    cursor?: string;
    pointerdown?: (event: any) => void;
    pointertap?: (event: any) => void;
  }

  export const Graphics: React.FC<GraphicsProps>;
  export const Sprite: React.FC<SpriteProps>;
  export const Text: React.FC<TextProps>;
  export const Stage: React.FC<any>;
  export const Container: React.FC<any>;
}
