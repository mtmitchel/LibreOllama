import { Link, useLocation } from 'react-router-dom';
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
  Settings
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export default function Sidebar() {
  const { theme } = useTheme();
  const location = useLocation();

  const workspaceItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Chat', path: '/chat', icon: MessagesSquare, badge: '3' },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Notes', path: '/notes', icon: NotebookPen },
    { name: 'Canvas', path: '/canvas', icon: Presentation },
    { name: 'Calendar', path: '/calendar', icon: CalendarDays },
    { name: 'Tasks', path: '/tasks', icon: CheckCircle2 },
  ];

  const agentItems = [
    { name: 'General assistant', path: '/agents/general', icon: Cpu, status: 'online' },
    { name: 'Code reviewer', path: '/agents/code', icon: Code2, status: 'offline' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">LO</div>
          <span>LibreOllama</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">Workspace</div>
          {workspaceItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon className="nav-item-icon" />
                {item.name}
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </Link>
            );
          })}
        </div>
        <div className="nav-section">
          <div className="nav-section-title">Agents</div>
          {agentItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon className="nav-item-icon" />
                {item.name}
                <div 
                  style={{
                    width: '8px',
                    height: '8px',
                    background: item.status === 'online' ? 'var(--success)' : 'var(--text-muted)',
                    borderRadius: '50%',
                    marginLeft: 'auto',
                    flexShrink: 0
                  }}
                />
              </Link>
            );
          })}
        </div>
      </nav>
      <div className="sidebar-footer">
        <Link to="#" className="nav-item">
          <Sun className="nav-item-icon" />
          <span>Light mode</span>
        </Link>
        <Link to="#" className="nav-item">
          <Settings className="nav-item-icon" />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}