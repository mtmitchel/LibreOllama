import React from 'react';
import { useFocusMode } from '@/hooks/use-focus-mode';

interface PomodoroTimerProps {
  className?: string;
}

export function PomodoroTimer({ className = '' }: PomodoroTimerProps) {
  const { focusMode, togglePomodoroTimer, skipPomodoroSession, resetPomodoroTimer, formatTime } = useFocusMode();
  const { pomodoro } = focusMode;

  if (!focusMode.options.pomodoroTimer) {
    return null;
  }

  const isActive = pomodoro.isActive;
  const timeRemaining = pomodoro.timeRemaining;
  const currentSession = pomodoro.currentSession;
  const sessionCount = pomodoro.sessionCount;

  // Calculate progress percentage
  const totalTime = currentSession === 'focus' ? 25 * 60 : 5 * 60;
  const progress = ((totalTime - timeRemaining) / totalTime) * 100;

  return (
    <div className={`bg-white/95 backdrop-blur border border-gray-200 rounded-lg shadow-lg p-3 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className={`h-2 w-2 rounded-full ${
            isActive 
              ? (currentSession === 'focus' ? 'bg-blue-500' : 'bg-green-500')
              : 'bg-gray-400'
          } ${isActive ? 'animate-pulse' : ''}`} />
          <span className="text-sm font-medium text-gray-900">
            {formatTime(timeRemaining)}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-xs px-2 py-1 rounded ${
            currentSession === 'focus' 
              ? 'bg-blue-50 text-blue-700' 
              : 'bg-green-50 text-green-700'
          }`}>
            {currentSession === 'focus' ? 'Focus Session' : 'Break Time'}
          </span>
          <button
            onClick={togglePomodoroTimer}
            className="text-gray-600 hover:text-gray-900 text-lg leading-none"
            title={isActive ? 'Pause Timer' : 'Start Timer'}
          >
            {isActive ? '⏸' : '▶'}
          </button>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
        <div 
          className={`h-1.5 rounded-full transition-all duration-300 ${
            currentSession === 'focus' ? 'bg-blue-600' : 'bg-green-600'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Session Count */}
      {sessionCount > 0 && (
        <div className="text-xs text-gray-500 text-center">
          Sessions completed: {sessionCount}
        </div>
      )}
      
      {/* Quick Actions */}
      <div className="flex justify-center space-x-2 mt-2">
        <button
          onClick={resetPomodoroTimer}
          className="text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100"
          title="Reset Timer"
        >
          Reset
        </button>
        <button
          onClick={skipPomodoroSession}
          className="text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100"
          title="Skip Session"
        >
          Skip
        </button>
      </div>
    </div>
  );
}