import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";

console.log('🔧 [DEBUG] main.tsx loading...');
console.log('🔧 [DEBUG] Document ready state:', document.readyState);

const rootElement = document.getElementById("root");
console.log('🔧 [DEBUG] Root element found:', !!rootElement);

if (!rootElement) {
  console.error('🔧 [ERROR] Root element not found!');
}

try {
  console.log('🔧 [DEBUG] Creating React root...');
  const root = ReactDOM.createRoot(rootElement as HTMLElement);
  
  console.log('🔧 [DEBUG] Rendering app...');
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  );
  console.log('🔧 [DEBUG] App render call completed');
} catch (error) {
  console.error('🔧 [ERROR] Failed to render app:', error);
}
