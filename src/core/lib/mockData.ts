import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

export interface Task {
  id: string;
  icon: React.ReactNode;
  text: string;
  date: string;
}

export interface FocusItem {
  id: string;
  time: string;
  title: string;
  team: string;
  color: string;
}

export interface AgentStatus {
  id: string;
  name: string;
  model: string;
  status: 'Active' | 'Offline';
  statusColor: string;
  textColor: string;
}

export interface QuickAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

export const migrationSprintTasks: Task[] = [
  { 
    id: 'task1', 
    icon: React.createElement(CheckCircle2, { className: "w-4 h-4 text-success flex-shrink-0" }), 
    text: "Component library setup", 
    date: "Dec 18" 
  },
  { 
    id: 'task2', 
    icon: React.createElement(CheckCircle2, { className: "w-4 h-4 text-success flex-shrink-0" }), 
    text: "Dashboard redesign", 
    date: "Dec 20" 
  },
  { 
    id: 'task3', 
    icon: React.createElement(Circle, { className: "w-4 h-4 text-text-secondary stroke-2 flex-shrink-0" }), 
    text: "Chat interface migration", 
    date: "Dec 25" 
  }
];

export const todaysFocusItems: FocusItem[] = [
  { 
    id: 'focus1', 
    time: "9:00 AM", 
    title: "Design review", 
    team: "UI migration team", 
    color: "bg-primary" 
  },
  { 
    id: 'focus2', 
    time: "2:30 PM", 
    title: "Code review session", 
    team: "Development team", 
    color: "bg-success" 
  }
];

export const agentStatusItems: AgentStatus[] = [
  { 
    id: 'agent1', 
    name: "General assistant", 
    model: "Llama 3.1 70B", 
    status: "Active", 
    statusColor: "bg-success", 
    textColor: "text-success" 
  },
  { 
    id: 'agent2', 
    name: "Research helper", 
    model: "Mixtral 8x7B", 
    status: "Offline", 
    statusColor: "bg-text-tertiary", 
    textColor: "text-text-secondary" 
  }
];
