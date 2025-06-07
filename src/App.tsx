import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { HeaderProvider } from './contexts/HeaderContext';

// CORE LAYOUT
import Sidebar from './components/navigation/Sidebar';
import { UnifiedHeader } from './components/ui/UnifiedHeader';

// ALL PAGE COMPONENTS
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Projects from './pages/Projects';
import Notes from './pages/Notes';
import Canvas from './pages/Canvas';
import Calendar from './pages/Calendar';
import Tasks from './pages/Tasks';
import Agents from './pages/Agents';
import Settings from './pages/Settings';

// A helper to get the page title from the current URL
const getPageTitle = (pathname: string) => {
  const path = pathname.split('/').filter(p => p)[0] || 'dashboard';
  return path.charAt(0).toUpperCase() + path.slice(1);
};

interface AppProps {
  pageTitle: string;
}

function App({ pageTitle }: AppProps) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-background text-text-primary font-sans">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <UnifiedHeader title={pageTitle} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
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
}

const AppWrapper = () => {
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);

  return (
    <HeaderProvider>
      <App pageTitle={pageTitle} />
    </HeaderProvider>
  );
};

export default AppWrapper;