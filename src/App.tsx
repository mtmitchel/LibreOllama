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
  ChevronRight,
  Search,
  Plus,
  Bell,
  HelpCircle,
  PlusCircle,
  MoreHorizontal,
  GripVertical,
  MessageSquare,
  FilePlus2,
  FolderPlus,
  LayoutTemplate,
  Settings2,
  Eye, 
  EyeOff,
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
import { useFocusMode } from './hooks/useFocusMode'; 
import React, { useState, useEffect } from 'react'; // Import useState and useEffect

// Helper component to get breadcrumb name
const Breadcrumb = () => {
  const location = useLocation();
  const path = location.pathname.replace('/', '');
  const name = path.charAt(0).toUpperCase() + path.slice(1) || 'Dashboard';
  return (
    <>
      <span className="breadcrumb-base">Workspace</span>
      <ChevronRight className="breadcrumb-separator" size={16} />
      <span className="breadcrumb-current">{name}</span>
    </>
  );
};

export default function App() {
  const { isFocusMode, toggleFocusMode } = useFocusMode();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Close sidebar when focus mode is activated
  useEffect(() => {
    if (isFocusMode && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [isFocusMode, isSidebarOpen]);

  return (
    <Router>
      <div className={`app-container ${isFocusMode ? 'focus-mode-active' : ''} ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {!isFocusMode && <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />} 
        <div className="page-column">
          <div className="main-content-wrapper">
            <div className="top-bar">
              <div className="top-bar-left">
                {!isFocusMode && (
                  <div className="breadcrumb">
                    <Breadcrumb />
                  </div>
                )}
              </div>

              {!isFocusMode && (
                <div className="search-bar">
                  <Search className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    className="search-input"
                  />
                  <span className="search-kbd">⌘K</span>
                </div>
              )}

              <div className="top-bar-actions">
                <button className="action-btn focus-mode-toggle-btn" onClick={toggleFocusMode}> 
                  {isFocusMode ? <EyeOff style={{ width: '20px', height: '20px' }} /> : <Eye style={{ width: '20px', height: '20px' }} />}
                </button>
                {!isFocusMode && (
                  <>
                    <button className="action-btn">
                      <Bell style={{ width: '20px', height: '20px' }} />
                    </button>
                    <button className="action-btn">
                      <HelpCircle style={{ width: '20px', height: '20px' }} />
                    </button>
                    <button className="action-btn primary">
                      <Plus style={{ width: '20px', height: '20px' }} />
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="content-area">
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
          </div>
        </div>
      </div>
    </Router>
  );
}