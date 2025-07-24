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
  PanelRight
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

export default function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
  const location = useLocation();

  const workspaceItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Chat', path: '/chat', icon: MessageSquare },
    { name: 'Mail', path: '/mail', icon: Mail },
    { name: 'Projects', path: '/projects', icon: FolderOpen },
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
        className={`nav-item rounded-xl transition-all duration-200 ${isActive ? 'active' : ''} ${
          isActive 
            ? 'bg-selected text-selected' 
            : 'text-primary hover:bg-hover'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon 
            size={18} 
            className={`${isActive ? 'text-selected' : 'text-secondary'}`} 
          />
          {isOpen && (
            <span className="text-sm font-medium">
              {label}
            </span>
          )}
        </div>
        {isOpen && count && (
          <span 
            className={`rounded-full px-2 py-1 text-xs font-medium ${
              isActive 
                ? 'bg-accent-primary text-white' 
                : 'bg-tertiary text-tertiary'
            }`}
          >
            {count}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside 
      className="sidebar relative"
      style={{ 
        width: isOpen ? '224px' : '40px',
        height: '100vh',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--border-primary)',
        transition: 'var(--transition-all)',
        backdropFilter: 'blur(10px)'
      }}
    >
      {/* Header */}
      <div 
        className={`flex h-16 items-center ${isOpen ? 'justify-between border-b px-4 gap-4' : 'justify-center px-1'}`}
        style={{ 
          borderBottom: isOpen ? '1px solid var(--border-primary)' : 'none',
          background: 'var(--header-bg)'
        }}
      >
        {isOpen && (
          <div className="flex items-center gap-3 flex-1">
            <div 
              className="flex size-8 items-center justify-center"
              style={{ 
                background: 'var(--accent-primary)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <span 
                className="font-semibold text-white"
                style={{ 
                  fontSize: 'var(--text-sm)', 
                  fontWeight: 'var(--font-semibold)' 
                }}
              >
                L
              </span>
            </div>
            <h1 
              className="font-semibold"
              style={{ 
                fontSize: 'var(--text-lg)', 
                fontWeight: 'var(--font-semibold)',
                color: 'var(--text-primary)' 
              }}
            >
              LibreOllama
            </h1>
          </div>
        )}
        
        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="flex h-8 w-8 items-center justify-center rounded-md transition-all hover:bg-hover shrink-0"
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <PanelLeft size={18} className="text-secondary" />
        </button>
      </div>

      {/* Navigation - only show when open */}
      {isOpen && (
        <>
          <nav 
            className="flex-1 overflow-y-auto p-3"
            role="navigation"
            aria-label="Main navigation"
          >
            <div className="flex-1 space-y-2">
              {workspaceItems.map((item) => (
                <NavItem 
                  key={item.name}
                  icon={item.icon}
                  label={item.name}
                  count={item.count}
                  path={item.path}
                />
              ))}
            </div>
          </nav>

          {/* Settings Section */}
          <div 
            className="border-border-subtle border-t p-3"
            style={{ 
              background: 'var(--header-bg)'
            }}
          >
            <NavItem 
              icon={Settings}
              label="Settings"
              path="/settings"
            />
          </div>
        </>
      )}
    </aside>
  );
}