import React, { useState } from 'react';
import {
  Plus,
  Command,
  Search,
  User,
  Bell,
  Settings,
  ChevronDown,
  Filter,
  SortAsc,
  MoreHorizontal,
  Zap,
  Focus,
  Home,
  ArrowLeft,
  ChevronRight,
  Compass // Added Compass import
} from 'lucide-react';
import { Button } from './ui/button-v2';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Input } from './ui/input-v2';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

import { NotificationCenter } from './ui/notification-center';
import { UserProfileMenu } from './ui/user-profile-menu';
import { WorkflowState } from './UnifiedWorkspace';
import { designTokens } from '../lib/design-tokens';
import { ThemeToggle } from './ui/theme-toggle';
import type { TaskItem, ChatSession, Item } from '../lib/types';

interface ContextAwareTopBarProps {
  currentWorkflow: WorkflowState;
  onWorkflowChange: (workflow: WorkflowState) => void;
  focusMode: boolean;
  onToggleFocusMode: () => void;
  onOpenCommandPalette: () => void;
  className?: string;
  // Data for search
  searchData?: {
    notes?: Item[];
    tasks?: TaskItem[];
    chats?: ChatSession[];
    calendarEvents?: any[];
  };
}

interface NewItemAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  shortcut?: string;
  description: string;
}

