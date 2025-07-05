import React from 'react';
import { Card, Progress, Heading, Text, Caption } from "../../../components/ui";
import { MoreHorizontal } from "lucide-react";
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
      <div className="flex justify-between items-center mb-4">
        <Heading level={3}>{title}</Heading>
        <Text variant="body" size="sm" weight="medium" className="bg-accent-soft text-accent-primary px-3 py-1 rounded-xl">
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
            <div className="flex-1 min-w-0">
              <Text variant="body" size="sm" weight="medium" className="truncate">{item.text}</Text>
            </div>
            <Text as="div" size="sm" variant="secondary" className="flex-shrink-0">{item.date}</Text>
          </li>
        ))}
      </ul>
    </Card>
  );
};
