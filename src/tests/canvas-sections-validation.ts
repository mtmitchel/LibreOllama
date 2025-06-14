/**
 * Canvas Sections Feature Testing and Validation Suite
 * Phase 3 of Canvas Sections Refactoring Plan
 * 
 * This file contains comprehensive tests to validate the FigJam-style sections feature
 * including coordinate system, element-section interactions, text editing, and advanced features.
 */

import { CanvasElement } from '../stores/konvaCanvasStore';
import { SectionElement } from '../types/section';
import { CoordinateService } from '../utils/coordinateService';
import { Coordinates } from '../types';

// Test data structures
interface TestResult {
  testName: string;
  passed: boolean;
  details: string;
  logs: string[];
}

interface TestSuite {
  suiteName: string;
  results: TestResult[];
  overallPassed: boolean;
}

// Mock data for testing
const mockElements: Record<string, CanvasElement> = {
  freeElement1: {
    id: 'freeElement1',
    type: 'rectangle',
    x: 100,
    y: 50,
    width: 100,
    height: 80,
    sectionId: null
  },
  sectionedElement1: {
    id: 'sectionedElement1',
    type: 'text',
    x: 30, // Relative to section
    y: 60, // Relative to section
    width: 150,
    height: 40,
    sectionId: 'section1',
    text: 'Test text in section'
  },
  sectionedElement2: {
    id: 'sectionedElement2',
    type: 'circle',
    x: 50, // Relative to section
    y: 100, // Relative to section
    radius: 25,
    sectionId: 'section1'
  }
};

const mockSections: Record<string, SectionElement> = {
  section1: {
    id: 'section1',
    type: 'section',
    x: 200,
    y: 150,
    width: 300,
    height: 200,
    title: 'Test Section',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: '#3B82F6',
    borderWidth: 2,
    cornerRadius: 8,
    isHidden: false,
    isLocked: false,
    containedElementIds: ['sectionedElement1', 'sectionedElement2']
  },
  section2: {
    id: 'section2',
    type: 'section',
    x: 600,
    y: 100,
    width: 250,
    height: 180,
    title: 'Empty Section',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: '#22C55E',
    borderWidth: 2,
    cornerRadius: 8,
    isHidden: false,
    isLocked: false,
    containedElementIds: []
  }
};

// Logging utility
class TestLogger {
  private logs: string[] = [];

  log(message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    this.logs.push(logEntry);
    console.log(`🧪 TEST LOG: ${logEntry}`);
  }

