/**
 * Enhanced Content Strategy System
 * 
 * Extends the existing content strategy with comprehensive implementation
 * of tone framework, microcopy standards, inclusive language guidelines,
 * and terminology consistency enforcement.
 * 
 * Features:
 * - Tone Framework (Directness, Reassurance, Action-Oriented, Progress Visibility)
 * - Microcopy Standards (Verb-first buttons, Blameless errors, Actionable empty states)
 * - Inclusive Language (gender-neutral, avoid ableist terms)
 * - Consistency in Terminology
 * - Reusable text components
 * - Content validation and suggestions
 */

import { ContentStrategy, type ContentConfig, type ContentItem } from './content-strategy';

export interface ToneFramework {
  directness: string[];
  reassurance: string[];
  actionOriented: string[];
  progressVisibility: string[];
}

export interface MicrocopyStandards {
  buttons: Record<string, string>;
  errors: Record<string, string>;
  emptyStates: Record<string, string>;
  success: Record<string, string>;
  loading: Record<string, string>;
  confirmations: Record<string, string>;
}

export interface InclusiveLanguageGuidelines {
  genderNeutral: Record<string, string>;
  ableistTerms: Record<string, string>;
  professionalTerms: Record<string, string>;
  encouragingTerms: Record<string, string>;
}

export interface TerminologyConsistency {
  primaryTerms: Record<string, string>;
  alternativeTerms: Record<string, string[]>;
  contextualTerms: Record<string, Record<string, string>>;
}

export interface ContentValidationResult {
  isValid: boolean;
  issues: Array<{
    type: 'tone' | 'microcopy' | 'inclusive' | 'terminology' | 'accessibility';
    severity: 'error' | 'warning' | 'suggestion';
    message: string;
    suggestion?: string;
    position?: { start: number; end: number };
  }>;
  score: number; // 0-100 content quality score
}

export class EnhancedContentStrategy extends ContentStrategy {
  private static readonly TONE_FRAMEWORK: ToneFramework = {
    directness: [
      "Clear, specific instructions",
      "Avoid ambiguous language",
      "Use active voice",
      "Be concise and purposeful",
      "State exactly what will happen"
    ],
    reassurance: [
      "Your data is safe",
      "Progress is being saved",
      "You're on the right track",
      "This is normal and expected",
      "Help is available when needed"
    ],
    actionOriented: [
      "Start with action verbs",
      "Focus on what users can do",
      "Provide clear next steps",
      "Enable immediate progress",
      "Reduce decision paralysis"
    ],
    progressVisibility: [
      "Show completion status",
      "Indicate time remaining",
      "Celebrate small wins",
      "Track incremental progress",
      "Make achievements visible"
    ]
  };

