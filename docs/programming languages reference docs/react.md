TITLE: Declaring State with useState in React
DESCRIPTION: This snippet demonstrates how to declare a state variable using the `useState` Hook in a React functional component. `useState` allows components to 'remember' information, such as user input or selected items. It returns an array containing the current state value and a function to update it. Here, `index` is initialized to `0` for an `ImageGallery` component.
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/reference/react/hooks.md#_snippet_0

LANGUAGE: js
CODE:
```
function ImageGallery() {
  const [index, setIndex] = useState(0);
  // ...
```

----------------------------------------

TITLE: Declaring Multiple State Variables with useState in React
DESCRIPTION: This snippet demonstrates the basic syntax for declaring state variables using the `useState` Hook in React. Each call to `useState` initializes a state variable with a default value (e.g., `0` for `index`, `false` for `showMore`) and returns an array containing the current state value and its corresponding setter function.
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/learn/adding-interactivity.md#_snippet_2

LANGUAGE: JavaScript
CODE:
```
const [index, setIndex] = useState(0);
const [showMore, setShowMore] = useState(false);
```

----------------------------------------

TITLE: Rendering List Items with Unique Keys in React
DESCRIPTION: This React JSX snippet demonstrates how to render a list item (`<li>`) using a unique `key` property. The `key` prop, set to `user.id`, helps React efficiently identify and re-render list items when the list changes, preventing issues with state preservation during updates, additions, or removals.
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/learn/tutorial-tic-tac-toe.md#_snippet_72

LANGUAGE: JavaScript
CODE:
```
<li key={user.id}>
  {user.name}: {user.taskCount} tasks left
</li>
```

----------------------------------------

TITLE: React App Demonstrating Object Dependency Issue
DESCRIPTION: A complete React application (`App`, `ChatRoom`, `chat.js`, CSS) illustrating how recreating an object dependency (`options`) on each render causes a `useEffect` to re-synchronize unnecessarily when unrelated state (`message`) changes.
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/learn/removing-effect-dependencies.md#_snippet_28

LANGUAGE: javascript
CODE:
```
import { useState, useEffect } from 'react';
import { createConnection } from './chat.js';

const serverUrl = 'https://localhost:1234';

function ChatRoom({ roomId }) {
  const [message, setMessage] = useState('');

  // Temporarily disable the linter to demonstrate the problem
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const options = {
    serverUrl: serverUrl,
    roomId: roomId
  };

  useEffect(() => {
    const connection = createConnection(options);
    connection.connect();
    return () => connection.disconnect();
  }, [options]);

  return (
    <>
      <h1>Welcome to the {roomId} room!</h1>
      <input value={message} onChange={e => setMessage(e.target.value)} />
    </>
  );
}

export default function App() {
  const [roomId, setRoomId] = useState('general');
  return (
    <>
      <label>
        Choose the chat room:{' '}
        <select
          value={roomId}
          onChange={e => setRoomId(e.target.value)}
        >
          <option value="general">general</option>
          <option value="travel">travel</option>
          <option value="music">music</option>
        </select>
      </label>
      <hr />
      <ChatRoom roomId={roomId} />
    </>
  );
}
```

LANGUAGE: javascript
CODE:
```
export function createConnection({ serverUrl, roomId }) {
  // A real implementation would actually connect to the server
  return {
    connect() {
      console.log('✅ Connecting to "' + roomId + '" room at ' + serverUrl + '...');
    },
    disconnect() {
      console.log('❌ Disconnected from "' + roomId + '" room at ' + serverUrl);
    }
  };
}
```

LANGUAGE: css
CODE:
```
input { display: block; margin-bottom: 20px; }
button { margin-left: 10px; }

```

----------------------------------------

TITLE: React Task Management Application with Reducer and Context
DESCRIPTION: This comprehensive example illustrates building a task management application in React. It leverages the `useReducer` hook for centralized state logic and the Context API to make the state and dispatch function globally accessible to components without prop drilling. The application includes functionalities for adding, editing, deleting, and marking tasks as complete.
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/learn/managing-state.md#_snippet_11

LANGUAGE: javascript
CODE:
```
import AddTask from './AddTask.js';
import TaskList from './TaskList.js';
import { TasksProvider } from './TasksContext.js';

export default function TaskApp() {
  return (
    <TasksProvider>
      <h1>Day off in Kyoto</h1>
      <AddTask />
      <TaskList />
    </TasksProvider>
  );
}
```

LANGUAGE: javascript
CODE:
```
import { createContext, useContext, useReducer } from 'react';

const TasksContext = createContext(null);
const TasksDispatchContext = createContext(null);

export function TasksProvider({ children }) {
  const [tasks, dispatch] = useReducer(
    tasksReducer,
    initialTasks
  );

  return (
    <TasksContext value={tasks}>
      <TasksDispatchContext value={dispatch}>
        {children}
      </TasksDispatchContext>
    </TasksContext>
  );
}

export function useTasks() {
  return useContext(TasksContext);
}

export function useTasksDispatch() {
  return useContext(TasksDispatchContext);
}

function tasksReducer(tasks, action) {
  switch (action.type) {
    case 'added': {
      return [...tasks, {
        id: action.id,
        text: action.text,
        done: false
      }];
    }
    case 'changed': {
      return tasks.map(t => {
        if (t.id === action.task.id) {
          return action.task;
        } else {
          return t;
        }
      });
    }
    case 'deleted': {
      return tasks.filter(t => t.id !== action.id);
    }
    default: {
      throw Error('Unknown action: ' + action.type);
    }
  }
}

const initialTasks = [
  { id: 0, text: 'Philosopher’s Path', done: true },
  { id: 1, text: 'Visit the temple', done: false },
  { id: 2, text: 'Drink matcha', done: false }
];
```