  error(message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ERROR: ${message}`;
    this.logs.push(logEntry);
    console.error(`❌ TEST ERROR: ${logEntry}`);
  }

  getLogs(): string[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}

// Test Suite 1: Core Coordinate System Testing
export class CoordinateSystemTests {
  private logger = new TestLogger();

  async runAllTests(): Promise<TestSuite> {
    const results: TestResult[] = [];
    
    results.push(await this.testAbsolutePositioning());
    results.push(await this.testRelativePositioning());
    results.push(await this.testCoordinateConversion());
    results.push(await this.testSectionDragBehavior());

    const overallPassed = results.every(result => result.passed);
    
    return {
      suiteName: 'Core Coordinate System Tests',
      results,
      overallPassed
    };
  }

  private async testAbsolutePositioning(): Promise<TestResult> {
    this.logger.log('Testing absolute positioning for free elements');
    
    try {
      const freeElement = mockElements.freeElement1;
      
      // Test 1: Element without sectionId should use absolute coordinates
      const absoluteCoords = CoordinateService.toAbsolute(freeElement, mockSections);
      
      const expectedX = freeElement.x;
      const expectedY = freeElement.y;
      
      this.logger.log(`Free element coordinates: (${freeElement.x}, ${freeElement.y})`);
      this.logger.log(`Absolute coordinates: (${absoluteCoords.x}, ${absoluteCoords.y})`);
      
      const coordsMatch = absoluteCoords.x === expectedX && absoluteCoords.y === expectedY;
      
      if (coordsMatch) {
        this.logger.log('✅ Absolute positioning test PASSED');
        return {
          testName: 'Absolute Positioning for Free Elements',
          passed: true,
          details: `Element at (${freeElement.x}, ${freeElement.y}) correctly returns absolute coords (${absoluteCoords.x}, ${absoluteCoords.y})`,
          logs: this.logger.getLogs()
        };
      } else {
        this.logger.error(`Coordinate mismatch: expected (${expectedX}, ${expectedY}), got (${absoluteCoords.x}, ${absoluteCoords.y})`);
        return {
          testName: 'Absolute Positioning for Free Elements',
          passed: false,
          details: `Coordinate mismatch: expected (${expectedX}, ${expectedY}), got (${absoluteCoords.x}, ${absoluteCoords.y})`,
          logs: this.logger.getLogs()
        };
      }
    } catch (error) {
      this.logger.error(`Test failed with error: ${error}`);
      return {
        testName: 'Absolute Positioning for Free Elements',
        passed: false,
        details: `Test failed with error: ${error}`,
        logs: this.logger.getLogs()
      };
    }
  }

  private async testRelativePositioning(): Promise<TestResult> {
    this.logger.clearLogs();
    this.logger.log('Testing relative positioning for sectioned elements');
    
    try {
      const sectionedElement = mockElements.sectionedElement1;
      const section = mockSections.section1;
      
      // Test: Element with sectionId should convert relative to absolute coordinates
      const absoluteCoords = CoordinateService.toAbsolute(sectionedElement, mockSections);
      
      const expectedX = section.x + sectionedElement.x;
      const expectedY = section.y + sectionedElement.y;
      
      this.logger.log(`Section position: (${section.x}, ${section.y})`);
      this.logger.log(`Element relative position: (${sectionedElement.x}, ${sectionedElement.y})`);
      this.logger.log(`Calculated absolute position: (${absoluteCoords.x}, ${absoluteCoords.y})`);
      this.logger.log(`Expected absolute position: (${expectedX}, ${expectedY})`);
      
      const coordsMatch = absoluteCoords.x === expectedX && absoluteCoords.y === expectedY;
      
      if (coordsMatch) {
        this.logger.log('✅ Relative positioning test PASSED');
        return {
          testName: 'Relative Positioning for Sectioned Elements',
          passed: true,
          details: `Element relative coords (${sectionedElement.x}, ${sectionedElement.y}) + section (${section.x}, ${section.y}) = absolute (${absoluteCoords.x}, ${absoluteCoords.y})`,
          logs: this.logger.getLogs()
        };
      } else {
        this.logger.error(`Coordinate mismatch: expected (${expectedX}, ${expectedY}), got (${absoluteCoords.x}, ${absoluteCoords.y})`);
        return {
          testName: 'Relative Positioning for Sectioned Elements',
          passed: false,
          details: `Coordinate mismatch: expected (${expectedX}, ${expectedY}), got (${absoluteCoords.x}, ${absoluteCoords.y})`,
          logs: this.logger.getLogs()
        };
      }
    } catch (error) {
      this.logger.error(`Test failed with error: ${error}`);
      return {
        testName: 'Relative Positioning for Sectioned Elements',
        passed: false,
        details: `Test failed with error: ${error}`,
        logs: this.logger.getLogs()
      };
    }
  }

  private async testCoordinateConversion(): Promise<TestResult> {
    this.logger.clearLogs();
    this.logger.log('Testing coordinate conversion functions');
    
    try {
      const section = mockSections.section1;
      const absolutePoint: Coordinates = { x: 250, y: 200 };
      
      // Test conversion from absolute to relative
      const relativeCoords = CoordinateService.toRelative(absolutePoint, section);
      const expectedRelativeX = absolutePoint.x - section.x;
      const expectedRelativeY = absolutePoint.y - section.y;
      
      this.logger.log(`Absolute point: (${absolutePoint.x}, ${absolutePoint.y})`);
      this.logger.log(`Section position: (${section.x}, ${section.y})`);
      this.logger.log(`Calculated relative coords: (${relativeCoords.x}, ${relativeCoords.y})`);
      this.logger.log(`Expected relative coords: (${expectedRelativeX}, ${expectedRelativeY})`);
      
      const conversionCorrect = relativeCoords.x === expectedRelativeX && relativeCoords.y === expectedRelativeY;
      
      // Test round-trip conversion
      const backToAbsolute = CoordinateService.toAbsolute(
        { ...mockElements.sectionedElement1, x: relativeCoords.x, y: relativeCoords.y },
        mockSections
      );
      
      this.logger.log(`Round-trip back to absolute: (${backToAbsolute.x}, ${backToAbsolute.y})`);
      
      const roundTripCorrect = Math.abs(backToAbsolute.x - absolutePoint.x) < 0.001 && 
                               Math.abs(backToAbsolute.y - absolutePoint.y) < 0.001;
      
      if (conversionCorrect && roundTripCorrect) {
        this.logger.log('✅ Coordinate conversion test PASSED');
        return {
          testName: 'Coordinate Conversion Functions',
          passed: true,
          details: `Conversion and round-trip successful: absolute (${absolutePoint.x}, ${absolutePoint.y}) ↔ relative (${relativeCoords.x}, ${relativeCoords.y})`,
          logs: this.logger.getLogs()
        };
      } else {
        this.logger.error(`Conversion failed: initial conversion ${conversionCorrect}, round-trip ${roundTripCorrect}`);
        return {
          testName: 'Coordinate Conversion Functions',
          passed: false,
          details: `Conversion failed: initial conversion ${conversionCorrect}, round-trip ${roundTripCorrect}`,
          logs: this.logger.getLogs()
        };
      }
    } catch (error) {
      this.logger.error(`Test failed with error: ${error}`);
      return {
        testName: 'Coordinate Conversion Functions',
        passed: false,
        details: `Test failed with error: ${error}`,
        logs: this.logger.getLogs()
      };
    }
  }

  private async testSectionDragBehavior(): Promise<TestResult> {
    this.logger.clearLogs();
    this.logger.log('Testing section drag behavior simulation');
    
    try {
      const section = { ...mockSections.section1 };
      const sectionedElement = { ...mockElements.sectionedElement1 };
      
      // Get initial absolute position of element
      const initialAbsolute = CoordinateService.toAbsolute(sectionedElement, { section1: section });
      this.logger.log(`Initial absolute position of element: (${initialAbsolute.x}, ${initialAbsolute.y})`);
      
      // Simulate section drag by moving section 100px right, 50px down
      const deltaX = 100;
      const deltaY = 50;
      const movedSection = {
        ...section,
        x: section.x + deltaX,
        y: section.y + deltaY
      };
      
      this.logger.log(`Section moved from (${section.x}, ${section.y}) to (${movedSection.x}, ${movedSection.y})`);
      
      // Element's relative coordinates should remain the same
      // But absolute position should change by the same delta
      const newAbsolute = CoordinateService.toAbsolute(sectionedElement, { section1: movedSection });
      
      this.logger.log(`Element relative coords remain: (${sectionedElement.x}, ${sectionedElement.y})`);
      this.logger.log(`New absolute position: (${newAbsolute.x}, ${newAbsolute.y})`);
      
      const expectedNewX = initialAbsolute.x + deltaX;
      const expectedNewY = initialAbsolute.y + deltaY;
      
      this.logger.log(`Expected new absolute: (${expectedNewX}, ${expectedNewY})`);
      
      const dragBehaviorCorrect = newAbsolute.x === expectedNewX && newAbsolute.y === expectedNewY;
      
      if (dragBehaviorCorrect) {
        this.logger.log('✅ Section drag behavior test PASSED');
        return {
          testName: 'Section Drag Behavior',
          passed: true,
          details: `Section drag correctly moved element from (${initialAbsolute.x}, ${initialAbsolute.y}) to (${newAbsolute.x}, ${newAbsolute.y})`,
          logs: this.logger.getLogs()
        };
      } else {
        this.logger.error(`Drag behavior incorrect: expected (${expectedNewX}, ${expectedNewY}), got (${newAbsolute.x}, ${newAbsolute.y})`);
        return {
          testName: 'Section Drag Behavior',
          passed: false,
          details: `Drag behavior incorrect: expected (${expectedNewX}, ${expectedNewY}), got (${newAbsolute.x}, ${newAbsolute.y})`,
          logs: this.logger.getLogs()
        };
      }
    } catch (error) {
      this.logger.error(`Test failed with error: ${error}`);
      return {
        testName: 'Section Drag Behavior',
        passed: false,
        details: `Test failed with error: ${error}`,
        logs: this.logger.getLogs()
      };
    }
  }
}

// Test Suite 2: Element-Section Interaction Testing
export class ElementSectionInteractionTests {
  private logger = new TestLogger();

  async runAllTests(): Promise<TestSuite> {
    const results: TestResult[] = [];
    
    results.push(await this.testElementAddToSection());
    results.push(await this.testElementRemoveFromSection());
    results.push(await this.testElementMoveBetweenSections());
    results.push(await this.testPositionMaintenance());

    const overallPassed = results.every(result => result.passed);
    
    return {
      suiteName: 'Element-Section Interaction Tests',
      results,
      overallPassed
    };
  }

  private async testElementAddToSection(): Promise<TestResult> {
    this.logger.log('Testing element addition to section');
    
    try {
      const freeElement = { ...mockElements.freeElement1 };
      const targetSection = mockSections.section1;
      
      this.logger.log(`Free element at absolute: (${freeElement.x}, ${freeElement.y})`);
      this.logger.log(`Target section at: (${targetSection.x}, ${targetSection.y})`);
      
      // Simulate adding element to section
      // Element should get sectionId and coordinates should convert to relative
      const relativeCoords = CoordinateService.toRelative(
        { x: freeElement.x, y: freeElement.y },
        targetSection
      );
      
      const elementInSection = {
        ...freeElement,
        sectionId: targetSection.id,
        x: relativeCoords.x,
        y: relativeCoords.y
      };
      
      this.logger.log(`Element relative coords in section: (${relativeCoords.x}, ${relativeCoords.y})`);
      
      // Verify the element's absolute position is maintained
      const newAbsolute = CoordinateService.toAbsolute(elementInSection, mockSections);
      
      this.logger.log(`Element's new absolute position: (${newAbsolute.x}, ${newAbsolute.y})`);
      
      const positionMaintained = Math.abs(newAbsolute.x - freeElement.x) < 0.001 && 
                                 Math.abs(newAbsolute.y - freeElement.y) < 0.001;
      
      if (positionMaintained && elementInSection.sectionId === targetSection.id) {
        this.logger.log('✅ Element add to section test PASSED');
        return {
          testName: 'Element Addition to Section',
          passed: true,
          details: `Element successfully added to section, position maintained: (${freeElement.x}, ${freeElement.y}) → (${newAbsolute.x}, ${newAbsolute.y})`,
          logs: this.logger.getLogs()
        };
      } else {
        this.logger.error(`Position not maintained or sectionId not set: positionMaintained=${positionMaintained}, sectionId=${elementInSection.sectionId}`);
        return {
          testName: 'Element Addition to Section',
          passed: false,
          details: `Position not maintained or sectionId not set: positionMaintained=${positionMaintained}, sectionId=${elementInSection.sectionId}`,
          logs: this.logger.getLogs()
        };
      }
    } catch (error) {
      this.logger.error(`Test failed with error: ${error}`);
      return {
        testName: 'Element Addition to Section',
        passed: false,
        details: `Test failed with error: ${error}`,
        logs: this.logger.getLogs()
      };
    }
  }

  private async testElementRemoveFromSection(): Promise<TestResult> {
    this.logger.clearLogs();
    this.logger.log('Testing element removal from section');
    
    try {
      const sectionedElement = { ...mockElements.sectionedElement1 };
      const section = mockSections.section1;
      
      // Get element's current absolute position
      const currentAbsolute = CoordinateService.toAbsolute(sectionedElement, mockSections);
      
      this.logger.log(`Sectioned element absolute position: (${currentAbsolute.x}, ${currentAbsolute.y})`);
      
      // Simulate removing from section
      const freeElement = {
        ...sectionedElement,
        sectionId: null,
        x: currentAbsolute.x,
        y: currentAbsolute.y
      };
      
      this.logger.log(`Element after removal - sectionId: ${freeElement.sectionId}, coords: (${freeElement.x}, ${freeElement.y})`);
      
      // Verify it now uses absolute coordinates correctly
      const newAbsolute = CoordinateService.toAbsolute(freeElement, mockSections);
      
      this.logger.log(`Element's absolute position after removal: (${newAbsolute.x}, ${newAbsolute.y})`);
      
      const positionMaintained = Math.abs(newAbsolute.x - currentAbsolute.x) < 0.001 && 
                                 Math.abs(newAbsolute.y - currentAbsolute.y) < 0.001;
      
      if (positionMaintained && freeElement.sectionId === null) {
        this.logger.log('✅ Element remove from section test PASSED');
        return {
          testName: 'Element Removal from Section',
          passed: true,
          details: `Element successfully removed from section, position maintained: (${currentAbsolute.x}, ${currentAbsolute.y})`,
          logs: this.logger.getLogs()
        };
      } else {
        this.logger.error(`Position not maintained or sectionId not cleared: positionMaintained=${positionMaintained}, sectionId=${freeElement.sectionId}`);
        return {
          testName: 'Element Removal from Section',
          passed: false,
          details: `Position not maintained or sectionId not cleared: positionMaintained=${positionMaintained}, sectionId=${freeElement.sectionId}`,
          logs: this.logger.getLogs()
        };
      }
    } catch (error) {
      this.logger.error(`Test failed with error: ${error}`);
      return {
        testName: 'Element Removal from Section',
        passed: false,
        details: `Test failed with error: ${error}`,
        logs: this.logger.getLogs()
      };
    }
  }

  private async testElementMoveBetweenSections(): Promise<TestResult> {
    this.logger.clearLogs();
    this.logger.log('Testing element movement between sections');
    
    try {
      const element = { ...mockElements.sectionedElement1 };
      const sourceSection = mockSections.section1;
      const targetSection = mockSections.section2;
      
      // Get element's current absolute position
      const absolutePos = CoordinateService.toAbsolute(element, mockSections);
      
      this.logger.log(`Element absolute position: (${absolutePos.x}, ${absolutePos.y})`);
      this.logger.log(`Moving from section1 (${sourceSection.x}, ${sourceSection.y}) to section2 (${targetSection.x}, ${targetSection.y})`);
      
      // Calculate new relative coordinates for target section
      const newRelativeCoords = CoordinateService.toRelative(absolutePos, targetSection);
      
      const movedElement = {
        ...element,
        sectionId: targetSection.id,
        x: newRelativeCoords.x,
        y: newRelativeCoords.y
      };
      
      this.logger.log(`Element's new relative coords in target section: (${newRelativeCoords.x}, ${newRelativeCoords.y})`);
      
      // Verify absolute position is maintained
      const newAbsolute = CoordinateService.toAbsolute(movedElement, mockSections);
      
      this.logger.log(`Element's absolute position after move: (${newAbsolute.x}, ${newAbsolute.y})`);
      
      const positionMaintained = Math.abs(newAbsolute.x - absolutePos.x) < 0.001 && 
                                 Math.abs(newAbsolute.y - absolutePos.y) < 0.001;
      
      if (positionMaintained && movedElement.sectionId === targetSection.id) {
        this.logger.log('✅ Element move between sections test PASSED');
        return {
          testName: 'Element Movement Between Sections',
          passed: true,
          details: `Element successfully moved between sections, position maintained: (${absolutePos.x}, ${absolutePos.y}) → (${newAbsolute.x}, ${newAbsolute.y})`,
          logs: this.logger.getLogs()
        };
      } else {
        this.logger.error(`Position not maintained or sectionId incorrect: positionMaintained=${positionMaintained}, sectionId=${movedElement.sectionId}`);
        return {
          testName: 'Element Movement Between Sections',
          passed: false,
          details: `Position not maintained or sectionId incorrect: positionMaintained=${positionMaintained}, sectionId=${movedElement.sectionId}`,
          logs: this.logger.getLogs()
        };
      }
    } catch (error) {
      this.logger.error(`Test failed with error: ${error}`);
      return {
        testName: 'Element Movement Between Sections',
        passed: false,
        details: `Test failed with error: ${error}`,
        logs: this.logger.getLogs()
      };
    }
  }

  private async testPositionMaintenance(): Promise<TestResult> {
    this.logger.clearLogs();
    this.logger.log('Testing visual position maintenance during section operations');
    
    try {
      const element = { ...mockElements.sectionedElement1 };
      const section = { ...mockSections.section1 };
      
      // Record initial absolute position
      const initialAbsolute = CoordinateService.toAbsolute(element, { section1: section });
      
      this.logger.log(`Initial element absolute position: (${initialAbsolute.x}, ${initialAbsolute.y})`);
      
      // Test 1: Move section
      const movedSection = { ...section, x: section.x + 150, y: section.y - 75 };
      const afterSectionMove = CoordinateService.toAbsolute(element, { section1: movedSection });
      
      this.logger.log(`After section move: (${afterSectionMove.x}, ${afterSectionMove.y})`);
      
      // Test 2: Remove and re-add element
      const elementAsAbsolute = {
        ...element,
        sectionId: null,
        x: initialAbsolute.x,
        y: initialAbsolute.y
      };
      
      const afterRemoval = CoordinateService.toAbsolute(elementAsAbsolute, mockSections);
      
      this.logger.log(`After removal (as free element): (${afterRemoval.x}, ${afterRemoval.y})`);
      
      // Re-add to section
      const relativeCoords = CoordinateService.toRelative(initialAbsolute, section);
      const readdedElement = {
        ...elementAsAbsolute,
        sectionId: section.id,
        x: relativeCoords.x,
        y: relativeCoords.y
      };
      
      const afterReadd = CoordinateService.toAbsolute(readdedElement, { section1: section });
      
      this.logger.log(`After re-adding to section: (${afterReadd.x}, ${afterReadd.y})`);
      
      // All operations should maintain the visual position relative to canvas
      const sectionMoveCorrect = Math.abs(afterSectionMove.x - (initialAbsolute.x + 150)) < 0.001 && 
                                 Math.abs(afterSectionMove.y - (initialAbsolute.y - 75)) < 0.001;
      
      const removalCorrect = Math.abs(afterRemoval.x - initialAbsolute.x) < 0.001 && 
                             Math.abs(afterRemoval.y - initialAbsolute.y) < 0.001;
      
      const readdCorrect = Math.abs(afterReadd.x - initialAbsolute.x) < 0.001 && 
                           Math.abs(afterReadd.y - initialAbsolute.y) < 0.001;
      
      if (sectionMoveCorrect && removalCorrect && readdCorrect) {
        this.logger.log('✅ Position maintenance test PASSED');
        return {
          testName: 'Visual Position Maintenance',
          passed: true,
          details: `All operations correctly maintained or adjusted element positions as expected`,
          logs: this.logger.getLogs()
        };
      } else {
        this.logger.error(`Position maintenance failed: sectionMove=${sectionMoveCorrect}, removal=${removalCorrect}, readd=${readdCorrect}`);
        return {
          testName: 'Visual Position Maintenance',
          passed: false,
          details: `Position maintenance failed: sectionMove=${sectionMoveCorrect}, removal=${removalCorrect}, readd=${readdCorrect}`,
          logs: this.logger.getLogs()
        };
      }
    } catch (error) {
      this.logger.error(`Test failed with error: ${error}`);
      return {
        testName: 'Visual Position Maintenance',
        passed: false,
        details: `Test failed with error: ${error}`,
        logs: this.logger.getLogs()
      };
    }
  }
}

