TITLE: Initializing Stage, Layer, and Shape in Konva.js
DESCRIPTION: This snippet demonstrates the minimal setup for a Konva.js application. It creates a stage within a specified container, adds a layer to the stage, creates a simple circle shape with styling properties, adds the shape to the layer, and finally adds the layer to the stage to render the content.
SOURCE: https://github.com/konvajs/site/blob/new/content/docs/overview.md#_snippet_0

LANGUAGE: javascript
CODE:
```
// first we need to create a stage
var stage = new Konva.Stage({
  container: 'container', // id of container <div>
  width: 500,
  height: 500,
});

// then create layer
var layer = new Konva.Layer();

// create our shape
var circle = new Konva.Circle({
  x: stage.width() / 2,
  y: stage.height() / 2,
  radius: 70,
  fill: 'red',
  stroke: 'black',
  strokeWidth: 4,
});

// add the shape to the layer
layer.add(circle);

// add the layer to the stage
stage.add(layer);
```

----------------------------------------

TITLE: Initializing Konva Stage and Shape with Performance Optimizations (Vanilla JS)
DESCRIPTION: This snippet sets up a Konva.js stage with layers configured for performance (disabling listening for background, using separate layers for main content and dragging). It creates a draggable Star shape, disables `perfectDrawEnabled` for optimization, and caches the shape. It also implements drag optimizations by moving the shape to a dedicated drag layer during `dragstart` and back to the main layer on `dragend` to prevent rendering issues during dragging.
SOURCE: https://github.com/konvajs/site/blob/new/content/docs/performance/All_Performance_Tips.mdx#_snippet_0

LANGUAGE: javascript
CODE:
```
import Konva from 'konva';

// Create stage with good performance settings
const stage = new Konva.Stage({
  container: 'container',
  width: window.innerWidth,
  height: window.innerHeight,
});

// Create layers with performance optimizations
const backgroundLayer = new Konva.Layer({ listening: false });
const mainLayer = new Konva.Layer();
const dragLayer = new Konva.Layer();

stage.add(backgroundLayer);
stage.add(mainLayer);
stage.add(dragLayer);

// Create a shape with caching
const star = new Konva.Star({
  x: 200,
  y: 200,
  numPoints: 6,
  innerRadius: 40,
  outerRadius: 70,
  fill: 'yellow',
  stroke: 'black',
  strokeWidth: 4,
  draggable: true,
  perfectDrawEnabled: false, // performance optimization
});

// Cache the shape for better performance
star.cache();

// Optimize dragging performance
star.on('dragstart', () => {
  star.moveTo(dragLayer);
});

star.on('dragend', () => {
  star.moveTo(mainLayer);
});

// Create background with listening disabled
const rect = new Konva.Rect({
  x: 0,
  y: 0,
  width: stage.width(),
  height: stage.height(),
  fill: 'lightgray',
  listening: false,
});

backgroundLayer.add(rect);
mainLayer.add(star);
```

----------------------------------------

TITLE: Implementing react-konva Drag and Drop with Layers - React
DESCRIPTION: This React snippet utilizes `react-konva` components (`Stage`, `Layer`, `Circle`) to render and manage 10,000 draggable circles. It uses `useRef` to access Konva node instances for the layers and implements `onDragStart` and `onDragEnd` props to move the dragged circle between the main and drag layers, optimizing drag performance by minimizing redraws.
SOURCE: https://github.com/konvajs/site/blob/new/content/docs/sandbox/Drag_and_Drop_Stress_Test.mdx#_snippet_1

LANGUAGE: javascript
CODE:
```
import { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Circle } from 'react-konva';

const COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'cyan', 'purple'];
const SHAPE_COUNT = 10000;

const App = () => {
  // State to hold all the circles data
  const [circles, setCircles] = useState([]);
  
  // Refs to layers
  const mainLayerRef = useRef(null);
  const dragLayerRef = useRef(null);
  
  // Initialize circles data
  useEffect(() => {
    const circlesData = [];
    
    // Create 10,000 circles
    for (let i = 0; i < SHAPE_COUNT; i++) {
      circlesData.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: 6,
        fill: COLORS[i % COLORS.length]
      });
    }
    
    setCircles(circlesData);
  }, []);
  
  // This is not the typical "React way" of managing components.
  // In a more React-friendly approach, we would update state and let React handle the DOM.
  // However, for this performance demo, we're directly manipulating the nodes
  // to match the vanilla JS implementation.
  const handleDragStart = (e) => {
    const target = e.target;
    
    // Move the circle to the drag layer
    target.moveTo(dragLayerRef.current);
  };
  
  const handleDragEnd = (e) => {
    const target = e.target;
    
    // Move the circle back to the main layer
    target.moveTo(mainLayerRef.current);
  };
  
  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      {/* Main layer for all circles */}
      <Layer ref={mainLayerRef}>
        {circles.map(circle => (
          <Circle
            key={circle.id}
            id={circle.id}
            x={circle.x}
            y={circle.y}
            radius={circle.radius}
            fill={circle.fill}
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        ))}
      </Layer>
      
      {/* Empty drag layer that will receive circles during drag */}
      <Layer ref={dragLayerRef} />
    </Stage>
  );
};

export default App;
```

----------------------------------------

TITLE: Implementing Object Snapping Logic with Konva.js JavaScript
DESCRIPTION: This JavaScript code initializes a Konva.js stage and layer, creates multiple draggable rectangles, and implements the core snapping logic. It includes functions to identify potential snap points (stage edges, other shape edges/centers), determine snap points on the dragged object, calculate the closest valid snap guide, draw visual guide lines, and adjust the dragged object's position during the 'dragmove' event for snapping. It requires the Konva.js library.
SOURCE: https://github.com/konvajs/site/blob/new/content/docs/sandbox/Objects_Snapping.mdx#_snippet_0

LANGUAGE: javascript
CODE:
```
import Konva from 'konva';

var width = window.innerWidth;
var height = window.innerHeight;
var GUIDELINE_OFFSET = 5;

var stage = new Konva.Stage({
  container: 'container',
  width: width,
  height: height,
});

var layer = new Konva.Layer();
stage.add(layer);

// first generate random rectangles
for (var i = 0; i < 5; i++) {
  layer.add(
    new Konva.Rect({
      x: Math.random() * stage.width(),
      y: Math.random() * stage.height(),
      width: 50 + Math.random() * 50,
      height: 50 + Math.random() * 50,
      fill: Konva.Util.getRandomColor(),
      rotation: Math.random() * 360,
      draggable: true,
      name: 'object',
    })
  );
}

// were can we snap our objects?
function getLineGuideStops(skipShape) {
  // we can snap to stage borders and the center of the stage
  var vertical = [0, stage.width() / 2, stage.width()];
  var horizontal = [0, stage.height() / 2, stage.height()];

  // and we snap over edges and center of each object on the canvas
  stage.find('.object').forEach((guideItem) => {
    if (guideItem === skipShape) {
      return;
    }
    var box = guideItem.getClientRect();
    // and we can snap to all edges of shapes
    vertical.push([box.x, box.x + box.width, box.x + box.width / 2]);
    horizontal.push([box.y, box.y + box.height, box.y + box.height / 2]);
  });
  return {
    vertical: vertical.flat(),
    horizontal: horizontal.flat(),
  };
}

// what points of the object will trigger to snapping?
// it can be just center of the object
// but we will enable all edges and center
function getObjectSnappingEdges(node) {
  var box = node.getClientRect();
  var absPos = node.absolutePosition();

  return {
    vertical: [
      {
        guide: Math.round(box.x),
        offset: Math.round(absPos.x - box.x),
        snap: 'start',
      },
      {
        guide: Math.round(box.x + box.width / 2),
        offset: Math.round(absPos.x - box.x - box.width / 2),
        snap: 'center',
      },
      {
        guide: Math.round(box.x + box.width),
        offset: Math.round(absPos.x - box.x - box.width),
        snap: 'end',
      },
    ],
    horizontal: [
      {
        guide: Math.round(box.y),
        offset: Math.round(absPos.y - box.y),
        snap: 'start',
      },
      {
        guide: Math.round(box.y + box.height / 2),
        offset: Math.round(absPos.y - box.y - box.height / 2),
        snap: 'center',
      },
      {
        guide: Math.round(box.y + box.height),
        offset: Math.round(absPos.y - box.y - box.height),
        snap: 'end',
      },
    ],
  };
}

// find all snapping possibilities
function getGuides(lineGuideStops, itemBounds) {
  var resultV = [];
  var resultH = [];

  lineGuideStops.vertical.forEach((lineGuide) => {
    itemBounds.vertical.forEach((itemBound) => {
      var diff = Math.abs(lineGuide - itemBound.guide);
      // if the distance between guild line and object snap point is close we can consider this for snapping
      if (diff < GUIDELINE_OFFSET) {
        resultV.push({
          lineGuide: lineGuide,
          diff: diff,
          snap: itemBound.snap,
          offset: itemBound.offset,
        });
      }
    });
  });

  lineGuideStops.horizontal.forEach((lineGuide) => {
    itemBounds.horizontal.forEach((itemBound) => {
      var diff = Math.abs(lineGuide - itemBound.guide);
      if (diff < GUIDELINE_OFFSET) {
        resultH.push({
          lineGuide: lineGuide,
          diff: diff,
          snap: itemBound.snap,
          offset: itemBound.offset,
        });
      }
    });
  });

  var guides = [];

  // find closest snap
  var minV = resultV.sort((a, b) => a.diff - b.diff)[0];
  var minH = resultH.sort((a, b) => a.diff - b.diff)[0];
  if (minV) {
    guides.push({
      lineGuide: minV.lineGuide,
      offset: minV.offset,
      orientation: 'V',
      snap: minV.snap,
    });
  }
  if (minH) {
    guides.push({
      lineGuide: minH.lineGuide,
      offset: minH.offset,
      orientation: 'H',
      snap: minH.snap,
    });
  }
  return guides;
}

function drawGuides(guides) {
  guides.forEach((lg) => {
    if (lg.orientation === 'H') {
      var line = new Konva.Line({
        points: [-6000, 0, 6000, 0],
        stroke: 'rgb(0, 161, 255)',
        strokeWidth: 1,
        name: 'guid-line',
        dash: [4, 6],
      });
      layer.add(line);
      line.absolutePosition({
        x: 0,
        y: lg.lineGuide,
      });
    } else if (lg.orientation === 'V') {
      var line = new Konva.Line({
        points: [0, -6000, 0, 6000],
        stroke: 'rgb(0, 161, 255)',
        strokeWidth: 1,
        name: 'guid-line',
        dash: [4, 6],
      });
      layer.add(line);
      line.absolutePosition({
        x: lg.lineGuide,
        y: 0,
      });
    }
  });
}

layer.on('dragmove', function (e) {
  // clear all previous lines on the screen
  layer.find('.guid-line').forEach((l) => l.destroy());

  // find possible snapping lines
  var lineGuideStops = getLineGuideStops(e.target);
  // find snapping points of current object
  var itemBounds = getObjectSnappingEdges(e.target);

  // now find where can we snap current object
  var guides = getGuides(lineGuideStops, itemBounds);

  // do nothing of no snapping
  if (!guides.length) {
    return;
  }

  drawGuides(guides);

  var absPos = e.target.absolutePosition();
  // now force object position
  guides.forEach((lg) => {
    switch (lg.orientation) {
      case 'V': {
        absPos.x = lg.lineGuide + lg.offset;
        break;
      }
      case 'H': {
        absPos.y = lg.lineGuide + lg.offset;
        break;
      }
    }
  });
  e.target.absolutePosition(absPos);
});

layer.on('dragend', function (e) {
  // clear all previous lines on the screen
  layer.find('.guid-line').forEach((l) => l.destroy());
});
```

