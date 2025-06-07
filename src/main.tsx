import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom"; // Import Router
import AppWrapper from "./App.tsx"; // This now imports the AppWrapper component directly
import { ThemeProvider } from "./components/ThemeProvider";
import "./styles/design-system.css";
import "./styles/App.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Router> {/* Router is now explicitly at the top level here */}
      <ThemeProvider>
        <AppWrapper />
      </ThemeProvider>
    </Router>
  </React.StrictMode>,
);
