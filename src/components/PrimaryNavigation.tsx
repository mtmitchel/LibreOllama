import React, { useState, useEffect } from 'react';
import {
  Home,
  MessageSquare,
  FileText,
  CheckSquare,
  Calendar,
  Bot,
  Settings,
  ChevronLeft,
  ChevronRight,
  Focus,
  Command,
  Folder,
  Layout,
  Network,
  Workflow,
  Server,
  Box,
  FileCode,
  BarChart,
  TestTube,
  Code,
  LayoutDashboard,
  MessageSquareText,
  Briefcase,
  BookOpen
} from 'lucide-react';
import { Button } from './ui/button-v2';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { WorkflowState } from './UnifiedWorkspace';
import { designTokens } from '../lib/design-tokens';

interface PrimaryNavigationProps {
  currentWorkflow: WorkflowState;
  onWorkflowChange: (workflow: WorkflowState) => void;
  focusMode: boolean;
  onToggleFocusMode: () => void;
  onOpenCommandPalette: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavigationItem {
  workflow: WorkflowState;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  badge?: {
    count: number;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  };
}

export function PrimaryNavigation({
  currentWorkflow,
  onWorkflowChange,
  focusMode,
  onToggleFocusMode,
  onOpenCommandPalette,
  collapsed: isCollapsed = false,
  onToggleCollapse
}: PrimaryNavigationProps) {
  const [hoveredItem, setHoveredItem] = useState<WorkflowState | null>(null);

  const primaryNavigation: NavigationItem[] = [
    {
      workflow: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      shortcut: '⌘1'
    },
    {
      workflow: 'chat',
      label: 'Chat',
      icon: MessageSquare,
      shortcut: '⌘2',
      badge: { count: 3, variant: 'default' }
    },
    {
      workflow: 'projects',
      label: 'Projects',
      icon: Briefcase,
      shortcut: '⌘3'
    },
    {
      workflow: 'notes',
      label: 'Notes',
      icon: BookOpen,
      shortcut: '⌘4'
    },
    {
      workflow: 'tasks',
      label: 'Tasks',
      icon: CheckSquare,
      shortcut: '⌘5',
      badge: { count: 7, variant: 'secondary' }
    },
    {
      workflow: 'calendar',
      label: 'Calendar',
      icon: Calendar,
      shortcut: '⌘6'
    },
    {
      workflow: 'whiteboards',
      label: 'Whiteboards',
      icon: Layout,
      shortcut: '⌘7'
    }
  ];

  const secondaryNavigation: NavigationItem[] = [];

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        const key = e.key;
        if (key >= '1' && key <= '6') {
          e.preventDefault();
          const index = parseInt(key) - 1;
          if (index < primaryNavigation.length) {
            onWorkflowChange(primaryNavigation[index].workflow);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onWorkflowChange, primaryNavigation]);

  const renderNavigationItem = (item: NavigationItem) => {
    const isActive = currentWorkflow === item.workflow;
    const isHovered = hoveredItem === item.workflow;
    const Icon = item.icon;

    return (
      <div key={item.workflow} className="relative">
        {/* Active state accent bar */}
        {isActive && (
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent-primary rounded-r-full z-10"
          />
        )}
        
        <Button
          variant={isActive ? 'secondary' : 'ghost'}
          size="sm"
          className={`
            w-full justify-start gap-3 px-3 py-2 h-10 relative
            ${isActive ? 'bg-accent-primary/10 text-accent-primary' : 'text-[var(--v2-text-primary)]'}
            ${isHovered && !isActive ? 'bg-[var(--v2-bg-tertiary)]' : ''}
            hover:bg-[var(--v2-bg-tertiary)] 
          `}
          onClick={() => onWorkflowChange(item.workflow)}
          onMouseEnter={() => setHoveredItem(item.workflow)}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <Icon className={`h-4 w-4 ${isActive ? 'text-accent-primary' : 'text-[var(--v2-icon-primary)]'}`} />
          <span className="flex-1 text-left font-medium">{item.label}</span>
          {item.badge && (
            <Badge variant={item.badge.variant} className="ml-auto">
              {item.badge.count}
            </Badge>
          )}
        </Button>
      </div>
    );
  };

  return (
    <nav className={`
      flex flex-col h-full bg-[var(--v2-bg-secondary)] 
      border-r border-[var(--v2-border-default)] 
      ${isCollapsed ? 'w-16' : 'w-64'}
      transition-all duration-300 ease-in-out
    `}>
      {/* Header */}
      <div className="p-4 border-b border-[var(--v2-border-default)]">
        <div className="flex items-center justify-between">
          {!isCollapsed ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">LO</span>
              </div>
              <span className="font-semibold text-lg text-[var(--v2-text-primary)]">LibreOllama</span>
            </div>
          ) : (
            <div className="flex justify-center flex-1">
              <div className="w-8 h-8 bg-accent-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">LO</span>
              </div>
            </div>
          )}
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="w-8 h-8 p-0 hover:bg-[var(--v2-bg-tertiary)]"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Primary Navigation */}
      <div className="flex-1 p-2 space-y-1">
        {isCollapsed ? (
          primaryNavigation.map((item) => {
            const isActive = currentWorkflow === item.workflow;
            const Icon = item.icon;
            
            return (
              <TooltipProvider key={item.workflow}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      {/* Active state accent bar */}
                      {isActive && (
                        <div 
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent-primary rounded-r-full"
                        />
                      )}
                      
                      <Button
                        variant={isActive ? 'secondary' : 'ghost'}
                        size="sm"
                        className={`
                          w-full justify-center px-3 py-2 h-10
                          ${isActive ? 'bg-accent-primary/10 text-accent-primary' : ''}
                        `}
                        onClick={() => onWorkflowChange(item.workflow)}
                      >
                        <Icon className={`h-4 w-4 ${isActive ? 'text-accent-primary' : 'text-[var(--v2-icon-primary)]'}`} />
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <div className="flex items-center gap-2">
                      <span>{item.label}</span>
                      {item.badge && (
                        <Badge variant={item.badge.variant}>
                          {item.badge.count}
                        </Badge>
                      )}
                      {item.shortcut && (
                        <span className="text-xs text-text-muted">
                              {item.shortcut}
                            </span>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })
        ) : (
          primaryNavigation.map(renderNavigationItem)
        )}

        {/* Secondary Navigation */}
        {secondaryNavigation.length > 0 && (
          <>
            <div className={`my-4 h-px bg-${designTokens.colors.border}`} />
            {isCollapsed ? (
              secondaryNavigation.map((item) => {
                const isActive = currentWorkflow === item.workflow;
                const Icon = item.icon;
                
                return (
                  <TooltipProvider key={item.workflow}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative">
                          {/* Active state accent bar */}
                          {isActive && (
                            <div 
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent-primary rounded-r-full"
                        />
                      )}
                      
                      <Button
                        variant={isActive ? 'secondary' : 'ghost'}
                        size="sm"
                        className={`
                          w-full justify-center px-3 py-2 h-10
                          ${isActive ? 'bg-accent-primary/10 text-accent-primary' : ''}
                        `}
                        onClick={() => onWorkflowChange(item.workflow)}
                      >
                        <Icon className="h-4 w-4" />
                      </Button>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <div className="flex items-center gap-2">
                          <span>{item.label}</span>
                          {item.badge && (
                            <Badge variant={item.badge.variant}>
                              {item.badge.count}
                            </Badge>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })
            ) : (
              secondaryNavigation.map(renderNavigationItem)
            )}
          </>
        )}
      </div>

      {/* Bottom Utility Items */}
      <div className="p-2 space-y-1 border-t border-[var(--v2-border-default)]">
        {/* Settings */}
        {isCollapsed ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center px-3 py-2 h-10 transition-colors duration-200 hover:bg-[var(--v2-bg-tertiary)] focus-visible:bg-[var(--v2-bg-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary text-[var(--v2-text-primary)]"
                    style={{
                      borderRadius: designTokens?.borderRadius?.md || '6px',
                    }}
                    onClick={() => onWorkflowChange('settings')}
                  >
                  <Settings className="h-4 w-4 text-[var(--v2-icon-primary)]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <span>Settings</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 px-3 py-2 h-10 transition-colors duration-200 hover:bg-[var(--v2-bg-tertiary)] focus-visible:bg-[var(--v2-bg-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary text-[var(--v2-text-primary)]"
            style={{
              borderRadius: designTokens?.borderRadius?.md || '6px',
            }}
            onClick={() => onWorkflowChange('settings')}
          >
            <Settings className="h-4 w-4 text-[var(--v2-icon-primary)]" />
            <span className="flex-1 text-left font-medium text-[var(--v2-text-primary)]">Settings</span>
          </Button>
        )}

      </div>
    </nav>
  );
}