----------------------------------------

TITLE: Creating Shapes with Various Fills and Mouse Events Konva.js Vanilla JS
DESCRIPTION: This snippet demonstrates how to initialize a Konva stage and layer, create multiple RegularPolygon shapes, each configured with a different fill type (solid color, image pattern, linear gradient, radial gradient). It also includes JavaScript functions to load images asynchronously and attach mouseover/mouseout event listeners to dynamically change the fill properties of the shapes.
SOURCE: https://github.com/konvajs/site/blob/new/content/docs/styling/01-Fill.mdx#_snippet_0

LANGUAGE: javascript
CODE:
```
import Konva from 'konva';

function loadImages(sources, callback) {
  var images = {};
  var loadedImages = 0;
  var numImages = 0;
  // get num of sources
  for (var src in sources) {
    numImages++;
  }
  for (var src in sources) {
    images[src] = new Image();
    images[src].onload = function () {
      if (++loadedImages >= numImages) {
        callback(images);
      }
    };
    images[src].src = sources[src];
  }
}
function draw(images) {
  var width = window.innerWidth;
  var height = window.innerHeight;

  var stage = new Konva.Stage({
    container: 'container',
    width: width,
    height: height,
  });
  var layer = new Konva.Layer();

  var colorPentagon = new Konva.RegularPolygon({
    x: 80,
    y: stage.height() / 2,
    sides: 5,
    radius: 70,
    fill: 'red',
    stroke: 'black',
    strokeWidth: 4,
    draggable: true,
  });

  var patternPentagon = new Konva.RegularPolygon({
    x: 220,
    y: stage.height() / 2,
    sides: 5,
    radius: 70,
    fillPatternImage: images.darthVader,
    fillPatternOffset: { x: -220, y: 70 },
    stroke: 'black',
    strokeWidth: 4,
    draggable: true,
  });

  var linearGradPentagon = new Konva.RegularPolygon({
    x: 360,
    y: stage.height() / 2,
    sides: 5,
    radius: 70,
    fillLinearGradientStartPoint: { x: -50, y: -50 },
    fillLinearGradientEndPoint: { x: 50, y: 50 },
    fillLinearGradientColorStops: [0, 'red', 1, 'yellow'],
    stroke: 'black',
    strokeWidth: 4,
    draggable: true,
  });

  var radialGradPentagon = new Konva.RegularPolygon({
    x: 500,
    y: stage.height() / 2,
    sides: 5,
    radius: 70,
    fillRadialGradientStartPoint: { x: 0, y: 0 },
    fillRadialGradientStartRadius: 0,
    fillRadialGradientEndPoint: { x: 0, y: 0 },
    fillRadialGradientEndRadius: 70,
    fillRadialGradientColorStops: [0, 'red', 0.5, 'yellow', 1, 'blue'],
    stroke: 'black',
    strokeWidth: 4,
    draggable: true,
  });

  /*
    * bind listeners
    */
  colorPentagon.on('mouseover touchstart', function () {
    this.fill('blue');
  });

  colorPentagon.on('mouseout touchend', function () {
    this.fill('red');
  });

  patternPentagon.on('mouseover touchstart', function () {
    this.fillPatternImage(images.yoda);
    this.fillPatternOffset({ x: -100, y: 70 });
  });

  patternPentagon.on('mouseout touchend', function () {
    this.fillPatternImage(images.darthVader);
    this.fillPatternOffset({ x: -220, y: 70 });
  });

  linearGradPentagon.on('mouseover touchstart', function () {
    this.fillLinearGradientStartPoint({ x: -50 });
    this.fillLinearGradientEndPoint({ x: 50 });
    this.fillLinearGradientColorStops([0, 'green', 1, 'yellow']);
  });

  linearGradPentagon.on('mouseout touchend', function () {
    // set multiple properties at once with setAttrs
    this.setAttrs({
      fillLinearGradientStartPoint: { x: -50, y: -50 },
      fillLinearGradientEndPoint: { x: 50, y: 50 },
      fillLinearGradientColorStops: [0, 'red', 1, 'yellow'],
    });
  });

  radialGradPentagon.on('mouseover touchstart', function () {
    this.fillRadialGradientColorStops([
      0,
      'red',
      0.5,
      'yellow',
      1,
      'green',
    ]);
  });

  radialGradPentagon.on('mouseout touchend', function () {
    // set multiple properties at once with setAttrs
    this.setAttrs({
      fillRadialGradientStartPoint: 0,
      fillRadialGradientStartRadius: 0,
      fillRadialGradientEndPoint: 0,
      fillRadialGradientEndRadius: 70,
      fillRadialGradientColorStops: [0, 'red', 0.5, 'yellow', 1, 'blue'],
    });
  });

  layer.add(colorPentagon);
  layer.add(patternPentagon);
  layer.add(linearGradPentagon);
  layer.add(radialGradPentagon);
  stage.add(layer);
}
var sources = {
  darthVader: 'https://konvajs.org/assets/darth-vader.jpg',
  yoda: 'https://konvajs.org/assets/yoda.jpg',
};

loadImages(sources, function (images) {
  draw(images);
});
```

----------------------------------------

TITLE: Implementing Double-Click Text Editing in Konva.js
DESCRIPTION: This `handleTextDblClick` function dynamically creates and positions an HTML textarea element over the Konva text node, allowing users to directly edit the text. It meticulously styles the textarea to match the Konva text's appearance and includes event listeners for saving changes on 'Enter' or outside clicks, and discarding on 'Escape'.
SOURCE: https://github.com/konvajs/site/blob/new/content/docs/sandbox/Editable_Text.mdx#_snippet_7

LANGUAGE: javascript
CODE:
```
const handleTextDblClick = () => {
  const textNodeKonva = textNode.value.getNode();
  const stage = textNodeKonva.getStage();
  const textPosition = textNodeKonva.absolutePosition();
  const stageBox = stage.container().getBoundingClientRect();

  const areaPosition = {
    x: stageBox.left + textPosition.x,
    y: stageBox.top + textPosition.y,
  };

  const textarea = document.createElement('textarea');
  document.body.appendChild(textarea);

  textarea.value = textNodeKonva.text();
  textarea.style.position = 'absolute';
  textarea.style.top = areaPosition.y + 'px';
  textarea.style.left = areaPosition.x + 'px';
  textarea.style.width = textNodeKonva.width() - textNodeKonva.padding() * 2 + 'px';
  textarea.style.height = textNodeKonva.height() - textNodeKonva.padding() * 2 + 5 + 'px';
  textarea.style.fontSize = textNodeKonva.fontSize() + 'px';
  textarea.style.border = 'none';
  textarea.style.padding = '0px';
  textarea.style.margin = '0px';
  textarea.style.overflow = 'hidden';
  textarea.style.background = 'none';
  textarea.style.outline = 'none';
  textarea.style.resize = 'none';
  textarea.style.lineHeight = textNodeKonva.lineHeight();
  textarea.style.fontFamily = textNodeKonva.fontFamily();
  textarea.style.transformOrigin = 'left top';
  textarea.style.textAlign = textNodeKonva.align();
  textarea.style.color = textNodeKonva.fill();

  const rotation = textNodeKonva.rotation();
  let transform = '';
  if (rotation) {
    transform += 'rotateZ(' + rotation + 'deg)';
  }
  textarea.style.transform = transform;

  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 3 + 'px';

  isEditing.value = true;
  textarea.focus();

  function removeTextarea() {
    textarea.parentNode.removeChild(textarea);
    window.removeEventListener('click', handleOutsideClick);
    isEditing.value = false;
  }

  function setTextareaWidth(newWidth) {
    if (!newWidth) {
      newWidth = textNodeKonva.placeholder?.length * textNodeKonva.fontSize();
    }
    textarea.style.width = newWidth + 'px';
  }

  textarea.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      text.value = textarea.value;
      removeTextarea();
    }
    if (e.key === 'Escape') {
      removeTextarea();
    }
  });

  textarea.addEventListener('keydown', function () {
    const scale = textNodeKonva.getAbsoluteScale().x;
    setTextareaWidth(textNodeKonva.width() * scale);
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + textNodeKonva.fontSize() + 'px';
  });

  function handleOutsideClick(e) {
    if (e.target !== textarea) {
      text.value = textarea.value;
      removeTextarea();
    }
  }
  setTimeout(() => {
    window.addEventListener('click', handleOutsideClick);
    window.addEventListener('touchstart', handleOutsideClick);
  });
};
```

