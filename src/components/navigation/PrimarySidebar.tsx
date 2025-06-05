import React, { useEffect } from 'react';
import {
  MessageSquare,
  FileText,
  CheckSquare,
  Calendar,
  Bot,
  Settings,
  ChevronLeft,
  ChevronRight,
  Command,
  Focus,
  Network,
  PenTool,
  BarChart3,
  Download,
  Home,
  FolderOpen,
  Search
} from 'lucide-react';
import { Button } from '../ui/button-v2';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { WorkflowState } from '../UnifiedWorkspace';
import { designTokens } from '../../lib/design-tokens';

interface PrimarySidebarProps {
  currentWorkflow: WorkflowState;
  onWorkflowChange: (workflow: WorkflowState) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  focusMode?: boolean;
  onToggleFocusMode?: () => void;
  onOpenCommandPalette?: () => void;
  className?: string;
}

interface NavigationItem {
  id: WorkflowState;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut: string;
  badge?: string | number;
  color: string;
  description: string;
}

// V2 Design System Navigation Items - Using ONLY design tokens
const coreNavItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    shortcut: '1',
    color: 'nav-item-v2',
    description: 'Main Dashboard'
  },
  {
    id: 'chat',
    label: 'Chat',
    icon: MessageSquare,
    shortcut: '2',
    color: 'nav-item-v2',
    description: 'AI Chat Interface'
  },
  {
    id: 'agents',
    label: 'AI Agents',
    icon: Bot,
    shortcut: '8',
    color: 'nav-item-v2',
    description: 'Agent Builder'
  },
  {
    id: 'notes',
    label: 'Notes',
    icon: FileText,
    shortcut: '4',
    color: 'nav-item-v2',
    description: 'Notes & Documentation'
  },
  {
    id: 'canvas',
    label: 'Whiteboards',
    icon: PenTool,
    shortcut: '5',
    color: 'nav-item-v2',
    description: 'Spatial Canvas & Whiteboards'
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: Calendar,
    shortcut: '6',
    badge: 3,
    color: 'nav-item-v2',
    description: 'Calendar & Events'
  },
  {
    id: 'tasks',
    label: 'Tasks',
    icon: CheckSquare,
    shortcut: '7',
    badge: 5,
    color: 'nav-item-v2',
    description: 'Task Management'
  }
];

const advancedNavItems: NavigationItem[] = [
  {
    id: 'folders',
    label: 'Projects',
    icon: FolderOpen,
    shortcut: '3',
    color: 'nav-item-v2',
    description: 'Project Management'
  },
  // {
  //   id: 'knowledge-graph',
  //   label: 'Knowledge Graph',
  //   icon: Network,
  //   shortcut: '9',
  //   color: 'nav-item-v2',
  //   description: 'Knowledge Relationships'
  // },
  // {
  //   id: 'analytics',
  //   label: 'Analytics',
  //   icon: BarChart3,
  //   shortcut: '0',
  //   color: 'nav-item-v2',
  //   description: 'Performance Analytics'
  // }
];

const systemNavItems: NavigationItem[] = [
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    shortcut: 's',
    color: 'nav-item-v2',
    description: 'Advanced Settings'
  }
];

// CSS for the vertical accent bar for active navigation items
const activeItemStyles = `
  .nav-item-v2[data-active="true"]:before {
    content: "";
    position: absolute;
    left: 0;
    top: 10%;
    height: 80%;
    width: 2px;
    background-color: var(--accent-primary);
    border-radius: 0 2px 2px 0;
  }
`;

