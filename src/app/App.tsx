import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../components/ui';
import { HeaderProvider } from './contexts/HeaderContext';
import { ThemeProvider } from '../components/ThemeProvider';
import Sidebar from '../components/navigation/Sidebar';
// Removed UnifiedHeader - each page manages its own header/actions
import { CommandPalette } from '../components/CommandPalette';
import { TextSelectionDetector } from '../components/ai/TextSelectionDetector';
import { useCommandPalette } from '../core/hooks/useCommandPalette';
import { useInitializeSettings } from '../stores/settingsStore';
import { MailStoreProvider } from '../features/mail/components/MailStoreProvider';
import { LinkPreviewProvider } from '../components/providers/LinkPreviewProvider';
import { queryClient } from '../config/queryClient';
import { invoke } from '@tauri-apps/api/core';
import { deferredGmailSync } from '../core/lib/deferredGmailSync';

// Import all page components
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Mail from './pages/Mail';
import { Projects } from './pages/Projects';
import Spaces from './pages/Spaces';
import SpaceDetail from './pages/SpaceDetail';
import Notes from './pages/Notes';
import CanvasPage from './pages/Canvas';
import CalendarCustom from './pages/CalendarCustom';
import Tasks from './pages/TasksAsanaClean';
import { ReaderView } from './pages/ReaderView';
import { BrowserControlPage } from './pages/BrowserControlPage';
import { BrowserShellPage } from './pages/BrowserShellPage';
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
    <Routes>
      <Route path="/" element={<Spaces />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/mail" element={<Mail />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/spaces" element={<Spaces />} />
      <Route path="/spaces/:spaceId" element={<SpaceDetail />} />
      <Route path="/notes" element={<Notes />} />
      <Route path="/canvas" element={<CanvasPage />} />
      {/* Custom Calendar Implementation */}
      <Route path="/calendar" element={<CalendarCustom />} />
      <Route path="/tasks" element={<Tasks />} />
      {/* <Route path="/tasks-redesigned" element={<TasksRedesigned />} />
      <Route path="/tasks-asana" element={<TasksAsanaStyle />} /> */}
      <Route path="/agents" element={<Agents />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/reader" element={<ReaderView />} />
      <Route path="/browser-control" element={<BrowserControlPage />} />
      <Route path="/browser-shell" element={<BrowserShellPage />} />
    </Routes>
  );
};

export default function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { isOpen, close } = useCommandPalette();
  const initializeSettings = useInitializeSettings();
  const isShellRoute = typeof window !== 'undefined' && (
    window.location.pathname === '/browser-shell' ||
    window.location.pathname === '/browser-control' ||
    window.location.pathname === '/reader' ||
    (!!window.location.hash && (
      window.location.hash.includes('/browser-shell') ||
      window.location.hash.includes('/browser-control') ||
      window.location.hash.includes('/reader')
    ))
  );

  useEffect(() => {
    initializeSettings();
    
    // Initialize deferred Gmail sync (will wait for canvas-ready event)
    deferredGmailSync.initializeGmailSync();
    
    // Check and run database migrations on startup (desktop only)
    const runMigrations = async () => {
      try {
        const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__;
        if (!isTauri) {
          console.log('Skipping database migrations: not running in Tauri environment');
          return;
        }
        console.log('Checking database migrations...');
        await invoke('force_run_migrations');
        console.log('Database migrations completed');
      } catch (error) {
        console.error('Failed to run database migrations:', error);
      }
    };
    
    runMigrations();
  }, [initializeSettings]);


  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
        <Router>
          <HeaderProvider>
            <MailStoreProvider>
              <LinkPreviewProvider>
                <TextSelectionDetector>
                  <div className="app-container">
                    {!isShellRoute && (
                      <a 
                        href="#main-content"
                        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-accent-primary focus:px-4 focus:py-2 focus:text-white focus:outline-none"
                      >
                        Skip to main content
                      </a>
                    )}
                    {!isShellRoute && (
                      <nav role="navigation" aria-label="Main navigation">
                        <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
                      </nav>
                    )}
                    <div id="main-content" className="min-w-0 flex-1 flex flex-col">
                      <AppContent isSidebarOpen={isSidebarOpen} />
                    </div>
                    {!isShellRoute && <CommandPalette isOpen={isOpen} onClose={close} />}
                  </div>
              </TextSelectionDetector>
            </LinkPreviewProvider>
          </MailStoreProvider>
        </HeaderProvider>
      </Router>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}