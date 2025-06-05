// Phase 2a: Templates & AI Integration - Enhanced Template System Types

export enum TemplateCategory {
  BUSINESS = 'business',
  EDUCATION = 'education',
  DESIGN = 'design',
  PROJECT_MANAGEMENT = 'project-management',
  BRAINSTORMING = 'brainstorming',
  PLANNING = 'planning',
  ANALYSIS = 'analysis',
  PERSONAL = 'personal'
}

export interface WhiteboardTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string; // "5-10 minutes"
  elements: import('./whiteboard-types').AnyWhiteboardElement[];
  metadata: {
    author: string;
    version: string;
    created: number;
    usage: number;
    rating: number;
  };
  preview: {
    thumbnail: string; // base64 or URL
    screenshots: string[];
  };
  instructions?: string[];
  relatedTemplates?: string[];
}

export interface TemplateOptions {
  position?: import('./whiteboard-types').WhiteboardPoint;
  scale?: number;
  customization?: Record<string, any>;
  skipElements?: string[];
}

export interface TemplateFilters {
  categories?: TemplateCategory[];
  difficulty?: string[];
  tags?: string[];
  estimatedTime?: string;
  minRating?: number;
}

export interface TemplateMetadata {
  title: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  author: string;
}

export interface SharingPermissions {
  public: boolean;
  allowCopy: boolean;
  allowModify: boolean;
  collaborators?: string[];
}

export interface TemplateContext {
  existingElements: import('./whiteboard-types').AnyWhiteboardElement[];
  userIntent?: string;
  currentTopic?: string;
  collaborators?: string[];
  projectType?: string;
}

// AI Integration Types
export interface CanvasContext {
  existingElements: import('./whiteboard-types').AnyWhiteboardElement[];
  userIntent?: string;
  currentTopic?: string;
  collaborators?: string[];
  projectType?: string;
}

export interface TemplateImprovement {
  type: 'layout' | 'content' | 'styling' | 'workflow';
  description: string;
  impact: 'low' | 'medium' | 'high';
  implementation: () => WhiteboardTemplate;
}

export interface ElementSuggestion {
  element: import('./whiteboard-types').AnyWhiteboardElement;
  reasoning: string;
  confidence: number;
  position: import('./whiteboard-types').WhiteboardPoint;
}

export interface ContentContext {
  elementType: string;
  surroundingElements: import('./whiteboard-types').AnyWhiteboardElement[];
  userInput?: string;
  projectContext?: string;
}

export interface ContentSuggestion {
  text: string;
  confidence: number;
  reasoning: string;
  category: 'completion' | 'enhancement' | 'alternative';
}

export interface ConnectionSuggestion {
  from: string; // element ID
  to: string; // element ID
  type: 'arrow' | 'line' | 'flow';
  reasoning: string;
  strength: number;
}

export interface ShapeCompletion {
  completedPath: import('./whiteboard-types').WhiteboardPoint[];
  shapeType: import('./whiteboard-types').WhiteboardShapeType;
  confidence: number;
}

export interface GroupingSuggestion {
  elementIds: string[];
  groupType: 'logical' | 'spatial' | 'semantic';
  reasoning: string;
  confidence: number;
}

export interface LayoutOptimization {
  elementUpdates: Array<{
    elementId: string;
    newPosition: import('./whiteboard-types').WhiteboardPoint;
    newSize?: import('./whiteboard-types').WhiteboardSize;
  }>;
  reasoning: string;
  improvementScore: number;
}

export interface ColorScheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  reasoning: string;
}

export interface WorkflowSuggestion {
  title: string;
  description: string;
  steps: string[];
  templates?: string[];
  confidence: number;
}

export interface CanvasIssue {
  type: 'overlap' | 'spacing' | 'alignment' | 'consistency' | 'accessibility';
  description: string;
  affectedElements: string[];
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}

export interface TemplateContent {
  elements: import('./whiteboard-types').AnyWhiteboardElement[];
  placeholderTexts: Record<string, string>;
  suggestedConnections: ConnectionSuggestion[];
}

