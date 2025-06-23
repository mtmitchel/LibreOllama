import React from 'react';
import { Card } from '../../shared/ui';
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '../../shared/ui/DropdownMenu';
import { Settings2, MessageSquare, FileText, FolderPlus, LayoutTemplate } from 'lucide-react';

interface QuickAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

interface QuickActionsWidgetProps {
  actions?: QuickAction[];
}

const defaultActions: QuickAction[] = [
  { 
    id: 'action1', 
    icon: <MessageSquare className="w-5 h-5 text-primary" />, 
    label: "New chat",
    onClick: () => console.log('New chat')
  },
  { 
    id: 'action2', 
    icon: <FileText className="w-5 h-5 text-primary" />, 
    label: "Create task",
    onClick: () => console.log('Create task')
  },
  { 
    id: 'action3', 
    icon: <FolderPlus className="w-5 h-5 text-primary" />, 
    label: "Create project",
    onClick: () => console.log('Create project')
  },
  { 
    id: 'action4', 
    icon: <LayoutTemplate className="w-5 h-5 text-primary" />, 
    label: "Open canvas",
    onClick: () => console.log('Open canvas')
  }
];

export const QuickActionsWidget: React.FC<QuickActionsWidgetProps> = ({ 
  actions = defaultActions 
}) => {
  const handleCustomizeActions = () => {
    console.log('Customize quick actions');
  };

  const handleAddAction = () => {
    console.log('Add new action');
  };

  const handleResetActions = () => {
    console.log('Reset to default actions');
  };

  return (
    <Card className="lg:col-span-2 xl:col-span-1 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-text-primary">Quick actions</h3>        <DropdownMenu
          trigger={
            <div className="flex items-center justify-center w-8 h-8 text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-md transition-colors cursor-pointer">
              <Settings2 className="w-4 h-4" />
            </div>
          }
        >
          <DropdownMenuItem onClick={handleCustomizeActions}>
            Customize actions
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleAddAction}>
            Add new action
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleResetActions}>
            Reset to defaults
          </DropdownMenuItem>
        </DropdownMenu>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action) => (
          <button 
            key={action.id} 
            onClick={action.onClick}
            className="flex flex-col items-center justify-center p-4 rounded-lg bg-bg-secondary hover:bg-bg-tertiary transition-colors group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg-primary"
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-2 group-hover:bg-accent-soft transition-colors">
              {action.icon}
            </div>
            <span className="text-sm font-medium text-text-primary">{action.label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
};
