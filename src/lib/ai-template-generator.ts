// Phase 2a: Templates & AI Integration - AI-Powered Template Generation

import {
  WhiteboardTemplate,
  TemplateCategory,
  CanvasContext,
  TemplateImprovement,
  ElementSuggestion,
  TemplateContent,
  AITemplateGenerator,
  SmartContentAssistant,
  ContentContext,
  ContentSuggestion,
  ConnectionSuggestion,
  ShapeCompletion,
  GroupingSuggestion,
  LayoutOptimization,
  ColorScheme,
  WorkflowSuggestion,
  CanvasIssue
} from './template-types';
import {
  AnyWhiteboardElement,
  WhiteboardPoint,
  WhiteboardState,
  WhiteboardShapeType
} from './whiteboard-types';
import { WhiteboardElementFactory } from './whiteboard-utils';

export class LibreOllamaTemplateGenerator implements AITemplateGenerator {
  private modelEndpoint: string;
  private apiKey?: string;

  constructor(endpoint: string = 'http://localhost:11434', apiKey?: string) {
    this.modelEndpoint = endpoint;
    this.apiKey = apiKey;
  }

  async generateTemplateFromDescription(description: string): Promise<WhiteboardTemplate> {
    const prompt = this.buildTemplateGenerationPrompt(description);
    
    try {
      const response = await this.callOllamaAPI({
        model: 'llama3.1',
        prompt,
        system: 'You are an expert whiteboard designer who creates professional templates for business, education, and creative work.',
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2000
        }
      });

      return this.parseTemplateResponse(response, description);
    } catch (error) {
      console.error('Failed to generate template:', error);
      throw new Error('Template generation failed');
    }
  }

  private buildTemplateGenerationPrompt(description: string): string {
    return `
Create a whiteboard template based on this description: "${description}"

Generate a structured template with the following elements:
1. Template name and description
2. Appropriate category (business, education, design, project-management, brainstorming, planning, analysis, personal)
3. Difficulty level (beginner, intermediate, advanced)
4. Estimated completion time
5. List of whiteboard elements with positions and content
6. Relevant tags
7. Step-by-step instructions

Return the response in JSON format with this structure:
{
  "name": "Template Name",
  "description": "Detailed description",
  "category": "category",
  "difficulty": "beginner|intermediate|advanced",
  "estimatedTime": "X-Y minutes",
  "tags": ["tag1", "tag2"],
  "elements": [
    {
      "type": "sticky-note|text|shape|frame|arrow|line",
      "position": {"x": 0, "y": 0},
      "size": {"width": 200, "height": 100},
      "content": "Element content",
      "style": {
        "color": {"fill": "#color", "stroke": "#color", "opacity": 1}
      }
    }
  ],
  "instructions": ["Step 1", "Step 2"]
}

Focus on creating practical, professional templates that provide real value.
`;
  }

  private async parseTemplateResponse(response: string, originalDescription: string): Promise<WhiteboardTemplate> {
    try {
      const parsed = JSON.parse(response);
      
      const elements: AnyWhiteboardElement[] = parsed.elements?.map((elementData: any) => {
        return this.createElementFromAIData(elementData);
      }) || [];

      return {
        id: `ai-template-${Date.now()}`,
        name: parsed.name || 'AI Generated Template',
        description: parsed.description || originalDescription,
        category: this.parseCategory(parsed.category),
        tags: parsed.tags || [],
        difficulty: parsed.difficulty || 'intermediate',
        estimatedTime: parsed.estimatedTime || '10-15 minutes',
        elements,
        metadata: {
          author: 'AI Assistant',
          version: '1.0.0',
          created: Date.now(),
          usage: 0,
          rating: 0
        },
        preview: {
          thumbnail: this.generateAIThumbnail(elements),
          screenshots: []
        },
        instructions: parsed.instructions || [],
        relatedTemplates: []
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('Invalid AI response format');
    }
  }

  private parseCategory(category: string): TemplateCategory {
    const categoryMap: Record<string, TemplateCategory> = {
      'business': TemplateCategory.BUSINESS,
      'education': TemplateCategory.EDUCATION,
      'design': TemplateCategory.DESIGN,
      'project-management': TemplateCategory.PROJECT_MANAGEMENT,
      'brainstorming': TemplateCategory.BRAINSTORMING,
      'planning': TemplateCategory.PLANNING,
      'analysis': TemplateCategory.ANALYSIS,
      'personal': TemplateCategory.PERSONAL
    };
    
    return categoryMap[category?.toLowerCase()] || TemplateCategory.BUSINESS;
  }

  private createElementFromAIData(elementData: any): AnyWhiteboardElement {
    const position = elementData.position || { x: 0, y: 0 };
    const content = elementData.content || '';
    
    switch (elementData.type) {
      case 'sticky-note':
        return WhiteboardElementFactory.createStickyNote(
          position,
          content,
          elementData.style?.color?.fill || '#fef3c7'
        );
      
      case 'text':
        return WhiteboardElementFactory.createTextBox(
          position,
          content,
          {
            family: 'Inter, sans-serif',
            size: 16,
            weight: 'normal',
            style: 'normal',
            decoration: 'none',
            align: 'left'
          }
        );
      
      case 'shape':
        return WhiteboardElementFactory.createShape(
          position,
          elementData.shapeType || 'rectangle',
          elementData.size || { width: 200, height: 100 }
        );
      
      case 'frame':
        return WhiteboardElementFactory.createFrame(
          position,
          elementData.size || { width: 300, height: 200 },
          content || 'Frame'
        );
      
      case 'arrow':
        return WhiteboardElementFactory.createArrow(
          position,
          elementData.endPoint || { x: position.x + 100, y: position.y }
        );
      
      default:
        return WhiteboardElementFactory.createStickyNote(position, content);
    }
  }

  private generateAIThumbnail(elements: AnyWhiteboardElement[]): string {
    return 'data:image/svg+xml;base64,' + btoa(`
      <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f8f9fa"/>
        <circle cx="50" cy="50" r="20" fill="#3b82f6" opacity="0.7"/>
        <rect x="100" y="30" width="60" height="40" fill="#ef4444" opacity="0.7"/>
        <rect x="30" y="100" width="140" height="20" fill="#10b981" opacity="0.7"/>
        <text x="100" y="140" text-anchor="middle" fill="#374151" font-size="10">
          AI Generated
        </text>
      </svg>
    `);
  }

  async suggestTemplates(context: CanvasContext): Promise<WhiteboardTemplate[]> {
    const prompt = this.buildTemplateSuggestionPrompt(context);
    
    try {
      const response = await this.callOllamaAPI({
        model: 'llama3.1',
        prompt,
        system: 'You are a helpful assistant that suggests relevant whiteboard templates based on user context.',
        options: {
          temperature: 0.6,
          max_tokens: 1000
        }
      });

      return this.parseTemplateSuggestions(response);
    } catch (error) {
      console.error('Failed to get template suggestions:', error);
      return [];
    }
  }

  private buildTemplateSuggestionPrompt(context: CanvasContext): string {
    const elementTypes = context.existingElements.map(e => e.type).join(', ');
    
    return `
Based on the following context, suggest 3-5 relevant whiteboard templates:

Current canvas:
- Existing elements: ${elementTypes || 'none'}
- User intent: ${context.userIntent || 'not specified'}
- Current topic: ${context.currentTopic || 'not specified'}
- Project type: ${context.projectType || 'not specified'}
- Number of collaborators: ${context.collaborators?.length || 0}

Suggest templates that would complement the existing work or help achieve the user's goals.

Return response as JSON array:
[
  {
    "name": "Template Name",
    "description": "Why this template is relevant",
    "category": "category",
    "relevanceScore": 0.8,
    "reasoning": "Explanation of why this template fits"
  }
]
`;
  }

  private async parseTemplateSuggestions(response: string): Promise<WhiteboardTemplate[]> {
    try {
      const suggestions = JSON.parse(response);
      const templates: WhiteboardTemplate[] = [];
      
      for (const suggestion of suggestions.slice(0, 5)) {
        const template = await this.generateTemplateFromDescription(
          `${suggestion.name}: ${suggestion.description}`
        );
        templates.push(template);
      }
      
      return templates;
    } catch (error) {
      console.error('Failed to parse template suggestions:', error);
      return [];
    }
  }

  async optimizeTemplateLayout(template: WhiteboardTemplate): Promise<WhiteboardTemplate> {
    const prompt = `
Optimize the layout of this whiteboard template for better visual hierarchy and user experience:

Template: ${template.name}
Elements: ${template.elements.length} items
Current positions: ${JSON.stringify(template.elements.map(e => ({ type: e.type, pos: e.position })))}

Suggest optimized positions that:
1. Create clear visual hierarchy
2. Improve readability and flow
3. Follow design best practices
4. Maintain logical groupings

Return JSON with optimized positions:
{
  "optimizedElements": [
    {"id": "element-id", "position": {"x": 0, "y": 0}}
  ],
  "improvements": ["improvement 1", "improvement 2"]
}
`;

    try {
      const response = await this.callOllamaAPI({
        model: 'llama3.1',
        prompt,
        system: 'You are a UX designer expert in whiteboard layout optimization.',
        options: { temperature: 0.3 }
      });

      return this.applyLayoutOptimization(template, response);
    } catch (error) {
      console.error('Failed to optimize template layout:', error);
      return template;
    }
  }

  private applyLayoutOptimization(template: WhiteboardTemplate, response: string): WhiteboardTemplate {
    try {
      const optimization = JSON.parse(response);
      const optimizedElements = [...template.elements];
      
      optimization.optimizedElements?.forEach((opt: any) => {
        const elementIndex = optimizedElements.findIndex(e => e.id === opt.id);
        if (elementIndex >= 0 && opt.position) {
          optimizedElements[elementIndex] = {
            ...optimizedElements[elementIndex],
            position: opt.position
          };
        }
      });

      return {
        ...template,
        elements: optimizedElements,
        metadata: {
          ...template.metadata,
          version: `${template.metadata.version}.1`
        }
      };
    } catch (error) {
      console.error('Failed to apply layout optimization:', error);
      return template;
    }
  }

  async suggestTemplateImprovements(templateId: string): Promise<TemplateImprovement[]> {
    // This would analyze a specific template and suggest improvements
    // For now, return generic improvements
    return [
      {
        type: 'layout',
        description: 'Improve element spacing for better visual hierarchy',
        impact: 'medium',
        implementation: () => ({} as WhiteboardTemplate)
      },
      {
        type: 'content',
        description: 'Add more descriptive placeholder text',
        impact: 'low',
        implementation: () => ({} as WhiteboardTemplate)
      }
    ];
  }

  async generateTemplateContent(templateType: string, parameters: any): Promise<TemplateContent> {
    const prompt = `
Generate content for a ${templateType} template with these parameters:
${JSON.stringify(parameters)}

Create appropriate whiteboard elements with meaningful placeholder content.
Return JSON with elements and suggested connections.
`;

    try {
      const response = await this.callOllamaAPI({
        model: 'llama3.1',
        prompt,
        system: 'Generate structured whiteboard content with professional placeholder text.',
        options: { temperature: 0.7 }
      });

      return this.parseTemplateContent(response);
    } catch (error) {
      console.error('Failed to generate template content:', error);
      return {
        elements: [],
        placeholderTexts: {},
        suggestedConnections: []
      };
    }
  }

  private parseTemplateContent(response: string): TemplateContent {
    try {
      const content = JSON.parse(response);
      return {
        elements: content.elements?.map((e: any) => this.createElementFromAIData(e)) || [],
        placeholderTexts: content.placeholderTexts || {},
        suggestedConnections: content.connections || []
      };
    } catch (error) {
      return {
        elements: [],
        placeholderTexts: {},
        suggestedConnections: []
      };
    }
  }

  async generatePlaceholderText(elementType: string, context: string): Promise<string> {
    const prompt = `
Generate appropriate placeholder text for a ${elementType} element in this context: ${context}

The text should be:
1. Professional and contextually relevant
2. Helpful as a starting point
3. Not too long (1-3 sentences max)
4. Specific to the element type and context

Return just the text, no quotes or formatting.
`;

    try {
      const response = await this.callOllamaAPI({
        model: 'llama3.1',
        prompt,
        system: 'Generate professional placeholder text for whiteboard elements.',
        options: { temperature: 0.8, max_tokens: 100 }
      });

      return response.trim();
    } catch (error) {
      console.error('Failed to generate placeholder text:', error);
      return this.getDefaultPlaceholderText(elementType);
    }
  }

  private getDefaultPlaceholderText(elementType: string): string {
    const defaults: Record<string, string> = {
      'sticky-note': 'Add your idea here',
      'text': 'Enter your text',
      'frame': 'Group related items'
    };
    return defaults[elementType] || 'Enter content';
  }

  async completeTemplate(partialTemplate: Partial<WhiteboardTemplate>): Promise<WhiteboardTemplate> {
    const prompt = `
Complete this partial whiteboard template:
${JSON.stringify(partialTemplate)}

Fill in missing fields and ensure the template is complete and professional.
`;

    try {
      const response = await this.callOllamaAPI({
        model: 'llama3.1',
        prompt,
        system: 'Complete partial whiteboard templates with professional content.',
        options: { temperature: 0.5 }
      });

      const completed = JSON.parse(response);
      return {
        id: partialTemplate.id || `template-${Date.now()}`,
        name: completed.name || partialTemplate.name || 'Untitled Template',
        description: completed.description || partialTemplate.description || '',
        category: completed.category || partialTemplate.category || TemplateCategory.BUSINESS,
        tags: completed.tags || partialTemplate.tags || [],
        difficulty: completed.difficulty || partialTemplate.difficulty || 'intermediate',
        estimatedTime: completed.estimatedTime || partialTemplate.estimatedTime || '10-15 minutes',
        elements: completed.elements || partialTemplate.elements || [],
        metadata: {
          author: 'AI Assistant',
          version: '1.0.0',
          created: Date.now(),
          usage: 0,
          rating: 0,
          ...partialTemplate.metadata
        },
        preview: {
          thumbnail: '',
          screenshots: [],
          ...partialTemplate.preview
        },
        instructions: completed.instructions || partialTemplate.instructions || [],
        relatedTemplates: completed.relatedTemplates || partialTemplate.relatedTemplates || []
      };
    } catch (error) {
      console.error('Failed to complete template:', error);
      throw new Error('Template completion failed');
    }
  }

  async suggestNextElements(currentElements: AnyWhiteboardElement[]): Promise<ElementSuggestion[]> {
    const elementSummary = currentElements.map(e => ({
      type: e.type,
      position: e.position,
      content: e.content?.substring(0, 50)
    }));

    const prompt = `
Based on these existing whiteboard elements, suggest 2-3 complementary elements:
${JSON.stringify(elementSummary)}

Consider:
1. What would logically come next
2. How to improve the overall composition
3. Common whiteboard patterns and workflows

Return JSON array of suggestions:
[
  {
    "type": "element-type",
    "position": {"x": 0, "y": 0},
    "content": "suggested content",
    "reasoning": "why this element would be helpful",
    "confidence": 0.8
  }
]
`;

    try {
      const response = await this.callOllamaAPI({
        model: 'llama3.1',
        prompt,
        system: 'Suggest logical next elements for whiteboard compositions.',
        options: { temperature: 0.6 }
      });

      return this.parseElementSuggestions(response);
    } catch (error) {
      console.error('Failed to suggest next elements:', error);
      return [];
    }
  }

  private parseElementSuggestions(response: string): ElementSuggestion[] {
    try {
      const suggestions = JSON.parse(response);
      return suggestions.map((s: any) => ({
        element: this.createElementFromAIData(s),
        reasoning: s.reasoning || 'AI suggested',
        confidence: s.confidence || 0.5,
        position: s.position || { x: 100, y: 100 }
      }));
    } catch (error) {
      console.error('Failed to parse element suggestions:', error);
      return [];
    }
  }

  private async callOllamaAPI(payload: any): Promise<string> {
    const response = await fetch(`${this.modelEndpoint}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
      },
      body: JSON.stringify({
        ...payload,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || '';
  }
}

// Smart Content Assistant Implementation
export class LibreOllamaContentAssistant implements SmartContentAssistant {
  private templateGenerator: LibreOllamaTemplateGenerator;

  constructor(templateGenerator: LibreOllamaTemplateGenerator) {
    this.templateGenerator = templateGenerator;
  }

  async suggestContent(element: AnyWhiteboardElement, context: ContentContext): Promise<ContentSuggestion[]> {
    // Implementation for content suggestions
    return [
      {
        text: 'AI-generated content suggestion',
        confidence: 0.7,
        reasoning: 'Based on element context',
        category: 'completion'
      }
    ];
  }

  async completeText(partialText: string, elementType: string): Promise<string[]> {
    // Implementation for text completion
    return [`${partialText} - completed by AI`];
  }

  async completeShape(partialPath: WhiteboardPoint[]): Promise<ShapeCompletion> {
    // Implementation for shape completion
    return {
      completedPath: partialPath,
      shapeType: 'rectangle',
      confidence: 0.5
    };
  }

  async suggestConnections(elements: AnyWhiteboardElement[]): Promise<ConnectionSuggestion[]> {
    // Implementation for connection suggestions
    return [];
  }

  async suggestGrouping(elements: AnyWhiteboardElement[]): Promise<GroupingSuggestion[]> {
    // Implementation for grouping suggestions
    return [];
  }

  async optimizeLayout(elements: AnyWhiteboardElement[]): Promise<LayoutOptimization> {
    // Implementation for layout optimization
    return {
      elementUpdates: [],
      reasoning: 'AI layout optimization',
      improvementScore: 0.8
    };
  }

  async suggestColorScheme(elements: AnyWhiteboardElement[]): Promise<ColorScheme> {
    // Implementation for color scheme suggestions
    return {
      name: 'Professional Blue',
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        accent: '#f59e0b',
        background: '#ffffff',
        text: '#1f2937'
      },
      reasoning: 'Professional and accessible color scheme'
    };
  }

  async suggestNextSteps(currentCanvas: WhiteboardState): Promise<WorkflowSuggestion[]> {
    // Implementation for workflow suggestions
    return [];
  }

  async identifyPotentialIssues(elements: AnyWhiteboardElement[]): Promise<CanvasIssue[]> {
    // Implementation for issue identification
    return [];
  }
}