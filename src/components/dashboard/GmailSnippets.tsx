
import { Mail } from "lucide-react";
import DashboardCard from "./DashboardCard";

export default function GmailSnippets() {
  // Mock data
  const emails = [
    { id: 1, sender: "Alice B.", subject: "Project update", snippet: "Just a quick update on the project status..." },
    { id: 2, sender: "Bob C.", subject: "Meeting reminder", snippet: "Friendly reminder about our meeting tomorrow at 10 AM..." },
    { id: 3, sender: "Newsletter", subject: "Weekly digest", snippet: "Here's your weekly news roundup..." },
  ];

  return (
    <DashboardCard title="Recent emails" icon={Mail} description="Quick glance at your inbox.">
      <div className="space-y-3">
        {emails.map((email) => (
          <div key={email.id} className="p-3 rounded-md border bg-accent/50 hover:bg-accent/80 transition-colors">
            <p className="text-sm font-medium">{email.sender}</p>
            <p className="text-sm truncate">{email.subject}</p>
            <p className="text-xs text-muted-foreground truncate">{email.snippet}</p>
          </div>
        ))}
        {emails.length === 0 && <p className="text-sm text-muted-foreground">No recent emails to show.</p>}
      </div>
    </DashboardCard>
  );
}
