# LibreOllama UI/UX Migration - Technical Implementation Plan

## Overview

This document provides detailed technical implementation plans for migrating LibreOllama from its current shadcn/ui-based design to the new React-based design system. The migration preserves all existing functionality while adopting modern design patterns.

## Current Architecture Analysis

### Existing Tech Stack
- **Frontend**: React + TypeScript + Tauri
- **Styling**: Tailwind CSS + CSS Variables
- **Components**: shadcn/ui library (comprehensive set)
- **State Management**: Custom hooks + React Context
- **Theme System**: CSS variables with light/dark mode

### Key Components Analysis

#### 1. EnhancedChatInterface (997 lines)
**Current Features:**
- Streaming chat with real-time updates
- Dual-view mode (compare two models)
- Context visualization and token tracking
- Auto-save integration
- Drag-drop support for messages
- File attachment and prompt templates
- Agent selection and context management

**Migration Complexity: HIGH**

#### 2. MainDashboardView (398 lines)
**Current Features:**
- Quick stats with change indicators
- Dynamic quick actions based on state
- Tabbed interface (Focus, Activity, Analytics, Calendar)
- Alert system for overdue tasks
- Integration with focus mode and calendar

**Migration Complexity: MEDIUM**

#### 3. UnifiedWorkspace (438 lines)
**Current Features:**
- Three-column layout system
- Focus mode with enhanced controls
- Command palette integration
- Onboarding wizard
- Keyboard shortcuts

**Migration Complexity: MEDIUM**

## Detailed Technical Implementation Plans

### Phase 1: Foundation Components

#### 1.1 Enhanced Button Component

**Current Implementation:**
```typescript
// tauri-app/src/components/ui/button.tsx
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
```

**New Implementation Plan:**
```typescript
// Enhanced Button with icon support and new variants
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  iconLeft?: React.ComponentType<{ className?: string }>
  iconRight?: React.ComponentType<{ className?: string }>
  loading?: boolean
  fullWidth?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    iconLeft: IconLeft,
    iconRight: IconRight,
    loading,
    fullWidth,
    children,
    disabled,
    ...props 
  }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:pointer-events-none disabled:opacity-50',
          
          // Variant styles
          {
            'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'primary',
            'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
            'border border-input bg-background hover:bg-accent hover:text-accent-foreground': variant === 'tertiary',
            'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
            'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'danger',
          },
          
          // Size styles
          {
            'h-9 px-3 text-sm': size === 'sm',
            'h-10 px-4 py-2': size === 'md',
            'h-11 px-8 text-lg': size === 'lg',
            'h-10 w-10': size === 'icon',
          },
          
          // Full width
          fullWidth && 'w-full',
          
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {IconLeft && !loading && <IconLeft className="mr-2 h-4 w-4" />}
        {children}
        {IconRight && <IconRight className="ml-2 h-4 w-4" />}
      </button>
    )
  }
)
```

#### 1.2 InputField Component with Icon Support

**New Implementation:**
```typescript
interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  iconLeft?: React.ComponentType<{ className?: string }>
  error?: string
  label?: string
}

const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ className, iconLeft: IconLeft, error, label, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        <div className="relative">
          {IconLeft && (
            <IconLeft className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          )}
          <input
            ref={ref}
            className={cn(
              'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
              'ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium',
              'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              IconLeft && 'pl-10',
              error && 'border-destructive',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    )
  }
)
```

#### 1.3 SegmentedControl Component

**New Implementation:**
```typescript
interface SegmentedControlProps {
  options: Array<{ value: string; label: string }>
  value: string
  onChange: (value: string) => void
  className?: string
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
  className
}) => {
  return (
    <div className={cn(
      'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
      className
    )}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium',
            'ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2',
            'focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
            value === option.value && 'bg-background text-foreground shadow-sm'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
```

### Phase 2: Screen-Specific Implementations

#### 2.1 Dashboard Screen Migration

**Current MainDashboardView → New DashboardScreen**

**Migration Strategy:**
1. **Preserve Existing Logic**: Keep all state management and data processing
2. **Transform UI Structure**: Convert to widget-based layout
3. **Enhance Visual Design**: Apply new design system patterns

**Implementation Plan:**

