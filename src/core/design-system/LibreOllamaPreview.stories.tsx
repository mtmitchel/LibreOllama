/**
 * LibreOllama Design System Preview
 * 
 * Comprehensive showcase of the refined design system with example components
 * demonstrating the muted blues, warmer backgrounds, and modern interactions.
 */
import type { Story } from '@ladle/react';
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Mail, 
  FolderOpen, 
  FileText, 
  Image, 
  Calendar,
  CheckSquare,
  Users,
  Settings,
  Plus,
  MoreHorizontal,
  ChevronRight,
  Moon,
  Sun,
  Search,
  Send,
  Paperclip,
  Star,
  Play,
  Pause,
  Filter,
  Zap,
  Sparkles,
  Eye,
  CheckCircle,
  Circle,
  X,
  Bell,
  Home,
  Layers,
  Code,
  GitBranch,
  Heart,
  Palette
} from 'lucide-react';

// Data moved outside component to avoid scoping conflicts
const mockChatData = [
  { id: 0, title: 'Design System Strategy', subtitle: 'Discussing the refined color palette and typography...', time: '5m ago', pinned: true },
  { id: 1, title: 'Component Architecture', subtitle: 'How should we structure the new components?', time: '1h ago' },
  { id: 2, title: 'User Experience Review', subtitle: 'The muted blues feel much more professional...', time: '2h ago' },
  { id: 3, title: 'Code Review Session', subtitle: 'Great improvements to the design tokens!', time: '1d ago' },
  { id: 4, title: 'Project Planning', subtitle: 'Next steps for the design system rollout', time: '2d ago' }
];

const mockProjectData = [
  { id: 0, title: 'Design System Refinement', progress: 85, status: 'active', team: 3, tasks: 24, description: 'Implementing the refined color palette and improved typography' },
  { id: 1, title: 'Component Library', progress: 60, status: 'active', team: 5, tasks: 18, description: 'Building consistent, reusable components for the platform' },
  { id: 2, title: 'User Interface Upgrade', progress: 35, status: 'planning', team: 4, tasks: 32, description: 'Modernizing the interface with the new design system' }
];

