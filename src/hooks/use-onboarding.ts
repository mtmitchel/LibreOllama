import { useState, useEffect, useCallback } from 'react';
import { 
  OnboardingState, 
  OnboardingStep, 
  UserPersona, 
  OnboardingProgress,
  OllamaModel,
  OnboardingAnalytics
} from '@/lib/types';

// Default onboarding state
const defaultOnboardingState: OnboardingState = {
  isActive: false,
  currentStep: 'welcome',
  completedSteps: [],
  skipOptionalSteps: false,
  ollamaSetupStatus: 'not-started',
  selectedModels: [],
  sampleDataCreated: false,
  tourProgress: {
    noteCreated: false,
    aiAsked: false,
    linkingDemonstrated: false,
    commandPaletteUsed: false,
  },
  startedAt: new Date().toISOString(),
};

// Onboarding step configuration
const onboardingSteps: OnboardingProgress[] = [
  {
    step: 'welcome',
    title: 'Welcome to LibreOllama',
    description: 'Privacy-first AI productivity for ADHD minds',
    isCompleted: false,
    isOptional: false,
    estimatedMinutes: 2,
  },
  {
    step: 'ollama-setup',
    title: 'Setup Ollama',
    description: 'Install and configure your local AI models',
    isCompleted: false,
    isOptional: false,
    estimatedMinutes: 5,
  },
  {
    step: 'interactive-tour',
    title: 'Learn by Doing',
    description: 'Create your first note and ask AI',
    isCompleted: false,
    isOptional: false,
    estimatedMinutes: 3,
  },
  {
    step: 'sample-data',
    title: 'Sample Project',
    description: 'Optional sample notes and tasks',
    isCompleted: false,
    isOptional: true,
    estimatedMinutes: 2,
  },
  {
    step: 'completion',
    title: 'Ready to Go!',
    description: 'Your workspace is ready',
    isCompleted: false,
    isOptional: false,
    estimatedMinutes: 1,
  },
];