const getNewItemActions = (workflow: WorkflowState): NewItemAction[] => {
  const actions: Record<WorkflowState, NewItemAction[]> = {
    dashboard: [
      {
        label: 'New Task',
        icon: Plus, // Assuming Plus is a theme-aware icon component
        action: () => console.log('New task from dashboard'),
        shortcut: 'Ctrl+N',
        description: 'Add a quick task'
      },
      {
        label: 'New Note',
        icon: Plus, // Assuming Plus is a theme-aware icon component
        action: () => console.log('New note from dashboard'),
        description: 'Create a new note'
      },
      {
        label: 'New Chat', // Added New Chat for dashboard
        icon: Plus, // Assuming Plus is a theme-aware icon component
        action: () => console.log('New chat from dashboard'),
        description: 'Start a new conversation'
      }
    ],
    chat: [
      {
        label: 'New Chat',
        icon: Plus,
        action: () => console.log('New chat'),
        shortcut: 'Ctrl+N',
        description: 'Start a fresh conversation'
      }
    ],
    notes: [
      {
        label: 'New Note',
        icon: Plus,
        action: () => console.log('New note'),
        shortcut: 'Ctrl+N',
        description: 'Create a new note document'
      },
      {
        label: 'New Canvas',
        icon: Plus,
        action: () => console.log('New canvas'),
        description: 'Create a spatial canvas'
      }
    ],
    tasks: [
      {
        label: 'New Task',
        icon: Plus,
        action: () => console.log('New task'),
        shortcut: 'Ctrl+N',
        description: 'Add a new task'
      },
      {
        label: 'New Project',
        icon: Plus,
        action: () => console.log('New project'),
        description: 'Create a new project board'
      }
    ],
    calendar: [
      {
        label: 'New Event',
        icon: Plus,
        action: () => console.log('New event'),
        shortcut: 'Ctrl+N',
        description: 'Schedule a new event'
      },
      {
        label: 'New Meeting',
        icon: Plus,
        action: () => console.log('New meeting'),
        description: 'Create a meeting with AI agenda'
      }
    ],
    agents: [
      {
        label: 'New Agent',
        icon: Plus,
        action: () => console.log('New agent'),
        shortcut: 'Ctrl+N',
        description: 'Build a new AI agent'
      },
      {
        label: 'Import Agent',
        icon: Plus,
        action: () => console.log('Import agent'),
        description: 'Import agent configuration'
      }
    ],
    settings: [
      {
        label: 'Add Integration',
        icon: Plus,
        action: () => console.log('Add integration'),
        description: 'Connect a new service'
      }
    ],
    projects: [
      {
        label: 'New Project',
        icon: Plus,
        action: () => console.log('New project'),
        shortcut: 'Ctrl+N',
        description: 'Create a new project'
      },
      {
        label: 'New Task',
        icon: Plus,
        action: () => console.log('New task from projects'),
        description: 'Add a task to current project'
      }
    ],
    whiteboards: [
      {
        label: 'New Whiteboard',
        icon: Plus,
        action: () => console.log('New whiteboard'),
        shortcut: 'Ctrl+N',
        description: 'Create a new whiteboard'
      },
      {
        label: 'New Template',
        icon: Plus,
        action: () => console.log('New whiteboard template'),
        description: 'Create a whiteboard template'
      }
    ],
    folders: [
      {
        label: 'New Folder',
        icon: Plus,
        action: () => console.log('New folder'),
        shortcut: 'Ctrl+N',
        description: 'Create organization folder'
      }
    ],
    canvas: [
      {
        label: 'New Canvas',
        icon: Plus,
        action: () => console.log('New canvas'),
        shortcut: 'Ctrl+N',
        description: 'Create spatial workspace'
      }
    ],
    'knowledge-graph': [
      {
        label: 'New Node',
        icon: Plus,
        action: () => console.log('New node'),
        description: 'Add knowledge node'
      }
    ],
    n8n: [
      {
        label: 'New Workflow',
        icon: Plus,
        action: () => console.log('New workflow'),
        shortcut: 'Ctrl+N',
        description: 'Create automation workflow'
      }
    ],
    mcp: [
      {
        label: 'Add Server',
        icon: Plus,
        action: () => console.log('Add MCP server'),
        description: 'Connect MCP server'
      }
    ],
    models: [
      {
        label: 'Download Model',
        icon: Plus,
        action: () => console.log('Download model'),
        description: 'Install new AI model'
      }
    ],
    templates: [
      {
        label: 'New Template',
        icon: Plus,
        action: () => console.log('New template'),
        shortcut: 'Ctrl+N',
        description: 'Create prompt template'
      }
    ],
    analytics: [
      {
        label: 'New Dashboard',
        icon: Plus,
        action: () => console.log('New dashboard'),
        description: 'Create analytics dashboard'
      }
    ],
    'test-suite': [
      {
        label: 'Run Tests',
        icon: Plus,
        action: () => console.log('Run whiteboard tests'),
        shortcut: 'Ctrl+T',
        description: 'Run whiteboard test suite'
      }
    ],
    'test-analyzer': [
      {
        label: 'Analyze Code',
        icon: Plus,
        action: () => console.log('Analyze whiteboard code'),
        shortcut: 'Ctrl+A',
        description: 'Analyze whiteboard code quality'
      }
    ],
    'dashboard-v2': [
      {
        label: 'New Widget',
        icon: Plus,
        action: () => console.log('New dashboard widget'),
        shortcut: 'Ctrl+N',
        description: 'Add a new dashboard widget'
      }
    ],
    'chat-v2': [
      {
        label: 'New Chat',
        icon: Plus,
        action: () => console.log('New chat v2'),
        shortcut: 'Ctrl+N',
        description: 'Start a fresh conversation'
      }
    ]
  };

  return actions[workflow] || [];
};

const getWorkflowTitle = (workflow: WorkflowState): string => {
  const titles: Record<WorkflowState, string> = {
    dashboard: 'Main Dashboard',
    chat: 'AI Chat',
    projects: 'Projects',
    notes: 'Notes & Documentation',
    whiteboards: 'Whiteboards',
    tasks: 'Task Management',
    calendar: 'Calendar & Events',
    agents: 'AI Agents',
    settings: 'Settings',
    folders: 'Folder Management',
    canvas: 'Spatial Canvas',
    'knowledge-graph': 'Knowledge Graph',
    n8n: 'Workflow Automation',
    mcp: 'MCP Servers',
    models: 'Model Management',
    templates: 'Chat Templates',
    analytics: 'Analytics Dashboard',
    'test-suite': 'Whiteboard Test Suite',
    'test-analyzer': 'Whiteboard Code Analyzer',
    'dashboard-v2': 'Dashboard v2 (New Design)',
    'chat-v2': 'AI Chat v2 (New Design)'
  };
  return titles[workflow];
};