----------------------------------------

TITLE: Binding Events to Konva.js Nodes
DESCRIPTION: Attaches event listeners to a Konva node for various events like mouse, touch, and custom change events. Supports binding multiple events, using namespaces, accessing event details like target, type, native event, and delegation.
SOURCE: https://github.com/konvajs/site/blob/new/content/api/Konva.RegularPolygon.mdx#_snippet_96

LANGUAGE: javascript
CODE:
```
// add click listener
node.on('click', function() {
  console.log('you clicked me!');
});
```

LANGUAGE: javascript
CODE:
```
// get the target node
node.on('click', function(evt) {
  console.log(evt.target);
});
```

LANGUAGE: javascript
CODE:
```
// stop event propagation
node.on('click', function(evt) {
  evt.cancelBubble = true;
});
```

LANGUAGE: javascript
CODE:
```
// bind multiple listeners
node.on('click touchstart', function() {
  console.log('you clicked/touched me!');
});
```

LANGUAGE: javascript
CODE:
```
// namespace listener
node.on('click.foo', function() {
  console.log('you clicked/touched me!');
});
```

LANGUAGE: javascript
CODE:
```
// get the event type
node.on('click tap', function(evt) {
  var eventType = evt.type;
});
```

LANGUAGE: javascript
CODE:
```
// get native event object
node.on('click tap', function(evt) {
  var nativeEvent = evt.evt;
});
```

LANGUAGE: javascript
CODE:
```
// for change events, get the old and new val
node.on('xChange', function(evt) {
  var oldVal = evt.oldVal;
  var newVal = evt.newVal;
});
```

LANGUAGE: javascript
CODE:
```
// get event targets
// with event delegations
layer.on('click', 'Group', function(evt) {
  var shape = evt.target;
  var group = evt.currentTarget;
});
```

----------------------------------------

TITLE: Dragging & Removing Shapes with React Konva
DESCRIPTION: This React component uses `react-konva` to render a stage and layer containing multiple draggable rectangles. It manages the state of the boxes using `useState` and handles drag and double-click/tap events by updating the component's state, which triggers re-renders to simulate moving shapes to the top and removing them.
SOURCE: https://github.com/konvajs/site/blob/new/content/docs/sandbox/Drag_and_Drop_Multiple_Shapes.mdx#_snippet_1

LANGUAGE: javascript
CODE:
```
import { useState } from 'react';
import { Stage, Layer, Rect } from 'react-konva';

const App = () => {
  const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
  
  // Initialize boxes with proper IDs and positions
  const initialBoxes = colors.map((color, i) => ({
    id: i.toString(),
    x: i * 30 + 50,
    y: i * 18 + 40,
    width: 100,
    height: 50,
    fill: color,
    stroke: 'black',
    strokeWidth: 4
  }));
  
  const [boxes, setBoxes] = useState(initialBoxes);
  
  const handleDragStart = (e) => {
    // Move the dragged box to the end of the array to simulate moveToTop
    const id = e.target.id();
    const box = boxes.find(b => b.id === id);
    const filteredBoxes = boxes.filter(b => b.id !== id);
    setBoxes([...filteredBoxes, box]);
  };
  
  const handleDragMove = (e) => {
    // Update the position of the box
    const id = e.target.id();
    const newBoxes = boxes.map(box => {
      if (box.id === id) {
        return {
          ...box,
          x: e.target.x(),
          y: e.target.y()
        };
      }
      return box;
    });
    setBoxes(newBoxes);
  };
  
  const handleDoubleClick = (id) => {
    // Remove the box on double click
    setBoxes(boxes.filter(box => box.id !== id));
  };

  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        {boxes.map((box) => (
          <Rect
            key={box.id}
            id={box.id}
            x={box.x}
            y={box.y}
            width={box.width}
            height={box.height}
            fill={box.fill}
            stroke={box.stroke}
            strokeWidth={box.strokeWidth}
            draggable
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDblClick={() => handleDoubleClick(box.id)}
            onDblTap={() => handleDoubleClick(box.id)}
            onMouseOver={(e) => {
              document.body.style.cursor = 'pointer';
            }}
            onMouseOut={(e) => {
              document.body.style.cursor = 'default';
            }}
          />
        ))}
      </Layer>
    </Stage>
  );
};

export default App;
```

----------------------------------------

TITLE: Drawing Multiple Konva Shapes with Vue
DESCRIPTION: This snippet demonstrates how to use `vue-konva` components to draw various shapes on a canvas. It initializes a stage and layer, then adds a text element, a rectangle, a circle, and a complex line with gradient fill, configuring their properties using the `:config` prop.
SOURCE: https://github.com/konvajs/site/blob/new/content/docs/vue/Shapes.mdx#_snippet_0

LANGUAGE: Vue
CODE:
```
<template>
  <v-stage :config="stageSize">
    <v-layer>
      <v-text :config="{
        text: 'Some text on canvas',
        fontSize: 15
      }"/>
      <v-rect :config="{
        x: 20,
        y: 50,
        width: 100,
        height: 100,
        fill: 'red',
        shadowBlur: 10
      }"/>
      <v-circle :config="{
        x: 200,
        y: 100,
        radius: 50,
        fill: 'green'
      }"/>
      <v-line :config="{
        x: 20,
        y: 200,
        points: [0, 0, 100, 0, 100, 100],
        tension: 0.5,
        closed: true,
        stroke: 'black',
        fillLinearGradientStartPoint: { x: -50, y: -50 },
        fillLinearGradientEndPoint: { x: 50, y: 50 },
        fillLinearGradientColorStops: [0, 'red', 1, 'yellow']
      }"/>
    </v-layer>
  </v-stage>
</template>

<script setup>
const stageSize = {
  width: window.innerWidth,
  height: window.innerHeight
};
</script>
```

----------------------------------------

TITLE: Handling Konva Drag Events in Vanilla JS
DESCRIPTION: This snippet demonstrates how to create a draggable Text node in Vanilla JavaScript using Konva and bind 'dragstart', 'dragmove', and 'dragend' events to it using the node's on() method. It updates a separate status Text node to show the current drag state. Requires the Konva library and an HTML element with id='container'.
SOURCE: https://github.com/konvajs/site/blob/new/content/docs/drag_and_drop/06_Drag_Events.mdx#_snippet_0

LANGUAGE: javascript
CODE:
```
import Konva from 'konva';

const stage = new Konva.Stage({
  container: 'container',
  width: window.innerWidth,
  height: window.innerHeight,
});

const layer = new Konva.Layer();
stage.add(layer);

const text = new Konva.Text({
  x: 40,
  y: 40,
  text: 'Draggable Text',
  fontSize: 20,
  draggable: true,
  width: 200,
});
layer.add(text);

const status = new Konva.Text({
  x: 40,
  y: 100,
  text: '',
  fontSize: 16,
  width: 200,
});
layer.add(status);

text.on('dragstart', () => {
  status.text('drag started');
});

text.on('dragend', () => {
  status.text('drag ended');
});

text.on('dragmove', () => {
  status.text('dragging');
});
```

----------------------------------------

TITLE: Rendering Image on React Konva Stage using useImage Hook - JavaScript
DESCRIPTION: This React functional component snippet demonstrates how to load an image from a URL asynchronously using the 'use-image' hook and render it onto a react-konva canvas using the 'Image' component. The 'URLImage' component takes an image 'src' and other props, while the 'App' component sets up the 'Stage' and 'Layer' to display the image.
SOURCE: https://github.com/konvajs/site/blob/new/content/docs/react/Images.mdx#_snippet_0

LANGUAGE: JavaScript
CODE:
```
import React from 'react';
import { Stage, Layer, Image } from 'react-konva';
import useImage from 'use-image';

const URLImage = ({ src, ...rest }) => {
  const [image] = useImage(src, 'anonymous');
  return <Image image={image} {...rest} />;
};

const App = () => {
  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        <URLImage src="https://konvajs.org/assets/yoda.jpg" x={150} />
      </Layer>
    </Stage>
  );
};

export default App;
```

----------------------------------------

TITLE: Implementing Optimized Animation with react-konva in React
DESCRIPTION: This React functional component utilizes `react-konva` to demonstrate optimized Konva animation. It uses `useState`, `useEffect`, and `useRef` hooks to manage component state, access Konva node instances, apply shape caching (`starRef.current.cache()`) within `useEffect`, create and control a `Konva.Animation` instance, and handle animation playback via a button click. Dependencies include `react` and `react-konva`.
SOURCE: https://github.com/konvajs/site/blob/new/content/docs/performance/Optimize_Animation.mdx#_snippet_1

