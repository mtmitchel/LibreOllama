import React from 'react';
import { OnboardingStep } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Check, Circle } from 'lucide-react';

interface OnboardingProgressProps {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  progressPercentage: number;
  className?: string;
}

const stepOrder: OnboardingStep[] = ['welcome', 'ollama-setup', 'interactive-tour', 'sample-data', 'completion'];

const stepLabels: Record<OnboardingStep, string> = {
  welcome: 'Welcome',
  'ollama-setup': 'Setup',
  'interactive-tour': 'Tour',
  'sample-data': 'Sample Data',
  completion: 'Complete',
};

export function OnboardingProgress({ 
  currentStep, 
  completedSteps, 
  progressPercentage,
  className 
}: OnboardingProgressProps) {
  const currentStepIndex = stepOrder.indexOf(currentStep);

  return (
    <div className={cn("w-full", className)}>
      {/* Progress Bar */}
      <div className="relative mb-8">
        <div className="w-full bg-gray-200 rounded-full h-2.5 shadow-inner">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full transition-all duration-500 ease-out shadow-sm"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="absolute -top-6 right-0 text-xs text-gray-500 font-medium bg-white px-2 py-1 rounded shadow-sm">
          {progressPercentage}%
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between relative">
        {stepOrder.map((step, index) => {
          const isCompleted = completedSteps.includes(step);
          const isCurrent = step === currentStep;
          const isPast = index < currentStepIndex;
          const isFuture = index > currentStepIndex;

          return (
            <div key={step} className="flex flex-col items-center relative z-10">
              {/* Step Circle */}
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm",
                isCompleted || isPast
                  ? "bg-green-500 text-white shadow-green-200"
                  : isCurrent
                  ? "bg-blue-500 text-white ring-4 ring-blue-100 shadow-blue-200"
                  : "bg-gray-200 text-gray-400"
              )}>
                {isCompleted || isPast ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Circle className={cn(
                    "w-4 h-4",
                    isCurrent ? "fill-current" : ""
                  )} />
                )}
              </div>

              {/* Step Label */}
              <div className={cn(
                "mt-3 text-sm font-medium transition-colors text-center px-2",
                isCompleted || isPast
                  ? "text-green-600"
                  : isCurrent
                  ? "text-blue-600"
                  : "text-gray-400"
              )}>
                {stepLabels[step]}
              </div>

              {/* Connection Line */}
              {index < stepOrder.length - 1 && (
                <div className={cn(
                  "absolute top-5 h-0.5 transition-colors duration-300 z-0",
                  "hidden sm:block", // Hide on mobile
                  isPast || (isCurrent && index < currentStepIndex)
                    ? "bg-green-500"
                    : "bg-gray-200"
                )}
                style={{
                  left: `${((index + 0.5) / stepOrder.length) * 100}%`,
                  width: `${(1 / stepOrder.length) * 100}%`,
                  transform: 'translateX(-50%)',
                }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile Progress Dots */}
      <div className="flex justify-center mt-6 sm:hidden">
        {stepOrder.map((step, index) => {
          const isCompleted = completedSteps.includes(step);
          const isCurrent = step === currentStep;
          const isPast = index < currentStepIndex;

          return (
            <div
              key={step}
              className={cn(
                "w-3 h-3 rounded-full mx-1.5 transition-all duration-300 shadow-sm",
                isCompleted || isPast
                  ? "bg-green-500 shadow-green-200"
                  : isCurrent
                  ? "bg-blue-500 shadow-blue-200 ring-2 ring-blue-100"
                  : "bg-gray-300"
              )}
            />
          );
        })}
      </div>
    </div>
  );
}