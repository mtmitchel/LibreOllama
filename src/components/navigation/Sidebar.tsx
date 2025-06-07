import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, MessagesSquare, FolderKanban, NotebookPen, Presentation,
  CalendarDays, CheckCircle2, Cpu, Code2, Plus, Settings, PanelLeftClose, PanelRightClose
} from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';
import { useTheme } from '../../hooks/useTheme';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

export default function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
  const location = useLocation();
  const { theme } = useTheme();

  const getThemeLabel = () => {
    switch (theme) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      default: return 'System';
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

  const footerItems = [
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className={`flex flex-col bg-surface border-r border-border-subtle transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'}`}>
      <div className="flex items-center justify-between p-4 border-b border-border-subtle h-[73px]">
        {isOpen && <span className="font-bold text-lg">LibreOllama</span>}
        <button onClick={toggleSidebar} className="p-2 rounded-md hover:bg-bg-secondary">
          {isOpen ? <PanelLeftClose size={20} /> : <PanelRightClose size={20} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Workspace Section */}
        <div>
          {isOpen && <h3 className="px-2 mb-2 text-xs font-semibold text-text-muted uppercase tracking-wider">Workspace</h3>}
          <ul className="space-y-1">
            {workspaceItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.name}>
                  {/* USE <Link>, NOT <a> */}
                  <Link to={item.path} className={`flex items-center gap-3 p-2 rounded-md transition-colors ${isActive ? 'bg-primary text-white' : 'hover:bg-bg-secondary'}`} title={isOpen ? '' : item.name}>
                    <Icon size={20} />
                    {isOpen && <span className="flex-1">{item.name}</span>}
                    {isOpen && item.badge && <span className="text-xs font-bold bg-bg-primary text-text-primary rounded-full px-2 py-0.5">{item.badge}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        {/* Agents Section */}
        <div>
          {isOpen && <h3 className="px-2 mb-2 text-xs font-semibold text-text-muted uppercase tracking-wider">Agents</h3>}
          <ul className="space-y-1">
            {agentItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <li key={item.name}>
                  <Link to={item.path} className={`flex items-center gap-3 p-2 rounded-md transition-colors ${isActive ? 'bg-primary text-white' : 'hover:bg-bg-secondary'}`} title={isOpen ? '' : item.name}>
                    <Icon size={20} />
                    {isOpen && <span className="flex-1">{item.name}</span>}
                    {isOpen && item.status && (
                      <span className={`w-2 h-2 rounded-full ${item.status === 'online' ? 'bg-success' : 'bg-text-muted'}`}></span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <div className="p-4 border-t border-border-subtle space-y-1">
        {/* Theme Toggle */}
        {isOpen && (
          <div className="p-2 rounded-md hover:bg-bg-secondary flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm">Theme</span>
            </div>
            <ThemeToggle /> 
          </div>
        )}
        {!isOpen && (
            <div className="flex justify-center">
                <ThemeToggle />
            </div>
        )}
        {/* Footer Items */}
        <ul className="space-y-1">
            {footerItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                    <li key={item.name}>
                        <Link to={item.path} className={`flex items-center gap-3 p-2 rounded-md transition-colors ${isActive ? 'bg-primary text-white' : 'hover:bg-bg-secondary'}`} title={isOpen ? '' : item.name}>
                            <Icon size={20} />
                            {isOpen && <span className="flex-1">{item.name}</span>}
                        </Link>
                    </li>
                );
            })}
        </ul>
      </div>
    </aside>
  );
}