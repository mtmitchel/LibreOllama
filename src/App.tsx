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
  Settings2
} from 'lucide-react';
import './styles/App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Sidebar from './components/navigation/Sidebar';
import ChatHub from './pages/Chat';
import Dashboard from './pages/Dashboard';
import Notes from './pages/Notes';
import Tasks from './pages/Tasks';

export default function App() {
  return (
    <Router>
      <div className="app-layout">
        <Sidebar />
        <div className="main-content-wrapper">
          <div className="top-bar">
            <div className="breadcrumb">
              <span className="breadcrumb-current">Dashboard</span>
            </div>
            <div className="search-bar">
              <Search className="search-icon" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="search-input"
              />
              <span className="search-kbd">⌘K</span>
            </div>
            <div className="top-bar-actions">
              <button className="action-btn">
                <Bell style={{ width: '20px', height: '20px' }} />
              </button>
              <button className="action-btn">
                <HelpCircle style={{ width: '20px', height: '20px' }} />
              </button>
              <button className="action-btn primary">
                <Plus style={{ width: '20px', height: '20px' }} />
              </button>
            </div>
          </div>
          <div className="content-area">
            <Routes>
              <Route path="/chat" element={<ChatHub />} />
              <Route path="/" element={<Dashboard />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/tasks" element={<Tasks />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}
