import { LinkParser, type LinkTarget } from './link-parser';
import { ContentStrategy } from './content-strategy';

// Enhanced action types for contextual right-click protocol
export type ContextualActionType =
  | 'send-to-chat'
  | 'convert-to-task'
  | 'expand-with-ai'
  | 'save-as-note'
  | 'extract-tasks'
  | 'copy'
  | 'search'
  | 'transform'
  | 'create'
  | 'analyze'
  | 'organize'
  | 'connect';

export interface ContextualAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  category: 'transform' | 'create' | 'analyze' | 'organize' | 'connect';
  priority: number;
  shortcut?: string;
  requiresSelection?: boolean;
  aiPowered: boolean;
  action: (context: ActionContext) => Promise<ActionResult>;
}

export interface ActionContext {
  selectedText?: string;
  currentContent: string;
  contentType: 'note' | 'task' | 'chat' | 'chat_session';
  contentId: string;
  availableTargets?: LinkTarget[];
  relatedContent?: Array<{
    id: string;
    type: string;
    title: string;
    relevance: number;
  }>;
}

export interface ActionResult {
  success: boolean;
  message: string;
  data?: {
    newContent?: string;
    createdItems?: Array<{
      type: 'note' | 'task' | 'chat';
      id: string;
      title: string;
    }>;
    suggestedLinks?: string[];
    nextActions?: string[];
  };
  error?: string;
}

export interface ContextMenu {
  x: number;
  y: number;
  actions: ContextualAction[];
  context: ActionContext;
}

export class ContextualActionsService {
  private static _aiService: any = null; // Placeholder for AI service integration

  /**
   * Initialize with AI service
   */
  static initialize(aiService: any) {
    this._aiService = aiService;
  }

