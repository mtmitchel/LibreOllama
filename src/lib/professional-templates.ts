// Phase 2a: Templates & AI Integration - Professional Template Library

import {
  WhiteboardTemplate,
  TemplateCategory
} from './template-types';
import {
  AnyWhiteboardElement
} from './whiteboard-types';
import { WhiteboardElementFactory } from './whiteboard-utils';

export class ProfessionalTemplateLibrary {
  private templates: WhiteboardTemplate[] = [];

  constructor() {
    this.initializeTemplates();
  }

  getTemplates(): WhiteboardTemplate[] {
    return this.templates;
  }

  getTemplateById(id: string): WhiteboardTemplate | null {
    return this.templates.find(t => t.id === id) || null;
  }

  getTemplatesByCategory(category: TemplateCategory): WhiteboardTemplate[] {
    return this.templates.filter(t => t.category === category);
  }

  private initializeTemplates(): void {
    this.templates = [
      // Business Templates
      this.createSWOTAnalysisTemplate(),
      this.createBusinessModelCanvasTemplate(),
      this.createUserJourneyMapTemplate(),
      this.createStakeholderAnalysisTemplate(),
      this.createValuePropositionCanvasTemplate(),
      this.createLeanCanvasTemplate(),

      // Project Management Templates
      this.createKanbanBoardTemplate(),
      this.createSprintPlanningTemplate(),
      this.createProjectTimelineTemplate(),
      this.createRiskAssessmentMatrixTemplate(),
      this.createResourcePlanningTemplate(),
      this.createTeamCharterTemplate(),

      // Design & UX Templates
      this.createUserPersonaTemplate(),
      this.createWireframeTemplate(),
      this.createSiteMapTemplate(),
      this.createInformationArchitectureTemplate(),
      this.createDesignSystemTemplate(),
      this.createUserFlowTemplate(),

      // Analysis & Planning Templates
      this.createMindMapTemplate(),
      this.createFishboneDiagramTemplate(),
      this.createDecisionMatrixTemplate(),
      this.createRootCauseAnalysisTemplate(),
      this.createProcessFlowTemplate(),
      this.createOrgChartTemplate(),

      // Brainstorming & Ideation Templates
      this.createBrainstormingSessionTemplate(),
      this.createIdeaParkingLotTemplate(),
      this.createAffinityMappingTemplate(),
      this.createSixThinkingHatsTemplate(),
      this.createCrazy8sTemplate(),
      this.createHowMightWeTemplate()
    ];
  }

  // Business Templates
  private createSWOTAnalysisTemplate(): WhiteboardTemplate {
    const elements: AnyWhiteboardElement[] = [
      // Title
      WhiteboardElementFactory.createTextBox(
        { x: 300, y: 50 },
        'SWOT Analysis',
        {
          family: 'Inter, sans-serif',
          size: 24,
          weight: 'bold',
          style: 'normal',
          decoration: 'none',
          align: 'center'
        }
      ),

      // Quadrant Frames
      WhiteboardElementFactory.createFrame(
        { x: 100, y: 120 },
        { width: 280, height: 200 },
        'Strengths'
      ),
      WhiteboardElementFactory.createFrame(
        { x: 420, y: 120 },
        { width: 280, height: 200 },
        'Weaknesses'
      ),
      WhiteboardElementFactory.createFrame(
        { x: 100, y: 360 },
        { width: 280, height: 200 },
        'Opportunities'
      ),
      WhiteboardElementFactory.createFrame(
        { x: 420, y: 360 },
        { width: 280, height: 200 },
        'Threats'
      ),

      // Placeholder sticky notes
      WhiteboardElementFactory.createStickyNote(
        { x: 120, y: 160 },
        'What advantages do you have?',
        '#dcfce7'
      ),
      WhiteboardElementFactory.createStickyNote(
        { x: 440, y: 160 },
        'What could you improve?',
        '#fed7d7'
      ),
      WhiteboardElementFactory.createStickyNote(
        { x: 120, y: 400 },
        'What opportunities can you spot?',
        '#dbeafe'
      ),
      WhiteboardElementFactory.createStickyNote(
        { x: 440, y: 400 },
        'What threats could harm you?',
        '#fef3c7'
      )
    ];

    return {
      id: 'swot-analysis',
      name: 'SWOT Analysis',
      description: 'Analyze Strengths, Weaknesses, Opportunities, and Threats to make strategic decisions',
      category: TemplateCategory.BUSINESS,
      tags: ['analysis', 'strategy', 'planning', 'business', 'decision-making'],
      difficulty: 'beginner',
      estimatedTime: '15-20 minutes',
      elements,
      metadata: {
        author: 'LibreOllama',
        version: '1.0.0',
        created: Date.now(),
        usage: 0,
        rating: 4.8
      },
      preview: {
        thumbnail: this.generateThumbnail('SWOT'),
        screenshots: []
      },
      instructions: [
        'Fill in each quadrant with relevant items',
        'Strengths: Internal positive factors that give you an advantage',
        'Weaknesses: Internal areas that need improvement',
        'Opportunities: External positive possibilities to explore',
        'Threats: External challenges or risks to address',
        'Use different colored sticky notes for each category',
        'Prioritize the most important items in each quadrant'
      ],
      relatedTemplates: ['business-model-canvas', 'competitive-analysis', 'risk-assessment-matrix']
    };
  }

