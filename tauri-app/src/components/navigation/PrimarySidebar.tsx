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
  Zap,
  Network,
  PenTool,
  BarChart3,
  Download,
  Home,
  Sparkles,
  FolderOpen,
  User,
  Search
} from 'lucide-react';
import { Button } from '../ui/button-v2';
import { Card } from '../ui/card-v2';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { WorkflowState } from '../UnifiedWorkspace';
import { designTokens } from '../../lib/design-tokens';

interface PrimarySidebarProps {
  currentWorkflow: WorkflowState;
  onWorkflowChange: (workflow: WorkflowState) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  focusMode: boolean;
  onToggleFocusMode: () => void;
  onOpenCommandPalette: () => void;
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
    label: 'AI Chat',
    icon: MessageSquare,
    shortcut: '2',
    color: 'nav-item-v2',
    description: 'AI Chat Interface'
  },
  {
    id: 'folders',
    label: 'Projects',
    icon: FolderOpen,
    shortcut: '3',
    color: 'nav-item-v2',
    description: 'Project Management'
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

const workflowNavItems: NavigationItem[] = [
  {
    id: 'agents',
    label: 'AI Agents',
    icon: Bot,
    shortcut: '8',
    color: 'nav-item-v2',
    description: 'Agent Builder'
  },
  {
    id: 'knowledge-graph',
    label: 'Knowledge Graph',
    icon: Network,
    shortcut: '9',
    color: 'nav-item-v2',
    description: 'Knowledge Relationships'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    shortcut: '0',
    color: 'nav-item-v2',
    description: 'Performance Analytics'
  }
];

const systemNavItems: NavigationItem[] = [
  {
    id: 'models',
    label: 'Models',
    icon: Download,
    shortcut: 'm',
    color: 'nav-item-v2',
    description: 'Model Management'
  },
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
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Handle keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        const key = event.key;
        
        // Ctrl/Cmd + 0-9 for core navigation
        if ((key >= '0' && key <= '9')) {
          event.preventDefault();
          const allItems = [...coreNavItems, ...workflowNavItems, ...systemNavItems];
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
        
        if (key === 'm') {
          event.preventDefault();
          onWorkflowChange('models');
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
        if (key === '.') {
          event.preventDefault();
          onToggleFocusMode();
        }
        
        // Ctrl/Cmd + K for command palette
        if (key === 'k') {
          event.preventDefault();
          onOpenCommandPalette();
        }
        
        // Ctrl/Cmd + \ for sidebar toggle
        if (key === '\\') {
          event.preventDefault();
          onToggleCollapse();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onWorkflowChange, onToggleFocusMode, onOpenCommandPalette, onToggleCollapse]);

  const renderNavigationItem = (item: NavigationItem) => {
    const isActive = currentWorkflow === item.id;
    const Icon = item.icon;

    const buttonContent = (
      <div className="relative w-full group" key={item.id}> {/* Added group class here */}
        {/* Active item accent bar - Kept as is, assuming it's visually distinct and desired */}
        {isActive && (
          <div
            className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-sm transition-all duration-200"
            style={{
              backgroundColor: designTokens.colors.primary[500],
              width: '3px',
              top: '10%', // Adjusted to match previous style if needed
              height: '80%' // Adjusted to match previous style if needed
            }}
            aria-hidden="true"
          />
        )}
        <Button
          variant={isActive ? 'primary' : 'ghost'}
          size={isCollapsed ? "icon" : "md"} // Changed sm to icon for collapsed state for better icon-only display
          onClick={() => onWorkflowChange(item.id)}
          onMouseEnter={() => setHoveredItem(item.id)}
          onMouseLeave={() => setHoveredItem(null)}
          className={`
            nav-item-v2 w-full justify-start mb-1 transition-all duration-200
            ${isActive ? 'nav-item-v2-active' : ''}
            ${isCollapsed ? 'justify-center' : ''}
            border-0
            relative
            ${isActive ? 'pl-1' : ''} // Keep padding adjustment for active indicator space
          `}
          style={{
            // height, padding, fontFamily, fontSize, fontWeight removed
            // For 'md' size, padding is px-4 py-2. For 'icon' size, it's h-10 w-10.
            // If specific padding like designTokens.spacing[3] designTokens.spacing[4] is needed for 'md',
            // it might require a custom class or style override if ButtonV2 'md' is different.
            // For now, relying on ButtonV2 defaults.
          }}
          data-active={isActive}
          aria-label={isCollapsed ? `${item.label} - ${item.description}` : undefined}
          role="menuitem"
        >
        <Icon
          className={`flex-shrink-0 w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`}
          aria-hidden="true"
          style={{ color: isActive ? 'var(--v2-icon-inverted)' : 'var(--v2-icon-primary)'}}
        />
        {!isCollapsed && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            <div className="flex items-center" style={{ gap: designTokens.spacing[2] }}>
              {item.badge && (
                <Badge
                  variant="secondary"
                  className="text-xs font-medium"
                  style={{
                    height: designTokens.spacing[5],
                    padding: `0 ${designTokens.spacing[2]}`, 
                    backgroundColor: 'var(--v2-bg-badge)', // Using a token
                    color: 'var(--v2-text-badge)', // Using a token
                    border: '1px solid var(--v2-border-badge)', // Using a token
                    fontFamily: designTokens.typography.fontFamily.sans.join(', ')
                  }}
                  aria-label={`${item.badge} items`}
                >
                  {item.badge}
                </Badge>
              )}
              <kbd
                className="hidden group-hover:inline-flex select-none items-center rounded font-mono"
                style={{
                  height: designTokens.spacing[5],
                  padding: `0 ${designTokens.spacing[1.5]}`, 
                  gap: designTokens.spacing[1],
                  fontSize: '10px',
                  fontWeight: designTokens.typography.fontWeight.medium,
                  color: 'var(--v2-text-kbd)', // Using a token
                  backgroundColor: 'var(--v2-bg-kbd)', // Using a token
                  border: '1px solid var(--v2-border-kbd)', // Using a token
                  fontFamily: designTokens.typography.fontFamily.mono.join(', ')
                }}
                aria-label={`Keyboard shortcut: Ctrl+${item.shortcut}`}
              >
                ⌘{item.shortcut}
              </kbd>
            </div>
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
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="flex items-center"
              style={{
                gap: designTokens.spacing[2],
                backgroundColor: designTokens.colors.neutral[900],
                color: 'white',
                border: `1px solid ${designTokens.colors.neutral[700]}`,
                fontFamily: designTokens.typography.fontFamily.sans.join(', ')
              }}
            >
              <span>{item.label}</span>
              <kbd
                className="inline-flex select-none items-center rounded font-mono"
                style={{
                  height: designTokens.spacing[5],
                  padding: `0 ${designTokens.spacing[1.5]}`,
                  gap: designTokens.spacing[1],
                  fontSize: '10px',
                  fontWeight: designTokens.typography.fontWeight.medium,
                  color: designTokens.colors.neutral[400],
                  fontFamily: designTokens.typography.fontFamily.mono.join(', ')
                }}
              >
                ⌘{item.shortcut}
              </kbd>
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
        backgroundColor: designTokens.colors.background.primary,
        borderRight: `1px solid ${designTokens.colors.background.tertiary}`,
        fontFamily: designTokens.typography.fontFamily.sans.join(', ')
      }}
      aria-label="Primary navigation"
      role="navigation"
    >
      {/* V2 Header - Simplified without redundant branding */}
      <header
        style={{
          padding: designTokens.spacing[4],
          borderBottom: `1px solid ${designTokens.colors.background.tertiary}`
        }}
      >
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            style={{
              height: designTokens.spacing[8],
              width: designTokens.spacing[8],
              padding: '0',
              color: 'white'
            }}
            className="hover:bg-white/10"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight
                className="w-4 h-4"
                aria-hidden="true"
              />
            ) : (
              <ChevronLeft
                className="w-4 h-4"
                aria-hidden="true"
              />
            )}
          </Button>
        </div>
      </header>

      {/* V2 Global Search */
      {!isCollapsed && (
        <div
          style={{
            padding: designTokens.spacing[4],
            borderBottom: `1px solid ${designTokens.colors.background.tertiary}`
          }}
        >
          <Button
            variant="tertiary"
            className="w-full justify-start hover:bg-white/10"
            style={{
              gap: designTokens.spacing[2],
              color: 'rgba(255, 255, 255, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              fontFamily: designTokens.typography.fontFamily.sans.join(', ')
            }}
            onClick={() => {
              const searchEvent = new CustomEvent('open-global-search');
              window.dispatchEvent(searchEvent);
            }}
          >
            <Search className="w-4 h-4" />
            <span>Search...</span>
            <kbd
              className="ml-auto hidden group-hover:inline-flex select-none items-center rounded font-mono"
              style={{
                height: designTokens.spacing[5],
                padding: `0 ${designTokens.spacing[1.5]}`,
                gap: designTokens.spacing[1],
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                fontSize: '10px',
                fontWeight: designTokens.typography.fontWeight.medium,
                color: 'rgba(255, 255, 255, 0.7)',
                fontFamily: designTokens.typography.fontFamily.mono.join(', ')
              }}
            >
              ⌘K
            </kbd>
          </Button>
        </div>
      )}

      {/* V2 Quick Actions */
      {!isCollapsed && (
        <div
          style={{
            padding: designTokens.spacing[4],
            gap: designTokens.spacing[2]
          }}
          className="space-y-2"
        >
          <Button
            onClick={onOpenCommandPalette}
            variant="tertiary"
            size="sm"
            className="w-full justify-start hover:bg-white/10"
            style={{
              height: designTokens.spacing[9],
              color: 'rgba(255, 255, 255, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              fontFamily: designTokens.typography.fontFamily.sans.join(', ')
            }}
            aria-label="Open command palette"
          >
            <Command
              className="w-4 h-4 mr-2"
              aria-hidden="true"
            />
            <span className="flex-1 text-left">Quick Actions</span>
            <kbd
              className="inline-flex select-none items-center rounded font-mono"
              style={{
                height: designTokens.spacing[5],
                padding: `0 ${designTokens.spacing[1.5]}`,
                gap: designTokens.spacing[1],
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                fontSize: '10px',
                fontWeight: designTokens.typography.fontWeight.medium,
                color: 'rgba(255, 255, 255, 0.7)',
                fontFamily: designTokens.typography.fontFamily.mono.join(', ')
              }}
              aria-label="Keyboard shortcut: Ctrl+K"
            >
              ⌘K
            </kbd>
          </Button>
          
          <Button
            onClick={onToggleFocusMode}
            variant="tertiary"
            size="sm"
            className="w-full justify-start hover:bg-white/10"
            style={{
              height: designTokens.spacing[9],
              color: 'rgba(255, 255, 255, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              fontFamily: designTokens.typography.fontFamily.sans.join(', ')
            }}
            aria-label="Toggle focus mode"
          >
            <Focus
              className="w-4 h-4 mr-2"
              aria-hidden="true"
            />
            <span className="flex-1 text-left">Focus Mode</span>
            <kbd
              className="inline-flex select-none items-center rounded font-mono"
              style={{
                height: designTokens.spacing[5],
                padding: `0 ${designTokens.spacing[1.5]}`,
                gap: designTokens.spacing[1],
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                fontSize: '10px',
                fontWeight: designTokens.typography.fontWeight.medium,
                color: 'rgba(255, 255, 255, 0.7)',
                fontFamily: designTokens.typography.fontFamily.mono.join(', ')
              }}
              aria-label="Keyboard shortcut: Ctrl+."
            >
              ⌘.
            </kbd>
          </Button>
        </div>
      )}

      {/* V2 Main Navigation */}
      <nav
        className="flex-1 overflow-y-auto"
        style={{ padding: designTokens.spacing[4] }}
        role="menu"
      >
        {/* Core Navigation Items */}
        <div style={{ marginBottom: designTokens.spacing[1] }}>
          {!isCollapsed && (
            <div
              style={{
                padding: `${designTokens.spacing[2]} ${designTokens.spacing[3]}`,
                marginBottom: designTokens.spacing[2]
              }}
            >
              <h2
                style={{
                  fontSize: designTokens.typography.fontSize.xs.size,
                  fontWeight: designTokens.typography.fontWeight.semibold,
                  color: 'rgba(255, 255, 255, 0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: designTokens.typography.letterSpacing.wider,
                  fontFamily: designTokens.typography.fontFamily.sans.join(', ')
                }}
              >
                Workspace
              </h2>
            </div>
          )}
          {coreNavItems.map(renderNavigationItem)}
        </div>

        <div style={{ margin: `${designTokens.spacing[4]} 0` }}>
          <Separator style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
        </div>

        {/* Advanced Features */}
        <div style={{ marginBottom: designTokens.spacing[1] }}>
          {!isCollapsed && (
            <div
              style={{
                padding: `${designTokens.spacing[2]} ${designTokens.spacing[3]}`,
                marginBottom: designTokens.spacing[2]
              }}
            >
              <h2
                style={{
                  fontSize: designTokens.typography.fontSize.xs.size,
                  fontWeight: designTokens.typography.fontWeight.semibold,
                  color: 'rgba(255, 255, 255, 0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: designTokens.typography.letterSpacing.wider,
                  fontFamily: designTokens.typography.fontFamily.sans.join(', ')
                }}
              >
                Advanced
              </h2>
            </div>
          )}
          {workflowNavItems.map(renderNavigationItem)}
        </div>

        <div style={{ margin: `${designTokens.spacing[4]} 0` }}>
          <Separator style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
        </div>

        {/* System */}
        <div style={{ marginBottom: designTokens.spacing[1] }}>
          {!isCollapsed && (
            <div
              style={{
                padding: `${designTokens.spacing[2]} ${designTokens.spacing[3]}`,
                marginBottom: designTokens.spacing[2]
              }}
            >
              <h2
                style={{
                  fontSize: designTokens.typography.fontSize.xs.size,
                  fontWeight: designTokens.typography.fontWeight.semibold,
                  color: 'rgba(255, 255, 255, 0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: designTokens.typography.letterSpacing.wider,
                  fontFamily: designTokens.typography.fontFamily.sans.join(', ')
                }}
              >
                System
              </h2>
            </div>
          )}
          {systemNavItems.map(renderNavigationItem)}
        </div>
      </nav>

      {/* Footer */}
      <div
        className="mt-auto"
        style={{
          padding: designTokens.spacing[4],
          borderTop: `1px solid ${designTokens.colors.background.tertiary}`
        }}
      >
        <div className="flex flex-col" style={{ gap: designTokens.spacing[3] }}>
          {/* Collapse Button - Styled as Button v2 */}
          <div
            className="flex items-center justify-between"
          >
            {!isCollapsed && <span style={{ color: 'var(--v2-text-secondary)', fontSize: designTokens.typography.fontSize.sm.size }}>Collapse</span>} {/* Use token for color */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="ml-auto hover:bg-background-quaternary focus-visible:bg-background-quaternary focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2"
              style={{
                // height, width, padding, color removed
              }}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <ChevronRight size={16} style={{ color: 'var(--v2-icon-primary)'}} /> : <ChevronLeft size={16} style={{ color: 'var(--v2-icon-primary)'}} />}
            </Button>
          </div>
          
          {/* Focus Mode Button - Styled as Button v2 */}
          <div
            className="flex items-center justify-between"
          >
            {!isCollapsed && <span style={{ color: 'var(--v2-text-secondary)', fontSize: designTokens.typography.fontSize.sm.size }}>Focus Mode</span>} {/* Use token for color */}
            <Button
              variant={focusMode ? "primary" : "ghost"}
              size="icon"
              onClick={onToggleFocusMode}
              className={`ml-auto transition-colors duration-200 ${ // Standardized hover/focus for ghost
                focusMode 
                  ? ""
                  : "hover:bg-background-quaternary focus-visible:bg-background-quaternary focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2"
              }`}
              style={{
                // height, width, color, borderRadius, backgroundColor removed
              }}
              aria-label={focusMode ? "Exit focus mode" : "Enter focus mode"}
            >
              <Focus size={16} style={{ color: focusMode ? 'var(--v2-icon-inverted)' : 'var(--v2-icon-primary)'}} />
            </Button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}