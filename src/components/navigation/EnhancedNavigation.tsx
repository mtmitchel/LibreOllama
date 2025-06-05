import React, { useState, useEffect } from 'react';
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
  Search,
  Zap,
  Bookmark,
  Star,
  Users,
  Layers,
  HelpCircle
} from 'lucide-react';
import { Button } from '../ui/button-v2';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { WorkflowState } from '../UnifiedWorkspace';
import { designTokens } from '../../lib/design-tokens';
import { useEnhancedTheme } from '../ui/enhanced-theme-provider';

interface EnhancedNavigationProps {
  currentWorkflow: WorkflowState;
  onWorkflowChange: (workflow: WorkflowState) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  focusMode?: boolean;
  onToggleFocusMode?: () => void;
  onOpenCommandPalette?: () => void;
  className?: string;
  variant?: 'default' | 'minimal' | 'expanded';
  showLabels?: boolean;
  showIcons?: boolean;
  showTooltips?: boolean;
  showShortcuts?: boolean;
  showBadges?: boolean;
  showSections?: boolean;
  showFooter?: boolean;
}

interface NavigationItem {
  id: WorkflowState;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut: string;
  badge?: string | number;
  color: string;
  description: string;
  keywords?: string[];
  isNew?: boolean;
  isExperimental?: boolean;
  isDisabled?: boolean;
}