  private createBusinessModelCanvasTemplate(): WhiteboardTemplate {
    const elements: AnyWhiteboardElement[] = [
      // Title
      WhiteboardElementFactory.createTextBox(
        { x: 400, y: 30 },
        'Business Model Canvas',
        {
          family: 'Inter, sans-serif',
          size: 24,
          weight: 'bold',
          style: 'normal',
          decoration: 'none',
          align: 'center'
        }
      ),

      // 9 Building Blocks
      WhiteboardElementFactory.createFrame({ x: 50, y: 80 }, { width: 180, height: 150 }, 'Key Partners'),
      WhiteboardElementFactory.createFrame({ x: 250, y: 80 }, { width: 180, height: 75 }, 'Key Activities'),
      WhiteboardElementFactory.createFrame({ x: 250, y: 155 }, { width: 180, height: 75 }, 'Key Resources'),
      WhiteboardElementFactory.createFrame({ x: 450, y: 80 }, { width: 180, height: 150 }, 'Value Propositions'),
      WhiteboardElementFactory.createFrame({ x: 650, y: 80 }, { width: 180, height: 75 }, 'Customer Relationships'),
      WhiteboardElementFactory.createFrame({ x: 650, y: 155 }, { width: 180, height: 75 }, 'Channels'),
      WhiteboardElementFactory.createFrame({ x: 850, y: 80 }, { width: 180, height: 150 }, 'Customer Segments'),
      WhiteboardElementFactory.createFrame({ x: 250, y: 250 }, { width: 380, height: 120 }, 'Cost Structure'),
      WhiteboardElementFactory.createFrame({ x: 650, y: 250 }, { width: 380, height: 120 }, 'Revenue Streams'),

      // Helper text
      WhiteboardElementFactory.createStickyNote(
        { x: 70, y: 120 },
        'Who are your key partners and suppliers?',
        '#fef3c7'
      ),
      WhiteboardElementFactory.createStickyNote(
        { x: 470, y: 120 },
        'What unique value do you deliver to customers?',
        '#dcfce7'
      ),
      WhiteboardElementFactory.createStickyNote(
        { x: 870, y: 120 },
        'Who are your most important customers?',
        '#dbeafe'
      )
    ];

    return {
      id: 'business-model-canvas',
      name: 'Business Model Canvas',
      description: 'Visual chart with elements describing a firm\'s value proposition, infrastructure, customers, and finances',
      category: TemplateCategory.BUSINESS,
      tags: ['business model', 'strategy', 'startup', 'planning', 'canvas'],
      difficulty: 'intermediate',
      estimatedTime: '45-60 minutes',
      elements,
      metadata: {
        author: 'LibreOllama',
        version: '1.0.0',
        created: Date.now(),
        usage: 0,
        rating: 4.9
      },
      preview: {
        thumbnail: this.generateThumbnail('BMC'),
        screenshots: []
      },
      instructions: [
        'Start with the Value Propositions block - what unique value do you offer?',
        'Identify your Customer Segments - who will pay for your value proposition?',
        'Define Channels - how will you reach and deliver to customers?',
        'Establish Customer Relationships - what type of relationship does each segment expect?',
        'Identify Revenue Streams - how does your business make money?',
        'List Key Resources - what assets do you need to deliver your value proposition?',
        'Define Key Activities - what activities does your value proposition require?',
        'Identify Key Partners - who can help you deliver your value proposition?',
        'Calculate Cost Structure - what are the major costs to operate your business model?'
      ],
      relatedTemplates: ['value-proposition-canvas', 'lean-canvas', 'swot-analysis']
    };
  }

