// src/components/Canvas/ImageElement.tsx
import React from 'react';
import { Image } from 'react-konva';
import Konva from 'konva';
import useImage from 'use-image';

interface ImageElementProps {
  element: {
    imageUrl?: string;
    width?: number;
    height?: number;
  };
  konvaProps: any;
}

const ImageElement = React.forwardRef<Konva.Image, ImageElementProps>(
  ({ element, konvaProps }, ref) => {
    const [image] = useImage(element.imageUrl || '');
    
    if (!image) return null;
    
    return (
      <Image
        ref={ref}
        {...konvaProps}
        image={image}
        width={element.width}
        height={element.height}
      />
    );
  }
);

ImageElement.displayName = 'ImageElement';

export default ImageElement;