// Test Suite 3: Text Editing Overlay Testing
export class TextEditingTests {
  private logger = new TestLogger();

  async runAllTests(): Promise<TestSuite> {
    const results: TestResult[] = [];
    
    results.push(await this.testTextEditingInSection());
    results.push(await this.testTextEditingFreeElement());
    results.push(await this.testOverlayPositioning());
    results.push(await this.testTextEditingDuringMove());

    const overallPassed = results.every(result => result.passed);
    
    return {
      suiteName: 'Text Editing Overlay Tests',
      results,
      overallPassed
    };
  }

  private async testTextEditingInSection(): Promise<TestResult> {
    this.logger.log('Testing text editing overlay positioning for sectioned elements');
    
    try {
      const textElement = mockElements.sectionedElement1;
      const section = mockSections.section1;
      
      // Calculate where text editing overlay should appear
      const elementAbsolute = CoordinateService.toAbsolute(textElement, mockSections);
      
      this.logger.log(`Text element in section - relative: (${textElement.x}, ${textElement.y})`);
      this.logger.log(`Section position: (${section.x}, ${section.y})`);
      this.logger.log(`Element absolute position for overlay: (${elementAbsolute.x}, ${elementAbsolute.y})`);
      
      // Simulate stage transformation (zoom/pan)
      const mockStageTransform = {
        scaleX: 1.2,
        scaleY: 1.2,
        offsetX: 50,
        offsetY: 30
      };
      
      // Calculate screen position for overlay
      const screenX = (elementAbsolute.x * mockStageTransform.scaleX) + mockStageTransform.offsetX;
      const screenY = (elementAbsolute.y * mockStageTransform.scaleY) + mockStageTransform.offsetY;
      
      this.logger.log(`Screen position for overlay: (${screenX}, ${screenY})`);
      
      // Verify overlay positioning calculation
      const overlayPositionCorrect = !isNaN(screenX) && !isNaN(screenY) && 
                                     screenX > 0 && screenY > 0;
      
      if (overlayPositionCorrect) {
        this.logger.log('✅ Text editing in section test PASSED');
        return {
          testName: 'Text Editing in Section',
          passed: true,
          details: `Overlay positioning calculated correctly: screen position (${screenX}, ${screenY}) from element absolute (${elementAbsolute.x}, ${elementAbsolute.y})`,
          logs: this.logger.getLogs()
        };
      } else {
        this.logger.error(`Overlay positioning calculation failed: (${screenX}, ${screenY})`);
        return {
          testName: 'Text Editing in Section',
          passed: false,
          details: `Overlay positioning calculation failed: (${screenX}, ${screenY})`,
          logs: this.logger.getLogs()
        };
      }
    } catch (error) {
      this.logger.error(`Test failed with error: ${error}`);
      return {
        testName: 'Text Editing in Section',
        passed: false,
        details: `Test failed with error: ${error}`,
        logs: this.logger.getLogs()
      };
    }
  }