  private createUserJourneyMapTemplate(): WhiteboardTemplate {
    const elements: AnyWhiteboardElement[] = [
      // Title and persona
      WhiteboardElementFactory.createTextBox(
        { x: 400, y: 30 },
        'User Journey Map',
        {
          family: 'Inter, sans-serif',
          size: 24,
          weight: 'bold',
          style: 'normal',
          decoration: 'none',
          align: 'center'
        }
      ),

      // Persona section
      WhiteboardElementFactory.createFrame({ x: 50, y: 80 }, { width: 900, height: 100 }, 'User Persona'),
      WhiteboardElementFactory.createStickyNote(
        { x: 70, y: 120 },
        'Name: [Persona Name]\nGoals: [Primary objectives]\nFrustrations: [Pain points]',
        '#dbeafe'
      ),

      // Journey phases
      WhiteboardElementFactory.createFrame({ x: 50, y: 200 }, { width: 170, height: 400 }, 'Awareness'),
      WhiteboardElementFactory.createFrame({ x: 240, y: 200 }, { width: 170, height: 400 }, 'Consideration'),
      WhiteboardElementFactory.createFrame({ x: 430, y: 200 }, { width: 170, height: 400 }, 'Purchase'),
      WhiteboardElementFactory.createFrame({ x: 620, y: 200 }, { width: 170, height: 400 }, 'Onboarding'),
      WhiteboardElementFactory.createFrame({ x: 810, y: 200 }, { width: 170, height: 400 }, 'Advocacy'),

      // Touchpoints row
      WhiteboardElementFactory.createTextBox({ x: 70, y: 220 }, 'Touchpoints', { family: 'Inter', size: 14, weight: 'bold', style: 'normal', decoration: 'none', align: 'left' }),
      WhiteboardElementFactory.createStickyNote({ x: 70, y: 250 }, 'Social media\nSearch engines', '#fef3c7'),

      // Actions row
      WhiteboardElementFactory.createTextBox({ x: 70, y: 320 }, 'Actions', { family: 'Inter', size: 14, weight: 'bold', style: 'normal', decoration: 'none', align: 'left' }),
      WhiteboardElementFactory.createStickyNote({ x: 70, y: 350 }, 'Researches\nReads reviews', '#dcfce7'),

      // Emotions row
      WhiteboardElementFactory.createTextBox({ x: 70, y: 420 }, 'Emotions', { family: 'Inter', size: 14, weight: 'bold', style: 'normal', decoration: 'none', align: 'left' }),
      WhiteboardElementFactory.createStickyNote({ x: 70, y: 450 }, 'Curious\nOptimistic', '#fed7d7'),

      // Opportunities row
      WhiteboardElementFactory.createTextBox({ x: 70, y: 520 }, 'Opportunities', { family: 'Inter', size: 14, weight: 'bold', style: 'normal', decoration: 'none', align: 'left' }),
      WhiteboardElementFactory.createStickyNote({ x: 70, y: 550 }, 'Improve SEO\nCreate content', '#e5e7eb')
    ];

    return {
      id: 'user-journey-map',
      name: 'User Journey Map',
      description: 'Visualize the complete experience users have with your product or service across all touchpoints',
      category: TemplateCategory.DESIGN,
      tags: ['ux', 'user experience', 'customer journey', 'touchpoints', 'design thinking'],
      difficulty: 'intermediate',
      estimatedTime: '60-90 minutes',
      elements,
      metadata: {
        author: 'LibreOllama',
        version: '1.0.0',
        created: Date.now(),
        usage: 0,
        rating: 4.7
      },
      preview: {
        thumbnail: this.generateThumbnail('UJM'),
        screenshots: []
      },
      instructions: [
        'Start by defining your user persona with goals and frustrations',
        'Map out the key phases of the user journey',
        'For each phase, identify touchpoints where users interact with your brand',
        'Document specific actions users take in each phase',
        'Capture the emotions users feel throughout the journey',
        'Identify pain points and opportunities for improvement',
        'Use different colors for different types of information',
        'Validate the journey map with real user research'
      ],
      relatedTemplates: ['user-persona', 'service-blueprint', 'empathy-map']
    };
  }