LANGUAGE: javascript
CODE:
```
import { useState, useContext } from 'react';
import { useTasksDispatch } from './TasksContext.js';

export default function AddTask({ onAddTask }) {
  const [text, setText] = useState('');
  const dispatch = useTasksDispatch();
  return (
    <>
      <input
        placeholder="Add task"
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <button onClick={() => {
        setText('');
        dispatch({
          type: 'added',
          id: nextId++,
          text: text,
        });
      }}>Add</button>
    </>
  );
}

let nextId = 3;
```

LANGUAGE: javascript
CODE:
```
import { useState, useContext } from 'react';
import { useTasks, useTasksDispatch } from './TasksContext.js';

export default function TaskList() {
  const tasks = useTasks();
  return (
    <ul>
      {tasks.map(task => (
        <li key={task.id}>
          <Task task={task} />
        </li>
      ))}
    </ul>
  );
}

function Task({ task }) {
  const [isEditing, setIsEditing] = useState(false);
  const dispatch = useTasksDispatch();
  let taskContent;
  if (isEditing) {
    taskContent = (
      <>
        <input
          value={task.text}
          onChange={e => {
            dispatch({
              type: 'changed',
              task: {
                ...task,
                text: e.target.value
              }
            });
          }} />
        <button onClick={() => setIsEditing(false)}>
          Save
        </button>
      </>
    );
  } else {
    taskContent = (
      <>
        {task.text}
        <button onClick={() => setIsEditing(true)}>
          Edit
        </button>
      </>
    );
  }
  return (
    <label>
      <input
        type="checkbox"
        checked={task.done}
        onChange={e => {
          dispatch({
            type: 'changed',
            task: {
              ...task,
              done: e.target.checked
            }
          });
        }}
      />
      {taskContent}
      <button onClick={() => {
        dispatch({
          type: 'deleted',
          id: task.id
        });
      }}>
        Delete
      </button>
    </label>
  );
}
```

LANGUAGE: css
CODE:
```
button { margin: 5px; }
li { list-style-type: none; }
ul, li { margin: 0; padding: 0; }
```

----------------------------------------

TITLE: Understanding React State Updates with Multiple setNumber Calls (JavaScript)
DESCRIPTION: This React component demonstrates how `setNumber` calls within a single event handler do not immediately update the `number` state for the current render. Despite calling `setNumber(number + 1)` three times, the `number` value used in each call is the state value from the *beginning* of the render, resulting in the counter incrementing by only one per click. It highlights that state updates are batched and applied for the *next* render.
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/learn/state-as-a-snapshot.md#_snippet_2

LANGUAGE: JavaScript
CODE:
```
import { useState } from 'react';

export default function Counter() {
  const [number, setNumber] = useState(0);

  return (
    <>
      <h1>{number}</h1>
      <button onClick={() => {
        setNumber(number + 1);
        setNumber(number + 1);
        setNumber(number + 1);
      }}>+3</button>
    </>
  )
}
```

----------------------------------------

TITLE: ChatRoom Component with useEffect Cleanup
DESCRIPTION: This complete example demonstrates the `ChatRoom` component with a `useEffect` hook that includes a cleanup function. This ensures that the chat connection is properly disconnected when the component unmounts or is remounted, preventing resource leaks and exhibiting correct behavior in both development and production environments.
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/learn/synchronizing-with-effects.md#_snippet_18

LANGUAGE: javascript
CODE:
```
import { useState, useEffect } from 'react';
import { createConnection } from './chat.js';

export default function ChatRoom() {
  useEffect(() => {
    const connection = createConnection();
    connection.connect();
    return () => connection.disconnect();
  }, []);
  return <h1>Welcome to the chat!</h1>;
}
```

LANGUAGE: javascript
CODE:
```
export function createConnection() {
  // A real implementation would actually connect to the server
  return {
    connect() {
      console.log('✅ Connecting...');
    },
    disconnect() {
      console.log('❌ Disconnected.');
    }
  };
}
```

LANGUAGE: css
CODE:
```
input { display: block; margin-bottom: 20px; }
```

----------------------------------------

TITLE: Immutable Update of Nested Object State (JavaScript - Step-by-step)
DESCRIPTION: This JavaScript snippet demonstrates the step-by-step process of immutably updating a nested object property in React. It involves creating new copies of both the nested `artwork` object and the parent `person` object using the spread syntax (`...`) before calling `setPerson` to update the state.
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/learn/updating-objects-in-state.md#_snippet_21

LANGUAGE: js
CODE:
```
const nextArtwork = { ...person.artwork, city: 'New Delhi' };
const nextPerson = { ...person, artwork: nextArtwork };
setPerson(nextPerson);
```

----------------------------------------

TITLE: Immutable Array Update using `map` and Object Spread in React
DESCRIPTION: This code demonstrates the correct, immutable way to update an object within an array in React state. It uses the `map` method to iterate over the array, creating a *new* object for the item that needs updating using the object spread syntax (`{ ...artwork, seen: nextSeen }`), and returning existing objects unchanged. This prevents direct mutation and ensures state isolation.
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/learn/updating-arrays-in-state.md#_snippet_13