  private static readonly MICROCOPY_STANDARDS: MicrocopyStandards = {
    buttons: {
      // Creation actions (verb-first)
      'create-note': "Create Note",
      'add-task': "Add Task",
      'start-chat': "Start Conversation",
      'build-agent': "Build Agent",
      'upload-file': "Upload File",
      'import-data': "Import Data",
      'connect-service': "Connect Service",
      
      // Navigation actions
      'open-item': "Open",
      'view-details': "View Details",
      'explore-connections': "Explore Links",
      'browse-history': "Browse History",
      'go-back': "Go Back",
      'return-home': "Return Home",
      
      // Editing actions
      'save-changes': "Save Changes",
      'apply-edits': "Apply Changes",
      'discard-changes': "Discard Changes",
      'undo-action': "Undo",
      'redo-action': "Redo",
      'reset-form': "Reset Form",
      
      // Organization actions
      'organize-content': "Organize",
      'sort-items': "Sort",
      'filter-results': "Filter",
      'group-similar': "Group Similar",
      'archive-old': "Archive",
      'tag-items': "Add Tags",
      
      // Sharing actions
      'share-item': "Share",
      'export-data': "Export",
      'copy-link': "Copy Link",
      'download-backup': "Download",
      'send-feedback': "Send Feedback",
      
      // System actions
      'refresh-content': "Refresh",
      'retry-action': "Try Again",
      'cancel-action': "Cancel",
      'confirm-action': "Confirm",
      'delete-item': "Delete",
      'remove-item': "Remove"
    },
    
    errors: {
      'network-error': "Connection temporarily unavailable. Your work is saved locally.",
      'save-error': "Unable to save changes right now. We'll try again automatically.",
      'load-error': "Content couldn't load. Your data is safe - let's try again.",
      'validation-error': "Please check the highlighted fields to continue.",
      'permission-error': "This feature needs additional permissions to work properly.",
      'file-error': "File couldn't be processed. Please try a different format.",
      'sync-error': "Sync temporarily paused. Changes will sync when connection returns.",
      'quota-error': "Storage limit reached. Consider archiving older content.",
      'timeout-error': "Request took longer than expected. Please try again.",
      'format-error': "Format not recognized. Please check the file type.",
      'size-error': "File is too large. Maximum size is 10MB.",
      'auth-error': "Session expired. Please sign in again to continue."
    },
    
    emptyStates: {
      'notes-empty': "Your knowledge garden awaits. Create your first note to start building connections.",
      'tasks-empty': "Ready to tackle your goals? Add your first task to get organized.",
      'chats-empty': "Start a conversation with AI to explore ideas and solve problems.",
      'agents-empty': "Build your AI assistant team. Create specialized agents for different workflows.",
      'search-empty': "No results found. Try different keywords or explore related topics.",
      'connections-empty': "Connections will appear as you link your ideas together.",
      'history-empty': "Your activity history will appear here as you work.",
      'favorites-empty': "Star important items to see them here for quick access.",
      'archive-empty': "Archived items will appear here when you need to reference them.",
      'trash-empty': "Deleted items appear here temporarily before permanent removal."
    },
    
    success: {
      'note-created': "Note created successfully! Your idea is now captured.",
      'task-completed': "Task completed! Great progress on your goals.",
      'link-created': "Connection made! Your ideas are now linked.",
      'file-uploaded': "File uploaded successfully and ready to use.",
      'data-exported': "Export completed! Your data is ready for download.",
      'sync-completed': "Everything is up to date and synchronized.",
      'backup-created': "Backup created successfully! Your data is protected.",
      'settings-saved': "Settings updated! Changes are now active.",
      'agent-created': "Agent ready to help! Your AI assistant is configured.",
      'connection-established': "Service connected successfully!"
    },
    
    loading: {
      'saving': "Saving your work...",
      'loading': "Loading your content...",
      'processing': "Processing your request...",
      'analyzing': "Analyzing connections...",
      'generating': "Generating suggestions...",
      'syncing': "Synchronizing changes...",
      'uploading': "Uploading file...",
      'connecting': "Establishing connection...",
      'thinking': "AI is thinking...",
      'searching': "Searching your content..."
    },
    
    confirmations: {
      'delete-note': "Delete this note? This action cannot be undone.",
      'delete-task': "Mark this task as deleted? You can restore it from trash.",
      'clear-history': "Clear all history? This will remove your activity log.",
      'reset-settings': "Reset to default settings? Your customizations will be lost.",
      'disconnect-service': "Disconnect this service? You'll need to reconnect to sync data.",
      'archive-items': "Archive selected items? They'll be moved to your archive.",
      'export-data': "Export all your data? This may take a few moments.",
      'import-data': "Import data? This will add to your existing content.",
      'overwrite-file': "File already exists. Replace it with the new version?",
      'discard-changes': "Discard unsaved changes? Your recent edits will be lost."
    }
  };

  private static readonly INCLUSIVE_LANGUAGE: InclusiveLanguageGuidelines = {
    genderNeutral: {
      'guys': 'everyone',
      'mankind': 'humanity',
      'manpower': 'workforce',
      'man-hours': 'person-hours',
      'chairman': 'chairperson',
      'businessman': 'businessperson',
      'salesman': 'salesperson',
      'he/she': 'they',
      'his/her': 'their',
      'him/her': 'them'
    },
    
    ableistTerms: {
      'crazy': 'unexpected',
      'insane': 'incredible',
      'lame': 'disappointing',
      'blind spot': 'oversight',
      'deaf to': 'unresponsive to',
      'crippled': 'broken',
      'handicapped': 'limited',
      'dumb': 'silent',
      'stupid': 'ineffective',
      'retarded': 'delayed'
    },
    
    professionalTerms: {
      'ninja': 'expert',
      'guru': 'specialist',
      'rockstar': 'outstanding',
      'wizard': 'expert',
      'master': 'expert',
      'slave': 'secondary',
      'blacklist': 'blocklist',
      'whitelist': 'allowlist',
      'grandfathered': 'legacy',
      'native': 'built-in'
    },
    
    encouragingTerms: {
      'failed': 'didn\'t work as expected',
      'broken': 'needs attention',
      'wrong': 'different than expected',
      'bad': 'could be improved',
      'terrible': 'challenging',
      'awful': 'difficult',
      'horrible': 'problematic',
      'disaster': 'setback',
      'catastrophe': 'major issue',
      'nightmare': 'complex situation'
    }
  };

