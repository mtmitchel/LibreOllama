
"use client";

import { useState, useEffect } from 'react';
import TasksProgress from "@/components/dashboard/TasksProgress";
import CalendarOverview from "@/components/dashboard/CalendarOverview";
import GmailSnippets from "@/components/dashboard/GmailSnippets";
import TimeBlockingInterface from "@/components/dashboard/TimeBlockingInterface";
import CustomWidgetDisplay from "@/components/dashboard/CustomWidgetDisplay";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Settings2, PlusCircle, X } from 'lucide-react'; // Added X
import CustomWidgetModal from '@/components/dashboard/CustomWidgetModal';
import type { DashboardWidgetConfig } from '@/lib/types';

const predefinedWidgets: DashboardWidgetConfig[] = [
  { id: 'tasksProgress', name: 'Tasks progress', component: TasksProgress, isVisible: true, isFullWidth: false, type: 'predefined' },
  { id: 'calendarOverview', name: 'Calendar overview', component: CalendarOverview, isVisible: true, isFullWidth: false, type: 'predefined' },
  { id: 'gmailSnippets', name: 'Gmail snippets', component: GmailSnippets, isVisible: true, isFullWidth: false, type: 'predefined' },
  { id: 'timeBlocking', name: 'Time blocking interface', component: TimeBlockingInterface, isVisible: true, isFullWidth: true, type: 'predefined' },
];

const WELCOME_CARD_DISMISSED_KEY = 'dashboardWelcomeCardDismissed_v1';

