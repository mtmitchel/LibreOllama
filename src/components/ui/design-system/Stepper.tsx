import React from 'react';
import { Check, ChevronRight, AlertCircle, Clock } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Design System Stepper Component
 * 
 * DLS Compliant Stepper following Asana patterns
 * - Progressive step indication
 * - Multiple visual states (pending, active, completed, error)
 * - Horizontal and vertical orientations
 * - Timeline and default variants
 * - Optional steps with clear indicators
 * - Interactive clickable steps
 */

const stepperVariants = cva(
  'flex',
  {
    variants: {
      orientation: {
        horizontal: 'items-start',
        vertical: 'flex-col',
      },
    },
    defaultVariants: {
      orientation: 'horizontal',
    },
  }
);

const stepIconVariants = cva(
  `
    flex items-center justify-center
    w-8 h-8
    rounded-full
    font-semibold
    asana-text-sm
    transition-[var(--transition-property)]
    duration-[var(--transition-duration)]
    focus:outline-none
    focus:ring-2
    focus:ring-[var(--border-focus)]
    focus:ring-offset-2
  `,
  {
    variants: {
      status: {
        pending: `
          bg-[var(--bg-secondary)]
          border-2 border-[var(--border-default)]
          text-[color:var(--text-secondary)]
        `,
        active: `
          bg-[var(--brand-primary)]
          text-[color:var(--text-on-brand)]
          shadow-[var(--shadow-md)]
        `,
        completed: `
          bg-[var(--status-success)]
          text-[color:var(--text-on-brand)]
        `,
        error: `
          bg-[var(--status-error)]
          text-[color:var(--text-on-brand)]
        `,
      },
      interactive: {
        true: 'cursor-pointer hover:scale-110',
        false: 'cursor-default',
      },
    },
    defaultVariants: {
      status: 'pending',
      interactive: false,
    },
  }
);

const connectorVariants = cva(
  `
    transition-[var(--transition-property)]
    duration-[var(--transition-duration)]
  `,
  {
    variants: {
      orientation: {
        horizontal: 'h-0.5 w-12',
        vertical: 'w-0.5 h-12 mt-[var(--space-2)]',
      },
      status: {
        completed: 'bg-[var(--status-success)]',
        active: 'bg-[var(--brand-primary)]',
        pending: 'bg-[var(--border-default)]',
        error: 'bg-[var(--status-error)]',
      },
    },
    defaultVariants: {
      orientation: 'horizontal',
      status: 'pending',
    },
  }
);

export interface StepperStep {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  optional?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  subtitle?: string;
}

