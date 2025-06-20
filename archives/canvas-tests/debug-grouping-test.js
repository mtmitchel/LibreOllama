// Debug test for grouped section rendering
console.log('=== Debug Grouping Test ===');

// Test: Create section, then create rectangle inside it
(async () => {
  console.log('1. Creating section...');
  
  // Create section
  const sectionButton = document.querySelector('[title="Section Tool"]');
  if (sectionButton) {
    sectionButton.click();
    console.log('✓ Section tool activated');
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Get canvas and simulate section creation
    const canvas = document.querySelector('canvas');
    if (canvas) {
      // Simulate mousedown
      const rect = canvas.getBoundingClientRect();
      const startX = rect.left + 100;
      const startY = rect.top + 100;
      
      canvas.dispatchEvent(new MouseEvent('mousedown', {
        clientX: startX,
        clientY: startY,
        bubbles: true
      }));
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Simulate mousemove to create section
      canvas.dispatchEvent(new MouseEvent('mousemove', {
        clientX: startX + 200,
        clientY: startY + 150,
        bubbles: true
      }));
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Simulate mouseup to finish section
      canvas.dispatchEvent(new MouseEvent('mouseup', {
        clientX: startX + 200,
        clientY: startY + 150,
        bubbles: true
      }));
      
      console.log('✓ Section created');
      
      // Wait for section to be created
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('2. Switching to rectangle tool...');
      
      // Switch to rectangle tool
      const rectButton = document.querySelector('[title="Rectangle Tool"]');
      if (rectButton) {
        rectButton.click();
        console.log('✓ Rectangle tool activated');
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('3. Creating rectangle inside section...');
        
        // Click inside the section to create rectangle
        canvas.dispatchEvent(new MouseEvent('click', {
          clientX: startX + 50,
          clientY: startY + 50,
          bubbles: true
        }));
        
        console.log('✓ Rectangle created inside section');
        
        // Wait for rectangle to be created
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('4. Testing section movement...');
        
        // Switch to select tool
        const selectButton = document.querySelector('[title="Select Tool"]');
        if (selectButton) {
          selectButton.click();
          console.log('✓ Select tool activated');
          
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Click on section to select it
          canvas.dispatchEvent(new MouseEvent('click', {
            clientX: startX + 10, // Click on section border
            clientY: startY + 10,
            bubbles: true
          }));
          
          await new Promise(resolve => setTimeout(resolve, 500));
          
          console.log('5. Moving section...');
          
          // Drag section
          canvas.dispatchEvent(new MouseEvent('mousedown', {
            clientX: startX + 10,
            clientY: startY + 10,
            bubbles: true
          }));
          
          await new Promise(resolve => setTimeout(resolve, 100));
          
          canvas.dispatchEvent(new MouseEvent('mousemove', {
            clientX: startX + 110, // Move 100px right
            clientY: startY + 110, // Move 100px down
            bubbles: true
          }));
          
          await new Promise(resolve => setTimeout(resolve, 100));
          
          canvas.dispatchEvent(new MouseEvent('mouseup', {
            clientX: startX + 110,
            clientY: startY + 110,
            bubbles: true
          }));
          
          console.log('✓ Section moved - check if rectangle moved with it');
          console.log('=== Test Complete ===');
          console.log('Check the console logs above to see element separation and grouping info');
        }
      }
    }
  }
})().catch(console.error);
