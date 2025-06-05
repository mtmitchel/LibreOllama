import React from 'react';
import { useOnboarding } from '@/hooks/use-onboarding';
import { cn } from '@/lib/utils';
import { 
  CheckCircle, 
  Rocket, 
  Heart, 
  Zap, 
  Shield, 
  Brain,
  ArrowRight,
  BookOpen,
  MessageSquare,
  Settings,
  HelpCircle
} from 'lucide-react';

interface CompletionScreenProps {
  onComplete: () => void;
}

export function CompletionScreen({ onComplete }: CompletionScreenProps) {
  const { state, analytics } = useOnboarding();

  const getPersonaTitle = () => {
    const personaTitles = {
      student: 'Student',
      professional: 'Professional',
      creative: 'Creative',
      researcher: 'Researcher'
    };
    return state.selectedPersona ? personaTitles[state.selectedPersona] : 'User';
  };

  const getSetupSummary = () => {
    const items = [];
    
    if (state.selectedPersona) {
      items.push(`Personalized for ${getPersonaTitle().toLowerCase()}s`);
    }
    
    if (state.ollamaSetupStatus === 'completed') {
      items.push(`Ollama configured with ${state.selectedModels.length} model${state.selectedModels.length !== 1 ? 's' : ''}`);
    }
    
    if (Object.values(state.tourProgress).some(Boolean)) {
      const completedTourSteps = Object.values(state.tourProgress).filter(Boolean).length;
      items.push(`Completed ${completedTourSteps}/4 tour steps`);
    }
    
    if (state.sampleDataCreated) {
      items.push('Sample content created');
    }
    
    return items;
  };

  const quickActions = [
    {
      title: 'Create Your First Note',
      description: 'Start capturing your thoughts and ideas',
      icon: BookOpen,
      action: 'Go to Notes',
      shortcut: 'Ctrl+3'
    },
    {
      title: 'Chat with AI',
      description: 'Ask questions and get AI assistance',
      icon: MessageSquare,
      action: 'Open Chat',
      shortcut: 'Ctrl+1'
    },
    {
      title: 'Explore Settings',
      description: 'Customize your workspace preferences',
      icon: Settings,
      action: 'Open Settings',
      shortcut: 'Ctrl+,'
    },
    {
      title: 'Get Help',
      description: 'Learn more about LibreOllama features',
      icon: HelpCircle,
      action: 'View Documentation',
      shortcut: 'F1'
    }
  ];

  const setupSummary = getSetupSummary();

  return (
    <div className="px-8 py-8">
      <div className="max-w-4xl mx-auto text-center">
        {/* Success Animation */}
        <div className="mb-8">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Rocket className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle className="w-5 h-5 text-yellow-800" />
            </div>
          </div>
        </div>

        {/* Main Message */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎉 Welcome to LibreOllama!
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Your privacy-first AI workspace is ready to boost your productivity
          </p>
          
          {/* Personalized Message */}
          {state.selectedPersona && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
              <p className="text-lg text-gray-700">
                We've customized LibreOllama specifically for <strong>{getPersonaTitle().toLowerCase()}s</strong> like you. 
                Your workspace includes features and content tailored to your workflow.
              </p>
            </div>
          )}
        </div>

        {/* Setup Summary */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            What We've Set Up
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {setupSummary.map((item, index) => (
              <div key={index} className="flex items-center space-x-3 text-left">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Key Features Reminder */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">100% Private</h3>
            <p className="text-sm text-gray-600">
              Your data never leaves your device. Complete privacy and control.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Brain className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">ADHD Optimized</h3>
            <p className="text-sm text-gray-600">
              Clear structure, minimal distractions, focus-friendly design.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Lightning Fast</h3>
            <p className="text-sm text-gray-600">
              Local AI processing means instant responses, no waiting.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Quick Actions to Get Started
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <action.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-medium text-gray-900 mb-1">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {action.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-blue-600 font-medium">
                        {action.action}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">
                        {action.shortcut}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pro Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center justify-center">
            <Heart className="w-5 h-5 mr-2" />
            Pro Tips for ADHD Productivity
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-left">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Focus Techniques</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Use Focus Mode (Ctrl+.) when you need to concentrate</li>
                <li>• Command palette (Ctrl+K) for quick, distraction-free actions</li>
                <li>• Break large tasks into smaller, linked notes</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Organization</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Use bidirectional links to connect related thoughts</li>
                <li>• Tag content for easy filtering and discovery</li>
                <li>• Let AI help organize and prioritize your tasks</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Analytics Summary */}
        {analytics.totalOnboardingTime && (
          <div className="text-sm text-gray-500 mb-6">
            Onboarding completed in {analytics.totalOnboardingTime} minutes
          </div>
        )}

        {/* Call to Action */}
        <div className="space-y-4">
          <button
            onClick={onComplete}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-semibold text-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Start Using LibreOllama
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
          
          <p className="text-sm text-gray-500">
            You can always access these tips and settings later from the help menu
          </p>
        </div>

        {/* Celebration Elements */}
        <div className="mt-8 text-6xl animate-bounce">
          🚀
        </div>
      </div>
    </div>
  );
}