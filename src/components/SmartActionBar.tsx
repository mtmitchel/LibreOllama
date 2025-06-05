import React, { useState } from 'react';
import {
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
  Save,
  Share,
  Copy,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  Target,
  Cloud,
  Calendar,
  CheckSquare,
  Mail,
  Palette,
  Network
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { WorkflowState, WorkflowContext } from './UnifiedWorkspace';
import { useGoogleIntegration } from '../hooks/use-google-integration';

interface SmartActionBarProps {
  currentWorkflow: WorkflowState;
  onWorkflowChange: (workflow: WorkflowState) => void;
  workflowContext: WorkflowContext;
  className?: string;
}

const workflowIcons: Record<WorkflowState, React.ComponentType<{ className?: string }>> = {
  chat: MessageSquare,
  agents: Bot,
  folders: Folder,
  notes: FileText,
  n8n: Workflow,
  mcp: Plug,
  models: Download,
  templates: File,
  analytics: BarChart3,
  settings: Settings,
  canvas: Palette,
  'knowledge-graph': Network
};

const workflowColors: Record<WorkflowState, string> = {
  chat: 'border-blue-500 bg-blue-50 text-blue-700',
  agents: 'border-purple-500 bg-purple-50 text-purple-700',
  folders: 'border-orange-500 bg-orange-50 text-orange-700',
  notes: 'border-green-500 bg-green-50 text-green-700',
  n8n: 'border-indigo-500 bg-indigo-50 text-indigo-700',
  mcp: 'border-cyan-500 bg-cyan-50 text-cyan-700',
  models: 'border-red-500 bg-red-50 text-red-700',
  templates: 'border-yellow-500 bg-yellow-50 text-yellow-700',
  analytics: 'border-teal-500 bg-teal-50 text-teal-700',
  settings: 'border-gray-500 bg-gray-50 text-gray-700',
  canvas: 'border-pink-500 bg-pink-50 text-pink-700',
  'knowledge-graph': 'border-violet-500 bg-violet-50 text-violet-700'
};

export function SmartActionBar({ 
  currentWorkflow, 
  onWorkflowChange, 
  workflowContext,
  className = "" 
}: SmartActionBarProps) {
  const googleIntegration = useGoogleIntegration();
  
  const [workflowProgress, setWorkflowProgress] = useState({
    chat: 0,
    agents: 0,
    folders: 0,
    notes: 0,
    n8n: 0,
    mcp: 0,
    models: 75, // Example: some models installed
    templates: 0,
    analytics: 0,
    settings: 100, // Example: settings configured
    canvas: 0,
    'knowledge-graph': 0
  });

  const getWorkflowActions = (workflow: WorkflowState) => {
    const actions: Record<WorkflowState, Array<{
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      action: () => void;
      variant?: 'default' | 'secondary' | 'outline' | 'ghost';
      shortcut?: string;
      isActive?: boolean;
    }>> = {
      chat: [
        {
          label: "Save Chat",
          icon: Save,
          action: () => console.log('Save chat'),
          variant: 'outline',
          shortcut: 'Ctrl+S'
        },
        {
          label: "Export",
          icon: Share,
          action: () => console.log('Export chat'),
          variant: 'ghost'
        },
        {
          label: "Copy",
          icon: Copy,
          action: () => console.log('Copy chat'),
          variant: 'ghost'
        },
        {
          label: "→ Note",
          icon: FileText,
          action: () => onWorkflowChange('notes'),
          variant: 'secondary'
        },
        {
          label: "→ Agent",
          icon: Bot,
          action: () => onWorkflowChange('agents'),
          variant: 'secondary'
        }
      ],
      agents: [
        {
          label: "Test Agent",
          icon: Play,
          action: () => onWorkflowChange('chat'),
          variant: 'default'
        },
        {
          label: "Save Config",
          icon: Save,
          action: () => console.log('Save agent'),
          variant: 'outline'
        },
        {
          label: "Export",
          icon: Share,
          action: () => console.log('Export agent'),
          variant: 'ghost'
        },
        {
          label: "→ Template",
          icon: File,
          action: () => onWorkflowChange('templates'),
          variant: 'secondary'
        }
      ],
      folders: [
        {
          label: "Create Folder",
          icon: Folder,
          action: () => console.log('Create folder'),
          variant: 'default'
        },
        {
          label: "Import",
          icon: Download,
          action: () => console.log('Import to folder'),
          variant: 'outline'
        },
        {
          label: "→ Notes",
          icon: FileText,
          action: () => onWorkflowChange('notes'),
          variant: 'secondary'
        },
        {
          label: "→ Workflow",
          icon: Workflow,
          action: () => onWorkflowChange('n8n'),
          variant: 'secondary'
        }
      ],
      notes: [
        {
          label: "Save Note",
          icon: Save,
          action: () => console.log('Save note'),
          variant: 'default',
          shortcut: 'Ctrl+S'
        },
        {
          label: "Export",
          icon: Share,
          action: () => console.log('Export note'),
          variant: 'outline'
        },
        {
          label: "→ Chat",
          icon: MessageSquare,
          action: () => onWorkflowChange('chat'),
          variant: 'secondary'
        },
        {
          label: "→ Folder",
          icon: Folder,
          action: () => onWorkflowChange('folders'),
          variant: 'secondary'
        }
      ],
      n8n: [
        {
          label: "Run Workflow",
          icon: Play,
          action: () => console.log('Run workflow'),
          variant: 'default'
        },
        {
          label: "Save",
          icon: Save,
          action: () => console.log('Save workflow'),
          variant: 'outline'
        },
        {
          label: "→ MCP",
          icon: Plug,
          action: () => onWorkflowChange('mcp'),
          variant: 'secondary'
        },
        {
          label: "→ Analytics",
          icon: BarChart3,
          action: () => onWorkflowChange('analytics'),
          variant: 'secondary'
        }
      ],
      mcp: [
        {
          label: "Test Connection",
          icon: Play,
          action: () => console.log('Test MCP'),
          variant: 'default'
        },
        {
          label: "Refresh",
          icon: RotateCcw,
          action: () => console.log('Refresh MCP'),
          variant: 'outline'
        },
        {
          label: "→ Chat",
          icon: MessageSquare,
          action: () => onWorkflowChange('chat'),
          variant: 'secondary'
        },
        {
          label: "→ Workflow",
          icon: Workflow,
          action: () => onWorkflowChange('n8n'),
          variant: 'secondary'
        }
      ],
      models: [
        {
          label: "Download Model",
          icon: Download,
          action: () => console.log('Download model'),
          variant: 'default'
        },
        {
          label: "Refresh",
          icon: RotateCcw,
          action: () => console.log('Refresh models'),
          variant: 'outline'
        },
        {
          label: "→ Chat",
          icon: MessageSquare,
          action: () => onWorkflowChange('chat'),
          variant: 'secondary'
        },
        {
          label: "→ Analytics",
          icon: BarChart3,
          action: () => onWorkflowChange('analytics'),
          variant: 'secondary'
        }
      ],
      templates: [
        {
          label: "Create Template",
          icon: File,
          action: () => console.log('Create template'),
          variant: 'default'
        },
        {
          label: "Import",
          icon: Download,
          action: () => console.log('Import template'),
          variant: 'outline'
        },
        {
          label: "→ Chat",
          icon: MessageSquare,
          action: () => onWorkflowChange('chat'),
          variant: 'secondary'
        },
        {
          label: "→ Agent",
          icon: Bot,
          action: () => onWorkflowChange('agents'),
          variant: 'secondary'
        }
      ],
      analytics: [
        {
          label: "Refresh Data",
          icon: RotateCcw,
          action: () => console.log('Refresh analytics'),
          variant: 'default'
        },
        {
          label: "Export Report",
          icon: Share,
          action: () => console.log('Export report'),
          variant: 'outline'
        },
        {
          label: "→ Notes",
          icon: FileText,
          action: () => onWorkflowChange('notes'),
          variant: 'secondary'
        },
        {
          label: "→ Models",
          icon: Download,
          action: () => onWorkflowChange('models'),
          variant: 'secondary'
        }
      ],
      settings: [
        {
          label: "Save Settings",
          icon: Save,
          action: () => console.log('Save settings'),
          variant: 'default'
        },
        {
          label: "Reset",
          icon: RotateCcw,
          action: () => console.log('Reset settings'),
          variant: 'outline'
        },
        {
          label: "Export Config",
          icon: Share,
          action: () => console.log('Export config'),
          variant: 'ghost'
        },
        {
          label: "→ Analytics",
          icon: BarChart3,
          action: () => onWorkflowChange('analytics'),
          variant: 'secondary'
        }
      ],
      canvas: [
        {
          label: "Save Canvas",
          icon: Save,
          action: () => console.log('Save canvas'),
          variant: 'default',
          shortcut: 'Ctrl+S'
        },
        {
          label: "Export",
          icon: Share,
          action: () => console.log('Export canvas'),
          variant: 'outline'
        },
        {
          label: "→ Notes",
          icon: FileText,
          action: () => onWorkflowChange('notes'),
          variant: 'secondary'
        },
        {
          label: "→ Knowledge Graph",
          icon: Network,
          action: () => onWorkflowChange('knowledge-graph'),
          variant: 'secondary'
        }
      ],
      'knowledge-graph': [
        {
          label: "Refresh Graph",
          icon: RotateCcw,
          action: () => console.log('Refresh knowledge graph'),
          variant: 'default'
        },
        {
          label: "Export",
          icon: Share,
          action: () => console.log('Export graph'),
          variant: 'outline'
        },
        {
          label: "→ Canvas",
          icon: Palette,
          action: () => onWorkflowChange('canvas'),
          variant: 'secondary'
        },
        {
          label: "→ Analytics",
          icon: BarChart3,
          action: () => onWorkflowChange('analytics'),
          variant: 'secondary'
        }
      ]
    };

    return actions[workflow] || [];
  };

  const getWorkflowStatus = (workflow: WorkflowState) => {
    const statuses: Record<WorkflowState, {
      status: 'idle' | 'active' | 'success' | 'warning' | 'error';
      message: string;
    }> = {
      chat: { status: 'idle', message: 'Ready for conversation' },
      agents: { status: 'idle', message: 'No active agents' },
      folders: { status: 'idle', message: 'Organized workspace' },
      notes: { status: 'idle', message: 'Notes ready' },
      n8n: { status: 'idle', message: 'Workflows ready' },
      mcp: { status: 'success', message: '2 servers connected' },
      models: { status: 'success', message: '3 models installed' },
      templates: { status: 'idle', message: 'Templates available' },
      analytics: { status: 'active', message: 'Collecting data' },
      settings: { status: 'success', message: 'Configuration complete' },
      canvas: { status: 'idle', message: 'Canvas ready for spatial organization' },
      'knowledge-graph': { status: 'idle', message: 'Knowledge graph ready' }
    };

    return statuses[workflow];
  };

  const workflowActions = getWorkflowActions(currentWorkflow);
  const workflowStatus = getWorkflowStatus(currentWorkflow);
  const Icon = workflowIcons[currentWorkflow];

  const statusIcons = {
    idle: Clock,
    active: Zap,
    success: CheckCircle,
    warning: AlertCircle,
    error: AlertCircle
  };

  const StatusIcon = statusIcons[workflowStatus.status];
  const statusColors = {
    idle: 'text-gray-500',
    active: 'text-blue-500',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500'
  };

  return (
    <div className={`${className} px-6 py-4 bg-white border-b border-gray-200`}>
      <div className="flex items-center justify-between">
        {/* Current Workflow Info */}
        <div className="flex items-center space-x-4">
          <div className={`
            flex items-center space-x-2 px-3 py-2 rounded-lg border-2
            ${workflowColors[currentWorkflow]}
          `}>
            <Icon className="h-4 w-4" />
            <span className="font-medium text-sm capitalize">{currentWorkflow}</span>
          </div>
          
          <Separator orientation="vertical" className="h-6" />
          
          <div className="flex items-center space-x-2">
            <StatusIcon className={`h-4 w-4 ${statusColors[workflowStatus.status]}`} />
            <span className="text-sm text-gray-600">{workflowStatus.message}</span>
          </div>

          {/* Progress Indicator */}
          {workflowProgress[currentWorkflow] > 0 && (
            <div className="flex items-center space-x-2">
              <Progress 
                value={workflowProgress[currentWorkflow]} 
                className="w-16 h-2"
              />
              <span className="text-xs text-gray-500">
                {workflowProgress[currentWorkflow]}%
              </span>
            </div>
          )}

          {/* Google Integration Status */}
          {googleIntegration.authState.isAuthenticated && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center space-x-2">
                <Cloud className="h-4 w-4 text-blue-500" />
                <div className="flex items-center space-x-1">
                  {googleIntegration.integrationStatus?.calendar.connected && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      <Calendar className="h-3 w-3 mr-1" />
                      Cal
                    </Badge>
                  )}
                  {googleIntegration.integrationStatus?.tasks.connected && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      <CheckSquare className="h-3 w-3 mr-1" />
                      Tasks
                    </Badge>
                  )}
                  {googleIntegration.integrationStatus?.gmail.connected && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      <Mail className="h-3 w-3 mr-1" />
                      {googleIntegration.integrationStatus.gmail.unreadCount > 0 && (
                        <span className="ml-1 bg-red-500 text-white rounded-full px-1 text-xs">
                          {googleIntegration.integrationStatus.gmail.unreadCount}
                        </span>
                      )}
                    </Badge>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Workflow Actions */}
        <div className="flex items-center space-x-2">
          {workflowActions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'outline'}
              size="sm"
              onClick={action.action}
              className={`
                h-9 px-3
                ${action.isActive ? 'ring-2 ring-blue-500' : ''}
                ${action.label.startsWith('→') ? 'border-dashed' : ''}
              `}
              title={action.shortcut ? `${action.label} (${action.shortcut})` : action.label}
            >
              <action.icon className="h-4 w-4 mr-1.5" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Workflow Breadcrumb Navigation */}
      <div className="mt-3 flex items-center space-x-1 text-xs text-gray-500">
        <Target className="h-3 w-3" />
        <span>Workspace</span>
        <span className="mx-1">›</span>
        <span className="font-medium text-gray-700 capitalize">{currentWorkflow}</span>
        
        {/* Recent workflow trail */}
        {workflowContext.recentActivity.length > 1 && (
          <>
            <span className="mx-2 text-gray-300">|</span>
            <span>Recent:</span>
            {workflowContext.recentActivity.slice(1, 3).map((activity, index) => (
              <React.Fragment key={activity.id}>
                <button
                  onClick={() => onWorkflowChange(activity.type)}
                  className="hover:text-blue-600 transition-colors capitalize"
                >
                  {activity.type}
                </button>
                {index < Math.min(workflowContext.recentActivity.length - 2, 1) && (
                  <span className="mx-1">›</span>
                )}
              </React.Fragment>
            ))}
          </>
        )}
      </div>
    </div>
  );
}