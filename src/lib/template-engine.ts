// Phase 2a: Templates & AI Integration - Template Engine Implementation

import {
  WhiteboardTemplate,
  TemplateCategory,
  TemplateOptions,
  TemplateFilters,
  TemplateMetadata,
  SharingPermissions,
  TemplateContext,
  TemplateSearchResult,
  TemplateUsageAnalytics,
  AITemplateGenerator,
  SmartContentAssistant
} from './template-types';
import {
  AnyWhiteboardElement,
  WhiteboardPoint,
  WhiteboardState
} from './whiteboard-types';

export class TemplateEngine {
  private templates: Map<string, WhiteboardTemplate> = new Map();
  private categories: Map<TemplateCategory, WhiteboardTemplate[]> = new Map();
  private analytics: Map<string, TemplateUsageAnalytics> = new Map();
  private aiGenerator: AITemplateGenerator | null = null;
  private contentAssistant: SmartContentAssistant | null = null;

  constructor() {
    this.initializeCategories();
    this.loadBuiltInTemplates();
  }

  private initializeCategories(): void {
    Object.values(TemplateCategory).forEach(category => {
      this.categories.set(category, []);
    });
  }

  // Template Management
  loadTemplate(templateId: string): WhiteboardTemplate | null {
    return this.templates.get(templateId) || null;
  }

  instantiateTemplate(templateId: string, options: TemplateOptions = {}): AnyWhiteboardElement[] {
    const template = this.loadTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const { position = { x: 0, y: 0 }, scale = 1, skipElements = [] } = options;
    
    // Clone and transform elements
    const instantiatedElements = template.elements
      .filter(element => !skipElements.includes(element.id))
      .map(element => this.cloneAndTransformElement(element, position, scale));

    // Track usage
    this.trackTemplateUsage(templateId);

    return instantiatedElements;
  }

  private cloneAndTransformElement(
    element: AnyWhiteboardElement, 
    offset: WhiteboardPoint, 
    scale: number
  ): AnyWhiteboardElement {
    const now = new Date().toISOString();
    return {
      ...element,
      id: this.generateElementId(element.type),
      position: {
        x: element.position.x * scale + offset.x,
        y: element.position.y * scale + offset.y
      },
      size: {
        width: element.size.width * scale,
        height: element.size.height * scale
      },
      transform: {
        ...element.transform,
        scaleX: element.transform.scaleX * scale,
        scaleY: element.transform.scaleY * scale
      },
      createdAt: now,
      updatedAt: now
    };
  }

