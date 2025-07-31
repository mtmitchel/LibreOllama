import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HeaderProvider } from './contexts/HeaderContext';
import { ThemeProvider } from '../components/ThemeProvider';
import Sidebar from '../components/navigation/Sidebar';
// Removed UnifiedHeader - each page manages its own header/actions
import { CommandPalette } from '../components/CommandPalette';
import { TextSelectionDetector } from '../components/ai/TextSelectionDetector';
import { useCommandPalette } from '../core/hooks/useCommandPalette';
import { useInitializeSettings } from '../stores/settingsStore';
import { MailStoreProvider } from '../features/mail/components/MailStoreProvider';
import { queryClient } from '../config/queryClient';

// Import all page components
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Mail from './pages/Mail';
import { Projects } from './pages/Projects';
import Notes from './pages/Notes';
import CanvasPage from './pages/Canvas';
import Calendar from './pages/Calendar';
import CalendarAsanaStyle from './pages/CalendarAsanaStyle';
import CalendarExperiment from './pages/CalendarExperiment';
import Tasks from './pages/TasksAsanaClean';
// import TasksOld from './pages/TasksAsanaClean';
// import TasksRedesigned from './pages/TasksRedesigned';
// import TasksAsanaStyle from './pages/TasksAsanaStyle';
import Agents from './pages/Agents';
import Settings from './pages/Settings';

/**
 * AppContent defines the main content area and routing for the application.
 * Each page component is responsible for its own internal layout and padding.
 */
const AppContent: React.FC<{ isSidebarOpen: boolean }> = ({ isSidebarOpen }) => {
  return (
    <main 
      role="main" 
      className="h-full overflow-y-auto bg-page"
      aria-label="Main content"
    >
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/mail" element={<Mail />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/canvas" element={<CanvasPage />} />
        <Route path="/calendar" element={<CalendarAsanaStyle />} />
        <Route path="/calendar-old" element={<Calendar />} />
        <Route path="/calendar-experiment" element={<CalendarExperiment />} />
        <Route path="/tasks" element={<Tasks />} />
        {/* <Route path="/tasks-redesigned" element={<TasksRedesigned />} />
        <Route path="/tasks-asana" element={<TasksAsanaStyle />} /> */}
        <Route path="/agents" element={<Agents />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </main>
  );
};

export default function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { isOpen, close } = useCommandPalette();
  const initializeSettings = useInitializeSettings();

  useEffect(() => {
    initializeSettings();
  }, [initializeSettings]);


  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router>
          <HeaderProvider>
            <MailStoreProvider>
              <TextSelectionDetector>
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
              
              <div id="main-content" className="min-w-0 flex-1 flex flex-col">
                <AppContent isSidebarOpen={isSidebarOpen} />
              </div>
              
              <CommandPalette isOpen={isOpen} onClose={close} />
              </div>
            </TextSelectionDetector>
          </MailStoreProvider>
        </HeaderProvider>
      </Router>
    </ThemeProvider>
    {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}