export interface StepperProps extends VariantProps<typeof stepperVariants> {
  steps: StepperStep[];
  variant?: 'default' | 'timeline' | 'compact';
  className?: string;
  onStepClick?: (stepId: string, step: StepperStep) => void;
  allowBackNavigation?: boolean;
  showConnectors?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  orientation = 'horizontal',
  variant = 'default',
  className = '',
  onStepClick,
  allowBackNavigation = false,
  showConnectors = true,
  size = 'md',
}) => {
  const isVertical = orientation === 'vertical';
  const isTimeline = variant === 'timeline';
  const isCompact = variant === 'compact';

  const getStepIcon = (step: StepperStep, index: number) => {
    // Custom icon takes precedence
    if (step.icon) {
      return (
        <div className="flex items-center justify-center text-current">
          {step.icon}
        </div>
      );
    }

    switch (step.status) {
      case 'completed':
        return <Check size={16} />;
      case 'active':
        return isTimeline ? <Clock size={16} /> : <span>{index + 1}</span>;
      case 'error':
        return <AlertCircle size={16} />;
      default:
        return <span>{index + 1}</span>;
    }
  };

  const getStepTextColor = (status: StepperStep['status']) => {
    switch (status) {
      case 'completed':
        return 'text-[color:var(--status-success)]';
      case 'active':
        return 'text-[var(--brand-primary)]';
      case 'error':
        return 'text-[color:var(--status-error)]';
      default:
        return 'text-[color:var(--text-secondary)]';
    }
  };

  const getConnectorStatus = (currentStep: StepperStep): 'completed' | 'active' | 'pending' | 'error' => {
    if (currentStep.status === 'completed') return 'completed';
    if (currentStep.status === 'active') return 'active';
    if (currentStep.status === 'error') return 'error';
    return 'pending';
  };

  const isStepClickable = (step: StepperStep, index: number) => {
    if (!onStepClick || step.disabled) return false;
    if (allowBackNavigation) return true;
    
    // Only allow clicking on current and completed steps
    return step.status === 'active' || step.status === 'completed';
  };

  const sizeClasses = {
    sm: 'asana-text-sm',
    md: 'asana-text-base',
    lg: 'asana-text-lg',
  } as const;

  if (isVertical) {
    return (
      <div className={stepperVariants({ orientation, className })}>
        {steps.map((step, index) => {
          const isClickable = isStepClickable(step, index);
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex w-full">
              {/* Icon Column */}
              <div className="mr-[var(--space-4)] flex flex-col items-center">
                <button
                  onClick={() => isClickable && onStepClick?.(step.id, step)}
                  className={stepIconVariants({
                    status: step.status,
                    interactive: isClickable,
                  })}
                  disabled={!isClickable}
                  aria-label={`Step ${index + 1}: ${step.title}`}
                  type="button"
                >
                  {getStepIcon(step, index)}
                </button>
                
                {showConnectors && !isLast && (
                  <div
                    className={connectorVariants({
                      orientation: 'vertical',
                      status: getConnectorStatus(step),
                    })}
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Content Column */}
              <div className={`flex-1 ${!isLast ? 'pb-[var(--space-6)]' : ''}`}>
                <div className="flex items-center gap-[var(--space-2)] mb-[var(--space-1)]">
                  <h3
                    className={`
                      font-medium
                      ${sizeClasses[size]}
                      ${getStepTextColor(step.status)}
                      transition-[var(--transition-property)]
                      duration-[var(--transition-duration)]
                    `}
                  >
                    {step.title}
                  </h3>
                  
                  {step.optional && (
                      <span
                        className={`
                          px-[var(--space-1-5)] py-[var(--space-0-5)]
                          asana-text-sm
                          text-[color:var(--text-muted)]
                          bg-[var(--bg-muted)]
                          rounded-[var(--radius-sm)]
                        `}
                      >
                      Optional
                    </span>
                  )}
                </div>

                {step.subtitle && !isCompact && (
                  <p className="asana-text-sm text-[color:var(--text-secondary)] mb-[var(--space-1)]">
                    {step.subtitle}
                  </p>
                )}

                {step.description && !isCompact && (
                  <p className="asana-text-sm text-[color:var(--text-secondary)] leading-relaxed">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Horizontal layout
  return (
    <div className={stepperVariants({ orientation, className })}>
      {steps.map((step, index) => {
        const isClickable = isStepClickable(step, index);
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center text-center">
              <button
                onClick={() => isClickable && onStepClick?.(step.id, step)}
                className={`
                  ${stepIconVariants({
                    status: step.status,
                    interactive: isClickable,
                  })}
                  mb-[var(--space-2)]
                `}
                disabled={!isClickable}
                aria-label={`Step ${index + 1}: ${step.title}`}
                type="button"
              >
                {getStepIcon(step, index)}
              </button>

              <div className={`max-w-24 ${isCompact ? 'max-w-16' : ''}`}>
                <h3
                  className={`
                    font-medium
                    ${isCompact ? 'asana-text-sm' : sizeClasses[size]}
                    ${getStepTextColor(step.status)}
                    transition-[var(--transition-property)]
                    duration-[var(--transition-duration)]
                    mb-[var(--space-1)]
                  `}
                >
                  {step.title}
                </h3>

                {step.optional && (
                  <span className="asana-text-sm text-[color:var(--text-muted)]">
                    Optional
                  </span>
                )}

                {step.subtitle && !isCompact && (
                  <p className="asana-text-sm text-[color:var(--text-secondary)] mt-[var(--space-1)]">
                    {step.subtitle}
                  </p>
                )}
              </div>
            </div>

            {showConnectors && !isLast && (
              <div className="mx-[var(--space-4)] mb-8 flex items-center">
                {isTimeline || variant === 'default' ? (
                  <div
                    className={connectorVariants({
                      orientation: 'horizontal',
                      status: getConnectorStatus(step),
                    })}
                    aria-hidden="true"
                  />
                ) : (
                  <ChevronRight 
                    size={16} 
                    className="text-[color:var(--text-muted)]" 
                    aria-hidden="true"
                  />
                )}
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/**
 * Step Progress Indicator - Simple linear progress
 */
export interface StepProgressProps {
  steps: StepperStep[];
  className?: string;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StepProgress: React.FC<StepProgressProps> = ({
  steps,
  className = '',
  showLabels = false,
  size = 'md',
}) => {
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const activeStepIndex = steps.findIndex(step => step.status === 'active');
  const progress = ((completedSteps + (activeStepIndex >= 0 ? 0.5 : 0)) / steps.length) * 100;

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={className}>
      {showLabels && (
        <div className="flex justify-between mb-[var(--space-2)]">
          <span className="asana-text-sm text-[color:var(--text-secondary)]">
            Step {Math.max(1, completedSteps + (activeStepIndex >= 0 ? 1 : 0))} of {steps.length}
          </span>
          <span className="asana-text-sm text-[color:var(--text-secondary)]">
            {Math.round(progress)}%
          </span>
        </div>
      )}
      
      <div
        className={`
          w-full
          ${sizeClasses[size]}
          bg-[var(--bg-secondary)]
          rounded-[var(--radius-sm)]
          overflow-hidden
        `}
      >
        <div
          className={`
            h-full
            bg-[var(--brand-primary)]
            transition-[var(--transition-property)]
            duration-[var(--transition-duration)]
            ease-out
          `}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Mini Stepper - Compact dot indicator
 */
export interface MiniStepperProps {
  steps: StepperStep[];
  className?: string;
  size?: 'sm' | 'md';
}

export const MiniStepper: React.FC<MiniStepperProps> = ({
  steps,
  className = '',
  size = 'md',
}) => {
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';

  return (
    <div className={`flex items-center gap-[var(--space-1)] ${className}`}>
      {steps.map((step, index) => (
        <div
          key={step.id}
          className={`
            ${dotSize}
            rounded-full
            transition-[var(--transition-property)]
            duration-[var(--transition-duration)]
            ${step.status === 'completed'
              ? 'bg-[var(--status-success)]'
              : step.status === 'active'
              ? 'bg-[var(--brand-primary)]'
              : step.status === 'error'
              ? 'bg-[var(--status-error)]'
              : 'bg-[var(--border-default)]'
            }
          `}
          aria-label={`Step ${index + 1}: ${step.status}`}
        />
      ))}
    </div>
  );
};