```typescript
// New DashboardScreen structure
const DashboardScreen: React.FC<DashboardScreenProps> = ({
  projects,
  tasks,
  events,
  notes
}) => {
  // Preserve existing state logic from MainDashboardView
  const [activeTab, setActiveTab] = useState('focus');
  const { focusMode, toggleFocusMode } = useFocusMode();
  const quickStats = calculateQuickStats(tasks, notes, chats, focusMode);
  
  return (
    <div className="h-full overflow-auto bg-gray-50 dark:bg-gray-900">
      {/* Header with title and add widget button */}
      <div className="p-6 bg-white dark:bg-gray-800 border-b">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <Button variant="primary" iconLeft={Plus}>
            Add Widget
          </Button>
        </div>
      </div>
      
      {/* Widget Grid */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Project Snippet Widgets */}
        {projects.map(project => (
          <ProjectSnippetWidget key={project.id} project={project} />
        ))}
        
        {/* Upcoming Events Widget */}
        <UpcomingEventsWidget events={events} />
        
        {/* Due Tasks Widget */}
        <DueTasksWidget tasks={tasks} />
        
        {/* Quick Notes Widget */}
        <QuickNotesWidget />
      </div>
    </div>
  );
};
```

**Widget Components:**

```typescript
// ProjectSnippetWidget
const ProjectSnippetWidget: React.FC<{ project: Project }> = ({ project }) => {
  const progressPercentage = (project.completedTasks / project.totalTasks) * 100;
  
  return (
    <WidgetWrapper title={project.name} moreOptions>
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {project.description}
        </p>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${progressPercentage}%`,
                backgroundColor: project.color 
              }}
            />
          </div>
        </div>
        
        {/* Upcoming Milestones */}
        <div>
          <h4 className="text-sm font-medium mb-2">Upcoming Milestones</h4>
          {project.milestones.length > 0 ? (
            <div className="space-y-2">
              {project.milestones.slice(0, 3).map(milestone => (
                <div key={milestone.id} className="flex items-center gap-2 text-sm">
                  <Milestone className="h-3 w-3 text-gray-400" />
                  <span className="flex-1">{milestone.name}</span>
                  <span className="text-gray-500">{milestone.date}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">All milestones completed! 🎉</p>
          )}
        </div>
      </div>
    </WidgetWrapper>
  );
};

// WidgetWrapper - Generic container for all widgets
const WidgetWrapper: React.FC<{
  title: string;
  children: React.ReactNode;
  moreOptions?: boolean;
}> = ({ title, children, moreOptions }) => {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
        {moreOptions && (
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        )}
      </div>
      {children}
    </Card>
  );
};
```

#### 2.2 AI Chat Screen Migration

**Current EnhancedChatInterface → New AIChatScreen**

**Migration Strategy:**
1. **Preserve All Features**: Maintain streaming, dual-view, context visualization
2. **Restructure Layout**: Two-panel design (Chat List + Main Chat)
3. **Enhance UI Components**: New message bubbles and input design

**Key Preservation Points:**
- Streaming chat functionality
- Dual-view model comparison
- Context visualization and token tracking
- Auto-save integration
- Drag-drop message support
- File attachment system
- Agent selection

**Implementation Plan:**

```typescript
// New AIChatScreen structure
const AIChatScreen: React.FC<AIChatScreenProps> = () => {
  // Preserve ALL existing state and logic from EnhancedChatInterface
  const {
    chatSessions,
    activeChatSession,
    loading,
    error,
    createChatSession,
    setActiveChatSession,
    sendMessage,
    deleteChatSession
  } = useChat();
  
  // Preserve existing streaming and dual-view logic
  const [messageInput, setMessageInput] = useState('');
  const [dualViewMode, setDualViewMode] = useState(false);
  const [streamingContent, setStreamingContent] = useState<{[key: string]: string}>({});
  
  // All existing handlers preserved
  const handleSendMessage = async (e: React.FormEvent, targetModel?: string) => {
    // Preserve exact existing implementation
  };
  
  return (
    <div className="h-full flex bg-white dark:bg-gray-900">
      {/* Chat List Panel */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <ChatListPanel 
          sessions={chatSessions}
          activeSession={activeChatSession}
          onSessionSelect={setActiveChatSession}
          onNewChat={createChatSession}
        />
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeChatSession ? (
          <>
            <ChatHeader 
              session={activeChatSession}
              dualViewMode={dualViewMode}
              onToggleDualView={() => setDualViewMode(!dualViewMode)}
            />
            
            <ChatMessages 
              session={activeChatSession}
              streamingContent={streamingContent}
              dualViewMode={dualViewMode}
            />
            
            <ChatInput 
              value={messageInput}
              onChange={setMessageInput}
              onSend={handleSendMessage}
              disabled={loading}
            />
          </>
        ) : (
          <ChatEmptyState onNewChat={createChatSession} />
        )}
      </div>
    </div>
  );
};
```

**New Chat Components:**

```typescript
// ChatBubble - Enhanced message display
const ChatBubble: React.FC<{ message: ChatMessage; isStreaming?: boolean }> = ({ 
  message, 
  isStreaming 
}) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={cn(
      'flex gap-3 p-4',
      isUser ? 'justify-end' : 'justify-start'
    )}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
          <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
      )}
      
      <div className={cn(
        'max-w-[70%] rounded-lg px-4 py-2',
        isUser 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
      )}>
        <div className="prose prose-sm max-w-none">
          {message.content}
          {isStreaming && <span className="animate-pulse">|</span>}
        </div>
        
        {/* Code blocks with copy functionality */}
        {message.content.includes('```') && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-2"
            onClick={() => navigator.clipboard.writeText(extractCodeFromMessage(message.content))}
          >
            <Copy className="h-3 w-3 mr-1" />
            Copy Code
          </Button>
        )}
      </div>
      
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </div>
      )}
    </div>
  );
};

