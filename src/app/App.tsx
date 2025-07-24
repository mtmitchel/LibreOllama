import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HeaderProvider } from './contexts/HeaderContext';
import { ThemeProvider } from '../components/ThemeProvider';
import Sidebar from '../components/navigation/Sidebar';
import { UnifiedHeader } from '../components/layout/UnifiedHeader';
import { CommandPalette } from '../components/CommandPalette';
import { useCommandPalette } from '../core/hooks/useCommandPalette';
import { StagewiseToolbar } from '@stagewise/toolbar-react';
import { useInitializeSettings } from '../stores/settingsStore';
import { MailStoreProvider } from '../features/mail/components/MailStoreProvider';

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
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <header role="banner">
        <UnifiedHeader />
      </header>
      <main 
        role="main" 
        className="flex-1 overflow-y-auto bg-page"
        aria-label="Main content"
      >
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/mail" element={<Mail />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/canvas" element={<CanvasPage />} />
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
  const initializeSettings = useInitializeSettings();

  useEffect(() => {
    initializeSettings();
  }, [initializeSettings]);

  // Load test utilities in development
  useEffect(() => {
    if (import.meta.env.DEV) {
      import('../tests/integration/auth-persistence-test').catch(console.error);
    }
  }, []);

  return (
    <ThemeProvider>
      <Router>
        <HeaderProvider>
          <MailStoreProvider>
            <div className="flex h-screen bg-page font-sans text-primary">
            {/* Skip to main content link for keyboard users */}
            <a 
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-accent-primary focus:px-4 focus:py-2 focus:text-white focus:outline-none"
            >
              Skip to main content
            </a>
            
            <nav role="navigation" aria-label="Main navigation">
              <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
            </nav>
            
            <div id="main-content" className="min-w-0 flex-1">
              <AppContent isSidebarOpen={isSidebarOpen} />
            </div>
            
            <CommandPalette isOpen={isOpen} onClose={close} />
            
            <StagewiseToolbar
              config={{
                plugins: [],
              }}
            />
          </div>
          </MailStoreProvider>
        </HeaderProvider>
      </Router>
    </ThemeProvider>
  );
}