
import { CalendarDays } from "lucide-react";
import DashboardCard from "./DashboardCard";
import { Badge } from "@/components/ui/badge";

export default function CalendarOverview() {
  // Mock data
  const events = [
    { id: 1, time: "10:00 AM", title: "Team sync", type: "meeting" },
    { id: 2, time: "02:30 PM", title: "Client call", type: "call" },
    { id: 3, time: "Tomorrow", title: "Project deadline", type: "deadline" },
  ];

  return (
    <DashboardCard title="Upcoming events" icon={CalendarDays} description="What's on your schedule.">
      <ul className="space-y-3">
        {events.map((event) => (
          <li key={event.id} className="flex items-start justify-between">
            <div>
              <p className="font-medium">{event.title}</p>
              <p className="text-xs text-muted-foreground">{event.time}</p>
            </div>
            <Badge variant={event.type === 'deadline' ? 'destructive' : 'secondary'} className="capitalize">{event.type}</Badge>
          </li>
        ))}
        {events.length === 0 && <p className="text-sm text-muted-foreground">No upcoming events.</p>}
      </ul>
    </DashboardCard>
  );
}
