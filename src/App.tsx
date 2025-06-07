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
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
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
import { useState } from 'react'; // Import useState



export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <Router>
      <div className="flex h-screen bg-bg-primary text-text-primary font-sans">
        {/* Sidebar as the first flex item */}
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        {/* Main content area as the second flex item, taking up remaining space */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* UnifiedHeader can be dynamic per route, but for now use a static title */}
          {/* If you want dynamic titles, use a context or pass props from each page */}
          {/* <UnifiedHeader title="Workspace" /> */}
          {/* Main content area with padding and scroll */}
          <main className="flex-1 overflow-y-auto p-6 bg-background">
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
          </main>
        </div>
      </div>
    </Router>
  );
}