"use strict";
// test-element-containment.ts
/**
 * Test suite for verifying element containment fixes
 * Run these tests after implementing the architectural changes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logCanvasState = exports.runElementContainmentTests = void 0;
const canvasStore_1 = require("./src/features/canvas/stores/canvasStore");
// Test utilities
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const createTestElement = (id, x, y) => ({
    id,
    type: 'rectangle',
    x,
    y,
    width: 100,
    height: 100,
    fill: '#3B82F6',
    stroke: '#1E40AF',
    strokeWidth: 2
});
// Test Suite
const runElementContainmentTests = async () => {
    console.log('🧪 Starting Element Containment Tests...\n');
    const store = canvasStore_1.useCanvasStore.getState();
    // Clear canvas before tests
    store.clearCanvas();
    store.clearAllSections();
    try {
        // Test 1: Section Detection
        console.log('Test 1: Section Detection');
        console.log('------------------------');
        // Create a section
        const sectionId = store.createSection(200, 200, 400, 300, 'Test Section');
        const section = store.getSectionById(sectionId);
        console.log('✅ Created section:', section);
        // Test finding section at various points
        const pointInSection = { x: 300, y: 300 };
        const pointOutsideSection = { x: 50, y: 50 };
        const foundSectionId1 = store.findSectionAtPoint(pointInSection);
        const foundSectionId2 = store.findSectionAtPoint(pointOutsideSection);
        console.log('Point in section:', pointInSection, '→ Found:', foundSectionId1);
        console.log('Point outside section:', pointOutsideSection, '→ Found:', foundSectionId2);
        if (foundSectionId1 === sectionId && foundSectionId2 === null) {
            console.log('✅ Section detection working correctly\n');
        }
        else {
            console.error('❌ Section detection failed\n');
        }
        await delay(1000);
        // Test 2: Element Creation in Section
        console.log('Test 2: Element Creation in Section');
        console.log('-----------------------------------');
        // Create element that should be captured by section
        const element1 = createTestElement('elem1', 250, 250);
        element1.sectionId = sectionId;
        // Convert to relative coordinates
        element1.x -= section.x;
        element1.y -= section.y;
        store.addElement(element1);
        store.addElementToSection(element1.id, sectionId);
        const addedElement = store.getElementById(element1.id);
        console.log('Added element:', addedElement);
        if (addedElement?.sectionId === sectionId) {
            console.log('✅ Element correctly assigned to section');
            console.log('   Relative coordinates:', { x: addedElement.x, y: addedElement.y });
        }
        else {
            console.error('❌ Element not assigned to section');
        }
        const elementsInSection = store.getElementsInSection(sectionId);
        console.log('Elements in section:', elementsInSection);
        if (elementsInSection.includes(element1.id)) {
            console.log('✅ Section contains element ID\n');
        }
        else {
            console.error('❌ Section does not contain element ID\n');
        }
        await delay(1000);
        // Test 3: Element Drop into Section
        console.log('Test 3: Element Drop into Section');
        console.log('---------------------------------');
        // Create element outside section
        const element2 = createTestElement('elem2', 50, 50);
        store.addElement(element2);
        console.log('Created element outside section:', element2);
        // Simulate drop into section
        const dropPosition = { x: 350, y: 350 };
        store.handleElementDrop(element2.id, dropPosition);
        const droppedElement = store.getElementById(element2.id);
        console.log('After drop:', droppedElement);
        if (droppedElement?.sectionId === sectionId) {
            console.log('✅ Element dropped into section successfully');
            console.log('   New relative coordinates:', { x: droppedElement.x, y: droppedElement.y });
        }
        else {
            console.error('❌ Element drop failed');
        }
        await delay(1000);
        // Test 4: Element Movement Between Sections
        console.log('Test 4: Element Movement Between Sections');
        console.log('-----------------------------------------');
        // Create second section
        const section2Id = store.createSection(650, 200, 400, 300, 'Second Section');
        const section2 = store.getSectionById(section2Id);
        console.log('Created second section:', section2);
        // Move element from first to second section
        const dropPosition2 = { x: 750, y: 300 };
        store.handleElementDrop(element2.id, dropPosition2);
        const movedElement = store.getElementById(element2.id);
        console.log('After moving to second section:', movedElement);
        if (movedElement?.sectionId === section2Id) {
            console.log('✅ Element moved between sections successfully');
            const elementsInSection1 = store.getElementsInSection(sectionId);
            const elementsInSection2 = store.getElementsInSection(section2Id);
            console.log('   Section 1 elements:', elementsInSection1);
            console.log('   Section 2 elements:', elementsInSection2);
            if (!elementsInSection1.includes(element2.id) && elementsInSection2.includes(element2.id)) {
                console.log('✅ Element lists updated correctly\n');
            }
            else {
                console.error('❌ Element lists not updated correctly\n');
            }
        }
        else {
            console.error('❌ Element movement between sections failed\n');
        }
        await delay(1000);
        // Test 5: Section Movement
        console.log('Test 5: Section Movement');
        console.log('------------------------');
        const oldSectionPos = { x: section.x, y: section.y };
        const newSectionPos = { x: 300, y: 300 };
        console.log('Moving section from', oldSectionPos, 'to', newSectionPos);
        const moveResult = store.handleSectionDragEnd(sectionId, newSectionPos.x, newSectionPos.y);
        console.log('Move result:', moveResult);
        const movedSection = store.getSectionById(sectionId);
        if (movedSection?.x === newSectionPos.x && movedSection?.y === newSectionPos.y) {
            console.log('✅ Section moved successfully');
            console.log('   Elements in section use relative coords, no update needed');
        }
        else {
            console.error('❌ Section movement failed');
        }
        await delay(1000);
        // Test 6: Capture Existing Elements
        console.log('Test 6: Capture Existing Elements on Section Creation');
        console.log('----------------------------------------------------');
        // Create elements first
        const element3 = createTestElement('elem3', 100, 400);
        const element4 = createTestElement('elem4', 150, 450);
        store.addElement(element3);
        store.addElement(element4);
        console.log('Created free elements:', [element3, element4]);
        // Create section that overlaps elements
        const section3Id = store.createSection(50, 350, 300, 200, 'Capturing Section');
        // Capture elements
        store.captureElementsAfterSectionCreation(section3Id);
        const capturedElem3 = store.getElementById(element3.id);
        const capturedElem4 = store.getElementById(element4.id);
        const section3Elements = store.getElementsInSection(section3Id);
        console.log('After capture:');
        console.log('   Element 3:', capturedElem3);
        console.log('   Element 4:', capturedElem4);
        console.log('   Section 3 elements:', section3Elements);
        if (capturedElem3?.sectionId === section3Id && capturedElem4?.sectionId === section3Id) {
            console.log('✅ Elements captured successfully\n');
        }
        else {
            console.error('❌ Element capture failed\n');
        }
        // Summary
        console.log('\n🎯 Test Summary');
        console.log('===============');
        console.log('All tests completed. Check the console output above for results.');
        console.log('\nFinal state:');
        console.log('- Total elements:', Object.keys(store.elements).length);
        console.log('- Total sections:', Object.keys(store.sections).length);
        console.log('\nElements by section:');
        store.getAllSections().forEach(section => {
            const elements = store.getElementsInSection(section.id);
            console.log(`- ${section.title}: ${elements.length} elements`);
        });
    }
    catch (error) {
        console.error('❌ Test failed with error:', error);
    }
};
exports.runElementContainmentTests = runElementContainmentTests;
// Helper to visualize current state
const logCanvasState = () => {
    const store = canvasStore_1.useCanvasStore.getState();
    console.log('\n📊 Current Canvas State');
    console.log('======================');
    console.log('\nSections:');
    store.getAllSections().forEach(section => {
        console.log(`- ${section.id} (${section.title})`);
        console.log(`  Position: (${section.x}, ${section.y})`);
        console.log(`  Size: ${section.width}x${section.height}`);
        console.log(`  Contains: ${section.containedElementIds.join(', ') || 'empty'}`);
    });
    console.log('\nElements:');
    Object.values(store.elements).forEach(element => {
        console.log(`- ${element.id} (${element.type})`);
        console.log(`  Position: (${element.x}, ${element.y})`);
        console.log(`  Section: ${element.sectionId || 'none (canvas)'}`);
    });
};
exports.logCanvasState = logCanvasState;
// Export for use in console
if (typeof window !== 'undefined') {
    window.runElementContainmentTests = exports.runElementContainmentTests;
    window.logCanvasState = exports.logCanvasState;
    console.log('💡 Test functions available:');
    console.log('   - runElementContainmentTests()');
    console.log('   - logCanvasState()');
}
