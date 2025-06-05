import React, { useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useOnboarding } from '@/hooks/use-onboarding';
import { WelcomeScreen } from './WelcomeScreen';
import { OllamaSetup } from './OllamaSetup';
import { InteractiveTour } from './InteractiveTour';
import { SampleDataSetup } from './SampleDataSetup';
import { OnboardingProgress } from './OnboardingProgress';
import { CompletionScreen } from './CompletionScreen';
import { cn } from '@/lib/utils';

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function OnboardingWizard({ isOpen, onClose, className }: OnboardingWizardProps) {
  const {
    state,
    getCurrentStepConfig,
    getProgressPercentage,
    nextStep,
    previousStep,
    skipStep,
    canSkipCurrentStep,
    completeOnboarding,
    isCurrentStepCompleted,
  } = useOnboarding();

  // Handle completion
  const handleComplete = () => {
    completeOnboarding();
    onClose();
  };

  // Handle step navigation
  const handleNext = () => {
    if (state.currentStep === 'completion') {
      handleComplete();
    } else {
      nextStep();
    }
  };

  const handleSkip = () => {
    if (canSkipCurrentStep()) {
      skipStep();
    }
  };

  // Handle modal close functionality
  const handleModalClose = () => {
    onClose();
  };

  // Add keyboard event handler for ESC key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleModalClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Render current step content
  const renderStepContent = () => {
    switch (state.currentStep) {
      case 'welcome':
        return <WelcomeScreen onNext={handleNext} />;
      case 'ollama-setup':
        return <OllamaSetup onNext={handleNext} onPrevious={previousStep} />;
      case 'interactive-tour':
        return <InteractiveTour onNext={handleNext} onPrevious={previousStep} />;
      case 'sample-data':
        return <SampleDataSetup onNext={handleNext} onPrevious={previousStep} onSkip={handleSkip} />;
      case 'completion':
        return <CompletionScreen onComplete={handleComplete} />;
      default:
        return <WelcomeScreen onNext={handleNext} />;
    }
  };

  const currentStepConfig = getCurrentStepConfig();
  const progressPercentage = getProgressPercentage();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleModalClose();
      }
    }}>
      <DialogContent
        className={cn(
          "w-[95vw] max-w-6xl h-[95vh] max-h-[900px] p-0 gap-0",
          "flex flex-col overflow-hidden",
          "sm:w-[90vw] md:w-[85vw] lg:w-[80vw] xl:max-w-5xl",
          className
        )}
        style={{
          backgroundColor: 'var(--v2-bg-primary)',
          border: '1px solid var(--v2-bg-tertiary)',
          fontFamily: 'var(--v2-font-sans)'
        }}
      >
        {/* Custom Close Button */}
        <button
          onClick={handleModalClose}
          className="absolute right-4 top-4 z-10 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 p-1"
          style={{
            backgroundColor: 'rgba(71, 85, 105, 0.8)',
            color: 'var(--v2-text-primary)',
            borderColor: 'var(--v2-bg-quaternary)'
          }}
          aria-label="Close onboarding"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {/* Progress Header */}
        <div
          className="flex-shrink-0 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b"
          style={{
            background: `linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(59, 130, 246, 0.1))`,
            borderColor: 'var(--v2-bg-tertiary)',
            fontFamily: 'var(--v2-font-sans)'
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
            <div className="min-w-0 flex-1">
              <h1
                className="text-xl sm:text-2xl font-bold truncate"
                style={{
                  color: 'var(--v2-text-primary)',
                  fontFamily: 'var(--v2-font-sans)'
                }}
              >
                Welcome to LibreOllama
              </h1>
              <p
                className="text-sm sm:text-base mt-1"
                style={{
                  color: 'var(--v2-text-secondary)',
                  fontFamily: 'var(--v2-font-sans)'
                }}
              >
                Privacy-first AI productivity for ADHD minds
              </p>
            </div>
            <div className="flex-shrink-0 text-left sm:text-right">
              <div
                className="text-sm mb-1"
                style={{
                  color: 'var(--v2-text-secondary)',
                  fontFamily: 'var(--v2-font-sans)'
                }}
              >
                Step {state.completedSteps.length + 1} of {5}
              </div>
              <div
                className="text-xs"
                style={{
                  color: 'var(--v2-text-muted)',
                  fontFamily: 'var(--v2-font-sans)'
                }}
              >
                ~{currentStepConfig.estimatedMinutes} min remaining
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <OnboardingProgress
            currentStep={state.currentStep}
            completedSteps={state.completedSteps}
            progressPercentage={progressPercentage}
          />
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="w-full max-w-none">
                <div className="overflow-x-auto">
                  {renderStepContent()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Navigation */}
        <div
          className="flex-shrink-0 px-4 sm:px-6 lg:px-8 py-4 border-t"
          style={{
            backgroundColor: 'var(--v2-bg-secondary)',
            borderColor: 'var(--v2-bg-tertiary)',
            fontFamily: 'var(--v2-font-sans)'
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            {/* Left side - Previous and Skip buttons */}
            <div className="flex items-center space-x-4 order-2 sm:order-1">
              {state.currentStep !== 'welcome' && state.currentStep !== 'completion' && (
                <button
                  onClick={previousStep}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                  style={{
                    color: 'var(--v2-text-primary)',
                    backgroundColor: 'var(--v2-bg-tertiary)',
                    border: `1px solid var(--v2-bg-quaternary)`,
                    fontFamily: 'var(--v2-font-sans)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--v2-bg-quaternary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--v2-bg-tertiary)';
                  }}
                >
                  Previous
                </button>
              )}
              
              {canSkipCurrentStep() && (
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 text-sm font-medium transition-colors"
                  style={{
                    color: 'var(--v2-text-muted)',
                    fontFamily: 'var(--v2-font-sans)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--v2-text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--v2-text-muted)';
                  }}
                >
                  Skip this step
                </button>
              )}
            </div>

            {/* Right side - Step title and conditional Next button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0 order-1 sm:order-2">
              <div
                className="text-sm text-center sm:text-right"
                style={{
                  color: 'var(--v2-text-secondary)',
                  fontFamily: 'var(--v2-font-sans)'
                }}
              >
                {currentStepConfig.title}
              </div>
              
              {/* Only show global Next button for steps that don't have their own action buttons */}
              {state.currentStep !== 'completion' &&
               state.currentStep !== 'welcome' &&
               !(state.currentStep === 'interactive-tour' && Object.values(state.tourProgress).every(Boolean)) &&
               !(state.currentStep === 'sample-data' && state.sampleDataCreated) && (
                <button
                  onClick={handleNext}
                  disabled={!isCurrentStepCompleted()}
                  className="w-full sm:w-auto px-6 py-2 text-sm font-medium rounded-lg transition-all"
                  style={{
                    backgroundColor: isCurrentStepCompleted() ? 'var(--v2-accent-primary)' : 'var(--v2-bg-quaternary)',
                    color: isCurrentStepCompleted() ? 'white' : 'var(--v2-text-muted)',
                    cursor: isCurrentStepCompleted() ? 'pointer' : 'not-allowed',
                    fontFamily: 'var(--v2-font-sans)',
                    boxShadow: isCurrentStepCompleted() ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (isCurrentStepCompleted()) {
                      e.currentTarget.style.backgroundColor = '#4338CA'; // indigo-700
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isCurrentStepCompleted()) {
                      e.currentTarget.style.backgroundColor = 'var(--v2-accent-primary)';
                    }
                  }}
                >
                  {state.currentStep === 'sample-data' ? 'Continue' : 'Next'}
                </button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}