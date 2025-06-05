import React, { useState, useEffect } from 'react';
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
  Compass,
  X,
  Check,
  Clock,
  Calendar,
  FileText,
  MessageSquare,
  CheckSquare,
  HelpCircle,
  Info
} from 'lucide-react';
import { Button } from '../ui/button-v2';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Input } from '../ui/input-v2';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

import { NotificationCenter } from '../ui/notification-center';
import { UserProfileMenu } from '../ui/user-profile-menu';
import { WorkflowState } from '../UnifiedWorkspace';
import { designTokens } from '../../lib/design-tokens';
import { EnhancedThemeToggle, SimpleThemeToggle } from '../ui/enhanced-theme-toggle';
import type { TaskItem, ChatSession, Item } from '../../lib/types';

interface EnhancedTopBarProps {
  currentWorkflow: WorkflowState;
  onWorkflowChange: (workflow: WorkflowState) => void;
  focusMode: boolean;
  onToggleFocusMode: () => void;
  onOpenCommandPalette: () => void;
  className?: string;
  variant?: 'default' | 'minimal' | 'expanded';
  showBreadcrumbs?: boolean;
  showSearch?: boolean;
  showActions?: boolean;
  showUserControls?: boolean;
  showThemeToggle?: boolean;
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
  isNew?: boolean;
  isExperimental?: boolean;
  isDisabled?: boolean;
}

interface SearchResult {
  id: string;
  title: string;
  type: 'note' | 'task' | 'chat' | 'event' | 'project' | 'contact' | 'file';
  icon: React.ComponentType<{ className?: string }>;
  preview?: string;
  date?: Date;
  tags?: string[];
  url?: string;
}

const getNewItemActions = (workflow: WorkflowState): NewItemAction[] => {
  const actions: Record<WorkflowState, NewItemAction[]> = {
    dashboard: [
      {
        label: 'New Task',
        icon: Plus,
        action: () => console.log('New task from dashboard'),
        shortcut: 'Ctrl+N',
        description: 'Add a quick task'
      },
      {
        label: 'New Note',
        icon: Plus,
        action: () => console.log('New note from dashboard'),
        description: 'Create a new note'
      },
      {
        label: 'New Chat',
        icon: Plus,
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
      },
      {
        label: 'New Group Chat',
        icon: Plus,
        action: () => console.log('New group chat'),
        description: 'Start a multi-model conversation',
        isExperimental: true
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
      },
      {
        label: 'New Document',
        icon: Plus,
        action: () => console.log('New document'),
        description: 'Create a new document'
      }
    ],
    canvas: [
      {
        label: 'New Canvas',
        icon: Plus,
        action: () => console.log('New canvas'),
        shortcut: 'Ctrl+N',
        description: 'Create a blank canvas'
      },
      {
        label: 'New from Template',
        icon: Plus,
        action: () => console.log('New canvas from template'),
        description: 'Start with a template'
      }
    ],
    'knowledge-graph': [
      {
        label: 'New Connection',
        icon: Plus,
        action: () => console.log('New connection'),
        shortcut: 'Ctrl+N',
        description: 'Create a new knowledge connection'
      }
    ],
    models: [
      {
        label: 'Download Model',
        icon: Plus,
        action: () => console.log('Download model'),
        description: 'Add a new AI model'
      }
    ],
    analytics: [
      {
        label: 'New Dashboard',
        icon: Plus,
        action: () => console.log('New dashboard'),
        description: 'Create custom analytics view'
      }
    ],
    'dashboard-v2': [
      {
        label: 'New Widget',
        icon: Plus,
        action: () => console.log('New widget'),
        description: 'Add dashboard widget'
      }
    ],
    'chat-v2': [
      {
        label: 'New Chat',
        icon: Plus,
        action: () => console.log('New chat v2'),
        shortcut: 'Ctrl+N',
        description: 'Start a new conversation'
      }
    ]
  };
  
  return actions[workflow] || [];
};

