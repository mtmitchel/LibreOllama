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
    { name: 'Agents', path: '/agents', icon: Cpu },
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
      <div className="flex items-center p-4 h-[73px] border-b border-border-subtle">
        {isOpen && <span className="font-bold text-lg text-text-primary ml-2">LibreOllama</span>}
        <button onClick={toggleSidebar} className="p-2 rounded-md hover:bg-bg-secondary ml-auto">
          {isOpen ? <PanelLeftClose size={20} /> : <PanelRightClose size={20} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <ul className="space-y-1">
          {workspaceItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  title={!isOpen ? item.name : ''}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors 
                    ${isActive ? 'bg-primary text-white' : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'}`}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {isOpen && <span className="flex-1 truncate">{item.name}</span>}
                  {isOpen && item.badge && <span className="text-xs font-bold bg-background text-text-primary rounded-full px-2 py-0.5">{item.badge}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-2 border-t border-border-subtle">
        <Link to="/settings" className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors text-text-secondary hover:bg-bg-secondary hover:text-text-primary`}>
            <Settings size={20} />
            {isOpen && <span>Settings</span>}
        </Link>
      </div>
    </aside>
  );
}