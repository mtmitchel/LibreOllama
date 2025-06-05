import React from 'react';
import { PrimarySidebar } from './navigation/PrimarySidebar';
import { ContextAwareTopBar } from './ContextAwareTopBar';
import { DashboardScreen } from './screens/DashboardScreen';
import { AIChatScreen } from './screens/AIChatScreen';

export type WorkflowState = 
  | 'dashboard' 
  | 'chat' 
  | 'projects' 
  | 'notes' 
  | 'whiteboards' 
  | 'tasks' 
  | 'calendar' 
  | 'agents' 
  | 'settings' 
  | 'folders' 
  | 'canvas' 
  | 'knowledge-graph' 
  | 'n8n' 
  | 'mcp' 
  | 'models' 
  | 'templates' 
  | 'analytics' 
  | 'test-suite' 
  | 'test-analyzer' 
  | 'dashboard-v2' 
  | 'chat-v2';

interface UnifiedWorkspaceProps {
  currentWorkflow: WorkflowState;
  onWorkflowChange: (workflow: WorkflowState) => void;
  focusMode: boolean;
  onToggleFocusMode: () => void;
  onOpenCommandPalette: () => void;
}

export function UnifiedWorkspace({ 
  currentWorkflow, 
  onWorkflowChange, 
  focusMode, 
  onToggleFocusMode,
  onOpenCommandPalette 
}: UnifiedWorkspaceProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const renderMainContent = () => {
    switch (currentWorkflow) {
      case 'dashboard':
      case 'dashboard-v2':
        return <DashboardScreen />;
      case 'chat':
      case 'chat-v2':
        return <AIChatScreen />;
      case 'tasks':
        return <div className="p-6"><h1 className="text-2xl font-semibold">Tasks - Coming Soon</h1></div>;
      case 'calendar':
        return <div className="p-6"><h1 className="text-2xl font-semibold">Calendar - Coming Soon</h1></div>;
      case 'projects':
        return <div className="p-6"><h1 className="text-2xl font-semibold">Projects - Coming Soon</h1></div>;
      case 'notes':
        return <div className="p-6"><h1 className="text-2xl font-semibold">Notes - Coming Soon</h1></div>;
      case 'agents':
        return <div className="p-6"><h1 className="text-2xl font-semibold">AI Agents - Coming Soon</h1></div>;
      case 'settings':
        return <div className="p-6"><h1 className="text-2xl font-semibold">Settings - Coming Soon</h1></div>;
      default:
        return <DashboardScreen />;
    }
  };
  return (
    <div className="flex h-full w-full">
      {!focusMode && (
        <PrimarySidebar 
          currentWorkflow={currentWorkflow}
          onWorkflowChange={onWorkflowChange}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          focusMode={focusMode}
          onToggleFocusMode={onToggleFocusMode}
          onOpenCommandPalette={onOpenCommandPalette}
        />
      )}
      
      <div className="flex-1 flex flex-col">
        <ContextAwareTopBar 
          currentWorkflow={currentWorkflow}
          onWorkflowChange={onWorkflowChange}
          focusMode={focusMode}
          onToggleFocusMode={onToggleFocusMode}
          onOpenCommandPalette={onOpenCommandPalette}
        />
        
        <main className="flex-1 overflow-auto">
          {renderMainContent()}
        </main>
      </div>
    </div>
  );
}