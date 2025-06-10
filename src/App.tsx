import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HeaderProvider } from './contexts/HeaderContext';
import Sidebar from './components/navigation/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { CommandPalette } from './components/CommandPalette';
import { useCommandPalette } from './hooks/useCommandPalette';

// Import styles
import './styles/canvas-text-editor.css';

// Import all page components
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import { Projects } from './pages/Projects';
import Notes from './pages/Notes';
import Canvas from './pages/Canvas';
import Calendar from './pages/Calendar';
import Tasks from './pages/Tasks';
import Agents from './pages/Agents';
import Settings from './pages/Settings';

/**
 * MainLayout is the standard component for all pages EXCEPT the canvas.
 * It includes the main content area with padding and overflow control.
 */
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-background">
      {children}
    </main>
  );
};

/**
 * AppContent handles the conditional rendering of the layout based on the current route.
 */
const AppContent: React.FC = () => {
  const location = useLocation();
  const isCanvasPage = location.pathname === '/canvas';

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar />
      
      {/* ARCHITECTURAL FIX: Conditionally render the layout. */}
      {/* If it's the canvas page, render it directly to give it full control. */}
      {/* Otherwise, wrap the content in the standard MainLayout. */}
      {isCanvasPage ? (
        <Routes>
          <Route path="/canvas" element={<Canvas />} />
        </Routes>
      ) : (
        <MainLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </MainLayout>
      )}
    </div>
  );
};

export default function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { isOpen, close } = useCommandPalette();

  return (
    <Router>
      <HeaderProvider>
        <div className="flex h-screen bg-bg-primary text-text-primary font-sans">
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
          <AppContent />
          <CommandPalette isOpen={isOpen} onClose={close} />
        </div>
      </HeaderProvider>
    </Router>
  );
}