  private async testTextEditingFreeElement(): Promise<TestResult> {
    this.logger.clearLogs();
    this.logger.log('Testing text editing overlay positioning for free elements');
    
    try {
      // Create a text element not in any section
      const freeTextElement: CanvasElement = {
        id: 'freeText1',
        type: 'text',
        x: 300,
        y: 100,
        width: 200,
        height: 50,
        text: 'Free text element',
        sectionId: null
      };
      
      // Calculate overlay position - should use absolute coordinates directly
      const elementAbsolute = CoordinateService.toAbsolute(freeTextElement, mockSections);
      
      this.logger.log(`Free text element position: (${freeTextElement.x}, ${freeTextElement.y})`);
      this.logger.log(`Element absolute position (should be same): (${elementAbsolute.x}, ${elementAbsolute.y})`);
      
      // Verify absolute position matches element position
      const positionsMatch = elementAbsolute.x === freeTextElement.x && 
                             elementAbsolute.y === freeTextElement.y;
      
      if (positionsMatch) {
        this.logger.log('✅ Text editing free element test PASSED');
        return {
          testName: 'Text Editing Free Element',
          passed: true,
          details: `Free element absolute position correctly matches element position: (${elementAbsolute.x}, ${elementAbsolute.y})`,
          logs: this.logger.getLogs()
        };
      } else {
        this.logger.error(`Position mismatch: element (${freeTextElement.x}, ${freeTextElement.y}), absolute (${elementAbsolute.x}, ${elementAbsolute.y})`);
        return {
          testName: 'Text Editing Free Element',
          passed: false,
          details: `Position mismatch: element (${freeTextElement.x}, ${freeTextElement.y}), absolute (${elementAbsolute.x}, ${elementAbsolute.y})`,
          logs: this.logger.getLogs()
        };
      }
    } catch (error) {
      this.logger.error(`Test failed with error: ${error}`);
      return {
        testName: 'Text Editing Free Element',
        passed: false,
        details: `Test failed with error: ${error}`,
        logs: this.logger.getLogs()
      };
    }
  }

