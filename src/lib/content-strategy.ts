/**
 * Content Strategy Service
 * 
 * Centralized microcopy management with encouraging, clear, supportive, 
 * and quietly confident tone. Privacy-reinforcing messaging throughout.
 */

export interface ContentConfig {
  tone: 'encouraging' | 'clear' | 'supportive' | 'confident';
  context: 'empty-state' | 'error' | 'success' | 'loading' | 'action' | 'tooltip' | 'placeholder';
  module?: 'notes' | 'chat' | 'tasks' | 'agents' | 'general';
}

export interface ContentItem {
  id: string;
  primary: string;
  secondary?: string;
  action?: string;
  tooltip?: string;
  icon?: string;
}

export class ContentStrategy {
  private static readonly PRIVACY_REINFORCEMENT = {
    local: "Your data stays on your device",
    secure: "Private and secure by design", 
    offline: "Works completely offline",
    noTracking: "No tracking, no analytics"
  };

  /**
   * Get empty state content for different modules
   */
  static getEmptyState(module: string, context?: string): ContentItem {
    const emptyStates: Record<string, ContentItem> = {
      // Notes Module
      'notes-general': {
        id: 'notes-empty',
        primary: "Your knowledge garden awaits",
        secondary: "Create your first note and start building connections. Every great idea begins with a single thought.",
        action: "Create Your First Note",
        tooltip: "Start capturing your thoughts and ideas",
        icon: "plus"
      },
      'notes-search': {
        id: 'notes-search-empty',
        primary: "No notes match your search",
        secondary: "Try different keywords or create a new note with this topic. Your ideas deserve to be captured.",
        action: "Create Note from Search",
        tooltip: "Turn your search into a new note"
      },
      'notes-backlinks': {
        id: 'notes-backlinks-empty',
        primary: "No connections yet",
        secondary: "Link to this note using [[]] syntax to build your knowledge network. Connections reveal insights.",
        action: "Learn About Linking",
        tooltip: "Discover how to connect your ideas"
      },

      // Chat Module  
      'chat-general': {
        id: 'chat-empty',
        primary: "Ready for meaningful conversations",
        secondary: "Start chatting with AI to explore ideas, solve problems, or learn something new. Your conversations stay private.",
        action: "Start Conversation",
        tooltip: "Begin your first AI conversation",
        icon: "message-square"
      },
      'chat-sessions': {
        id: 'chat-sessions-empty',
        primary: "No conversations yet",
        secondary: "Your chat history will appear here. Each conversation is a step in your learning journey.",
        action: "Start First Chat",
        tooltip: "Create your first conversation"
      },
      'chat-context': {
        id: 'chat-context-empty',
        primary: "Context will appear as you chat",
        secondary: "Relevant notes and information will show here to enrich your conversations.",
        tooltip: "Context helps AI understand your needs better"
      },

      // Tasks Module
      'tasks-general': {
        id: 'tasks-empty',
        primary: "Your productivity companion is ready",
        secondary: "Create tasks, organize your workflow, and celebrate progress. Small steps lead to big achievements.",
        action: "Add Your First Task",
        tooltip: "Start organizing your work",
        icon: "check-square"
      },
      'tasks-kanban': {
        id: 'tasks-kanban-empty',
        primary: "Your workflow canvas awaits",
        secondary: "Drag tasks between columns to track progress. Visual organization makes work feel manageable.",
        action: "Create First Task",
        tooltip: "Add a task to get started"
      },
      'tasks-completed': {
        id: 'tasks-completed-empty',
        primary: "Completed tasks will appear here",
        secondary: "This space will celebrate your accomplishments. Every finished task is progress worth recognizing.",
        tooltip: "Your achievements will be displayed here"
      },

      // Agents Module
      'agents-general': {
        id: 'agents-empty',
        primary: "Build your AI assistant team",
        secondary: "Create specialized agents for different tasks. Each agent becomes smarter as you work together.",
        action: "Create First Agent",
        tooltip: "Design your AI helper",
        icon: "bot"
      },
      'agents-templates': {
        id: 'agents-templates-empty',
        primary: "Agent templates coming soon",
        secondary: "Pre-built agents for common workflows will help you get started quickly.",
        tooltip: "Templates will simplify agent creation"
      },

      // General/Cross-module
      'search-global': {
        id: 'search-global-empty',
        primary: "No results found",
        secondary: "Try different keywords or explore related topics. Sometimes the best discoveries come from unexpected searches.",
        action: "Clear Search",
        tooltip: "Start a new search"
      },
      'connections-empty': {
        id: 'connections-empty',
        primary: "No connections discovered yet",
        secondary: "As you create and link content, meaningful relationships will emerge automatically.",
        tooltip: "Connections appear as you build your knowledge base"
      }
    };

    return emptyStates[`${module}-${context || 'general'}`] || emptyStates[`${module}-general`] || {
      id: 'default-empty',
      primary: "Ready to begin",
      secondary: "Your journey starts here. Every expert was once a beginner.",
      action: "Get Started",
      tooltip: "Take the first step"
    };
  }

