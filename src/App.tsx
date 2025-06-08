import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HeaderProvider } from './contexts/HeaderContext';
import Sidebar from './components/navigation/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { CommandPalette } from './components/CommandPalette';
import { useCommandPalette } from './hooks/useCommandPalette';

// ALL PAGE COMPONENTS
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import { Projects } from './pages/Projects';
import Notes from './pages/Notes';
import Canvas from './pages/Canvas';
import Calendar from './pages/Calendar';
import Tasks from './pages/Tasks';
import Agents from './pages/Agents';
import Settings from './pages/Settings';

export default function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { isOpen, close } = useCommandPalette();

  return (
    <Router>
      <HeaderProvider>
        <div className="flex h-screen bg-bg-primary text-text-primary font-sans">
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-y-auto bg-background">
              <Routes>
                <Route path="/" element={<div className="p-6 lg:p-8"><Dashboard /></div>} />
                <Route path="/chat" element={<div className="p-6 lg:p-8"><Chat /></div>} />
                <Route path="/projects" element={<div className="p-6 lg:p-8"><Projects /></div>} />
                <Route path="/notes" element={<div className="p-6 lg:p-8"><Notes /></div>} />
                <Route path="/canvas" element={<Canvas />} />
                <Route path="/calendar" element={<div className="p-6 lg:p-8"><Calendar /></div>} />
                <Route path="/tasks" element={<div className="p-6 lg:p-8"><Tasks /></div>} />
                <Route path="/agents" element={<div className="p-6 lg:p-8"><Agents /></div>} />
                <Route path="/settings" element={<div className="p-6 lg:p-8"><Settings /></div>} />
              </Routes>
            </main>
          </div>
          <CommandPalette isOpen={isOpen} onClose={close} />
        </div>
      </HeaderProvider>
    </Router>
  );
}