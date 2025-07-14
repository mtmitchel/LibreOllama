import React from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { Text } from './index';

export interface StepperStep {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  optional?: boolean;
}

interface StepperProps {
  steps: StepperStep[];
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'timeline';
  className?: string;
  onStepClick?: (stepId: string) => void;
}

export function Stepper({
  steps,
  orientation = 'horizontal',
  variant = 'default',
  className = '',
  onStepClick
}: StepperProps) {
  const isVertical = orientation === 'vertical';
  const isTimeline = variant === 'timeline';

  const getStepIcon = (step: StepperStep, index: number) => {
    switch (step.status) {
      case 'completed':
        return (
          <div className="flex size-8 items-center justify-center rounded-full bg-success">
            <Check size={16} className="text-white" />
          </div>
        );
      case 'active':
        return (
          <div className="flex size-8 items-center justify-center rounded-full bg-accent-primary">
            <span className="text-sm font-semibold text-white">{index + 1}</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex size-8 items-center justify-center rounded-full bg-error">
            <span className="text-sm font-semibold text-white">!</span>
          </div>
        );
      default:
        return (
          <div className="border-tertiary flex size-8 items-center justify-center rounded-full border-2 bg-surface">
            <span className="text-sm font-semibold text-secondary">{index + 1}</span>
          </div>
        );
    }
  };

  const getStepTextColor = (status: StepperStep['status']) => {
    switch (status) {
      case 'completed':
        return 'text-success';
      case 'active':
        return 'text-primary';
      case 'error':
        return 'text-error';
      default:
        return 'text-secondary';
    }
  };

  const getConnectorColor = (currentStep: StepperStep, nextStep?: StepperStep) => {
    if (currentStep.status === 'completed') {
      return 'bg-success';
    }
    if (currentStep.status === 'active' && nextStep?.status === 'pending') {
      return 'bg-tertiary';
    }
    return 'bg-tertiary';
  };

  if (isVertical) {
    return (
      <div className={`flex flex-col ${className}`}>
        {steps.map((step, index) => (
          <div key={step.id} className="flex">
            {/* Icon Column */}
            <div className="mr-4 flex flex-col items-center">
              <button
                onClick={() => onStepClick?.(step.id)}
                className={`transition-all duration-200 ${
                  onStepClick ? 'cursor-pointer motion-safe:hover:scale-110' : 'cursor-default'
                }`}
                disabled={!onStepClick}
              >
                {getStepIcon(step, index)}
              </button>
              {index < steps.length - 1 && (
                <div
                  className={`mt-2 h-12 w-0.5 transition-colors duration-300 ${getConnectorColor(
                    step,
                    steps[index + 1]
                  )}`}
                />
              )}
            </div>

            {/* Content Column */}
            <div className="flex-1 pb-8">
              <div className="mb-1 flex items-center gap-2">
                <Text
                  size="sm"
                  weight="semibold"
                  className={`transition-colors duration-200 ${getStepTextColor(step.status)}`}
                >
                  {step.title}
                </Text>
                {step.optional && (
                  <Text size="xs" variant="tertiary" className="rounded-full bg-tertiary px-2 py-0.5">
                    Optional
                  </Text>
                )}
              </div>
              {step.description && (
                <Text size="xs" variant="secondary" className="leading-relaxed">
                  {step.description}
                </Text>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Horizontal layout
  return (
    <div className={`flex items-center ${className}`}>
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center">
            <button
              onClick={() => onStepClick?.(step.id)}
              className={`mb-2 transition-all duration-200 ${
                onStepClick ? 'cursor-pointer motion-safe:hover:scale-110' : 'cursor-default'
              }`}
              disabled={!onStepClick}
            >
              {getStepIcon(step, index)}
            </button>
            <div className="max-w-24 text-center">
              <Text
                size="xs"
                weight="medium"
                className={`transition-colors duration-200 ${getStepTextColor(step.status)} mb-1`}
              >
                {step.title}
              </Text>
              {step.optional && (
                <Text size="xs" variant="tertiary">
                  Optional
                </Text>
              )}
            </div>
          </div>

          {index < steps.length - 1 && (
            <div className="mx-4 mb-8 flex items-center">
              {isTimeline ? (
                <div
                  className={`h-0.5 w-12 transition-colors duration-300 ${getConnectorColor(
                    step,
                    steps[index + 1]
                  )}`}
                />
              ) : (
                <ChevronRight size={16} className="text-tertiary" />
              )}
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
} 