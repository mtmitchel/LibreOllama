import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from './context-menu';
import { useTextSelection, type UseTextSelectionOptions } from '../../hooks/use-text-selection';
import type { ContextualAction } from '../../lib/contextual-actions';
import {
  MessageSquare,
  CheckSquare,
  Sparkles,
  FileText,
  Copy,
  Search,
  Brain,
  Edit3,
  Globe,
  HelpCircle,
  Lightbulb,
  Link,
  Tag,
  Folder,
  Network
} from 'lucide-react';

interface UniversalContextMenuProps extends UseTextSelectionOptions {
  children: React.ReactNode;
  className?: string;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  'send-to-chat': <MessageSquare className="h-4 w-4" />,
  'convert-to-task': <CheckSquare className="h-4 w-4" />,
  'expand-with-ai': <Sparkles className="h-4 w-4" />,
  'create-note-from-selection': <FileText className="h-4 w-4" />,
  'copy-text': <Copy className="h-4 w-4" />,
  'search-text': <Search className="h-4 w-4" />,
  'summarize-selection': <Brain className="h-4 w-4" />,
  'improve-writing': <Edit3 className="h-4 w-4" />,
  'translate-text': <Globe className="h-4 w-4" />,
  'generate-questions': <HelpCircle className="h-4 w-4" />,
  'find-concepts': <Lightbulb className="h-4 w-4" />,
  'suggest-links': <Link className="h-4 w-4" />,
  'suggest-tags': <Tag className="h-4 w-4" />,
  'auto-categorize': <Folder className="h-4 w-4" />,
  'create-connection-map': <Network className="h-4 w-4" />,
  'extract-tasks': <CheckSquare className="h-4 w-4" />
};

export function UniversalContextMenu({
  children,
  className = '',
  ...selectionOptions
}: UniversalContextMenuProps) {
  const {
    selection,
    showContextMenu,
    contextMenuPosition,
    contextualActions,
    handleActionClick,
    hideContextMenu
  } = useTextSelection(selectionOptions);

  const groupedActions = React.useMemo(() => {
    const groups: Record<string, ContextualAction[]> = {
      primary: [],
      transform: [],
      create: [],
      analyze: [],
      organize: [],
      connect: []
    };

    contextualActions.forEach(action => {
      if (['send-to-chat', 'convert-to-task', 'expand-with-ai'].includes(action.id)) {
        groups.primary.push(action);
      } else {
        groups[action.category]?.push(action) || groups.primary.push(action);
      }
    });

    return groups;
  }, [contextualActions]);

  const renderActionGroup = (actions: ContextualAction[], showSeparator = false) => {
    if (actions.length === 0) return null;

    return (
      <>
        {showSeparator && <ContextMenuSeparator />}
        {actions.map((action) => (
          <ContextMenuItem
            key={action.id}
            onClick={() => handleActionClick(action)}
            className="flex items-center gap-2"
          >
            {ACTION_ICONS[action.id] || <Sparkles className="h-4 w-4" />}
            <div className="flex-1">
              <div className="font-medium">{action.label}</div>
              {action.description && (
                <div className="text-xs text-muted-foreground">{action.description}</div>
              )}
            </div>
            {action.shortcut && (
              <ContextMenuShortcut>{action.shortcut}</ContextMenuShortcut>
            )}
            {action.aiPowered && (
              <div className="ml-1">
                <Sparkles className="h-3 w-3 text-purple-500" />
              </div>
            )}
          </ContextMenuItem>
        ))}
      </>
    );
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className={className}>
            {children}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-64">
          {selection?.text && (
            <>
              <div className="px-2 py-1.5 text-xs text-muted-foreground border-b">
                Selected: "{selection.text.slice(0, 30)}{selection.text.length > 30 ? '...' : ''}"
              </div>
              
              {/* Primary Actions */}
              {renderActionGroup(groupedActions.primary)}
              
              {/* Transform Actions */}
              {renderActionGroup(groupedActions.transform, true)}
              
              {/* Create Actions */}
              {renderActionGroup(groupedActions.create, true)}
              
              {/* Analyze Actions */}
              {renderActionGroup(groupedActions.analyze, true)}
              
              {/* Organize Actions */}
              {renderActionGroup(groupedActions.organize, true)}
              
              {/* Connect Actions */}
              {renderActionGroup(groupedActions.connect, true)}
            </>
          )}
          
          {!selection?.text && (
            <ContextMenuItem disabled>
              No text selected
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {/* Floating Context Menu for text selections */}
      {showContextMenu && selection?.text && (
        <div
          className="fixed z-50 bg-popover border border-border rounded-md shadow-lg p-1 min-w-[200px] max-w-[300px] animate-in fade-in-80 zoom-in-95"
          style={{
            left: contextMenuPosition.x,
            top: contextMenuPosition.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2 py-1.5 text-xs text-muted-foreground border-b mb-1">
            "{selection.text.slice(0, 30)}{selection.text.length > 30 ? '...' : ''}"
          </div>
          
          {/* Primary Actions */}
          {groupedActions.primary.map((action) => (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {ACTION_ICONS[action.id] || <Sparkles className="h-4 w-4" />}
              <div className="flex-1 text-left">
                <div className="font-medium">{action.label}</div>
                {action.description && (
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                )}
              </div>
              {action.aiPowered && (
                <Sparkles className="h-3 w-3 text-purple-500" />
              )}
            </button>
          ))}
          
          {/* Show more actions if available */}
          {(groupedActions.transform.length > 0 || 
            groupedActions.create.length > 0 || 
            groupedActions.analyze.length > 0) && (
            <>
              <div className="border-t my-1" />
              <div className="px-2 py-1 text-xs text-muted-foreground">
                Right-click for more options
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}