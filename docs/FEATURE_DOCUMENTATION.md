# LibreOllama - Feature Documentation

*Comprehensive documentation for specific features, implementations, and design guidelines.*

---

## Table of Contents

1. [Canvas/Whiteboard System](#canvaswhiteboard-system)
2. [Dashboard Integration](#dashboard-integration)
3. [Design System Guidelines](#design-system-guidelines)
4. [AI Integration](#ai-integration)
5. [Knowledge Management](#knowledge-management)
6. [Third-Party Integrations](#third-party-integrations)

---

## Canvas/Whiteboard System

### Overview

The Canvas/Whiteboard component has been completely redesigned from a basic drag-and-drop interface to a comprehensive, professional-grade digital whiteboard similar to Miro or FigJam. This redesign provides a rich, interactive canvas for visual collaboration and note-taking.

### Key Features

#### 🎨 **Professional Whiteboard Tools**
- **Selection Tool**: Click and drag to select elements, multi-select with Ctrl/Cmd
- **Sticky Notes**: Colorful, resizable notes with auto-resize functionality
- **Text Boxes**: Rich text editing with font customization
- **Shapes**: Rectangle, circle, triangle, diamond, star, hexagon
- **Drawing/Pen**: Freehand drawing with pressure sensitivity support
- **Lines & Arrows**: Straight lines, curved lines, and arrows with customizable endpoints
- **Frames**: Organizational containers for grouping elements
- **Images**: Support for image insertion and manipulation
- **Eraser**: Remove specific elements or parts of drawings

#### 🖱️ **Intuitive Interactions**
- **Infinite Canvas**: Pan and zoom with smooth transitions
- **Multi-Selection**: Select multiple elements with selection box or Ctrl+click
- **Drag & Drop**: Move elements individually or in groups
- **Keyboard Shortcuts**: Professional shortcuts for all tools and actions
- **Context Menus**: Right-click menus for element-specific actions
- **Grid & Snapping**: Optional grid with snap-to-grid functionality

#### 🎯 **Advanced Features**
- **Undo/Redo**: Full history tracking with unlimited undo/redo
- **Layers**: Element layering with z-index management
- **Grouping**: Group elements together for collective operations
- **Templates**: Pre-built templates for common use cases
- **Export/Import**: Multiple export formats (PNG, SVG, PDF, JSON)
- **Real-time Collaboration**: Foundation for multi-user editing
- **Performance Optimization**: Virtualized rendering for large canvases

#### 🎨 **Visual Polish**
- **Modern UI**: Clean, professional interface matching Figma/Miro aesthetics
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Dark Mode**: Full dark mode support with theme switching
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Smooth Animations**: 60fps interactions with hardware acceleration

### Architecture

#### Core Components

```
lib/
├── whiteboard-types.ts      # Comprehensive type definitions
├── whiteboard-utils.ts      # Utility functions and helpers
├── whiteboard-renderer.ts   # Canvas rendering engine
├── whiteboard-tools.ts      # Tool implementations
├── whiteboard-history.ts    # Undo/redo system
└── whiteboard-export.ts     # Export functionality

components/
├── CanvasWhiteboard.tsx     # Main whiteboard component
├── WhiteboardToolbar.tsx    # Tool selection interface
├── WhiteboardSidebar.tsx    # Properties panel
├── WhiteboardElements/      # Individual element components
│   ├── StickyNote.tsx
│   ├── TextBox.tsx
│   ├── Shape.tsx
│   └── DrawingPath.tsx
└── WhiteboardTemplates/     # Template components
```

#### Key Systems

**Rendering System:**
- Hardware-accelerated Canvas 2D API
- Virtualized rendering for performance
- Efficient dirty rectangle updates
- Layer-based composition

**Event System:**
- Unified event handling for mouse, touch, and keyboard
- Gesture recognition for mobile devices
- Custom event propagation system
- Tool-specific event routing

**State Management:**
- Immutable state with structural sharing
- Optimistic updates for real-time collaboration
- Persistent storage with compression
- Version control system

### Usage Examples

#### Basic Implementation
```tsx
import { CanvasWhiteboard } from './components/CanvasWhiteboard';

function MyApp() {
  return (
    <CanvasWhiteboard
      width={1200}
      height={800}
      onSave={(data) => console.log('Canvas saved:', data)}
      onExport={(format) => console.log('Exporting as:', format)}
    />
  );
}
```

#### Advanced Configuration
```tsx
<CanvasWhiteboard
  initialData={existingCanvasData}
  tools={['select', 'pen', 'sticky-note', 'shapes']}
  gridEnabled={true}
  snapToGrid={true}
  collaborationMode={true}
  theme="dark"
  onElementAdd={(element) => handleElementAdd(element)}
  onElementUpdate={(element) => handleElementUpdate(element)}
  onElementDelete={(elementId) => handleElementDelete(elementId)}
/>
```

---

## Dashboard Integration

### Overview

The dashboard system provides a comprehensive interface integrating all productivity features into a unified workspace with ADHD-optimized design principles.

### Key Components

#### 1. **TodaysFocusDashboard** - ADHD-optimized daily productivity center
#### 2. **ActivityAggregationHub** - Cross-workflow activity tracking and insights
#### 3. **GlobalSearchInterface** - Enhanced search with typo tolerance and contextual filtering
#### 4. **MainDashboardView** - Unified dashboard integrating all productivity features

### ADHD-Optimized Features

- **Daily Intention Setting** - Start each day with clear focus
- **Energy Level Assessment** - Track and optimize energy patterns
- **Quick Wins Identification** - 15-minute tasks for momentum building
- **Visual Progress Tracking** - Clear metrics and achievement recognition
- **Focus Mode Integration** - Seamless Pomodoro timer integration
- **Smart Notifications** - Context-aware, non-intrusive alerts

### Integration Steps

#### 1. Update UnifiedWorkspace to use MainDashboardView

```tsx
// In your main App.tsx or workspace router
import { MainDashboardView } from './components/MainDashboardView';

// When currentWorkflow === 'chat', render:
<MainDashboardView
  notes={notes}
  tasks={tasks}
  chats={chats}
  onTaskCreate={handleTaskCreate}
  onTaskUpdate={handleTaskUpdate}
  onNavigateToWorkflow={setCurrentWorkflow}
/>
```

#### 2. Update ContextAwareTopBar with Search Data

```tsx
// Pass comprehensive data to the enhanced search
<ContextAwareTopBar
  searchData={{
    notes: notes,
    tasks: tasks,
    chats: chats,
    canvasElements: canvasElements
  }}
  onSearch={handleGlobalSearch}
  currentWorkflow={currentWorkflow}
/>
```

#### 3. Configure Dashboard Settings

```tsx
const dashboardConfig = {
  adhd: {
    enabled: true,
    energyTracking: true,
    quickWins: true,
    focusMode: true
  },
  layout: {
    compactMode: false,
    sidebarCollapsed: false,
    theme: 'auto'
  },
  notifications: {
    enabled: true,
    contextAware: true,
    frequency: 'moderate'
  }
};
```

### Dashboard Components

#### TodaysFocusDashboard Features
- Morning intention setting
- Energy level selector (1-5 scale)
- Today's priority tasks (max 3)
- Quick wins section (15-min tasks)
- Progress visualization
- Evening reflection prompt

#### ActivityAggregationHub Features
- Cross-workflow activity tracking
- Pattern recognition and insights
- Productivity metrics
- Weekly/monthly summaries
- Goal tracking integration
- Performance trends

---

## Design System Guidelines

### Capitalization Standards

LibreOllama uses **sentence case** for all UI text elements to create a more conversational, accessible, and modern user experience.

#### The Rule

> **Capitalize only the first word of every string and any proper nouns. Everything else stays lowercase.**

This single rule covers buttons, menu items, form labels, dialog titles, empty‑state headlines—everything. When in doubt, default to lowercase.

#### Why Sentence Case Works Well

- **Faster scanning** – Mixed ascenders and descenders create distinct word shapes
- **Conversational tone** – Mimics normal sentences for friendlier microcopy
- **Reduced visual noise** – Lowercase letters create more breathing room
- **Accessibility** – Easier to parse for users with reading difficulties
- **Platform alignment** – Matches Material Design and Apple's guidelines

#### Practical Guidelines

**✅ Correct Headings:**
- "Project overview"
- "Billing settings"
- "Chat history"
- "Agent configuration"

**❌ Incorrect:**
- "Project Overview"
- "Billing Settings"
- "Chat History"
- "Agent Configuration"

**✅ Correct Buttons:**
- "Save changes"
- "Delete project"
- "Send message"
- "Export data"

**❌ Incorrect:**
- "Save Changes"
- "Delete Project"
- "Send Message"
- "Export Data"

**✅ Correct Form Labels:**
- "Your email address"
- "Project name"
- "Due date"
- "Task priority"

#### Exceptions

**Always Capitalize:**
- Proper nouns: "GitHub", "Google", "Ollama"
- Acronyms: "API", "URL", "JSON"
- Brand names: "LibreOllama"
- Technical terms when they're proper nouns

**Special Cases:**
- File extensions: ".md", ".json", ".tsx"
- Code-related terms: "useState", "onClick"
- Settings/preferences that match system conventions

### Color System

```typescript
// Primary colors
const colors = {
  primary: {
    50: '#f0f7ff',
    500: '#3b82f6',
    900: '#1e3a8a'
  },
  neutral: {
    50: '#f9fafb',
    500: '#6b7280',
    900: '#111827'
  }
};
```

### Typography Scale

```css
/* Text sizes */
.text-xs { font-size: 0.75rem; }
.text-sm { font-size: 0.875rem; }
.text-base { font-size: 1rem; }
.text-lg { font-size: 1.125rem; }
.text-xl { font-size: 1.25rem; }
```

---

## AI Integration

### Ollama Integration

LibreOllama integrates with Ollama for local AI model execution, providing privacy-focused AI assistance without cloud dependencies.

#### Supported Models
- **Code Generation**: CodeLlama, StarCoder
- **General Chat**: Llama 2, Mistral, Orca
- **Specialized**: Vicuna, WizardCoder

#### Implementation

```typescript
// AI Service Integration
class OllamaService {
  async generateResponse(prompt: string, model: string): Promise<string> {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false
      })
    });
    
    return response.json();
  }
}
```

#### Context-Aware Features
- **Workspace Integration**: AI has access to notes, tasks, and canvas data
- **Conversation Memory**: Maintains context across chat sessions
- **Smart Suggestions**: Proactive recommendations based on activity
- **Code Analysis**: Integration with development workflows

---

## Knowledge Management

### Note-Taking System

Advanced markdown-based note-taking with rich features for knowledge organization and retrieval.

#### Features
- **Markdown Support**: Full CommonMark + GFM compatibility
- **Bidirectional Links**: [[wiki-style]] linking between notes
- **Tag System**: Hierarchical tagging with auto-completion
- **Search**: Full-text search with relevance scoring
- **Templates**: Reusable note templates

#### Knowledge Graph

Visual representation of note relationships and knowledge structure.

```typescript
interface KnowledgeNode {
  id: string;
  title: string;
  type: 'note' | 'tag' | 'project';
  connections: string[];
  metadata: {
    created: Date;
    modified: Date;
    importance: number;
  };
}
```

---

## Third-Party Integrations

### Google APIs Integration

Comprehensive integration with Google Workspace services for seamless productivity workflows.

#### Supported Services
- **Google Calendar**: Event sync, creation, and management
- **Google Tasks**: Task list synchronization
- **Gmail**: Email integration and notifications

#### Implementation

```typescript
class GoogleAPIManager {
  async syncCalendar(): Promise<CalendarEvent[]> {
    // Fetch calendar events with proper error handling
    // Handle rate limiting and quota management
    // Provide offline fallback
  }
  
  async syncTasks(): Promise<Task[]> {
    // Bidirectional task synchronization
    // Conflict resolution strategies
    // Real-time updates via webhooks
  }
}
```

#### Configuration

```typescript
const googleConfig = {
  calendar: {
    syncInterval: 15, // minutes
    calendarsToSync: ['primary', 'work'],
    conflictResolution: 'user-prompt'
  },
  tasks: {
    syncInterval: 5,
    defaultList: 'primary',
    autoArchive: true
  },
  gmail: {
    enabled: true,
    notificationTypes: ['important', 'unread'],
    syncInterval: 10
  }
};
```

#### Security & Privacy
- **OAuth 2.0**: Secure authentication flow
- **Minimal Permissions**: Request only necessary scopes
- **Local Storage**: All data cached locally with encryption
- **User Control**: Granular privacy settings

---

*This documentation covers the major features and implementations. For setup and troubleshooting, see [SETUP_TROUBLESHOOTING.md](./SETUP_TROUBLESHOOTING.md). For general development info, see [MASTER_GUIDE.md](./MASTER_GUIDE.md).*
