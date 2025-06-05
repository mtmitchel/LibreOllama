import React from 'react';
import { useOnboarding } from '@/hooks/use-onboarding';
import { UserPersona, PersonaConfig } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button-v2';
import { Card, CardContent } from '@/components/ui/card-v2';
import { designSystemFlags } from '@/lib/design-tokens';
import {
  GraduationCap,
  Briefcase,
  Palette,
  Search,
  Shield,
  Brain,
  Zap,
  Heart
} from 'lucide-react';

interface WelcomeScreenProps {
  onNext: () => void;
}

const personaConfigs: PersonaConfig[] = [
  {
    id: 'student',
    title: 'Student',
    description: 'Research, study notes, and academic projects',
    icon: 'graduation-cap',
    features: [
      'Research note organization',
      'Study session tracking',
      'Citation management',
      'Assignment planning'
    ],
    sampleContent: {
      notes: [
        { title: 'Research Methods', content: 'Key concepts in qualitative vs quantitative research...', tags: ['research', 'methodology'] },
        { title: 'Study Schedule', content: 'Weekly study plan with focus blocks...', tags: ['planning', 'schedule'] }
      ],
      tasks: [
        { title: 'Complete literature review', description: 'Gather 10 sources for thesis', priority: 'high' },
        { title: 'Prepare presentation', description: 'Create slides for Monday class', priority: 'medium' }
      ],
      chatPrompts: [
        'Help me understand this research paper',
        'Create a study plan for my exams',
        'Explain this concept in simple terms'
      ]
    }
  },
  {
    id: 'professional',
    title: 'Professional',
    description: 'Project management, meetings, and productivity',
    icon: 'briefcase',
    features: [
      'Project documentation',
      'Meeting notes & action items',
      'Goal tracking',
      'Team collaboration'
    ],
    sampleContent: {
      notes: [
        { title: 'Project Kickoff', content: 'Meeting notes from Q1 planning session...', tags: ['meetings', 'planning'] },
        { title: 'Client Requirements', content: 'Key deliverables and timeline...', tags: ['client', 'requirements'] }
      ],
      tasks: [
        { title: 'Review quarterly reports', description: 'Analyze Q4 performance metrics', priority: 'high' },
        { title: 'Schedule team standup', description: 'Coordinate with all team members', priority: 'medium' }
      ],
      chatPrompts: [
        'Summarize this meeting transcript',
        'Create action items from these notes',
        'Help me prioritize my tasks'
      ]
    }
  },
  {
    id: 'creative',
    title: 'Creative',
    description: 'Ideas, inspiration, and creative projects',
    icon: 'palette',
    features: [
      'Idea capture & development',
      'Creative project tracking',
      'Inspiration boards',
      'Brainstorming sessions'
    ],
    sampleContent: {
      notes: [
        { title: 'Story Ideas', content: 'Collection of character concepts and plot threads...', tags: ['writing', 'ideas'] },
        { title: 'Design Inspiration', content: 'Color palettes and visual references...', tags: ['design', 'inspiration'] }
      ],
      tasks: [
        { title: 'Finish chapter draft', description: 'Complete first draft of chapter 3', priority: 'high' },
        { title: 'Create mood board', description: 'Visual inspiration for new project', priority: 'low' }
      ],
      chatPrompts: [
        'Help me develop this creative idea',
        'Suggest improvements to my writing',
        'Brainstorm variations on this concept'
      ]
    }
  },
  {
    id: 'researcher',
    title: 'Researcher',
    description: 'Deep analysis, knowledge synthesis, and discovery',
    icon: 'search',
    features: [
      'Literature management',
      'Hypothesis tracking',
      'Data analysis notes',
      'Knowledge graphs'
    ],
    sampleContent: {
      notes: [
        { title: 'Literature Review', content: 'Synthesis of current research on topic...', tags: ['literature', 'analysis'] },
        { title: 'Methodology Notes', content: 'Experimental design and procedures...', tags: ['methodology', 'experiment'] }
      ],
      tasks: [
        { title: 'Analyze dataset', description: 'Statistical analysis of survey results', priority: 'high' },
        { title: 'Update bibliography', description: 'Add recent papers to reference list', priority: 'medium' }
      ],
      chatPrompts: [
        'Help me analyze this research data',
        'Explain the implications of these findings',
        'Suggest related research areas'
      ]
    }
  }
];

const iconMap = {
  'graduation-cap': GraduationCap,
  'briefcase': Briefcase,
  'palette': Palette,
  'search': Search,
};