LANGUAGE: jsx
CODE:
```
import { Stage, Layer, Star, Circle } from 'react-konva';
import { useState, useEffect, useRef } from 'react';

const App = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const starRef = useRef(null);
  const circleRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    // Cache the star shape for better performance
    if (starRef.current) {
      starRef.current.cache();
    }

    // Create animation
    const anim = new Konva.Animation((frame) => {
      // Rotate star (cached shape)
      starRef.current.rotation(frame.time * 0.1);
      
      // Move circle in a circle pattern
      circleRef.current.x(100 + Math.cos(frame.time * 0.002) * 50);
      circleRef.current.y(100 + Math.sin(frame.time * 0.002) * 50);
    }, starRef.current.getLayer());

    animRef.current = anim;
    anim.start();

    return () => anim.stop();
  }, []);

  const toggleAnimation = () => {
    if (isPlaying) {
      animRef.current.stop();
    } else {
      animRef.current.start();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div>
      <button
        onClick={toggleAnimation}
        style={{ position: 'absolute', top: '10px', left: '10px' }}
      >
        {isPlaying ? 'Stop Animation' : 'Start Animation'}
      </button>
      
      <Stage width={window.innerWidth} height={window.innerHeight}>
        <Layer>
          <Star
            ref={starRef}
            x={window.innerWidth / 2}
            y={window.innerHeight / 2}
            numPoints={6}
            innerRadius={40}
            outerRadius={70}
            fill="yellow"
            stroke="black"
            strokeWidth={4}
          />
          <Circle
            ref={circleRef}
            x={100}
            y={100}
            radius={20}
            fill="red"
          />
        </Layer>
      </Stage>
    </div>
  );
};

export default App;
```

----------------------------------------

TITLE: Implementing vue-konva Drag and Drop with Layers - Vue
DESCRIPTION: This Vue snippet uses `vue-konva` components (`<v-stage>`, `<v-layer>`, `<v-circle>`) to render and handle drag-and-drop for 10,000 circles. It uses Vue `ref` to access Konva node instances for the layers and `@dragstart`/`@dragend` events to move the dragged circle between the main and drag layers using `.getNode()`, mirroring the layer manipulation technique from the other examples for performance.
SOURCE: https://github.com/konvajs/site/blob/new/content/docs/sandbox/Drag_and_Drop_Stress_Test.mdx#_snippet_2

LANGUAGE: javascript
CODE:
```
<template>
  <v-stage :config="stageConfig">
    <!-- Main layer for all circles -->
    <v-layer ref="mainLayer">
      <v-circle
        v-for="circle in circles"
        :key="circle.id"
        :config="{
          id: circle.id,
          x: circle.x,
          y: circle.y,
          radius: 6,
          fill: circle.fill,
          draggable: true
        }"
        @dragstart="handleDragStart"
        @dragend="handleDragEnd"
      />
    </v-layer>
    
    <!-- Empty drag layer that will receive circles during drag -->
    <v-layer ref="dragLayer" />
  </v-stage>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'cyan', 'purple'];
const SHAPE_COUNT = 10000;

const stageConfig = {
  width: window.innerWidth,
  height: window.innerHeight
};

// Refs for layers
const mainLayer = ref(null);
const dragLayer = ref(null);

// State for circles
const circles = ref([]);

// Initialize circles data
onMounted(() => {
  const circlesData = [];
  
  // Create 10,000 circles
  for (let i = 0; i < SHAPE_COUNT; i++) {
    circlesData.push({
      id: i,
      x: Math.random() * stageConfig.width,
      y: Math.random() * stageConfig.height,
      radius: 6,
      fill: COLORS[i % COLORS.length]
    });
  }
  
  circles.value = circlesData;
});

// This is not the typical "Vue way" of managing components.
// In a more Vue-friendly approach, we would update state and let Vue handle the DOM.
// However, for this performance demo, we're directly manipulating the nodes
// to match the vanilla JS implementation.
const handleDragStart = (e) => {
  const target = e.target;
  
  // Move the circle to the drag layer
  target.moveTo(dragLayer.value.getNode());
};

const handleDragEnd = (e) => {
  const target = e.target;
  
  // Move the circle back to the main layer
  target.moveTo(mainLayer.value.getNode());
};
</script>
```

----------------------------------------

TITLE: Creating Konva Animation with React/react-konva
DESCRIPTION: This React functional component demonstrates implementing a Konva animation using the `react-konva` wrapper library. It utilizes the `useRef` hook to obtain a reference to the `react-konva` `Rect` component's underlying Konva node and the `useEffect` hook to manage the animation's lifecycle. A `Konva.Animation` instance is defined and started within the `useEffect` hook when the component mounts, and a cleanup function ensures the animation is stopped when the component unmounts. The animation update function calculates and sets the rectangle's position for a circular motion.
SOURCE: https://github.com/konvajs/site/blob/new/content/docs/animations/Create_an_Animation.mdx#_snippet_1

LANGUAGE: JavaScript
CODE:
```
import { Stage, Layer, Rect } from 'react-konva';
import { useEffect, useRef } from 'react';

const App = () => {
  const rectRef = useRef(null);

  useEffect(() => {
    const anim = new Konva.Animation((frame) => {
      const time = frame.time;
      const timeDiff = frame.timeDiff;
      const frameRate = frame.frameRate;

      // Example: move rectangle in a circle
      const radius = 50;
      const x = radius * Math.cos(frame.time * 2 * Math.PI / 2000) + 100;
      const y = radius * Math.sin(frame.time * 2 * Math.PI / 2000) + 100;
      rectRef.current.position({ x, y });
    }, rectRef.current.getLayer());

    anim.start();

    return () => {
      anim.stop();
    };
  }, []);

  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        <Rect
          ref={rectRef}
          x={50}
          y={50}
          width={50}
          height={50}
          fill="green"
        />
      </Layer>
    </Stage>
  );
};

export default App;
```

----------------------------------------

TITLE: Initializing a Konva Stage
DESCRIPTION: This snippet shows the basic constructor syntax for creating a new Konva Stage instance. The stage acts as the root container for all layers and nodes in a Konva application.
SOURCE: https://github.com/konvajs/site/blob/new/content/api/Konva.Stage.mdx#_snippet_0

LANGUAGE: javascript
CODE:
```
new Konva.Stage(config)
```

----------------------------------------

TITLE: Convert Konva Node to Image Asynchronously (JavaScript)
DESCRIPTION: The `toImage` method renders a Konva node into an HTML `Image` object. Since this is an asynchronous operation, you must provide a callback function or use the returned Promise to access the resulting image once the conversion is complete.
SOURCE: https://github.com/konvajs/site/blob/new/content/api/Konva.Ring.mdx#_snippet_65

LANGUAGE: javascript
CODE:
```
var image = node.toImage({
  callback(img) {
    // do stuff with img
  }
});
```

----------------------------------------

TITLE: Implementing Pointer-Based Zoom with KonvaJS (Vanilla JS)
DESCRIPTION: This snippet shows how to implement zooming in KonvaJS that is relative to the pointer position using plain JavaScript. It initializes a stage and layer, adds a circle, and attaches a 'wheel' event listener to the stage. The handler calculates the new scale and position based on the mouse pointer coordinates and the current scale and position, preventing default scroll behavior.
SOURCE: https://github.com/konvajs/site/blob/new/content/docs/sandbox/Zooming_Relative_To_Pointer.mdx#_snippet_0

LANGUAGE: javascript
CODE:
```
import Konva from 'konva';

const width = window.innerWidth;
const height = window.innerHeight;

const stage = new Konva.Stage({
  container: 'container',
  width: width,
  height: height,
});

const layer = new Konva.Layer();
stage.add(layer);

const circle = new Konva.Circle({
  x: stage.width() / 2,
  y: stage.height() / 2,
  radius: 50,
  fill: 'green',
});
layer.add(circle);

const scaleBy = 1.01;
stage.on('wheel', (e) => {
  // stop default scrolling
  e.evt.preventDefault();

  const oldScale = stage.scaleX();
  const pointer = stage.getPointerPosition();

  const mousePointTo = {
    x: (pointer.x - stage.x()) / oldScale,
    y: (pointer.y - stage.y()) / oldScale,
  };

  // how to scale? Zoom in? Or zoom out?
  let direction = e.evt.deltaY > 0 ? 1 : -1;

  // when we zoom on trackpad, e.evt.ctrlKey is true
  // in that case lets revert direction
  if (e.evt.ctrlKey) {
    direction = -direction;
  }

  const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

  stage.scale({ x: newScale, y: newScale });

  const newPos = {
    x: pointer.x - mousePointTo.x * newScale,
    y: pointer.y - mousePointTo.y * newScale,
  };
  stage.position(newPos);
});
```

TITLE: Initializing Konva Stage and Drawing a Rectangle (HTML/JS)
DESCRIPTION: This snippet demonstrates how to set up a Konva stage and layer, create a draggable rectangle shape, and add mouseover/mouseout event listeners to change the cursor style. It showcases basic Konva object creation and event handling within an HTML page.
SOURCE: https://github.com/konvajs/konva/blob/master/README.md#_snippet_0

LANGUAGE: HTML
CODE:
```
<script src="https://unpkg.com/konva@9/konva.min.js"></script>
<div id="container"></div>
<script>
  var stage = new Konva.Stage({
    container: 'container',
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // add canvas element
  var layer = new Konva.Layer();
  stage.add(layer);

  // create shape
  var box = new Konva.Rect({
    x: 50,
    y: 50,
    width: 100,
    height: 50,
    fill: '#00D2FF',
    stroke: 'black',
    strokeWidth: 4,
    draggable: true,
  });
  layer.add(box);

  // add cursor styling
  box.on('mouseover', function () {
    document.body.style.cursor = 'pointer';
  });
  box.on('mouseout', function () {
    document.body.style.cursor = 'default';
  });
</script>
```

