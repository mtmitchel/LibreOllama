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
  Settings
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

export default function Sidebar({ isOpen }: SidebarProps) {
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
      className="sidebar"
      style={{ 
        width: isOpen ? '224px' : '64px',
        height: '100vh',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--border-primary)',
        transition: 'var(--transition-all)',
        backdropFilter: 'blur(10px)'
      }}
    >
      {/* Header */}
      <div 
        className={`flex h-16 items-center border-b ${isOpen ? 'px-6' : 'px-4'}`}
        style={{ 
          borderBottom: '1px solid var(--border-primary)',
          background: 'var(--header-bg)',
          justifyContent: isOpen ? 'flex-start' : 'center'
        }}
      >
        {isOpen ? (
          <div className="flex items-center gap-3">
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
        ) : (
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
        )}
      </div>

      {/* Navigation */}
      <nav 
        className={`flex-1 overflow-y-auto ${isOpen ? 'p-3' : 'p-2'}`}
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
        className={`border-border-subtle border-t ${isOpen ? 'p-3' : 'p-2'}`}
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
    </aside>
  );
}