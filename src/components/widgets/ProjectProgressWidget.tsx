import React from 'react';
import { MoreHorizontal, GripVertical } from 'lucide-react';

interface Milestone {
  id: string;
  title: string;
  date: string;
  completed: boolean;
}

interface ProjectProgressWidgetProps {
  title: string;
  percentage: number;
  milestones: Milestone[];
}

export function ProjectProgressWidget({ title, percentage, milestones }: ProjectProgressWidgetProps) {
  return (
    <div className="widget">
      <div className="widget-drag-handle">
        <GripVertical />
      </div>
      
      <div className="widget-header">
        <h3 className="widget-title">{title}</h3>
        <div className="widget-action">
          <MoreHorizontal />
        </div>
      </div>

      <div className="project-progress">
        <div className="progress-header">
          <div className="progress-title">{title}</div>
          <div className="progress-percentage">{percentage}% complete</div>
        </div>
        
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>

        <div className="milestone-list">
          {milestones.map((milestone) => (
            <div key={milestone.id} className="milestone">
              <div className={`milestone-status ${milestone.completed ? 'completed' : 'pending'}`}></div>
              <div className="milestone-content">
                <div className="milestone-title">{milestone.title}</div>
              </div>
              <div className="milestone-date">{milestone.date}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