export function PrimarySidebar({
  currentWorkflow,
  onWorkflowChange,
  isCollapsed,
  onToggleCollapse,
  focusMode,
  onToggleFocusMode,
  onOpenCommandPalette,
  className = ""
}: PrimarySidebarProps) {

  // Handle keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        const key = event.key;
        
        // Ctrl/Cmd + 0-9 for core navigation
        if ((key >= '0' && key <= '9')) {
          event.preventDefault();
          const allItems = [...coreNavItems, ...advancedNavItems, ...systemNavItems];
          const item = allItems.find(item => item.shortcut === key);
          if (item) {
            onWorkflowChange(item.id);
          }
        }
        
        // Ctrl/Cmd + letter shortcuts
        if (key === 's') {
          event.preventDefault();
          onWorkflowChange('settings');
        }
        

        
        if (key === 'd') {
          event.preventDefault();
          onWorkflowChange('dashboard-v2');
        }
        
        if (key === 'c') {
          event.preventDefault();
          onWorkflowChange('chat-v2');
        }
          // Ctrl/Cmd + . for focus mode
        if (key === '.' && onToggleFocusMode) {
          event.preventDefault();
          onToggleFocusMode();
        }
        
        // Ctrl/Cmd + K for command palette
        if (key === 'k' && onOpenCommandPalette) {
          event.preventDefault();
          onOpenCommandPalette();
        }
        
        // Ctrl/Cmd + \ for sidebar toggle
        if (key === '\\') {
          event.preventDefault();
          onToggleCollapse();
        }
      }
    };    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onWorkflowChange, onToggleFocusMode, onOpenCommandPalette, onToggleCollapse]);

  const renderNavigationItem = (item: NavigationItem) => {
    const isActive = currentWorkflow === item.id;
    const Icon = item.icon;

    const buttonContent = (
      <div className="relative w-full group" key={item.id}>
        {isActive && (
          <div
            className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-sm transition-all duration-200"
            style={{
              backgroundColor: designTokens.colors.primary[500],
              width: '3px',
              top: '10%', 
              height: '80%'
            }}
            aria-hidden="true"
          />
        )}
        <Button
          variant={isActive ? 'primary' : 'ghost'}
          size={isCollapsed ? "icon" : "md"}          onClick={() => onWorkflowChange(item.id)}
          className={`
            nav-item-v2 w-full justify-start mb-1 transition-all duration-200
            ${isActive ? 'nav-item-v2-active' : ''}
            ${isCollapsed ? 'justify-center' : ''}
            border-0
            relative
            ${isActive ? 'pl-1' : ''}
          `}
          data-active={isActive}
          aria-label={isCollapsed ? `${item.label} - ${item.description}` : undefined}
          role="menuitem"
        >        <Icon
          className={`flex-shrink-0 w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`}
          aria-hidden="true"
        />
        {!isCollapsed && (
          <>            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <Badge
                variant="secondary"
                className="text-xs font-medium"
                style={{
                  height: designTokens.spacing[5],
                  padding: `0 ${designTokens.spacing[2]}`, 
                  backgroundColor: 'var(--v2-bg-badge)',
                  color: 'var(--v2-text-badge)',
                  border: '1px solid var(--v2-border-badge)',
                  fontFamily: designTokens.typography.fontFamily.sans.join(', ')
                }}
                aria-label={`${item.badge} items`}
              >
                {item.badge}
              </Badge>
            )}
          </>
        )}
      </Button>
      </div>
    );

    if (isCollapsed) {
      return (
        <TooltipProvider key={item.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              {buttonContent}
            </TooltipTrigger>            <TooltipContent
              side="right"
              className="flex items-center gap-2 bg-neutral-900 text-white border-neutral-700"
            >
              <span>{item.label}</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return buttonContent;
  };

  // Hide navigation in focus mode for ADHD-friendly design
  if (focusMode) {
    return null;
  }

  return (
    <>
      <style>{activeItemStyles}</style>
      <div
        className={`sidebar-v2 ${className} ${isCollapsed ? 'w-16' : 'w-60'} transition-all duration-300 ease-in-out`}
        style={{
        width: isCollapsed ? designTokens.spacing[16] : designTokens.spacing[60],
        backgroundColor: 'var(--v2-bg-primary)',
        borderRight: `1px solid var(--v2-border-default)`,
        fontFamily: designTokens.typography.fontFamily.sans.join(', ')
      }}
      aria-label="Primary navigation"
      role="navigation"
    >      {/* V2 Header with LibreOllama branding and collapse */}
      <header
        style={{
          padding: designTokens.spacing[4],
          borderBottom: `1px solid var(--v2-border-subtle)`
        }}
      >
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
              <span className="font-semibold text-white">LibreOllama</span>
            </div>
          )}          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="w-8 h-8"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>
      </header>      {/* V2 Main Navigation */}
      <nav
        className="flex-1 overflow-y-auto flex flex-col"
        style={{ padding: designTokens.spacing[4] }}
        role="menu"
      >
        {/* Core Navigation Items */}
        <div style={{ marginBottom: designTokens.spacing[1] }}>
          {coreNavItems.map(renderNavigationItem)}
        </div>

        <div style={{ margin: `${designTokens.spacing[4]} 0` }}>
          <Separator style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
        </div>

        {/* Advanced Features */}
        <div style={{ marginBottom: designTokens.spacing[1] }}>
          {advancedNavItems.map(renderNavigationItem)}
        </div>

        {/* Spacer to push settings to bottom */}
        <div className="flex-grow"></div>

        <div style={{ margin: `${designTokens.spacing[4]} 0` }}>
          <Separator style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
        </div>

        {/* System - Settings at bottom */}
        <div style={{ marginBottom: designTokens.spacing[1] }}>
          {systemNavItems.map(renderNavigationItem)}
        </div>
      </nav>

    </div>
    </>
  );
}