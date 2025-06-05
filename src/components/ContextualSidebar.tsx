import React, { useState, useCallback } from 'react';
import {
  Clock,
  Star,
  ArrowRight,
  Plus,
  MessageSquare,
  Bot,
  Folder,
  FileText,
  Workflow,
  Plug,
  Download,
  File,
  BarChart3,
  Settings,
  Lightbulb,
  Link,
  TrendingUp,
  Calendar,
  CheckSquare,
  Mail,
  Cloud,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Move,
  Copy,
  Share,
  Zap,
  Target,
  Filter,
  Search,
  Tag,
  X,
  ChevronRight,
  ChevronLeft,
  Palette,
  Network,
  Hash,
  Users,
  Activity,
  TestTube
} from 'lucide-react';
import { Button } from './ui/button-v2';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card-v2';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { WorkflowState, WorkflowContext } from './UnifiedWorkspace';
import { useGoogleIntegration } from '../hooks/use-google-integration';
import { designTokens } from '../lib/design-tokens';

interface ContextualSidebarProps {
  currentWorkflow: WorkflowState;
  onWorkflowChange: (workflow: WorkflowState) => void;
  workflowContext: WorkflowContext;
  className?: string;
}

interface ContextualContent {
  linkedNotes: Array<{
    id: string;
    title: string;
    preview: string;
    lastModified: Date;
    tags: string[];
  }>;
  chatSummaries: Array<{
    id: string;
    title: string;
    summary: string;
    timestamp: Date;
    messageCount: number;
  }>;
  agentKnowledge: Array<{
    id: string;
    agentName: string;
    knowledge: string;
    confidence: number;
    lastUpdated: Date;
  }>;
  relatedTasks: Array<{
    id: string;
    title: string;
    status: 'todo' | 'in-progress' | 'done';
    priority: 'low' | 'medium' | 'high';
    dueDate?: Date;
  }>;
  upcomingEvents: Array<{
    id: string;
    title: string;
    startTime: Date;
    duration: number;
    type: 'meeting' | 'deadline' | 'reminder';
  }>;
}

const workflowIcons: Record<WorkflowState, React.ComponentType<{ className?: string }>> = {
  dashboard: BarChart3,
  'dashboard-v2': Sparkles,
  chat: MessageSquare,
  'chat-v2': Bot,
  agents: Bot,
  folders: Folder,
  notes: FileText,
  tasks: CheckSquare,
  calendar: Calendar,
  canvas: Palette,
  'knowledge-graph': Network,
  n8n: Workflow,
  mcp: Plug,
  models: Download,
  templates: File,
  analytics: TrendingUp,
  settings: Settings,
  'test-suite': TestTube,
  'test-analyzer': Search
};

// V2 Dark Theme Color Palette - Using design tokens
const workflowColors: Record<WorkflowState, string> = {
  dashboard: designTokens.colors.accent.primary,
  'dashboard-v2': designTokens.colors.accent.primary,
  chat: designTokens.colors.accent.secondary,
  'chat-v2': designTokens.colors.accent.secondary,
  agents: '#8B5CF6', // purple-500
  folders: '#F97316', // orange-500
  notes: '#10B981', // emerald-500
  tasks: '#EF4444', // red-500
  calendar: '#6366F1', // indigo-500
  canvas: '#EC4899', // pink-500
  'knowledge-graph': '#8B5CF6', // violet-500
  n8n: '#06B6D4', // cyan-500
  mcp: '#14B8A6', // teal-500
  models: '#F59E0B', // amber-500
  templates: '#EAB308', // yellow-500
  analytics: '#10B981', // emerald-500
  settings: '#6B7280', // gray-500
  'test-suite': '#84CC16', // lime-500
  'test-analyzer': '#64748B' // slate-500
};

