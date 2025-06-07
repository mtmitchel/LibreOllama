import React from 'react';
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
  Plus,
  Settings,
  PanelLeftClose,
  PanelRightClose
} from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';
import { useTheme } from '../../hooks/useTheme';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

// Remove the exported SidebarToggle component

export default function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
  const location = useLocation();
  const { theme } = useTheme();

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
      default:
        return 'Theme';
    }
  };

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
    <aside className={`sidebar ${isOpen ? 'expanded' : 'collapsed'}`}>
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">LO</div>
          {isOpen && <span>LibreOllama</span>}
        </div>
        {/* Ensure this button is the one used for toggling */}
        <button className="action-btn sidebar-toggle-btn-internal" onClick={toggleSidebar} title={isOpen ? "Collapse sidebar" : "Expand sidebar"}>
          {isOpen ? <PanelLeftClose style={{ width: '20px', height: '20px' }} /> : <PanelRightClose style={{ width: '20px', height: '20px' }} />}
        </button>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section">
          {isOpen && <div className="nav-section-title">Workspace</div>}
          {workspaceItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                title={!isOpen ? item.name : undefined}
              >
                <Icon className="nav-item-icon" />
                {isOpen && (
                  <>
                    {item.name}
                    {item.badge && <span className="nav-badge">{item.badge}</span>}
                  </>
                )}
              </Link>
            );
          })}
        </div>
        <div className="nav-section">
          {isOpen && <div className="nav-section-title">Agents</div>}
          {agentItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                title={!isOpen ? item.name : undefined}
              >
                <Icon className="nav-item-icon" />
                {isOpen && (
                  <>
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
                  </>
                )}
              </Link>
            );
          })}
          {isOpen && (
            <Link
              to="/agents"
              className="nav-item nav-item-create"
              title={!isOpen ? 'New agent' : undefined}
            >
              <Plus className="nav-item-icon" />
              New agent
            </Link>
          )}
        </div>
      </nav>
      <div className="sidebar-footer">
        <div className="nav-item" style={{ cursor: 'pointer' }} onClick={() => {
          const themeToggle = document.querySelector('[data-theme-toggle]') as HTMLButtonElement;
          if (themeToggle) themeToggle.click();
        }}>
          <ThemeToggle />
          {isOpen && <span>{getThemeLabel()}</span>}
        </div>
        <Link 
          to="/settings" 
          className={`nav-item ${location.pathname === '/settings' ? 'active' : ''}`}
          title={!isOpen ? 'Settings' : undefined}
        >
          <Settings className="nav-item-icon" />
          {isOpen && <span>Settings</span>}
        </Link>
      </div>
    </aside>
  );
}