export function WelcomeScreen({ onNext }: WelcomeScreenProps) {
  const { state, setPersona } = useOnboarding();

  const handlePersonaSelect = (persona: UserPersona) => {
    setPersona(persona);
  };

  return (
    <div className="px-8 py-8" style={{ fontFamily: 'var(--v2-font-sans)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, var(--v2-accent-primary), var(--v2-accent-secondary))`
              }}
            >
              <Brain className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2
            className="text-3xl font-bold mb-3"
            style={{
              color: 'var(--v2-text-primary)',
              fontFamily: 'var(--v2-font-sans)'
            }}
          >
            Welcome to LibreOllama
          </h2>
          <p
            className="text-lg max-w-2xl mx-auto"
            style={{
              color: 'var(--v2-text-secondary)',
              fontFamily: 'var(--v2-font-sans)',
              lineHeight: '1.625rem'
            }}
          >
            Your privacy-first AI productivity companion designed specifically for ADHD minds.
            Let's personalize your experience to match how you work best.
          </p>
        </div>

        {/* Privacy & ADHD Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="text-center p-4">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3"
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}
            >
              <Shield className="w-6 h-6" style={{ color: 'var(--v2-accent-success)' }} />
            </div>
            <h3
              className="font-semibold mb-2"
              style={{
                color: 'var(--v2-text-primary)',
                fontFamily: 'var(--v2-font-sans)'
              }}
            >
              Privacy First
            </h3>
            <p
              className="text-sm"
              style={{
                color: 'var(--v2-text-secondary)',
                fontFamily: 'var(--v2-font-sans)',
                lineHeight: '1.375rem'
              }}
            >
              All your data stays local. No cloud, no tracking, complete control.
            </p>
          </div>
          <div className="text-center p-4">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3"
              style={{
                backgroundColor: 'rgba(79, 70, 229, 0.15)',
                border: '1px solid rgba(79, 70, 229, 0.3)'
              }}
            >
              <Zap className="w-6 h-6" style={{ color: 'var(--v2-accent-primary)' }} />
            </div>
            <h3
              className="font-semibold mb-2"
              style={{
                color: 'var(--v2-text-primary)',
                fontFamily: 'var(--v2-font-sans)'
              }}
            >
              ADHD Optimized
            </h3>
            <p
              className="text-sm"
              style={{
                color: 'var(--v2-text-secondary)',
                fontFamily: 'var(--v2-font-sans)',
                lineHeight: '1.375rem'
              }}
            >
              Clear structure, minimal distractions, focus-friendly design.
            </p>
          </div>
          <div className="text-center p-4">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3"
              style={{
                backgroundColor: 'rgba(168, 85, 247, 0.15)',
                border: '1px solid rgba(168, 85, 247, 0.3)'
              }}
            >
              <Heart className="w-6 h-6" style={{ color: '#A855F7' }} />
            </div>
            <h3
              className="font-semibold mb-2"
              style={{
                color: 'var(--v2-text-primary)',
                fontFamily: 'var(--v2-font-sans)'
              }}
            >
              Made for You
            </h3>
            <p
              className="text-sm"
              style={{
                color: 'var(--v2-text-secondary)',
                fontFamily: 'var(--v2-font-sans)',
                lineHeight: '1.375rem'
              }}
            >
              Adaptive interface that learns and supports your workflow.
            </p>
          </div>
        </div>

        {/* Persona Selection */}
        <div className="mb-8">
          <h3
            className="text-xl font-semibold mb-4 text-center"
            style={{
              color: 'var(--v2-text-primary)',
              fontFamily: 'var(--v2-font-sans)',
              lineHeight: '2rem'
            }}
          >
            How do you primarily use productivity tools?
          </h3>
          <p
            className="text-center mb-6"
            style={{
              color: 'var(--v2-text-secondary)',
              fontFamily: 'var(--v2-font-sans)',
              lineHeight: '1.625rem'
            }}
          >
            This helps us customize your experience with relevant features and sample content.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            {personaConfigs.map((persona) => {
              const IconComponent = iconMap[persona.icon as keyof typeof iconMap];
              const isSelected = state.selectedPersona === persona.id;

              return (
               <button
                 key={persona.id}
                 onClick={() => handlePersonaSelect(persona.id)}
                 className="p-6 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md"
                 style={{
                   backgroundColor: isSelected ? 'var(--v2-bg-tertiary)' : 'var(--v2-bg-secondary)',
                   borderColor: isSelected ? 'var(--v2-accent-primary)' : 'var(--v2-bg-quaternary)',
                   fontFamily: 'var(--v2-font-sans)',
                   ...(isSelected && {
                     boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 0 0 1px rgba(79, 70, 229, 0.2)'
                   })
                 }}
                 onMouseEnter={(e) => {
                   if (!isSelected) {
                     e.currentTarget.style.borderColor = 'var(--v2-bg-quaternary)';
                     e.currentTarget.style.backgroundColor = 'var(--v2-bg-tertiary)';
                   }
                 }}
                 onMouseLeave={(e) => {
                   if (!isSelected) {
                     e.currentTarget.style.borderColor = 'var(--v2-bg-quaternary)';
                     e.currentTarget.style.backgroundColor = 'var(--v2-bg-secondary)';
                   }
                 }}
               >
                 <div className="flex items-start space-x-4">
                   <div
                     className="w-12 h-12 rounded-lg flex items-center justify-center"
                     style={{
                       backgroundColor: isSelected ? 'var(--v2-accent-primary)' : 'var(--v2-bg-quaternary)'
                     }}
                   >
                     <IconComponent
                       className="w-6 h-6"
                       style={{
                         color: isSelected ? 'white' : 'var(--v2-text-secondary)'
                       }}
                     />
                   </div>
                   <div className="flex-1">
                     <h4
                       className="font-semibold mb-2"
                       style={{
                         color: isSelected ? 'var(--v2-text-primary)' : 'var(--v2-text-primary)',
                         fontFamily: 'var(--v2-font-sans)'
                       }}
                     >
                       {persona.title}
                     </h4>
                     <p
                       className="text-sm mb-3"
                       style={{
                         color: isSelected ? 'var(--v2-text-secondary)' : 'var(--v2-text-secondary)',
                         fontFamily: 'var(--v2-font-sans)',
                         lineHeight: '1.375rem'
                       }}
                     >
                       {persona.description}
                     </p>
                     <div className="space-y-1">
                       {persona.features.slice(0, 2).map((feature, index) => (
                         <div
                           key={index}
                           className="text-xs flex items-center"
                           style={{
                             color: isSelected ? 'var(--v2-accent-primary)' : 'var(--v2-text-muted)',
                             fontFamily: 'var(--v2-font-sans)'
                           }}
                         >
                           <div
                             className="w-1.5 h-1.5 rounded-full mr-2"
                             style={{
                               backgroundColor: isSelected ? 'var(--v2-accent-primary)' : 'var(--v2-text-muted)'
                             }}
                           />
                           {feature}
                         </div>
                       ))}
                     </div>
                   </div>
                 </div>
               </button>
              );
            })}
          </div>
        </div>

        {/* Selected Persona Preview */}
        {state.selectedPersona && (
          <div
            className="rounded-xl p-6 mb-6"
            style={{
              background: `linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(59, 130, 246, 0.1))`,
              border: '1px solid rgba(79, 70, 229, 0.2)',
              fontFamily: 'var(--v2-font-sans)'
            }}
          >
            <h4
              className="font-semibold mb-3"
              style={{
                color: 'var(--v2-text-primary)',
                fontFamily: 'var(--v2-font-sans)'
              }}
            >
              Perfect! We'll customize LibreOllama for {personaConfigs.find(p => p.id === state.selectedPersona)?.title.toLowerCase()}s
            </h4>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <div
                  className="font-medium mb-2"
                  style={{
                    color: 'var(--v2-text-primary)',
                    fontFamily: 'var(--v2-font-sans)'
                  }}
                >
                  Sample Notes
                </div>
                <div className="space-y-1">
                  {personaConfigs.find(p => p.id === state.selectedPersona)?.sampleContent.notes.map((note, index) => (
                    <div
                      key={index}
                      style={{
                        color: 'var(--v2-text-secondary)',
                        fontFamily: 'var(--v2-font-sans)'
                      }}
                    >
                      • {note.title}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div
                  className="font-medium mb-2"
                  style={{
                    color: 'var(--v2-text-primary)',
                    fontFamily: 'var(--v2-font-sans)'
                  }}
                >
                  Sample Tasks
                </div>
                <div className="space-y-1">
                  {personaConfigs.find(p => p.id === state.selectedPersona)?.sampleContent.tasks.map((task, index) => (
                    <div
                      key={index}
                      style={{
                        color: 'var(--v2-text-secondary)',
                        fontFamily: 'var(--v2-font-sans)'
                      }}
                    >
                      • {task.title}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div
                  className="font-medium mb-2"
                  style={{
                    color: 'var(--v2-text-primary)',
                    fontFamily: 'var(--v2-font-sans)'
                  }}
                >
                  AI Prompts
                </div>
                <div className="space-y-1">
                  {personaConfigs.find(p => p.id === state.selectedPersona)?.sampleContent.chatPrompts.slice(0, 2).map((prompt, index) => (
                    <div
                      key={index}
                      style={{
                        color: 'var(--v2-text-secondary)',
                        fontFamily: 'var(--v2-font-sans)'
                      }}
                    >
                      • {prompt}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center">
          <p
            className="mb-4"
            style={{
              color: 'var(--v2-text-secondary)',
              fontFamily: 'var(--v2-font-sans)',
              lineHeight: '1.625rem'
            }}
          >
            Ready to set up your AI-powered workspace?
          </p>
          <Button
            onClick={onNext}
            disabled={!state.selectedPersona}
            variant="primary"
            size="lg"
            className="px-8 py-3"
            useV2={true}
          >
            Let's Get Started
          </Button>
        </div>
      </div>
    </div>
  );
}