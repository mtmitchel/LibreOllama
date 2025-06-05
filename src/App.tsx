import { useState } from 'react';
import './App.css';
import { UnifiedWorkspace, WorkflowState } from "./components/UnifiedWorkspace";
import { ThemeProvider } from "./components/ui/theme-provider";
import { Toaster } from "./components/ui/toaster";

function AppContent() {
  const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowState>('dashboard');
  const [focusMode, setFocusMode] = useState(false);

  const handleWorkflowChange = (workflow: WorkflowState) => {
    setCurrentWorkflow(workflow);
  };

  const toggleFocusMode = () => {
    setFocusMode(!focusMode);
  };

  const openCommandPalette = () => {
    // Command palette logic - could open a modal or trigger global search
    console.log('Opening command palette...');
  };

  return (
    <div className={`flex h-screen bg-background-primary text-text-primary antialiased overflow-x-hidden ${focusMode ? 'focus-mode' : ''}`}>
      <UnifiedWorkspace 
        currentWorkflow={currentWorkflow} 
        onWorkflowChange={handleWorkflowChange}
        focusMode={focusMode}
        onToggleFocusMode={toggleFocusMode}
        onOpenCommandPalette={openCommandPalette}
      />
      <Toaster />
    </div>
  );
}

function App() {
  return (
    // ThemeProvider now manages its default theme internally (set to 'light')
    // No need to pass theme from App.tsx's old state here
    <ThemeProvider storageKey="vite-ui-theme">
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
