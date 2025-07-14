import type { Story } from '@ladle/react';
import React, { useState } from 'react';
import { Stepper, StepperItem } from './Stepper';
import { CheckCircle, Circle, XCircle, AlertCircle } from 'lucide-react';

export const Steppers: Story = () => {
  const [horizontalStep, setHorizontalStep] = useState(1);
  const [verticalStep, setVerticalStep] = useState(2);

  const basicSteps: StepperItem[] = [
    { id: '1', title: 'Account setup', description: 'Create your account and verify email' },
    { id: '2', title: 'Profile information', description: 'Add your personal details' },
    { id: '3', title: 'Preferences', description: 'Configure your settings' },
    { id: '4', title: 'Complete', description: 'You are all set!' }
  ];

  const getStepState = (stepIndex: number, currentStep: number, hasError = false) => {
    if (hasError && stepIndex === 1) return 'error';
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'active';
    return 'pending';
  };

  return (
    <div className="space-y-12 bg-primary p-8">
      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Horizontal orientation</h2>
        <div className="border-border-default rounded-lg border bg-surface p-6">
          <Stepper
            orientation="horizontal"
            steps={basicSteps.map((step, index) => ({
              ...step,
              state: getStepState(index, horizontalStep)
            }))}
            onStepClick={(stepId) => setHorizontalStep(parseInt(stepId))}
            className="mb-6"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setHorizontalStep(Math.max(0, horizontalStep - 1))}
              className="rounded bg-secondary px-3 py-1 text-sm text-primary hover:bg-tertiary"
              disabled={horizontalStep === 0}
            >
              Previous
            </button>
            <button
              onClick={() => setHorizontalStep(Math.min(basicSteps.length - 1, horizontalStep + 1))}
              className="hover:bg-accent-primary/90 rounded bg-accent-primary px-3 py-1 text-sm text-white"
              disabled={horizontalStep === basicSteps.length - 1}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Vertical orientation</h2>
        <div className="border-border-default rounded-lg border bg-surface p-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <Stepper
                orientation="vertical"
                steps={basicSteps.map((step, index) => ({
                  ...step,
                  state: getStepState(index, verticalStep)
                }))}
                onStepClick={(stepId) => setVerticalStep(parseInt(stepId))}
              />
            </div>
            <div className="space-y-4">
              <h3 className="font-medium text-primary">Step controls</h3>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setVerticalStep(Math.max(0, verticalStep - 1))}
                  className="rounded bg-secondary px-3 py-2 text-left text-sm text-primary hover:bg-tertiary"
                  disabled={verticalStep === 0}
                >
                  Previous step
                </button>
                <button
                  onClick={() => setVerticalStep(Math.min(basicSteps.length - 1, verticalStep + 1))}
                  className="hover:bg-accent-primary/90 rounded bg-accent-primary px-3 py-2 text-left text-sm text-white"
                  disabled={verticalStep === basicSteps.length - 1}
                >
                  Next step
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Step states</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">All states</h3>
            <Stepper
              orientation="vertical"
              steps={[
                { id: '1', title: 'Completed step', description: 'This step is done', state: 'completed' },
                { id: '2', title: 'Active step', description: 'Currently working on this', state: 'active' },
                { id: '3', title: 'Error step', description: 'Something went wrong', state: 'error' },
                { id: '4', title: 'Pending step', description: 'Not started yet', state: 'pending' }
              ]}
            />
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">With custom icons</h3>
            <Stepper
              orientation="vertical"
              steps={[
                { 
                  id: '1', 
                  title: 'Code review', 
                  description: 'Peer review completed', 
                  state: 'completed',
                  icon: <CheckCircle className="size-4" />
                },
                { 
                  id: '2', 
                  title: 'Tests running', 
                  description: 'Automated tests in progress', 
                  state: 'active',
                  icon: <Circle className="size-4" />
                },
                { 
                  id: '3', 
                  title: 'Deploy failed', 
                  description: 'Deployment encountered an error', 
                  state: 'error',
                  icon: <XCircle className="size-4" />
                },
                { 
                  id: '4', 
                  title: 'Rollback', 
                  description: 'Revert to previous version', 
                  state: 'pending',
                  icon: <AlertCircle className="size-4" />
                }
              ]}
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Optional steps</h2>
        <div className="border-border-default rounded-lg border bg-surface p-6">
          <Stepper
            orientation="horizontal"
            steps={[
              { id: '1', title: 'Required step', description: 'Must complete this', state: 'completed' },
              { id: '2', title: 'Optional step', description: 'You can skip this', state: 'active', isOptional: true },
              { id: '3', title: 'Final step', description: 'Last required step', state: 'pending' }
            ]}
            allowOptionalSkip
          />
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Use cases</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Onboarding flow</h3>
            <Stepper
              orientation="vertical"
              size="sm"
              steps={[
                { id: '1', title: 'Welcome', description: 'Introduction to the platform', state: 'completed' },
                { id: '2', title: 'Setup profile', description: 'Add your information', state: 'completed' },
                { id: '3', title: 'Connect accounts', description: 'Link your services', state: 'active' },
                { id: '4', title: 'Invite team', description: 'Add your colleagues', state: 'pending', isOptional: true },
                { id: '5', title: 'Start using', description: 'You are ready to go!', state: 'pending' }
              ]}
            />
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Order tracking</h3>
            <Stepper
              orientation="vertical"
              size="sm"
              steps={[
                { id: '1', title: 'Order placed', description: 'Your order has been confirmed', state: 'completed' },
                { id: '2', title: 'Processing', description: 'Preparing your items', state: 'completed' },
                { id: '3', title: 'Shipped', description: 'Package is on its way', state: 'active' },
                { id: '4', title: 'Out for delivery', description: 'Package is out for delivery', state: 'pending' },
                { id: '5', title: 'Delivered', description: 'Package has been delivered', state: 'pending' }
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

Steppers.meta = {
  title: 'Design System/Components/Stepper',
}; 