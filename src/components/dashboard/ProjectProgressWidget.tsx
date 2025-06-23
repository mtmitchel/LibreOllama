import React from 'react';
import { Card } from '../../shared/ui';
import { Task } from '../../lib/mockData';

interface ProjectProgressWidgetProps {
  title: string;
  percentage: number;
  tasks: Task[];
}

export const ProjectProgressWidget: React.FC<ProjectProgressWidgetProps> = ({ 
  title, 
  percentage, 
  tasks 
}) => {
  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        <span className="text-sm font-medium text-primary bg-accent-soft px-3 py-1 rounded-full">
          {percentage}% complete
        </span>
      </div>
      <div className="mb-4">
        <div className="w-full bg-bg-secondary rounded-full h-2.5">
          <div 
            className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out" 
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <ul className="space-y-3">
        {tasks.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            {item.icon}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text-primary truncate">{item.text}</div>
            </div>
            <div className="text-xs text-text-secondary flex-shrink-0">{item.date}</div>
          </li>
        ))}
      </ul>
    </Card>
  );
};