  // Project Management Templates
  private createKanbanBoardTemplate(): WhiteboardTemplate {
    const elements: AnyWhiteboardElement[] = [
      // Title
      WhiteboardElementFactory.createTextBox(
        { x: 400, y: 30 },
        'Kanban Board',
        {
          family: 'Inter, sans-serif',
          size: 24,
          weight: 'bold',
          style: 'normal',
          decoration: 'none',
          align: 'center'
        }
      ),

      // Columns
      WhiteboardElementFactory.createFrame({ x: 100, y: 80 }, { width: 200, height: 500 }, 'Backlog'),
      WhiteboardElementFactory.createFrame({ x: 320, y: 80 }, { width: 200, height: 500 }, 'To Do'),
      WhiteboardElementFactory.createFrame({ x: 540, y: 80 }, { width: 200, height: 500 }, 'In Progress'),
      WhiteboardElementFactory.createFrame({ x: 760, y: 80 }, { width: 200, height: 500 }, 'Done'),

      // Sample tasks
      WhiteboardElementFactory.createStickyNote({ x: 120, y: 120 }, 'User authentication\n[3 story points]', '#fef3c7'),
      WhiteboardElementFactory.createStickyNote({ x: 120, y: 200 }, 'Database schema\n[5 story points]', '#fef3c7'),
      WhiteboardElementFactory.createStickyNote({ x: 340, y: 120 }, 'Design wireframes\n[2 story points]', '#dbeafe'),
      WhiteboardElementFactory.createStickyNote({ x: 560, y: 120 }, 'Implement login\n[3 story points]', '#fed7d7'),
      WhiteboardElementFactory.createStickyNote({ x: 780, y: 120 }, 'Setup project\n[1 story point]', '#dcfce7'),

      // WIP limits
      WhiteboardElementFactory.createTextBox({ x: 590, y: 100 }, 'WIP: 3', { family: 'Inter', size: 12, weight: 'bold', style: 'normal', decoration: 'none', align: 'center' })
    ];

    return {
      id: 'kanban-board',
      name: 'Kanban Board',
      description: 'Visualize work, limit work in progress, and maximize efficiency through continuous delivery',
      category: TemplateCategory.PROJECT_MANAGEMENT,
      tags: ['agile', 'kanban', 'workflow', 'project management', 'task tracking'],
      difficulty: 'beginner',
      estimatedTime: '15-30 minutes',
      elements,
      metadata: {
        author: 'LibreOllama',
        version: '1.0.0',
        created: Date.now(),
        usage: 0,
        rating: 4.6
      },
      preview: {
        thumbnail: this.generateThumbnail('KAN'),
        screenshots: []
      },
      instructions: [
        'Create columns for your workflow stages (Backlog, To Do, In Progress, Done)',
        'Write each task or user story on a separate sticky note',
        'Include story points or time estimates on each task',
        'Set Work In Progress (WIP) limits for active columns',
        'Move tasks from left to right as work progresses',
        'Use different colors to categorize task types or priorities',
        'Hold regular standup meetings to discuss board updates',
        'Continuously improve your process based on flow metrics'
      ],
      relatedTemplates: ['sprint-planning', 'project-timeline', 'task-board']
    };
  }

