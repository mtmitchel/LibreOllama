
import CalendarView from "@/components/calendar/CalendarView";
import { CalendarProvider } from "@/contexts/CalendarContext";

export default function CalendarPage() {
  return (
    <CalendarProvider>
      <div className="flex flex-col h-full overflow-hidden">
        {/* The CalendarView itself will now manage its internal layout including header, sidebars, etc. */}
        <CalendarView />
      </div>
    </CalendarProvider>
  );
}

