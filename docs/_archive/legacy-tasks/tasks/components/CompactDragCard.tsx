import React from 'react';
import { Card } from '../../../components/ui';
import type { HierarchicalTask } from '../types';

interface CompactDragCardProps {
  task: HierarchicalTask;
}

const CompactDragCard = React.memo(({ task }: CompactDragCardProps) => {
  return (
    <Card 
      className="p-3 border-2 border-dashed border-primary bg-primary-ghost shadow-lg rounded-lg"
      style={{
        opacity: 0.9,
        transform: 'rotate(3deg)', // Slight tilt for visual distinction
      }}
    >
      <p className="text-sm font-medium text-primary truncate">
        {task.title}
      </p>
    </Card>
  );
});

CompactDragCard.displayName = 'CompactDragCard';

export { CompactDragCard }; 