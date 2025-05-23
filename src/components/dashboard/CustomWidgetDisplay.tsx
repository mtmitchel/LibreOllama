
import DashboardCard from "./DashboardCard";
import type { DashboardWidgetConfig } from "@/lib/types";

interface CustomWidgetDisplayProps {
  widgetConfig: DashboardWidgetConfig;
}

export default function CustomWidgetDisplay({ widgetConfig }: CustomWidgetDisplayProps) {
  return (
    <DashboardCard title={widgetConfig.name} description={`Custom widget (${widgetConfig.customType?.toLowerCase() || 'generic'})`}>
      <div className="p-4 border border-dashed rounded-md bg-muted/50 min-h-[100px] flex items-center justify-center">
        <p className="text-sm text-muted-foreground text-center">
          {widgetConfig.content || "Custom widget content would appear here."}
        </p>
      </div>
    </DashboardCard>
  );
}