  private static readonly TERMINOLOGY_CONSISTENCY: TerminologyConsistency = {
    primaryTerms: {
      'note': 'note',
      'task': 'task',
      'chat': 'conversation',
      'agent': 'AI assistant',
      'workspace': 'workspace',
      'dashboard': 'dashboard',
      'canvas': 'canvas',
      'connection': 'link',
      'reference': 'reference',
      'tag': 'tag',
      'folder': 'folder',
      'archive': 'archive',
      'trash': 'trash',
      'settings': 'settings',
      'preferences': 'preferences'
    },
    
    alternativeTerms: {
      'note': ['document', 'page', 'entry'],
      'task': ['todo', 'item', 'action'],
      'chat': ['conversation', 'session', 'dialogue'],
      'agent': ['AI assistant', 'bot', 'helper'],
      'connection': ['link', 'relationship', 'reference'],
      'workspace': ['environment', 'area', 'space'],
      'dashboard': ['overview', 'summary', 'home']
    },
    
    contextualTerms: {
      'notes': {
        'create': 'Create Note',
        'edit': 'Edit Note',
        'delete': 'Delete Note',
        'link': 'Link Notes'
      },
      'tasks': {
        'create': 'Add Task',
        'complete': 'Complete Task',
        'delete': 'Delete Task',
        'organize': 'Organize Tasks'
      },
      'chat': {
        'start': 'Start Conversation',
        'continue': 'Continue Chat',
        'end': 'End Conversation',
        'save': 'Save Conversation'
      }
    }
  };

  /**
   * Get enhanced button text with tone framework applied
   */
  static getEnhancedButtonText(
    actionType: string, 
    context?: string,
    options: { tone?: 'direct' | 'encouraging' | 'professional'; urgent?: boolean } = {}
  ): string {
    const { tone = 'direct', urgent = false } = options;
    
    // Get base button text
    const baseText = this.MICROCOPY_STANDARDS.buttons[actionType] || 
                     super.getButtonText(actionType, context);
    
    // Apply tone modifications
    if (urgent && actionType.includes('save')) {
      return `${baseText} Now`;
    }
    
    if (tone === 'encouraging' && actionType.includes('create')) {
      return `${baseText} ✨`;
    }
    
    return baseText;
  }

  /**
   * Get blameless error message with helpful guidance
   */
  static getBlamelessErrorMessage(
    errorType: string, 
    context?: string,
    options: { includeAction?: boolean; technical?: boolean } = {}
  ): ContentItem {
    const { includeAction = true, technical = false } = options;
    
    const errorMessage = this.MICROCOPY_STANDARDS.errors[errorType];
    if (!errorMessage) {
      return super.getErrorMessage(errorType, context);
    }

    const baseItem: ContentItem = {
      id: `error-${errorType}`,
      primary: errorMessage,
      secondary: technical ? 
        `Technical details: ${errorType}` : 
        "Don't worry - this happens sometimes and your work is safe.",
      tooltip: "Click for more information"
    };

    if (includeAction) {
      baseItem.action = errorType.includes('network') ? 'Try Again' : 'Refresh';
    }

    return baseItem;
  }

