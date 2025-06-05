import React, { useState } from 'react';
import { useOnboarding } from '@/hooks/use-onboarding';
import { PersonaConfig } from '@/lib/types';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  CheckSquare, 
  MessageSquare, 
  Download,
  CheckCircle,
  X,
  Sparkles,
  ArrowRight,
  Clock
} from 'lucide-react';

interface SampleDataSetupProps {
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
}

export function SampleDataSetup({ onNext, onPrevious, onSkip }: SampleDataSetupProps) {
  const { state, setSampleDataCreated } = useOnboarding();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedContent, setSelectedContent] = useState({
    notes: true,
    tasks: true,
    chatPrompts: true
  });

  // Get persona config for sample content
  const getPersonaConfig = (): PersonaConfig | null => {
    const personaConfigs: PersonaConfig[] = [
      {
        id: 'student',
        title: 'Student',
        description: 'Research, study notes, and academic projects',
        icon: 'graduation-cap',
        features: [],
        sampleContent: {
          notes: [
            { title: 'Research Methods Overview', content: 'Key concepts in qualitative vs quantitative research methodologies...', tags: ['research', 'methodology'] },
            { title: 'Study Schedule Template', content: 'Weekly study plan with focus blocks and break times...', tags: ['planning', 'schedule'] },
            { title: 'Literature Review Notes', content: 'Important papers and their key findings...', tags: ['literature', 'notes'] }
          ],
          tasks: [
            { title: 'Complete literature review', description: 'Gather 10 sources for thesis research', priority: 'high' },
            { title: 'Prepare presentation slides', description: 'Create slides for Monday class presentation', priority: 'medium' },
            { title: 'Review lecture notes', description: 'Go through this week\'s lecture materials', priority: 'low' }
          ],
          chatPrompts: [
            'Help me understand this research paper',
            'Create a study plan for my upcoming exams',
            'Explain this concept in simple terms'
          ]
        }
      },
      {
        id: 'professional',
        title: 'Professional',
        description: 'Project management, meetings, and productivity',
        icon: 'briefcase',
        features: [],
        sampleContent: {
          notes: [
            { title: 'Q1 Project Kickoff', content: 'Meeting notes from quarterly planning session...', tags: ['meetings', 'planning'] },
            { title: 'Client Requirements Doc', content: 'Key deliverables and project timeline...', tags: ['client', 'requirements'] },
            { title: 'Team Standup Notes', content: 'Daily standup meeting highlights...', tags: ['team', 'standup'] }
          ],
          tasks: [
            { title: 'Review quarterly reports', description: 'Analyze Q4 performance metrics and trends', priority: 'high' },
            { title: 'Schedule team standup', description: 'Coordinate with all team members for weekly sync', priority: 'medium' },
            { title: 'Update project timeline', description: 'Revise milestones based on recent changes', priority: 'medium' }
          ],
          chatPrompts: [
            'Summarize this meeting transcript',
            'Create action items from these notes',
            'Help me prioritize my tasks for this week'
          ]
        }
      },
      {
        id: 'creative',
        title: 'Creative',
        description: 'Ideas, inspiration, and creative projects',
        icon: 'palette',
        features: [],
        sampleContent: {
          notes: [
            { title: 'Story Ideas Collection', content: 'Character concepts and plot threads for future stories...', tags: ['writing', 'ideas'] },
            { title: 'Design Inspiration Board', content: 'Color palettes and visual references for current project...', tags: ['design', 'inspiration'] },
            { title: 'Creative Process Notes', content: 'Reflections on workflow and creative techniques...', tags: ['process', 'reflection'] }
          ],
          tasks: [
            { title: 'Finish chapter draft', description: 'Complete first draft of chapter 3', priority: 'high' },
            { title: 'Create mood board', description: 'Visual inspiration for new project concept', priority: 'low' },
            { title: 'Sketch character designs', description: 'Initial character concept sketches', priority: 'medium' }
          ],
          chatPrompts: [
            'Help me develop this creative idea further',
            'Suggest improvements to my writing style',
            'Brainstorm variations on this concept'
          ]
        }
      },
      {
        id: 'researcher',
        title: 'Researcher',
        description: 'Deep analysis, knowledge synthesis, and discovery',
        icon: 'search',
        features: [],
        sampleContent: {
          notes: [
            { title: 'Literature Review Synthesis', content: 'Comprehensive analysis of current research on topic...', tags: ['literature', 'analysis'] },
            { title: 'Methodology Documentation', content: 'Experimental design and research procedures...', tags: ['methodology', 'experiment'] },
            { title: 'Data Analysis Framework', content: 'Statistical approaches and analysis methods...', tags: ['data', 'statistics'] }
          ],
          tasks: [
            { title: 'Analyze survey dataset', description: 'Statistical analysis of recent survey results', priority: 'high' },
            { title: 'Update bibliography', description: 'Add recent papers to reference database', priority: 'medium' },
            { title: 'Prepare research proposal', description: 'Draft proposal for next phase of research', priority: 'high' }
          ],
          chatPrompts: [
            'Help me analyze this research data',
            'Explain the implications of these findings',
            'Suggest related research areas to explore'
          ]
        }
      }
    ];

    return personaConfigs.find(p => p.id === state.selectedPersona) || null;
  };

  const personaConfig = getPersonaConfig();

  const handleContentToggle = (type: keyof typeof selectedContent) => {
    setSelectedContent(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleCreateSampleData = async () => {
    setIsCreating(true);
    
    try {
      // Simulate creating sample data
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSampleDataCreated(true);
      
      // Auto-proceed after creation
      setTimeout(() => {
        onNext();
      }, 1000);
    } catch (error) {
      console.error('Failed to create sample data:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const selectedCount = Object.values(selectedContent).filter(Boolean).length;

  return (
    <div className="px-8 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Sample Content Setup
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We can create some sample content based on your selected persona to help you 
            get started and see how LibreOllama works. This step is completely optional.
          </p>
        </div>

        {/* Skip Option */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Skip Sample Data
              </h3>
              <p className="text-sm text-gray-600">
                Start with a clean workspace and create your own content from scratch.
              </p>
            </div>
            <button
              onClick={onSkip}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Skip & Continue
            </button>
          </div>
        </div>

        {/* Sample Content Preview */}
        {personaConfig && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Sample Content for {personaConfig.title}s
            </h3>
            <p className="text-gray-600 mb-6">
              Choose what type of sample content you'd like us to create:
            </p>

            <div className="space-y-4 mb-6">
              {/* Notes */}
              <div className={cn(
                "border-2 rounded-lg p-4 cursor-pointer transition-all",
                selectedContent.notes
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
              onClick={() => handleContentToggle('notes')}>
                <div className="flex items-start space-x-4">
                  <div className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5",
                    selectedContent.notes ? "border-blue-500 bg-blue-500" : "border-gray-300"
                  )}>
                    {selectedContent.notes && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <h4 className="font-medium text-gray-900">
                        Sample Notes ({personaConfig.sampleContent.notes.length})
                      </h4>
                    </div>
                    <div className="space-y-1">
                      {personaConfig.sampleContent.notes.map((note, index) => (
                        <div key={index} className="text-sm text-gray-600">
                          • {note.title}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tasks */}
              <div className={cn(
                "border-2 rounded-lg p-4 cursor-pointer transition-all",
                selectedContent.tasks
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
              onClick={() => handleContentToggle('tasks')}>
                <div className="flex items-start space-x-4">
                  <div className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5",
                    selectedContent.tasks ? "border-blue-500 bg-blue-500" : "border-gray-300"
                  )}>
                    {selectedContent.tasks && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckSquare className="w-5 h-5 text-gray-600" />
                      <h4 className="font-medium text-gray-900">
                        Sample Tasks ({personaConfig.sampleContent.tasks.length})
                      </h4>
                    </div>
                    <div className="space-y-1">
                      {personaConfig.sampleContent.tasks.map((task, index) => (
                        <div key={index} className="text-sm text-gray-600">
                          • {task.title}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Prompts */}
              <div className={cn(
                "border-2 rounded-lg p-4 cursor-pointer transition-all",
                selectedContent.chatPrompts
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
              onClick={() => handleContentToggle('chatPrompts')}>
                <div className="flex items-start space-x-4">
                  <div className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5",
                    selectedContent.chatPrompts ? "border-blue-500 bg-blue-500" : "border-gray-300"
                  )}>
                    {selectedContent.chatPrompts && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <MessageSquare className="w-5 h-5 text-gray-600" />
                      <h4 className="font-medium text-gray-900">
                        AI Chat Examples ({personaConfig.sampleContent.chatPrompts.length})
                      </h4>
                    </div>
                    <div className="space-y-1">
                      {personaConfig.sampleContent.chatPrompts.map((prompt, index) => (
                        <div key={index} className="text-sm text-gray-600">
                          • "{prompt}"
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Create Button */}
            {selectedCount > 0 && (
              <div className="text-center">
                <button
                  onClick={handleCreateSampleData}
                  disabled={isCreating || state.sampleDataCreated}
                  className={cn(
                    "px-6 py-3 rounded-lg font-medium transition-all",
                    state.sampleDataCreated
                      ? "bg-green-100 text-green-700 cursor-default"
                      : isCreating
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
                  )}
                >
                  {state.sampleDataCreated ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2 inline" />
                      Sample Data Created!
                    </>
                  ) : isCreating ? (
                    <>
                      <Download className="w-4 h-4 mr-2 animate-pulse inline" />
                      Creating Sample Content...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2 inline" />
                      Create {selectedCount} Type{selectedCount !== 1 ? 's' : ''} of Sample Content
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Benefits */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h3 className="font-semibold text-blue-900 mb-3">
            Why Use Sample Data?
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Learn Faster</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• See how features work with real content</li>
                <li>• Understand linking and organization</li>
                <li>• Experience AI interactions immediately</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Get Inspired</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Templates for your own content</li>
                <li>• Best practices examples</li>
                <li>• Jumpstart your productivity</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Success State */}
        {state.sampleDataCreated && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
            <h3 className="font-semibold text-green-900 mb-2">
              Sample Content Created!
            </h3>
            <p className="text-green-700 mb-4">
              Your workspace now has sample content to help you explore LibreOllama's features.
            </p>
            <button
              onClick={onNext}
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
            >
              Continue to Completion
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        )}

        {/* Time Estimate */}
        <div className="text-center text-sm text-gray-500">
          <Clock className="w-4 h-4 inline mr-1" />
          This step takes about 1-2 minutes
        </div>
      </div>
    </div>
  );
}