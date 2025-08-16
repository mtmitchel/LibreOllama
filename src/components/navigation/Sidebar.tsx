import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, 
  MessageSquare, 
  Mail, 
  FolderOpen, 
  FileText, 
  Image, 
  Calendar,
  CheckSquare,
  Users,
  Settings,
  PanelLeft,
  PanelRight,
  Search
} from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

export default function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
  const location = useLocation();

  const workspaceItems = [
    { name: 'Spaces', path: '/', icon: FolderOpen },
    { name: 'Chat', path: '/chat', icon: MessageSquare },
    { name: 'Mail', path: '/mail', icon: Mail },
    { name: 'Notes', path: '/notes', icon: FileText },
    { name: 'Canvas', path: '/canvas', icon: Image },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Agents', path: '/agents', icon: Users },
  ];

  const NavItem = ({ icon: Icon, label, count, path }: { icon: React.ElementType; label: string; count?: number; path: string }) => {
    const isActive = location.pathname === path;
    return (
      <Link
        to={path}
        className={`asana-sidebar-nav-item ${isActive ? 'active' : ''}`}
        data-tooltip={!isOpen ? label : undefined}
      >
        <div className="asana-sidebar-nav-content">
          <div className="asana-sidebar-nav-icon">
            <Icon size={18} />
          </div>
          <span className="asana-sidebar-nav-label">
            {label}
          </span>
        </div>
        {count && (
          <span className="asana-sidebar-nav-badge">
            {count}
          </span>
        )}
      </Link>
    );
  };

  // When collapsed, only show the toggle button
  if (!isOpen) {
    return (
      <div style={{
        width: '40px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <button
          onClick={toggleSidebar}
          className="asana-sidebar-toggle"
          aria-label="Expand sidebar"
          title="Expand sidebar"
        >
          <PanelRight size={18} />
        </button>
      </div>
    );
  }

  return (
    <aside className="asana-sidebar">
      {/* Header */}
      <div className="asana-sidebar-header">
        <div className="asana-sidebar-logo">
          <div className="asana-sidebar-logo-icon">
            <span>L</span>
          </div>
          <span className="asana-sidebar-logo-text">
            LibreOllama
          </span>
        </div>
        <button
          onClick={toggleSidebar}
          className="asana-sidebar-toggle"
          aria-label="Collapse sidebar"
          title="Collapse sidebar"
        >
          <PanelLeft size={18} />
        </button>
      </div>

      {/* Search */}
      <div className="asana-sidebar-search">
        <div className="asana-sidebar-search-box">
          <Search size={16} className="asana-sidebar-search-icon" />
          <label htmlFor="sidebar-search" className="sr-only">Search everywhere</label>
          <input
            id="sidebar-search"
            name="sidebarSearch"
            type="text"
            placeholder="Search everywhere..."
            className="asana-sidebar-search-input"
            aria-label="Search everywhere"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav 
        className="asana-sidebar-nav"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="asana-sidebar-nav-group">
          <div className="asana-sidebar-nav-title">Workspace</div>
          {workspaceItems.map((item) => (
            <NavItem 
              key={item.name}
              icon={item.icon}
              label={item.name}
              count={undefined}
              path={item.path}
            />
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="asana-sidebar-footer">
        <Link
          to="/settings"
          className={`asana-sidebar-settings ${location.pathname === '/settings' ? 'active' : ''}`}
        >
          <Settings size={18} />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}