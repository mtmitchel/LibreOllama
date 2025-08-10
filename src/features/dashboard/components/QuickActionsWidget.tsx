import React from 'react';
import { Button } from '../../../components/ui/design-system/Button';
import { Card } from '../../../components/ui/design-system/Card';
import { Heading } from '../../../components/ui';
import { WidgetHeader, Tile, Dropdown } from '../../../components/ui/design-system';
import { MoreHorizontal, MessageSquare, FileText, FolderPlus, LayoutTemplate } from 'lucide-react';

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
    <div className="asana-card asana-card-padded">
      <WidgetHeader
        title="Quick actions"
        actions={(
          <Dropdown
            items={[
              { value: 'customize', label: 'Customize actions' },
              { value: 'add', label: 'Add new action' },
              { separator: true, value: 'sep', label: '' } as any,
              { value: 'reset', label: 'Reset to defaults' }
            ]}
            onSelect={(v: string) => {
              if (v === 'customize') handleCustomizeActions();
              else if (v === 'add') handleAddAction();
              else if (v === 'reset') handleResetActions();
            }}
            placement="bottom-end"
            trigger={(
              <Button variant="ghost" size="icon" aria-label="Open quick actions menu" className="text-primary">
                <MoreHorizontal size={18} />
              </Button>
            )}
          />
        )}
      />
      <div className="asana-quick-actions">
        {actions.map((action) => (
          <Tile key={action.id} icon={action.icon} label={action.label} onClick={action.onClick} />
        ))}
      </div>
    </div>
  );
};