const LibreOllamaPreview: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [activeSection, setActiveSection] = useState<string>('chat');
  const [selectedChat, setSelectedChat] = useState<number>(0);
  const [selectedProject, setSelectedProject] = useState<number>(0);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);

  // Keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen]);

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  const NavItem = ({ icon: Icon, label, count, active, onClick }: {
    icon: React.ElementType;
    label: string;
    count?: string;
    active?: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`nav-item ${active ? 'active' : ''}`}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--space-3) var(--space-4)',
        borderRadius: 'var(--radius-xl)',
        transition: 'all 0.2s ease',
        border: 'none',
        background: active ? 'var(--accent-soft)' : 'transparent',
        color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
        cursor: 'pointer',
        fontSize: 'var(--font-size-sm)',
        fontWeight: 'var(--font-weight-medium)',
        textAlign: 'left'
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'var(--hover-bg)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <Icon size={18} style={{ opacity: 0.8 }} />
        <span>{label}</span>
      </div>
      {count && (
        <span style={{
          fontSize: 'var(--font-size-xs)',
          padding: 'var(--space-1) var(--space-2)',
          borderRadius: 'var(--radius-lg)',
          background: active ? 'var(--accent-bg)' : 'var(--bg-tertiary)',
          color: active ? 'var(--accent-text)' : 'var(--text-tertiary)',
          fontWeight: 'var(--font-weight-medium)'
        }}>
          {count}
        </span>
      )}
    </button>
  );

  const CommandPalette = () => (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      visibility: commandPaletteOpen ? 'visible' : 'hidden'
    }}>
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          opacity: commandPaletteOpen ? 1 : 0,
          transition: 'opacity 0.2s ease'
        }}
        onClick={() => setCommandPaletteOpen(false)}
      />
      <div style={{
        position: 'absolute',
        top: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        maxWidth: '90vw',
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-2xl)',
        boxShadow: 'var(--shadow-2xl)',
        opacity: commandPaletteOpen ? 1 : 0,
        transform: commandPaletteOpen ? 'translateX(-50%) scale(1)' : 'translateX(-50%) scale(0.95)',
        transition: 'all 0.2s ease'
      }}>
        <div style={{ padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Search size={18} style={{ color: 'var(--text-tertiary)', opacity: 0.6 }} />
            <input 
              type="text" 
              placeholder="Search commands, files, or actions..." 
              style={{
                flex: 1,
                background: 'transparent',
                color: 'var(--text-primary)',
                fontSize: 'var(--font-size-base)',
                outline: 'none',
                border: 'none',
                fontFamily: 'var(--font-sans)'
              }}
              autoFocus
            />
            <kbd style={{
              padding: 'var(--space-1) var(--space-2)',
              fontSize: 'var(--font-size-xs)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-tertiary)',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-mono)'
            }}>
              ESC
            </kbd>
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--border-default)', padding: 'var(--space-2)' }}>
          <div style={{ 
            padding: 'var(--space-2)', 
            fontSize: 'var(--font-size-xs)', 
            color: 'var(--text-tertiary)', 
            fontWeight: 'var(--font-weight-medium)' 
          }}>
            Quick Actions
          </div>
          <CommandItem icon={MessageSquare} label="New Chat" shortcut="⌘N" />
          <CommandItem icon={FileText} label="Create Note" shortcut="⌘⇧N" />
          <CommandItem icon={FolderOpen} label="New Project" shortcut="⌘P" />
          <CommandItem icon={Search} label="Search Everything" shortcut="⌘⇧F" />
        </div>
      </div>
    </div>
  );

  const CommandItem = ({ icon: Icon, label, shortcut }: {
    icon: React.ElementType;
    label: string;
    shortcut: string;
  }) => (
    <button style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 'var(--space-3) var(--space-4)',
      borderRadius: 'var(--radius-xl)',
      background: 'transparent',
      border: 'none',
      color: 'var(--text-primary)',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontSize: 'var(--font-size-sm)'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = 'var(--hover-bg)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'transparent';
    }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <Icon size={16} style={{ color: 'var(--text-tertiary)', opacity: 0.6 }} />
        <span>{label}</span>
      </div>
      <kbd style={{
        fontSize: 'var(--font-size-xs)',
        color: 'var(--text-tertiary)',
        fontFamily: 'var(--font-mono)'
      }}>
        {shortcut}
      </kbd>
    </button>
  );

  const ChatItem = ({ title, subtitle, time, pinned, selected, onClick }: {
    title: string;
    subtitle: string;
    time: string;
    pinned?: boolean;
    selected?: boolean;
    onClick: () => void;
  }) => (
    <button 
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-xl)',
        marginBottom: 'var(--space-2)',
        transition: 'all 0.2s ease',
        border: selected ? '1px solid var(--accent-soft)' : '1px solid transparent',
        background: selected ? 'var(--accent-ghost)' : 'transparent',
        color: selected ? 'var(--accent-text)' : 'var(--text-primary)',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.background = 'var(--hover-bg)';
          e.currentTarget.style.borderColor = 'var(--border-subtle)';
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = 'transparent';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
        <h4 style={{ 
          fontWeight: 'var(--font-weight-medium)', 
          fontSize: 'var(--font-size-sm)', 
          margin: 0,
          lineHeight: 'var(--line-height-tight)'
        }}>
          {title}
        </h4>
        <span style={{ 
          fontSize: 'var(--font-size-xs)', 
          color: 'var(--text-tertiary)',
          flexShrink: 0,
          marginLeft: 'var(--space-2)'
        }}>
          {time}
        </span>
      </div>
      <p style={{ 
        fontSize: 'var(--font-size-xs)', 
        color: 'var(--text-secondary)',
        margin: 0,
        lineHeight: 'var(--line-height-normal)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {subtitle}
      </p>
    </button>
  );

  const ChatMessage = ({ user, message, time, isAI }: {
    user: string;
    message: string;
    time: string;
    isAI?: boolean;
  }) => (
    <div style={{
      display: 'flex',
      gap: 'var(--space-3)',
      alignItems: 'flex-start',
      flexDirection: isAI ? 'row' : 'row-reverse',
      marginBottom: 'var(--space-6)'
    }}>
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        background: isAI ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
        color: isAI ? 'var(--text-secondary)' : 'white',
        fontWeight: 'var(--font-weight-semibold)',
        fontSize: 'var(--font-size-sm)'
      }}>
        {isAI ? <Sparkles size={16} /> : user[0]}
      </div>
      <div style={{ flex: 1, maxWidth: isAI ? '80%' : '70%' }}>
        <div style={{
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-2xl)',
          background: isAI ? 'var(--chat-bubble-bg)' : 'var(--accent-ghost)',
          border: isAI ? '1px solid var(--chat-bubble-border)' : '1px solid var(--accent-soft)',
          color: isAI ? 'var(--chat-bubble-text)' : 'var(--accent-text)',
          fontSize: 'var(--font-size-sm)',
          lineHeight: 'var(--line-height-relaxed)',
          boxShadow: 'var(--shadow-sm)',
          position: 'relative'
        }}>
          {message}
        </div>
        <div style={{
          marginTop: 'var(--space-2)',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--text-tertiary)',
          textAlign: isAI ? 'left' : 'right'
        }}>
          {time}
        </div>
      </div>
    </div>
  );

  const ProjectCard = ({ title, progress, status, team, tasks, selected, onClick }: {
    title: string;
    progress: number;
    status: string;
    team: number;
    tasks: number;
    selected?: boolean;
    onClick: () => void;
  }) => (
    <button 
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-xl)',
        marginBottom: 'var(--space-3)',
        transition: 'all 0.2s ease',
        border: selected ? '1px solid var(--accent-soft)' : '1px solid transparent',
        background: selected ? 'var(--accent-ghost)' : 'transparent',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.background = 'var(--hover-bg)';
          e.currentTarget.style.borderColor = 'var(--border-subtle)';
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = 'transparent';
        }
      }}
    >
      <h4 style={{ 
        fontWeight: 'var(--font-weight-medium)', 
        color: selected ? 'var(--accent-text)' : 'var(--text-primary)',
        marginBottom: 'var(--space-2)',
        fontSize: 'var(--font-size-sm)',
        lineHeight: 'var(--line-height-tight)'
      }}>
        {title}
      </h4>
      <div style={{ 
        fontSize: 'var(--font-size-xs)', 
        color: 'var(--text-tertiary)',
        marginBottom: 'var(--space-3)',
        fontWeight: 'var(--font-weight-medium)'
      }}>
        Progress
      </div>
      <div style={{
        width: '100%',
        height: '6px',
        background: 'var(--bg-tertiary)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        marginBottom: 'var(--space-3)'
      }}>
        <div 
          style={{
            height: '100%',
            background: `linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-text) 100%)`,
            borderRadius: 'var(--radius-lg)',
            transition: 'width 0.5s ease',
            width: `${progress}%`
          }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ 
          fontSize: 'var(--font-size-xs)', 
          color: 'var(--accent-text)',
          fontWeight: 'var(--font-weight-medium)'
        }}>
          {progress}%
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span style={{ 
            fontSize: 'var(--font-size-xs)', 
            color: 'var(--text-tertiary)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)'
          }}>
            <Users size={12} />
            {team}
          </span>
          <span style={{ 
            fontSize: 'var(--font-size-xs)', 
            color: 'var(--text-tertiary)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)'
          }}>
            <CheckSquare size={12} />
            {tasks}
          </span>
        </div>
      </div>
    </button>
  );

  const ChatPage = () => (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Chat List */}
      <div style={{
        width: '320px',
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-2xl) 0 0 var(--radius-2xl)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <MessageSquare size={18} style={{ color: 'var(--text-secondary)', opacity: 0.6 }} />
            <h2 style={{ 
              fontWeight: 'var(--font-weight-semibold)', 
              color: 'var(--text-primary)',
              fontSize: 'var(--font-size-lg)',
              margin: 0
            }}>
              Chats
            </h2>
          </div>
          <button style={{
            padding: 'var(--space-2)',
            borderRadius: 'var(--radius-xl)',
            background: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: 'var(--shadow-sm)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--accent-secondary)';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--accent-primary)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          }}
          >
            <Plus size={16} />
          </button>
        </div>
        
        <div style={{ padding: '0 var(--space-4) var(--space-3)' }}>
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-3)',
            transition: 'all 0.2s ease'
          }}>
            <Search size={16} style={{ color: 'var(--text-tertiary)', opacity: 0.6 }} />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              style={{
                marginLeft: 'var(--space-2)',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontSize: 'var(--font-size-sm)',
                outline: 'none',
                border: 'none',
                flex: 1,
                fontFamily: 'var(--font-sans)'
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 var(--space-2)' }}>
          <div style={{ 
            padding: 'var(--space-2)', 
            fontSize: 'var(--font-size-xs)', 
            color: 'var(--text-tertiary)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            fontWeight: 'var(--font-weight-medium)'
          }}>
            <Star size={12} style={{ opacity: 0.6 }} />
            Pinned
          </div>
          {mockChatData.filter(c => c.pinned).map(chat => (
            <ChatItem 
              key={chat.id} 
              {...chat} 
              selected={selectedChat === chat.id} 
              onClick={() => setSelectedChat(chat.id)} 
            />
          ))}
          
          <div style={{ 
            padding: 'var(--space-2)', 
            fontSize: 'var(--font-size-xs)', 
            color: 'var(--text-tertiary)',
            marginTop: 'var(--space-4)',
            fontWeight: 'var(--font-weight-medium)'
          }}>
            Recent
          </div>
          {mockChatData.filter(c => !c.pinned).map(chat => (
            <ChatItem 
              key={chat.id} 
              {...chat} 
              selected={selectedChat === chat.id} 
              onClick={() => setSelectedChat(chat.id)} 
            />
          ))}
        </div>
      </div>

      {/* Chat Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{
          background: 'var(--bg-card)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--border-default)',
          borderRadius: '0 var(--radius-2xl) 0 0',
          padding: 'var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <h3 style={{ 
              fontWeight: 'var(--font-weight-semibold)', 
              color: 'var(--text-primary)',
              fontSize: 'var(--font-size-lg)',
              margin: 0
            }}>
              {mockChatData[selectedChat].title}
            </h3>
            <span style={{
              fontSize: 'var(--font-size-xs)',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--accent-ghost)',
              color: 'var(--accent-text)',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              Claude 3.5 Sonnet
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <button style={{
              padding: 'var(--space-2)',
              borderRadius: 'var(--radius-xl)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              color: 'var(--text-tertiary)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--hover-bg)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-tertiary)';
            }}
            >
              <Star size={16} />
            </button>
            <button style={{
              padding: 'var(--space-2)',
              borderRadius: 'var(--radius-xl)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              color: 'var(--text-tertiary)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--hover-bg)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-tertiary)';
            }}
            >
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>

        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: 'var(--space-6)',
          background: 'var(--bg-primary)'
        }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <ChatMessage 
              user="You" 
              message="I love the new design system! The muted blues and warmer backgrounds make it so much easier on the eyes during long work sessions."
              time="5m ago"
            />
            <ChatMessage 
              user="LibreOllama" 
              message="I'm glad you're enjoying the refined design! The new color palette was carefully crafted to reduce eye strain while maintaining excellent readability. The muted indigo accents provide a professional feel without being overwhelming, and the warmer backgrounds create a more comfortable reading environment."
              time="4m ago"
              isAI
            />
            <ChatMessage 
              user="You" 
              message="The typography improvements are excellent too. Everything feels so much more polished and easier to read."
              time="3m ago"
            />
            <ChatMessage 
              user="LibreOllama" 
              message="Thank you! The typography scale has been enhanced with better line heights and improved hierarchy. We've also added more font sizes to create clearer distinctions between different levels of content. The combination of the refined colors and typography creates a much more professional and comfortable user experience."
              time="2m ago"
              isAI
            />
          </div>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--border-default)',
          borderRadius: '0 0 var(--radius-2xl) 0',
          padding: 'var(--space-4)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 'var(--space-3)',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            <button style={{
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-xl)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              color: 'var(--text-tertiary)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--hover-bg)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-tertiary)';
            }}
            >
              <Paperclip size={20} />
            </button>
            <div style={{
              flex: 1,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-2xl)',
              padding: 'var(--space-4)',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.2s ease'
            }}>
              <textarea 
                placeholder="Message LibreOllama..." 
                style={{
                  width: '100%',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  resize: 'none',
                  outline: 'none',
                  border: 'none',
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-sans)',
                  lineHeight: 'var(--line-height-relaxed)',
                  minHeight: '20px'
                }}
                rows={1}
              />
            </div>
            <button style={{
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-xl)',
              background: 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: 'var(--shadow-md)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--accent-secondary)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--accent-primary)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const ProjectsPage = () => (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Project List */}
      <div style={{
        width: '320px',
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-2xl) 0 0 var(--radius-2xl)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ 
            fontWeight: 'var(--font-weight-semibold)', 
            color: 'var(--text-primary)',
            fontSize: 'var(--font-size-lg)',
            margin: 0
          }}>
            Projects
          </h2>
          <button style={{
            padding: 'var(--space-2) var(--space-3)',
            borderRadius: 'var(--radius-xl)',
            background: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            boxShadow: 'var(--shadow-sm)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--accent-secondary)';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--accent-primary)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          }}
          >
            <Plus size={16} />
            New
          </button>
        </div>
        
        <div style={{ padding: '0 var(--space-4) var(--space-3)' }}>
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-3)',
            transition: 'all 0.2s ease'
          }}>
            <Search size={16} style={{ color: 'var(--text-tertiary)', opacity: 0.6 }} />
            <input 
              type="text" 
              placeholder="Search projects..." 
              style={{
                marginLeft: 'var(--space-2)',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontSize: 'var(--font-size-sm)',
                outline: 'none',
                border: 'none',
                flex: 1,
                fontFamily: 'var(--font-sans)'
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 var(--space-2)' }}>
          <div style={{ 
            padding: 'var(--space-2)', 
            fontSize: 'var(--font-size-xs)', 
            color: 'var(--text-tertiary)',
            marginBottom: 'var(--space-2)',
            fontWeight: 'var(--font-weight-medium)'
          }}>
            Active
          </div>
          {mockProjectData.filter(p => p.status === 'active').map(project => (
            <ProjectCard 
              key={project.id} 
              {...project} 
              selected={selectedProject === project.id} 
              onClick={() => setSelectedProject(project.id)} 
            />
          ))}
          
          <div style={{ 
            padding: 'var(--space-2)', 
            fontSize: 'var(--font-size-xs)', 
            color: 'var(--text-tertiary)',
            marginTop: 'var(--space-4)',
            marginBottom: 'var(--space-2)',
            fontWeight: 'var(--font-weight-medium)'
          }}>
            Planning
          </div>
          {mockProjectData.filter(p => p.status === 'planning').map(project => (
            <ProjectCard 
              key={project.id} 
              {...project} 
              selected={selectedProject === project.id} 
              onClick={() => setSelectedProject(project.id)} 
            />
          ))}
        </div>
      </div>

      {/* Project Details */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-primary)' }}>
        <div style={{ padding: 'var(--space-6)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: 'var(--space-8)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                <h1 style={{ 
                  fontSize: 'var(--font-size-4xl)', 
                  fontWeight: 'var(--font-weight-bold)', 
                  color: 'var(--text-primary)',
                  margin: 0,
                  lineHeight: 'var(--line-height-tight)'
                }}>
                  {mockProjectData[selectedProject].title}
                </h1>
                <button style={{
                  padding: 'var(--space-2)',
                  borderRadius: 'var(--radius-xl)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  color: 'var(--text-tertiary)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--hover-bg)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-tertiary)';
                }}
                >
                  <MoreHorizontal size={20} />
                </button>
              </div>
              <p style={{ 
                color: 'var(--text-secondary)', 
                fontSize: 'var(--font-size-lg)',
                lineHeight: 'var(--line-height-relaxed)',
                margin: 0
              }}>
                {mockProjectData[selectedProject].description}
              </p>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: 'var(--space-6)', 
              marginBottom: 'var(--space-8)' 
            }}>
              <StatCard icon={Zap} label="Progress" value={`${mockProjectData[selectedProject].progress}%`} accent />
              <StatCard icon={CheckCircle} label="Total Tasks" value={mockProjectData[selectedProject].tasks.toString()} />
              <StatCard icon={Circle} label="Completed" value="18" />
              <StatCard icon={Users} label="Team Members" value={mockProjectData[selectedProject].team.toString()} />
            </div>

            <div style={{
              background: 'var(--bg-card)',
              backdropFilter: 'blur(20px)',
              borderRadius: 'var(--radius-2xl)',
              border: '1px solid var(--border-default)',
              padding: 'var(--space-6)',
              marginBottom: 'var(--space-6)',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <h3 style={{ 
                fontWeight: 'var(--font-weight-semibold)', 
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-4)',
                fontSize: 'var(--font-size-xl)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)'
              }}>
                <GitBranch size={20} style={{ color: 'var(--text-secondary)', opacity: 0.6 }} />
                Active Goals
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <GoalItem title="Implement refined color palette" completed />
                <GoalItem title="Update typography system" active />
                <GoalItem title="Create comprehensive component library" />
                <GoalItem title="Optimize performance and accessibility" />
              </div>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: 'var(--space-6)' 
            }}>
              <AssetCard icon={FileText} label="Documentation" count={12} />
              <AssetCard icon={CheckSquare} label="Tasks" count={24} />
              <AssetCard icon={Image} label="Design Assets" count={8} />
              <AssetCard icon={MessageSquare} label="Discussions" count={15} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const StatCard = ({ icon: Icon, label, value, accent }: {
    icon: React.ElementType;
    label: string;
    value: string;
    accent?: boolean;
  }) => (
    <div style={{
      background: 'var(--bg-card)',
      backdropFilter: 'blur(20px)',
      borderRadius: 'var(--radius-2xl)',
      padding: 'var(--space-4)',
      border: '1px solid var(--border-default)',
      boxShadow: 'var(--shadow-lg)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
        <Icon size={20} style={{ color: accent ? 'var(--accent-text)' : 'var(--text-tertiary)', opacity: 0.8 }} />
        <span style={{ 
          fontSize: 'var(--font-size-3xl)', 
          fontWeight: 'var(--font-weight-bold)', 
          color: accent ? 'var(--accent-text)' : 'var(--text-primary)',
          lineHeight: 'var(--line-height-tight)'
        }}>
          {value}
        </span>
      </div>
      <p style={{ 
        fontSize: 'var(--font-size-sm)', 
        color: 'var(--text-secondary)',
        margin: 0
      }}>
        {label}
      </p>
    </div>
  );

  const GoalItem = ({ title, completed, active }: {
    title: string;
    completed?: boolean;
    active?: boolean;
  }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      padding: 'var(--space-3)',
      borderRadius: 'var(--radius-xl)',
      background: active ? 'var(--accent-ghost)' : 'transparent',
      transition: 'all 0.2s ease'
    }}>
      <div style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: completed ? 'var(--success)' : active ? 'var(--accent-text)' : 'var(--text-tertiary)',
        opacity: 0.8
      }}>
        {completed ? <CheckCircle size={16} /> : <Circle size={16} />}
      </div>
      <span style={{ 
        fontSize: 'var(--font-size-sm)', 
        color: completed ? 'var(--text-secondary)' : 'var(--text-primary)',
        fontWeight: 'var(--font-weight-normal)'
      }}>
        {title}
      </span>
    </div>
  );

  const AssetCard = ({ icon: Icon, label, count }: {
    icon: React.ElementType;
    label: string;
    count: number;
  }) => (
    <button style={{
      background: 'var(--bg-card)',
      backdropFilter: 'blur(20px)',
      borderRadius: 'var(--radius-2xl)',
      padding: 'var(--space-6)',
      border: '1px solid var(--border-default)',
      boxShadow: 'var(--shadow-lg)',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      textAlign: 'left',
      width: '100%'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
    }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-xl)',
            background: 'var(--bg-tertiary)'
          }}>
            <Icon size={20} style={{ color: 'var(--text-secondary)', opacity: 0.6 }} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ 
              fontWeight: 'var(--font-weight-medium)', 
              color: 'var(--text-primary)',
              fontSize: 'var(--font-size-lg)',
              margin: 0,
              marginBottom: 'var(--space-1)'
            }}>
              {count}
            </p>
            <p style={{ 
              fontSize: 'var(--font-size-sm)', 
              color: 'var(--text-secondary)',
              margin: 0
            }}>
              {label}
            </p>
          </div>
        </div>
        <ChevronRight size={16} style={{ color: 'var(--text-tertiary)', opacity: 0.4 }} />
      </div>
    </button>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'chat':
        return <ChatPage />;
      case 'projects':
        return <ProjectsPage />;
      default:
        return <ChatPage />;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      transition: 'all 0.3s ease',
      position: 'relative'
    }}>
      <CommandPalette />
      
      {/* Header */}
      <header style={{
        background: 'var(--bg-header)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-2xl) var(--radius-2xl) 0 0',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        margin: 'var(--space-3) var(--space-3) 0',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4) var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-xl)',
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-text) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <span style={{ color: 'white', fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-sm)' }}>L</span>
              </div>
              <h1 style={{ 
                fontWeight: 'var(--font-weight-semibold)', 
                fontSize: 'var(--font-size-lg)', 
                color: 'var(--text-primary)',
                margin: 0
              }}>
                LibreOllama
              </h1>
            </div>
            <button 
              onClick={() => setCommandPaletteOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-xl)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-soft)';
                e.currentTarget.style.background = 'var(--accent-ghost)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-default)';
                e.currentTarget.style.background = 'var(--bg-surface)';
              }}
            >
              <Search size={14} style={{ color: 'var(--text-tertiary)', opacity: 0.6 }} />
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>Search</span>
              <kbd style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-tertiary)',
                marginLeft: 'var(--space-8)',
                fontFamily: 'var(--font-mono)',
                background: 'var(--bg-tertiary)',
                padding: '2px var(--space-1)',
                borderRadius: 'var(--radius-sm)'
              }}>
                ⌘K
              </kbd>
            </button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              style={{
                padding: 'var(--space-2)',
                borderRadius: 'var(--radius-xl)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                color: 'var(--text-tertiary)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--hover-bg)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-tertiary)';
              }}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--bg-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)' }}>A</span>
            </div>
          </div>
        </div>
      </header>

      <div style={{ 
        display: 'flex', 
        height: 'calc(100vh - 120px)',
        margin: '0 var(--space-3) var(--space-3)',
        gap: 'var(--space-3)'
      }}>
        {/* Sidebar */}
        <aside style={{
          width: '240px',
          background: 'var(--bg-sidebar)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-2xl)',
          padding: 'var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', flex: 1 }}>
            <NavItem 
              icon={LayoutDashboard} 
              label="Dashboard" 
              active={activeSection === 'dashboard'} 
              onClick={() => setActiveSection('dashboard')} 
            />
            <NavItem 
              icon={MessageSquare} 
              label="Chat" 
              count="5" 
              active={activeSection === 'chat'} 
              onClick={() => setActiveSection('chat')} 
            />
            <NavItem 
              icon={Mail} 
              label="Mail" 
              active={activeSection === 'mail'} 
              onClick={() => setActiveSection('mail')} 
            />
            <NavItem 
              icon={FolderOpen} 
              label="Projects" 
              active={activeSection === 'projects'} 
              onClick={() => setActiveSection('projects')} 
            />
            <NavItem 
              icon={FileText} 
              label="Notes" 
              active={activeSection === 'notes'} 
              onClick={() => setActiveSection('notes')} 
            />
            <NavItem 
              icon={Image} 
              label="Canvas" 
              active={activeSection === 'canvas'} 
              onClick={() => setActiveSection('canvas')} 
            />
            <NavItem 
              icon={Calendar} 
              label="Calendar" 
              active={activeSection === 'calendar'} 
              onClick={() => setActiveSection('calendar')} 
            />
            <NavItem 
              icon={CheckSquare} 
              label="Tasks" 
              active={activeSection === 'tasks'} 
              onClick={() => setActiveSection('tasks')} 
            />
            <NavItem 
              icon={Users} 
              label="Agents" 
              active={activeSection === 'agents'} 
              onClick={() => setActiveSection('agents')} 
            />
          </div>
          
          <div style={{ 
            paddingTop: 'var(--space-4)', 
            marginTop: 'var(--space-4)', 
            borderTop: '1px solid var(--border-default)' 
          }}>
            <NavItem icon={Settings} label="Settings" onClick={() => setActiveSection('settings')} />
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ 
          flex: 1, 
          overflow: 'hidden',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-2xl)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-lg)'
        }}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export const LibreOllamaDesignPreview: Story = () => <LibreOllamaPreview />;
LibreOllamaDesignPreview.meta = {
  title: 'Design System/Complete Preview',
  description: 'Comprehensive preview of the LibreOllama design system with refined colors, typography, and modern interactions.',
};

export default {
  title: 'Design System/Preview',
}; 