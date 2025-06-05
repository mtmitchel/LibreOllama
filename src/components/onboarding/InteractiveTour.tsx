import React, { useState } from 'react';
import { useOnboarding } from '@/hooks/use-onboarding';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  MessageSquare, 
  Link, 
  Command, 
  CheckCircle,
  ArrowRight,
  Sparkles,
  Target,
  Zap
} from 'lucide-react';

interface InteractiveTourProps {
  onNext: () => void;
  onPrevious: () => void;
}

interface TourStep {
  id: keyof typeof tourSteps;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: string;
  completed: boolean;
}

const tourSteps = {
  noteCreated: 'Create your first note',
  aiAsked: 'Ask AI a question',
  linkingDemonstrated: 'Create a bidirectional link',
  commandPaletteUsed: 'Use the command palette'
} as const;

export function InteractiveTour({ onNext, onPrevious }: InteractiveTourProps) {
  const { state, updateTourProgress } = useOnboarding();
  const [currentDemo, setCurrentDemo] = useState<string | null>(null);

  const steps: TourStep[] = [
    {
      id: 'noteCreated',
      title: 'Create Your First Note',
      description: 'Learn how to capture thoughts and ideas in LibreOllama',
      icon: FileText,
      action: 'Create a note about your goals for using LibreOllama',
      completed: state.tourProgress.noteCreated
    },
    {
      id: 'aiAsked',
      title: 'Ask AI for Help',
      description: 'Experience the power of local AI assistance',
      icon: MessageSquare,
      action: 'Ask AI to help you organize your thoughts or brainstorm ideas',
      completed: state.tourProgress.aiAsked
    },
    {
      id: 'linkingDemonstrated',
      title: 'Connect Your Ideas',
      description: 'Create bidirectional links between related content',
      icon: Link,
      action: 'Link your note to a related concept or create a new linked note',
      completed: state.tourProgress.linkingDemonstrated
    },
    {
      id: 'commandPaletteUsed',
      title: 'Master Quick Actions',
      description: 'Use the command palette for lightning-fast navigation',
      icon: Command,
      action: 'Press Ctrl+K (or Cmd+K) to open the command palette and try a command',
      completed: state.tourProgress.commandPaletteUsed
    }
  ];

  const handleStepComplete = (stepId: keyof typeof tourSteps) => {
    updateTourProgress({ [stepId]: true });
  };

  const handleDemo = (stepId: string) => {
    setCurrentDemo(stepId);
    // Simulate completing the step after demo
    setTimeout(() => {
      handleStepComplete(stepId as keyof typeof tourSteps);
      setCurrentDemo(null);
    }, 2000);
  };

  const allStepsCompleted = Object.values(state.tourProgress).every(Boolean);
  const completedCount = Object.values(state.tourProgress).filter(Boolean).length;

  return (
    <div className="px-8 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Learn by Doing
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Let's take a quick interactive tour to get you familiar with LibreOllama's 
            core features. Each step builds on the previous one.
          </p>
        </div>

        {/* Progress Overview */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Tour Progress
            </h3>
            <div className="text-sm text-gray-600">
              {completedCount} of {steps.length} completed
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / steps.length) * 100}%` }}
            />
          </div>

          {allStepsCompleted && (
            <div className="flex items-center space-x-2 text-green-700 bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Congratulations! You've completed the tour.</span>
            </div>
          )}
        </div>

        {/* Tour Steps */}
        <div className="space-y-6 mb-8">
          {steps.map((step, index) => {
            const isActive = !step.completed && (index === 0 || steps[index - 1]?.completed);
            const isDemo = currentDemo === step.id;

            return (
              <div
                key={step.id}
                className={cn(
                  "border-2 rounded-xl p-6 transition-all duration-300",
                  step.completed
                    ? "border-green-200 bg-green-50"
                    : isActive
                    ? "border-purple-200 bg-purple-50 shadow-md"
                    : "border-gray-200 bg-gray-50"
                )}
              >
                <div className="flex items-start space-x-4">
                  {/* Step Icon */}
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                    step.completed
                      ? "bg-green-500"
                      : isActive
                      ? "bg-purple-500"
                      : "bg-gray-300"
                  )}>
                    {step.completed ? (
                      <CheckCircle className="w-6 h-6 text-white" />
                    ) : (
                      <step.icon className="w-6 h-6 text-white" />
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={cn(
                        "text-lg font-semibold",
                        step.completed
                          ? "text-green-900"
                          : isActive
                          ? "text-purple-900"
                          : "text-gray-500"
                      )}>
                        Step {index + 1}: {step.title}
                      </h3>
                      
                      {step.completed && (
                        <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-700 rounded-full">
                          Completed
                        </span>
                      )}
                    </div>

                    <p className={cn(
                      "text-sm mb-4",
                      step.completed
                        ? "text-green-700"
                        : isActive
                        ? "text-purple-700"
                        : "text-gray-500"
                    )}>
                      {step.description}
                    </p>

                    <div className={cn(
                      "p-4 rounded-lg border-l-4 mb-4",
                      step.completed
                        ? "bg-green-100 border-green-400"
                        : isActive
                        ? "bg-purple-100 border-purple-400"
                        : "bg-gray-100 border-gray-300"
                    )}>
                      <p className={cn(
                        "text-sm font-medium",
                        step.completed
                          ? "text-green-800"
                          : isActive
                          ? "text-purple-800"
                          : "text-gray-600"
                      )}>
                        Action: {step.action}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    {isActive && !step.completed && (
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleDemo(step.id)}
                          disabled={isDemo}
                          className={cn(
                            "px-4 py-2 text-sm font-medium rounded-lg transition-all",
                            isDemo
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : "bg-purple-600 text-white hover:bg-purple-700"
                          )}
                        >
                          {isDemo ? (
                            <>
                              <Sparkles className="w-4 h-4 mr-2 animate-pulse inline" />
                              Demonstrating...
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 mr-2 inline" />
                              Try This Step
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={() => handleStepComplete(step.id)}
                          className="px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
                        >
                          Mark as Complete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ADHD-Friendly Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
            <Sparkles className="w-5 h-5 mr-2" />
            ADHD-Friendly Tips
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Focus Features</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Use Focus Mode (Ctrl+.) to minimize distractions</li>
                <li>• Command palette (Ctrl+K) for quick actions</li>
                <li>• Visual progress indicators keep you motivated</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Organization</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Bidirectional links connect related thoughts</li>
                <li>• Tags help categorize and find content</li>
                <li>• AI assists with organization and planning</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Next Steps Preview */}
        {allStepsCompleted && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Great Job! You're Ready to Go
            </h3>
            <p className="text-gray-600 mb-4">
              You've learned the core features of LibreOllama. Next, we can optionally 
              set up some sample content to help you get started.
            </p>
            <button
              onClick={onNext}
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
            >
              Continue to Sample Data
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}