LANGUAGE: javascript
CODE:
```
setMyList(myList.map(artwork => {
  if (artwork.id === artworkId) {
    // Create a *new* object with changes
    return { ...artwork, seen: nextSeen };
  } else {
    // No changes
    return artwork;
  }
}));
```

----------------------------------------

TITLE: Refactoring Feedback Form with Single Status State (React)
DESCRIPTION: This React component refactors the feedback form to use a single `status` state variable instead of multiple booleans, preventing contradictory states. The `status` can be `'typing'`, `'sending'`, or `'sent'`. The `handleSubmit` function updates the `status` through these phases. Derived constants `isSending` and `isSent` are computed from `status` for readability, ensuring they always reflect a valid state. This approach improves state management robustness.
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/learn/choosing-the-state-structure.md#_snippet_5

LANGUAGE: JavaScript
CODE:
```
import { useState } from 'react';

export default function FeedbackForm() {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('typing');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('sending');
    await sendMessage(text);
    setStatus('sent');
  }

  const isSending = status === 'sending';
  const isSent = status === 'sent';

  if (isSent) {
    return <h1>Thanks for feedback!</h1>
  }

  return (
    <form onSubmit={handleSubmit}>
      <p>How was your stay at The Prancing Pony?</p>
      <textarea
        disabled={isSending}
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <br />
      <button
        disabled={isSending}
        type="submit"
      >
        Send
      </button>
      {isSending && <p>Sending...</p>}
    </form>
  );
}

// Pretend to send a message.
function sendMessage(text) {
  return new Promise(resolve => {
    setTimeout(resolve, 2000);
  });
}
```

----------------------------------------

TITLE: Pure State Updater Function (Correct) - JavaScript
DESCRIPTION: This snippet demonstrates a pure updater function that correctly updates the state by creating a new array using the spread syntax (`...prevTodos`) instead of mutating the original. This ensures immutability, and even if called twice in Strict Mode, the behavior remains consistent.
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/reference/react/useState.md#_snippet_43

LANGUAGE: js
CODE:
```
setTodos(prevTodos => {
  // ✅ Correct: replacing with new state
  return [...prevTodos, createTodo()];
});
```

----------------------------------------

TITLE: Mutating Object State Directly in React (Incorrect)
DESCRIPTION: This snippet demonstrates an incorrect way to update an object in React state by directly mutating its property (`position.x = 5`). This approach does not trigger a re-render in React.
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/learn/updating-objects-in-state.md#_snippet_3

LANGUAGE: js
CODE:
```
position.x = 5;
```

----------------------------------------

TITLE: Updating State and Triggering Re-renders in React (JavaScript)
DESCRIPTION: This React component demonstrates how state updates trigger re-renders. It uses `useState` for `isSent` and `message`. The `onSubmit` handler prevents default form submission, sets `isSent` to `true` to trigger a re-render, and calls `sendMessage`. The component conditionally renders a message or a form based on the `isSent` state, showcasing how event handlers interact with a snapshot of the state.
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/learn/state-as-a-snapshot.md#_snippet_0

LANGUAGE: JavaScript
CODE:
```
import { useState } from 'react';

export default function Form() {
  const [isSent, setIsSent] = useState(false);
  const [message, setMessage] = useState('Hi!');
  if (isSent) {
    return <h1>Your message is on its way!</h1>
  }
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      setIsSent(true);
      sendMessage(message);
    }}>
      <textarea
        placeholder="Message"
        value={message}
        onChange={e => setMessage(e.target.value)}
      />
      <button type="submit">Send</button>
    </form>
  );
}

function sendMessage(message) {
  // ...
}
```

----------------------------------------

TITLE: Incorrectly Buying Product with React useEffect
DESCRIPTION: This snippet demonstrates an incorrect use of `useEffect` for an action like buying a product. Placing a `fetch` request for `/api/buy` inside `useEffect` with an empty dependency array is problematic because it will execute twice in development (due to Strict Mode) and potentially on back navigation, leading to unintended duplicate purchases. This highlights that actions triggered by user interaction should not be in Effects.
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/learn/synchronizing-with-effects.md#_snippet_28

LANGUAGE: js
CODE:
```
useEffect(() => {
  // 🔴 Wrong: This Effect fires twice in development, exposing a problem in the code.
  fetch('/api/buy', { method: 'POST' });
}, []);
```

----------------------------------------

TITLE: Declaring State with useState in React
DESCRIPTION: This snippet demonstrates the basic syntax for declaring a state variable using the `useState` React Hook. It shows how to destructure the returned array into a state variable (`state`) and its corresponding setter function (`setState`), initialized with `initialState`.
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/reference/react/useState.md#_snippet_0

LANGUAGE: JavaScript
CODE:
```
const [state, setState] = useState(initialState)
```

----------------------------------------

TITLE: Incorrect Dependency: Function as React useEffect Dependency
DESCRIPTION: Illustrates the problem of declaring a function (like `createOptions`) as a direct dependency of `useEffect`. Since functions are re-created on every render by default, this causes the effect to re-run constantly, leading to performance issues and incorrect behavior, such as continuous re-connections.
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/reference/react/useCallback.md#_snippet_20

LANGUAGE: JavaScript
CODE:
```
  useEffect(() => {
    const options = createOptions();
    const connection = createConnection(options);
    connection.connect();
    return () => connection.disconnect();
  }, [createOptions]); // 🔴 Problem: This dependency changes on every render
  // ...

```

----------------------------------------

