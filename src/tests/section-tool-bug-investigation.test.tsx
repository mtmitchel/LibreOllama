/**
 * Section Tool Bug Investigation Test
 * 
 * Following CANVAS_TESTING_PLAN.md methodology:
 * - Use real store instances, not mocks
 * - Test complete UI workflow from button click to section creation
 * - Validate tool state transitions
 * - Check cross-store synchronization
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { createCanvasStore } from '../features/canvas/stores/canvasStore.enhanced';
import KonvaToolbar from '../features/canvas/components/toolbar/KonvaToolbar';
import { CanvasEventHandler } from '../features/canvas/components/CanvasEventHandler';
import React from 'react';

describe('Section Tool Bug Investigation', () => {
  let store: ReturnType<typeof createCanvasStore>;
  
  beforeEach(() => {
    // Use real store instance as per testing plan
    store = createCanvasStore();
  });

  it('should NOT create section immediately when section tool is clicked', () => {
    // Initial state - no sections should exist
    const initialSections = store.getState().sections;
    expect(initialSections.size).toBe(0);
    
    // Simulate clicking section tool
    store.getState().setSelectedTool('section');
    
    // After tool selection, still no sections should be created
    const sectionsAfterToolClick = store.getState().sections;
    expect(sectionsAfterToolClick.size).toBe(0);
    
    // Tool should be set to section
    expect(store.getState().selectedTool).toBe('section');
  });

  it('should only create section after drawing workflow is completed', () => {
    // Set section tool
    store.getState().setSelectedTool('section');
    
    // Simulate drawing workflow (mousedown -> mousemove -> mouseup)
    const mockMouseEvent = {
      detail: {
        start: { x: 100, y: 100 },
        current: { x: 200, y: 200 }
      }
    } as CustomEvent;
    
    // Dispatch section draw event
    window.dispatchEvent(new CustomEvent('canvas:tool:section:draw', mockMouseEvent));
    
    // Should still be no sections until end event
    expect(store.getState().sections.size).toBe(0);
    
    // Dispatch section end event
    window.dispatchEvent(new CustomEvent('canvas:tool:section:end'));
    
    // Now section should be created
    expect(store.getState().sections.size).toBe(1);
  });

  it('should trace execution path when section tool is selected', () => {
    // Spy on store methods to track what gets called
    const createSectionSpy = vi.spyOn(store.getState(), 'createSection');
    const setSelectedToolSpy = vi.spyOn(store.getState(), 'setSelectedTool');
    
    // Click section tool
    store.getState().setSelectedTool('section');
    
    // Verify only tool selection happened
    expect(setSelectedToolSpy).toHaveBeenCalledWith('section');
    expect(createSectionSpy).not.toHaveBeenCalled();
    
    // Verify no sections were created
    expect(store.getState().sections.size).toBe(0);
  });

  it('should validate toolbar configuration for section tool', () => {
    // Test the drawingModeTools array configuration
    // This should include 'section' to prevent immediate creation
    
    const mockProps = {
      tools: ['select', 'section', 'rectangle'],
      selectedTool: 'select' as const,
      onToolSelect: vi.fn(),
      size: 'default' as const
    };
    
    // Render toolbar to test actual behavior
    render(<KonvaToolbar {...mockProps} />);
    
    // Find section tool button
    const sectionButton = screen.getByRole('button', { name: /section/i });
    expect(sectionButton).toBeInTheDocument();
    
    // Click section tool
    fireEvent.click(sectionButton);
    
    // Verify onToolSelect was called with 'section'
    expect(mockProps.onToolSelect).toHaveBeenCalledWith('section');
  });
});
