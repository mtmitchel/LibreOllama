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
        className={`flex h-16 items-center ${isOpen ? 'justify-between gap-4 border-b px-4' : 'justify-center px-1'}`}
        style={{ 
          borderBottom: isOpen ? '1px solid var(--border-primary)' : 'none',
          background: 'var(--header-bg)'
        }}
      >
        {isOpen && (
          <div className="flex flex-1 items-center gap-3">
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
          className="flex size-8 shrink-0 items-center justify-center rounded-md transition-all hover:bg-hover"
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <PanelLeft size={18} className="text-secondary" />
        </button>
      </div>

      {/* Navigation - only show when open */}
      {isOpen && (
        <>
          {/* Global Search */}
          <div className="border-b p-3" style={{ borderColor: 'var(--border-primary)' }}>
            <div className="relative">
              <Search 
                size={16} 
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" 
              />
              <input
                type="text"
                placeholder="Search everywhere..."
                className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--accent-primary)';
                  e.target.style.boxShadow = '0 0 0 3px var(--accent-primary-alpha)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-default)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border bg-surface px-1.5 py-0.5 text-xs text-tertiary">
                ⌘K
              </kbd>
            </div>
          </div>

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
                  count={undefined}
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