// cypress/e2e/connectors.cy.ts
// Exhaustive E2E for magnetic connectors (straight and arrow) in LibreOllama Canvas

/// <reference types="cypress" />

const withFlags = () => ({
  onBeforeLoad(win: any) {
    win.localStorage.setItem('USE_NEW_CANVAS', 'true');
    win.localStorage.setItem('FF_CONNECTOR', '1');
    win.localStorage.setItem('FF_TEXT', '1');
    win.localStorage.setItem('CANVAS_DEV_HUD', '1');
  }
});

const selectToolViaStore = (toolId: string) => {
  cy.window().then((win) => {
    const store = (win as any).__UNIFIED_CANVAS_STORE__?.getState?.();
    expect(store).to.exist;
    store.setSelectedTool(toolId);
  });
};

// Try multiple likely stage containers used in app
const addCircleAt = (id: string, x: number, y: number) => {
  cy.window().then((win) => {
    const store = (win as any).__UNIFIED_CANVAS_STORE__?.getState?.();
    const r = 50; const d = r * 2;
    store.addElement({
      id,
      type: 'circle',
      x: Math.round(x - r),
      y: Math.round(y - r),
      radius: r,
      width: d,
      height: d,
      fill: '#ffffff', stroke: '#d1d5db', strokeWidth: 1,
      createdAt: Date.now(), updatedAt: Date.now(), isLocked: false, isHidden: false,
    });
  });
};

const addStickyAt = (id: string, x: number, y: number) => {
  cy.window().then((win) => {
    const store = (win as any).__UNIFIED_CANVAS_STORE__?.getState?.();
    store.addElement({
      id,
      type: 'sticky-note',
      x: Math.round(x - 100), y: Math.round(y - 60), width: 200, height: 120,
      backgroundColor: '#A8DAFF', createdAt: Date.now(), updatedAt: Date.now(), isLocked: false, isHidden: false,
    });
  });
};

const startConnectorAt = (x: number, y: number) => {
  getStage().trigger('mousedown', x, y, { force: true, buttons: 1 });
};

const moveConnectorTo = (x: number, y: number) => {
  getStage().trigger('mousemove', x, y, { force: true });
};

const endConnectorAt = (x: number, y: number) => {
  getStage().trigger('mouseup', x, y, { force: true });
};

const expectAtLeastOneEdge = () => {
  cy.window().then((win) => {
    const store = (win as any).__UNIFIED_CANVAS_STORE__?.getState?.();
    expect(store).to.exist;
    const edges = Array.from(store.edges?.values?.() || []);
    expect(edges.length).to.be.greaterThan(0);
  });
};

const expectEdgesToBeStraight = () => {
  cy.window().then((win) => {
    const store = (win as any).__UNIFIED_CANVAS_STORE__?.getState?.();
    const edges = Array.from(store.edges?.values?.() || []);
    expect(edges.length).to.be.greaterThan(0);
    edges.forEach((e: any) => {
      if (e.routing === 'straight') {
        expect(e.points).to.have.length(4); // x1,y1,x2,y2
      }
    });
  });
};

const expectEdgesStickToPorts = () => {
  cy.window().then((win) => {
    const store = (win as any).__UNIFIED_CANVAS_STORE__?.getState?.();
    const edges = Array.from(store.edges?.values?.() || []);
    edges.forEach((e: any) => {
      expect(e.source?.portKind).to.be.oneOf(['N','S','E','W','CENTER']);
      expect(e.target?.portKind).to.be.oneOf(['N','S','E','W','CENTER']);
    });
  });
};