TITLE: Splitting City and Area Fetching into Separate Effects
DESCRIPTION: Demonstrates the recommended approach of separating unrelated data fetching logic into distinct `useEffect` hooks. One effect fetches cities based on the country, and the other fetches areas based on the selected city, preventing unintended refetches.
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/learn/removing-effect-dependencies.md#_snippet_16

LANGUAGE: js
CODE:
```
function ShippingForm({ country }) {
  const [cities, setCities] = useState(null);
  useEffect(() => {
    let ignore = false;
    fetch(`/api/cities?country=${country}`)
      .then(response => response.json())
      .then(json => {
        if (!ignore) {
          setCities(json);
        }
      });
    return () => {
      ignore = true;
    };
  }, [country]); // ✅ All dependencies declared

  const [city, setCity] = useState(null);
  const [areas, setAreas] = useState(null);
  useEffect(() => {
    if (city) {
      let ignore = false;
      fetch(`/api/areas?city=${city}`)
        .then(response => response.json())
        .then(json => {
          if (!ignore) {
            setAreas(json);
          }
        });
      return () => {
        ignore = true;
      };
    }
  }, [city]); // ✅ All dependencies declared

  // ...
}
```

----------------------------------------

TITLE: Full React Application with Dynamic Chat Room Connection
DESCRIPTION: This comprehensive React application demonstrates a `ChatRoom` component that manages a chat connection using `useEffect`, with both `roomId` (prop) and `serverUrl` (state) as reactive dependencies. The `App` component allows users to dynamically change the `roomId`, showcasing how the `useEffect` re-synchronizes the connection.
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/learn/lifecycle-of-reactive-effects.md#_snippet_17

LANGUAGE: JavaScript
CODE:
```
import { useState, useEffect } from 'react';
import { createConnection } from './chat.js';

function ChatRoom({ roomId }) {
  const [serverUrl, setServerUrl] = useState('https://localhost:1234');

  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId, serverUrl]);

  return (
    <>
      <label>
        Server URL:{' '}
        <input
          value={serverUrl}
          onChange={e => setServerUrl(e.target.value)}
        />
      </label>
      <h1>Welcome to the {roomId} room!</h1>
    </>
  );
}

export default function App() {
  const [roomId, setRoomId] = useState('general');
  return (
    <>
      <label>
        Choose the chat room:{' '}
        <select
          value={roomId}
          onChange={e => setRoomId(e.target.value)}
        >
          <option value="general">general</option>
          <option value="travel">travel</option>
          <option value="music">music</option>
        </select>
      </label>
      <hr />
      <ChatRoom roomId={roomId} />
    </>
  );
}
```

----------------------------------------

TITLE: Implementing React TodoList and NewTodo Components
DESCRIPTION: This snippet defines the main `TodoList` component, which manages the list of to-do items and their visibility, and the `NewTodo` component for adding new items. It demonstrates state management using `useState`, prop passing, and conditional rendering based on todo completion status. The `TodoList` component imports helper functions from `todos.js` for data manipulation and filtering.
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/learn/you-might-not-need-an-effect.md#_snippet_41

LANGUAGE: JavaScript
CODE:
```
import { initialTodos, createTodo, getVisibleTodos } from './todos.js';

export default function TodoList() {
  const [todos, setTodos] = useState(initialTodos);
  const [showActive, setShowActive] = useState(false);
  const visibleTodos = getVisibleTodos(todos, showActive);

  return (
    <>
      <label>
        <input
          type="checkbox"
          checked={showActive}
          onChange={e => setShowActive(e.target.checked)}
        />
        Show only active todos
      </label>
      <NewTodo onAdd={newTodo => setTodos([...todos, newTodo])} />
      <ul>
        {visibleTodos.map(todo => (
          <li key={todo.id}>
            {todo.completed ? <s>{todo.text}</s> : todo.text}
          </li>
        ))}
      </ul>
    </>
  );
}

function NewTodo({ onAdd }) {
  const [text, setText] = useState('');

  function handleAddClick() {
    setText('');
    onAdd(createTodo(text));
  }

  return (
    <>
      <input value={text} onChange={e => setText(e.target.value)} />
      <button onClick={handleAddClick}>
        Add
      </button>
    </>
  );
}
```

----------------------------------------

TITLE: Displaying Time and Color with Clock Component (React JS)
DESCRIPTION: This React functional component, `Clock`, receives `color` and `time` as props. It renders an `<h1>` element displaying the `time` with the specified `color` applied via inline styles. This snippet demonstrates how props are used to customize a component's appearance and content.
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/learn/passing-props-to-a-component.md#_snippet_17

LANGUAGE: js
CODE:
```
export default function Clock({ color, time }) {
  return (
    <h1 style={{ color: color }}>
      {time}
    </h1>
  );
}
```

----------------------------------------

TITLE: Complete React Tic-Tac-Toe Game with Time Travel
DESCRIPTION: This comprehensive JavaScript snippet provides the full implementation of a React Tic-Tac-Toe game, including components for `Square`, `Board`, and `Game`. It incorporates state management for game history, current move tracking, and functions like `handlePlay` and `jumpTo` to enable "time travel" through past game states. It also includes the `calculateWinner` utility.
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/learn/tutorial-tic-tac-toe.md#_snippet_80

