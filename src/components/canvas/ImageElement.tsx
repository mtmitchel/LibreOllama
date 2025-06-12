// src/components/Canvas/ImageElement.tsx
import React from 'react';
import { Image } from 'react-konva';
import useImage from 'use-image';

interface ImageElementProps {
  element: {
    imageUrl?: string;
    width?: number;
    height?: number;
  };
  konvaProps: any;
}

const ImageElement: React.FC<ImageElementProps> = ({ element, konvaProps }) => {
  const [image] = useImage(element.imageUrl || '');
  
  if (!image) return null;
  
  return (
    <Image
      {...konvaProps}
      image={image}
      width={element.width}
      height={element.height}
    />
  );
};

export default ImageElement;