  /**
   * Get encouraging empty state with clear action
   */
  static getEncouragingEmptyState(
    module: string, 
    context?: string,
    options: { showTips?: boolean; personalized?: boolean } = {}
  ): ContentItem {
    const { showTips = true, personalized = false } = options;
    
    const emptyStateKey = `${module}-${context || 'empty'}`;
    const emptyMessage = this.MICROCOPY_STANDARDS.emptyStates[emptyStateKey] ||
                        this.MICROCOPY_STANDARDS.emptyStates[`${module}-empty`];
    
    if (!emptyMessage) {
      return super.getEmptyState(module, context);
    }

    const baseItem: ContentItem = {
      id: `empty-${module}`,
      primary: personalized ? `Ready to start your ${module} journey?` : emptyMessage.split('.')[0],
      secondary: emptyMessage,
      action: this.getContextualAction(module),
      tooltip: `Create your first ${module.slice(0, -1)}`,
      icon: this.getModuleIcon(module)
    };

    if (showTips) {
      baseItem.secondary += ` ${this.getQuickTip(module)}`;
    }

    return baseItem;
  }

  /**
   * Validate content for tone, inclusivity, and consistency
   */
  static validateContent(content: string, contentType: 'button' | 'error' | 'empty' | 'general' = 'general'): ContentValidationResult {
    const issues: ContentValidationResult['issues'] = [];
    let score = 100;

    // Check for inclusive language violations
    for (const [problematic, replacement] of Object.entries(this.INCLUSIVE_LANGUAGE.genderNeutral)) {
      if (content.toLowerCase().includes(problematic.toLowerCase())) {
        issues.push({
          type: 'inclusive',
          severity: 'warning',
          message: `Consider using "${replacement}" instead of "${problematic}" for gender-neutral language`,
          suggestion: content.replace(new RegExp(problematic, 'gi'), replacement)
        });
        score -= 10;
      }
    }

    // Check for ableist terms
    for (const [ableist, alternative] of Object.entries(this.INCLUSIVE_LANGUAGE.ableistTerms)) {
      if (content.toLowerCase().includes(ableist.toLowerCase())) {
        issues.push({
          type: 'inclusive',
          severity: 'error',
          message: `Avoid using "${ableist}" - consider "${alternative}" instead`,
          suggestion: content.replace(new RegExp(ableist, 'gi'), alternative)
        });
        score -= 15;
      }
    }

    // Check for encouraging vs discouraging language
    for (const [discouraging, encouraging] of Object.entries(this.INCLUSIVE_LANGUAGE.encouragingTerms)) {
      if (content.toLowerCase().includes(discouraging.toLowerCase())) {
        issues.push({
          type: 'tone',
          severity: 'suggestion',
          message: `Consider more encouraging language: "${encouraging}" instead of "${discouraging}"`,
          suggestion: content.replace(new RegExp(discouraging, 'gi'), encouraging)
        });
        score -= 5;
      }
    }

    // Check button text conventions
    if (contentType === 'button') {
      if (!content.match(/^[A-Z][a-z]/)) {
        issues.push({
          type: 'microcopy',
          severity: 'warning',
          message: 'Button text should start with a capital letter and use sentence case',
          suggestion: content.charAt(0).toUpperCase() + content.slice(1).toLowerCase()
        });
        score -= 5;
      }

      if (content.length > 20) {
        issues.push({
          type: 'microcopy',
          severity: 'suggestion',
          message: 'Button text should be concise (under 20 characters)',
          suggestion: content.slice(0, 17) + '...'
        });
        score -= 3;
      }
    }

    // Check for accessibility concerns
    if (content.toLowerCase().includes('click here') || content.toLowerCase().includes('read more')) {
      issues.push({
        type: 'accessibility',
        severity: 'warning',
        message: 'Avoid generic link text like "click here" - be more descriptive',
        suggestion: 'Use descriptive text that explains what the action does'
      });
      score -= 8;
    }

    return {
      isValid: issues.filter(i => i.severity === 'error').length === 0,
      issues,
      score: Math.max(0, score)
    };
  }

  /**
   * Get terminology-consistent text
   */
  static getConsistentTerminology(term: string, context?: string): string {
    // Check primary terms first
    if (this.TERMINOLOGY_CONSISTENCY.primaryTerms[term]) {
      return this.TERMINOLOGY_CONSISTENCY.primaryTerms[term];
    }

    // Check contextual terms
    if (context && this.TERMINOLOGY_CONSISTENCY.contextualTerms[context]?.[term]) {
      return this.TERMINOLOGY_CONSISTENCY.contextualTerms[context][term];
    }

    // Check if term is an alternative and return primary
    for (const [primary, alternatives] of Object.entries(this.TERMINOLOGY_CONSISTENCY.alternativeTerms)) {
      if (alternatives.includes(term)) {
        return this.TERMINOLOGY_CONSISTENCY.primaryTerms[primary] || primary;
      }
    }

    return term;
  }