LANGUAGE: JavaScript
CODE:
```
import { useState } from 'react';

function Square({value, onSquareClick}) {
  return (
    <button className="square" onClick={onSquareClick}>
      {value}
    </button>
  );
}

function Board({ xIsNext, squares, onPlay }) {
  function handleClick(i) {
    if (calculateWinner(squares) || squares[i]) {
      return;
    }
    const nextSquares = squares.slice();
    if (xIsNext) {
      nextSquares[i] = 'X';
    } else {
      nextSquares[i] = 'O';
    }
    onPlay(nextSquares);
  }

  const winner = calculateWinner(squares);
  let status;
  if (winner) {
    status = 'Winner: ' + winner;
  } else {
    status = 'Next player: ' + (xIsNext ? 'X' : 'O');
  }

  return (
    <>
      <div className="status">{status}</div>
      <div className="board-row">
        <Square value={squares[0]} onSquareClick={() => handleClick(0)} />
        <Square value={squares[1]} onSquareClick={() => handleClick(1)} />
        <Square value={squares[2]} onSquareClick={() => handleClick(2)} />
      </div>
      <div className="board-row">
        <Square value={squares[3]} onSquareClick={() => handleClick(3)} />
        <Square value={squares[4]} onSquareClick={() => handleClick(4)} />
        <Square value={squares[5]} onSquareClick={() => handleClick(5)} />
      </div>
      <div className="board-row">
        <Square value={squares[6]} onSquareClick={() => handleClick(6)} />
        <Square value={squares[7]} onSquareClick={() => handleClick(7)} />
        <Square value={squares[8]} onSquareClick={() => handleClick(8)} />
      </div >
    </>
  );
}

export default function Game() {
  const [xIsNext, setXIsNext] = useState(true);
  const [history, setHistory] = useState([Array(9).fill(null)]);
  const [currentMove, setCurrentMove] = useState(0);
  const currentSquares = history[currentMove];

  function handlePlay(nextSquares) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);
    setXIsNext(!xIsNext);
  }

  function jumpTo(nextMove) {
    setCurrentMove(nextMove);
    setXIsNext(nextMove % 2 === 0);
  }

  const moves = history.map((squares, move) => {
    let description;
    if (move > 0) {
      description = 'Go to move #' + move;
    } else {
      description = 'Go to game start';
    }
    return (
      <li key={move}>
        <button onClick={() => jumpTo(move)}>{description}</button>
      </li>
    );
  });

  return (
    <div className="game">
      <div className="game-board">
        <Board xIsNext={xIsNext} squares={currentSquares} onPlay={handlePlay} />
      </div>
      <div className="game-info">
        <ol>{moves}</ol>
      </div>
    </div>
  );
}

function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}
```

----------------------------------------

TITLE: Understanding State Snapshot Behavior in React Event Handlers
DESCRIPTION: This JavaScript function `handleClick` demonstrates that calling `setCount` does not immediately update the `count` variable within the currently executing function scope. The `count` variable retains its 'snapshot' value from the render that initiated the event handler, even after a state update request. Subsequent `console.log` calls, even within a `setTimeout`, will reflect this old snapshot value.
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/reference/react/useState.md#_snippet_34

LANGUAGE: JavaScript
CODE:
```
function handleClick() {
  console.log(count);  // 0

  setCount(count + 1); // Request a re-render with 1
  console.log(count);  // Still 0!

  setTimeout(() => {
    console.log(count); // Also 0!
  }, 5000);
}
```

----------------------------------------

TITLE: Creating and Rendering Basic React Components - JavaScript
DESCRIPTION: This snippet demonstrates how to define and use basic React components. The `Profile` component renders an image, while the `Gallery` component renders a heading and multiple instances of the `Profile` component, showcasing component reusability. The accompanying CSS styles the image elements.
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/learn/describing-the-ui.md#_snippet_0

LANGUAGE: JavaScript
CODE:
```
function Profile() {
  return (
    <img
      src="https://i.imgur.com/MK3eW3As.jpg"
      alt="Katherine Johnson"
    />
  );
}

export default function Gallery() {
  return (
    <section>
      <h1>Amazing scientists</h1>
      <Profile />
      <Profile />
      <Profile />
    </section>
  );
}
```

LANGUAGE: CSS
CODE:
```
img { margin: 0 10px 10px 0; height: 90px; }
```

----------------------------------------

TITLE: Installing React and React DOM with npm
DESCRIPTION: This command installs the latest React 19 and React DOM packages using npm, ensuring an exact version match for stability. It's the primary step for upgrading an existing React project or setting up a new one with React 19.
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/blog/2024/04/25/react-19-upgrade-guide.md#_snippet_0

LANGUAGE: bash
CODE:
```
npm install --save-exact react@^19.0.0 react-dom@^19.0.0
```

----------------------------------------

TITLE: Calling an Effect Event from useEffect
DESCRIPTION: Shows how to call the declared Effect Event (`onConnected`) from within a `useEffect` Hook. By moving the non-reactive logic into the Effect Event, the `theme` dependency can be removed from the `useEffect` dependency array. Effect Events themselves are not reactive and should not be included in the dependency array.
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/learn/separating-events-from-effects.md#_snippet_15

LANGUAGE: js
CODE:
```
function ChatRoom({ roomId, theme }) {
  const onConnected = useEffectEvent(() => {
    showNotification('Connected!', theme);
  });

  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.on('connected', () => {
      onConnected();
    });
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]); // ✅ All dependencies declared
  // ...
```

----------------------------------------

TITLE: Fetching Data with useEffect (Race Condition Fix) - JavaScript/React
DESCRIPTION: This snippet shows how to fix the race condition in data fetching with `useEffect` by adding a cleanup function. A boolean flag `ignore` is used to prevent `setResults` from being called if a newer request has already been initiated, ensuring only the latest response updates the state.
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/learn/you-might-not-need-an-effect.md#_snippet_30