// Template Management Types
export interface TemplateSearchResult {
  template: WhiteboardTemplate;
  relevanceScore: number;
  matchedTags: string[];
  matchedContent: string[];
}

export interface TemplateUsageAnalytics {
  templateId: string;
  usageCount: number;
  averageRating: number;
  completionRate: number;
  timeToComplete: number;
  userFeedback: string[];
}

export interface CustomizationOption {
  id: string;
  name: string;
  type: 'color' | 'text' | 'size' | 'position' | 'style';
  defaultValue: any;
  options?: any[];
  description: string;
}

// AI-Powered Features
export interface AITemplateGenerator {
  // Natural language to template
  generateTemplateFromDescription(description: string): Promise<WhiteboardTemplate>;
  
  // Smart template suggestions
  suggestTemplates(context: CanvasContext): Promise<WhiteboardTemplate[]>;
  
  // Template enhancement
  optimizeTemplateLayout(template: WhiteboardTemplate): Promise<WhiteboardTemplate>;
  suggestTemplateImprovements(templateId: string): Promise<TemplateImprovement[]>;
  
  // Content generation
  generateTemplateContent(templateType: string, parameters: any): Promise<TemplateContent>;
  generatePlaceholderText(elementType: string, context: string): Promise<string>;
  
  // Smart completion
  completeTemplate(partialTemplate: Partial<WhiteboardTemplate>): Promise<WhiteboardTemplate>;
  suggestNextElements(currentElements: import('./whiteboard-types').AnyWhiteboardElement[]): Promise<ElementSuggestion[]>;
}

export interface SmartContentAssistant {
  // Context-aware suggestions
  suggestContent(element: import('./whiteboard-types').AnyWhiteboardElement, context: ContentContext): Promise<ContentSuggestion[]>;
  
  // Auto-completion
  completeText(partialText: string, elementType: string): Promise<string[]>;
  completeShape(partialPath: import('./whiteboard-types').WhiteboardPoint[]): Promise<ShapeCompletion>;
  
  // Relationship suggestions
  suggestConnections(elements: import('./whiteboard-types').AnyWhiteboardElement[]): Promise<ConnectionSuggestion[]>;
  suggestGrouping(elements: import('./whiteboard-types').AnyWhiteboardElement[]): Promise<GroupingSuggestion[]>;
  
  // Layout optimization
  optimizeLayout(elements: import('./whiteboard-types').AnyWhiteboardElement[]): Promise<LayoutOptimization>;
  suggestColorScheme(elements: import('./whiteboard-types').AnyWhiteboardElement[]): Promise<ColorScheme>;
  
  // Workflow suggestions
  suggestNextSteps(currentCanvas: import('./whiteboard-types').WhiteboardState): Promise<WorkflowSuggestion[]>;
  identifyPotentialIssues(elements: import('./whiteboard-types').AnyWhiteboardElement[]): Promise<CanvasIssue[]>;
}

// Component Props Types
export interface TemplatePickerProps {
  onTemplateSelect: (template: WhiteboardTemplate) => void;
  onTemplatePreview: (template: WhiteboardTemplate) => void;
  filters?: TemplateFilters;
  showAIGeneration?: boolean;
}

export interface TemplateCustomizationProps {
  template: WhiteboardTemplate;
  onCustomizationComplete: (customizedTemplate: WhiteboardTemplate) => void;
  availableCustomizations: CustomizationOption[];
}

export interface AISuggestionPanelProps {
  currentCanvas: import('./whiteboard-types').WhiteboardState;
  onSuggestionAccept: (suggestion: any) => void;
  onSuggestionDismiss: (suggestion: any) => void;
  suggestionTypes: ('template' | 'content' | 'layout' | 'connection')[];
}

export interface TemplateGalleryProps {
  templates: WhiteboardTemplate[];
  onTemplateSelect: (template: WhiteboardTemplate) => void;
  onTemplateEdit?: (template: WhiteboardTemplate) => void;
  onTemplateDelete?: (templateId: string) => void;
  showCreateNew?: boolean;
}