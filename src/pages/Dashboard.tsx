import React, { useEffect, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { useHeader } from '../contexts/HeaderContext';
import {
  MessageSquare,
  FileText,
  FolderPlus,
  LayoutTemplate,
  MoreHorizontal,
  Settings2,
  PlusCircle,
  CheckCircle2,
  Circle
} from 'lucide-react';

export function Dashboard() {
  const { setHeaderProps, clearHeaderProps } = useHeader();

  const handleAddWidget = useCallback(() => {
    console.log('Add widget');
  }, []);

  useEffect(() => {
    setHeaderProps({
      title: "Good morning, Alex",
      primaryAction: {
        label: 'Add widget',
        onClick: handleAddWidget,
        icon: <PlusCircle size={16} />
      },
      secondaryActions: [
        {
          label: 'More options',
          onClick: () => console.log('More options'),
          icon: <MoreHorizontal size={16} />,
          variant: 'ghost' as const
        }
      ]
    });
    return () => clearHeaderProps();
  }, [setHeaderProps, clearHeaderProps, handleAddWidget]);
  const migrationSprintTasks = [
    { id: 'task1', icon: <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />, text: "Component library setup", date: "Dec 18" },
    { id: 'task2', icon: <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />, text: "Dashboard redesign", date: "Dec 20" },
    { id: 'task3', icon: <Circle className="w-4 h-4 text-muted-foreground stroke-2 flex-shrink-0" />, text: "Chat interface migration", date: "Dec 25" }
  ];

  const todaysFocusItems = [
    { id: 'focus1', time: "9:00 AM", title: "Design review", team: "UI migration team", color: "bg-blue-500" },
    { id: 'focus2', time: "2:30 PM", title: "Code review session", team: "Development team", color: "bg-green-500" }
  ];

  const agentStatusItems = [
    { id: 'agent1', name: "General assistant", model: "Llama 3.1 70B", status: "Active", statusColor: "bg-green-500", textColor: "text-green-600" },
    { id: 'agent2', name: "Research helper", model: "Mixtral 8x7B", status: "Offline", statusColor: "bg-gray-400", textColor: "text-gray-600" }
  ];

  const quickActionsItems = [
    { id: 'action1', icon: <MessageSquare className="w-5 h-5 text-blue-600" />, label: "New chat" },
    { id: 'action2', icon: <FileText className="w-5 h-5 text-blue-600" />, label: "Create task" },
    { id: 'action3', icon: <FolderPlus className="w-5 h-5 text-blue-600" />, label: "Create project" },
    { id: 'action4', icon: <LayoutTemplate className="w-5 h-5 text-blue-600" />, label: "Open canvas" }
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">        {/* UI Migration Sprint Widget */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-foreground">UI migration sprint</h3>
            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">67% complete</span>
          </div>
          <div className="mb-4">
            <div className="w-full bg-muted rounded-full h-2.5">
              <div className="bg-blue-500 h-2.5 rounded-full w-[67%]"></div>
            </div>
          </div>
          <ul className="space-y-3">
            {migrationSprintTasks.map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                {item.icon}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{item.text}</div>
                </div>
                <div className="text-xs text-muted-foreground flex-shrink-0">{item.date}</div>
              </li>
            ))}
          </ul>
        </Card>

        {/* Today's Focus Widget */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-foreground">Today's focus</h3>
            <button className="flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
          <ul className="space-y-4">
            {todaysFocusItems.map((item) => (
            <li key={item.id} className="flex items-start gap-3">
              <div className="flex flex-col items-center text-center min-w-[50px] pt-0.5">
                <div className="text-sm font-semibold text-foreground">{item.time.split(' ')[0]}</div>
                <div className="text-xs text-muted-foreground font-medium">{item.time.split(' ')[1]}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground mb-1">{item.title}</div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 ${item.color} rounded-full flex-shrink-0`}></div>
                  <span className="text-xs text-muted-foreground">{item.team}</span>
                </div>
              </div>
            </li>
            ))}
          </ul>
        </Card>

        {/* Agent Status Widget */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-foreground">Agent status</h3>
            <button className="flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
          <ul className="space-y-3">
            {agentStatusItems.map((agent) => (
            <li key={agent.id} className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 ${agent.statusColor} rounded-full flex-shrink-0`}></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground">{agent.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{agent.model}</div>
              </div>
              <div className={`px-2 py-0.5 text-xs rounded-full font-medium flex-shrink-0 ${
                agent.status === 'Active' 
                  ? 'bg-green-50 text-green-600' 
                  : 'bg-gray-100 text-gray-600'
              }`}>{agent.status}</div>
            </li>
            ))}
          </ul>
        </Card>

        {/* Quick Actions Widget */}
        <Card className="lg:col-span-2 xl:col-span-1 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-foreground">Quick actions</h3>
            <button className="flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActionsItems.map((action) => (
            <button key={action.id} className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors group">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-2 group-hover:bg-blue-50 transition-colors">
                {action.icon}
              </div>
              <span className="text-sm font-medium text-foreground">{action.label}</span>
            </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