----------------------------------------

TITLE: Importing Konva in ES6 Modules (JavaScript)
DESCRIPTION: This snippet shows the modern ES6 import syntax for including the Konva library in JavaScript projects, typically used with module bundlers like webpack or Parcel.
SOURCE: https://github.com/konvajs/konva/blob/master/README.md#_snippet_3

LANGUAGE: JavaScript
CODE:
```
import Konva from 'konva';
```

----------------------------------------

TITLE: Installing Konva with npm (Bash)
DESCRIPTION: This command demonstrates how to install the Konva library into a project using npm, saving it as a dependency in the project's package.json file.
SOURCE: https://github.com/konvajs/konva/blob/master/README.md#_snippet_2

LANGUAGE: Bash
CODE:
```
npm install konva --save
```

----------------------------------------

TITLE: Creating Konva TextPath and Helper Elements
DESCRIPTION: This snippet instantiates the primary Konva.TextPath object, which will display the curved text. It also creates a draggable Konva.Group to contain the text and several helper elements (Transformer, Rects for positioner and circle center, and a Path) used for visual debugging and interaction, making the text path's underlying geometry visible.
SOURCE: https://github.com/konvajs/konva/blob/master/test/text-paths.html#_snippet_2

LANGUAGE: TypeScript
CODE:
```
// create elements
const text = new Konva.TextPath({
  text: 'Curved text',
  align: 'center',
  data: 'M 0 0',
  fontSize: 20,
  textBaseline: 'middle',
  fill: 'black',
});
const group = new Konva.Group({
  draggable: true
});
// helpers
const transformer = new Konva.Transformer({
  resizeEnabled: true,
  rotateEnabled: true,
  shouldOverdrawWholeArea: true,
});
const positioner = new Konva.Rect({
  fill: 'green',
  opacity: 0.1,
  visible: false,
});
const circleCenter = new Konva.Rect({
  fill: 'red',
  opacity: 0.1,
  visible: false,
});
const path = new Konva.Path({
  stroke: 'black',
  opacity: 0.3,
  visible: false,
});
```

----------------------------------------

TITLE: Loading Konva via CDN (HTML)
DESCRIPTION: This snippet shows the simplest way to include the Konva library in an HTML page by linking to its minified version from a Content Delivery Network (CDN) using a <script> tag.
SOURCE: https://github.com/konvajs/konva/blob/master/README.md#_snippet_1

LANGUAGE: HTML
CODE:
```
<script src="https://unpkg.com/konva@9/konva.min.js"></script>
```

----------------------------------------

TITLE: Implementing the Main Simulation Loop (JavaScript)
DESCRIPTION: The core animation loop that runs continuously. It updates the `Stats.js` monitor, adds new bunnies if `isAdding` is true, clears the canvas, iterates through all bunnies to update their positions based on speed and gravity, handles boundary collisions, and then draws each bunny. It uses `requestAnimationFrame` for smooth animation.
SOURCE: https://github.com/konvajs/konva/blob/master/test/performance/bunnies_native.html#_snippet_5

LANGUAGE: JavaScript
CODE:
```
function update() {
  stats.begin();
  if (isAdding) {
    // add 10 at a time :)
    for (var i = 0; i < amount; i++) {
      bunny = { x: 10, y: 10, speedX: Math.random() * 10, speedY: Math.random() * 10 - 5 }
      bunnys.push(bunny);
      count++;
    }
    counter.innerHTML = count + ' BUNNIES';
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (var i = 0; i < bunnys.length; i++) {
    var bunny = bunnys[i];
    bunny.x = bunny.x + bunny.speedX;
    bunny.y = bunny.y + bunny.speedY;
    bunny.speedY += gravity;
    if (bunny.x > maxX - wabbitTexture.width) {
      bunny.speedX *= -1;
      bunny.x = (maxX - wabbitTexture.width);
    } else if (bunny.x < minX) {
      bunny.speedX *= -1;
      bunny.x = (minX);
    }
    if (bunny.y > maxY - wabbitTexture.height) {
      bunny.speedY *= -0.85;
      bunny.y = (maxY - wabbitTexture.height);
      if (Math.random() > 0.5) {
        bunny.speedY -= Math.random() * 6;
      }
    } else if (bunny.y < minY) {
      bunny.speedY = 0;
      bunny.y = (minY);
    }
    ctx.save();
    ctx.transform(1, 0, 0, 1, bunny.x, bunny.y);
    ctx.drawImage(wabbitTexture, 0, 0);
    ctx.restore();
  }
  requestAnimationFrame(update);
  stats.end();
}
```

----------------------------------------

TITLE: Using Konva Minimal Bundle and Importing Shapes (JavaScript)
DESCRIPTION: This snippet demonstrates how to import the minimal Konva core bundle to reduce application size, and then selectively import specific shapes like Rect or filters like Blur as needed, which automatically injects them into the Konva object.
SOURCE: https://github.com/konvajs/konva/blob/master/README.md#_snippet_5

LANGUAGE: JavaScript
CODE:
```
import Konva from 'konva/lib/Core';
// Now you have a Konva object with Stage, Layer, FastLayer, Group, Shape and some additional utils function.
// Also core currently already have support for drag&drop and animations.
// BUT there are no shapes (rect, circle, etc), no filters.

// but you can simply add anything you need:
import { Rect } from 'konva/lib/shapes/Rect';
// importing a shape will automatically inject it into Konva object

var rect1 = new Rect();
// or:
var shape = new Konva.Rect();

// for filters you can use this:
import { Blur } from 'konva/lib/filters/Blur';
```

----------------------------------------

TITLE: Handling Stage Click Event in Konva.js (JavaScript)
DESCRIPTION: This Konva event handler is triggered when the `stage` object is clicked. If the click target is the stage itself (not an object on it), it clears the `transformer` nodes, effectively deselecting any active transformations. It also hides helpers.
SOURCE: https://github.com/konvajs/konva/blob/master/test/text-paths.html#_snippet_17

LANGUAGE: javascript
CODE:
```
stage.on('click', (e) => {
  if (e.target === stage) {
    transformer.nodes([]);
  }
  updateHelpersVisibility(false);
});
```

----------------------------------------

TITLE: Handling Touch Events for Object Addition - JavaScript
DESCRIPTION: Defines functions to handle touch start and end events, setting a flag (`isAdding`) to control whether new objects are continuously added to the Konva.js layer during interaction.
SOURCE: https://github.com/konvajs/konva/blob/master/test/performance/creating_elements.html#_snippet_2

LANGUAGE: javascript
CODE:
```
function onTouchStart(event) { isAdding = true; }
function onTouchEnd(event) { isAdding = false; }
```

----------------------------------------

TITLE: Initializing Konva Stage and Layer with JavaScript
DESCRIPTION: This JavaScript snippet imports the Konva library, initializes a Konva `Stage` to fill the browser window, and adds a `Layer` to it. It also creates an HTML `canvas` element which will be used as the source for Konva.Image objects to display GIF frames.
SOURCE: https://github.com/konvajs/konva/blob/master/test/sandbox.html#_snippet_1

LANGUAGE: javascript
CODE:
```
import Konva from '../src/index.ts';
var width = window.innerWidth;
var height = window.innerHeight;
var stage = new Konva.Stage({
  container: 'container',
  width: width,
  height: height,
});
var layer = new Konva.Layer();
stage.add(layer);
var canvas = document.createElement('canvas');
```

----------------------------------------

TITLE: Handling Text Alignment Change in Konva.js (JavaScript)
DESCRIPTION: This event listener updates the `text` object's alignment property based on user input from an HTML element with ID 'align'. After updating, it calls `correctAlignment()`, `correctRotation()`, `setPosition()`, and `updateHelpersVisibility()` to re-render and adjust the text and helpers.
SOURCE: https://github.com/konvajs/konva/blob/master/test/text-paths.html#_snippet_7

LANGUAGE: javascript
CODE:
```
document
  .querySelector('#align')
  .addEventListener('change', ({ target: { value } }) => {
    text.align(value);
    correctAlignment();
    correctRotation();
    setPosition();
    updateHelpersVisibility(false);
  });
```

----------------------------------------

TITLE: Handling Curvature Input for Curved Text in Konva.js (JavaScript)
DESCRIPTION: This event listener updates the `curvature` variable based on user input from an HTML element with ID 'curvature'. It then triggers re-calculation of alignment and rotation, re-positions the text, updates helper visibility, clears transformer nodes, and synchronizes the 'radius' input field. This snippet is very similar to the 'radius' listener, indicating a linked input.
SOURCE: https://github.com/konvajs/konva/blob/master/test/text-paths.html#_snippet_13

LANGUAGE: javascript
CODE:
```
document
  .querySelector('#curvature')
  .addEventListener('input', ({ target: { value } }) => {
    curvature = value;
    correctAlignment();
    correctRotation();
    setPosition();
    updateHelpersVisibility(true);
    transformer.nodes([]);
    document.querySelector('#radius').value = value;
  });
```

----------------------------------------

TITLE: Configuring Mocha Test Runner and Importing Unit Tests (TypeScript)
DESCRIPTION: This snippet initializes the Mocha BDD test framework and imports a comprehensive set of unit test files for different Konva.js modules, including core components, various shape types, and event handling mechanisms. It concludes by running the tests.
SOURCE: https://github.com/konvajs/konva/blob/master/test/unit-tests.html#_snippet_0