export function ContextualSidebar({
  currentWorkflow,
  onWorkflowChange,
  workflowContext,
  className = ""
}: ContextualSidebarProps) {
  const googleIntegration = useGoogleIntegration();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('overview');

  // Mock contextual content - in real app, this would be fetched based on current workflow
  const [contextualContent] = useState<ContextualContent>({
    linkedNotes: [
      {
        id: '1',
        title: 'Project Planning Notes',
        preview: 'Key decisions and next steps for the current project...',
        lastModified: new Date(),
        tags: ['planning', 'project', 'decisions']
      },
      {
        id: '2',
        title: 'Meeting Summary',
        preview: 'Action items and follow-ups from today\'s meeting...',
        lastModified: new Date(Date.now() - 86400000),
        tags: ['meeting', 'action-items']
      }
    ],
    chatSummaries: [
      {
        id: '1',
        title: 'Code Review Discussion',
        summary: 'Discussed implementation approach and identified potential improvements...',
        timestamp: new Date(),
        messageCount: 15
      },
      {
        id: '2',
        title: 'Feature Planning',
        summary: 'Outlined requirements and timeline for new feature development...',
        timestamp: new Date(Date.now() - 3600000),
        messageCount: 8
      }
    ],
    agentKnowledge: [
      {
        id: '1',
        agentName: 'Code Assistant',
        knowledge: 'Familiar with React patterns and TypeScript best practices',
        confidence: 0.92,
        lastUpdated: new Date()
      },
      {
        id: '2',
        agentName: 'Project Manager',
        knowledge: 'Understands current project timeline and dependencies',
        confidence: 0.87,
        lastUpdated: new Date(Date.now() - 1800000)
      }
    ],
    relatedTasks: [
      {
        id: '1',
        title: 'Complete UI redesign',
        status: 'in-progress',
        priority: 'high',
        dueDate: new Date(Date.now() + 86400000)
      },
      {
        id: '2',
        title: 'Update documentation',
        status: 'todo',
        priority: 'medium',
        dueDate: new Date(Date.now() + 172800000)
      },
      {
        id: '3',
        title: 'Code review',
        status: 'done',
        priority: 'high'
      }
    ],
    upcomingEvents: [
      {
        id: '1',
        title: 'Team Standup',
        startTime: new Date(Date.now() + 3600000),
        duration: 30,
        type: 'meeting'
      },
      {
        id: '2',
        title: 'Project Deadline',
        startTime: new Date(Date.now() + 86400000),
        duration: 0,
        type: 'deadline'
      }
    ]
  });

  const getContextualSections = (workflow: WorkflowState) => {
    const sections: Record<WorkflowState, Array<{
      id: string;
      title: string;
      icon: React.ComponentType<{ className?: string }>;
      count?: number;
    }>> = {
      dashboard: [
        { id: 'overview', title: 'Overview', icon: Activity },
        { id: 'recent-activity', title: 'Recent Activity', icon: Clock },
        { id: 'quick-actions', title: 'Quick Actions', icon: Zap },
        { id: 'upcoming-events', title: 'Upcoming Events', icon: Calendar, count: contextualContent.upcomingEvents.length }
      ],
      'dashboard-v2': [
        { id: 'overview', title: 'Overview', icon: Activity },
        { id: 'recent-activity', title: 'Recent Activity', icon: Clock },
        { id: 'quick-actions', title: 'Quick Actions', icon: Zap },
        { id: 'upcoming-events', title: 'Upcoming Events', icon: Calendar, count: contextualContent.upcomingEvents.length },
        { id: 'design-features', title: 'New Features', icon: Sparkles }
      ],
      chat: [
        { id: 'overview', title: 'Overview', icon: Activity },
        { id: 'linked-notes', title: 'Linked Notes', icon: FileText, count: contextualContent.linkedNotes.length },
        { id: 'related-tasks', title: 'Related Tasks', icon: CheckSquare, count: contextualContent.relatedTasks.length },
        { id: 'agent-knowledge', title: 'Agent Knowledge', icon: Bot, count: contextualContent.agentKnowledge.length }
      ],
      'chat-v2': [
        { id: 'overview', title: 'Overview', icon: Activity },
        { id: 'linked-notes', title: 'Linked Notes', icon: FileText, count: contextualContent.linkedNotes.length },
        { id: 'related-tasks', title: 'Related Tasks', icon: CheckSquare, count: contextualContent.relatedTasks.length },
        { id: 'agent-knowledge', title: 'Agent Knowledge', icon: Bot, count: contextualContent.agentKnowledge.length },
        { id: 'enhanced-features', title: 'Enhanced Features', icon: Sparkles }
      ],
      notes: [
        { id: 'overview', title: 'Overview', icon: Activity },
        { id: 'chat-summaries', title: 'Chat Summaries', icon: MessageSquare, count: contextualContent.chatSummaries.length },
        { id: 'related-tasks', title: 'Related Tasks', icon: CheckSquare, count: contextualContent.relatedTasks.length },
        { id: 'linked-notes', title: 'Linked Notes', icon: Link, count: contextualContent.linkedNotes.length }
      ],
      tasks: [
        { id: 'overview', title: 'Overview', icon: Activity },
        { id: 'upcoming-events', title: 'Upcoming Events', icon: Calendar, count: contextualContent.upcomingEvents.length },
        { id: 'linked-notes', title: 'Linked Notes', icon: FileText, count: contextualContent.linkedNotes.length },
        { id: 'chat-summaries', title: 'Chat Context', icon: MessageSquare, count: contextualContent.chatSummaries.length }
      ],
      calendar: [
        { id: 'overview', title: 'Overview', icon: Activity },
        { id: 'upcoming-events', title: 'Today\'s Events', icon: Calendar, count: contextualContent.upcomingEvents.length },
        { id: 'related-tasks', title: 'Related Tasks', icon: CheckSquare, count: contextualContent.relatedTasks.length },
        { id: 'linked-notes', title: 'Meeting Notes', icon: FileText, count: contextualContent.linkedNotes.length }
      ],
      agents: [
        { id: 'overview', title: 'Overview', icon: Activity },
        { id: 'agent-knowledge', title: 'Knowledge Base', icon: Bot, count: contextualContent.agentKnowledge.length },
        { id: 'chat-summaries', title: 'Training Data', icon: MessageSquare, count: contextualContent.chatSummaries.length },
        { id: 'related-tasks', title: 'Agent Tasks', icon: CheckSquare, count: contextualContent.relatedTasks.length }
      ],
      settings: [
        { id: 'overview', title: 'Overview', icon: Activity },
        { id: 'recent-changes', title: 'Recent Changes', icon: Clock },
        { id: 'integrations', title: 'Integrations', icon: Plug }
      ],
      folders: [
        { id: 'overview', title: 'Overview', icon: Activity },
        { id: 'linked-notes', title: 'Folder Contents', icon: FileText, count: contextualContent.linkedNotes.length },
        { id: 'related-tasks', title: 'Folder Tasks', icon: CheckSquare, count: contextualContent.relatedTasks.length }
      ],
      canvas: [
        { id: 'overview', title: 'Overview', icon: Activity },
        { id: 'linked-notes', title: 'Canvas Notes', icon: FileText, count: contextualContent.linkedNotes.length },
        { id: 'related-tasks', title: 'Canvas Tasks', icon: CheckSquare, count: contextualContent.relatedTasks.length }
      ],
      'knowledge-graph': [
        { id: 'overview', title: 'Overview', icon: Activity },
        { id: 'linked-notes', title: 'Connected Notes', icon: FileText, count: contextualContent.linkedNotes.length },
        { id: 'agent-knowledge', title: 'Agent Insights', icon: Bot, count: contextualContent.agentKnowledge.length }
      ],
      n8n: [
        { id: 'overview', title: 'Overview', icon: Activity },
        { id: 'related-tasks', title: 'Workflow Tasks', icon: CheckSquare, count: contextualContent.relatedTasks.length },
        { id: 'chat-summaries', title: 'Workflow Logs', icon: MessageSquare, count: contextualContent.chatSummaries.length }
      ],
      mcp: [
        { id: 'overview', title: 'Overview', icon: Activity },
        { id: 'integrations', title: 'Server Status', icon: Plug },
        { id: 'chat-summaries', title: 'Usage Logs', icon: MessageSquare, count: contextualContent.chatSummaries.length }
      ],
      models: [
        { id: 'overview', title: 'Overview', icon: Activity },
        { id: 'chat-summaries', title: 'Model Usage', icon: MessageSquare, count: contextualContent.chatSummaries.length },
        { id: 'analytics', title: 'Performance', icon: BarChart3 }
      ],
      templates: [
        { id: 'overview', title: 'Overview', icon: Activity },
        { id: 'chat-summaries', title: 'Template Usage', icon: MessageSquare, count: contextualContent.chatSummaries.length },
        { id: 'linked-notes', title: 'Template Notes', icon: FileText, count: contextualContent.linkedNotes.length }
      ],
      analytics: [
        { id: 'overview', title: 'Overview', icon: Activity },
        { id: 'insights', title: 'Key Insights', icon: TrendingUp },
        { id: 'related-tasks', title: 'Action Items', icon: CheckSquare, count: contextualContent.relatedTasks.length }
      ],
      'test-suite': [
        { id: 'overview', title: 'Overview', icon: Activity },
        { id: 'test-results', title: 'Test Results', icon: TestTube },
        { id: 'related-tasks', title: 'Test Tasks', icon: CheckSquare, count: contextualContent.relatedTasks.length },
        { id: 'chat-summaries', title: 'Test Logs', icon: MessageSquare, count: contextualContent.chatSummaries.length }
      ],
      'test-analyzer': [
        { id: 'overview', title: 'Overview', icon: Activity },
        { id: 'analysis-results', title: 'Analysis Results', icon: Search },
        { id: 'linked-notes', title: 'Analysis Notes', icon: FileText, count: contextualContent.linkedNotes.length },
        { id: 'related-tasks', title: 'Analysis Tasks', icon: CheckSquare, count: contextualContent.relatedTasks.length }
      ]
    };

    return sections[workflow] || sections.chat;
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div
                className="rounded-lg p-3 text-center"
                style={{
                  backgroundColor: `${designTokens.colors.accent.secondary}20`,
                  border: `1px solid ${designTokens.colors.accent.secondary}30`
                }}
              >
                <div
                  className="text-lg font-semibold"
                  style={{
                    color: 'white',
                    fontFamily: designTokens.typography.fontFamily.sans.join(', ')
                  }}
                >
                  {contextualContent.linkedNotes.length}
                </div>
                <div
                  className="text-xs"
                  style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontFamily: designTokens.typography.fontFamily.sans.join(', ')
                  }}
                >
                  Linked Notes
                </div>
              </div>
              <div
                className="rounded-lg p-3 text-center"
                style={{
                  backgroundColor: `${designTokens.colors.accent.success}20`,
                  border: `1px solid ${designTokens.colors.accent.success}30`
                }}
              >
                <div
                  className="text-lg font-semibold"
                  style={{
                    color: 'white',
                    fontFamily: designTokens.typography.fontFamily.sans.join(', ')
                  }}
                >
                  {contextualContent.relatedTasks.filter(t => t.status !== 'done').length}
                </div>
                <div
                  className="text-xs"
                  style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontFamily: designTokens.typography.fontFamily.sans.join(', ')
                  }}
                >
                  Active Tasks
                </div>
              </div>
              <div
                className="rounded-lg p-3 text-center"
                style={{
                  backgroundColor: `${designTokens.colors.accent.primary}20`,
                  border: `1px solid ${designTokens.colors.accent.primary}30`
                }}
              >
                <div
                  className="text-lg font-semibold"
                  style={{
                    color: 'white',
                    fontFamily: designTokens.typography.fontFamily.sans.join(', ')
                  }}
                >
                  {contextualContent.chatSummaries.length}
                </div>
                <div
                  className="text-xs"
                  style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontFamily: designTokens.typography.fontFamily.sans.join(', ')
                  }}
                >
                  Chat Sessions
                </div>
              </div>
              <div
                className="rounded-lg p-3 text-center"
                style={{
                  backgroundColor: `${designTokens.colors.accent.warning}20`,
                  border: `1px solid ${designTokens.colors.accent.warning}30`
                }}
              >
                <div
                  className="text-lg font-semibold"
                  style={{
                    color: 'white',
                    fontFamily: designTokens.typography.fontFamily.sans.join(', ')
                  }}
                >
                  {contextualContent.upcomingEvents.length}
                </div>
                <div
                  className="text-xs"
                  style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontFamily: designTokens.typography.fontFamily.sans.join(', ')
                  }}
                >
                  Upcoming
                </div>
              </div>
            </div>

            {/* V2 Quick Actions */}
            <div className="space-y-2">
              <h4
                className="text-sm font-medium"
                style={{
                  color: 'white',
                  fontFamily: designTokens.typography.fontFamily.sans.join(', ')
                }}
              >
                Quick Actions
              </h4>
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8 hover:bg-white/10"
                  style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontFamily: designTokens.typography.fontFamily.sans.join(', ')
                  }}
                  onClick={() => setActiveSection('linked-notes')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Linked Notes
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8 hover:bg-white/10"
                  style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontFamily: designTokens.typography.fontFamily.sans.join(', ')
                  }}
                  onClick={() => setActiveSection('related-tasks')}
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Manage Tasks
                </Button>
              </div>
            </div>
          </div>
        );

      case 'linked-notes':
        return (
          <div className="space-y-3">
            {contextualContent.linkedNotes.map((note) => (
              <div
                key={note.id}
                className="p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-sm text-gray-900 line-clamp-1">
                    {note.title}
                  </h4>
                  <ArrowRight className="h-3 w-3 text-gray-400 flex-shrink-0 ml-2" />
                </div>
                <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                  {note.preview}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {note.tags.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">
                    {note.lastModified.toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        );

      case 'related-tasks':
        return (
          <div className="space-y-3">
            {contextualContent.relatedTasks.map((task) => (
              <div
                key={task.id}
                className="p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-sm text-gray-900 line-clamp-1">
                    {task.title}
                  </h4>
                  <Badge
                    variant={task.status === 'done' ? 'default' : task.status === 'in-progress' ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {task.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <Badge
                    variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {task.priority}
                  </Badge>
                  {task.dueDate && (
                    <span className="text-xs text-gray-500">
                      Due {task.dueDate.toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        );

      case 'chat-summaries':
        return (
          <div className="space-y-3">
            {contextualContent.chatSummaries.map((chat) => (
              <div
                key={chat.id}
                className="p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-sm text-gray-900 line-clamp-1">
                    {chat.title}
                  </h4>
                  <Badge variant="secondary" className="text-xs">
                    {chat.messageCount} msgs
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                  {chat.summary}
                </p>
                <span className="text-xs text-gray-500">
                  {chat.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <div className="text-sm">No content available</div>
          </div>
        );
    }
  };

  const sections = getContextualSections(currentWorkflow);
  const Icon = workflowIcons[currentWorkflow];

  if (isCollapsed) {
    return (
      <div
        className={`${className} w-12 border-l flex flex-col items-center py-4`}
        style={{
          backgroundColor: designTokens.colors.background.secondary,
          borderColor: designTokens.colors.background.tertiary
        }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(false)}
          className="h-8 w-8 p-0"
          style={{ color: 'white' }}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`${className} w-80 border-l flex flex-col`}
      style={{
        backgroundColor: designTokens.colors.background.secondary,
        borderColor: designTokens.colors.background.tertiary,
        fontFamily: designTokens.typography.fontFamily.sans.join(', ')
      }}
    >
      {/* V2 Header */}
      <div
        className="p-4 border-b"
        style={{
          borderColor: designTokens.colors.background.tertiary
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div style={{ color: workflowColors[currentWorkflow] || designTokens.colors.accent.primary }}>
              <Icon className="h-4 w-4" />
            </div>
            <h3
              className="font-semibold text-sm"
              style={{
                color: 'white',
                fontFamily: designTokens.typography.fontFamily.sans.join(', ')
              }}
            >
              Context Panel
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(true)}
            className="h-6 w-6 p-0 hover:bg-white/10"
            style={{ color: 'rgba(255, 255, 255, 0.6)' }}
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
        <p
          className="text-xs"
          style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontFamily: designTokens.typography.fontFamily.sans.join(', ')
          }}
        >
          Contextual information for {currentWorkflow}
        </p>
      </div>

      {/* V2 Section Navigation */}
      <div
        className="p-4 border-b"
        style={{
          borderColor: designTokens.colors.background.tertiary
        }}
      >
        <div className="space-y-1">
          {sections.map((section) => {
            const SectionIcon = section.icon;
            const isActive = activeSection === section.id;
            
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors"
                style={{
                  backgroundColor: isActive
                    ? `${designTokens.colors.accent.primary}20`
                    : 'transparent',
                  color: isActive
                    ? designTokens.colors.accent.primary
                    : 'rgba(255, 255, 255, 0.7)',
                  fontWeight: isActive ? 600 : 400,
                  fontFamily: designTokens.typography.fontFamily.sans.join(', ')
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                  }
                }}
              >
                <div className="flex items-center space-x-2">
                  <SectionIcon className="h-4 w-4" />
                  <span>{section.title}</span>
                </div>
                {section.count !== undefined && (
                  <Badge
                    variant="secondary"
                    className="text-xs h-5 px-1.5"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    {section.count}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {renderSectionContent()}
        </div>
      </ScrollArea>

      {/* Google Integration Status */}
      <div className="p-4 border-t border-gray-100">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Cloud className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-900">Integrations</span>
            </div>
            <Badge 
              variant={googleIntegration.authState.isAuthenticated ? "secondary" : "outline"}
              className="text-xs"
            >
              {googleIntegration.authState.isAuthenticated ? "Connected" : "Offline"}
            </Badge>
          </div>
          
          {googleIntegration.authState.isAuthenticated && googleIntegration.quickOverview && (
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 bg-blue-50 rounded">
                <div className="font-medium text-blue-900">
                  {googleIntegration.quickOverview.todaysEvents.length}
                </div>
                <div className="text-blue-600">Events</div>
              </div>
              <div className="text-center p-2 bg-green-50 rounded">
                <div className="font-medium text-green-900">
                  {googleIntegration.quickOverview.incompleteTasks.length}
                </div>
                <div className="text-green-600">Tasks</div>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded">
                <div className="font-medium text-purple-900">
                  {googleIntegration.quickOverview.unreadEmails.length}
                </div>
                <div className="text-purple-600">Emails</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}