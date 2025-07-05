import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, MessagesSquare, FolderKanban, NotebookPen, Presentation,
  CalendarDays, CheckCircle2, Cpu, Settings, PanelLeftClose, PanelRightClose
} from 'lucide-react';
import { Text, Badge, Button } from '../ui';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

export default function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
  const location = useLocation();

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

  const linkBaseClasses = 'group flex items-center rounded-md font-sans transition-all duration-200 relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2';
  const linkActiveClasses = 'bg-accent-ghost text-accent-primary font-semibold shadow-sm';
  const linkInactiveClasses = 'text-secondary hover:bg-[var(--bg-tertiary)] hover:text-primary hover:shadow-sm active:bg-tertiary';

  return (
    <aside 
      className={`flex flex-col bg-[var(--bg-secondary)] border-r border-border-subtle transition-all duration-300 ease-in-out shadow-lg`}
      style={{ width: isOpen ? '16rem' : '4rem' }}
    >
      {/* Header */}
      <div 
        className={`flex items-center justify-between border-b border-border-subtle bg-[var(--bg-primary)] min-h-[73px] ${isOpen ? 'p-4' : 'p-3'}`}
      >
        {isOpen && (
          <Text 
            weight="bold" 
            size="lg" 
            variant="body"
            className="text-primary select-none"
          >
            LibreOllama
          </Text>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="shrink-0 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]"
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isOpen ? <PanelLeftClose size={18} /> : <PanelRightClose size={18} />}
        </Button>
      </div>

      {/* Navigation */}
      <nav 
        className="flex-1 overflow-y-auto p-2"
        role="navigation"
        aria-label="Main navigation"
      >
        <ul className="flex flex-col gap-1">
          {workspaceItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  title={!isOpen ? item.name : ''}
                  className={`${linkBaseClasses} ${isActive ? linkActiveClasses : linkInactiveClasses} ${isOpen ? 'p-3 gap-3' : 'p-2.5 gap-2.5'} text-sm font-medium`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 bg-accent-primary w-0.5" />
                  )}
                  
                  {/* Icon */}
                  <div className="flex items-center justify-center shrink-0 w-5 h-5">
                    <Icon 
                      size={18} 
                      className={`transition-all duration-200 ${isActive ? 'text-accent-primary' : 'text-current'}`}
                    />
                  </div>
                  
                  {/* Label */}
                  {isOpen && (
                    <Text 
                      as="span" 
                      className="flex-1 truncate transition-all duration-200"
                      size="sm"
                      weight={isActive ? "semibold" : "medium"}
                    >
                      {item.name}
                    </Text>
                  )}
                  
                  {/* Badge */}
                  {isOpen && item.badge && (
                    <Badge 
                      variant="secondary" 
                      className="shrink-0 transition-all duration-200 group-hover:bg-accent-ghost group-hover:text-accent-primary min-w-[20px] h-[20px] text-xs font-bold"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Settings Section */}
      <div className="p-2 border-t border-border-subtle bg-[var(--bg-primary)]">
        <Link 
          to="/settings" 
          className={`${linkBaseClasses} ${location.pathname === '/settings' ? linkActiveClasses : linkInactiveClasses} ${isOpen ? 'p-3 gap-3' : 'p-2.5 gap-2.5'} text-sm font-medium`}
          aria-current={location.pathname === '/settings' ? 'page' : undefined}
        >
          {/* Active indicator */}
          {location.pathname === '/settings' && (
            <div className="absolute left-0 top-0 bottom-0 bg-accent-primary w-0.5" />
          )}
          
          {/* Icon */}
          <div className="flex items-center justify-center shrink-0 w-5 h-5">
            <Settings 
              size={18} 
              className={`transition-all duration-200 ${location.pathname === '/settings' ? 'text-accent-primary' : 'text-current'}`}
            />
          </div>
          
          {/* Label */}
          {isOpen && (
            <Text 
              as="span"
              size="sm"
              weight={location.pathname === '/settings' ? "semibold" : "medium"}
              className="transition-all duration-200"
            >
              Settings
            </Text>
          )}
        </Link>
      </div>
    </aside>
  );
}