import React from "react";
import { createRoot } from "react-dom/client";
import { enableMapSet } from "immer";
import App from "./App";
import { ThemeProvider } from "./components/ThemeProvider";
import "./styles/design-system.css";
import "./styles/App.css";

// Enable Immer MapSet plugin to support Map and Set data structures
enableMapSet();

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