  /**
   * Get error messages with blameless, actionable language
   */
  static getErrorMessage(errorType: string, context?: string): ContentItem {
    const errorMessages: Record<string, ContentItem> = {
      'network-error': {
        id: 'network-error',
        primary: "Connection temporarily unavailable",
        secondary: "Your work is saved locally. Try again when your connection returns.",
        action: "Retry Connection",
        tooltip: "Attempt to reconnect"
      },
      'save-error': {
        id: 'save-error',
        primary: "Couldn't save changes right now",
        secondary: "Your work is preserved in memory. We'll try saving again automatically.",
        action: "Save Manually",
        tooltip: "Force save your changes"
      },
      'load-error': {
        id: 'load-error',
        primary: "Content couldn't load",
        secondary: "This sometimes happens. Your data is safe - let's try loading it again.",
        action: "Reload Content",
        tooltip: "Refresh and try again"
      },
      'ai-error': {
        id: 'ai-error',
        primary: "AI service temporarily unavailable",
        secondary: "You can continue working with your notes and tasks. AI features will return shortly.",
        action: "Continue Working",
        tooltip: "Keep using other features"
      },
      'validation-error': {
        id: 'validation-error',
        primary: "Something needs attention",
        secondary: "Please check the highlighted fields. Small adjustments will get you back on track.",
        action: "Review Changes",
        tooltip: "See what needs fixing"
      },
      'permission-error': {
        id: 'permission-error',
        primary: "Access not available",
        secondary: "This feature needs additional permissions. Your privacy and security remain protected.",
        action: "Grant Permission",
        tooltip: "Enable this feature safely"
      }
    };

    return errorMessages[errorType] || {
      id: 'generic-error',
      primary: "Something unexpected happened",
      secondary: "Don't worry - your work is safe. Let's get you back on track.",
      action: "Try Again",
      tooltip: "Attempt the action again"
    };
  }

  /**
   * Get success messages with positive reinforcement
   */
  static getSuccessMessage(actionType: string, context?: string): ContentItem {
    const successMessages: Record<string, ContentItem> = {
      'note-created': {
        id: 'note-created',
        primary: "Note created successfully",
        secondary: "Your idea is now captured and ready to grow. Great thinking!",
        tooltip: "Your note is saved and ready"
      },
      'task-completed': {
        id: 'task-completed',
        primary: "Task completed! 🎉",
        secondary: "Another step forward in your journey. Progress feels good, doesn't it?",
        tooltip: "Well done on finishing this task"
      },
      'link-created': {
        id: 'link-created',
        primary: "Connection made",
        secondary: "You're building a web of knowledge. These connections will reveal insights over time.",
        tooltip: "Your ideas are now linked"
      },
      'agent-created': {
        id: 'agent-created',
        primary: "Agent ready to help",
        secondary: "Your new AI assistant is configured and ready. It will learn your preferences as you work together.",
        tooltip: "Your agent is ready for tasks"
      },
      'export-complete': {
        id: 'export-complete',
        primary: "Export completed",
        secondary: "Your data is safely exported. You maintain full control of your information.",
        tooltip: "Files are ready for download"
      },
      'import-complete': {
        id: 'import-complete',
        primary: "Import successful",
        secondary: "Your content is now part of your knowledge base. Welcome to a more organized workflow.",
        tooltip: "All content imported successfully"
      },
      'sync-complete': {
        id: 'sync-complete',
        primary: "Everything is up to date",
        secondary: "Your latest changes are synchronized. Your work flows seamlessly across sessions.",
        tooltip: "All changes are saved"
      }
    };

    return successMessages[actionType] || {
      id: 'generic-success',
      primary: "Action completed",
      secondary: "You're making great progress. Keep up the excellent work!",
      tooltip: "Success!"
    };
  }