const getWorkflowTitle = (workflow: WorkflowState): string => {
  const titles: Record<WorkflowState, string> = {
    dashboard: 'Dashboard',
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
  return titles[workflow] || workflow;
};

const getBreadcrumbs = (workflow: WorkflowState) => {
  // Define specific breadcrumb paths for certain workflows
  const specificBreadcrumbs: Record<WorkflowState, Array<{label: string, href: string, current?: boolean}>> = {
    'notes': [
      { label: 'Workspace', href: '#' },
      { label: 'Notes', href: '#' },
      { label: 'Current Note', href: '#', current: true }
    ],
    'projects': [
      { label: 'Workspace', href: '#' },
      { label: 'Projects', href: '#' },
      { label: 'Current Project', href: '#', current: true }
    ],
    'tasks': [
      { label: 'Workspace', href: '#' },
      { label: 'Tasks', href: '#' },
      { label: 'Current Board', href: '#', current: true }
    ]
  };

  // Return specific breadcrumbs if defined, otherwise return default
  return specificBreadcrumbs[workflow] || [
    { label: 'Workspace', href: '#' },
    { label: getWorkflowTitle(workflow), href: '#', current: true }
  ];
};

export function EnhancedTopBar({
  currentWorkflow,
  onWorkflowChange,
  focusMode,
  onToggleFocusMode,
  onOpenCommandPalette,
  className,
  variant = 'default',
  showBreadcrumbs = true,
  showSearch = true,
  showActions = true,
  showUserControls = true,
  showThemeToggle = true,
  searchData
}: EnhancedTopBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchCategory, setSearchCategory] = useState<string>('all');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    
    // Mock search results based on query
    if (e.target.value.trim()) {
      // In a real implementation, this would search through actual data
      const mockResults: SearchResult[] = [
        {
          id: '1',
          title: `Note about ${e.target.value}`,
          type: 'note',
          icon: FileText,
          preview: `This is a note containing information about ${e.target.value}...`,
          date: new Date(),
          tags: ['research', 'important']
        },
        {
          id: '2',
          title: `Task related to ${e.target.value}`,
          type: 'task',
          icon: CheckSquare,
          preview: `Complete the ${e.target.value} task by next week`,
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        {
          id: '3',
          title: `Chat about ${e.target.value}`,
          type: 'chat',
          icon: MessageSquare,
          preview: `Discussion with AI about ${e.target.value} concepts and applications`,
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        {
          id: '4',
          title: `${e.target.value} meeting`,
          type: 'event',
          icon: Calendar,
          preview: `Team meeting to discuss ${e.target.value} implementation`,
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        }
      ];
      
      // Filter by category if needed
      const filtered = searchCategory === 'all' 
        ? mockResults 
        : mockResults.filter(result => result.type === searchCategory);
      
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  };

  const handleSearchSubmit = () => {
    console.log('Searching for:', searchQuery);
    // Implement actual search logic here
  };

  const handleSearchResultClick = (result: SearchResult) => {
    console.log('Selected search result:', result);
    // Navigate to the selected result
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchFocused(false);
  };

  const currentActions = getNewItemActions(currentWorkflow);
  const breadcrumbs = getBreadcrumbs(currentWorkflow);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + K for search/command palette
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        onOpenCommandPalette();
      }
      
      // Escape to clear search and blur
      if (event.key === 'Escape' && isSearchFocused) {
        setSearchQuery('');
        setSearchResults([]);
        setIsSearchFocused(false);
        (document.activeElement as HTMLElement)?.blur();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenCommandPalette, isSearchFocused]);

  // Render search results dropdown
  const renderSearchResults = () => {
    if (!isSearchFocused || searchResults.length === 0) return null;
    
    return (
      <div 
        className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto"
        style={{
          backgroundColor: 'var(--v2-bg-floating)',
          borderColor: 'var(--v2-border-subtle)'
        }}
      >
        <div className="sticky top-0 flex items-center justify-between p-2 border-b border-border bg-muted/50">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Results</span>
            <Badge variant="secondary" className="text-xs">
              {searchResults.length}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`text-xs px-2 py-1 h-auto ${searchCategory === 'all' ? 'bg-muted' : ''}`}
              onClick={() => setSearchCategory('all')}
            >
              All
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`text-xs px-2 py-1 h-auto ${searchCategory === 'note' ? 'bg-muted' : ''}`}
              onClick={() => setSearchCategory('note')}
            >
              Notes
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`text-xs px-2 py-1 h-auto ${searchCategory === 'task' ? 'bg-muted' : ''}`}
              onClick={() => setSearchCategory('task')}
            >
              Tasks
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`text-xs px-2 py-1 h-auto ${searchCategory === 'chat' ? 'bg-muted' : ''}`}
              onClick={() => setSearchCategory('chat')}
            >
              Chats
            </Button>
          </div>
        </div>
        <div className="p-1">
          {searchResults.map((result) => {
            const ResultIcon = result.icon;
            return (
              <div 
                key={result.id}
                className="flex items-start gap-3 p-2 hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer"
                onClick={() => handleSearchResultClick(result)}
              >
                <div className="flex-shrink-0 mt-1">
                  <ResultIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium truncate">{result.title}</h4>
                    {result.date && (
                      <span className="text-xs text-muted-foreground flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {result.date.toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {result.preview && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {result.preview}
                    </p>
                  )}
                  {result.tags && result.tags.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      {result.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-2 border-t border-border">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-xs justify-center"
            onClick={handleSearchSubmit}
          >
            View all results
          </Button>
        </div>
      </div>
    );
  };

  return (
    <header
      className={`enhanced-topbar flex items-center justify-between px-4 border-b ${className}`}
      style={{
        backgroundColor: 'var(--v2-bg-secondary)', 
        borderColor: 'var(--v2-border-subtle)',
        height: designTokens.sizing.topBarHeight || '64px'
      }}
    >
      {/* Left Section: Workflow Title or Breadcrumbs */}
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
          
          {showBreadcrumbs ? (
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-1">
                {breadcrumbs.map((breadcrumb, index) => (
                  <li key={index} className="flex items-center">
                    {index > 0 && (
                      <ChevronRight className="mx-1 h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <a
                      href={breadcrumb.href}
                      className={`text-sm ${breadcrumb.current ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      aria-current={breadcrumb.current ? 'page' : undefined}
                    >
                      {breadcrumb.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : (
            <h1 className="text-lg font-semibold truncate" style={{ color: 'var(--v2-text-primary)' }}>
              {getWorkflowTitle(currentWorkflow)}
            </h1>
          )}
        </div>
      </div>

      {/* Center Section: Global Search */}
      {showSearch && (
        <div className="flex-1 max-w-xl mx-4 relative">
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
              onFocus={() => setIsSearchFocused(true)}
              onBlur={(e) => {
                // Delay to allow click on search results
                setTimeout(() => {
                  if (!e.currentTarget.contains(document.activeElement)) {
                    setIsSearchFocused(false);
                  }
                }, 200);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchSubmit();
                if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                  e.preventDefault();
                  onOpenCommandPalette();
                }
              }}
              style={{
                backgroundColor: 'var(--v2-bg-input)',
                borderColor: 'var(--v2-border-subtle)',
                color: 'var(--v2-text-primary)',
                borderRadius: designTokens.borderRadius.md
              }}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          {renderSearchResults()}
        </div>
      )}

      {/* Right Section: Actions, Notifications, User Profile */}
      <div className="flex items-center space-x-3">
        {/* New Item Dropdown */}
        {(showActions && currentActions.length > 0) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="primary" 
                size="md" 
                className="flex items-center text-sm font-semibold"
              >
                <Plus size={16} className="mr-1" />
                <span>New</span>
                <ChevronDown size={14} className="ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-64"
              style={{
                backgroundColor: 'var(--v2-bg-floating)',
                borderColor: 'var(--v2-border-subtle)',
                boxShadow: designTokens.shadows.lg
              }}
            >
              {currentActions.map((item, index) => (
                <DropdownMenuItem 
                  key={index} 
                  onClick={item.action} 
                  className="flex justify-between items-center"
                  disabled={item.isDisabled}
                >
                  <div className="flex items-center">
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.label}</span>
                    {item.isNew && (
                      <Badge variant="success" className="ml-2 text-xs">
                        NEW
                      </Badge>
                    )}
                    {item.isExperimental && (
                      <Badge variant="warning" className="ml-2 text-xs">
                        BETA
                      </Badge>
                    )}
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

        {/* Help Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => console.log('Help clicked')} 
                aria-label="Help"
              >
                <HelpCircle size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Help & Resources</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {showUserControls && (
          <>
            {/* Notifications */}
            <NotificationCenter />
            
            {/* Theme Toggle */}
            {showThemeToggle && (
              variant === 'minimal' ? <SimpleThemeToggle /> : <EnhancedThemeToggle />
            )}
            
            {/* User Profile */}
            <UserProfileMenu />
          </>
        )}
      </div>
    </header>
  );
}