// ChatInput - Enhanced input with attachment support
const ChatInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onSend: (e: React.FormEvent) => void;
  disabled: boolean;
}> = ({ value, onChange, onSend, disabled }) => {
  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
      <form onSubmit={onSend} className="flex gap-2">
        <Button variant="ghost" size="icon" type="button">
          <Paperclip className="h-4 w-4" />
        </Button>
        
        <TextArea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 min-h-[44px] max-h-32 resize-none"
          disabled={disabled}
        />
        
        <Button type="submit" disabled={!value.trim() || disabled}>
          <Send className="h-4 w-4" />
        </Button>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" type="button">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverItem icon={RotateCcw}>Regenerate</PopoverItem>
            <PopoverItem icon={Trash2}>Clear Chat</PopoverItem>
            <PopoverItem icon={Download}>Export Chat</PopoverItem>
          </PopoverContent>
        </Popover>
      </form>
    </div>
  );
};
```

### Phase 3: Advanced Features Integration

#### 3.1 Whiteboard Canvas Migration

**Implementation Strategy:**
- Preserve existing canvas functionality
- Enhance toolbar design
- Add new drawing tools and shape objects

```typescript
// Enhanced WhiteboardScreen
const WhiteboardScreen: React.FC = () => {
  // Preserve existing canvas state and logic
  const [selectedTool, setSelectedTool] = useState<Tool>('pen');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [strokeThickness, setStrokeThickness] = useState(2);
  
  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b">
        <div className="flex items-center justify-between">
          <InputField 
            value={whiteboardTitle}
            onChange={(e) => setWhiteboardTitle(e.target.value)}
            className="text-lg font-medium border-none bg-transparent"
            placeholder="Untitled Whiteboard"
          />
          <div className="flex gap-2">
            <Button variant="secondary">Share</Button>
            <Button variant="primary">Save</Button>
          </div>
        </div>
      </div>
      
      {/* Canvas Area with Tools */}
      <div className="flex-1 relative">
        {/* Left Toolbar */}
        <Card className="absolute left-4 top-4 z-10 p-2 space-y-2">
          <ToolButton 
            tool="pen" 
            selected={selectedTool === 'pen'}
            onClick={() => setSelectedTool('pen')}
          />
          <ToolButton 
            tool="eraser" 
            selected={selectedTool === 'eraser'}
            onClick={() => setSelectedTool('eraser')}
          />
          {/* Shape tools with popover */}
          <Popover>
            <PopoverTrigger asChild>
              <ToolButton tool="shapes" selected={selectedTool.startsWith('shape')} />
            </PopoverTrigger>
            <PopoverContent>
              <div className="grid grid-cols-2 gap-2">
                <PopoverItem onClick={() => setSelectedTool('shape-rectangle')}>
                  Rectangle
                </PopoverItem>
                <PopoverItem onClick={() => setSelectedTool('shape-circle')}>
                  Circle
                </PopoverItem>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Color Picker */}
          <div className="space-y-2">
            {colors.map(color => (
              <button
                key={color}
                className={cn(
                  'w-8 h-8 rounded border-2',
                  selectedColor === color ? 'ring-2 ring-blue-500' : 'border-gray-300'
                )}
                style={{ backgroundColor: color }}
                onClick={() => setSelectedColor(color)}
              />
            ))}
          </div>
          
          {/* Stroke Thickness */}
          <div className="space-y-2">
            <label className="text-xs">Thickness</label>
            <input
              type="range"
              min="1"
              max="10"
              value={strokeThickness}
              onChange={(e) => setStrokeThickness(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </Card>
        
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className="w-full h-full bg-white dark:bg-gray-800"
          style={{
            backgroundImage: 'radial-gradient(circle, #ccc 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        />
        
        {/* Bottom Right Controls */}
        <Card className="absolute bottom-4 right-4 p-2 flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Minus className="h-4 w-4" />
          </Button>
          <span className="text-sm">100%</span>
          <Button variant="ghost" size="icon">
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button 
            variant={showMinimap ? 'primary' : 'ghost'} 
            size="icon"
            onClick={() => setShowMinimap(!showMinimap)}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </Card>
        
        {/* Minimap */}
        {showMinimap && (
          <Card className="absolute bottom-20 right-4 w-48 h-32 p-2">
            <div className="w-full h-full bg-gray-100 dark:bg-gray-700 rounded">
              {/* Minimap content */}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
```

## Migration Timeline & Milestones

### Week 1-2: Foundation Setup
- [ ] Enhanced Button component with all variants
- [ ] InputField with icon support
- [ ] SegmentedControl implementation
- [ ] CustomCheckbox component
- [ ] Theme system updates

### Week 3-4: Dashboard Migration
- [ ] DashboardScreen layout
- [ ] ProjectSnippetWidget
- [ ] UpcomingEventsWidget
- [ ] DueTasksWidget
- [ ] QuickNotesWidget

### Week 5-6: Chat Interface Migration
- [ ] Two-panel layout structure
- [ ] ChatBubble components
- [ ] Enhanced ChatInput
- [ ] Model selection UI
- [ ] Preserve all streaming functionality

### Week 7-8: Additional Screens
- [ ] ProjectWorkspaceScreen
- [ ] NotesScreen with block editor
- [ ] WhiteboardScreen enhancements
- [ ] CalendarScreen implementation

### Week 9-10: Advanced Features
- [ ] TasksScreen with Kanban/List views
- [ ] Drag-drop system integration
- [ ] Mobile responsiveness
- [ ] Accessibility improvements

### Week 11-12: Polish & Testing
- [ ] Performance optimization
- [ ] Visual regression testing
- [ ] User acceptance testing
- [ ] Documentation updates

## Risk Mitigation Strategies

### High-Risk Components
1. **EnhancedChatInterface**: Use feature flags for gradual rollout
2. **Drag-Drop System**: Maintain existing implementation, enhance UI only
3. **Focus Mode**: Preserve existing hooks, update visual layer

### Testing Strategy
- **Unit Tests**: Maintain existing test coverage
- **Integration Tests**: Test component interactions
- **Visual Regression**: Automated screenshot comparison
- **Performance Tests**: Bundle size and render performance monitoring

## Success Metrics

### Technical Metrics
- [ ] Zero functionality regression
- [ ] <10% bundle size increase
- [ ] Maintained or improved performance
- [ ] 100% accessibility compliance

### User Experience Metrics
- [ ] Improved design consistency
- [ ] Enhanced mobile experience
- [ ] Better dark mode support
- [ ] Streamlined user workflows

This technical implementation plan provides the detailed roadmap for migrating LibreOllama to the new design system while preserving all existing functionality and maintaining the robust architecture.