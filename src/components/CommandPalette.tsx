import React, { useState, useEffect, useCallback } from 'react';
import { Search, Hash, FileText, MessageSquare, CheckSquare, Settings, PenTool, Bot } from 'lucide-react';
import { cn } from '../lib/utils';

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  category: string;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Sample commands - in a real app these would come from your app's state/routing
  const commands: CommandItem[] = [
    {
      id: 'dashboard',
      title: 'Go to Dashboard',
      subtitle: 'View overview and recent activity',
      icon: <Hash className="w-4 h-4" />,
      category: 'Navigation',
      action: () => console.log('Navigate to dashboard'),
      keywords: ['home', 'overview']
    },
    {
      id: 'new-chat',
      title: 'New Chat',
      subtitle: 'Start a conversation with AI',
      icon: <MessageSquare className="w-4 h-4" />,
      category: 'Actions',
      action: () => console.log('Start new chat'),
      keywords: ['ai', 'conversation', 'llm']
    },
    {
      id: 'new-note',
      title: 'New Note',
      subtitle: 'Create a new note document',
      icon: <FileText className="w-4 h-4" />,
      category: 'Actions',
      action: () => console.log('Create new note'),
      keywords: ['document', 'write', 'markdown']
    },
    {
      id: 'new-task',
      title: 'New Task',
      subtitle: 'Add a task to your todo list',
      icon: <CheckSquare className="w-4 h-4" />,
      category: 'Actions',
      action: () => console.log('Create new task'),
      keywords: ['todo', 'reminder', 'productivity']
    },
    {
      id: 'canvas',
      title: 'Open Canvas',
      subtitle: 'Launch the whiteboard workspace',
      icon: <PenTool className="w-4 h-4" />,
      category: 'Navigation',
      action: () => console.log('Open canvas'),
      keywords: ['whiteboard', 'draw', 'design']
    },
    {
      id: 'agents',
      title: 'Manage Agents',
      subtitle: 'Configure AI agents and automations',
      icon: <Bot className="w-4 h-4" />,
      category: 'Navigation',
      action: () => console.log('Open agents'),
      keywords: ['automation', 'ai', 'workflow']
    },
    {
      id: 'settings',
      title: 'Settings',
      subtitle: 'Configure app preferences',
      icon: <Settings className="w-4 h-4" />,
      category: 'Navigation',
      action: () => console.log('Open settings'),
      keywords: ['preferences', 'config', 'options']
    }
  ];

  // Filter commands based on query
  const filteredCommands = commands.filter(command => {
    if (!query) return true;
    const searchText = query.toLowerCase();
    return (
      command.title.toLowerCase().includes(searchText) ||
      command.subtitle?.toLowerCase().includes(searchText) ||
      command.category.toLowerCase().includes(searchText) ||
      command.keywords?.some(keyword => keyword.includes(searchText))
    );
  });

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, command) => {
    if (!acc[command.category]) acc[command.category] = [];
    acc[command.category].push(command);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
        break;
      case 'Escape':
        onClose();
        break;
    }
  }, [filteredCommands, selectedIndex, onClose]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const input = document.getElementById('command-input');
        input?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-[20vh]">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-lg mx-4">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-700">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            id="command-input"
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder-slate-500"
          />
          <kbd className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 rounded border">
            ESC
          </kbd>
        </div>

        {/* Commands List */}
        <div className="max-h-96 overflow-y-auto p-2">
          {Object.keys(groupedCommands).length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              No commands found for "{query}"
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, categoryCommands]) => (
              <div key={category} className="mb-4 last:mb-0">
                <div className="px-2 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {category}
                </div>                <div className="space-y-1">
                  {categoryCommands.map((command) => {
                    const globalIndex = filteredCommands.indexOf(command);
                    return (
                      <button
                        key={command.id}
                        onClick={() => {
                          command.action();
                          onClose();
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors',
                          globalIndex === selectedIndex
                            ? 'bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white'
                        )}
                      >
                        <span className="flex-shrink-0 text-slate-400">
                          {command.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{command.title}</div>
                          {command.subtitle && (
                            <div className="text-sm text-slate-500 truncate">
                              {command.subtitle}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">↑</kbd>
              <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">↓</kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">↵</kbd>
              to select
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
