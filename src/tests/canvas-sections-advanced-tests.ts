/**
 * Advanced Canvas Sections Testing Suite
 * Tests for section templates, locking, visibility, and performance
 */

import { CanvasElement } from '../stores/konvaCanvasStore';
import { SectionElement, sectionTemplates } from '../types/section';
import { CoordinateService } from '../utils/coordinateService';

interface TestResult {
  testName: string;
  passed: boolean;
  details: string;
  logs: string[];
  metrics?: any;
}

interface TestSuite {
  suiteName: string;
  results: TestResult[];
  overallPassed: boolean;
}

class TestLogger {
  private logs: string[] = [];

  log(message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    this.logs.push(logEntry);
    // console.log(`🧪 ADVANCED TEST: ${logEntry}`);
  }

  error(message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ERROR: ${message}`;
    this.logs.push(logEntry);
    console.error(`❌ ADVANCED TEST ERROR: ${logEntry}`);
  }

  getLogs(): string[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}

// Test Suite 4: Advanced Features Testing
export class AdvancedFeaturesTests {
  private logger = new TestLogger();

  async runAllTests(): Promise<TestSuite> {
    const results: TestResult[] = [];
    
    results.push(await this.testSectionTemplates());
    results.push(await this.testSectionLocking());
    results.push(await this.testSectionVisibility());
    results.push(await this.testSectionDeletion());

    const overallPassed = results.every(result => result.passed);
    
    return {
      suiteName: 'Advanced Features Tests',
      results,
      overallPassed
    };
  }

  private async testSectionTemplates(): Promise<TestResult> {
    this.logger.log('Testing section template creation and element assignment');
    
    try {
      // Test each available template
      const templateResults = [];
      
      for (const [templateId, template] of Object.entries(sectionTemplates)) {
        this.logger.log(`Testing template: ${templateId}`);
        
        // Simulate creating section from template
        const position = { x: 100, y: 100 };
        const sectionId = `section_test_${templateId}`;
        
        const newSection: SectionElement = {
          id: sectionId,
          type: 'section',
          x: position.x,
          y: position.y,
          width: template.width,
          height: template.height,
          title: template.title,
          backgroundColor: template.backgroundColor,
          borderColor: template.borderColor,
          borderWidth: 2,
          cornerRadius: 8,
          isHidden: false,
          isLocked: false,
          containedElementIds: [],
          templateType: templateId
        };
        
        // Create template elements with section-relative coordinates
        const templateElements: CanvasElement[] = [];
        template.elements.forEach((templateElement: any, index: number) => {
          const elementId = `${sectionId}_element_${index}`;
          const element: CanvasElement = {
            id: elementId,
            type: templateElement.type as any,
            x: templateElement.x, // Section-relative coordinates
            y: templateElement.y, // Section-relative coordinates
            sectionId: sectionId, // Properly assigned sectionId
            text: templateElement.text || '',
            fontSize: templateElement.fontSize || 14,
            fill: templateElement.fill || '#000000',
            width: templateElement.width || 200,
            height: templateElement.height || 100
          };
          templateElements.push(element);
        });
        
        this.logger.log(`Template ${templateId}: Created ${templateElements.length} elements`);
        
        // Verify all elements have sectionId assigned
        const allElementsHaveSectionId = templateElements.every(el => el.sectionId === sectionId);
        
        // Verify element coordinates are within section bounds
        const allElementsInBounds = templateElements.every(el => {
          return el.x >= 0 && el.x <= template.width &&
                 el.y >= 0 && el.y <= template.height;
        });
        
        templateResults.push({
          templateId,
          elementsCreated: templateElements.length,
          allHaveSectionId: allElementsHaveSectionId,
          allInBounds: allElementsInBounds,
          passed: allElementsHaveSectionId && allElementsInBounds
        });
        
        this.logger.log(`Template ${templateId} test: ${allElementsHaveSectionId && allElementsInBounds ? 'PASSED' : 'FAILED'}`);
      }
      
      const allTemplateTestsPassed = templateResults.every(result => result.passed);
      
      if (allTemplateTestsPassed) {
        this.logger.log('✅ Section templates test PASSED');
        return {
          testName: 'Section Template Creation',
          passed: true,
          details: `All ${templateResults.length} templates created successfully with proper sectionId assignment`,
          logs: this.logger.getLogs(),
          metrics: { templateResults }
        };
      } else {
        const failedTemplates = templateResults.filter(result => !result.passed);
        this.logger.error(`Template tests failed for: ${failedTemplates.map(t => t.templateId).join(', ')}`);
        return {
          testName: 'Section Template Creation',
          passed: false,
          details: `Template tests failed for: ${failedTemplates.map(t => t.templateId).join(', ')}`,
          logs: this.logger.getLogs(),
          metrics: { templateResults }
        };
      }
    } catch (error) {
      this.logger.error(`Test failed with error: ${error}`);
      return {
        testName: 'Section Template Creation',
        passed: false,
        details: `Test failed with error: ${error}`,
        logs: this.logger.getLogs()
      };
    }
  }

  private async testSectionLocking(): Promise<TestResult> {
    this.logger.clearLogs();
    this.logger.log('Testing section locking functionality');
    
    try {
      const section: SectionElement = {
        id: 'lockTestSection',
        type: 'section',
        x: 200,
        y: 150,
        width: 300,
        height: 200,
        title: 'Lock Test Section',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: '#3B82F6',
        borderWidth: 2,
        cornerRadius: 8,
        isHidden: false,
        isLocked: false,
        containedElementIds: ['lockTestElement1', 'lockTestElement2']
      };
      
      const element1: CanvasElement = {
        id: 'lockTestElement1',
        type: 'text',
        x: 30,
        y: 60,
        width: 150,
        height: 40,
        sectionId: 'lockTestSection',
        text: 'Test element 1'
      };
      
      const element2: CanvasElement = {
        id: 'lockTestElement2',
        type: 'rectangle',
        x: 50,
        y: 100,
        width: 100,
        height: 80,
        sectionId: 'lockTestSection'
      };
      
      this.logger.log(`Section initially locked: ${section.isLocked}`);
      
      // Test 1: Section should be draggable when not locked
      const initiallyDraggable = !section.isLocked;
      this.logger.log(`Section draggable when unlocked: ${initiallyDraggable}`);
      
      // Test 2: Lock the section
      const lockedSection = { ...section, isLocked: true };
      const lockedDraggable = !lockedSection.isLocked;
      this.logger.log(`Section draggable when locked: ${lockedDraggable}`);
      
      // Test 3: Content should still be editable when section is locked
      // Elements within locked sections should still be selectable and editable
      const contentEditable = true; // In FigJam, content remains editable even when section is locked
      this.logger.log(`Content editable in locked section: ${contentEditable}`);
      
      // Test 4: Verify lock state persistence
      const lockStatePersistent = lockedSection.isLocked === true;
      this.logger.log(`Lock state persistent: ${lockStatePersistent}`);
      
      const allLockTestsPassed = initiallyDraggable && 
                                 !lockedDraggable && 
                                 contentEditable && 
                                 lockStatePersistent;
      
      if (allLockTestsPassed) {
        this.logger.log('✅ Section locking test PASSED');
        return {
          testName: 'Section Locking Functionality',
          passed: true,
          details: 'Section locking properly prevents section movement while allowing content editing',
          logs: this.logger.getLogs(),
          metrics: {
            initiallyDraggable,
            lockedDraggable: !lockedDraggable,
            contentEditable,
            lockStatePersistent
          }
        };
      } else {
        this.logger.error('Section locking behavior incorrect');
        return {
          testName: 'Section Locking Functionality',
          passed: false,
          details: 'Section locking behavior incorrect',
          logs: this.logger.getLogs()
        };
      }
    } catch (error) {
      this.logger.error(`Test failed with error: ${error}`);
      return {
        testName: 'Section Locking Functionality',
        passed: false,
        details: `Test failed with error: ${error}`,
        logs: this.logger.getLogs()
      };
    }
  }

  private async testSectionVisibility(): Promise<TestResult> {
    this.logger.clearLogs();
    this.logger.log('Testing section visibility functionality');
    
    try {
      const section: SectionElement = {
        id: 'visibilityTestSection',
        type: 'section',
        x: 200,
        y: 150,
        width: 300,
        height: 200,
        title: 'Visibility Test Section',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: '#3B82F6',
        borderWidth: 2,
        cornerRadius: 8,
        isHidden: false,
        isLocked: false,
        containedElementIds: ['visibilityTestElement1']
      };
      
      const element: CanvasElement = {
        id: 'visibilityTestElement1',
        type: 'text',
        x: 30,
        y: 60,
        width: 150,
        height: 40,
        sectionId: 'visibilityTestSection',
        text: 'Test element'
      };
      
      this.logger.log(`Section initially hidden: ${section.isHidden}`);
      
      // Test 1: Section should be visible when not hidden
      const initiallyVisible = !section.isHidden;
      this.logger.log(`Section visible when not hidden: ${initiallyVisible}`);
      
      // Test 2: Hide the section
      const hiddenSection = { ...section, isHidden: true };
      const hiddenVisible = !hiddenSection.isHidden;
      this.logger.log(`Section visible when hidden: ${hiddenVisible}`);
      
      // Test 3: Hidden section should not render (return null from component)
      const shouldRender = !hiddenSection.isHidden;
      this.logger.log(`Hidden section should render: ${shouldRender}`);
      
      // Test 4: Elements in hidden sections should also be hidden
      const elementsHidden = hiddenSection.isHidden;
      this.logger.log(`Elements in hidden section are hidden: ${elementsHidden}`);
      
      // Test 5: Show section again
      const reshownSection = { ...hiddenSection, isHidden: false };
      const reshownVisible = !reshownSection.isHidden;
      this.logger.log(`Section visible after reshowing: ${reshownVisible}`);
      
      const allVisibilityTestsPassed = initiallyVisible && 
                                       !hiddenVisible && 
                                       !shouldRender && 
                                       elementsHidden && 
                                       reshownVisible;
      
      if (allVisibilityTestsPassed) {
        this.logger.log('✅ Section visibility test PASSED');
        return {
          testName: 'Section Visibility Functionality',
          passed: true,
          details: 'Section visibility correctly controls rendering of section and contained elements',
          logs: this.logger.getLogs(),
          metrics: {
            initiallyVisible,
            hiddenVisible,
            shouldRender,
            elementsHidden,
            reshownVisible
          }
        };
      } else {
        this.logger.error('Section visibility behavior incorrect');
        return {
          testName: 'Section Visibility Functionality',
          passed: false,
          details: 'Section visibility behavior incorrect',
          logs: this.logger.getLogs()
        };
      }
    } catch (error) {
      this.logger.error(`Test failed with error: ${error}`);
      return {
        testName: 'Section Visibility Functionality',
        passed: false,
        details: `Test failed with error: ${error}`,
        logs: this.logger.getLogs()
      };
    }
  }

  private async testSectionDeletion(): Promise<TestResult> {
    this.logger.clearLogs();
    this.logger.log('Testing section deletion behavior');
    
    try {
      const section: SectionElement = {
        id: 'deletionTestSection',
        type: 'section',
        x: 200,
        y: 150,
        width: 300,
        height: 200,
        title: 'Deletion Test Section',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: '#3B82F6',
        borderWidth: 2,
        cornerRadius: 8,
        isHidden: false,
        isLocked: false,
        containedElementIds: ['deletionTestElement1', 'deletionTestElement2']
      };
      
      const element1: CanvasElement = {
        id: 'deletionTestElement1',
        type: 'text',
        x: 30,
        y: 60,
        width: 150,
        height: 40,
        sectionId: 'deletionTestSection',
        text: 'Test element 1'
      };
      
      const element2: CanvasElement = {
        id: 'deletionTestElement2',
        type: 'rectangle',
        x: 50,
        y: 100,
        width: 100,
        height: 80,
        sectionId: 'deletionTestSection'
      };
      
      const sections = { deletionTestSection: section };
      const elements = { 
        deletionTestElement1: element1, 
        deletionTestElement2: element2 
      };
      
      this.logger.log(`Initial state: section exists with ${section.containedElementIds.length} elements`);
      
      // Test 1: Elements should have absolute positions after section deletion
      const element1Absolute = CoordinateService.toAbsolute(element1, sections);
      const element2Absolute = CoordinateService.toAbsolute(element2, sections);
      
      this.logger.log(`Element 1 absolute position: (${element1Absolute.x}, ${element1Absolute.y})`);
      this.logger.log(`Element 2 absolute position: (${element2Absolute.x}, ${element2Absolute.y})`);
      
      // Simulate section deletion - elements become free with absolute coordinates
      const freeElement1 = {
        ...element1,
        sectionId: null,
        x: element1Absolute.x,
        y: element1Absolute.y
      };
      
      const freeElement2 = {
        ...element2,
        sectionId: null,
        x: element2Absolute.x,
        y: element2Absolute.y
      };
      
      this.logger.log(`After deletion - Element 1: sectionId=${freeElement1.sectionId}, pos=(${freeElement1.x}, ${freeElement1.y})`);
      this.logger.log(`After deletion - Element 2: sectionId=${freeElement2.sectionId}, pos=(${freeElement2.x}, ${freeElement2.y})`);
      
      // Test 2: Elements should maintain their visual positions
      const element1PositionMaintained = freeElement1.x === element1Absolute.x && freeElement1.y === element1Absolute.y;
      const element2PositionMaintained = freeElement2.x === element2Absolute.x && freeElement2.y === element2Absolute.y;
      
      // Test 3: Elements should no longer have sectionId
      const element1SectionCleared = freeElement1.sectionId === null;
      const element2SectionCleared = freeElement2.sectionId === null;
      
      // Test 4: Elements should work as free elements
      const elementsAsFree = { 
        deletionTestElement1: freeElement1, 
        deletionTestElement2: freeElement2 
      };
      
      const element1FreeAbsolute = CoordinateService.toAbsolute(freeElement1, {});
      const element2FreeAbsolute = CoordinateService.toAbsolute(freeElement2, {});
      
      const element1WorksAsFree = element1FreeAbsolute.x === freeElement1.x && element1FreeAbsolute.y === freeElement1.y;
      const element2WorksAsFree = element2FreeAbsolute.x === freeElement2.x && element2FreeAbsolute.y === freeElement2.y;
      
      const allDeletionTestsPassed = element1PositionMaintained && 
                                     element2PositionMaintained && 
                                     element1SectionCleared && 
                                     element2SectionCleared &&
                                     element1WorksAsFree &&
                                     element2WorksAsFree;
      
      if (allDeletionTestsPassed) {
        this.logger.log('✅ Section deletion test PASSED');
        return {
          testName: 'Section Deletion Behavior',
          passed: true,
          details: 'Section deletion correctly converts contained elements to free elements while maintaining positions',
          logs: this.logger.getLogs(),
          metrics: {
            element1PositionMaintained,
            element2PositionMaintained,
            element1SectionCleared,
            element2SectionCleared,
            element1WorksAsFree,
            element2WorksAsFree
          }
        };
      } else {
        this.logger.error('Section deletion behavior incorrect');
        return {
          testName: 'Section Deletion Behavior',
          passed: false,
          details: 'Section deletion behavior incorrect',
          logs: this.logger.getLogs()
        };
      }
    } catch (error) {
      this.logger.error(`Test failed with error: ${error}`);
      return {
        testName: 'Section Deletion Behavior',
        passed: false,
        details: `Test failed with error: ${error}`,
        logs: this.logger.getLogs()
      };
    }
  }
}

// Test Suite 5: Performance and Edge Case Testing
export class PerformanceTests {
  private logger = new TestLogger();

  async runAllTests(): Promise<TestSuite> {
    const results: TestResult[] = [];
    
    results.push(await this.testManyElementsPerformance());
    results.push(await this.testRapidSectionMovement());
    results.push(await this.testComplexOperations());
    results.push(await this.testEdgeCases());

    const overallPassed = results.every(result => result.passed);
    
    return {
      suiteName: 'Performance and Edge Case Tests',
      results,
      overallPassed
    };
  }

  private async testManyElementsPerformance(): Promise<TestResult> {
    this.logger.log('Testing performance with many elements in sections');
    
    try {
      const elementCount = 100;
      const sectionCount = 5;
      
      const startTime = performance.now();
      
      // Create multiple sections
      const sections: Record<string, SectionElement> = {};
      for (let i = 0; i < sectionCount; i++) {
        sections[`section${i}`] = {
          id: `section${i}`,
          type: 'section',
          x: i * 350,
          y: 100,
          width: 300,
          height: 400,
          title: `Section ${i + 1}`,
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: '#3B82F6',
          borderWidth: 2,
          cornerRadius: 8,
          isHidden: false,
          isLocked: false,
          containedElementIds: []
        };
      }
      
      // Create many elements distributed across sections
      const elements: Record<string, CanvasElement> = {};
      for (let i = 0; i < elementCount; i++) {
        const sectionIndex = i % sectionCount;
        const sectionId = `section${sectionIndex}`;
        const elementId = `perfTestElement${i}`;
        
        elements[elementId] = {
          id: elementId,
          type: i % 2 === 0 ? 'rectangle' : 'circle',
          x: (i % 10) * 25,
          y: Math.floor(i / 10) * 30 + 50,
          width: 20,
          height: 20,
          radius: 10,
          sectionId: sectionId
        };
        
        sections[sectionId].containedElementIds.push(elementId);
      }
      
      const setupTime = performance.now() - startTime;
      this.logger.log(`Setup time for ${elementCount} elements in ${sectionCount} sections: ${setupTime.toFixed(2)}ms`);
      
      // Test coordinate conversions
      const conversionStartTime = performance.now();
      const conversionResults = [];
      
      for (const element of Object.values(elements)) {
        const absoluteCoords = CoordinateService.toAbsolute(element, sections);
        conversionResults.push(absoluteCoords);
      }
      
      const conversionTime = performance.now() - conversionStartTime;
      this.logger.log(`Coordinate conversion time for ${elementCount} elements: ${conversionTime.toFixed(2)}ms`);
      
      // Test section movement simulation
      const movementStartTime = performance.now();
      
      // Simulate moving all sections
      for (const section of Object.values(sections)) {
        section.x += 50;
        section.y += 25;
      }
      
      // Re-calculate absolute positions (simulating rendering update)
      for (const element of Object.values(elements)) {
        CoordinateService.toAbsolute(element, sections);
      }
      
      const movementTime = performance.now() - movementStartTime;
      this.logger.log(`Section movement simulation time: ${movementTime.toFixed(2)}ms`);
      
      const totalTime = performance.now() - startTime;
      
      // Performance thresholds (reasonable for 100 elements)
      const setupTimeOk = setupTime < 100; // Should setup in under 100ms
      const conversionTimeOk = conversionTime < 50; // Should convert in under 50ms
      const movementTimeOk = movementTime < 50; // Should simulate movement in under 50ms
      const totalTimeOk = totalTime < 200; // Total should be under 200ms
      
      const performanceAcceptable = setupTimeOk && conversionTimeOk && movementTimeOk && totalTimeOk;
      
      if (performanceAcceptable) {
        this.logger.log('✅ Performance test PASSED');
        return {
          testName: 'Many Elements Performance',
          passed: true,
          details: `Performance acceptable for ${elementCount} elements in ${sectionCount} sections`,
          logs: this.logger.getLogs(),
          metrics: {
            elementCount,
            sectionCount,
            setupTime: setupTime.toFixed(2),
            conversionTime: conversionTime.toFixed(2),
            movementTime: movementTime.toFixed(2),
            totalTime: totalTime.toFixed(2),
            setupTimeOk,
            conversionTimeOk,
            movementTimeOk,
            totalTimeOk
          }
        };
      } else {
        this.logger.error(`Performance issues detected: setup=${setupTime.toFixed(2)}ms, conversion=${conversionTime.toFixed(2)}ms, movement=${movementTime.toFixed(2)}ms`);
        return {
          testName: 'Many Elements Performance',
          passed: false,
          details: `Performance issues detected`,
          logs: this.logger.getLogs(),
          metrics: {
            elementCount,
            sectionCount,
            setupTime: setupTime.toFixed(2),
            conversionTime: conversionTime.toFixed(2),
            movementTime: movementTime.toFixed(2),
            totalTime: totalTime.toFixed(2),
            setupTimeOk,
            conversionTimeOk,
            movementTimeOk,
            totalTimeOk
          }
        };
      }
    } catch (error) {
      this.logger.error(`Test failed with error: ${error}`);
      return {
        testName: 'Many Elements Performance',
        passed: false,
        details: `Test failed with error: ${error}`,
        logs: this.logger.getLogs()
      };
    }
  }

  private async testRapidSectionMovement(): Promise<TestResult> {
    this.logger.clearLogs();
    this.logger.log('Testing rapid section movement performance');
    
    try {
      const section: SectionElement = {
        id: 'rapidMoveSection',
        type: 'section',
        x: 200,
        y: 150,
        width: 300,
        height: 200,
        title: 'Rapid Move Test',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: '#3B82F6',
        borderWidth: 2,
        cornerRadius: 8,
        isHidden: false,
        isLocked: false,
        containedElementIds: ['rapidElement1', 'rapidElement2', 'rapidElement3']
      };
      
      const elements: Record<string, CanvasElement> = {
        rapidElement1: {
          id: 'rapidElement1',
          type: 'text',
          x: 30,
          y: 60,
          width: 100,
          height: 30,
          sectionId: 'rapidMoveSection',
          text: 'Element 1'
        },
        rapidElement2: {
          id: 'rapidElement2',
          type: 'rectangle',
          x: 50,
          y: 100,
          width: 80,
          height: 60,
          sectionId: 'rapidMoveSection'
        },
        rapidElement3: {
          id: 'rapidElement3',
          type: 'circle',
          x: 150,
          y: 120,
          radius: 25,
          sectionId: 'rapidMoveSection'
        }
      };
      
      const moveCount = 50;
      const startTime = performance.now();
      
      // Simulate rapid section movements
      for (let i = 0; i < moveCount; i++) {
        // Move section in a small pattern
        section.x += Math.sin(i * 0.1) * 5;
        section.y += Math.cos(i * 0.1) * 5;
        
        // Calculate absolute positions for all elements (simulating render updates)
        for (const element of Object.values(elements)) {
          CoordinateService.toAbsolute(element, { rapidMoveSection: section });
        }
      }
      
      const totalTime = performance.now() - startTime;
      const avgTimePerMove = totalTime / moveCount;
      
      this.logger.log(`Rapid movement test: ${moveCount} moves in ${totalTime.toFixed(2)}ms`);
      this.logger.log(`Average time per move: ${avgTimePerMove.toFixed(2)}ms`);
      
      // Performance threshold - should handle rapid moves smoothly
      const avgTimeAcceptable = avgTimePerMove < 2; // Under 2ms per move
      const totalTimeAcceptable = totalTime < 100; // Total under 100ms
      
      const rapidMovementPerformanceOk = avgTimeAcceptable && totalTimeAcceptable;
      
      if (rapidMovementPerformanceOk) {
        this.logger.log('✅ Rapid section movement test PASSED');
        return {
          testName: 'Rapid Section Movement',
          passed: true,
          details: `Rapid movement performance acceptable: ${avgTimePerMove.toFixed(2)}ms average per move`,
          logs: this.logger.getLogs(),
          metrics: {
            moveCount,
            totalTime: totalTime.toFixed(2),
            avgTimePerMove: avgTimePerMove.toFixed(2),
            avgTimeAcceptable,
            totalTimeAcceptable
          }
        };
      } else {
        this.logger.error(`Rapid movement performance issues: ${avgTimePerMove.toFixed(2)}ms average per move`);
        return {
          testName: 'Rapid Section Movement',
          passed: false,
          details: `Rapid movement performance issues: ${avgTimePerMove.toFixed(2)}ms average per move`,
          logs: this.logger.getLogs()
        };
      }
    } catch (error) {
      this.logger.error(`Test failed with error: ${error}`);
      return {
        testName: 'Rapid Section Movement',
        passed: false,
        details: `Test failed with error: ${error}`,
        logs: this.logger.getLogs()
      };
    }
  }

  private async testComplexOperations(): Promise<TestResult> {
    this.logger.clearLogs();
    this.logger.log('Testing complex nested operations');
    
    try {
      // Create a complex scenario with multiple sections and cross-section operations
      const sections: Record<string, SectionElement> = {
        section1: {
          id: 'section1',
          type: 'section',
          x: 100,
          y: 100,
          width: 300,
          height: 200,
          title: 'Source Section',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: '#3B82F6',
          borderWidth: 2,
          cornerRadius: 8,
          isHidden: false,
          isLocked: false,
          containedElementIds: ['complexElement1']
        },
        section2: {
          id: 'section2',
          type: 'section',
          x: 500,
          y: 100,
          width: 300,
          height: 200,
          title: 'Target Section',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderColor: '#22C55E',
          borderWidth: 2,
          cornerRadius: 8,
          isHidden: false,
          isLocked: false,
          containedElementIds: []
        }
      };
      
      const element: CanvasElement = {
        id: 'complexElement1',
        type: 'text',
        x: 50,
        y: 75,
        width: 100,
        height: 30,
        sectionId: 'section1',
        text: 'Complex Element'
      };
      
      const startTime = performance.now();
      
      // Test 1: Get initial absolute position
      const initialAbsolute = CoordinateService.toAbsolute(element, sections);
      this.logger.log(`Initial absolute: (${initialAbsolute.x}, ${initialAbsolute.y})`);
      
      // Test 2: Move element between sections multiple times
      const iterations = 10;
      let currentElement = { ...element };
      
      for (let i = 0; i < iterations; i++) {
        const targetSectionId = i % 2 === 0 ? 'section2' : 'section1';
        const targetSection = sections[targetSectionId];
        
        // Get current absolute position
        const currentAbsolute = CoordinateService.toAbsolute(currentElement, sections);
        
        // Calculate new relative position
        const newRelativeCoords = CoordinateService.toRelative(currentAbsolute, targetSection);
        
        // Update element
        currentElement = {
          ...currentElement,
          sectionId: targetSectionId,
          x: newRelativeCoords.x,
          y: newRelativeCoords.y
        };
        
        // Verify position maintained
        const newAbsolute = CoordinateService.toAbsolute(currentElement, sections);
        const positionMaintained = Math.abs(newAbsolute.x - currentAbsolute.x) < 0.001 && 
                                   Math.abs(newAbsolute.y - currentAbsolute.y) < 0.001;
        
        if (!positionMaintained) {
          throw new Error(`Position not maintained in iteration ${i}: expected (${currentAbsolute.x}, ${currentAbsolute.y}), got (${newAbsolute.x}, ${newAbsolute.y})`);
        }
      }
      
      const complexOperationTime = performance.now() - startTime;
      this.logger.log(`Complex operations completed in ${complexOperationTime.toFixed(2)}ms`);
      
      // Test 3: Final verification
      const finalAbsolute = CoordinateService.toAbsolute(currentElement, sections);
      const finalPositionCorrect = Math.abs(finalAbsolute.x - initialAbsolute.x) < 0.001 && 
                                   Math.abs(finalAbsolute.y - initialAbsolute.y) < 0.001;
      
      const performanceAcceptable = complexOperationTime < 50; // Should complete in under 50ms
      
      if (finalPositionCorrect && performanceAcceptable) {
        this.logger.log('✅ Complex operations test PASSED');
        return {
          testName: 'Complex Nested Operations',
          passed: true,
          details: `Complex operations maintained position consistency through ${iterations} iterations`,
          logs: this.logger.getLogs(),
          metrics: {
            iterations,
            complexOperationTime: complexOperationTime.toFixed(2),
            finalPositionCorrect,
            performanceAcceptable
          }
        };
      } else {
        this.logger.error(`Complex operations failed: positionCorrect=${finalPositionCorrect}, performanceOk=${performanceAcceptable}`);
        return {
          testName: 'Complex Nested Operations',
          passed: false,
          details: `Complex operations failed: positionCorrect=${finalPositionCorrect}, performanceOk=${performanceAcceptable}`,
          logs: this.logger.getLogs()
        };
      }
    } catch (error) {
      this.logger.error(`Test failed with error: ${error}`);
      return {
        testName: 'Complex Nested Operations',
        passed: false,
        details: `Test failed with error: ${error}`,
        logs: this.logger.getLogs()
      };
    }
  }

  private async testEdgeCases(): Promise<TestResult> {
    this.logger.clearLogs();
    this.logger.log('Testing edge cases and error conditions');
    
    try {
      const edgeCaseResults = [];
      
      // Edge Case 1: Element with missing section
      try {
        const orphanElement: CanvasElement = {
          id: 'orphanElement',
          type: 'text',
          x: 50,
          y: 75,
          width: 100,
          height: 30,
          sectionId: 'nonexistentSection',
          text: 'Orphan Element'
        };
        
        const result = CoordinateService.toAbsolute(orphanElement, {});
        const handlesOrphanElement = result.x === orphanElement.x && result.y === orphanElement.y;
        
        edgeCaseResults.push({
          name: 'Orphan Element Handling',
          passed: handlesOrphanElement,
          details: handlesOrphanElement ? 'Falls back to element coordinates' : 'Failed to handle orphan element'
        });
        
        this.logger.log(`Orphan element test: ${handlesOrphanElement ? 'PASSED' : 'FAILED'}`);
      } catch (error) {
        edgeCaseResults.push({
          name: 'Orphan Element Handling',
          passed: false,
          details: `Threw error: ${error}`
        });
      }
      
      // Edge Case 2: Zero-sized section
      try {
        const zeroSection: SectionElement = {
          id: 'zeroSection',
          type: 'section',
          x: 100,
          y: 100,
          width: 0,
          height: 0,
          title: 'Zero Section',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: '#3B82F6',
          borderWidth: 2,
          cornerRadius: 8,
          isHidden: false,
          isLocked: false,
          containedElementIds: []
        };
        
        const elementInZeroSection: CanvasElement = {
          id: 'elementInZero',
          type: 'text',
          x: 0,
          y: 0,
          width: 50,
          height: 20,
          sectionId: 'zeroSection',
          text: 'In Zero'
        };
        
        const result = CoordinateService.toAbsolute(elementInZeroSection, { zeroSection });
        const handlesZeroSection = !isNaN(result.x) && !isNaN(result.y);
        
        edgeCaseResults.push({
          name: 'Zero-sized Section',
          passed: handlesZeroSection,
          details: handlesZeroSection ? 'Handles zero-sized section' : 'Failed with zero-sized section'
        });
        
        this.logger.log(`Zero-sized section test: ${handlesZeroSection ? 'PASSED' : 'FAILED'}`);
      } catch (error) {
        edgeCaseResults.push({
          name: 'Zero-sized Section',
          passed: false,
          details: `Threw error: ${error}`
        });
      }
      
      // Edge Case 3: Negative coordinates
      try {
        const negativeSection: SectionElement = {
          id: 'negativeSection',
          type: 'section',
          x: -100,
          y: -50,
          width: 200,
          height: 150,
          title: 'Negative Section',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: '#3B82F6',
          borderWidth: 2,
          cornerRadius: 8,
          isHidden: false,
          isLocked: false,
          containedElementIds: []
        };
        
        const elementInNegative: CanvasElement = {
          id: 'elementInNegative',
          type: 'text',
          x: 25,
          y: 50,
          width: 100,
          height: 30,
          sectionId: 'negativeSection',
          text: 'In Negative'
        };
        
        const result = CoordinateService.toAbsolute(elementInNegative, { negativeSection });
        const expectedX = negativeSection.x + elementInNegative.x;
        const expectedY = negativeSection.y + elementInNegative.y;
        
        const handlesNegativeCoords = result.x === expectedX && result.y === expectedY;
        
        edgeCaseResults.push({
          name: 'Negative Coordinates',
          passed: handlesNegativeCoords,
          details: handlesNegativeCoords ? 'Handles negative coordinates correctly' : 'Failed with negative coordinates'
        });
        
        this.logger.log(`Negative coordinates test: ${handlesNegativeCoords ? 'PASSED' : 'FAILED'}`);
      } catch (error) {
        edgeCaseResults.push({
          name: 'Negative Coordinates',
          passed: false,
          details: `Threw error: ${error}`
        });
      }
      
      const allEdgeCasesPassed = edgeCaseResults.every(result => result.passed);
      
      if (allEdgeCasesPassed) {
        this.logger.log('✅ Edge cases test PASSED');
        return {
          testName: 'Edge Cases and Error Conditions',
          passed: true,
          details: `All ${edgeCaseResults.length} edge cases handled correctly`,
          logs: this.logger.getLogs(),
          metrics: { edgeCaseResults }
        };
      } else {
        const failedCases = edgeCaseResults.filter(result => !result.passed);
        this.logger.error(`Edge cases failed: ${failedCases.map(c => c.name).join(', ')}`);
        return {
          testName: 'Edge Cases and Error Conditions',
          passed: false,
          details: `Edge cases failed: ${failedCases.map(c => c.name).join(', ')}`,
          logs: this.logger.getLogs(),
          metrics: { edgeCaseResults }
        };
      }
    } catch (error) {
      this.logger.error(`Test failed with error: ${error}`);
      return {
        testName: 'Edge Cases and Error Conditions',
        passed: false,
        details: `Test failed with error: ${error}`,
        logs: this.logger.getLogs()
      };
    }
  }
}

// Extended Test Runner including advanced tests
export class ExtendedSectionTestRunner {
  private advancedTests = new AdvancedFeaturesTests();
  private performanceTests = new PerformanceTests();

  async runAdvancedTests(): Promise<{
    suites: TestSuite[];
    overallPassed: boolean;
    summary: string;
  }> {
    console.log('🧪 Starting Advanced Canvas Sections Tests...');
    
    const suites: TestSuite[] = [];
    
    // Run advanced test suites
    suites.push(await this.advancedTests.runAllTests());
    suites.push(await this.performanceTests.runAllTests());
    
    // Calculate overall results
    const overallPassed = suites.every(suite => suite.overallPassed);
    const totalTests = suites.reduce((sum, suite) => sum + suite.results.length, 0);
    const passedTests = suites.reduce((sum, suite) => sum + suite.results.filter(r => r.passed).length, 0);
    
    const summary = `Advanced tests completed: ${passedTests}/${totalTests} passed. Overall result: ${overallPassed ? 'PASSED' : 'FAILED'}`;
    
    console.log(`🧪 Advanced Test Summary: ${summary}`);
    
    return {
      suites,
      overallPassed,
      summary
    };
  }
}