  private generateElementId(type: string): string {
    return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  searchTemplates(query: string, filters: TemplateFilters = {}): TemplateSearchResult[] {
    const allTemplates = Array.from(this.templates.values());
    
    let filteredTemplates = allTemplates;

    // Apply filters
    if (filters.categories?.length) {
      filteredTemplates = filteredTemplates.filter(t => 
        filters.categories!.includes(t.category)
      );
    }

    if (filters.difficulty?.length) {
      filteredTemplates = filteredTemplates.filter(t => 
        filters.difficulty!.includes(t.difficulty)
      );
    }

    if (filters.tags?.length) {
      filteredTemplates = filteredTemplates.filter(t => 
        t.tags.some(tag => filters.tags!.includes(tag))
      );
    }

    if (filters.minRating) {
      filteredTemplates = filteredTemplates.filter(t => 
        t.metadata.rating >= filters.minRating!
      );
    }

    // Search and score
    const results: TemplateSearchResult[] = filteredTemplates
      .map(template => {
        const relevanceScore = this.calculateRelevanceScore(template, query);
        return {
          template,
          relevanceScore,
          matchedTags: this.getMatchedTags(template, query),
          matchedContent: this.getMatchedContent(template, query)
        };
      })
      .filter(result => result.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    return results;
  }

  private calculateRelevanceScore(template: WhiteboardTemplate, query: string): number {
    const lowerQuery = query.toLowerCase();
    let score = 0;

    // Name match (highest weight)
    if (template.name.toLowerCase().includes(lowerQuery)) {
      score += 100;
    }

    // Description match
    if (template.description.toLowerCase().includes(lowerQuery)) {
      score += 50;
    }

    // Tag matches
    template.tags.forEach(tag => {
      if (tag.toLowerCase().includes(lowerQuery)) {
        score += 30;
      }
    });

    // Category match
    if (template.category.toLowerCase().includes(lowerQuery)) {
      score += 40;
    }

    // Usage and rating boost
    score += template.metadata.usage * 0.1;
    score += template.metadata.rating * 5;

    return score;
  }

  private getMatchedTags(template: WhiteboardTemplate, query: string): string[] {
    const lowerQuery = query.toLowerCase();
    return template.tags.filter(tag => 
      tag.toLowerCase().includes(lowerQuery)
    );
  }

  private getMatchedContent(template: WhiteboardTemplate, query: string): string[] {
    const lowerQuery = query.toLowerCase();
    const matches: string[] = [];

    if (template.name.toLowerCase().includes(lowerQuery)) {
      matches.push('name');
    }
    if (template.description.toLowerCase().includes(lowerQuery)) {
      matches.push('description');
    }
    if (template.category.toLowerCase().includes(lowerQuery)) {
      matches.push('category');
    }

    return matches;
  }

  getTemplatesByCategory(category: TemplateCategory): WhiteboardTemplate[] {
    return this.categories.get(category) || [];
  }

  // Custom template creation
  createTemplateFromCanvas(
    elements: AnyWhiteboardElement[], 
    metadata: TemplateMetadata
  ): WhiteboardTemplate {
    const template: WhiteboardTemplate = {
      id: this.generateTemplateId(),
      name: metadata.title,
      description: metadata.description,
      category: metadata.category,
      tags: metadata.tags,
      difficulty: 'intermediate', // Default, could be AI-determined
      estimatedTime: this.estimateCompletionTime(elements),
      elements: this.normalizeElements(elements),
      metadata: {
        author: metadata.author,
        version: '1.0.0',
        created: Date.now(),
        usage: 0,
        rating: 0
      },
      preview: {
        thumbnail: this.generateThumbnail(elements),
        screenshots: []
      },
      instructions: this.generateInstructions(elements),
      relatedTemplates: this.findRelatedTemplates(metadata.category, metadata.tags)
    };

    return template;
  }

  private generateTemplateId(): string {
    return `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private estimateCompletionTime(elements: AnyWhiteboardElement[]): string {
    // Simple heuristic based on element count and complexity
    const elementCount = elements.length;
    if (elementCount < 5) return '2-5 minutes';
    if (elementCount < 15) return '5-10 minutes';
    if (elementCount < 30) return '10-20 minutes';
    return '20+ minutes';
  }

  private normalizeElements(elements: AnyWhiteboardElement[]): AnyWhiteboardElement[] {
    // Find bounds of all elements to normalize positions
    const bounds = this.calculateElementsBounds(elements);
    const offset = { x: -bounds.x, y: -bounds.y };

    return elements.map(element => ({
      ...element,
      position: {
        x: element.position.x + offset.x,
        y: element.position.y + offset.y
      }
    }));
  }

  private calculateElementsBounds(elements: AnyWhiteboardElement[]) {
    if (elements.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    elements.forEach(element => {
      const { x, y } = element.position;
      const { width, height } = element.size;
      
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  private generateThumbnail(elements: AnyWhiteboardElement[]): string {
    // In a real implementation, this would generate an actual thumbnail
    // For now, return a placeholder
    return 'data:image/svg+xml;base64,' + btoa(`
      <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f8f9fa"/>
        <text x="100" y="75" text-anchor="middle" fill="#6b7280" font-size="14">
          Template Preview
        </text>
      </svg>
    `);
  }

  private generateInstructions(elements: AnyWhiteboardElement[]): string[] {
    const instructions: string[] = [
      'Click to place elements on the canvas',
      'Double-click text elements to edit content',
      'Use the selection tool to move and resize elements'
    ];

    // Add specific instructions based on element types
    const elementTypes = new Set(elements.map(e => e.type));
    
    if (elementTypes.has('sticky-note')) {
      instructions.push('Fill in sticky notes with your ideas');
    }
    if (elementTypes.has('frame')) {
      instructions.push('Organize related items within frames');
    }
    if (elementTypes.has('arrow') || elementTypes.has('line')) {
      instructions.push('Connect related concepts with arrows');
    }

    return instructions;
  }

  private findRelatedTemplates(category: TemplateCategory, tags: string[]): string[] {
    const categoryTemplates = this.getTemplatesByCategory(category);
    
    return categoryTemplates
      .filter(template => 
        template.tags.some(tag => tags.includes(tag))
      )
      .slice(0, 5)
      .map(template => template.id);
  }

  async saveCustomTemplate(template: WhiteboardTemplate): Promise<void> {
    this.templates.set(template.id, template);
    this.addToCategory(template);
    
    // In a real implementation, this would persist to storage
    console.log(`Template ${template.id} saved successfully`);
  }

  private addToCategory(template: WhiteboardTemplate): void {
    const categoryTemplates = this.categories.get(template.category) || [];
    categoryTemplates.push(template);
    this.categories.set(template.category, categoryTemplates);
  }

  async shareTemplate(templateId: string, permissions: SharingPermissions): Promise<string> {
    const template = this.loadTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Generate sharing URL/code
    const shareId = `share-${templateId}-${Date.now()}`;
    
    // In a real implementation, this would create a shareable link
    console.log(`Template shared with ID: ${shareId}`);
    
    return shareId;
  }

  // Template analytics
  trackTemplateUsage(templateId: string): void {
    const template = this.templates.get(templateId);
    if (template) {
      template.metadata.usage++;
      
      // Update analytics
      const analytics = this.analytics.get(templateId) || {
        templateId,
        usageCount: 0,
        averageRating: 0,
        completionRate: 0,
        timeToComplete: 0,
        userFeedback: []
      };
      
      analytics.usageCount++;
      this.analytics.set(templateId, analytics);
    }
  }

  getPopularTemplates(limit: number = 10): WhiteboardTemplate[] {
    return Array.from(this.templates.values())
      .sort((a, b) => b.metadata.usage - a.metadata.usage)
      .slice(0, limit);
  }

  getRecommendedTemplates(context: TemplateContext): WhiteboardTemplate[] {
    // Simple recommendation based on context
    const recommendations: WhiteboardTemplate[] = [];
    
    // If user has existing elements, suggest complementary templates
    if (context.existingElements.length > 0) {
      const elementTypes = new Set(context.existingElements.map(e => e.type));
      
      if (elementTypes.has('sticky-note')) {
        recommendations.push(...this.searchTemplates('brainstorming').map(r => r.template));
      }
      if (elementTypes.has('frame')) {
        recommendations.push(...this.searchTemplates('organization').map(r => r.template));
      }
    }
    
    // Based on user intent
    if (context.userIntent) {
      recommendations.push(...this.searchTemplates(context.userIntent).map(r => r.template));
    }
    
    // Based on project type
    if (context.projectType) {
      recommendations.push(...this.searchTemplates(context.projectType).map(r => r.template));
    }
    
    // Remove duplicates and limit results
    const uniqueRecommendations = recommendations.filter((template, index, self) => 
      index === self.findIndex(t => t.id === template.id)
    );
    
    return uniqueRecommendations.slice(0, 8);
  }

  // AI Integration Methods
  setAIGenerator(generator: AITemplateGenerator): void {
    this.aiGenerator = generator;
  }

  setContentAssistant(assistant: SmartContentAssistant): void {
    this.contentAssistant = assistant;
  }

  async generateTemplateFromDescription(description: string): Promise<WhiteboardTemplate | null> {
    if (!this.aiGenerator) {
      console.warn('AI generator not available');
      return null;
    }
    
    try {
      return await this.aiGenerator.generateTemplateFromDescription(description);
    } catch (error) {
      console.error('Failed to generate template from description:', error);
      return null;
    }
  }

  async suggestTemplates(context: TemplateContext): Promise<WhiteboardTemplate[]> {
    if (!this.aiGenerator) {
      // Fallback to basic recommendations
      return this.getRecommendedTemplates(context);
    }
    
    try {
      return await this.aiGenerator.suggestTemplates(context);
    } catch (error) {
      console.error('Failed to get AI template suggestions:', error);
      return this.getRecommendedTemplates(context);
    }
  }

  // Built-in templates initialization
  private loadBuiltInTemplates(): void {
    // This will be populated with professional templates
    // For now, we'll add a simple example
    const exampleTemplate: WhiteboardTemplate = {
      id: 'swot-analysis',
      name: 'SWOT Analysis',
      description: 'Analyze Strengths, Weaknesses, Opportunities, and Threats',
      category: TemplateCategory.BUSINESS,
      tags: ['analysis', 'strategy', 'planning', 'business'],
      difficulty: 'beginner',
      estimatedTime: '10-15 minutes',
      elements: [], // Would contain actual SWOT grid elements
      metadata: {
        author: 'LibreOllama',
        version: '1.0.0',
        created: Date.now(),
        usage: 0,
        rating: 4.8
      },
      preview: {
        thumbnail: this.generateThumbnail([]),
        screenshots: []
      },
      instructions: [
        'Fill in each quadrant with relevant items',
        'Strengths: Internal positive factors',
        'Weaknesses: Internal areas for improvement',
        'Opportunities: External positive possibilities',
        'Threats: External challenges or risks'
      ],
      relatedTemplates: ['business-model-canvas', 'competitive-analysis']
    };

    this.templates.set(exampleTemplate.id, exampleTemplate);
    this.addToCategory(exampleTemplate);
  }

  // Export template data for persistence
  exportTemplates(): Record<string, WhiteboardTemplate> {
    const templateData: Record<string, WhiteboardTemplate> = {};
    this.templates.forEach((template, id) => {
      templateData[id] = template;
    });
    return templateData;
  }

  // Import template data from persistence
  importTemplates(templateData: Record<string, WhiteboardTemplate>): void {
    Object.entries(templateData).forEach(([id, template]) => {
      this.templates.set(id, template);
      this.addToCategory(template);
    });
  }
}

// Singleton instance
export const templateEngine = new TemplateEngine();