const getBreadcrumbs = (workflow: WorkflowState) => {
  return [
    { label: 'Workspace', href: '#' },
    { label: getWorkflowTitle(workflow), href: '#', current: true }
  ];
};



export function ContextAwareTopBar({
  currentWorkflow,
  onWorkflowChange,
  focusMode,
  onToggleFocusMode,
  onOpenCommandPalette,
  className,
  searchData
}: ContextAwareTopBarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = () => {
    console.log('Searching for:', searchQuery);
    // Implement actual search logic here
  };

  const currentActions = getNewItemActions(currentWorkflow);

  return (
    <header
      className={`flex items-center justify-between px-4 border-b ${className}`}
      style={{
        backgroundColor: 'var(--v2-bg-secondary)', 
        borderColor: 'var(--v2-border-subtle)', // Changed from --border
        height: designTokens.sizing.topBarHeight || '64px'
      }}
    >
      {/* Left Section: Workflow Title */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          {currentWorkflow !== 'dashboard' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onWorkflowChange('dashboard')}
              className="mr-2"
              aria-label="Back to Dashboard"
            >
              <ArrowLeft size={18} />
            </Button>
          )}
          <h1 className="text-lg font-semibold truncate" style={{ color: 'var(--v2-text-primary)' }}>
            {getWorkflowTitle(currentWorkflow)}
          </h1>
        </div>
      </div>

      {/* Center Section: Global Search */}
      <div className="flex-1 max-w-xl mx-4">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
          />
          <Input
            type="search"
            placeholder="Search notes, tasks, chats... (⌘K)"
            className="w-full pl-10 pr-4 py-2 text-sm"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearchSubmit();
              if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                onOpenCommandPalette();
              }
            }}
            style={{
              backgroundColor: 'var(--v2-bg-input)',
              borderColor: 'var(--v2-border-subtle)', // Changed from --border
              color: 'var(--v2-text-primary)',
              borderRadius: designTokens.borderRadius.md
            }}
          />
        </div>
      </div>

      {/* Right Section: Actions, Notifications, User Profile */}
      <div className="flex items-center space-x-3">
        {/* New Item Dropdown */}
        {currentActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="primary" 
                size="md" 
                className="flex items-center text-sm font-semibold" // Only layout classes, no padding/color/hover/focus overrides
              >
                <Plus size={16} className="mr-1" />
                <span>New</span>
                <ChevronDown size={14} className="ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-popover border-border shadow-lg">
              {currentActions.map((item, index) => (
                <DropdownMenuItem key={index} onClick={item.action} className="flex justify-between items-center text-popover-foreground hover:bg-accent hover:text-accent-foreground">
                  <div className="flex items-center">
                    <item.icon className="mr-2 h-4 w-4 text-current" />
                    <span className="text-current">{item.label}</span>
                  </div>
                  {item.shortcut && (
                    <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                      {item.shortcut}
                    </kbd>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Command Palette Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onOpenCommandPalette} 
                aria-label="Command Palette (⌘K)"
              >
                <Command size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Command Palette (⌘K)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Focus Mode Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={focusMode ? "primary" : "ghost"} 
                size="icon" 
                onClick={onToggleFocusMode} 
                aria-label={focusMode ? "Exit Focus Mode" : "Enter Focus Mode (⌘.)"}
              >
                <Focus size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{focusMode ? "Exit Focus Mode (⌘.)" : "Enter Focus Mode (⌘.)"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Compass/Discover Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => console.log('Discover/Compass clicked')} 
                aria-label="Discover"
              >
                <Compass className="h-[18px] w-[18px]" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Discover</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Notifications */}
        <NotificationCenter />
        {/* Theme Toggle */}
        <ThemeToggle />
        {/* User Profile */}
        <UserProfileMenu />
      </div>
    </header>
  );
}