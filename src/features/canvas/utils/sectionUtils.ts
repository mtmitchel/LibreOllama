import { SectionElement } from '../types/enhanced.types';
import { Vector2d } from 'konva/lib/types';

export const findSectionByPosition = (sections: Map<string, SectionElement>, position: Vector2d): string | null => {
  for (const section of sections.values()) {
    if (
      position.x >= section.x &&
      position.x <= section.x + section.width &&
      position.y >= section.y &&
      position.y <= section.y + section.height
    ) {
      return section.id;
    }
  }
  return null;
};
