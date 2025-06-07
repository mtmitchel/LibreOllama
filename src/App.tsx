import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/navigation/Sidebar';
import { UnifiedHeader } from './components/ui'; // Ensure this path is correct
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Projects from './pages/Projects';
import Notes from './pages/Notes';
import Canvas from './pages/Canvas';
import Calendar from './pages/Calendar';
import Tasks from './pages/Tasks';
import Agents from './pages/Agents';
import Settings from './pages/Settings';
import { useFocusMode } from './hooks/useFocusMode';
import './styles/App.css';

const PageTitle = () => {
  const location = useLocation();
  const path = location.pathname.replace('/', '');
  return path.charAt(0).toUpperCase() + path.slice(1) || 'Dashboard';
};

export default function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { isFocusMode, toggleFocusMode } = useFocusMode();

  return (
    <Router>
      <div className={`flex h-screen bg-bg-primary text-text-primary font-sans ${isFocusMode ? 'focus-mode-active' : ''}`}>
        
        {/* SIBLING 1: The Sidebar */}
        {!isFocusMode && <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />}

        {/* SIBLING 2: The Main Content Column */}
        <div className="flex flex-1 flex-col overflow-hidden">
          
          <UnifiedHeader
            title={<PageTitle />}
            // Pass any other necessary props to UnifiedHeader here
          />
          
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
    </Router>
  );
}