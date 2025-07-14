import React from 'react';
import { Card, Progress, Heading, Text } from "../../../components/ui";
import { Task } from "../../../core/lib/mockData";

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
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <Heading level={3}>{title}</Heading>
        <Text variant="body" size="sm" weight="medium" className="rounded-xl bg-accent-soft px-3 py-1 text-accent-primary">
          {percentage}% complete
        </Text>
      </div>
      <div className="mb-4">
        <Progress value={percentage} max={100} />
      </div>
      <ul className="flex flex-col gap-3">
        {tasks.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            {item.icon}
            <div className="min-w-0 flex-1">
              <Text variant="body" size="sm" weight="medium" className="truncate">{item.text}</Text>
            </div>
            <Text as="div" size="sm" variant="secondary" className="shrink-0">{item.date}</Text>
          </li>
        ))}
      </ul>
    </Card>
  );
};