  /**
   * Generate content suggestions based on context
   */
  static generateContentSuggestions(
    contentType: 'button' | 'error' | 'empty' | 'success' | 'loading',
    action: string,
    context?: string
  ): string[] {
    const suggestions: string[] = [];

    switch (contentType) {
      case 'button':
        // Suggest verb-first alternatives
        if (!action.match(/^(Create|Add|Start|Build|Upload|Import|Connect|Open|View|Save|Apply)/)) {
          suggestions.push(`Consider starting with an action verb: "Create ${action}"`);
        }
        break;

      case 'error':
        suggestions.push(
          "Focus on what the user can do next",
          "Reassure that their data is safe",
          "Avoid technical jargon",
          "Provide a clear action to resolve the issue"
        );
        break;

      case 'empty':
        suggestions.push(
          "Explain the benefit of taking action",
          "Use encouraging, forward-looking language",
          "Provide a clear, single action to start",
          "Connect to the user's goals"
        );
        break;

      case 'success':
        suggestions.push(
          "Celebrate the accomplishment",
          "Suggest logical next steps",
          "Reinforce positive progress",
          "Keep the momentum going"
        );
        break;

      case 'loading':
        suggestions.push(
          "Explain what's happening",
          "Set expectations for timing",
          "Reassure about progress",
          "Keep it brief and clear"
        );
        break;
    }

    return suggestions;
  }

  /**
   * Helper methods for content generation
   */
  private static getContextualAction(module: string): string {
    const actions: Record<string, string> = {
      'notes': 'Create Your First Note',
      'tasks': 'Add Your First Task',
      'chats': 'Start a Conversation',
      'agents': 'Build Your First Agent',
      'canvas': 'Create a Canvas',
      'connections': 'Link Your Ideas'
    };
    return actions[module] || 'Get Started';
  }

  private static getModuleIcon(module: string): string {
    const icons: Record<string, string> = {
      'notes': 'file-text',
      'tasks': 'check-square',
      'chats': 'message-square',
      'agents': 'bot',
      'canvas': 'layout',
      'connections': 'link'
    };
    return icons[module] || 'plus';
  }

  private static getQuickTip(module: string): string {
    const tips: Record<string, string> = {
      'notes': 'Tip: Use [[]] to link between notes.',
      'tasks': 'Tip: Set energy levels to match your current state.',
      'chats': 'Tip: Your conversations stay completely private.',
      'agents': 'Tip: Agents learn your preferences over time.',
      'canvas': 'Tip: Drag and drop to organize your ideas visually.',
      'connections': 'Tip: Connections reveal insights over time.'
    };
    return tips[module] || 'Tip: Explore features at your own pace.';
  }
}

// Export enhanced content strategy as default
export default EnhancedContentStrategy;

// Utility functions for common content operations
export const ContentUtils = {
  /**
   * Apply tone framework to any text
   */
  applyToneFramework(
    text: string, 
    tone: keyof ToneFramework,
    intensity: 'subtle' | 'moderate' | 'strong' = 'moderate'
  ): string {
    // This would apply tone modifications based on the framework
    // For now, return the original text with tone context
    return text;
  },

  /**
   * Check if text follows microcopy standards
   */
  validateMicrocopy(text: string, type: keyof MicrocopyStandards): boolean {
    const validation = EnhancedContentStrategy.validateContent(text, type as any);
    return validation.isValid && validation.score >= 80;
  },

  /**
   * Suggest improvements for content
   */
  suggestImprovements(text: string, contentType: string): string[] {
    const validation = EnhancedContentStrategy.validateContent(text);
    return validation.issues.map(issue => issue.suggestion).filter(Boolean) as string[];
  },

  /**
   * Get consistent terminology for a term
   */
  getConsistentTerm(term: string, context?: string): string {
    return EnhancedContentStrategy.getConsistentTerminology(term, context);
  }
};
