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

export const migrationSprintTasks: Task[] = [];

export const todaysFocusItems: FocusItem[] = [];

export const agentStatusItems: AgentStatus[] = [];
