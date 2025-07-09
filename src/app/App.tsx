import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HeaderProvider } from './contexts/HeaderContext';
import { ThemeProvider } from '../components/ThemeProvider';
import Sidebar from '../components/navigation/Sidebar';
import { TopBar } from '../components/layout/TopBar';
import { CommandPalette } from '../components/CommandPalette';
import { useCommandPalette } from '../core/hooks/useCommandPalette';

// Import all page components
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Mail from './pages/Mail';
import { Projects } from './pages/Projects';
import Notes from './pages/Notes';
import CanvasPage from './pages/Canvas';
import Calendar from './pages/Calendar';
import Tasks from './pages/Tasks';
import Agents from './pages/Agents';
import Settings from './pages/Settings';

/**
 * AppContent defines the main content area and routing for the application.
 * Each page component is responsible for its own internal layout and padding.
 */
const AppContent: React.FC<{ isSidebarOpen: boolean }> = ({ isSidebarOpen }) => {
  return (
    <div className="h-full flex-1 flex flex-col overflow-hidden">
      <header role="banner">
        <TopBar />
      </header>
      <main 
        role="main" 
        className="flex-1 overflow-y-auto bg-[var(--bg-primary)]"
        aria-label="Main content"
      >
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/mail" element={<Mail />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/canvas" element={<CanvasPage appSidebarOpen={isSidebarOpen} />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/settings" element={<Settings />} />
          
        </Routes>
      </main>
    </div>
  );
};

export default function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { isOpen, close } = useCommandPalette();

  return (
    <ThemeProvider>
      <Router>
        <HeaderProvider>
          <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans">
            {/* Skip to main content link for keyboard users */}
            <a 
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--accent-primary)] focus:text-white focus:rounded focus:outline-none"
            >
              Skip to main content
            </a>
            
            <nav role="navigation" aria-label="Main navigation">
              <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
            </nav>
            
            <div id="main-content" className="flex-1 min-w-0">
              <AppContent isSidebarOpen={isSidebarOpen} />
            </div>
            
            <CommandPalette isOpen={isOpen} onClose={close} />
          </div>
        </HeaderProvider>
      </Router>
    </ThemeProvider>
  );
}