LANGUAGE: TypeScript
CODE:
```
mocha.setup('bdd'); // CORE import './unit/Animation-test.ts'; import './unit/Tween-test.ts'; import './unit/Canvas-test.ts'; import './unit/Container-test.ts'; import './unit/Context-test.ts'; import './unit/DragAndDrop-test.ts'; import './unit/Global-test.ts'; import './unit/Group-test.ts'; import './unit/Layer-test.ts'; import './unit/Util-test.ts'; import './unit/Stage-test.ts'; import './unit/Shape-test.ts'; import './unit/Node-test.ts'; import './unit/Node-cache-test.ts'; import './unit/AutoDraw-test.ts'; // SHAPES import './unit/Rect-test.ts'; import './unit/Circle-test.ts'; import './unit/Image-test.ts'; import './unit/Line-test.ts'; import './unit/Text-test.ts'; import './unit/Blob-test.ts'; import './unit/Ellipse-test.ts'; import './unit/Polygon-test.ts'; import './unit/Spline-test.ts'; import './unit/Sprite-test.ts'; import './unit/Wedge-test.ts'; import './unit/Arc-test.ts'; import './unit/Ring-test.ts'; import './unit/Label-test.ts'; import './unit/Star-test.ts'; import './unit/RegularPolygon-test.ts'; import './unit/Path-test.ts'; import './unit/TextPath-test.ts'; import './unit/Arrow-test.ts'; import './unit/Transformer-test.ts'; // events import './unit/DragAndDropEvents-test.ts'; import './unit/MouseEvents-test.ts'; import './unit/TouchEvents-test.ts'; import './unit/PointerEvents-test.ts'; mocha.run();
```

----------------------------------------

TITLE: Initializing Konva Stage and Layer
DESCRIPTION: This snippet initializes the Konva stage and a drawing layer, setting up the basic canvas for rendering. It also defines several mutable variables used throughout the application to control text path properties like alignment shifts, curvature, and a timeout for helper visibility.
SOURCE: https://github.com/konvajs/konva/blob/master/test/text-paths.html#_snippet_0

LANGUAGE: TypeScript
CODE:
```
import Konva from '../src/index.ts';
const stage = new Konva.Stage({
  container: 'container',
  width: window.innerWidth,
  height: window.innerHeight,
});
const layer = new Konva.Layer();
stage.add(layer);
// define variables
let alignXShift = 0;
let alignYShift = 0;
let curvature = 0;
let helpersTimeout;
```

----------------------------------------

TITLE: Handling Text Decoration Change in Konva.js (JavaScript)
DESCRIPTION: This event listener updates the `text` object's text decoration property based on user input from an HTML element with ID 'textdecoration'. After updating, it calls `updateHelpersVisibility()` to re-render the text and hide helpers.
SOURCE: https://github.com/konvajs/konva/blob/master/test/text-paths.html#_snippet_10

LANGUAGE: javascript
CODE:
```
document
  .querySelector('#textdecoration')
  .addEventListener('change', ({ target: { value } }) => {
    text.textDecoration(value);
    updateHelpersVisibility(false);
  });
```

----------------------------------------

TITLE: Configuring Mocha for BDD Testing - JavaScript
DESCRIPTION: This snippet initializes the Mocha test framework to use the Behavior-Driven Development (BDD) interface, which provides `describe`, `it`, `beforeEach`, etc., for structuring tests.
SOURCE: https://github.com/konvajs/konva/blob/master/test/manual-tests.html#_snippet_0

LANGUAGE: JavaScript
CODE:
```
mocha.setup('bdd');
```

----------------------------------------

TITLE: Initializing Konva Stage in Node.js (JavaScript)
DESCRIPTION: This snippet shows how to initialize a Konva stage in a Node.js environment. Unlike browser usage, the 'container' attribute is not needed as Konva will use the 'canvas' package for rendering.
SOURCE: https://github.com/konvajs/konva/blob/master/README.md#_snippet_7

LANGUAGE: JavaScript
CODE:
```
import Konva from 'konva';

const stage = new Konva.Stage({
  width: 500,
  height: 500,
});
// then all regular Konva code will work
```

----------------------------------------

TITLE: Setting Up beforeEach Test Hook - JavaScript
DESCRIPTION: This `beforeEach` hook runs before each test case, dynamically creating a paragraph element to display the current test's parent title and its own title within the 'konva-container' element. This helps in visually tracking test execution.
SOURCE: https://github.com/konvajs/konva/blob/master/test/manual-tests.html#_snippet_1

LANGUAGE: JavaScript
CODE:
```
beforeEach(function () {
  var title = document.createElement('p'),
    test = this.currentTest;
  title.innerHTML = test.parent.title + ' - ' + test.title;
  title.className = 'konva-title';
  document.getElementById('konva-container').appendChild(title);
});
```

----------------------------------------

TITLE: Installing Konva and Canvas for Node.js (Bash)
DESCRIPTION: This command installs both Konva and the 'canvas' package, which is required for Konva to render graphics in a Node.js environment by providing a 2D canvas API.
SOURCE: https://github.com/konvajs/konva/blob/master/README.md#_snippet_6

LANGUAGE: Bash
CODE:
```
npm install konva canvas
```

----------------------------------------

TITLE: Adjusting Text Alignment for Curved Text in Konva.js (JavaScript)
DESCRIPTION: This function calculates `alignXShift` and `alignYShift` based on the current text alignment (`text.align()`) and arc data, ensuring text is correctly positioned on a curve. It handles 'left', 'right', and 'center' alignments, with special logic for 'center' when the arc sweep is 1. It depends on `getArcData()`, `isOutOfRange()`, `getArcSweep()`, and `text` object properties.
SOURCE: https://github.com/konvajs/konva/blob/master/test/text-paths.html#_snippet_6

LANGUAGE: javascript
CODE:
```
const correctAlignment = () => {
  const { start, radius, deltaAngle } = getArcData();
  const value = text.align();
  if (isOutOfRange()) {
    alignXShift = 0;
  } else if (value === 'right') {
    alignXShift = -text.getTextWidth() / 2;
  } else if (value === 'left') {
    alignXShift = text.getTextWidth() / 2;
  } else {
    alignXShift = 0;
  }
  if (value === 'center' && getArcSweep() === 1) {
    alignYShift = start.y * 4;
    alignXShift = start.x * 2;
  } else {
    alignYShift = 0;
  }
};
```

----------------------------------------

TITLE: Adding Konva Shapes to Group and Layer (JavaScript)
DESCRIPTION: This code snippet demonstrates how to add Konva shapes (`text`, `path`, `circleCenter`) to a `group` and then add the `group` and a `transformer` to the `layer`. This establishes the visual hierarchy and enables transformations on the grouped elements.
SOURCE: https://github.com/konvajs/konva/blob/master/test/text-paths.html#_snippet_18

LANGUAGE: javascript
CODE:
```
group.add(text);
group.add(path);
group.add(circleCenter);
layer.add(group);
layer.add(transformer);
```

----------------------------------------

TITLE: Correcting Konva TextPath Rotation
DESCRIPTION: This function, `correctRotation`, adjusts the rotation of the `Konva.TextPath` and its associated visual path. It ensures that the text and path are correctly oriented, especially when the text alignment is 'left' or 'right', or when the curvature causes the text to be considered 'out of range', in which case rotation is reset to zero.
SOURCE: https://github.com/konvajs/konva/blob/master/test/text-paths.html#_snippet_5

LANGUAGE: TypeScript
CODE:
```
// create methods to correct rotation and alignment
const correctRotation = () => {
  const value = text.align();
  if (isOutOfRange()) {
    text.rotation(0);
    path.rotation(0);
  } else if (value === 'right') {
    text.rotation(180);
    path.rotation(180);
  } else if (value === 'left') {
    text.rotation(180);
    path.rotation(180);
  } else {
    text.rotation(0);
    pat
```

----------------------------------------

TITLE: Creating a Konva.js Rectangle Shape - JavaScript
DESCRIPTION: This function defines how to create a new 'bunny' object, which is a Konva.Rect instance. It sets initial properties like position, size, and a random fill color, optimizing drawing performance by disabling 'perfectDrawEnabled'.
SOURCE: https://github.com/konvajs/konva/blob/master/test/performance/jump-shape.html#_snippet_3

LANGUAGE: JavaScript
CODE:
```
function createShape() {
  return new Konva.Rect({
    transformsEnabled: 'position',
    x: 10,
    y: 10,
    perfectDrawEnabled: false,
    width: 10,
    height: 10,
    fill: Konva.Util.getRandomColor()
  });
}
```

----------------------------------------

TITLE: Handling Group Click Event in Konva.js (JavaScript)
DESCRIPTION: This Konva event handler is triggered when the `group` object is clicked. It hides helpers and sets the `transformer` to operate on the `group` itself, allowing for transformations.
SOURCE: https://github.com/konvajs/konva/blob/master/test/text-paths.html#_snippet_14

LANGUAGE: javascript
CODE:
```
group.on('click', (e) => {
  updateHelpersVisibility(false);
  transformer.nodes([group]);
});
```

----------------------------------------

TITLE: Configuring TypeScript for Konva (TypeScript)
DESCRIPTION: This tsconfig.json snippet illustrates how to configure TypeScript compiler options to include DOM definitions, which are necessary for Konva's browser-based functionality and type checking.
SOURCE: https://github.com/konvajs/konva/blob/master/README.md#_snippet_4

LANGUAGE: TypeScript
CODE:
```
{
  "compilerOptions": {
    "lib": [
        "es6",
        "dom"
    ]
  }
}
```

----------------------------------------