interface NavigationSection {
  id: string;
  title: string;
  items: NavigationItem[];
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

export function EnhancedNavigation({
  currentWorkflow,
  onWorkflowChange,
  isCollapsed,
  onToggleCollapse,
  focusMode,
  onToggleFocusMode,
  onOpenCommandPalette,
  className = "",
  variant = 'default',
  showLabels = true,
  showIcons = true,
  showTooltips = true,
  showShortcuts = true,
  showBadges = true,
  showSections = true,
  showFooter = true
}: EnhancedNavigationProps) {
  const { theme } = useEnhancedTheme();
  const [hoveredItem, setHoveredItem] = useState<WorkflowState | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['core', 'workflow', 'system']));
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredItems, setFilteredItems] = useState<NavigationItem[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Navigation sections with items
  const navigationSections: NavigationSection[] = [
    {
      id: 'core',
      title: 'Workspace',
      icon: Layers,
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: Home,
          shortcut: '1',
          color: 'nav-item-v2',
          description: 'Main Dashboard',
          keywords: ['home', 'overview', 'summary', 'start']
        },
        {
          id: 'chat',
          label: 'AI Chat',
          icon: MessageSquare,
          shortcut: '2',
          color: 'nav-item-v2',
          description: 'AI Chat Interface',
          keywords: ['conversation', 'message', 'talk', 'discuss']
        },
        {
          id: 'folders',
          label: 'Projects',
          icon: FolderOpen,
          shortcut: '3',
          color: 'nav-item-v2',
          description: 'Project Management',
          keywords: ['folder', 'organize', 'project', 'collection']
        },
        {
          id: 'notes',
          label: 'Notes',
          icon: FileText,
          shortcut: '4',
          color: 'nav-item-v2',
          description: 'Notes & Documentation',
          keywords: ['document', 'write', 'text', 'edit']
        },
        {
          id: 'canvas',
          label: 'Whiteboards',
          icon: PenTool,
          shortcut: '5',
          color: 'nav-item-v2',
          description: 'Spatial Canvas & Whiteboards',
          keywords: ['draw', 'sketch', 'diagram', 'visual']
        },
        {
          id: 'calendar',
          label: 'Calendar',
          icon: Calendar,
          shortcut: '6',
          badge: 3,
          color: 'nav-item-v2',
          description: 'Calendar & Events',
          keywords: ['schedule', 'event', 'time', 'date', 'planning']
        },
        {
          id: 'tasks',
          label: 'Tasks',
          icon: CheckSquare,
          shortcut: '7',
          badge: 5,
          color: 'nav-item-v2',
          description: 'Task Management',
          keywords: ['todo', 'checklist', 'action', 'activity']
        }
      ]
    },
    {
      id: 'workflow',
      title: 'Advanced',
      icon: Zap,
      items: [
        {
          id: 'agents',
          label: 'AI Agents',
          icon: Bot,
          shortcut: '8',
          color: 'nav-item-v2',
          description: 'Agent Builder',
          keywords: ['bot', 'automation', 'assistant', 'ai']
        },
        {
          id: 'knowledge-graph',
          label: 'Knowledge Graph',
          icon: Network,
          shortcut: '9',
          color: 'nav-item-v2',
          description: 'Knowledge Relationships',
          keywords: ['connections', 'links', 'graph', 'relations']
        },
        {
          id: 'analytics',
          label: 'Analytics',
          icon: BarChart3,
          shortcut: '0',
          color: 'nav-item-v2',
          description: 'Performance Analytics',
          keywords: ['stats', 'metrics', 'data', 'charts']
        }
      ]
    },
    {
      id: 'system',
      title: 'System',
      icon: Settings,
      items: [
        {
          id: 'models',
          label: 'Models',
          icon: Download,
          shortcut: 'm',
          color: 'nav-item-v2',
          description: 'Model Management',
          keywords: ['llm', 'download', 'ai models', 'language models']
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: Settings,
          shortcut: 's',
          color: 'nav-item-v2',
          description: 'Advanced Settings',
          keywords: ['preferences', 'options', 'configure', 'customize']
        }
      ]
    }
  ];

  // Handle keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        const key = event.key;
        
        // Ctrl/Cmd + 0-9 for core navigation
        if ((key >= '0' && key <= '9')) {
          event.preventDefault();
          const allItems = navigationSections.flatMap(section => section.items);
          const item = allItems.find(item => item.shortcut === key);
          if (item && !item.isDisabled) {
            onWorkflowChange(item.id);
          }
        }
        
        // Ctrl/Cmd + letter shortcuts
        if (key === 's') {
          event.preventDefault();
          onWorkflowChange('settings');
        }
        
        if (key === 'm') {
          event.preventDefault();
          onWorkflowChange('models');
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

        // Ctrl/Cmd + / for search
        if (key === '/') {
          event.preventDefault();
          setIsSearching(true);
          setTimeout(() => {
            const searchInput = document.getElementById('nav-search-input');
            if (searchInput) searchInput.focus();
          }, 100);
        }
      }

      // Escape to exit search
      if (event.key === 'Escape' && isSearching) {
        setIsSearching(false);
        setSearchQuery('');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onWorkflowChange, onToggleFocusMode, onOpenCommandPalette, onToggleCollapse, isSearching, navigationSections]);

  // Filter items based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredItems([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const allItems = navigationSections.flatMap(section => section.items);
    const filtered = allItems.filter(item => {
      return (
        item.label.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        (item.keywords && item.keywords.some(keyword => keyword.toLowerCase().includes(query)))
      );
    });

    setFilteredItems(filtered);
  }, [searchQuery, navigationSections]);

  const toggleSectionExpanded = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const renderNavigationItem = (item: NavigationItem) => {
    const isActive = currentWorkflow === item.id;
    const isHovered = hoveredItem === item.id;
    const Icon = item.icon;

    const buttonContent = (
      <div 
        className="relative w-full group" 
        key={item.id}
        onMouseEnter={() => setHoveredItem(item.id)}
        onMouseLeave={() => setHoveredItem(null)}
      >
        {isActive && (
          <div
            className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-sm transition-all duration-200"
            style={{
              backgroundColor: 'var(--v2-accent-primary)',
              width: '3px',
              top: '10%', 
              height: '80%'
            }}
            aria-hidden="true"
          />
        )}
        <Button
          variant={isActive ? 'primary' : 'ghost'}
          size={isCollapsed ? "icon" : "md"}
          onClick={() => onWorkflowChange(item.id)}
          className={`
            nav-item-v2 w-full justify-start mb-1 transition-all duration-200
            ${isActive ? 'nav-item-v2-active' : ''}
            ${isCollapsed ? 'justify-center' : ''}
            border-0
            relative
            ${isActive ? 'pl-1' : ''}
            ${item.isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          data-active={isActive}
          aria-label={isCollapsed ? `${item.label} - ${item.description}` : undefined}
          role="menuitem"
          disabled={item.isDisabled}
        >
          {showIcons && (
            <Icon
              className={`flex-shrink-0 w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`}
              aria-hidden="true"
            />
          )}
          {(!isCollapsed && showLabels) && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
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
              {(showBadges && item.badge) && (
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
              {(showShortcuts && item.shortcut) && (
                <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                  {item.shortcut.toUpperCase().includes('CTRL') ? item.shortcut : `⌘${item.shortcut}`}
                </kbd>
              )}
            </>
          )}
        </Button>
      </div>
    );

    if (isCollapsed && showTooltips) {
      return (
        <TooltipProvider key={item.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              {buttonContent}
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="flex flex-col gap-1 bg-popover border-border shadow-lg p-3 max-w-xs"
            >
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <span className="font-medium">{item.label}</span>
                {item.shortcut && (
                  <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                    {item.shortcut.toUpperCase().includes('CTRL') ? item.shortcut : `⌘${item.shortcut}`}
                  </kbd>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{item.description}</p>
              {item.badge && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {item.badge} items
                  </Badge>
                </div>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return buttonContent;
  };

  const renderSection = (section: NavigationSection) => {
    const isExpanded = expandedSections.has(section.id);
    const SectionIcon = section.icon;

    return (
      <div key={section.id} className="mb-4">
        {(showSections && !isCollapsed) && (
          <div 
            className={`flex items-center justify-between px-3 py-2 ${section.collapsible ? 'cursor-pointer hover:bg-muted/20' : ''}`}
            onClick={() => section.collapsible ? toggleSectionExpanded(section.id) : null}
          >
            <div className="flex items-center gap-2">
              {SectionIcon && <SectionIcon className="w-4 h-4 text-muted-foreground" />}
              <h2
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {section.title}
              </h2>
            </div>
            {section.collapsible && (
              <Button variant="ghost" size="icon" className="w-5 h-5 p-0">
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                />
              </Button>
            )}
          </div>
        )}
        {(!section.collapsible || isExpanded) && (
          <div className="space-y-1">
            {section.items.map(renderNavigationItem)}
          </div>
        )}
      </div>
    );
  };

  // Hide navigation in focus mode for ADHD-friendly design
  if (focusMode) {
    return null;
  }

  return (
    <div
      className={`enhanced-sidebar ${className} ${isCollapsed ? 'w-16' : 'w-64'} transition-all duration-300 ease-in-out flex flex-col`}
      style={{
        width: isCollapsed ? designTokens.spacing[16] : designTokens.spacing[64],
        backgroundColor: 'var(--v2-bg-primary)',
        borderRight: `1px solid var(--v2-border-default)`,
        fontFamily: designTokens.typography.fontFamily.sans.join(', '),
        height: '100vh'
      }}
      aria-label="Primary navigation"
      role="navigation"
    >
      {/* Header with LibreOllama branding and collapse */}
      <header
        className="flex-shrink-0"
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
          )}
          <Button
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

        {/* Search input - only visible when not collapsed or when searching */}
        {(!isCollapsed || isSearching) && (
          <div className={`mt-4 transition-all duration-300 ${isSearching ? 'opacity-100' : ''}`}>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="nav-search-input"
                type="text"
                placeholder="Search navigation..."
                className="w-full bg-muted/20 border border-muted/30 rounded-md py-1.5 pl-8 pr-3 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => {
                  if (!searchQuery) {
                    setIsSearching(false);
                  }
                }}
                style={{
                  backgroundColor: 'var(--v2-bg-input)',
                  borderColor: 'var(--v2-border-subtle)',
                  color: 'var(--v2-text-primary)'
                }}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0"
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearching(false);
                  }}
                >
                  <span className="sr-only">Clear search</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </Button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Navigation */}
      <nav
        className="flex-1 overflow-y-auto py-4 px-3"
        role="menu"
      >
        {searchQuery ? (
          // Search results
          <div className="space-y-1">
            {filteredItems.length > 0 ? (
              filteredItems.map(renderNavigationItem)
            ) : (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No results found
              </div>
            )}
          </div>
        ) : (
          // Regular navigation sections
          <>
            {navigationSections.map(renderSection)}
          </>
        )}
      </nav>

      {/* Footer with shortcuts */}
      {(showFooter && !isCollapsed) && (
        <footer
          className="flex-shrink-0 p-4 border-t border-muted/20"
          style={{
            borderColor: 'var(--v2-border-subtle)'
          }}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8"
                onClick={() => console.log('Help clicked')}
              >
                <HelpCircle className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8"
                onClick={() => console.log('Favorites clicked')}
              >
                <Star className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8"
                onClick={onOpenCommandPalette}
              >
                <Command className="w-4 h-4" />
              </Button>
              {onToggleFocusMode && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8"
                  onClick={onToggleFocusMode}
                >
                  <Focus className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}