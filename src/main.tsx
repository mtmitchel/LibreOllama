import React from "react";
import ReactDOM from "react-dom/client";
// Import PIXI setup first to ensure extend() is called before any PIXI components are used
import "./lib/pixi-setup";
import App from "./App.tsx";
import { ThemeProvider } from "./components/ThemeProvider";
import "./styles/design-system.css";
import "./styles/App.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