  private async testOverlayPositioning(): Promise<TestResult> {
    this.logger.clearLogs();
    this.logger.log('Testing overlay positioning consistency');
    
    try {
      const textElement = mockElements.sectionedElement1;
      const section = mockSections.section1;
      
      // Test overlay positioning at different zoom levels
      const zoomLevels = [0.5, 1.0, 1.5, 2.0];
      const overlayTests = [];
      
      for (const zoom of zoomLevels) {
        const elementAbsolute = CoordinateService.toAbsolute(textElement, mockSections);
        
        // Simulate screen coordinates calculation
        const screenX = elementAbsolute.x * zoom;
        const screenY = elementAbsolute.y * zoom;
        
        this.logger.log(`Zoom ${zoom}: absolute (${elementAbsolute.x}, ${elementAbsolute.y}) → screen (${screenX}, ${screenY})`);
        
        overlayTests.push({
          zoom,
          absolute: elementAbsolute,
          screen: { x: screenX, y: screenY },
          valid: !isNaN(screenX) && !isNaN(screenY) && screenX >= 0 && screenY >= 0
        });
      }
      
      const allTestsValid = overlayTests.every(test => test.valid);
      
      if (allTestsValid) {
        this.logger.log('✅ Overlay positioning consistency test PASSED');
        return {
          testName: 'Overlay Positioning Consistency',
          passed: true,
          details: `Overlay positioning works correctly at all zoom levels: ${zoomLevels.join(', ')}`,
          logs: this.logger.getLogs()
        };
      } else {
        const failedTests = overlayTests.filter(test => !test.valid);
        this.logger.error(`Overlay positioning failed at zoom levels: ${failedTests.map(t => t.zoom).join(', ')}`);
        return {
          testName: 'Overlay Positioning Consistency',
          passed: false,
          details: `Overlay positioning failed at zoom levels: ${failedTests.map(t => t.zoom).join(', ')}`,
          logs: this.logger.getLogs()
        };
      }
    } catch (error) {
      this.logger.error(`Test failed with error: ${error}`);
      return {
        testName: 'Overlay Positioning Consistency',
        passed: false,
        details: `Test failed with error: ${error}`,
        logs: this.logger.getLogs()
      };
    }
  }

