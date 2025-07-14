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
  Command,
  Send,
  Paperclip,
  Smile,
  Hash,
  Lock,
  Globe,
  Star,
  GitBranch,
  Play,
  Pause,
  MoreVertical,
  Filter,
  ArrowUpRight,
  Sparkles,
  Zap,
  Link2,
  Code,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Link,
  CheckCircle,
  Circle,
  X
} from 'lucide-react';

const LibreOllamaRedesign = () => {
  const [theme, setTheme] = useState('dark');
  const [activeSection, setActiveSection] = useState('chat');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState(0);
  const [selectedProject, setSelectedProject] = useState(0);
  const [selectedNote, setSelectedNote] = useState(0);

  // Keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen]);

  // Refined, muted color themes
  const themes = {
    light: {
      // Base colors
      bg: 'bg-primary',
      bgSecondary: 'bg-secondary',
      bgTertiary: 'bg-tertiary',
      
      // Text colors - reduced contrast
      text: 'text-primary',
      textSecondary: 'text-secondary',
      textTertiary: 'text-tertiary',
      
      // Borders - lighter
      border: 'border-primary',
      
      // Interactive states
      hover: 'hover:bg-hover',
      
      // Accent - soft blueberry/lavender
      accent: 'bg-accent-primary',
      accentText: 'text-accent-primary',
      accentBg: 'bg-accent-soft',
      accentHover: 'hover:bg-accent-soft',
      
      // Semantic colors - muted
      success: 'text-success',
      successBg: 'bg-success-ghost',
      warning: 'text-warning',
      warningBg: 'bg-warning-ghost',
      
      // Special effects
      shadow: 'shadow-sm',
      cardBg: 'bg-surface',
      glassBg: 'bg-glass',
      gradientText: 'bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent',
      
      // Component specific
      sidebarBg: 'bg-sidebar',
      headerBg: 'bg-header',
      
      // Input backgrounds
      inputBg: 'bg-input',
      inputBorder: 'border-input',
      inputFocus: 'focus:border-accent-primary',
      
      // Chat specific
      chatBubbleBg: 'bg-chat-bubble',
      chatBubbleBorder: 'border-chat-bubble',
      chatBubbleText: 'text-chat-bubble',
    },
    dark: {
      // Base colors - warmer, less stark
      bg: 'bg-primary',
      bgSecondary: 'bg-secondary',
      bgTertiary: 'bg-tertiary',
      
      // Text colors - softer contrast
      text: 'text-primary',
      textSecondary: 'text-secondary',
      textTertiary: 'text-tertiary',
      
      // Borders - subtle
      border: 'border-primary',
      
      // Interactive states
      hover: 'hover:bg-hover',
      
      // Accent - warm indigo
      accent: 'bg-accent-primary',
      accentText: 'text-accent-primary',
      accentBg: 'bg-accent-soft',
      accentHover: 'hover:bg-accent-soft',
      
      // Semantic colors - muted
      success: 'text-success',
      successBg: 'bg-success-ghost',
      warning: 'text-warning',
      warningBg: 'bg-warning-ghost',
      
      // Special effects
      shadow: 'shadow-md',
      cardBg: 'bg-surface',
      glassBg: 'bg-glass',
      gradientText: 'bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent',
      
      // Component specific
      sidebarBg: 'bg-sidebar',
      headerBg: 'bg-header',
      
      // Input backgrounds
      inputBg: 'bg-input',
      inputBorder: 'border-input',
      inputFocus: 'focus:border-accent-primary',
      
      // Chat specific
      chatBubbleBg: 'bg-chat-bubble',
      chatBubbleBorder: 'border-chat-bubble',
      chatBubbleText: 'text-chat-bubble',
    }
  };

  const currentTheme = themes[theme];

  // Mock data
  const workspaceItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/', isActive: activeSection === 'dashboard' },
    { name: 'Chat', icon: MessageSquare, path: '/chat', isActive: activeSection === 'chat', count: 3 },
    { name: 'Mail', icon: Mail, path: '/mail', isActive: activeSection === 'mail' },
    { name: 'Projects', icon: FolderOpen, path: '/projects', isActive: activeSection === 'projects' },
    { name: 'Notes', icon: FileText, path: '/notes', isActive: activeSection === 'notes' },
    { name: 'Canvas', icon: Image, path: '/canvas', isActive: activeSection === 'canvas' },
    { name: 'Calendar', icon: Calendar, path: '/calendar', isActive: activeSection === 'calendar' },
    { name: 'Tasks', icon: CheckSquare, path: '/tasks', isActive: activeSection === 'tasks' },
    { name: 'Agents', icon: Users, path: '/agents', isActive: activeSection === 'agents' },
    { name: 'Settings', icon: Settings, path: '/settings', isActive: activeSection === 'settings' },
  ];

  const chats = [
    { id: 1, name: 'Project planning', lastMessage: 'Let\'s break down the roadmap...', time: '2m ago', unread: 2 },
    { id: 2, name: 'Code review', lastMessage: 'The new components look great!', time: '1h ago', unread: 0 },
    { id: 3, name: 'Bug investigation', lastMessage: 'Found the issue in the auth flow', time: '3h ago', unread: 1 },
  ];

  const projects = [
    { id: 1, name: 'LibreOllama redesign', progress: 67, color: 'bg-accent-primary' },
    { id: 2, name: 'API documentation', progress: 45, color: 'bg-success' },
    { id: 3, name: 'Mobile app', progress: 23, color: 'bg-warning' },
  ];

  const notes = [
    { id: 1, title: 'Meeting notes', preview: 'Discussed the new features...', modified: '2 hours ago' },
    { id: 2, name: 'Research findings', preview: 'Key insights from user interviews...', modified: '1 day ago' },
    { id: 3, name: 'Ideas', preview: 'Random thoughts and concepts...', modified: '3 days ago' },
  ];

  const messages = [
    { id: 1, type: 'ai', content: 'Hello! I\'m here to help you with your tasks. What would you like to work on today?', time: '10:30 AM' },
    { id: 2, type: 'user', content: 'I need help planning the next sprint for our project.', time: '10:31 AM' },
    { id: 3, type: 'ai', content: 'I\'d be happy to help you plan your sprint! Let\'s start by reviewing your current backlog and identifying the highest priority items. What are the main goals for this sprint?', time: '10:32 AM' },
  ];

  // Command palette commands
  const commands = [
    { id: 1, name: 'New chat', icon: MessageSquare, shortcut: 'Ctrl+N' },
    { id: 2, name: 'Search emails', icon: Mail, shortcut: 'Ctrl+E' },
    { id: 3, name: 'Create project', icon: FolderOpen, shortcut: 'Ctrl+P' },
    { id: 4, name: 'New note', icon: FileText, shortcut: 'Ctrl+Shift+N' },
    { id: 5, name: 'Open canvas', icon: Image, shortcut: 'Ctrl+K' },
    { id: 6, name: 'View calendar', icon: Calendar, shortcut: 'Ctrl+C' },
    { id: 7, name: 'Create task', icon: CheckSquare, shortcut: 'Ctrl+T' },
    { id: 8, name: 'Toggle theme', icon: theme === 'dark' ? Sun : Moon, shortcut: 'Ctrl+D' },
  ];

  // Sidebar component
  const Sidebar = ({ section }) => (
    <div className={`w-64 ${currentTheme.sidebarBg} ${currentTheme.border} flex h-full flex-col border-r`}>
      {/* Header */}
      <div className={`p-4 ${currentTheme.border} border-b`}>
        <h2 className={`font-semibold ${currentTheme.text} text-lg`}>
          {section === 'chat' && 'Conversations'}
          {section === 'projects' && 'Projects'}
          {section === 'notes' && 'Notes'}
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {section === 'chat' && (
          <div className="space-y-1">
            {chats.map((chat, index) => (
              <div
                key={chat.id}
                className={`cursor-pointer rounded-xl p-3 transition-all ${
                  selectedChat === index ? currentTheme.accentBg : currentTheme.hover
                }`}
                onClick={() => setSelectedChat(index)}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${currentTheme.text} text-sm`}>{chat.name}</span>
                  {chat.unread > 0 && (
                    <span className={`${currentTheme.accent} rounded-full px-2 py-1 text-xs text-white`}>
                      {chat.unread}
                    </span>
                  )}
                </div>
                <p className={`${currentTheme.textSecondary} mt-1 truncate text-xs`}>{chat.lastMessage}</p>
                <p className={`${currentTheme.textTertiary} mt-1 text-xs`}>{chat.time}</p>
              </div>
            ))}
          </div>
        )}

        {section === 'projects' && (
          <div className="space-y-3">
            {projects.map((project, index) => (
              <div
                key={project.id}
                className={`cursor-pointer rounded-xl p-3 transition-all ${
                  selectedProject === index ? currentTheme.accentBg : currentTheme.hover
                }`}
                onClick={() => setSelectedProject(index)}
              >
                <div className="flex items-center gap-3">
                  <div className={`size-3 rounded-full ${project.color}`} />
                  <span className={`font-medium ${currentTheme.text} text-sm`}>{project.name}</span>
                </div>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className={currentTheme.textSecondary}>Progress</span>
                    <span className={currentTheme.textTertiary}>{project.progress}%</span>
                  </div>
                  <div className={`w-full ${currentTheme.bgTertiary} mt-1 h-1.5 rounded-full`}>
                    <div 
                      className={`h-1.5 rounded-full ${project.color}`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {section === 'notes' && (
          <div className="space-y-1">
            {notes.map((note, index) => (
              <div
                key={note.id}
                className={`cursor-pointer rounded-xl p-3 transition-all ${
                  selectedNote === index ? currentTheme.accentBg : currentTheme.hover
                }`}
                onClick={() => setSelectedNote(index)}
              >
                <span className={`font-medium ${currentTheme.text} block text-sm`}>{note.title}</span>
                <p className={`${currentTheme.textSecondary} mt-1 truncate text-xs`}>{note.preview}</p>
                <p className={`${currentTheme.textTertiary} mt-1 text-xs`}>{note.modified}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200/60 p-3">
        <button className={`flex w-full items-center gap-2 rounded-xl p-2 ${currentTheme.hover} ${currentTheme.textSecondary} text-sm`}>
          <Plus className="size-4" />
          {section === 'chat' && 'New conversation'}
          {section === 'projects' && 'New project'}
          {section === 'notes' && 'New note'}
        </button>
      </div>
    </div>
  );

  // Main content component
  const MainContent = () => (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className={`${currentTheme.headerBg} ${currentTheme.border} border-b backdrop-blur-xl`}>
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 ${currentTheme.inputBg} ${currentTheme.inputBorder} rounded-xl border`}>
              <Search className={`size-4 ${currentTheme.textTertiary}`} />
              <input
                type="text"
                placeholder="Search or type a command..."
                className={`bg-transparent text-sm outline-none ${currentTheme.text} ${currentTheme.textTertiary}`}
              />
              <div className={`flex items-center gap-1 text-xs ${currentTheme.textTertiary}`}>
                <Command className="size-3" />
                <span>K</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`rounded-xl p-2 ${currentTheme.hover} transition-colors`}
            >
              {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <button className={`rounded-xl p-2 ${currentTheme.hover} transition-colors`}>
              <MoreHorizontal className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Chat content */}
      {activeSection === 'chat' && (
        <div className="flex flex-1 flex-col">
          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'ai' && (
                  <div className={`size-8 rounded-xl ${currentTheme.accentBg} ${currentTheme.accentText} flex shrink-0 items-center justify-center`}>
                    <Sparkles className="size-4" />
                  </div>
                )}
                
                <div className={`max-w-[70%] ${message.type === 'user' ? 'order-first' : ''}`}>
                  <div
                    className={`rounded-2xl p-3 ${
                      message.type === 'user'
                        ? `${currentTheme.accent} text-white`
                        : `${currentTheme.chatBubbleBg} ${currentTheme.chatBubbleBorder} border ${currentTheme.chatBubbleText}`
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                  <p className={`${currentTheme.textTertiary} mt-1 text-xs ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                    {message.time}
                  </p>
                </div>
                
                {message.type === 'user' && (
                  <div className={`size-8 rounded-xl ${currentTheme.accent} flex shrink-0 items-center justify-center text-sm font-medium text-white`}>
                    U
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="border-t border-gray-200/60 p-6">
            <div className={`flex items-center gap-3 p-3 ${currentTheme.inputBg} ${currentTheme.inputBorder} rounded-xl border`}>
              <input
                type="text"
                placeholder="Type a message..."
                className={`flex-1 bg-transparent text-sm outline-none ${currentTheme.text} placeholder:text-gray-400`}
              />
              <button className={`rounded-lg p-1.5 ${currentTheme.hover} transition-colors`}>
                <Paperclip className="size-4" />
              </button>
              <button className={`rounded-lg p-1.5 ${currentTheme.hover} transition-colors`}>
                <Smile className="size-4" />
              </button>
              <button className={`rounded-lg p-1.5 ${currentTheme.accent} text-white transition-colors`}>
                <Send className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Other sections placeholder */}
      {activeSection !== 'chat' && (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className={`size-16 rounded-2xl ${currentTheme.accentBg} ${currentTheme.accentText} mx-auto mb-4 flex items-center justify-center`}>
              {activeSection === 'projects' && <FolderOpen className="size-8" />}
              {activeSection === 'notes' && <FileText className="size-8" />}
              {activeSection === 'dashboard' && <LayoutDashboard className="size-8" />}
            </div>
            <h3 className={`font-semibold ${currentTheme.text} mb-2 text-lg capitalize`}>
              {activeSection} coming soon
            </h3>
            <p className={`${currentTheme.textSecondary} text-sm`}>
              This section is under development
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={`min-h-screen ${currentTheme.bg} ${currentTheme.text}`}>
      {/* Command Palette */}
      {commandPaletteOpen && (
        <div className="bg-bg-overlay fixed inset-0 z-50 flex items-start justify-center pt-[10vh] backdrop-blur-sm">
          <div className={`w-full max-w-2xl ${currentTheme.glassBg} ${currentTheme.border} rounded-2xl border ${currentTheme.shadow} backdrop-blur-xl`}>
            <div className="p-4">
              <div className="mb-4 flex items-center gap-3">
                <Search className={`size-5 ${currentTheme.textTertiary}`} />
                <input
                  type="text"
                  placeholder="Search for commands..."
                  className={`flex-1 bg-transparent text-sm outline-none ${currentTheme.text} ${currentTheme.textTertiary}`}
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                {commands.map((command) => (
                  <div
                    key={command.id}
                    className={`flex items-center justify-between rounded-xl p-3 ${currentTheme.hover} cursor-pointer transition-colors`}
                    onClick={() => {
                      if (command.name === 'Toggle theme') {
                        setTheme(theme === 'dark' ? 'light' : 'dark');
                      }
                      setCommandPaletteOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <command.icon className={`size-4 ${currentTheme.textTertiary}`} />
                      <span className={`text-sm ${currentTheme.text}`}>{command.name}</span>
                    </div>
                    <kbd className={`px-2 py-1 text-xs ${currentTheme.textTertiary} ${currentTheme.bgTertiary} rounded`}>
                      {command.shortcut}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="flex h-screen">
        {/* Navigation Sidebar */}
        <div className={`w-16 ${currentTheme.sidebarBg} ${currentTheme.border} flex flex-col items-center border-r py-4`}>
          <div className={`size-8 rounded-xl ${currentTheme.accent} mb-6 flex items-center justify-center text-sm font-bold text-white`}>
            L
          </div>
          
          <div className="space-y-2">
            {workspaceItems.map((item) => (
              <button
                key={item.name}
                onClick={() => setActiveSection(item.name.toLowerCase())}
                className={`relative flex size-10 items-center justify-center rounded-xl transition-all ${
                  item.isActive 
                    ? `${currentTheme.accentBg} ${currentTheme.accentText}` 
                    : `${currentTheme.hover} ${currentTheme.textSecondary}`
                }`}
                title={item.name}
              >
                <item.icon className="size-5" />
                {item.count && (
                  <span className={`absolute -right-1 -top-1 size-5 ${currentTheme.accent} flex items-center justify-center rounded-full text-xs text-white`}>
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Section Sidebar */}
        {(activeSection === 'chat' || activeSection === 'projects' || activeSection === 'notes') && (
          <Sidebar section={activeSection} />
        )}

        {/* Main Content */}
        <MainContent />
      </div>
    </div>
  );
};

export const Application = () => <LibreOllamaRedesign />;

Application.meta = {
  title: 'Application/Full preview',
}; 