import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Hash, FileText, MessageSquare, CheckSquare, Settings, PenTool, Bot, Calendar, FolderKanban } from 'lucide-react';

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
  const navigate = useNavigate();

  // Commands with proper navigation
  const commands: CommandItem[] = [
    {
      id: 'dashboard',
      title: 'Go to Dashboard',
      subtitle: 'View overview and recent activity',
      icon: <Hash className="size-4" />,
      category: 'Navigation',
      action: () => navigate('/'),
      keywords: ['home', 'overview']
    },
    {
      id: 'chat',
      title: 'Go to Chat',
      subtitle: 'Start or continue conversations with AI',
      icon: <MessageSquare className="size-4" />,
      category: 'Navigation',
      action: () => navigate('/chat'),
      keywords: ['ai', 'conversation', 'llm', 'messages']
    },
    {
      id: 'projects',
      title: 'Go to Projects',
      subtitle: 'Manage and organize your projects',
      icon: <FolderKanban className="size-4" />,
      category: 'Navigation',
      action: () => navigate('/projects'),
      keywords: ['project', 'manage', 'organize']
    },
    {
      id: 'notes',
      title: 'Go to Notes',
      subtitle: 'Create and edit notes with block editor',
      icon: <FileText className="size-4" />,
      category: 'Navigation',
      action: () => navigate('/notes'),
      keywords: ['document', 'write', 'markdown', 'editor']
    },
    {
      id: 'canvas',
      title: 'Go to Canvas',
      subtitle: 'Launch the whiteboard workspace',
      icon: <PenTool className="size-4" />,
      category: 'Navigation',
      action: () => navigate('/canvas'),
      keywords: ['whiteboard', 'draw', 'design', 'sketch']
    },
    {
      id: 'calendar',
      title: 'Go to Calendar',
      subtitle: 'View and manage your schedule',
      icon: <Calendar className="size-4" />,
      category: 'Navigation',
      action: () => navigate('/calendar'),
      keywords: ['schedule', 'events', 'meetings', 'dates']
    },
    {
      id: 'tasks',
      title: 'Go to Tasks',
      subtitle: 'ADHD-optimized task management',
      icon: <CheckSquare className="size-4" />,
      category: 'Navigation',
      action: () => navigate('/tasks'),
      keywords: ['todo', 'kanban', 'productivity', 'adhd']
    },
    {
      id: 'agents',
      title: 'Go to Agents',
      subtitle: 'Configure AI agents and automations',
      icon: <Bot className="size-4" />,
      category: 'Navigation',
      action: () => navigate('/agents'),
      keywords: ['automation', 'ai', 'workflow', 'bots']
    },
    {
      id: 'settings',
      title: 'Go to Settings',
      subtitle: 'Configure app preferences',
      icon: <Settings className="size-4" />,
      category: 'Navigation',
      action: () => navigate('/settings'),
      keywords: ['preferences', 'config', 'options', 'configuration']
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

  const overlayStyle = {
    position: 'fixed' as const,
    inset: '0',
    zIndex: 50,
    background: 'var(--bg-overlay)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '20vh'
  };

  const paletteStyle = {
    background: 'var(--bg-surface)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid var(--border-subtle)',
    width: '100%',
    maxWidth: '512px',
    margin: '0 var(--space-4)'
  };

  const searchContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-4)',
    borderBottom: '1px solid var(--border-subtle)'
  };

  const inputStyle = {
    flex: '1',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--text-primary)',
    fontSize: 'var(--font-size-base)'
  };

  const kbdStyle = {
    padding: '2px var(--space-2)',
    fontSize: 'var(--font-size-xs)',
    background: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-muted)'
  };

  return (
    <div style={overlayStyle}>
      <div style={paletteStyle}>
        {/* Search Input */}
        <div style={searchContainerStyle}>
          <Search className="size-5 text-muted" />
          <input
            id="command-input"
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={inputStyle}
          />
          <kbd style={kbdStyle}>
            ESC
          </kbd>
        </div>

        {/* Commands List */}
        <div style={{
          maxHeight: '384px',
          overflowY: 'auto',
          padding: 'var(--space-2)'
        }}>
          {Object.keys(groupedCommands).length === 0 ? (
            <div style={{
              padding: 'var(--space-8) 0',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 'var(--font-size-sm)'
            }}>
              No commands found for &quot;{query}&quot;
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, categoryCommands]) => (
              <div key={category} style={{
                marginBottom: 'var(--space-4)'
              }}>
                <div style={{
                  padding: 'var(--space-1) var(--space-2)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {category}
                </div>
                <div className="flex flex-col gap-1">
                  {categoryCommands.map((command) => {
                    const globalIndex = filteredCommands.indexOf(command);
                    const isSelected = globalIndex === selectedIndex;
                    return (
                      <button
                        key={command.id}
                        onClick={() => {
                          command.action();
                          onClose();
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-3)',
                          padding: 'var(--space-3)',
                          textAlign: 'left',
                          borderRadius: 'var(--radius-md)',
                          transition: 'all 0.15s ease',
                          border: 'none',
                          cursor: 'pointer',
                          background: isSelected ? 'var(--accent-soft)' : 'transparent',
                          color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = 'var(--bg-tertiary)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
                      >
                        <span style={{
                          flexShrink: 0,
                          color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)'
                        }}>
                          {command.icon}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontWeight: 'var(--font-weight-medium)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: 'var(--font-size-sm)'
                          }}>
                            {command.title}
                          </div>
                          {command.subtitle && (
                            <div style={{
                              fontSize: 'var(--font-size-xs)',
                              color: 'var(--text-secondary)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              marginTop: '2px'
                            }}>
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
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-3) var(--space-4)',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--text-muted)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-4)'
          }}>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1)'
            }}>
              <kbd style={{
                padding: '1px var(--space-1)',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                fontSize: 'var(--font-size-xs)'
              }}>↑</kbd>
              <kbd style={{
                padding: '1px var(--space-1)',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                fontSize: 'var(--font-size-xs)'
              }}>↓</kbd>
              to navigate
            </span>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1)'
            }}>
              <kbd style={{
                padding: '1px var(--space-1)',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                fontSize: 'var(--font-size-xs)'
              }}>↵</kbd>
              to select
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