export default function DashboardPage() {
  const [isCustomizeMode, setIsCustomizeMode] = useState(false);
  const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>(predefinedWidgets);
  const [isCustomWidgetModalOpen, setIsCustomWidgetModalOpen] = useState(false);
  const [isWelcomeCardVisible, setIsWelcomeCardVisible] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem(WELCOME_CARD_DISMISSED_KEY);
    if (dismissed === 'true') {
      setIsWelcomeCardVisible(false);
    }
  }, []);

  const handleDismissWelcomeCard = () => {
    setIsWelcomeCardVisible(false);
    localStorage.setItem(WELCOME_CARD_DISMISSED_KEY, 'true');
  };

  const toggleWidgetVisibility = (widgetId: string) => {
    setWidgets(prevWidgets =>
      prevWidgets.map(widget =>
        widget.id === widgetId ? { ...widget, isVisible: !widget.isVisible } : widget
      )
    );
  };
  
  const handleAddCustomWidget = (widgetName: string, widgetType: string) => {
    const newWidget: DashboardWidgetConfig = {
      id: `custom-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: widgetName,
      component: CustomWidgetDisplay,
      isVisible: true,
      isFullWidth: false,
      type: 'custom',
      customType: widgetType,
      content: `This is a ${widgetType} custom widget named "${widgetName}". Content would go here.`,
    };
    setWidgets(prevWidgets => [...prevWidgets, newWidget]);
  };

  const gridWidgets = widgets.filter(w => !w.isFullWidth);
  const fullWidthWidgets = widgets.filter(w => w.isFullWidth);

  return (
    <>
      <div className="flex flex-col gap-6">
        {isWelcomeCardVisible && (
          <Card>
            <CardHeader className="flex-row items-start justify-between">
              <div>
                <CardTitle>Welcome to LibreOllama dashboard!</CardTitle>
                <CardDescription>Your intelligent productivity hub.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setIsCustomizeMode(!isCustomizeMode)}>
                  <Settings2 className="mr-2 h-4 w-4" />
                  {isCustomizeMode ? "Done customizing" : "Customize dashboard"}
                </Button>
                <Button variant="ghost" size="icon" onClick={handleDismissWelcomeCard} className="h-8 w-8" aria-label="Dismiss welcome card">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p>This is your central place to manage chats, notes, tasks, and more, all powered by local Ollama models and integrated with your favorite Google services.</p>
              {isCustomizeMode && (
                <div className="mt-4 p-4 border-t border-dashed">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold">Customize widgets</h3>
                    <Button size="sm" onClick={() => setIsCustomWidgetModalOpen(true)}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Create custom widget
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {[...predefinedWidgets, ...widgets.filter(w => w.type === 'custom')].map(widgetDef => {
                       const currentWidgetState = widgets.find(w => w.id === widgetDef.id);
                       return (
                          <div key={`toggle-${widgetDef.id}`} className="flex items-center space-x-2 p-2 border rounded-md bg-muted/50">
                          <Checkbox
                              id={`widget-toggle-${widgetDef.id}`}
                              checked={currentWidgetState?.isVisible || false}
                              onCheckedChange={() => toggleWidgetVisibility(widgetDef.id)}
                          />
                          <Label htmlFor={`widget-toggle-${widgetDef.id}`} className="text-sm font-medium">
                              Show {widgetDef.name} {widgetDef.type === 'custom' && '(custom)'}
                          </Label>
                          </div>
                       );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!isWelcomeCardVisible && !isCustomizeMode && (
           <div className="flex justify-end">
             <Button variant="outline" onClick={() => setIsCustomizeMode(!isCustomizeMode)}>
              <Settings2 className="mr-2 h-4 w-4" />
              {isCustomizeMode ? "Done customizing" : "Customize dashboard"}
            </Button>
           </div>
        )}
        
        {isCustomizeMode && !isWelcomeCardVisible && (
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <CardTitle>Customize dashboard</CardTitle>
                    <Button variant="outline" onClick={() => setIsCustomizeMode(false)}>
                        Done customizing
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="p-4">
                        <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold">Widgets</h3>
                        <Button size="sm" onClick={() => setIsCustomWidgetModalOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Create custom widget
                        </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {[...predefinedWidgets, ...widgets.filter(w => w.type === 'custom')].map(widgetDef => {
                            const currentWidgetState = widgets.find(w => w.id === widgetDef.id);
                            return (
                                <div key={`toggle-${widgetDef.id}`} className="flex items-center space-x-2 p-2 border rounded-md bg-muted/50">
                                <Checkbox
                                    id={`widget-toggle-${widgetDef.id}-alt`}
                                    checked={currentWidgetState?.isVisible || false}
                                    onCheckedChange={() => toggleWidgetVisibility(widgetDef.id)}
                                />
                                <Label htmlFor={`widget-toggle-${widgetDef.id}-alt`} className="text-sm font-medium">
                                    Show {widgetDef.name} {widgetDef.type === 'custom' && '(custom)'}
                                </Label>
                                </div>
                            );
                        })}
                        </div>
                    </div>
                </CardContent>
            </Card>
        )}


        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {gridWidgets.map(widget => {
            const WidgetComponent = widget.component;
            if (widget.isVisible || isCustomizeMode) {
              return (
                <div key={widget.id} className={isCustomizeMode && !widget.isVisible ? 'opacity-50 relative' : 'relative'}>
                  {isCustomizeMode && (
                    <div className="absolute inset-0 bg-black/10 dark:bg-white/5 flex items-center justify-center rounded-lg z-10 text-xs text-background dark:text-foreground p-2">
                      {widget.isVisible ? `Visible (hide with checkbox above)` : `Hidden (show with checkbox above)`}
                    </div>
                  )}
                   <WidgetComponent widgetConfig={widget} /> 
                </div>
              );
            }
            return null;
          })}
        </div>
        
        {fullWidthWidgets.map(widget => {
          const WidgetComponent = widget.component;
          if (widget.isVisible || isCustomizeMode) {
            return (
              <div key={widget.id} className={isCustomizeMode && !widget.isVisible ? 'opacity-50 relative' : 'relative'}>
                {isCustomizeMode && (
                  <div className="absolute inset-0 bg-black/10 dark:bg-white/5 flex items-center justify-center rounded-lg z-10 text-xs text-background dark:text-foreground p-2">
                     {widget.isVisible ? `Visible (hide with checkbox above)` : `Hidden (show with checkbox above)`}
                  </div>
                )}
                 <WidgetComponent widgetConfig={widget} />
              </div>
            );
          }
          return null;
        })}
      </div>
      <CustomWidgetModal
        isOpen={isCustomWidgetModalOpen}
        onClose={() => setIsCustomWidgetModalOpen(false)}
        onSave={handleAddCustomWidget}
      />
    </>
  );
}