// Recommended Ollama models for onboarding
const recommendedModels: OllamaModel[] = [
  {
    name: 'llama3.2:1b',
    displayName: 'Llama 3.2 1B',
    size: '1.3GB',
    description: 'Fast, lightweight model perfect for quick responses',
    isRecommended: true,
    isSmall: true,
  },
  {
    name: 'phi3:mini',
    displayName: 'Phi-3 Mini',
    size: '2.3GB',
    description: 'Microsoft\'s efficient model for reasoning tasks',
    isRecommended: true,
    isSmall: true,
  },
  {
    name: 'llama3.2:3b',
    displayName: 'Llama 3.2 3B',
    size: '2.0GB',
    description: 'Balanced performance and speed',
    isRecommended: false,
    isSmall: true,
  },
  {
    name: 'qwen2.5:1.5b',
    displayName: 'Qwen 2.5 1.5B',
    size: '934MB',
    description: 'Ultra-fast model for basic tasks',
    isRecommended: false,
    isSmall: true,
  },
];

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>(defaultOnboardingState);
  const [analytics, setAnalytics] = useState<Partial<OnboardingAnalytics>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load onboarding state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('onboarding-state');
    const savedAnalytics = localStorage.getItem('onboarding-analytics');
    
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setState(parsed);
      } catch (err) {
        console.error('Failed to parse saved onboarding state:', err);
      }
    }
    
    if (savedAnalytics) {
      try {
        const parsed = JSON.parse(savedAnalytics);
        setAnalytics(parsed);
      } catch (err) {
        console.error('Failed to parse saved onboarding analytics:', err);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('onboarding-state', JSON.stringify(state));
  }, [state]);

  // Save analytics to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('onboarding-analytics', JSON.stringify(analytics));
  }, [analytics]);

  // Check if onboarding should be shown (first time user)
  const shouldShowOnboarding = useCallback((): boolean => {
    const hasCompletedOnboarding = localStorage.getItem('onboarding-completed');
    const hasExistingData = localStorage.getItem('user-has-data'); // Check if user has created content
    
    return !hasCompletedOnboarding && !hasExistingData;
  }, []);

  // Start onboarding process
  const startOnboarding = useCallback(() => {
    const startTime = new Date().toISOString();
    
    setState(prev => ({
      ...prev,
      isActive: true,
      currentStep: 'welcome',
      startedAt: startTime,
    }));
    
    setAnalytics(prev => ({
      ...prev,
      stepStartTime: {
        ...prev.stepStartTime,
        welcome: startTime,
      },
    }));
  }, []);

  // Navigate to next step
  const nextStep = useCallback(() => {
    const currentIndex = onboardingSteps.findIndex(step => step.step === state.currentStep);
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < onboardingSteps.length) {
      const nextStepName = onboardingSteps[nextIndex].step;
      const now = new Date().toISOString();
      
      setState(prev => ({
        ...prev,
        currentStep: nextStepName,
        completedSteps: [...prev.completedSteps, prev.currentStep],
      }));
      
      setAnalytics(prev => ({
        ...prev,
        stepCompletionTime: {
          ...prev.stepCompletionTime,
          [state.currentStep]: now,
        },
        stepStartTime: {
          ...prev.stepStartTime,
          [nextStepName]: now,
        },
      }));
    }
  }, [state.currentStep]);

  // Navigate to previous step
  const previousStep = useCallback(() => {
    const currentIndex = onboardingSteps.findIndex(step => step.step === state.currentStep);
    const prevIndex = currentIndex - 1;
    
    if (prevIndex >= 0) {
      const prevStepName = onboardingSteps[prevIndex].step;
      
      setState(prev => ({
        ...prev,
        currentStep: prevStepName,
        completedSteps: prev.completedSteps.filter(step => step !== prevStepName),
      }));
    }
  }, [state.currentStep]);

  // Skip current step
  const skipStep = useCallback(() => {
    const now = new Date().toISOString();
    
    setAnalytics(prev => ({
      ...prev,
      stepSkipped: {
        ...prev.stepSkipped,
        [state.currentStep]: true,
      },
      stepCompletionTime: {
        ...prev.stepCompletionTime,
        [state.currentStep]: now,
      },
    }));
    
    nextStep();
  }, [state.currentStep, nextStep]);

  // Jump to specific step
  const goToStep = useCallback((step: OnboardingStep) => {
    const now = new Date().toISOString();
    
    setState(prev => ({
      ...prev,
      currentStep: step,
    }));
    
    setAnalytics(prev => ({
      ...prev,
      stepStartTime: {
        ...prev.stepStartTime,
        [step]: now,
      },
    }));
  }, []);

  // Set user persona
  const setPersona = useCallback((persona: UserPersona) => {
    setState(prev => ({
      ...prev,
      selectedPersona: persona,
    }));
    
    setAnalytics(prev => ({
      ...prev,
      personaSelected: persona,
    }));
  }, []);

  // Update Ollama setup status
  const updateOllamaStatus = useCallback((status: OnboardingState['ollamaSetupStatus']) => {
    setState(prev => ({
      ...prev,
      ollamaSetupStatus: status,
    }));
  }, []);

  // Set selected models
  const setSelectedModels = useCallback((models: string[]) => {
    setState(prev => ({
      ...prev,
      selectedModels: models,
    }));
    
    setAnalytics(prev => ({
      ...prev,
      modelsSelected: models,
    }));
  }, []);

  // Update tour progress
  const updateTourProgress = useCallback((progress: Partial<OnboardingState['tourProgress']>) => {
    setState(prev => ({
      ...prev,
      tourProgress: {
        ...prev.tourProgress,
        ...progress,
      },
    }));
  }, []);

  // Mark sample data as created
  const setSampleDataCreated = useCallback((created: boolean) => {
    setState(prev => ({
      ...prev,
      sampleDataCreated: created,
    }));
    
    setAnalytics(prev => ({
      ...prev,
      sampleDataAccepted: created,
    }));
  }, []);

  // Complete onboarding
  const completeOnboarding = useCallback(() => {
    const completionTime = new Date().toISOString();
    const startTime = new Date(state.startedAt).getTime();
    const endTime = new Date(completionTime).getTime();
    const totalTime = Math.round((endTime - startTime) / 1000 / 60); // minutes
    
    setState(prev => ({
      ...prev,
      isActive: false,
      currentStep: 'completion',
      completedSteps: [...prev.completedSteps, 'completion'],
      completedAt: completionTime,
    }));
    
    setAnalytics(prev => ({
      ...prev,
      totalOnboardingTime: totalTime,
      tourCompleted: Object.values(state.tourProgress).every(Boolean),
      stepCompletionTime: {
        ...prev.stepCompletionTime,
        completion: completionTime,
      },
    }));
    
    // Mark onboarding as completed in localStorage
    localStorage.setItem('onboarding-completed', 'true');
    localStorage.setItem('onboarding-completion-date', completionTime);
  }, [state.startedAt, state.tourProgress]);

  // Reset onboarding (for testing or re-onboarding)
  const resetOnboarding = useCallback(() => {
    setState(defaultOnboardingState);
    setAnalytics({});
    localStorage.removeItem('onboarding-state');
    localStorage.removeItem('onboarding-analytics');
    localStorage.removeItem('onboarding-completed');
    localStorage.removeItem('onboarding-completion-date');
  }, []);

  // Get current step configuration
  const getCurrentStepConfig = useCallback((): OnboardingProgress => {
    return onboardingSteps.find(step => step.step === state.currentStep) || onboardingSteps[0];
  }, [state.currentStep]);

  // Get progress percentage
  const getProgressPercentage = useCallback((): number => {
    const currentIndex = onboardingSteps.findIndex(step => step.step === state.currentStep);
    return Math.round(((currentIndex + 1) / onboardingSteps.length) * 100);
  }, [state.currentStep]);

  // Check if current step is completed
  const isCurrentStepCompleted = useCallback((): boolean => {
    switch (state.currentStep) {
      case 'welcome':
        return !!state.selectedPersona;
      case 'ollama-setup':
        return state.ollamaSetupStatus === 'completed';
      case 'interactive-tour':
        return Object.values(state.tourProgress).every(Boolean);
      case 'sample-data':
        return true; // Optional step, always considered completed
      case 'completion':
        return true;
      default:
        return false;
    }
  }, [state.currentStep, state.selectedPersona, state.ollamaSetupStatus, state.tourProgress]);

  // Check if step can be skipped
  const canSkipCurrentStep = useCallback((): boolean => {
    const currentStepConfig = getCurrentStepConfig();
    return currentStepConfig.isOptional;
  }, [getCurrentStepConfig]);

  return {
    // State
    state,
    analytics,
    isLoading,
    error,
    
    // Configuration
    onboardingSteps,
    recommendedModels,
    
    // Actions
    shouldShowOnboarding,
    startOnboarding,
    nextStep,
    previousStep,
    skipStep,
    goToStep,
    setPersona,
    updateOllamaStatus,
    setSelectedModels,
    updateTourProgress,
    setSampleDataCreated,
    completeOnboarding,
    resetOnboarding,
    
    // Computed values
    getCurrentStepConfig,
    getProgressPercentage,
    isCurrentStepCompleted,
    canSkipCurrentStep,
    
    // Utilities
    setIsLoading,
    setError,
  };
}