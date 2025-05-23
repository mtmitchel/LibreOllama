
"use client";

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AgentBuilderForm from '@/components/agents/AgentBuilderForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AgentConfig } from '@/lib/types';
import { mockAgents } from '@/lib/mock-data'; // Import to find agent for editing

function AgentBuilderPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const agentId = searchParams.get('id');

  const initialAgentData = agentId ? mockAgents.find(agent => agent.id === agentId) : undefined;

  const handleSaveAgent = (savedAgent: AgentConfig) => {
    // For prototype: mockAgents array is mutated directly in AgentBuilderForm
    // or by a global state/context in a real app.
    // After saving, navigate back to the agents list.
    router.push('/agents');
  };

  const handleCancel = () => {
    router.push('/agents');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" onClick={handleCancel} className="h-9 w-9">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Cpu className="h-7 w-7 text-primary" />
                  {initialAgentData ? 'Edit AI agent' : 'Create new AI agent'}
                </CardTitle>
                <CardDescription>
                  {initialAgentData ? `Modifying: ${initialAgentData.name}` : 'Configure the details of your new AI agent.'}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>
      <AgentBuilderForm 
        initialData={initialAgentData} 
        onSave={handleSaveAgent} 
        onCancel={handleCancel} 
      />
    </div>
  );
}

export default function AgentBuilderPage() {
  return (
    <Suspense fallback={<div>Loading agent details...</div>}>
      <AgentBuilderPageContent />
    </Suspense>
  );
}