  /**
   * Get button text with verb-first, action-oriented language
   */
  static getButtonText(actionType: string, context?: string): string {
    const buttonTexts: Record<string, string> = {
      // Creation actions
      'create-note': "Create Note",
      'create-task': "Add Task", 
      'create-agent': "Build Agent",
      'create-chat': "Start Conversation",
      'create-link': "Link Ideas",

      // Transformation actions
      'summarize': "Summarize",
      'extract-tasks': "Extract Tasks",
      'generate-ideas': "Generate Ideas",
      'expand-content': "Expand",
      'refine-text': "Refine",

      // Navigation actions
      'open-note': "Open",
      'view-details': "View Details",
      'explore-connections': "Explore Links",
      'browse-history': "Browse History",

      // Organization actions
      'organize-content': "Organize",
      'tag-items': "Add Tags",
      'archive-old': "Archive",
      'sort-by-date': "Sort by Date",
      'group-similar': "Group Similar",

      // Sharing/Export actions
      'export-data': "Export",
      'share-note': "Share",
      'copy-link': "Copy Link",
      'download-backup': "Download Backup",

      // AI actions
      'ask-ai': "Ask AI",
      'improve-writing': "Improve Writing",
      'find-patterns': "Find Patterns",
      'suggest-next': "Suggest Next Steps",

      // System actions
      'save-changes': "Save Changes",
      'discard-changes': "Discard",
      'retry-action': "Try Again",
      'refresh-content': "Refresh",
      'undo-action': "Undo",
      'redo-action': "Redo"
    };

    return buttonTexts[actionType] || "Continue";
  }

  /**
   * Get placeholder text that guides and encourages
   */
  static getPlaceholderText(fieldType: string, context?: string): string {
    const placeholders: Record<string, string> = {
      // Note fields
      'note-title': "What's on your mind?",
      'note-content': "Start writing your thoughts... Use [[]] to link ideas",
      'note-tags': "Add tags to organize (press Enter)",

      // Task fields  
      'task-title': "What needs to be done?",
      'task-description': "Add details to clarify your task...",
      'task-notes': "Capture thoughts about this task...",

      // Chat fields
      'chat-message': "Ask anything, explore ideas, or start a conversation...",
      'chat-title': "Name this conversation",

      // Agent fields
      'agent-name': "Give your agent a memorable name",
      'agent-instructions': "Describe how this agent should help you...",
      'agent-description': "What makes this agent special?",

      // Search fields
      'search-global': "Search across all your content...",
      'search-notes': "Find notes by title, content, or tags...",
      'search-tasks': "Search your tasks and projects...",
      'search-chats': "Find conversations and topics...",

      // General fields
      'title-field': "Enter a descriptive title...",
      'description-field': "Add helpful details...",
      'tags-field': "Organize with tags (comma-separated)",
      'url-field': "Paste a link here...",
      'email-field': "your@email.com"
    };

    return placeholders[fieldType] || "Enter text here...";
  }

  /**
   * Get tooltip text with brief, contextual explanations
   */
  static getTooltipText(element: string, context?: string): string {
    const tooltips: Record<string, string> = {
      // Navigation tooltips
      'back-button': "Go back to previous view",
      'home-button': "Return to main dashboard", 
      'settings-button': "Customize your experience",
      'help-button': "Get help and learn features",

      // Action tooltips
      'save-button': "Save your current changes",
      'delete-button': "Remove this item permanently",
      'edit-button': "Make changes to this content",
      'copy-button': "Copy to clipboard",
      'share-button': "Share with others",

      // Feature tooltips
      'link-syntax': "Use [[title]] to link between notes",
      'tag-feature': "Tags help organize and find content",
      'ai-assist': "AI can help improve and expand your ideas",
      'context-panel': "Shows related content automatically",
      'token-meter': "Tracks AI conversation memory usage",

      // Privacy tooltips
      'local-storage': "All data stored locally on your device",
      'offline-mode': "Works without internet connection",
      'no-tracking': "No data collection or tracking",
      'export-data': "Download your data anytime",

      // Status tooltips
      'sync-status': "Shows when changes are saved",
      'connection-status': "Indicates network connectivity",
      'ai-status': "AI service availability",

      // Productivity tooltips
      'focus-mode': "Hide distractions for deep work",
      'quick-capture': "Rapidly save ideas and tasks",
      'smart-suggestions': "AI-powered content recommendations",
      'workflow-automation': "Streamline repetitive tasks"
    };

    return tooltips[element] || "Learn more about this feature";
  }

