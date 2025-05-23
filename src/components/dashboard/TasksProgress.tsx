
import { CheckSquare, ListTodo } from "lucide-react";
import DashboardCard from "./DashboardCard";
import { Progress } from "@/components/ui/progress";

export default function TasksProgress() {
  // Mock data
  const tasks = [
    { id: 1, name: "Design new homepage", completed: true, total: 5, current: 5 },
    { id: 2, name: "Develop Ollama integration", completed: false, total: 10, current: 3 },
    { id: 3, name: "Write documentation", completed: false, total: 8, current: 1 },
  ];
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const overallProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <DashboardCard title="Tasks progress" icon={ListTodo} description={`${completedTasks} of ${totalTasks} main tasks completed.`}>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Overall progress</span>
            <span className="text-sm font-medium">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} aria-label="Overall task progress" />
        </div>
        {tasks.map((task) => (
          <div key={task.id} className="text-sm">
            <div className="flex items-center justify-between">
              <span className={task.completed ? "line-through text-muted-foreground" : ""}>
                {task.name}
              </span>
              <span className="text-xs text-muted-foreground">{task.current}/{task.total} steps</span>
            </div>
            <Progress value={(task.current/task.total)*100} className="h-2 mt-1" />
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
