import React from 'react';
import { Card, Button, Heading } from '../../../components/ui';
import { DropdownMenu } from '../../../components/ui/DropdownMenu';
import { Settings2, MessageSquare, FileText, FolderPlus, LayoutTemplate, MoreHorizontal } from 'lucide-react';

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
    icon: <MessageSquare className="w-6 h-6 text-primary" />, 
    label: "New chat",
    onClick: () => console.log('New chat')
  },
  { 
    id: 'action2', 
    icon: <FileText className="w-6 h-6 text-primary" />, 
    label: "Create task",
    onClick: () => console.log('Create task')
  },
  { 
    id: 'action3', 
    icon: <FolderPlus className="w-6 h-6 text-primary" />, 
    label: "Create project",
    onClick: () => console.log('Create project')
  },
  { 
    id: 'action4', 
    icon: <LayoutTemplate className="w-6 h-6 text-primary" />, 
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
    <Card>
      <div className="flex justify-between items-center mb-4">
        <Heading level={3}>Quick actions</Heading>
        <DropdownMenu>
          <DropdownMenu.Trigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-secondary hover:text-primary"
            >
              <Settings2 className="w-4 h-4" />
            </Button>
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {actions.map((action) => (
          <Button
            key={action.id}
            variant="secondary"
            onClick={action.onClick}
            className="h-24 p-2 flex flex-col items-center justify-center text-center whitespace-normal gap-2"
          >
            {action.icon}
            <span className="font-semibold text-sm text-primary leading-tight">{action.label}</span>
          </Button>
        ))}
      </div>
    </Card>
  );
};