  /**
   * Get contextual actions for right-click menu
   */
  static getContextualActions(context: ActionContext): ContextualAction[] {
    const actions: ContextualAction[] = [];

    // Text transformation actions (when text is selected)
    if (context.selectedText && context.selectedText.length > 0) {
      actions.push(
        ...this.getTextTransformActions(context),
        ...this.getTextAnalysisActions(context),
        ...this.getTextCreationActions(context)
      );
    }

    // Content-level actions (always available)
    actions.push(
      ...this.getContentActions(context),
      ...this.getOrganizationActions(context),
      ...this.getConnectionActions(context)
    );

    // Sort by priority and return top actions
    return actions
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 8); // Limit to 8 actions for clean UI
  }

  /**
   * Get actions for selected text transformation
   */
  private static getTextTransformActions(_context: ActionContext): ContextualAction[] {
    return [
      {
        id: 'summarize-selection',
        label: 'Summarize',
        description: 'Create a concise summary of selected text',
        icon: 'brain',
        category: 'transform',
        priority: 9,
        shortcut: 'Ctrl+Shift+S',
        requiresSelection: true,
        aiPowered: true,
        action: async (ctx) => this.summarizeText(ctx)
      },
      {
        id: 'expand-selection',
        label: 'Expand Ideas',
        description: 'Elaborate on the selected concept',
        icon: 'sparkles',
        category: 'transform',
        priority: 8,
        requiresSelection: true,
        aiPowered: true,
        action: async (ctx) => this.expandText(ctx)
      },
      {
        id: 'improve-writing',
        label: 'Improve Writing',
        description: 'Enhance clarity and style',
        icon: 'edit-3',
        category: 'transform',
        priority: 7,
        requiresSelection: true,
        aiPowered: true,
        action: async (ctx) => this.improveWriting(ctx)
      },
      {
        id: 'translate-text',
        label: 'Translate',
        description: 'Translate to another language',
        icon: 'globe',
        category: 'transform',
        priority: 6,
        requiresSelection: true,
        aiPowered: true,
        action: async (ctx) => this.translateText(ctx)
      }
    ];
  }

  /**
   * Get actions for text analysis
   */
  private static getTextAnalysisActions(_context: ActionContext): ContextualAction[] {
    return [
      {
        id: 'extract-tasks',
        label: 'Extract Tasks',
        description: 'Find actionable items in text',
        icon: 'check-square',
        category: 'analyze',
        priority: 8,
        requiresSelection: true,
        aiPowered: true,
        action: async (ctx) => this.extractTasks(ctx)
      },
      {
        id: 'find-concepts',
        label: 'Find Key Concepts',
        description: 'Identify main ideas and themes',
        icon: 'lightbulb',
        category: 'analyze',
        priority: 7,
        requiresSelection: true,
        aiPowered: true,
        action: async (ctx) => this.findConcepts(ctx)
      },
      {
        id: 'suggest-questions',
        label: 'Generate Questions',
        description: 'Create questions for deeper exploration',
        icon: 'help-circle',
        category: 'analyze',
        priority: 6,
        requiresSelection: true,
        aiPowered: true,
        action: async (ctx) => this.generateQuestions(ctx)
      }
    ];
  }

  /**
   * Get actions for creating new content from selection
   */
  private static getTextCreationActions(_context: ActionContext): ContextualAction[] {
    return [
      {
        id: 'send-to-chat',
        label: 'Send to Chat',
        description: 'Send selected text to chat interface',
        icon: 'message-square',
        category: 'create',
        priority: 9,
        shortcut: 'Ctrl+Shift+C',
        requiresSelection: true,
        aiPowered: false,
        action: async (ctx) => this.sendToChat(ctx)
      },
      {
        id: 'convert-to-task',
        label: 'Convert to Task',
        description: 'Create a task from selected text',
        icon: 'check-square',
        category: 'create',
        priority: 8,
        shortcut: 'Ctrl+Shift+T',
        requiresSelection: true,
        aiPowered: false,
        action: async (ctx) => this.convertToTask(ctx)
      },
      {
        id: 'expand-with-ai',
        label: 'Expand with AI',
        description: 'Use AI to expand on the selected text',
        icon: 'sparkles',
        category: 'transform',
        priority: 7,
        requiresSelection: true,
        aiPowered: true,
        action: async (ctx) => this.expandWithAI(ctx)
      },
      {
        id: 'create-note-from-selection',
        label: 'Save as Note',
        description: 'Turn selection into a new note',
        icon: 'file-text',
        category: 'create',
        priority: 6,
        shortcut: 'Ctrl+Shift+N',
        requiresSelection: true,
        aiPowered: false,
        action: async (ctx) => this.createNoteFromSelection(ctx)
      },
      {
        id: 'copy-text',
        label: 'Copy',
        description: 'Copy selected text to clipboard',
        icon: 'copy',
        category: 'organize',
        priority: 5,
        shortcut: 'Ctrl+C',
        requiresSelection: true,
        aiPowered: false,
        action: async (ctx) => this.copyText(ctx)
      },
      {
        id: 'search-text',
        label: 'Search',
        description: 'Search for selected text',
        icon: 'search',
        category: 'connect',
        priority: 4,
        requiresSelection: true,
        aiPowered: false,
        action: async (ctx) => this.searchText(ctx)
      }
    ];
  }

  /**
   * Get content-level actions
   */
  private static getContentActions(context: ActionContext): ContextualAction[] {
    const actions: ContextualAction[] = [
      {
        id: 'ai-assist',
        label: 'Ask AI About This',
        description: 'Get AI insights about current content',
        icon: 'bot',
        category: 'analyze',
        priority: 7,
        shortcut: 'Ctrl+/',
        aiPowered: true,
        action: async (ctx) => this.getAIInsights(ctx)
      },
      {
        id: 'find-similar',
        label: 'Find Similar Content',
        description: 'Discover related notes and ideas',
        icon: 'search',
        category: 'connect',
        priority: 6,
        aiPowered: true,
        action: async (ctx) => this.findSimilarContent(ctx)
      }
    ];

    // Content-type specific actions
    if (context.contentType === 'note') {
      actions.push({
        id: 'outline-note',
        label: 'Create Outline',
        description: 'Generate structured outline',
        icon: 'list',
        category: 'organize',
        priority: 6,
        aiPowered: true,
        action: async (ctx) => this.createOutline(ctx)
      });
    }

    if (context.contentType === 'chat' || context.contentType === 'chat_session') {
      actions.push({
        id: 'summarize-conversation',
        label: 'Summarize Chat',
        description: 'Create conversation summary',
        icon: 'message-square',
        category: 'transform',
        priority: 7,
        aiPowered: true,
        action: async (ctx) => this.summarizeConversation(ctx)
      });
    }

    return actions;
  }

  /**
   * Get organization actions
   */
  private static getOrganizationActions(_context: ActionContext): ContextualAction[] {
    return [
      {
        id: 'suggest-tags',
        label: 'Suggest Tags',
        description: 'AI-powered tag recommendations',
        icon: 'tag',
        category: 'organize',
        priority: 5,
        aiPowered: true,
        action: async (ctx) => this.suggestTags(ctx)
      },
      {
        id: 'auto-categorize',
        label: 'Auto-Categorize',
        description: 'Organize content automatically',
        icon: 'folder',
        category: 'organize',
        priority: 4,
        aiPowered: true,
        action: async (ctx) => this.autoCategorize(ctx)
      }
    ];
  }

  /**
   * Get connection actions
   */
  private static getConnectionActions(_context: ActionContext): ContextualAction[] {
    return [
      {
        id: 'suggest-links',
        label: 'Suggest Links',
        description: 'Find content to link with',
        icon: 'link',
        category: 'connect',
        priority: 6,
        aiPowered: true,
        action: async (ctx) => this.suggestLinks(ctx)
      },
      {
        id: 'create-connection-map',
        label: 'Map Connections',
        description: 'Visualize content relationships',
        icon: 'network',
        category: 'connect',
        priority: 5,
        aiPowered: true,
        action: async (ctx) => this.createConnectionMap(ctx)
      }
    ];
  }

  /**
   * Process natural language queries
   */
  static async processNaturalLanguageQuery(query: string, context: ActionContext): Promise<ActionResult> {
    // Intent detection patterns
    const intents = [
      {
        pattern: /(?:summarize|summary|tldr)/i,
        action: 'summarize',
        confidence: 0.9
      },
      {
        pattern: /(?:create|make|new)\s+(?:note|document)/i,
        action: 'create-note',
        confidence: 0.8
      },
      {
        pattern: /(?:create|make|add)\s+(?:task|todo)/i,
        action: 'create-task',
        confidence: 0.8
      },
      {
        pattern: /(?:find|search|look for)\s+(?:similar|related)/i,
        action: 'find-similar',
        confidence: 0.7
      },
      {
        pattern: /(?:extract|find|get)\s+(?:tasks|todos|actions)/i,
        action: 'extract-tasks',
        confidence: 0.8
      },
      {
        pattern: /(?:improve|enhance|better)\s+(?:writing|text)/i,
        action: 'improve-writing',
        confidence: 0.7
      },
      {
        pattern: /(?:tag|categorize|organize)/i,
        action: 'suggest-tags',
        confidence: 0.6
      },
      {
        pattern: /(?:link|connect|relate)/i,
        action: 'suggest-links',
        confidence: 0.6
      }
    ];

    // Find best matching intent
    let bestMatch = { action: 'ai-assist', confidence: 0.3 };
    
    for (const intent of intents) {
      if (intent.pattern.test(query) && intent.confidence > bestMatch.confidence) {
        bestMatch = { action: intent.action, confidence: intent.confidence };
      }
    }

    // Execute the detected action
    const actions = this.getContextualActions(context);
    const targetAction = actions.find(a => a.id === bestMatch.action || a.id.includes(bestMatch.action));

    if (targetAction) {
      return await targetAction.action(context);
    }

    // Fallback to AI assistance
    return await this.getAIInsights({ ...context, selectedText: query });
  }

  // Action implementations
  private static async summarizeText(context: ActionContext): Promise<ActionResult> {
    try {
      const text = context.selectedText || context.currentContent;
      
      // Simulate AI summarization
      const summary = `Summary: ${text.slice(0, 100)}...`;
      
      return {
        success: true,
        message: ContentStrategy.getSuccessMessage('summarize-complete').primary,
        data: {
          newContent: summary,
          nextActions: ['create-note-from-selection', 'share-summary']
        }
      };
    } catch (error) {
      return {
        success: false,
        message: ContentStrategy.getErrorMessage('ai-error').primary,
        error: 'Failed to summarize text'
      };
    }
  }

  private static async extractTasks(context: ActionContext): Promise<ActionResult> {
    try {
      const text = context.selectedText || context.currentContent;
      
      // Simple task extraction (in real implementation, use AI)
      const taskPatterns = [
        /(?:need to|should|must|have to|todo:?)\s+([^.!?]+)/gi,
        /(?:action item:?|task:?)\s+([^.!?]+)/gi,
        /-\s*\[\s*\]\s*([^.!?]+)/gi
      ];
      
      const tasks: string[] = [];
      taskPatterns.forEach(pattern => {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
          if (match[1] && match[1].trim().length > 3) {
            tasks.push(match[1].trim());
          }
        }
      });

      return {
        success: true,
        message: `Found ${tasks.length} potential tasks`,
        data: {
          createdItems: tasks.map((task, index) => ({
            type: 'task' as const,
            id: `task-${Date.now()}-${index}`,
            title: task
          })),
          nextActions: ['organize-tasks', 'set-priorities']
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Could not extract tasks',
        error: 'Task extraction failed'
      };
    }
  }

  private static async createNoteFromSelection(context: ActionContext): Promise<ActionResult> {
    try {
      const title = context.selectedText?.slice(0, 50) || 'New Note';
      const content = context.selectedText || '';
      
      return {
        success: true,
        message: ContentStrategy.getSuccessMessage('note-created').primary,
        data: {
          createdItems: [{
            type: 'note',
            id: `note-${Date.now()}`,
            title: title
          }],
          newContent: content,
          nextActions: ['add-tags', 'create-links']
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Could not create note',
        error: 'Note creation failed'
      };
    }
  }

  private static async suggestLinks(context: ActionContext): Promise<ActionResult> {
    try {
      const content = context.selectedText || context.currentContent;
      const availableTargets = context.availableTargets || [];
      
      // Find potential links using LinkParser
      const suggestions = LinkParser.generateLinkSuggestions(
        content.slice(0, 100), 
        availableTargets, 
        5
      );

      return {
        success: true,
        message: `Found ${suggestions.length} potential connections`,
        data: {
          suggestedLinks: suggestions.map(s => s.title),
          nextActions: ['create-links', 'explore-connections']
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Could not find link suggestions',
        error: 'Link suggestion failed'
      };
    }
  }

  private static async getAIInsights(_context: ActionContext): Promise<ActionResult> {
    try {
      // Simulate AI insights
      const insights = [
        "This content relates to productivity and knowledge management",
        "Consider linking to related concepts for better organization",
        "The main themes are workflow optimization and AI assistance"
      ];

      return {
        success: true,
        message: "AI analysis complete",
        data: {
          newContent: insights.join('\n\n'),
          nextActions: ['create-links', 'add-tags', 'expand-content']
        }
      };
    } catch (error) {
      return {
        success: false,
        message: ContentStrategy.getErrorMessage('ai-error').primary,
        error: 'AI insights unavailable'
      };
    }
  }

  // Enhanced action implementations for contextual right-click protocol
  private static async sendToChat(context: ActionContext): Promise<ActionResult> {
    try {
      const text = context.selectedText || '';
      
      // Trigger navigation to chat with pre-filled text
      // This would be handled by the parent component
      return {
        success: true,
        message: 'Text sent to chat interface',
        data: {
          newContent: text,
          nextActions: ['start-conversation'],
          createdItems: [{
            type: 'chat',
            id: `chat-${Date.now()}`,
            title: 'New Chat with Context'
          }]
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send text to chat',
        error: 'Chat integration failed'
      };
    }
  }

  private static async convertToTask(context: ActionContext): Promise<ActionResult> {
    try {
      const text = context.selectedText || '';
      const title = text.slice(0, 50) + (text.length > 50 ? '...' : '');
      
      return {
        success: true,
        message: 'Task created from selected text',
        data: {
          createdItems: [{
            type: 'task',
            id: `task-${Date.now()}`,
            title: title
          }],
          newContent: text,
          nextActions: ['set-priority', 'add-deadline']
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create task',
        error: 'Task creation failed'
      };
    }
  }

  private static async expandWithAI(context: ActionContext): Promise<ActionResult> {
    try {
      const text = context.selectedText || '';
      
      // Simulate AI expansion
      const expandedText = `${text}\n\n[AI Expansion]\nThis concept relates to several key areas:\n- Context and background information\n- Related concepts and connections\n- Practical applications and examples\n- Further exploration opportunities`;
      
      return {
        success: true,
        message: 'Text expanded with AI assistance',
        data: {
          newContent: expandedText,
          nextActions: ['save-as-note', 'create-links']
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to expand text with AI',
        error: 'AI expansion failed'
      };
    }
  }

  private static async copyText(context: ActionContext): Promise<ActionResult> {
    try {
      const text = context.selectedText || '';
      
      // Copy to clipboard (would use navigator.clipboard in real implementation)
      await navigator.clipboard?.writeText(text);
      
      return {
        success: true,
        message: 'Text copied to clipboard'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to copy text',
        error: 'Clipboard access failed'
      };
    }
  }

  private static async searchText(context: ActionContext): Promise<ActionResult> {
    try {
      const text = context.selectedText || '';
      
      return {
        success: true,
        message: `Searching for "${text.slice(0, 30)}..."`,
        data: {
          nextActions: ['view-results', 'refine-search']
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Search failed',
        error: 'Search functionality unavailable'
      };
    }
  }

  // AI Response Quick Actions
  static async saveAsNoteWithAutoTitle(content: string, _context?: ActionContext): Promise<ActionResult> {
    try {
      // Generate title from content using simple heuristics
      const title = this.generateAutoTitle(content);
      
      return {
        success: true,
        message: 'Note created with auto-generated title',
        data: {
          createdItems: [{
            type: 'note',
            id: `note-${Date.now()}`,
            title: title
          }],
          newContent: content,
          nextActions: ['add-tags', 'create-links']
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create note',
        error: 'Note creation failed'
      };
    }
  }

  static async extractTasksFromAIResponse(content: string): Promise<ActionResult> {
    try {
      // Enhanced task extraction with better patterns
      const taskPatterns = [
        /(?:^|\n)\s*[-*]\s*(.+?)(?=\n|$)/gm,
        /(?:^|\n)\s*\d+\.\s*(.+?)(?=\n|$)/gm,
        /(?:action item|task|todo|need to|should|must):\s*(.+?)(?=\n|$)/gim,
        /\[\s*\]\s*(.+?)(?=\n|$)/gm
      ];
      
      const tasks: string[] = [];
      const seenTasks = new Set<string>();
      
      taskPatterns.forEach(pattern => {
        const matches = content.matchAll(pattern);
        for (const match of matches) {
          if (match[1] && match[1].trim().length > 5) {
            const task = match[1].trim();
            if (!seenTasks.has(task.toLowerCase())) {
              tasks.push(task);
              seenTasks.add(task.toLowerCase());
            }
          }
        }
      });

      return {
        success: true,
        message: `Extracted ${tasks.length} tasks from AI response`,
        data: {
          createdItems: tasks.map((task, index) => ({
            type: 'task' as const,
            id: `task-${Date.now()}-${index}`,
            title: task
          })),
          nextActions: ['organize-tasks', 'set-priorities', 'assign-deadlines']
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to extract tasks',
        error: 'Task extraction failed'
      };
    }
  }

  private static generateAutoTitle(content: string): string {
    // Extract first meaningful sentence or phrase
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length > 0) {
      let title = sentences[0].trim();
      
      // Remove common AI response prefixes
      title = title.replace(/^(here's|here are|this is|these are|the following|based on)/i, '');
      title = title.trim();
      
      // Limit length and clean up
      if (title.length > 60) {
        title = title.slice(0, 57) + '...';
      }
      
      return title || 'AI Generated Note';
    }
    
    // Fallback to extracting key terms
    const words = content.split(/\s+/).filter(word =>
      word.length > 3 &&
      !/^(the|and|for|are|but|not|you|all|can|had|her|was|one|our|out|day|get|has|him|his|how|its|may|new|now|old|see|two|way|who|boy|did|man|men|put|say|she|too|use)$/i.test(word)
    );
    
    const keyWords = words.slice(0, 4).join(' ');
    return keyWords || 'AI Generated Note';
  }

  // Placeholder implementations for other actions
  private static async expandText(_context: ActionContext): Promise<ActionResult> {
    return { success: true, message: "Text expanded successfully" };
  }

  private static async improveWriting(_context: ActionContext): Promise<ActionResult> {
    return { success: true, message: "Writing improved" };
  }

  private static async translateText(_context: ActionContext): Promise<ActionResult> {
    return { success: true, message: "Text translated" };
  }

  private static async findConcepts(_context: ActionContext): Promise<ActionResult> {
    return { success: true, message: "Key concepts identified" };
  }

  private static async generateQuestions(_context: ActionContext): Promise<ActionResult> {
    return { success: true, message: "Questions generated" };
  }

  private static async createTaskFromSelection(context: ActionContext): Promise<ActionResult> {
    return this.convertToTask(context);
  }

  private static async startChatAboutSelection(context: ActionContext): Promise<ActionResult> {
    return this.sendToChat(context);
  }

  private static async findSimilarContent(_context: ActionContext): Promise<ActionResult> {
    return { success: true, message: "Similar content found" };
  }

  private static async createOutline(_context: ActionContext): Promise<ActionResult> {
    return { success: true, message: "Outline created" };
  }

  private static async summarizeConversation(_context: ActionContext): Promise<ActionResult> {
    return { success: true, message: "Conversation summarized" };
  }

  private static async suggestTags(_context: ActionContext): Promise<ActionResult> {
    return { success: true, message: "Tags suggested" };
  }

  private static async autoCategorize(_context: ActionContext): Promise<ActionResult> {
    return { success: true, message: "Content categorized" };
  }

  private static async createConnectionMap(_context: ActionContext): Promise<ActionResult> {
    return { success: true, message: "Connection map created" };
  }
}