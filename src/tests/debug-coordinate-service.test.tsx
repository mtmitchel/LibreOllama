/**
 * Debug test for coordinate service section detection
 */
import { describe, test, expect } from 'vitest';
import { CoordinateService } from '../features/canvas/utils/canvasCoordinateService';
import { SectionElement, SectionId } from '../features/canvas/types/enhanced.types';

describe('CoordinateService Section Detection Debug', () => {
  test('should detect section at point correctly', () => {    const section: SectionElement = {
      id: SectionId('test-section'),
      type: 'section',
      x: 100,
      y: 100,
      width: 300,
      height: 200,
      title: 'Test Section',
      childElementIds: [],
      isLocked: false,
      isHidden: false,
      backgroundColor: '#f8f9fa',
      borderColor: '#e9ecef',
      borderWidth: 2,
      cornerRadius: 8,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const sections = [section];
    const testPoint = { x: 150, y: 150 }; // Should be inside section bounds

    const result = CoordinateService.findSectionAtPoint(testPoint, sections);
    
    console.log('Section bounds:', { x: section.x, y: section.y, width: section.width, height: section.height });
    console.log('Test point:', testPoint);
    console.log('Detection result:', result);
    
    expect(result).toBe('test-section');
  });
});
