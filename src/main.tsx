import React from "react";
import { createRoot } from "react-dom/client";
import { enableMapSet } from "immer";
import App from "./App";
import { ThemeProvider } from "./components/ThemeProvider";
import "./design-system/globals.css";
import "./styles/App.css";

// Enable Immer MapSet plugin to support Map and Set data structures
enableMapSet();

import { useStrictMode } from 'react-konva';

useStrictMode(true);

createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
