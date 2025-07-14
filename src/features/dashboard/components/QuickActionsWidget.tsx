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
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <Heading level={3}>Quick actions</Heading>
        <DropdownMenu>
          <DropdownMenu.Trigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-secondary hover:text-primary"
            >
              <Settings2 className="size-4" />
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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {actions.map((action) => (
          <Button
            key={action.id}
            variant="secondary"
            onClick={action.onClick}
            className="flex h-24 flex-col items-center justify-center gap-2 whitespace-normal p-2 text-center"
          >
            {action.icon}
            <span className="text-sm font-semibold leading-tight text-primary">{action.label}</span>
          </Button>
        ))}
      </div>
    </Card>
  );
};