LANGUAGE: JavaScript
CODE:
```
function SearchResults({ query }) {
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  useEffect(() => {
    let ignore = false;
    fetchResults(query, page).then(json => {
      if (!ignore) {
        setResults(json);
      }
    });
    return () => {
      ignore = true;
    };
  }, [query, page]);

  function handleNextPageClick() {
    setPage(page + 1);
  }
  // ...
}
```

----------------------------------------

TITLE: Correct: Synchronizing time with `useEffect` in React
DESCRIPTION: This example shows the correct way to handle non-idempotent operations like getting the current date in React. By encapsulating `new Date()` within a `useEffect` hook, the operation is moved outside the render phase, ensuring the component remains idempotent while still updating the time dynamically. The `useTime` custom hook manages the state and `setInterval` cleanup.
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/reference/rules/components-and-hooks-must-be-pure.md#_snippet_4

LANGUAGE: js
CODE:
```
import { useState, useEffect } from 'react';

function useTime() {
  // 1. Keep track of the current date's state. `useState` receives an initializer function as its
  //    initial state. It only runs once when the hook is called, so only the current date at the
  //    time the hook is called is set first.
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    // 2. Update the current date every second using `setInterval`.
    const id = setInterval(() => {
      setTime(new Date()); // ✅ Good: non-idempotent code no longer runs in render
    }, 1000);
    // 3. Return a cleanup function so we don't leak the `setInterval` timer.
    return () => clearInterval(id);
  }, []);

  return time;
}

export default function Clock() {
  const time = useTime();
  return <span>{time.toLocaleString()}</span>;
}
```

----------------------------------------

TITLE: React use API for Reading Promises in Render
DESCRIPTION: The `use` API in React 19 enables components to read resources like promises directly within the render function. When `use` encounters a promise, React will suspend rendering until the promise resolves, making it compatible with Suspense boundaries for loading states.
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/blog/2024/12/05/react-19.md#_snippet_7

LANGUAGE: javascript
CODE:
```
import {use} from 'react';

function Comments({commentsPromise}) {
  // `use` will suspend until the promise resolves.
  const comments = use(commentsPromise);
  return comments.map(comment => <p key={comment.id}>{comment}</p>);
}

function Page({commentsPromise}) {
  // When `use` suspends in Comments,
  // this Suspense boundary will be shown.
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Comments commentsPromise={commentsPromise} />
    </Suspense>
  )
}
```

----------------------------------------

TITLE: Demonstrating State Loss with Nested React Component (JavaScript)
DESCRIPTION: This React component demonstrates how nesting a component function (`MyTextField`) inside another component (`MyComponent`) causes state loss. Every time `MyComponent` re-renders (e.g., when the button is clicked), a new `MyTextField` function is created, leading React to treat it as a new component and reset its state. To prevent this, component functions should always be declared at the top level.
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/learn/preserving-and-resetting-state.md#_snippet_10

LANGUAGE: javascript
CODE:
```
import { useState } from 'react';

export default function MyComponent() {
  const [counter, setCounter] = useState(0);

  function MyTextField() {
    const [text, setText] = useState('');

    return (
      <input
        value={text}
        onChange={e => setText(e.target.value)}
      />
    );
  }

  return (
    <>
      <MyTextField />
      <button onClick={() => {
        setCounter(counter + 1)
      }}>Clicked {counter} times</button>
    </>
  );
}
```

----------------------------------------

TITLE: Incorrect State Update in useEffect with Dependency - JavaScript
DESCRIPTION: This snippet demonstrates a common pitfall when updating state within a `useEffect` hook based on its previous value. By including `count` in the dependency array, the effect re-runs and resets the `setInterval` every time `count` changes, which is not the desired behavior for a continuous counter.
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/reference/react/useEffect.md#_snippet_38

LANGUAGE: JavaScript
CODE:
```
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCount(count + 1); // You want to increment the counter every second...
    }, 1000)
    return () => clearInterval(intervalId);
  }, [count]); // 🚩 ... but specifying `count` as a dependency always resets the interval.
  // ...
}
```

----------------------------------------

TITLE: Immutable Update of Nested Object State (JavaScript - Single Call)
DESCRIPTION: This JavaScript snippet shows a more concise way to immutably update a nested object property in React within a single `setPerson` call. It uses nested spread syntax to copy existing properties of both the parent and nested objects, then overrides the specific property (`city`) that needs to be updated.
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/learn/updating-objects-in-state.md#_snippet_22

LANGUAGE: js
CODE:
```
setPerson({
  ...person, // Copy other fields
  artwork: { // but replace the artwork
    ...person.artwork, // with the same one
    city: 'New Delhi' // but in New Delhi!
  }
});
```

----------------------------------------

TITLE: Correct Immutable State Update in a Reducer
DESCRIPTION: This snippet demonstrates the correct way to update state within a reducer function by ensuring immutability. Instead of mutating the original state object, it returns a *new* state object, typically by spreading the previous state and overriding specific properties, like `age`.
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/reference/react/useReducer.md#_snippet_11

LANGUAGE: javascript
CODE:
```
function reducer(state, action) {
  switch (action.type) {
    case 'incremented_age': {
      // ✅ Instead, return a new object
      return {
        ...state,
        age: state.age + 1
      };
    }

```

----------------------------------------