  private createSprintPlanningTemplate(): WhiteboardTemplate {
    const elements: AnyWhiteboardElement[] = [
      // Title and sprint info
      WhiteboardElementFactory.createTextBox(
        { x: 400, y: 30 },
        'Sprint Planning - Sprint #',
        {
          family: 'Inter, sans-serif',
          size: 24,
          weight: 'bold',
          style: 'normal',
          decoration: 'none',
          align: 'center'
        }
      ),

      // Sprint details
      WhiteboardElementFactory.createFrame({ x: 50, y: 80 }, { width: 900, height: 80 }, 'Sprint Details'),
      WhiteboardElementFactory.createTextBox({ x: 70, y: 110 }, 'Sprint Goal: [What do we want to achieve?]', { family: 'Inter', size: 14, weight: 'normal', style: 'normal', decoration: 'none', align: 'left' }),
      WhiteboardElementFactory.createTextBox({ x: 70, y: 130 }, 'Duration: [Start Date] - [End Date] | Capacity: [Team capacity]', { family: 'Inter', size: 14, weight: 'normal', style: 'normal', decoration: 'none', align: 'left' }),

      // Product Backlog
      WhiteboardElementFactory.createFrame({ x: 50, y: 180 }, { width: 280, height: 400 }, 'Product Backlog'),
      WhiteboardElementFactory.createStickyNote({ x: 70, y: 220 }, 'User can login\n[Priority: High]\n[8 story points]', '#dbeafe'),
      WhiteboardElementFactory.createStickyNote({ x: 70, y: 300 }, 'User can reset password\n[Priority: Medium]\n[5 story points]', '#fef3c7'),
      WhiteboardElementFactory.createStickyNote({ x: 70, y: 380 }, 'Admin dashboard\n[Priority: Low]\n[13 story points]', '#fed7d7'),

      // Sprint Backlog
      WhiteboardElementFactory.createFrame({ x: 350, y: 180 }, { width: 280, height: 400 }, 'Sprint Backlog'),
      WhiteboardElementFactory.createStickyNote({ x: 370, y: 220 }, 'Selected for this sprint', '#dcfce7'),

      // Team Capacity
      WhiteboardElementFactory.createFrame({ x: 650, y: 180 }, { width: 300, height: 200 }, 'Team Capacity'),
      WhiteboardElementFactory.createTextBox({ x: 670, y: 220 }, 'Developer A: 30 hours\nDeveloper B: 35 hours\nTester: 20 hours\nTotal: 85 hours', { family: 'Inter', size: 12, weight: 'normal', style: 'normal', decoration: 'none', align: 'left' }),

      // Definition of Done
      WhiteboardElementFactory.createFrame({ x: 650, y: 400 }, { width: 300, height: 180 }, 'Definition of Done'),
      WhiteboardElementFactory.createTextBox({ x: 670, y: 440 }, '✓ Code reviewed\n✓ Tests written\n✓ Documentation updated\n✓ Acceptance criteria met', { family: 'Inter', size: 12, weight: 'normal', style: 'normal', decoration: 'none', align: 'left' })
    ];

    return {
      id: 'sprint-planning',
      name: 'Sprint Planning',
      description: 'Plan and organize work for an upcoming sprint in agile development',
      category: TemplateCategory.PROJECT_MANAGEMENT,
      tags: ['agile', 'scrum', 'sprint', 'planning', 'backlog'],
      difficulty: 'intermediate',
      estimatedTime: '30-45 minutes',
      elements,
      metadata: {
        author: 'LibreOllama',
        version: '1.0.0',
        created: Date.now(),
        usage: 0,
        rating: 4.5
      },
      preview: {
        thumbnail: this.generateThumbnail('SP'),
        screenshots: []
      },
      instructions: [
        'Set a clear sprint goal that provides focus and direction',
        'Review and prioritize items in the product backlog',
        'Estimate story points for each backlog item',
        'Select items for the sprint based on team capacity and sprint goal',
        'Break down large stories into smaller, manageable tasks',
        'Ensure the Definition of Done is clear and agreed upon',
        'Confirm team capacity considering holidays and other commitments',
        'Get team commitment for the selected sprint backlog items'
      ],
      relatedTemplates: ['kanban-board', 'user-story-mapping', 'retrospective']
    };
  }

