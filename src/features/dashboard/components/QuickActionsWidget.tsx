import React from 'react';
import { Card, Button, Heading } from '../../../components/ui';
import { DropdownMenu } from '../../../components/ui/DropdownMenu';
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
    icon: <MessageSquare className="size-6 text-primary" />, 
    label: "New chat",
    onClick: () => console.log('New chat')
  },
  { 
    id: 'action2', 
    icon: <FileText className="size-6 text-primary" />, 
    label: "Create task",
    onClick: () => console.log('Create task')
  },
  { 
    id: 'action3', 
    icon: <FolderPlus className="size-6 text-primary" />, 
    label: "Create project",
    onClick: () => console.log('Create project')
  },
  { 
    id: 'action4', 
    icon: <LayoutTemplate className="size-6 text-primary" />, 
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
    <div className="asana-card">
      <div className="asana-card-header">
        <h3 className="asana-card-title">Quick actions</h3>
        <DropdownMenu>
          <DropdownMenu.Trigger asChild>
            <button className="asana-icon-button">
              <Settings2 size={16} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Item onSelect={handleCustomizeActions}>
              Customize actions
            </DropdownMenu.Item>
            <DropdownMenu.Item onSelect={handleAddAction}>
              Add new action
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item onSelect={handleResetActions}>
              Reset to defaults
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </div>
      <div className="asana-quick-actions">
        {actions.map((action) => (
          <div
            key={action.id}
            onClick={action.onClick}
            className="asana-quick-action"
          >
            <div className="asana-quick-action-icon">
              {action.icon}
            </div>
            <span className="asana-quick-action-label">{action.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