TITLE: Animating Konva Images from Canvas with JavaScript
DESCRIPTION: This JavaScript function `testKonvaImage` continuously creates and adds new Konva.Image objects to the layer, using the dynamically updated canvas as their source. Each image is positioned randomly and destroyed after 500ms, demonstrating dynamic image updates and cleanup within Konva.
SOURCE: https://github.com/konvajs/konva/blob/master/test/sandbox.html#_snippet_4

LANGUAGE: javascript
CODE:
```
function testKonvaImage() {
  setInterval(() => {
    const image = new Konva.Image({
      image: canvas,
      x: Math.random() * width,
      y: Math.random() * height,
    });
    layer.add(image);
    setTimeout(() => {
      image.image(canvas);
      image.destroy();
    }, 500);
  }, 10);
}
```

----------------------------------------

TITLE: Drawing GIF Frames to Canvas with JavaScript
DESCRIPTION: This JavaScript function `onDrawFrame` is a callback used by the `gifler` library. It updates the dimensions of an external canvas to match the current GIF frame and then draws the frame's buffer onto the canvas's 2D rendering context. After drawing, it redraws the Konva layer to reflect the changes.
SOURCE: https://github.com/konvajs/konva/blob/master/test/sandbox.html#_snippet_2

LANGUAGE: javascript
CODE:
```
function onDrawFrame(ctx, frame) {
  // update canvas size
  canvas.width = frame.width;
  canvas.height = frame.height;
  // update canvas that we are using for Konva.Image
  ctx.drawImage(frame.buffer, 0, 0);
  // redraw the layer
  layer.draw();
}
```

----------------------------------------

TITLE: Loading GIF Animation with Gifler.js
DESCRIPTION: This JavaScript line uses the `gifler` library to load a GIF from a specified URL. Once loaded, it passes the external `canvas` element and the `onDrawFrame` callback function to `frames()`, which will handle drawing each GIF frame onto the canvas.
SOURCE: https://github.com/konvajs/konva/blob/master/test/sandbox.html#_snippet_3

LANGUAGE: javascript
CODE:
```
gifler('https://konvajs.org/assets/yoda.gif').frames(canvas, onDrawFrame);
```

----------------------------------------

TITLE: Initializing Konva.js Stage, Layer, and Game Variables (JavaScript)
DESCRIPTION: This snippet imports Konva.js, sets up global variables for game state (e.g., dimensions, gravity, bunny count), initializes the Konva Stage and Layer, loads the bunny texture, and attaches performance monitoring (Stats.js) and event listeners for user interaction.
SOURCE: https://github.com/konvajs/konva/blob/master/test/bunnies.html#_snippet_1

LANGUAGE: javascript
CODE:
```
import Konva from '../src/index.ts'; Konva.isUnminified = false; var lastTime = 0; var width = window.innerWidth; var height = window.innerHeight; var wabbitTexture; var bunnys = []; var gravity = 0.75; var maxX = width - 10; var minX = 0; var maxY = height - 10; var minY = 0; var startBunnyCount = 4000; var isAdding = false; var count = 0; var container; var layer; var stats; var amount = 10; var counter; Konva.pixelRatio = 1; var stage = new Konva.Stage({
  container: 'container',
  width: width - 10,
  height: height - 10,
}); layer = new Konva.Layer({ listening: false }); stage.add(layer); stats = new Stats(); wabbitTexture = new Image(); wabbitTexture.onload = function () { _handleTextureLoaded(); }; wabbitTexture.src = 'https://konvajs.org/assets/bunny.png'; document.body.appendChild(stats.domElement); stats.domElement.style.position = 'absolute'; stats.domElement.style.top = '0px'; window.requestAnimationFrame(update); counter = document.createElement('div'); counter.className = 'counter'; counter.style.position = 'absolute'; counter.style.top = '50px'; document.body.appendChild(counter); count = startBunnyCount; counter.innerHTML = startBunnyCount + ' BUNNIES'; container = stage; stage.on('mousedown', function () { isAdding = true; }); stage.on('mouseup', function () { isAdding = false; }); document.addEventListener('touchstart', onTouchStart, true); document.addEventListener('touchend', onTouchEnd, true);
```

----------------------------------------

TITLE: Initializing Konva.js Stage and Event Listeners - JavaScript
DESCRIPTION: Initializes a Konva.js stage and layer, sets up performance monitoring with Stats.js, and defines variables for object counting and animation. It also attaches mouse and touch event listeners to control object addition.
SOURCE: https://github.com/konvajs/konva/blob/master/test/performance/creating_elements.html#_snippet_1

LANGUAGE: javascript
CODE:
```
var lastTime = 0; var width = window.innerWidth; var height = window.innerHeight; var maxX = width - 10; var minX = 0; var maxY = height - 10; var minY = 0; var startObjectsCount = 5000; var isAdding = false; var count = 0; var container; var layer; var stats; var amount = 10; var counter; var stage = new Konva.Stage({
 container: 'container',
 width: width - 10,
 height: height - 10,
 });
layer = new Konva.Layer();
stage.add(layer);
stats = new Stats();
document.body.appendChild(stats.domElement);
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = '0px';
window.requestAnimationFrame(update);
counter = document.createElement('div');
counter.className = 'counter';
counter.style.position = 'absolute';
counter.style.top = '50px';
document.body.appendChild(counter);
count = startObjectsCount;
counter.innerHTML = startObjectsCount + ' BUNNIES';
container = stage;
// stage.addChild(container);
stage.on('mousedown', function () {
 isAdding = true;
 });
stage.on('mouseup', function () {
 isAdding = false;
 });
document.addEventListener('touchstart', onTouchStart, true);
document.addEventListener('touchend', onTouchEnd, true);
```

----------------------------------------

TITLE: Handling Group Transform Event in Konva.js (JavaScript)
DESCRIPTION: This Konva event handler is triggered when the `group` object is being transformed (scaled, rotated, etc.). It hides helpers during the transformation.
SOURCE: https://github.com/konvajs/konva/blob/master/test/text-paths.html#_snippet_16

LANGUAGE: javascript
CODE:
```
group.on('transform', (e) => {
  updateHelpersVisibility(false);
});
```

----------------------------------------

TITLE: Handling Group Drag Move Event in Konva.js (JavaScript)
DESCRIPTION: This Konva event handler is triggered when the `group` object is being dragged. It hides helpers during the drag operation to prevent visual clutter.
SOURCE: https://github.com/konvajs/konva/blob/master/test/text-paths.html#_snippet_15

LANGUAGE: javascript
CODE:
```
group.on('dragmove', (e) => {
  updateHelpersVisibility(false);
});
```

----------------------------------------

TITLE: Initializing Konva.js Stage and Layer with Physics Variables - JavaScript
DESCRIPTION: This code initializes global variables for physics simulation (gravity, boundaries) and sets up the Konva.js stage and layer. It also integrates the Stats.js library for performance monitoring and creates a counter element to display the number of objects.
SOURCE: https://github.com/konvajs/konva/blob/master/test/performance/jump-shape.html#_snippet_1

LANGUAGE: JavaScript
CODE:
```
var lastTime = 0; var width = window.innerWidth; var height = window.innerHeight; var bunnys = []; var gravity = 0.75; var maxX = width - 10; var minX = 0; var maxY = height - 10; var minY = 0; var startBunnyCount = 4000; var isAdding = false; var count = 0; var container; var layer; var stats; var amount = 10; var counter; Konva.pixelRatio = 1; var stage = new Konva.Stage({
  container: 'container',
  width: width - 10,
  height: height - 10
}); layer = new Konva.Layer({
  listening: false
}); stage.add(layer); stats = new Stats(); document.body.appendChild(stats.domElement); stats.domElement.style.position = 'absolute'; stats.domElement.style.top = '0px'; window.requestAnimationFrame(update); counter = document.createElement('div'); counter.className = 'counter'; counter.style.position = 'absolute'; counter.style.top = '50px'; document.body.appendChild(counter); count = startBunnyCount; counter.innerHTML = startBunnyCount + ' ELEMENTS'; container = stage;
```

----------------------------------------

TITLE: Handling Texture Load and Initial Bunny Creation (JavaScript)
DESCRIPTION: This function is called once the bunny texture image is loaded. It initializes a predefined number of Konva.Image objects (bunnies) with random initial speeds and adds them to the Konva layer, preparing them for animation.
SOURCE: https://github.com/konvajs/konva/blob/master/test/bunnies.html#_snippet_2

LANGUAGE: javascript
CODE:
```
function _handleTextureLoaded(event) {
  for (var i = 0; i < startBunnyCount; i++) {
    var bunny = new Konva.Image({
      image: wabbitTexture,
      transformsEnabled: 'position',
      x: 10,
      y: 10,
      perfectDrawEnabled: false,
      width: wabbitTexture.width,
      height: wabbitTexture.height,
      fill: 'yellow',
    });
    bunny.speedX = Math.random() * 10;
    bunny.speedY = Math.random() * 10 - 5;
    bunnys.push(bunny);
    layer.add(bunny);
  }
}
```

----------------------------------------

TITLE: Populating Initial Konva.js Objects - JavaScript
DESCRIPTION: This loop initializes a specified number of 'bunny' objects at the start of the application. Each bunny is created using 'createShape', assigned random initial horizontal and vertical velocities, and then added to both the 'bunnys' array and the Konva layer for rendering.
SOURCE: https://github.com/konvajs/konva/blob/master/test/performance/jump-shape.html#_snippet_4

LANGUAGE: JavaScript
CODE:
```
for (var i = 0; i < startBunnyCount; i++) {
  var bunny = createShape();
  bunny.speedX = Math.random() * 10;
  bunny.speedY = Math.random() * 10 - 5;
  bunnys.push(bunny);
  layer.add(bunny);
}
```

----------------------------------------