  // Brainstorming Templates
  private createBrainstormingSessionTemplate(): WhiteboardTemplate {
    const elements: AnyWhiteboardElement[] = [
      // Title
      WhiteboardElementFactory.createTextBox(
        { x: 400, y: 30 },
        'Brainstorming Session',
        {
          family: 'Inter, sans-serif',
          size: 24,
          weight: 'bold',
          style: 'normal',
          decoration: 'none',
          align: 'center'
        }
      ),

      // Problem statement
      WhiteboardElementFactory.createFrame({ x: 100, y: 80 }, { width: 600, height: 100 }, 'Problem Statement / Challenge'),
      WhiteboardElementFactory.createTextBox(
        { x: 120, y: 120 },
        'How might we... [Define the problem or opportunity]',
        { family: 'Inter', size: 16, weight: 'normal', style: 'italic', decoration: 'none', align: 'left' }
      ),

      // Rules
      WhiteboardElementFactory.createFrame({ x: 720, y: 80 }, { width: 230, height: 200 }, 'Brainstorming Rules'),
      WhiteboardElementFactory.createTextBox(
        { x: 740, y: 120 },
        '1. No criticism\n2. Encourage wild ideas\n3. Build on others\' ideas\n4. Stay focused\n5. One conversation\n6. Be visual\n7. Go for quantity',
        { family: 'Inter', size: 12, weight: 'normal', style: 'normal', decoration: 'none', align: 'left' }
      ),

      // Ideas area
      WhiteboardElementFactory.createFrame({ x: 100, y: 200 }, { width: 600, height: 400 }, 'Ideas'),
      WhiteboardElementFactory.createStickyNote({ x: 120, y: 240 }, 'Idea #1\n[Brief description]', '#fef3c7'),
      WhiteboardElementFactory.createStickyNote({ x: 280, y: 240 }, 'Idea #2\n[Brief description]', '#dbeafe'),
      WhiteboardElementFactory.createStickyNote({ x: 440, y: 240 }, 'Idea #3\n[Brief description]', '#dcfce7'),
      WhiteboardElementFactory.createStickyNote({ x: 120, y: 340 }, 'Building on idea #1...', '#fed7d7'),

      // Next steps
      WhiteboardElementFactory.createFrame({ x: 720, y: 300 }, { width: 230, height: 150 }, 'Next Steps'),
      WhiteboardElementFactory.createTextBox(
        { x: 740, y: 340 },
        '□ Prioritize ideas\n□ Develop top concepts\n□ Create prototypes\n□ Test with users',
        { family: 'Inter', size: 12, weight: 'normal', style: 'normal', decoration: 'none', align: 'left' }
      ),

      // Parking lot
      WhiteboardElementFactory.createFrame({ x: 720, y: 470 }, { width: 230, height: 130 }, 'Parking Lot'),
      WhiteboardElementFactory.createTextBox(
        { x: 740, y: 510 },
        'Off-topic ideas that might be valuable later',
        { family: 'Inter', size: 12, weight: 'normal', style: 'italic', decoration: 'none', align: 'left' }
      )
    ];

    return {
      id: 'brainstorming-session',
      name: 'Brainstorming Session',
      description: 'Generate creative ideas and solutions through collaborative thinking',
      category: TemplateCategory.BRAINSTORMING,
      tags: ['brainstorming', 'ideation', 'creativity', 'collaboration', 'problem solving'],
      difficulty: 'beginner',
      estimatedTime: '45-60 minutes',
      elements,
      metadata: {
        author: 'LibreOllama',
        version: '1.0.0',
        created: Date.now(),
        usage: 0,
        rating: 4.7
      },
      preview: {
        thumbnail: this.generateThumbnail('BS'),
        screenshots: []
      },
      instructions: [
        'Start with a clear problem statement or "How might we..." question',
        'Review the brainstorming rules with all participants',
        'Set a time limit for the ideation phase (typically 15-30 minutes)',
        'Encourage participants to write one idea per sticky note',
        'Build on others\' ideas by adding new sticky notes',
        'Use the parking lot for off-topic but potentially valuable ideas',
        'After ideation, group similar ideas together',
        'Vote or prioritize the most promising concepts',
        'Define clear next steps for developing selected ideas'
      ],
      relatedTemplates: ['crazy-8s', 'affinity-mapping', 'how-might-we']
    };
  }

  // Additional template creation methods would continue here...
  // For brevity, I'll create a few more key templates

