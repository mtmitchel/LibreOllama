/**
 * Comprehensive E2E Tests for Connector/Edge Functionality
 * 
 * This test suite covers:
 * 1. Basic connector creation between elements
 * 2. Port snapping (N, S, E, W)
 * 3. Free-form connector drawing
 * 4. Connector selection and highlighting
 * 5. Connector endpoint adjustment
 * 6. Arrow vs line connectors
 * 7. Connector deletion
 * 8. Multi-connector scenarios
 * 9. Edge cases and error handling
 */

describe('Connector System - Comprehensive Tests', () => {
  beforeEach(() => {
    cy.visit('/canvas');
    cy.wait(1000); // Wait for canvas initialization
    
    // Clear any existing elements
    cy.window().then((win) => {
      const store = (win as any).__UNIFIED_CANVAS_STORE__;
      if (store) {
        store.getState().clearCanvas();
      }
    });
  });

  describe('Basic Connector Creation', () => {
    it('should create a line connector between two circles', () => {
      // Create two circles
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        const circle1 = store.getState().addElement({
          type: 'circle',
          x: 200,
          y: 200,
          radius: 50,
          fill: '#ff6b6b'
        });
        const circle2 = store.getState().addElement({
          type: 'circle',
          x: 400,
          y: 200,
          radius: 50,
          fill: '#4ecdc4'
        });
        
        // Select line connector tool
        store.getState().setSelectedTool('connector-line');
      });
      
      // Draw connector from first circle to second
      cy.get('canvas').first()
        .trigger('mousedown', 200, 200)
        .trigger('mousemove', 400, 200)
        .trigger('mouseup', 400, 200);
      
      // Verify connector was created
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        const edges = Array.from(store.getState().edges.values());
        expect(edges).to.have.length(1);
        expect(edges[0].subType).to.equal('line');
      });
    });

    it('should create an arrow connector between two rectangles', () => {
      // Create two rectangles
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        const rect1 = store.getState().addElement({
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 100,
          height: 60,
          fill: '#ffd93d'
        });
        const rect2 = store.getState().addElement({
          type: 'rectangle',
          x: 300,
          y: 100,
          width: 100,
          height: 60,
          fill: '#6bcf7f'
        });
        
        // Select arrow connector tool
        store.getState().setSelectedTool('connector-arrow');
      });
      
      // Draw arrow from first rect to second
      cy.get('canvas').first()
        .trigger('mousedown', 150, 130)
        .trigger('mousemove', 350, 130)
        .trigger('mouseup', 350, 130);
      
      // Verify arrow connector was created
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        const edges = Array.from(store.getState().edges.values());
        expect(edges).to.have.length(1);
        expect(edges[0].subType).to.equal('arrow');
      });
    });
  });

  describe('Port Snapping', () => {
    it('should snap to North port when drawing near top of element', () => {
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        const rect = store.getState().addElement({
          type: 'rectangle',
          x: 200,
          y: 200,
          width: 100,
          height: 100,
          fill: '#e0e0e0'
        });
        
        store.getState().setSelectedTool('connector-line');
      });
      
      // Start from outside and drag to near North port
      cy.get('canvas').first()
        .trigger('mousedown', 250, 100)
        .trigger('mousemove', 250, 198) // Near top edge
        .trigger('mouseup', 250, 198);
      
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        const edges = Array.from(store.getState().edges.values());
        expect(edges).to.have.length(1);
        expect(edges[0].target.portKind).to.equal('N');
      });
    });

    it('should snap to South port when drawing near bottom of element', () => {
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        const rect = store.getState().addElement({
          type: 'rectangle',
          x: 200,
          y: 200,
          width: 100,
          height: 100,
          fill: '#e0e0e0'
        });
        
        store.getState().setSelectedTool('connector-line');
      });
      
      // Start from outside and drag to near South port
      cy.get('canvas').first()
        .trigger('mousedown', 250, 400)
        .trigger('mousemove', 250, 302) // Near bottom edge
        .trigger('mouseup', 250, 302);
      
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        const edges = Array.from(store.getState().edges.values());
        expect(edges).to.have.length(1);
        expect(edges[0].target.portKind).to.equal('S');
      });
    });

    it('should snap to East port when drawing near right side of element', () => {
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        const rect = store.getState().addElement({
          type: 'rectangle',
          x: 200,
          y: 200,
          width: 100,
          height: 100,
          fill: '#e0e0e0'
        });
        
        store.getState().setSelectedTool('connector-line');
      });
      
      // Start from outside and drag to near East port
      cy.get('canvas').first()
        .trigger('mousedown', 400, 250)
        .trigger('mousemove', 302, 250) // Near right edge
        .trigger('mouseup', 302, 250);
      
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        const edges = Array.from(store.getState().edges.values());
        expect(edges).to.have.length(1);
        expect(edges[0].target.portKind).to.equal('E');
      });
    });

    it('should snap to West port when drawing near left side of element', () => {
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        const rect = store.getState().addElement({
          type: 'rectangle',
          x: 200,
          y: 200,
          width: 100,
          height: 100,
          fill: '#e0e0e0'
        });
        
        store.getState().setSelectedTool('connector-line');
      });
      
      // Start from outside and drag to near West port
      cy.get('canvas').first()
        .trigger('mousedown', 100, 250)
        .trigger('mousemove', 198, 250) // Near left edge
        .trigger('mouseup', 198, 250);
      
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        const edges = Array.from(store.getState().edges.values());
        expect(edges).to.have.length(1);
        expect(edges[0].target.portKind).to.equal('W');
      });
    });
  });

  describe('Free-form Connector Drawing', () => {
    it('should create a free-floating line connector without elements', () => {
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        store.getState().setSelectedTool('connector-line');
      });
      
      // Draw connector in empty space
      cy.get('canvas').first()
        .trigger('mousedown', 100, 100)
        .trigger('mousemove', 300, 200)
        .trigger('mouseup', 300, 200);
      
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        const edges = Array.from(store.getState().edges.values());
        expect(edges).to.have.length(1);
        expect(edges[0].source.elementId).to.equal('');
        expect(edges[0].target.elementId).to.equal('');
        expect(edges[0].points).to.have.length(4);
        expect(edges[0].subType).to.equal('line');
      });
    });

    it('should create a free-floating arrow connector without elements', () => {
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        store.getState().setSelectedTool('connector-arrow');
      });
      
      // Draw arrow in empty space
      cy.get('canvas').first()
        .trigger('mousedown', 150, 150)
        .trigger('mousemove', 350, 250)
        .trigger('mouseup', 350, 250);
      
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        const edges = Array.from(store.getState().edges.values());
        expect(edges).to.have.length(1);
        expect(edges[0].source.elementId).to.equal('');
        expect(edges[0].target.elementId).to.equal('');
        expect(edges[0].points).to.have.length(4);
        expect(edges[0].subType).to.equal('arrow');
      });
    });

    it('should create a partially connected connector (one end free)', () => {
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        const circle = store.getState().addElement({
          type: 'circle',
          x: 200,
          y: 200,
          radius: 50,
          fill: '#ff6b6b'
        });
        
        store.getState().setSelectedTool('connector-line');
      });
      
      // Draw from circle to empty space
      cy.get('canvas').first()
        .trigger('mousedown', 200, 200) // On circle
        .trigger('mousemove', 400, 300) // To empty space
        .trigger('mouseup', 400, 300);
      
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        const edges = Array.from(store.getState().edges.values());
        expect(edges).to.have.length(1);
        expect(edges[0].source.elementId).to.not.equal('');
        expect(edges[0].target.elementId).to.equal('');
      });
    });
  });

  describe('Connector Selection and Highlighting', () => {
    it('should select connector when clicked', () => {
      // Create a connector
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        const edgeId = store.getState().addEdge({
          type: 'edge',
          source: { elementId: '', portKind: 'CENTER' },
          target: { elementId: '', portKind: 'CENTER' },
          points: [100, 100, 300, 200],
          x: 100,
          y: 100,
          width: 200,
          height: 100,
          routing: 'straight',
          stroke: '#374151',
          strokeWidth: 2,
          selectable: true,
          subType: 'line'
        });
        
        // Switch to select tool
        store.getState().setSelectedTool('select');
      });
      
      // Click on the connector line
      cy.get('canvas').first().click(200, 150);
      
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        const selectedIds = store.getState().selectedElementIds;
        expect(selectedIds.size).to.equal(1);
        const selectedId = Array.from(selectedIds)[0];
        expect(selectedId).to.include('edge');
      });
    });

    it('should show handles when connector is selected', () => {
      // Create and select a connector
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        const edgeId = store.getState().addEdge({
          type: 'edge',
          source: { elementId: '', portKind: 'CENTER' },
          target: { elementId: '', portKind: 'CENTER' },
          points: [100, 100, 300, 200],
          x: 100,
          y: 100,
          width: 200,
          height: 100,
          routing: 'straight',
          stroke: '#374151',
          strokeWidth: 2,
          selectable: true,
          subType: 'line'
        });
        
        store.getState().setSelectedTool('select');
        store.getState().selectElement(edgeId, false);
      });
      
      // Check if handles are visible in overlay
      cy.window().then((win) => {
        const renderer = (win as any).__CANVAS_RENDERER_V2__;
        const stage = renderer?.stage;
        if (stage) {
          const overlayLayer = stage.findOne('.overlay-layer');
          const handles = overlayLayer?.find('.edge-handle');
          expect(handles).to.have.length(2); // Start and end handles
        }
      });
    });
  });

  describe('Connector Endpoint Adjustment', () => {
    it('should allow dragging start endpoint to new position', () => {
      // Create a connector and element
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        
        const rect = store.getState().addElement({
          type: 'rectangle',
          x: 400,
          y: 200,
          width: 100,
          height: 100,
          fill: '#e0e0e0'
        });
        
        const edgeId = store.getState().addEdge({
          type: 'edge',
          source: { elementId: '', portKind: 'CENTER' },
          target: { elementId: '', portKind: 'CENTER' },
          points: [100, 100, 300, 200],
          x: 100,
          y: 100,
          width: 200,
          height: 100,
          routing: 'straight',
          stroke: '#374151',
          strokeWidth: 2,
          selectable: true,
          subType: 'line'
        });
        
        store.getState().setSelectedTool('select');
        store.getState().selectElement(edgeId, false);
      });
      
      // Drag start handle to rectangle
      cy.get('canvas').first()
        .trigger('mousedown', 100, 100) // Start handle position
        .trigger('mousemove', 400, 250) // Drag to rectangle West port
        .trigger('mouseup', 400, 250);
      
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        const edges = Array.from(store.getState().edges.values());
        const edge = edges[0];
        expect(edge.source.elementId).to.not.equal('');
        expect(edge.source.portKind).to.equal('W');
      });
    });

    it('should allow dragging end endpoint to new position', () => {
      // Create a connector and element
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        
        const circle = store.getState().addElement({
          type: 'circle',
          x: 450,
          y: 300,
          radius: 50,
          fill: '#4ecdc4'
        });
        
        const edgeId = store.getState().addEdge({
          type: 'edge',
          source: { elementId: '', portKind: 'CENTER' },
          target: { elementId: '', portKind: 'CENTER' },
          points: [100, 100, 300, 200],
          x: 100,
          y: 100,
          width: 200,
          height: 100,
          routing: 'straight',
          stroke: '#374151',
          strokeWidth: 2,
          selectable: true,
          subType: 'arrow'
        });
        
        store.getState().setSelectedTool('select');
        store.getState().selectElement(edgeId, false);
      });
      
      // Drag end handle to circle
      cy.get('canvas').first()
        .trigger('mousedown', 300, 200) // End handle position
        .trigger('mousemove', 450, 250) // Drag to circle North port
        .trigger('mouseup', 450, 250);
      
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        const edges = Array.from(store.getState().edges.values());
        const edge = edges[0];
        expect(edge.target.elementId).to.not.equal('');
        expect(edge.target.portKind).to.equal('N');
      });
    });

    it('should snap to ports when dragging endpoints near elements', () => {
      // Create elements and connector
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        
        const rect1 = store.getState().addElement({
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 80,
          height: 80,
          fill: '#ffd93d'
        });
        
        const rect2 = store.getState().addElement({
          type: 'rectangle',
          x: 300,
          y: 100,
          width: 80,
          height: 80,
          fill: '#6bcf7f'
        });
        
        const edgeId = store.getState().addEdge({
          type: 'edge',
          source: { elementId: rect1, portKind: 'E' },
          target: { elementId: rect2, portKind: 'W' },
          points: [180, 140, 300, 140],
          x: 180,
          y: 140,
          width: 120,
          height: 1,
          routing: 'straight',
          stroke: '#10b981',
          strokeWidth: 2,
          selectable: true,
          subType: 'line'
        });
        
        store.getState().setSelectedTool('select');
        store.getState().selectElement(edgeId, false);
      });
      
      // Drag end handle to snap to South port
      cy.get('canvas').first()
        .trigger('mousedown', 300, 140) // Current end position
        .trigger('mousemove', 340, 182) // Near South port
        .trigger('mouseup', 340, 182);
      
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        const edges = Array.from(store.getState().edges.values());
        const edge = edges[0];
        expect(edge.target.portKind).to.equal('S');
      });
    });
  });

  describe('Connector Deletion', () => {
    it('should delete selected connector with Delete key', () => {
      // Create and select a connector
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        const edgeId = store.getState().addEdge({
          type: 'edge',
          source: { elementId: '', portKind: 'CENTER' },
          target: { elementId: '', portKind: 'CENTER' },
          points: [100, 100, 300, 200],
          x: 100,
          y: 100,
          width: 200,
          height: 100,
          routing: 'straight',
          stroke: '#374151',
          strokeWidth: 2,
          selectable: true,
          subType: 'line'
        });
        
        store.getState().setSelectedTool('select');
        store.getState().selectElement(edgeId, false);
      });
      
      // Press Delete key
      cy.get('body').type('{del}');
      
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        const edges = Array.from(store.getState().edges.values());
        expect(edges).to.have.length(0);
      });
    });

    it('should delete multiple selected connectors', () => {
      // Create multiple connectors
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        
        const edge1 = store.getState().addEdge({
          type: 'edge',
          source: { elementId: '', portKind: 'CENTER' },
          target: { elementId: '', portKind: 'CENTER' },
          points: [100, 100, 200, 100],
          x: 100,
          y: 100,
          width: 100,
          height: 1,
          routing: 'straight',
          stroke: '#374151',
          strokeWidth: 2,
          selectable: true,
          subType: 'line'
        });
        
        const edge2 = store.getState().addEdge({
          type: 'edge',
          source: { elementId: '', portKind: 'CENTER' },
          target: { elementId: '', portKind: 'CENTER' },
          points: [100, 200, 200, 200],
          x: 100,
          y: 200,
          width: 100,
          height: 1,
          routing: 'straight',
          stroke: '#374151',
          strokeWidth: 2,
          selectable: true,
          subType: 'arrow'
        });
        
        store.getState().setSelectedTool('select');
        store.getState().selectElement(edge1, false);
        store.getState().selectElement(edge2, true); // Multi-select
      });
      
      // Press Delete key
      cy.get('body').type('{del}');
      
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        const edges = Array.from(store.getState().edges.values());
        expect(edges).to.have.length(0);
      });
    });
  });

  describe('Multi-Connector Scenarios', () => {
    it('should handle multiple connectors between same elements', () => {
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        
        const circle1 = store.getState().addElement({
          type: 'circle',
          x: 200,
          y: 200,
          radius: 50,
          fill: '#ff6b6b'
        });
        
        const circle2 = store.getState().addElement({
          type: 'circle',
          x: 400,
          y: 200,
          radius: 50,
          fill: '#4ecdc4'
        });
        
        // Create multiple edges between same circles
        const edge1 = store.getState().addEdge({
          type: 'edge',
          source: { elementId: circle1, portKind: 'N' },
          target: { elementId: circle2, portKind: 'N' },
          routing: 'orthogonal',
          stroke: '#ff6b6b',
          strokeWidth: 2,
          selectable: true,
          subType: 'line'
        });
        
        const edge2 = store.getState().addEdge({
          type: 'edge',
          source: { elementId: circle1, portKind: 'S' },
          target: { elementId: circle2, portKind: 'S' },
          routing: 'orthogonal',
          stroke: '#4ecdc4',
          strokeWidth: 2,
          selectable: true,
          subType: 'arrow'
        });
        
        const edges = Array.from(store.getState().edges.values());
        expect(edges).to.have.length(2);
        expect(edges[0].source.portKind).to.not.equal(edges[1].source.portKind);
      });
    });

    it('should handle connectors in a chain', () => {
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        
        // Create chain of elements
        const rect1 = store.getState().addElement({
          type: 'rectangle',
          x: 100,
          y: 200,
          width: 80,
          height: 60,
          fill: '#ffd93d'
        });
        
        const rect2 = store.getState().addElement({
          type: 'rectangle',
          x: 250,
          y: 200,
          width: 80,
          height: 60,
          fill: '#6bcf7f'
        });
        
        const rect3 = store.getState().addElement({
          type: 'rectangle',
          x: 400,
          y: 200,
          width: 80,
          height: 60,
          fill: '#e056fd'
        });
        
        // Connect them in a chain
        const edge1 = store.getState().addEdge({
          type: 'edge',
          source: { elementId: rect1, portKind: 'E' },
          target: { elementId: rect2, portKind: 'W' },
          routing: 'straight',
          stroke: '#374151',
          strokeWidth: 2,
          selectable: true,
          subType: 'arrow'
        });
        
        const edge2 = store.getState().addEdge({
          type: 'edge',
          source: { elementId: rect2, portKind: 'E' },
          target: { elementId: rect3, portKind: 'W' },
          routing: 'straight',
          stroke: '#374151',
          strokeWidth: 2,
          selectable: true,
          subType: 'arrow'
        });
        
        const edges = Array.from(store.getState().edges.values());
        expect(edges).to.have.length(2);
        
        // Verify chain connectivity
        expect(edges[0].target.elementId).to.equal(edges[1].source.elementId);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should not create connector with insufficient drag distance', () => {
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        store.getState().setSelectedTool('connector-line');
      });
      
      // Very small drag (less than 10px threshold)
      cy.get('canvas').first()
        .trigger('mousedown', 200, 200)
        .trigger('mousemove', 202, 201)
        .trigger('mouseup', 202, 201);
      
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        const edges = Array.from(store.getState().edges.values());
        expect(edges).to.have.length(0);
      });
    });

    it('should handle connector creation while element is being moved', () => {
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        
        const circle = store.getState().addElement({
          type: 'circle',
          x: 200,
          y: 200,
          radius: 50,
          fill: '#ff6b6b'
        });
        
        // Create edge connected to circle
        const edgeId = store.getState().addEdge({
          type: 'edge',
          source: { elementId: circle, portKind: 'E' },
          target: { elementId: '', portKind: 'CENTER' },
          points: [250, 200, 350, 200],
          x: 250,
          y: 200,
          width: 100,
          height: 1,
          routing: 'straight',
          stroke: '#374151',
          strokeWidth: 2,
          selectable: true,
          subType: 'line'
        });
        
        // Move the circle
        store.getState().updateElement(circle, { x: 300, y: 250 });
        
        // Trigger edge reflow
        store.getState().reflowEdgesForElement(circle);
        store.getState().computeAndCommitDirtyEdges();
        
        // Verify edge updated its position
        const edges = Array.from(store.getState().edges.values());
        const edge = edges[0];
        expect(edge.points[0]).to.be.closeTo(350, 10); // New X position
        expect(edge.points[1]).to.be.closeTo(250, 10); // New Y position
      });
    });

    it('should handle rapid connector creation and deletion', () => {
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        
        // Rapidly create and delete edges
        for (let i = 0; i < 5; i++) {
          const edgeId = store.getState().addEdge({
            type: 'edge',
            source: { elementId: '', portKind: 'CENTER' },
            target: { elementId: '', portKind: 'CENTER' },
            points: [100 + i * 20, 100, 200 + i * 20, 200],
            x: 100 + i * 20,
            y: 100,
            width: 100,
            height: 100,
            routing: 'straight',
            stroke: '#374151',
            strokeWidth: 2,
            selectable: true,
            subType: i % 2 === 0 ? 'line' : 'arrow'
          });
          
          if (i % 2 === 0) {
            store.getState().removeEdge(edgeId);
          }
        }
        
        const edges = Array.from(store.getState().edges.values());
        expect(edges).to.have.length(2); // Only odd indices remain
      });
    });

    it('should maintain connector integrity when connected element is deleted', () => {
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        
        const rect = store.getState().addElement({
          type: 'rectangle',
          x: 200,
          y: 200,
          width: 100,
          height: 100,
          fill: '#e0e0e0'
        });
        
        const edgeId = store.getState().addEdge({
          type: 'edge',
          source: { elementId: rect, portKind: 'E' },
          target: { elementId: '', portKind: 'CENTER' },
          points: [300, 250, 400, 250],
          x: 300,
          y: 250,
          width: 100,
          height: 1,
          routing: 'straight',
          stroke: '#374151',
          strokeWidth: 2,
          selectable: true,
          subType: 'arrow'
        });
        
        // Delete the connected element
        store.getState().removeElement(rect);
        
        // Edge should still exist but with free-floating start
        const edges = Array.from(store.getState().edges.values());
        expect(edges).to.have.length(1);
        // The edge source still references the deleted element ID
        // In a real implementation, you might want to convert it to free-floating
      });
    });
  });

  describe('Performance Tests', () => {
    it('should handle many connectors efficiently', () => {
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        const startTime = Date.now();
        
        // Create 50 connectors
        for (let i = 0; i < 50; i++) {
          store.getState().addEdge({
            type: 'edge',
            source: { elementId: '', portKind: 'CENTER' },
            target: { elementId: '', portKind: 'CENTER' },
            points: [
              50 + (i % 10) * 40,
              50 + Math.floor(i / 10) * 40,
              100 + (i % 10) * 40,
              100 + Math.floor(i / 10) * 40
            ],
            x: 50 + (i % 10) * 40,
            y: 50 + Math.floor(i / 10) * 40,
            width: 50,
            height: 50,
            routing: 'straight',
            stroke: '#374151',
            strokeWidth: 1,
            selectable: true,
            subType: i % 2 === 0 ? 'line' : 'arrow'
          });
        }
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Should complete in reasonable time (< 1 second)
        expect(duration).to.be.lessThan(1000);
        
        const edges = Array.from(store.getState().edges.values());
        expect(edges).to.have.length(50);
      });
    });

    it('should handle connector selection efficiently with many edges', () => {
      cy.window().then((win) => {
        const store = (win as any).__UNIFIED_CANVAS_STORE__;
        
        // Create 30 edges
        const edgeIds: string[] = [];
        for (let i = 0; i < 30; i++) {
          const id = store.getState().addEdge({
            type: 'edge',
            source: { elementId: '', portKind: 'CENTER' },
            target: { elementId: '', portKind: 'CENTER' },
            points: [10 + i * 10, 10, 10 + i * 10, 100],
            x: 10 + i * 10,
            y: 10,
            width: 1,
            height: 90,
            routing: 'straight',
            stroke: '#374151',
            strokeWidth: 2,
            selectable: true,
            subType: 'line'
          });
          edgeIds.push(id);
        }
        
        const startTime = Date.now();
        
        // Select all edges
        store.getState().setSelectedTool('select');
        edgeIds.forEach((id, index) => {
          store.getState().selectElement(id, index > 0); // Multi-select after first
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Should complete quickly (< 500ms)
        expect(duration).to.be.lessThan(500);
        
        const selectedIds = store.getState().selectedElementIds;
        expect(selectedIds.size).to.equal(30);
      });
    });
  });
});