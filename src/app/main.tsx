import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
// Import Asana Design System with backwards compatibility
import "../styles/asana-globals.css";
import "../styles/asana-core.css";
import "../styles/asana-layout.css";

// FullCalendar CSS - v6 doesn't require CSS imports as it's built-in

// Temporary: Clear localStorage on app start to remove any persistent mock data
if (typeof window !== 'undefined') {
  const KANBAN_STORAGE_KEY = 'kanban-tasks-data';
  const storedData = localStorage.getItem(KANBAN_STORAGE_KEY);
  if (storedData) {
    console.log('🧹 [CLEANUP] Removing persistent mock data from localStorage...');
    localStorage.removeItem(KANBAN_STORAGE_KEY);
    console.log('✅ [CLEANUP] localStorage cleared successfully');
  }
  
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <App />
);
