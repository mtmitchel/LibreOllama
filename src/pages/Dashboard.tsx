import React, { useEffect, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { useHeader } from '../contexts/HeaderContext';
import {
  MessageSquare,
  FileText,
  FolderPlus,
  LayoutTemplate,
  MoreHorizontal,
  Settings2,
  GripVertical,
  PlusCircle,
  CheckCircle2, // Added for completed status
  Circle // Added for pending status (or CircleDot / CircleHelp for outline)
} from 'lucide-react';

export function Dashboard() {
  const { setHeaderProps, clearHeaderProps } = useHeader();

  const handleAddWidget = useCallback(() => {
    // TODO: Implement add widget functionality
    console.log('Add widget');
  }, []);

  // Set page-specific header props when component mounts
  useEffect(() => {
    setHeaderProps({
      title: "Good morning, Alex",
      primaryAction: {
        label: 'Add widget',
        onClick: handleAddWidget,
        icon: <PlusCircle size={16} />
      },
      secondaryActions: [
        {
          label: 'More options',
          onClick: () => console.log('More options'),
          variant: 'ghost' as const
        }
      ]
    });

    // Clean up header props when component unmounts
    return () => clearHeaderProps();
  }, [setHeaderProps, clearHeaderProps, handleAddWidget]);

  return (
    <div className="w-full">
      <p className="text-gray-600 dark:text-gray-400 -mt-4 mb-6">
        Here's what's happening today.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* UI Migration Sprint Widget */}
        <Card className="relative">
          <div className="flex items-center justify-center w-6 h-6 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab absolute top-4 right-12">
            <GripVertical className="w-4 h-4" />
          </div>
          <div className="flex items-center justify-center w-8 h-8 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors absolute top-4 right-4">
            <MoreHorizontal className="w-4 h-4" />
          </div>
          
          {/* Header section with improved spacing */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">UI migration sprint</h3>
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">67% complete</span>
          </div>
          
          {/* Progress bar with better styling */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full w-[67%] transition-all duration-300"></div>
            </div>
          </div>
          
          {/* Task list with improved spacing and typography */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-2 -m-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">Component library setup</div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">Dec 18</div>
            </div>
            <div className="flex items-center gap-3 p-2 -m-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">Dashboard redesign</div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">Dec 20</div>
            </div>
            <div className="flex items-center gap-3 p-2 -m-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <Circle className="w-4 h-4 text-gray-400 dark:text-gray-500 stroke-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">Chat interface migration</div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">Dec 25</div>
            </div>
          </div>
        </Card>

        {/* Today's Focus Widget */}
        <Card className="relative">
          <div className="flex items-center justify-center w-6 h-6 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab absolute top-4 right-12">
            <GripVertical className="w-4 h-4" />
          </div>
          
          {/* Header with improved spacing */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Today's focus</h3>
            <button className="flex items-center justify-center w-8 h-8 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
          
          {/* Schedule items with better structure */}
          <div className="space-y-5">
            <div className="flex items-start gap-4 p-3 -m-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div className="flex flex-col items-center text-center min-w-[60px] pt-1">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">9:00</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">AM</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">Design review</div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">UI migration team</span>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4 p-3 -m-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div className="flex flex-col items-center text-center min-w-[60px] pt-1">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">2:30</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">PM</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">Code review session</div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full flex-shrink-0"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Development team</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Agent Status Widget */}
        <Card className="relative">
          <div className="flex items-center justify-center w-6 h-6 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab absolute top-4 right-12">
            <GripVertical className="w-4 h-4" />
          </div>
          
          {/* Header with settings button */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Agent status</h3>
            <button className="flex items-center justify-center w-8 h-8 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
          
          {/* Agent list with improved layout */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 -m-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white">General assistant</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Llama 3.1 70B</div>
              </div>
              <div className="px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full font-medium flex-shrink-0">Active</div>
            </div>
            <div className="flex items-center gap-3 p-3 -m-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div className="w-3 h-3 bg-gray-400 dark:bg-gray-500 rounded-full flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white">Research helper</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Mixtral 8x7B</div>
              </div>
              <div className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full font-medium flex-shrink-0">Offline</div>
            </div>
          </div>
        </Card>

        {/* Quick Actions Widget */}
        <Card className="relative">
          <div className="flex items-center justify-center w-6 h-6 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab absolute top-4 right-12">
            <GripVertical className="w-4 h-4" />
          </div>
          
          {/* Header with settings */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick actions</h3>
            <button className="flex items-center justify-center w-8 h-8 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
          
          {/* Action grid with improved styling */}
          <div className="grid grid-cols-2 gap-3">
            <button className="flex flex-col items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl transition-all duration-200 hover:scale-[1.02] group">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">New chat</span>
            </button>
            <button className="flex flex-col items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl transition-all duration-200 hover:scale-[1.02] group">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Create task</span>
            </button>
            <button className="flex flex-col items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl transition-all duration-200 hover:scale-[1.02] group">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                <FolderPlus className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Create project</span>
            </button>
            <button className="flex flex-col items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl transition-all duration-200 hover:scale-[1.02] group">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors">
                <LayoutTemplate className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Open canvas</span>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