  private createMindMapTemplate(): WhiteboardTemplate {
    const elements: AnyWhiteboardElement[] = [
      // Central topic
      WhiteboardElementFactory.createShape(
        { x: 350, y: 250 },
        'circle',
        { width: 150, height: 150 }
      ),
      WhiteboardElementFactory.createTextBox(
        { x: 400, y: 310 },
        'CENTRAL TOPIC',
        { family: 'Inter', size: 16, weight: 'bold', style: 'normal', decoration: 'none', align: 'center' }
      ),

      // Main branches
      WhiteboardElementFactory.createStickyNote({ x: 150, y: 150 }, 'Main Branch 1', '#dbeafe'),
      WhiteboardElementFactory.createStickyNote({ x: 550, y: 150 }, 'Main Branch 2', '#dcfce7'),
      WhiteboardElementFactory.createStickyNote({ x: 150, y: 350 }, 'Main Branch 3', '#fef3c7'),
      WhiteboardElementFactory.createStickyNote({ x: 550, y: 350 }, 'Main Branch 4', '#fed7d7'),

      // Connecting lines
      WhiteboardElementFactory.createArrow({ x: 300, y: 200 }, { x: 350, y: 250 }),
      WhiteboardElementFactory.createArrow({ x: 500, y: 200 }, { x: 450, y: 250 }),
      WhiteboardElementFactory.createArrow({ x: 300, y: 400 }, { x: 350, y: 350 }),
      WhiteboardElementFactory.createArrow({ x: 500, y: 400 }, { x: 450, y: 350 }),

      // Sub-branches
      WhiteboardElementFactory.createStickyNote({ x: 50, y: 100 }, 'Sub-idea 1.1', '#e5e7eb'),
      WhiteboardElementFactory.createStickyNote({ x: 50, y: 180 }, 'Sub-idea 1.2', '#e5e7eb')
    ];

    return {
      id: 'mind-map',
      name: 'Mind Map',
      description: 'Visualize information hierarchically to explore topics and generate ideas',
      category: TemplateCategory.ANALYSIS,
      tags: ['mind mapping', 'visualization', 'brainstorming', 'organization', 'thinking'],
      difficulty: 'beginner',
      estimatedTime: '20-30 minutes',
      elements,
      metadata: {
        author: 'LibreOllama',
        version: '1.0.0',
        created: Date.now(),
        usage: 0,
        rating: 4.6
      },
      preview: {
        thumbnail: this.generateThumbnail('MM'),
        screenshots: []
      },
      instructions: [
        'Start with your central topic in the middle',
        'Add main branches radiating outward from the center',
        'Use different colors for each main branch',
        'Add sub-branches with more specific details',
        'Keep text brief - use keywords and phrases',
        'Use images and symbols when possible',
        'Connect related ideas with lines or arrows',
        'Continue expanding until you\'ve captured all relevant information'
      ],
      relatedTemplates: ['concept-map', 'brainstorming-session', 'information-architecture']
    };
  }

  // Utility methods
  private generateThumbnail(text: string): string {
    return 'data:image/svg+xml;base64,' + btoa(`
      <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f8f9fa"/>
        <rect x="20" y="20" width="160" height="110" fill="#ffffff" stroke="#e5e7eb" stroke-width="2" rx="8"/>
        <text x="100" y="80" text-anchor="middle" fill="#374151" font-size="18" font-weight="bold">
          ${text}
        </text>
        <circle cx="50" cy="50" r="8" fill="#3b82f6"/>
        <rect x="130" y="42" width="40" height="16" fill="#ef4444" rx="4"/>
        <rect x="30" y="100" width="140" height="8" fill="#10b981" rx="4"/>
      </svg>
    `);
  }