  private async testTextEditingDuringMove(): Promise<TestResult> {
    this.logger.clearLogs();
    this.logger.log('Testing text editing overlay during section movement');
    
    try {
      const textElement = mockElements.sectionedElement1;
      const section = { ...mockSections.section1 };
      
      // Initial overlay position
      const initialAbsolute = CoordinateService.toAbsolute(textElement, { section1: section });
      this.logger.log(`Initial overlay position: (${initialAbsolute.x}, ${initialAbsolute.y})`);
      
      // Simulate section movement during editing
      const movedSection = { ...section, x: section.x + 100, y: section.y + 50 };
      const newAbsolute = CoordinateService.toAbsolute(textElement, { section1: movedSection });
      
      this.logger.log(`After section move, overlay should be at: (${newAbsolute.x}, ${newAbsolute.y})`);
      
      // Verify overlay position updates correctly
      const expectedNewX = initialAbsolute.x + 100;
      const expectedNewY = initialAbsolute.y + 50;
      
      const overlayUpdatedCorrectly = newAbsolute.x === expectedNewX && newAbsolute.y === expectedNewY;
      
      if (overlayUpdatedCorrectly) {
        this.logger.log('✅ Text editing during move test PASSED');
        return {
          testName: 'Text Editing During Section Move',
          passed: true,
          details: `Overlay position correctly updated from (${initialAbsolute.x}, ${initialAbsolute.y}) to (${newAbsolute.x}, ${newAbsolute.y})`,
          logs: this.logger.getLogs()
        };
      } else {
        this.logger.error(`Overlay position update incorrect: expected (${expectedNewX}, ${expectedNewY}), got (${newAbsolute.x}, ${newAbsolute.y})`);
        return {
          testName: 'Text Editing During Section Move',
          passed: false,
          details: `Overlay position update incorrect: expected (${expectedNewX}, ${expectedNewY}), got (${newAbsolute.x}, ${newAbsolute.y})`,
          logs: this.logger.getLogs()
        };
      }
    } catch (error) {
      this.logger.error(`Test failed with error: ${error}`);
      return {
        testName: 'Text Editing During Section Move',
        passed: false,
        details: `Test failed with error: ${error}`,
        logs: this.logger.getLogs()
      };
    }
  }
}

// Test Suite Runner
export class SectionTestRunner {
  private coordinateTests = new CoordinateSystemTests();
  private interactionTests = new ElementSectionInteractionTests();
  private textEditingTests = new TextEditingTests();

  async runAllTests(): Promise<{
    suites: TestSuite[];
    overallPassed: boolean;
    summary: string;
  }> {
    console.log('🧪 Starting Canvas Sections Validation Tests...');
    
    const suites: TestSuite[] = [];
    
    // Run all test suites
    suites.push(await this.coordinateTests.runAllTests());
    suites.push(await this.interactionTests.runAllTests());
    suites.push(await this.textEditingTests.runAllTests());
    
    // Calculate overall results
    const overallPassed = suites.every(suite => suite.overallPassed);
    const totalTests = suites.reduce((sum, suite) => sum + suite.results.length, 0);
    const passedTests = suites.reduce((sum, suite) => sum + suite.results.filter(r => r.passed).length, 0);
    
    const summary = `Tests completed: ${passedTests}/${totalTests} passed. Overall result: ${overallPassed ? 'PASSED' : 'FAILED'}`;
    
    console.log(`🧪 Test Summary: ${summary}`);
    
    return {
      suites,
      overallPassed,
      summary
    };
  }
}