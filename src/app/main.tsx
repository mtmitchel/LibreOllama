import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "../core/design-system/globals.css";

// FullCalendar CSS - v6 doesn't require CSS imports as it's built-in

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
