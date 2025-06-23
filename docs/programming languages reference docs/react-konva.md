TITLE: Install React Konva and Konva via npm
DESCRIPTION: This command installs the `react-konva` library and its core dependency `konva` using npm, saving them to the project's dependencies. This is the first step to set up a React Konva project.
SOURCE: https://github.com/konvajs/react-konva/blob/master/README.md#_snippet_0

LANGUAGE: bash
CODE:
```
npm install react-konva konva --save
```

----------------------------------------

TITLE: Basic React Konva Component Usage
DESCRIPTION: This example demonstrates how to set up a basic React Konva application, including creating a stage, layer, and an interactive rectangle. It showcases state management with `useState` to change the rectangle's color and event handling for click interactions. The application renders a stage that fills the window and contains a clickable rectangle.
SOURCE: https://github.com/konvajs/react-konva/blob/master/README.md#_snippet_1

LANGUAGE: javascript
CODE:
```
import React, { useState } from 'react';
import { render } from 'react-dom';
import { Stage, Layer, Rect, Text } from 'react-konva';
import Konva from 'konva';

const ColoredRect = () => {
  const [color, setColor] = useState('green');

  const handleClick = () => {
    setColor(Konva.Util.getRandomColor());
  };

  return (
    <Rect
      x={20}
      y={20}
      width={50}
      height={50}
      fill={color}
      shadowBlur={5}
      onClick={handleClick}
    />
  );
};

const App = () => {
  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        <Text text="Try click on rect" />
        <ColoredRect />
      </Layer>
    </Stage>
  );
};

render(<App />, document.getElementById('root'));
```

----------------------------------------

TITLE: Accessing Konva Node Instances with React useRef
DESCRIPTION: This snippet illustrates how to obtain a direct reference to the underlying Konva instance of a React Konva component using the `useRef` hook. The `useEffect` hook is used to log the Konva.Circle instance after the component mounts, allowing direct manipulation or inspection of the Konva object.
SOURCE: https://github.com/konvajs/react-konva/blob/master/README.md#_snippet_2

LANGUAGE: javascript
CODE:
```
import React, { useEffect, useRef } from 'react';

const MyShape = () => {
  const circleRef = useRef();

  useEffect(() => {
    // log Konva.Circle instance
    console.log(circleRef.current);
  }, []);

  return <Circle ref={circleRef} radius={50} fill="black" />;
};
```

----------------------------------------

TITLE: Enable React Konva Strict Mode Globally
DESCRIPTION: This code demonstrates how to enable `strict` mode for `react-konva` across the entire application by calling `useStrictMode(true)`. In strict mode, `react-konva` will always synchronize all node properties with the values provided in the `render()` function, overriding any manual changes or user interactions.
SOURCE: https://github.com/konvajs/react-konva/blob/master/README.md#_snippet_3

LANGUAGE: javascript
CODE:
```
import { useStrictMode } from 'react-konva';

useStrictMode(true);
```

----------------------------------------

TITLE: Using Next.js Dynamic Import for Client-Side Canvas Component
DESCRIPTION: This snippet demonstrates how to use Next.js's `dynamic` import feature to load the 'Canvas' component created previously. By setting `ssr: false`, the component is guaranteed to be loaded only on the client-side, preventing server-side rendering issues related to 'canvas'.
SOURCE: https://github.com/konvajs/react-konva/blob/master/README.md#_snippet_9

LANGUAGE: javascript
CODE:
```
'use client';
import dynamic from 'next/dynamic';

const Canvas = dynamic(() => import('../components/canvas'), {
  ssr: false,
});

export default function Page(props) {
  return <Canvas />;
}
```

----------------------------------------

TITLE: Creating a Client-Side Canvas Component for Next.js Dynamic Import
DESCRIPTION: This code defines a simple React component using 'react-konva' that will render a Stage, Layer, and Circle. This component is designed to be placed outside of Next.js 'pages' or 'app' folders and will be dynamically imported to ensure it only runs on the client-side.
SOURCE: https://github.com/konvajs/react-konva/blob/master/README.md#_snippet_8

LANGUAGE: javascript
CODE:
```
import { Stage, Layer, Circle } from 'react-konva';

function Canvas(props) {
  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        <Circle x={200} y={100} radius={50} fill="green" />
      </Layer>
    </Stage>
  );
}

export default Canvas;
```

----------------------------------------

TITLE: Bridging React Context with React Konva Stage
DESCRIPTION: Demonstrates a workaround for a known React issue where Contexts are not directly accessible by children of the `react-konva` `Stage` component. The example shows how to bridge a `ThemeContext` by wrapping the `Layer` with a `ThemeContext.Provider` inside the `Stage` to make context values available to Konva shapes like `Rect`.
SOURCE: https://github.com/konvajs/react-konva/blob/master/README.md#_snippet_12

LANGUAGE: javascript
CODE:
```
import React, { Component } from 'react';
import Konva from 'konva';
import { render } from 'react-dom';
import { Stage, Layer, Rect } from 'react-konva';

const ThemeContext = React.createContext('red');

const ThemedRect = () => {
  const value = React.useContext(ThemeContext);
  return (
    <Rect x={20} y={50} width={100} height={100} fill={value} shadowBlur={10} />
  );
};

const Canvas = () => {
  return (
    <ThemeContext.Consumer>
      {(value) => (
        <Stage width={window.innerWidth} height={window.innerHeight}>
          <ThemeContext.Provider value={value}>
            <Layer>
              <ThemedRect />
            </Layer>
          </ThemeContext.Provider>
        </Stage>
      )}
    </ThemeContext.Consumer>
  );
};

class App extends Component {
  render() {
    return (
      <ThemeContext.Provider value="blue">
        <Canvas />
      </ThemeContext.Provider>
    );
  }
}
```

----------------------------------------

TITLE: Importing Minimal react-konva Core for Bundle Size Optimization
DESCRIPTION: This snippet demonstrates how to import the minimal core version of 'react-konva' to reduce the overall bundle size. It also shows how to explicitly import specific Konva shapes if they are needed, as the core version does not include them by default.
SOURCE: https://github.com/konvajs/react-konva/blob/master/README.md#_snippet_6

LANGUAGE: javascript
CODE:
```
// load minimal version of 'react-konva`
import { Stage, Layer, Rect } from 'react-konva/lib/ReactKonvaCore';

// minimal version has NO support for core shapes and filters
// if you want import a shape into Konva namespace you can just do this:
import 'konva/lib/shapes/Rect';
```

----------------------------------------

TITLE: Illustrating React Konva Strict vs. Non-Strict Mode Behavior
DESCRIPTION: This example highlights the difference between strict and non-strict modes using a draggable circle that changes color on `dragend`. In strict mode, the circle's position would reset to `{x: 0, y: 0}` after dragging because `x` and `y` are fixed in `render`. In contrast, non-strict mode allows the circle to retain its dragged position since `x` and `y` are not explicitly updated in the render function.
SOURCE: https://github.com/konvajs/react-konva/blob/master/README.md#_snippet_5

LANGUAGE: javascript
CODE:
```
import { Circle } from 'react-konva';
import Konva from 'konva';

const Shape = () => {
  const [color, setColor] = React.useState();

  return (
    <Circle
      x={0}
      y={0}
      draggable
      radius={50}
      fill={color}
      onDragEnd={() => {
        setColor(Konva.Util.getRandomColor());
      }}
    />
  );
};
```