  // Placeholder methods for additional templates
  private createStakeholderAnalysisTemplate(): WhiteboardTemplate { return this.createPlaceholderTemplate('stakeholder-analysis', 'Stakeholder Analysis', TemplateCategory.BUSINESS); }
  private createValuePropositionCanvasTemplate(): WhiteboardTemplate { return this.createPlaceholderTemplate('value-proposition-canvas', 'Value Proposition Canvas', TemplateCategory.BUSINESS); }
  private createLeanCanvasTemplate(): WhiteboardTemplate { return this.createPlaceholderTemplate('lean-canvas', 'Lean Canvas', TemplateCategory.BUSINESS); }
  private createProjectTimelineTemplate(): WhiteboardTemplate { return this.createPlaceholderTemplate('project-timeline', 'Project Timeline', TemplateCategory.PROJECT_MANAGEMENT); }
  private createRiskAssessmentMatrixTemplate(): WhiteboardTemplate { return this.createPlaceholderTemplate('risk-assessment-matrix', 'Risk Assessment Matrix', TemplateCategory.PROJECT_MANAGEMENT); }
  private createResourcePlanningTemplate(): WhiteboardTemplate { return this.createPlaceholderTemplate('resource-planning', 'Resource Planning', TemplateCategory.PROJECT_MANAGEMENT); }
  private createTeamCharterTemplate(): WhiteboardTemplate { return this.createPlaceholderTemplate('team-charter', 'Team Charter', TemplateCategory.PROJECT_MANAGEMENT); }
  private createUserPersonaTemplate(): WhiteboardTemplate { return this.createPlaceholderTemplate('user-persona', 'User Persona', TemplateCategory.DESIGN); }
  private createWireframeTemplate(): WhiteboardTemplate { return this.createPlaceholderTemplate('wireframe', 'Wireframe Template', TemplateCategory.DESIGN); }
  private createSiteMapTemplate(): WhiteboardTemplate { return this.createPlaceholderTemplate('site-map', 'Site Map', TemplateCategory.DESIGN); }
  private createInformationArchitectureTemplate(): WhiteboardTemplate { return this.createPlaceholderTemplate('information-architecture', 'Information Architecture', TemplateCategory.DESIGN); }
  private createDesignSystemTemplate(): WhiteboardTemplate { return this.createPlaceholderTemplate('design-system', 'Design System', TemplateCategory.DESIGN); }
  private createUserFlowTemplate(): WhiteboardTemplate { return this.createPlaceholderTemplate('user-flow', 'User Flow', TemplateCategory.DESIGN); }
  private createFishboneDiagramTemplate(): WhiteboardTemplate { return this.createPlaceholderTemplate('fishbone-diagram', 'Fishbone Diagram', TemplateCategory.ANALYSIS); }
  private createDecisionMatrixTemplate(): WhiteboardTemplate { return this.createPlaceholderTemplate('decision-matrix', 'Decision Matrix', TemplateCategory.ANALYSIS); }
  private createRootCauseAnalysisTemplate(): WhiteboardTemplate { return this.createPlaceholderTemplate('root-cause-analysis', 'Root Cause Analysis', TemplateCategory.ANALYSIS); }
  private createProcessFlowTemplate(): WhiteboardTemplate { return this.createPlaceholderTemplate('process-flow', 'Process Flow', TemplateCategory.ANALYSIS); }
  private createOrgChartTemplate(): WhiteboardTemplate { return this.createPlaceholderTemplate('org-chart', 'Organization Chart', TemplateCategory.ANALYSIS); }
  private createIdeaParkingLotTemplate(): WhiteboardTemplate { return this.createPlaceholderTemplate('idea-parking-lot', 'Idea Parking Lot', TemplateCategory.BRAINSTORMING); }
  private createAffinityMappingTemplate(): WhiteboardTemplate { return this.createPlaceholderTemplate('affinity-mapping', 'Affinity Mapping', TemplateCategory.BRAINSTORMING); }
  private createSixThinkingHatsTemplate(): WhiteboardTemplate { return this.createPlaceholderTemplate('six-thinking-hats', 'Six Thinking Hats', TemplateCategory.BRAINSTORMING); }
  private createCrazy8sTemplate(): WhiteboardTemplate { return this.createPlaceholderTemplate('crazy-8s', 'Crazy 8s', TemplateCategory.BRAINSTORMING); }
  private createHowMightWeTemplate(): WhiteboardTemplate { return this.createPlaceholderTemplate('how-might-we', 'How Might We', TemplateCategory.BRAINSTORMING); }

  private createPlaceholderTemplate(id: string, name: string, category: TemplateCategory): WhiteboardTemplate {
    return {
      id,
      name,
      description: `Professional ${name} template for structured collaboration`,
      category,
      tags: [category.toLowerCase()],
      difficulty: 'intermediate',
      estimatedTime: '15-30 minutes',
      elements: [
        WhiteboardElementFactory.createTextBox(
          { x: 300, y: 200 },
          `${name} Template\n(Coming Soon)`,
          { family: 'Inter', size: 18, weight: 'bold', style: 'normal', decoration: 'none', align: 'center' }
        )
      ],
      metadata: {
        author: 'LibreOllama',
        version: '1.0.0',
        created: Date.now(),
        usage: 0,
        rating: 4.0
      },
      preview: {
        thumbnail: this.generateThumbnail(name.substring(0, 3).toUpperCase()),
        screenshots: []
      },
      instructions: [`This is a ${name} template for professional collaboration`],
      relatedTemplates: []
    };
  }
}

// Singleton instance
export const professionalTemplateLibrary = new ProfessionalTemplateLibrary();