TITLE: Implementing Click Counter with useState in React
DESCRIPTION: This snippet provides a complete example of a `MyButton` component that uses `useState` to implement a click counter. The `handleClick` function updates the `count` state by calling `setCount`, causing the component to re-render and display the new count.
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/learn/index.md#_snippet_19

LANGUAGE: javascript
CODE:
```
function MyButton() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(count + 1);
  }

  return (
    <button onClick={handleClick}>
      Clicked {count} times
    </button>
  );
}
```

----------------------------------------

TITLE: Rendering Multiple Instances of a Component with Independent State in React
DESCRIPTION: This example demonstrates how a single `Counter` component JSX tag, when rendered multiple times at different positions in the render tree, results in two distinct instances, each maintaining its own isolated state for `score` and `hover`. It highlights that state is tied to the component's position, not the component definition itself.
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/learn/preserving-and-resetting-state.md#_snippet_0

LANGUAGE: JavaScript
CODE:
```
import { useState } from 'react';

export default function App() {
  const counter = <Counter />;
  return (
    <div>
      {counter}
      {counter}
    </div>
  );
}

function Counter() {
  const [score, setScore] = useState(0);
  const [hover, setHover] = useState(false);

  let className = 'counter';
  if (hover) {
    className += ' hover';
  }

  return (
    <div
      className={className}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <h1>{score}</h1>
      <button onClick={() => setScore(score + 1)}>
        Add one
      </button>
    </div>
  );
}
```

LANGUAGE: CSS
CODE:
```
label {
  display: block;
  clear: both;
}

.counter {
  width: 100px;
  text-align: center;
  border: 1px solid gray;
  border-radius: 4px;
  padding: 20px;
  margin: 0 20px 20px 0;
  float: left;
}

.hover {
  background: #ffffd8;
}
```

----------------------------------------

TITLE: Accessing `ref` as a Prop in React Function Components
DESCRIPTION: In React 19, function components can now directly receive `ref` as a prop, simplifying `ref` forwarding and eliminating the need for `forwardRef`. This change streamlines component development by allowing direct access to the `ref` within the component's props. A codemod will be provided to assist with automatic updates, and `forwardRef` is slated for deprecation in future versions.
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/blog/2024/12/05/react-19.md#_snippet_10

LANGUAGE: javascript
CODE:
```
function MyInput({placeholder, ref}) {
  return <input placeholder={placeholder} ref={ref} />
}

//...
<MyInput ref={ref} />
```

----------------------------------------

TITLE: Implementing a Basic Counter with useState in React
DESCRIPTION: This snippet demonstrates a complete functional React component that uses `useState` to manage a numerical counter. The `count` state variable is initialized to 0, and the `handleClick` function increments it by calling `setCount(count + 1)`. The component re-renders to display the updated count on a button.
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/reference/react/useState.md#_snippet_6

LANGUAGE: js
CODE:
```
import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(count + 1);
  }

  return (
    <button onClick={handleClick}>
      You pressed me {count} times
    </button>
  );
}
```

----------------------------------------

TITLE: Understanding `useEffect` Dependency Array Behaviors in React
DESCRIPTION: This snippet illustrates the three primary behaviors of the `useEffect` hook based on its dependency array: running after every render (no array), running only on component mount (empty array `[]`), and running on mount and when specified dependencies change (`[a, b]`).
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/learn/synchronizing-with-effects.md#_snippet_11

LANGUAGE: JavaScript
CODE:
```
useEffect(() => {
  // This runs after every render
});

useEffect(() => {
  // This runs only on mount (when the component appears)
}, []);

useEffect(() => {
  // This runs on mount *and also* if either a or b have changed since the last render
}, [a, b]);
```

----------------------------------------

TITLE: Full Example of Multiple Controlled Inputs in React
DESCRIPTION: This comprehensive example combines multiple controlled inputs (text and number) within a single React component. It demonstrates managing separate state variables for each input, handling their `onChange` events, and integrating additional UI elements like a button to modify the numeric input's state, along with conditional rendering based on input values.
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/reference/react-dom/components/input.md#_snippet_10

LANGUAGE: JavaScript
CODE:
```
import { useState } from 'react';

export default function Form() {
  const [firstName, setFirstName] = useState('');
  const [age, setAge] = useState('20');
  const ageAsNumber = Number(age);
  return (
    <>
      <label>
        First name:
        <input
          value={firstName}
          onChange={e => setFirstName(e.target.value)}
        />
      </label>
      <label>
        Age:
        <input
          value={age}
          onChange={e => setAge(e.target.value)}
          type="number"
        />
        <button onClick={() => setAge(ageAsNumber + 10)}>
          Add 10 years
        </button>
      </label>
      {firstName !== '' &&
        <p>Your name is {firstName}.</p>
      }
      {ageAsNumber > 0 &&
        <p>Your age is {ageAsNumber}.</p>
      }
    </>
  );
}
```

----------------------------------------

TITLE: Demonstrating Isolated State for Multiple React Component Instances
DESCRIPTION: This example shows two distinct `Counter` components rendered directly, each managing its own `score` and `hover` state independently. Clicking one counter only updates its specific state, reinforcing the concept that state is isolated per component instance based on its position in the render tree.
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/learn/preserving-and-resetting-state.md#_snippet_1