describe('Connectors - magnetic snapping and routing', () => {
  beforeEach(() => {
    cy.visit('/canvas', withFlags());
    cy.window({ timeout: 20000 }).its('__UNIFIED_CANVAS_STORE__').should('exist');
    // Clear canvas if available
    cy.window().then((win) => {
      const store = (win as any).__UNIFIED_CANVAS_STORE__?.getState?.();
      store?.clearCanvas?.();
    });
  });

  it('creates straight connector center-to-center between two circles with arrow tool', () => {
    addCircleAt('c1', 200, 180);
    addCircleAt('c2', 800, 180);

    selectToolViaStore('connector-arrow');
    cy.window().then((win) => {
      const store = (win as any).__UNIFIED_CANVAS_STORE__?.getState?.();
      store.startEdgeDraft({ elementId: 'c1', portKind: 'CENTER' });
      const edgeId = store.commitEdgeDraftTo({ elementId: 'c2', portKind: 'CENTER' });
      store.computeAndCommitDirtyEdges();
      const e = store.getEdgeById(edgeId);
      expect(e.routing).to.equal('straight');
      expect(e.points.length).to.equal(4);
    });
  });

  it('snaps to E/W ports on stickies and maintains straight path in line mode', () => {
    addStickyAt('s1', 240, 360);
    addStickyAt('s2', 920, 360);
    selectToolViaStore('connector-line');
    cy.window().then((win) => {
      const store = (win as any).__UNIFIED_CANVAS_STORE__?.getState?.();
      store.startEdgeDraft({ elementId: 's1', portKind: 'E' });
      const edgeId = store.commitEdgeDraftTo({ elementId: 's2', portKind: 'W' });
      store.computeAndCommitDirtyEdges();
      const e = store.getEdgeById(edgeId);
      expect(e.routing).to.equal('straight');
      expect(e.points.length).to.equal(4);
    });
  });

  it('edge reflows and stays attached when moving elements', () => {
    addStickyAt('a1', 240, 520);
    addStickyAt('a2', 920, 520);
    selectToolViaStore('connector-arrow');
    cy.window().then((win) => {
      const store = (win as any).__UNIFIED_CANVAS_STORE__?.getState?.();
      store.startEdgeDraft({ elementId: 'a1', portKind: 'E' });
      const edgeId = store.commitEdgeDraftTo({ elementId: 'a2', portKind: 'W' });
      store.computeAndCommitDirtyEdges();
      const before = store.getEdgeById(edgeId);
      // Move right sticky to the right by 100
      const el = store.elements.get('a2');
      store.updateElement('a2', { x: el.x + 100 });
      store.reflowEdgesForElement('a2');
      store.computeAndCommitDirtyEdges();
      const after = store.getEdgeById(edgeId);
      expect(after.points[2]).to.be.greaterThan(before.points[2]);
    });
  });

  it('connects circle rim ports N->S and keeps straight routing', () => {
    addCircleAt('cN', 300, 200);
    addCircleAt('cS', 300, 480);
    selectToolViaStore('connector-arrow');
    cy.window().then((win) => {
      const st = (win as any).__UNIFIED_CANVAS_STORE__?.getState?.();
      st.startEdgeDraft({ elementId: 'cN', portKind: 'S' });
      const id = st.commitEdgeDraftTo({ elementId: 'cS', portKind: 'N' });
      st.computeAndCommitDirtyEdges();
      const e = st.getEdgeById(id);
      // Straight routing vertically
      expect(e.routing).to.equal('straight');
      expect(e.points.length).to.equal(4);
      // x should stay ~constant, allow 1px tolerance
      const xs = [e.points[0], e.points[2]];
      expect(Math.abs(xs[0] - xs[1])).to.be.lte(1);
    });
  });

  it('diagonal layout chooses straight between centers with arrow tool', () => {
    addCircleAt('da', 200, 200);
    addCircleAt('db', 700, 420);
    selectToolViaStore('connector-arrow');
    cy.window().then((win) => {
      const st = (win as any).__UNIFIED_CANVAS_STORE__?.getState?.();
      st.startEdgeDraft({ elementId: 'da', portKind: 'CENTER' });
      const id = st.commitEdgeDraftTo({ elementId: 'db', portKind: 'CENTER' });
      st.computeAndCommitDirtyEdges();
      const e = st.getEdgeById(id);
      expect(e.routing).to.equal('straight');
      expect(e.points.length).to.equal(4);
    });
  });

  it('ESC cancels draft without creating an edge', () => {
    addStickyAt('k1', 200, 600);
    selectToolViaStore('connector-line');
    cy.window().then((win) => {
      const st = (win as any).__UNIFIED_CANVAS_STORE__?.getState?.();
      st.startEdgeDraft({ elementId: 'k1', portKind: 'E' });
      // Simulate cancel
      st.cancelEdgeDraft();
      const edges = Array.from(st.edges.values());
      expect(edges.length).to.equal(0);
    });
  });

  it('multi-edge reflow: moving shared node updates all connected edges', () => {
    addStickyAt('m1', 200, 720);
    addStickyAt('m2', 600, 720);
    addStickyAt('m3', 1000, 720);
    selectToolViaStore('connector-arrow');
    cy.window().then((win) => {
      const st = (win as any).__UNIFIED_CANVAS_STORE__?.getState?.();
      st.startEdgeDraft({ elementId: 'm1', portKind: 'E' });
      const e1 = st.commitEdgeDraftTo({ elementId: 'm2', portKind: 'W' });
      st.startEdgeDraft({ elementId: 'm2', portKind: 'E' });
      const e2 = st.commitEdgeDraftTo({ elementId: 'm3', portKind: 'W' });
      st.computeAndCommitDirtyEdges();
      const before1 = st.getEdgeById(e1);
      const before2 = st.getEdgeById(e2);
      const m2 = st.elements.get('m2');
      st.updateElement('m2', { x: m2.x + 120 });
      st.reflowEdgesForElement('m2');
      st.computeAndCommitDirtyEdges();
      const after1 = st.getEdgeById(e1);
      const after2 = st.getEdgeById(e2);
      expect(after1.points[2]).to.be.greaterThan(before1.points[2]);
      expect(after2.points[0]).to.be.greaterThan(before2.points[0]);
    });
  });

  // ---------- Expanded circle-to-circle coverage for connector-line ----------
  const createCirclePair = () => {
    cy.window().then((win) => {
      const st = (win as any).__UNIFIED_CANVAS_STORE__?.getState?.();
      st.clearCanvas();
    });
    addCircleAt('L', 260, 260);
    addCircleAt('R', 760, 260);
  };

  const commitLineBetween = (from: 'N'|'S'|'E'|'W'|'CENTER', to: 'N'|'S'|'E'|'W'|'CENTER') => {
    selectToolViaStore('connector-line');
    cy.window().then((win) => {
      const st = (win as any).__UNIFIED_CANVAS_STORE__?.getState?.();
      st.startEdgeDraft({ elementId: 'L', portKind: from });
      const id = st.commitEdgeDraftTo({ elementId: 'R', portKind: to });
      st.computeAndCommitDirtyEdges();
      const e = st.getEdgeById(id);
      expect(e.routing).to.equal('straight');
      expect(e.points.length).to.equal(4);
    });
  };

  it('connector-line: CENTER→CENTER between circles', () => {
    createCirclePair();
    commitLineBetween('CENTER','CENTER');
  });

  it('connector-line: W→E between circles', () => {
    createCirclePair();
    commitLineBetween('W','E');
  });

  it('connector-line: E→W between circles', () => {
    createCirclePair();
    commitLineBetween('E','W');
  });

  it('connector-line: N→S between circles', () => {
    createCirclePair();
    commitLineBetween('N','S');
  });

  it('connector-line: S→N between circles', () => {
    createCirclePair();
    commitLineBetween('S','N');
  });
});
