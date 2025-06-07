import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// Core Layout & UI Components
import Sidebar from './components/navigation/Sidebar';
import { UnifiedHeader } from './components/ui/UnifiedHeader';

// Context Providers
import { HeaderProvider, useHeader } from './contexts/HeaderContext';

// Page Components
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Projects from './pages/Projects';
import Notes from './pages/Notes';
import Canvas from './pages/Canvas';
import Calendar from './pages/Calendar';
import Tasks from './pages/Tasks';
import Agents from './pages/Agents';
import Settings from './pages/Settings';

// Hooks
import { useFocusMode } from './hooks/useFocusMode';

// Styles
import './styles/App.css';

/**
 * A helper hook that dynamically determines the page title based on the current route.
 * This ensures the title is always calculated within the Router's context.
 */
const usePageTitle = () => {
  const location = useLocation();
  // Cleans up the path and capitalizes it for display
  const path = location.pathname.replace('/', '') || 'dashboard';
  const formattedPath = path.charAt(0).toUpperCase() + path.slice(1);
  return formattedPath;
};

/**
 * The main content component that renders the header and routes.
 * This component is within the Router context and can use the usePageTitle hook.
 */
const AppContent = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { isFocusMode } = useFocusMode();
  const pageTitle = usePageTitle(); // Get the title string from the hook
  const { headerProps } = useHeader(); // Get page-specific header props

  // Merge page title with page-specific props, giving precedence to page-specific title
  const mergedHeaderProps = {
    title: headerProps.title || pageTitle,
    ...headerProps
  };

  return (
    <div className={`flex h-screen bg-bg-primary text-text-primary font-sans ${isFocusMode ? 'focus-mode-active' : ''}`}>
      
      {/* SIBLING 1: The persistent sidebar. It is a direct child of the main flex container. */}
      {!isFocusMode && <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />}

      {/* SIBLING 2: The main content column. It is a flex column that takes all remaining space. */}
      <div className="flex flex-1 flex-col overflow-hidden">
        
        {/* The application header, rendered once at the top of the main content column. */}
        <UnifiedHeader {...mergedHeaderProps} />
        
        {/* The main content area where pages are rendered. It handles its own scrolling. */}
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/canvas" element={<Canvas />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

/**
 * The root component of the application.
 * Establishes the main layout: a flex container holding the sidebar and the main content view.
 * This structure is the single source of truth for the application's global layout.
 */
export default function App() {
  return (
    <Router>
      <HeaderProvider>
        <AppContent />
      </HeaderProvider>
    </Router>
  );
}