LANGUAGE: JavaScript
CODE:
```
import { useState } from 'react';

export default function App() {
  return (
    <div>
      <Counter />
      <Counter />
    </div>
  );
}

function Counter() {
  const [score, setScore] = useState(0);
  const [hover, setHover] = useState(false);

  let className = 'counter';
  if (hover) {
    className += ' hover';
  }

  return (
    <div
      className={className}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <h1>{score}</h1>
      <button onClick={() => setScore(score + 1)}>
        Add one
      </button>
    </div>
  );
}
```

LANGUAGE: CSS
CODE:
```
.counter {
  width: 100px;
  text-align: center;
  border: 1px solid gray;
  border-radius: 4px;
  padding: 20px;
  margin: 0 20px 20px 0;
  float: left;
}

.hover {
  background: #ffffd8;
}
```

----------------------------------------

TITLE: Coordinated Data Fetching with React Suspense (Multi-file JavaScript/CSS)
DESCRIPTION: This comprehensive multi-file example illustrates a React application using Suspense for coordinated data fetching. `ArtistPage` uses Suspense to manage the loading states of `Biography` and `Albums`, which fetch data via `use` and a simulated `fetchData` utility. The `App` component controls the visibility of the `ArtistPage`, while `Panel` provides basic styling. All components within the Suspense boundary will appear together after their data is loaded, showcasing the 'reveal together' pattern.
SOURCE: https://github.com/reactjs/react.dev/blob/main/src/content/reference/react/Suspense.md#_snippet_4

LANGUAGE: javascript
CODE:
```
import { useState } from 'react';
import ArtistPage from './ArtistPage.js';

export default function App() {
  const [show, setShow] = useState(false);
  if (show) {
    return (
      <ArtistPage
        artist={{
          id: 'the-beatles',
          name: 'The Beatles',
        }}
      />
    );
  } else {
    return (
      <button onClick={() => setShow(true)}>
        Open The Beatles artist page
      </button>
    );
  }
}
```

LANGUAGE: javascript
CODE:
```
import { Suspense } from 'react';
import Albums from './Albums.js';
import Biography from './Biography.js';
import Panel from './Panel.js';

export default function ArtistPage({ artist }) {
  return (
    <>
      <h1>{artist.name}</h1>
      <Suspense fallback={<Loading />}>
        <Biography artistId={artist.id} />
        <Panel>
          <Albums artistId={artist.id} />
        </Panel>
      </Suspense>
    </>
  );
}

function Loading() {
  return <h2>🌀 Loading...</h2>;
}
```

LANGUAGE: javascript
CODE:
```
export default function Panel({ children }) {
  return (
    <section className="panel">
      {children}
    </section>
  );
}
```

LANGUAGE: javascript
CODE:
```
import {use} from 'react';
import { fetchData } from './data.js';

export default function Biography({ artistId }) {
  const bio = use(fetchData(`/${artistId}/bio`));
  return (
    <section>
      <p className="bio">{bio}</p>
    </section>
  );
}
```

LANGUAGE: javascript
CODE:
```
import {use} from 'react';
import { fetchData } from './data.js';

export default function Albums({ artistId }) {
  const albums = use(fetchData(`/${artistId}/albums`));
  return (
    <ul>
      {albums.map(album => (
        <li key={album.id}>
          {album.title} ({album.year})
        </li>
      ))}
    </ul>
  );
}
```

LANGUAGE: javascript
CODE:
```
// Note: the way you would do data fetching depends on
// the framework that you use together with Suspense.
// Normally, the caching logic would be inside a framework.

let cache = new Map();

export function fetchData(url) {
  if (!cache.has(url)) {
    cache.set(url, getData(url));
  }
  return cache.get(url);
}

async function getData(url) {
  if (url === '/the-beatles/albums') {
    return await getAlbums();
  } else if (url === '/the-beatles/bio') {
    return await getBio();
  } else {
    throw Error('Not implemented');
  }
}

async function getBio() {
  // Add a fake delay to make waiting noticeable.
  await new Promise(resolve => {
    setTimeout(resolve, 1500);
  });

  return `The Beatles were an English rock band, \n    formed in Liverpool in 1960, that comprised \n    John Lennon, Paul McCartney, George Harrison \n    and Ringo Starr.`;
}

async function getAlbums() {
  // Add a fake delay to make waiting noticeable.
  await new Promise(resolve => {
    setTimeout(resolve, 3000);
  });

  return [{
    id: 13,
    title: 'Let It Be',
    year: 1970
  }, {
    id: 12,
    title: 'Abbey Road',
    year: 1969
  }, {
    id: 11,
    title: 'Yellow Submarine',
    year: 1969
  }, {
    id: 10,
    title: 'The Beatles',
    year: 1968
  }, {
    id: 9,
    title: 'Magical Mystery Tour',
    year: 1967
  }, {
    id: 8,
    title: 'Sgt. Pepper\'s Lonely Hearts Club Band',
    year: 1967
  }, {
    id: 7,
    title: 'Revolver',
    year: 1966
  }, {
    id: 6,
    title: 'Rubber Soul',
    year: 1965
  }, {
    id: 5,
    title: 'Help!',
    year: 1965
  }, {
    id: 4,
    title: 'Beatles For Sale',
    year: 1964
  }, {
    id: 3,
    title: 'A Hard Day\'s Night',
    year: 1964
  }, {
    id: 2,
    title: 'With The Beatles',
    year: 1963
  }, {
    id: 1,
    title: 'Please Please Me',
    year: 1963
  }];
}
```

LANGUAGE: css
CODE:
```
.bio { font-style: italic; }

.panel {
  border: 1px solid #aaa;
  border-radius: 6px;
  margin-top: 20px;
  padding: 10px;
}
```