TITLE: Creating Initial Bunnies on Texture Load (JavaScript)
DESCRIPTION: This function is called once the bunny texture image has finished loading. It populates the `bunnys` array with an initial set of bunny objects, each with a starting position and random initial speed, preparing them for the simulation.
SOURCE: https://github.com/konvajs/konva/blob/master/test/performance/bunnies_native.html#_snippet_3

LANGUAGE: JavaScript
CODE:
```
function _handleTextureLoaded(event) {
  for (var i = 0; i < startBunnyCount; i++) {
    bunny = { x: 10, y: 10, speedX: Math.random() * 10, speedY: Math.random() * 10 - 5 }
    bunnys.push(bunny);
  }
}
```

----------------------------------------

TITLE: Handling Text Content Input in Konva.js (JavaScript)
DESCRIPTION: This event listener updates the `text` object's content based on user input from an HTML element with ID 'textinput'. After updating, it calls `setPosition()` and `updateHelpersVisibility()` to re-render and adjust the text and helpers.
SOURCE: https://github.com/konvajs/konva/blob/master/test/text-paths.html#_snippet_9

LANGUAGE: javascript
CODE:
```
document
  .querySelector('#textinput')
  .addEventListener('input', ({ target: { value } }) => {
    text.text(value);
    setPosition();
    updateHelpersVisibility(false);
  });
```

----------------------------------------

TITLE: Handling Font Size Input in Konva.js (JavaScript)
DESCRIPTION: This event listener updates the `text` object's font size property based on user input from an HTML element with ID 'fontsize'. The input value is converted to a number. After updating, it calls `setPosition()` and `updateHelpersVisibility()` to re-render and adjust the text and helpers.
SOURCE: https://github.com/konvajs/konva/blob/master/test/text-paths.html#_snippet_11

LANGUAGE: javascript
CODE:
```
document
  .querySelector('#fontsize')
  .addEventListener('input', ({ target: { value } }) => {
    text.fontSize(Number(value));
    setPosition();
    updateHelpersVisibility(false);
  });
```

----------------------------------------

TITLE: Handling Font Weight Change in Konva.js (JavaScript)
DESCRIPTION: This event listener updates the `text` object's font style property based on user input from an HTML element with ID 'fontweight'. After updating, it calls `updateHelpersVisibility()` to re-render the text and hide helpers.
SOURCE: https://github.com/konvajs/konva/blob/master/test/text-paths.html#_snippet_8

LANGUAGE: javascript
CODE:
```
document
  .querySelector('#fontweight')
  .addEventListener('change', ({ target: { value } }) => {
    text.fontStyle(value);
    updateHelpersVisibility(false);
  });
```

----------------------------------------

TITLE: Konva.js Animation Loop for Bunny Simulation (JavaScript)
DESCRIPTION: This `requestAnimationFrame` loop updates the simulation state. It adds new bunnies if `isAdding` is true, applies gravity and collision detection to existing bunnies, updates their positions, and redraws the Konva layer. Performance statistics are tracked using Stats.js.
SOURCE: https://github.com/konvajs/konva/blob/master/test/bunnies.html#_snippet_4

LANGUAGE: javascript
CODE:
```
function update() {
  stats.begin();
  if (isAdding) {
    for (var i = 0; i < amount; i++) {
      var bunny = new Konva.Image({
        image: wabbitTexture,
        transformsEnabled: 'position',
        x: 0,
        y: 0,
        perfectDrawEnabled: false,
        width: wabbitTexture.width,
        height: wabbitTexture.height,
      });
      bunny.speedX = Math.random() * 10;
      bunny.speedY = Math.random() * 10 - 5;
      bunnys.push(bunny);
      layer.add(bunny);
      count++;
    }
    counter.innerHTML = count + ' BUNNIES';
  }
  for (var i = 0; i < bunnys.length; i++) {
    var bunny = bunnys[i];
    var pos = { x: bunny.x(), y: bunny.y() };
    pos.x = pos.x + bunny.speedX;
    pos.y = pos.y + bunny.speedY;
    bunny.speedY += gravity;
    if (pos.x > maxX - wabbitTexture.width) {
      bunny.speedX *= -1;
      pos.x = maxX - wabbitTexture.width;
    } else if (pos.x < minX) {
      bunny.speedX *= -1;
      pos.x = minX;
    }
    if (pos.y > maxY - wabbitTexture.height) {
      bunny.speedY *= -0.85;
      pos.y = maxY - wabbitTexture.height;
      if (Math.random() > 0.5) {
        bunny.speedY -= Math.random() * 6;
      }
    } else if (pos.y < minY) {
      bunny.speedY = 0;
      pos.y = minY;
    }
    bunny.position({ x: pos.x, y: pos.y });
  }
  if (!Konva.autoDrawEnabled) {
    layer.draw();
  }
  requestAnimationFrame(update);
  stats.end();
}
```

----------------------------------------

TITLE: Konva.js Animation Loop with Physics and Object Management - JavaScript
DESCRIPTION: This is the main animation loop, executed via 'requestAnimationFrame'. It updates performance stats, adds new objects if 'isAdding' is true, applies gravity and boundary collision physics to all existing objects, redraws the Konva layer, and schedules the next frame.
SOURCE: https://github.com/konvajs/konva/blob/master/test/performance/jump-shape.html#_snippet_6

LANGUAGE: JavaScript
CODE:
```
function update() {
  stats.begin();
  if (isAdding) {
    for (var i = 0; i < amount; i++) {
      var bunny = createShape();
      bunny.speedX = Math.random() * 10;
      bunny.speedY = Math.random() * 10 - 5;
      bunnys.push(bunny);
      layer.add(bunny);
      count++;
    }
    counter.innerHTML = count + ' BUNNIES';
  }
  for (var i = 0; i < bunnys.length; i++) {
    var bunny = bunnys[i];
    var pos = {
      x: bunny.x(),
      y: bunny.y()
    };
    pos.x = pos.x + bunny.speedX;
    pos.y = pos.y + bunny.speedY;
    bunny.speedY += gravity;
    if (pos.x > maxX - 20) {
      bunny.speedX *= -1;
      pos.x = maxX - 20;
    } else if (pos.x < minX) {
      bunny.speedX *= -1;
      pos.x = minX;
    }
    if (pos.y > maxY - 20) {
      bunny.speedY *= -0.85;
      pos.y = maxY - 20;
      if (Math.random() > 0.5) {
        bunny.speedY -= Math.random() * 6;
      }
    } else if (pos.y < minY) {
      bunny.speedY = 0;
      pos.y = minY;
    }
    bunny.position({
      x: pos.x,
      y: pos.y
    });
  }
  layer.draw();
  requestAnimationFrame(update);
  stats.end();
}
```

----------------------------------------

TITLE: Implementing Konva.js Animation Loop with Object Generation - JavaScript
DESCRIPTION: Implements the main animation loop using `requestAnimationFrame`. It clears the layer, conditionally adds new Konva.Rect objects (bunnies) based on the `isAdding` flag, and updates a counter. Performance is tracked using Stats.js.
SOURCE: https://github.com/konvajs/konva/blob/master/test/performance/creating_elements.html#_snippet_3

LANGUAGE: javascript
CODE:
```
function update() {
 stats.begin();
 layer.destroyChildren();
 if (isAdding) {
 // add 10 at a time :)
 count += 10;
 counter.innerHTML = count + ' BUNNIES';
 }
 for (var i = 0; i < count; i++) {
 var bunny = new Konva.Rect({
 x: Math.random() * width,
 y: Math.random() * height,
 width: 50,
 height: 50,
 fill: Konva.Util.getRandomColor(),
 });
 layer.add(bunny);
 }
 requestAnimationFrame(update);
 stats.end();
}
```

----------------------------------------

TITLE: Handling Radius Input for Curved Text in Konva.js (JavaScript)
DESCRIPTION: This event listener updates the `curvature` variable based on user input from an HTML element with ID 'radius'. It then triggers re-calculation of alignment and rotation, re-positions the text, clears transformer nodes, updates helper visibility, and synchronizes the 'curvature' input field.
SOURCE: https://github.com/konvajs/konva/blob/master/test/text-paths.html#_snippet_12

LANGUAGE: javascript
CODE:
```
document
  .querySelector('#radius')
  .addEventListener('input', ({ target: { value } }) => {
    curvature = value;
    correctAlignment();
    correctRotation();
    setPosition();
    transformer.nodes([]);
    updateHelpersVisibility(true);
    document.querySelector('#curvature').value = value;
  });
```

----------------------------------------

TITLE: Setting Up Canvas and Loading Assets (JavaScript)
DESCRIPTION: Retrieves the canvas element, sets its dimensions, and obtains its 2D rendering context. It also initializes the `Stats.js` performance monitor, loads the 'bunny.png' image, and appends performance and bunny count displays to the document body. The `_handleTextureLoaded` callback is assigned to run once the image is ready.
SOURCE: https://github.com/konvajs/konva/blob/master/test/performance/bunnies_native.html#_snippet_2

LANGUAGE: JavaScript
CODE:
```
var canvas = document.getElementById('canvas');
canvas.width = width;
canvas.height = height;
var ctx = canvas.getContext('2d');
stats = new Stats();
wabbitTexture = new Image();
wabbitTexture.onload = function() { _handleTextureLoaded(); };
wabbitTexture.src = '../assets/bunny.png';
document.body.appendChild(stats.domElement);
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = '0px';
window.requestAnimationFrame(update);
counter = document.createElement('div');
counter.className = 'counter';
counter.style.position = 'absolute';
counter.style.top = '50px';
document.body.appendChild(counter);
count = startBunnyCount;
counter.innerHTML = startBunnyCount + ' BUNNIES';
```