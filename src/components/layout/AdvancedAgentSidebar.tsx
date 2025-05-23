
"use client";
import { useState, useEffect } from "react";
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Cpu, Workflow, Settings2, Info, PanelLeftClose, PanelRightOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdvancedAgentSidebar() {
  const [isClient, setIsClient] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false); // Default to closed for SSR

  useEffect(() => {
    setIsClient(true);
    setIsPanelOpen(true); // Open by default after mount
  }, []);

  // Static collapsed sidebar for SSR and initial client render
  if (!isClient) {
    return (
      <aside className="bg-card border-l border-border flex-col gap-6 hidden lg:flex sticky top-0 h-screen overflow-y-auto transition-all duration-300 ease-in-out w-16 p-3">
        <div className="flex items-center pb-2 border-b mb-2 justify-center w-full">
          {/* Static placeholder for the button area - NOT the interactive Button component */}
          <div className="h-8 w-8 shrink-0 flex items-center justify-center text-muted-foreground" aria-label="Expand panel">
            <PanelRightOpen size={20} />
          </div>
        </div>
        {/* No cards are rendered in the static collapsed state */}
      </aside>
    );
  }

  // Interactive sidebar after mount
  return (
    <aside className={cn(
      "bg-card border-l border-border flex-col gap-6 hidden lg:flex sticky top-0 h-screen overflow-y-auto transition-all duration-300 ease-in-out",
      isPanelOpen ? "w-80 p-4" : "w-16 p-3"
    )}>
      <div className={cn(
        "flex items-center pb-2 border-b mb-2 w-full",
        isPanelOpen ? "justify-between" : "justify-center"
      )}>
        {isPanelOpen ? (
          <>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Features panel
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsPanelOpen(false)}
              className="h-8 w-8 shrink-0"
              aria-label="Collapse panel"
            >
              <PanelLeftClose size={20} />
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPanelOpen(true)}
            className="h-8 w-8 shrink-0"
            aria-label="Expand panel"
          >
            <PanelRightOpen size={20} />
          </Button>
        )}
      </div>

      {isPanelOpen && (
        <>
          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-md flex items-center gap-2">
                <Cpu className="h-5 w-5 text-primary" />
                Advanced agent builder
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm mb-3">
                Create and customize powerful AI agents with an improved, user-friendly, robust, and intuitive agent builder.
              </CardDescription>
              <Link
                href="/agents"
                className={cn(
                  buttonVariants({ size: 'sm' }), // Apply button styles
                  "w-full"
                )}
              >
                Build agents
              </Link>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-md flex items-center gap-2">
                <Workflow className="h-5 w-5 text-primary" />
                n8n workflow integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm mb-3">
                Integrate and easily monitor n8n agentic workflows, extending the capabilities of your AI agents.
              </CardDescription>
              <Link
                href="/n8n"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                  "w-full"
                )}
              >
                Connect n8n
              </Link>
            </CardContent>
          </Card>

          <Card className="shadow-md mt-auto bg-accent/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-md flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-muted-foreground" />
                Panel configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Customize options for this feature panel.</p>
              <Button variant="link" size="sm" className="px-0 h-auto mt-1">Learn more</Button>
            </CardContent>
          </Card>
        </>
      )}
    </aside>
  );
}
