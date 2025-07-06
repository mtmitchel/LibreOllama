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
import { GmailAuthCallback } from '../features/mail/components/GmailAuthCallback';

/**
 * AppContent defines the main content area and routing for the application.
 * Each page component is responsible for its own internal layout and padding.
 */
const AppContent: React.FC<{ isSidebarOpen: boolean }> = ({ isSidebarOpen }) => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar />
      <main className="flex-1 overflow-y-auto bg-[var(--bg-primary)]">
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
          <Route path="/auth/gmail/callback" element={<GmailAuthCallback />} />
          
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
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
            <AppContent isSidebarOpen={isSidebarOpen} />
            <CommandPalette isOpen={isOpen} onClose={close} />
          </div>
        </HeaderProvider>
      </Router>
    </ThemeProvider>
  );
}