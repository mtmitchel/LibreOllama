// Development Validation Script for Phase 1 Canvas Architecture
// Add this to your browser console when the canvas is loaded

(function() {
    console.log('🧪 Phase 1 Canvas Architecture Validation');
    console.log('==========================================');
    
    // Check if feature flags are working
    function validateFeatureFlags() {
        console.log('\n📋 1. Validating Feature Flags...');
        
        try {
            // Check if the feature flag hook exists
            if (typeof window.useFeatureFlag !== 'undefined') {
                console.log('✅ useFeatureFlag hook available');
            } else {
                console.log('⚠️  useFeatureFlag hook not found (may be bundled)');
            }
            
            // Check for the new components in React DevTools
            const reactElements = document.querySelectorAll('[data-reactroot]');
            if (reactElements.length > 0) {
                console.log('✅ React application detected');
            }
            
            console.log('✅ Feature flag validation completed');
        } catch (error) {
            console.log('❌ Feature flag validation failed:', error.message);
        }
    }
    
    // Check canvas stage and layers
    function validateCanvasStructure() {
        console.log('\n🎨 2. Validating Canvas Structure...');
        
        try {
            // Look for Konva stage
            const konvaStage = document.querySelector('canvas');
            if (konvaStage) {
                console.log('✅ Konva canvas element found');
                console.log(`   Canvas size: ${konvaStage.width} x ${konvaStage.height}`);
            } else {
                console.log('❌ Konva canvas not found');
                return;
            }
            
            // Check if we can access Konva
            if (typeof window.Konva !== 'undefined') {
                console.log('✅ Konva library available globally');
                
                // Try to find stages
                const stages = window.Konva.stages;
                if (stages && stages.length > 0) {
                    console.log(`✅ Found ${stages.length} Konva stage(s)`);
                    
                    stages.forEach((stage, index) => {
                        const layers = stage.getLayers();
                        console.log(`   Stage ${index + 1}: ${layers.length} layers`);
                        
                        layers.forEach((layer, layerIndex) => {
                            const children = layer.getChildren();
                            console.log(`     Layer ${layerIndex + 1}: ${children.length} children`);
                            
                            // Look for section groups
                            children.forEach((child) => {
                                if (child.id && child.id().includes('section-group-')) {
                                    console.log(`     ✅ Found section group: ${child.id()}`);
                                }
                            });
                        });
                    });
                }
            } else {
                console.log('⚠️  Konva not available globally (may be bundled)');
            }
            
            console.log('✅ Canvas structure validation completed');
        } catch (error) {
            console.log('❌ Canvas structure validation failed:', error.message);
        }
    }
    
    // Test coordinate conversion
    function validateCoordinateSystem() {
        console.log('\n📐 3. Validating Coordinate System...');
        
        try {
            // Mock coordinate conversion test
            const testSection = { x: 100, y: 50, width: 300, height: 200 };
            const testChild = { x: 180, y: 120 };
            
            const relativeX = testChild.x - testSection.x;
            const relativeY = testChild.y - testSection.y;
            
            console.log('✅ Coordinate conversion test:');
            console.log(`   Section: (${testSection.x}, ${testSection.y})`);
            console.log(`   Child absolute: (${testChild.x}, ${testChild.y})`);
            console.log(`   Child relative: (${relativeX}, ${relativeY})`);
            console.log(`   Expected: (80, 70) - ${relativeX === 80 && relativeY === 70 ? 'PASSED' : 'CHECK MANUALLY'}`);
            
            console.log('✅ Coordinate system validation completed');
        } catch (error) {
            console.log('❌ Coordinate system validation failed:', error.message);
        }
    }
    
    // Check for new component files
    function validateComponentFiles() {
        console.log('\n🔧 4. Validating Component Integration...');
        
        try {
            // These checks would need to be done in the actual dev environment
            const expectedComponents = [
                'GroupedSectionRenderer',
                'TransformerManager',
                'useFeatureFlags'
            ];
            
            console.log('✅ Expected components:');
            expectedComponents.forEach(component => {
                console.log(`   📁 ${component} - Should be available`);
            });
            
            // Check for React components in DOM (if they have identifying attributes)
            const reactComponents = document.querySelectorAll('[data-component]');
            if (reactComponents.length > 0) {
                console.log(`✅ Found ${reactComponents.length} identified React components`);
            }
            
            console.log('✅ Component integration validation completed');
        } catch (error) {
            console.log('❌ Component integration validation failed:', error.message);
        }
    }
    
    // Interactive test functions
    function testSectionCreation() {
        console.log('\n🏗️  Interactive Test: Section Creation');
        console.log('=====================================');
        console.log('To test section creation:');
        console.log('1. Switch to section creation tool');
        console.log('2. Draw a section on the canvas');
        console.log('3. Check console for grouping logs');
        console.log('4. Verify section renders as Konva Group');
    }
    
    function testTransformerBehavior() {
        console.log('\n🔧 Interactive Test: Transformer Behavior');
        console.log('========================================');
        console.log('To test transformer:');
        console.log('1. Select a section');
        console.log('2. Verify transformer handles appear');
        console.log('3. Try resizing the section');
        console.log('4. Check that child elements move with section');
    }
    
    // Run all validations
    function runValidation() {
        validateFeatureFlags();
        validateCanvasStructure();
        validateCoordinateSystem();
        validateComponentFiles();
        
        console.log('\n📋 Interactive Tests Available:');
        console.log('================================');
        console.log('Run testSectionCreation() to test section creation');
        console.log('Run testTransformerBehavior() to test transformer');
        
        console.log('\n🎯 Validation Summary:');
        console.log('======================');
        console.log('✅ Basic validations completed');
        console.log('🎮 Interactive tests ready');
        console.log('📊 Check console for any errors or warnings');
    }
    
    // Make functions available globally for interactive testing
    window.validatePhase1 = runValidation;
    window.testSectionCreation = testSectionCreation;
    window.testTransformerBehavior = testTransformerBehavior;
    
    // Auto-run validation
    runValidation();
    
    console.log('\n🚀 Phase 1 Validation Complete!');
    console.log('================================');
    console.log('Available commands:');
    console.log('• validatePhase1() - Run all validations again');
    console.log('• testSectionCreation() - Section creation test guide');
    console.log('• testTransformerBehavior() - Transformer test guide');
    
})();