  /**
   * Get loading messages that maintain engagement
   */
  static getLoadingMessage(actionType: string): ContentItem {
    const loadingMessages: Record<string, ContentItem> = {
      'ai-thinking': {
        id: 'ai-thinking',
        primary: "AI is thinking...",
        secondary: "Crafting a thoughtful response for you",
        tooltip: "Processing your request"
      },
      'saving-content': {
        id: 'saving-content', 
        primary: "Saving your work...",
        secondary: "Preserving your progress securely",
        tooltip: "Changes being saved"
      },
      'loading-content': {
        id: 'loading-content',
        primary: "Loading your content...",
        secondary: "Preparing your workspace",
        tooltip: "Content loading"
      },
      'analyzing-content': {
        id: 'analyzing-content',
        primary: "Analyzing connections...",
        secondary: "Discovering relationships in your knowledge",
        tooltip: "Finding patterns and links"
      },
      'generating-suggestions': {
        id: 'generating-suggestions',
        primary: "Finding suggestions...",
        secondary: "Exploring possibilities for you",
        tooltip: "Creating recommendations"
      }
    };

    return loadingMessages[actionType] || {
      id: 'generic-loading',
      primary: "Working on it...",
      secondary: "This will just take a moment",
      tooltip: "Processing"
    };
  }

  /**
   * Get privacy-reinforcing messages
   */
  static getPrivacyMessage(context: string): ContentItem {
    const privacyMessages: Record<string, ContentItem> = {
      'data-local': {
        id: 'data-local',
        primary: "Your data stays with you",
        secondary: "Everything is stored locally on your device. No cloud uploads, no tracking.",
        tooltip: "Complete privacy by design"
      },
      'offline-capable': {
        id: 'offline-capable',
        primary: "Works completely offline",
        secondary: "No internet required. Your productivity isn't dependent on connectivity.",
        tooltip: "Full functionality without internet"
      },
      'no-analytics': {
        id: 'no-analytics',
        primary: "Zero tracking",
        secondary: "We don't collect usage data, analytics, or personal information. Ever.",
        tooltip: "Your privacy is absolute"
      },
      'export-freedom': {
        id: 'export-freedom',
        primary: "Your data, your control",
        secondary: "Export everything anytime. No vendor lock-in, no restrictions.",
        tooltip: "Complete data ownership"
      }
    };

    return privacyMessages[context] || privacyMessages['data-local'];
  }

  /**
   * Get contextual help text for features
   */
  static getHelpText(feature: string): ContentItem {
    const helpTexts: Record<string, ContentItem> = {
      'bidirectional-links': {
        id: 'help-links',
        primary: "Connect your ideas with [[links]]",
        secondary: "Type [[note title]] to create connections. Links work both ways and help you discover relationships.",
        action: "Try Creating a Link",
        tooltip: "Learn about linking notes"
      },
      'ai-assistance': {
        id: 'help-ai',
        primary: "AI helps you think and create",
        secondary: "Ask questions, get suggestions, or improve your writing. AI learns your style but never stores your data.",
        action: "Start AI Conversation",
        tooltip: "Explore AI features"
      },
      'task-management': {
        id: 'help-tasks',
        primary: "Organize work that matters",
        secondary: "Create tasks, track progress, and celebrate completions. Visual workflows make complex projects manageable.",
        action: "Create Your First Task",
        tooltip: "Learn task management"
      },
      'knowledge-graph': {
        id: 'help-graph',
        primary: "Visualize your knowledge network",
        secondary: "See how your ideas connect. The graph reveals patterns and suggests new directions for exploration.",
        action: "Explore Your Graph",
        tooltip: "Understand knowledge visualization"
      }
    };

    return helpTexts[feature] || {
      id: 'help-general',
      primary: "Discover powerful features",
      secondary: "This tool grows with you. Explore at your own pace and find what works best for your thinking style.",
      action: "Learn More",
      tooltip: "Get help with features"
    };
  }
}