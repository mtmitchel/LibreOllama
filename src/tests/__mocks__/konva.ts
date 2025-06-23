/**
 * Konva.js Mock
 * 
 * This mock replaces the Konva library to prevent canvas.node loading
 */

// Mock Konva namespace
const Konva = {
  // Core classes
  Stage: class MockStage {
    constructor() {}
    add() { return this; }
    draw() {}
    destroy() {}
    getPointerPosition() { return { x: 0, y: 0 }; }
    setPointersPositions() {}
    batchDraw() {}
    toDataURL() { return 'data:image/png;base64,'; }
    getContainer() { return document.createElement('div'); }
    width() { return 800; }
    height() { return 600; }
    scale() { return { x: 1, y: 1 }; }
    position() { return { x: 0, y: 0 }; }
    setScale() { return this; }
    setPosition() { return this; }
    getScale() { return { x: 1, y: 1 }; }
    getAbsolutePosition() { return { x: 0, y: 0 }; }
    on() { return this; }
    off() { return this; }
    fire() { return this; }
    findOne() { return null; }
    find() { return []; }
    getChildren() { return []; }
  },
  
  Layer: class MockLayer {
    constructor() {}
    add() { return this; }
    draw() {}
    destroy() {}
    batchDraw() {}
    getChildren() { return []; }
    findOne() { return null; }
    find() { return []; }
    on() { return this; }
    off() { return this; }
    moveToTop() { return this; }
    moveToBottom() { return this; }
  },
  
  Group: class MockGroup {
    constructor() {}
    add() { return this; }
    destroy() {}
    getChildren() { return []; }
    findOne() { return null; }
    find() { return []; }
    on() { return this; }
    off() { return this; }
    x() { return 0; }
    y() { return 0; }
    setX() { return this; }
    setY() { return this; }
    position() { return { x: 0, y: 0 }; }
    setPosition() { return this; }
    draggable() { return false; }
    setDraggable() { return this; }
  },
  
  Rect: class MockRect {
    constructor() {}
    destroy() {}
    on() { return this; }
    off() { return this; }
    width() { return 100; }
    height() { return 100; }
    fill() { return '#000000'; }
    stroke() { return '#000000'; }
    setFill() { return this; }
    setStroke() { return this; }
    position() { return { x: 0, y: 0 }; }
    setPosition() { return this; }
    x() { return 0; }
    y() { return 0; }
    setX() { return this; }
    setY() { return this; }
  },
  
  Circle: class MockCircle {
    constructor() {}
    destroy() {}
    on() { return this; }
    off() { return this; }
    radius() { return 50; }
    fill() { return '#000000'; }
    stroke() { return '#000000'; }
    setFill() { return this; }
    setStroke() { return this; }
    position() { return { x: 0, y: 0 }; }
    setPosition() { return this; }
  },
  
  Text: class MockText {
    constructor() {}
    destroy() {}
    on() { return this; }
    off() { return this; }
    text() { return ''; }
    setText() { return this; }
    fontSize() { return 12; }
    setFontSize() { return this; }
    fill() { return '#000000'; }
    setFill() { return this; }
    position() { return { x: 0, y: 0 }; }
    setPosition() { return this; }
    width() { return 100; }
    height() { return 20; }
  },
  
  Line: class MockLine {
    constructor() {}
    destroy() {}
    on() { return this; }
    off() { return this; }
    points() { return []; }
    setPoints() { return this; }
    stroke() { return '#000000'; }
    setStroke() { return this; }
    strokeWidth() { return 1; }
    setStrokeWidth() { return this; }
  },
    Transformer: class MockTransformer {
    constructor() {}
    nodes(nodeArray?: any[]) { 
      if (nodeArray !== undefined) {
        return this; // Setter behavior
      }
      return []; // Getter behavior
    }
    attachTo() { return this; }
    detach() { return this; }
    forceUpdate() {}
    destroy() {}
    on() { return this; }
    off() { return this; }
    getNode() { return null; }
    enabledAnchors() { return []; }
    setEnabledAnchors() { return this; }
    boundBoxFunc() { return null; }
    setBoundBoxFunc() { return this; }
  },
  
  // Utility methods
  Util: {
    getRandomColor: () => '#000000',
    getRGB: () => ({ r: 0, g: 0, b: 0 }),
    colorToRgba: () => ({ r: 0, g: 0, b: 0, a: 1 }),
  },
  
  // Animation
  Animation: class MockAnimation {
    constructor() {}
    start() { return this; }
    stop() { return this; }
    isRunning() { return false; }
  },
  
  Tween: class MockTween {
    constructor() {}
    play() { return this; }
    pause() { return this; }
    reverse() { return this; }
    destroy() {}
  },
  
  // Events
  Node: {
    create: () => ({}),
  },
};

export default Konva;
