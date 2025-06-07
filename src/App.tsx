import { ThemeProvider } from './components/ThemeProvider';
import { 
  LayoutDashboard,
  MessagesSquare,
  FolderKanban,
  NotebookPen,
  Presentation,
  CalendarDays,
  CheckCircle2,
  Cpu,
  Code2,
  Sun,
  Settings,
  PlusCircle,
  MoreHorizontal,
  GripVertical,
  MessageSquare,
  FilePlus2,
  FolderPlus,
  LayoutTemplate,
  Settings2,
  PanelLeftClose, // Icon for sidebar toggle
  PanelRightClose // Icon for sidebar toggle
} from 'lucide-react';
import './styles/App.css';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Sidebar from './components/navigation/Sidebar';
import Agents from './pages/Agents';
import ChatHub from './pages/Chat';
import Dashboard from './pages/Dashboard';
import Notes from './pages/Notes';
import Tasks from './pages/Tasks';
import Projects from './pages/Projects';
import Canvas from './pages/Canvas';
import Calendar from './pages/Calendar';
import SettingsPage from './pages/Settings'; 
import React, { useState } from 'react'; // Import useState



export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Router>
      <div className={`flex app-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} /> 
        <main className="flex-1 flex flex-col">
          <div className="content-area flex-1">
            <Routes>
              <Route path="/chat" element={<ChatHub />} />
              <Route path="/" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/canvas" element={<Canvas />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}