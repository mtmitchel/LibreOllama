import React, { useState } from 'react';
import { Button } from '../../../components/ui/design-system/Button';
import { ImageUploadModal } from '../../notes/components/ImageUploadModal';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';
import { createElementId } from '../types/enhanced.types';

export const ImageUpload: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const addElement = useUnifiedCanvasStore((state) => state.addElement);

  const handleConfirm = (url: string) => {
    const image = new Image();
    image.onload = () => {
      const element = {
        id: createElementId(`image-${Date.now()}`),
        type: 'image' as const,
        x: 100,
        y: 100,
        width: image.width,
        height: image.height,
        imageUrl: url,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      addElement(element as any);
      setIsModalOpen(false);
    };
    image.src = url;
  };

  return (
    <div>
      <Button onClick={() => setIsModalOpen(true)}>Upload Image</Button>
      <ImageUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirm}
      />
    </div>
  );
};
