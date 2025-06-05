import { useState, useEffect, useCallback, useRef } from 'react';

export interface FocusModeOptions {
  typewriterScrolling: boolean;
  sentenceHighlighting: boolean;
  pomodoroTimer: boolean;
  reducedMotion: boolean;
  densityMode: 'compact' | 'comfortable' | 'spacious';
}

export interface PomodoroState {
  isActive: boolean;
  timeRemaining: number; // in seconds
  currentSession: 'focus' | 'break';
  sessionCount: number;
}

export interface FocusModeState {
  isActive: boolean;
  options: FocusModeOptions;
  pomodoro: PomodoroState;
}

const DEFAULT_FOCUS_OPTIONS: FocusModeOptions = {
  typewriterScrolling: false,
  sentenceHighlighting: false,
  pomodoroTimer: false,
  reducedMotion: false,
  densityMode: 'comfortable'
};

const DEFAULT_POMODORO_STATE: PomodoroState = {
  isActive: false,
  timeRemaining: 25 * 60, // 25 minutes
  currentSession: 'focus',
  sessionCount: 0
};

export function useFocusMode() {
  const [focusMode, setFocusMode] = useState<FocusModeState>({
    isActive: false,
    options: DEFAULT_FOCUS_OPTIONS,
    pomodoro: DEFAULT_POMODORO_STATE
  });

  const pomodoroIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Toggle focus mode
  const toggleFocusMode = useCallback(() => {
    setFocusMode(prev => ({
      ...prev,
      isActive: !prev.isActive
    }));
  }, []);

  // Toggle specific focus features
  const toggleFocusOption = useCallback((option: keyof FocusModeOptions, value?: any) => {
    setFocusMode(prev => ({
      ...prev,
      options: {
        ...prev.options,
        [option]: value !== undefined ? value : !prev.options[option]
      }
    }));
  }, []);

  // Start/stop Pomodoro timer
  const togglePomodoroTimer = useCallback(() => {
    setFocusMode(prev => {
      const newPomodoroActive = !prev.pomodoro.isActive;
      
      if (newPomodoroActive) {
        // Start timer
        return {
          ...prev,
          options: { ...prev.options, pomodoroTimer: true },
          pomodoro: {
            ...prev.pomodoro,
            isActive: true,
            timeRemaining: prev.pomodoro.currentSession === 'focus' ? 25 * 60 : 5 * 60
          }
        };
      } else {
        // Stop timer
        return {
          ...prev,
          options: { ...prev.options, pomodoroTimer: false },
          pomodoro: {
            ...prev.pomodoro,
            isActive: false
          }
        };
      }
    });
  }, []);

  // Skip to next Pomodoro session
  const skipPomodoroSession = useCallback(() => {
    setFocusMode(prev => {
      const isBreakTime = prev.pomodoro.currentSession === 'focus';
      const newSessionCount = isBreakTime ? prev.pomodoro.sessionCount + 1 : prev.pomodoro.sessionCount;
      
      return {
        ...prev,
        pomodoro: {
          ...prev.pomodoro,
          currentSession: isBreakTime ? 'break' : 'focus',
          timeRemaining: isBreakTime ? 5 * 60 : 25 * 60,
          sessionCount: newSessionCount,
          isActive: false // Stop timer when skipping
        }
      };
    });
  }, []);

  // Reset Pomodoro timer
  const resetPomodoroTimer = useCallback(() => {
    setFocusMode(prev => ({
      ...prev,
      pomodoro: {
        ...DEFAULT_POMODORO_STATE,
        currentSession: prev.pomodoro.currentSession // Keep current session type
      }
    }));
  }, []);

  // Pomodoro timer logic
  useEffect(() => {
    if (focusMode.pomodoro.isActive && focusMode.pomodoro.timeRemaining > 0) {
      pomodoroIntervalRef.current = setInterval(() => {
        setFocusMode(prev => ({
          ...prev,
          pomodoro: {
            ...prev.pomodoro,
            timeRemaining: prev.pomodoro.timeRemaining - 1
          }
        }));
      }, 1000);
    } else if (focusMode.pomodoro.timeRemaining === 0 && focusMode.pomodoro.isActive) {
      // Session completed
      setFocusMode(prev => {
        const isBreakTime = prev.pomodoro.currentSession === 'focus';
        const newSessionCount = isBreakTime ? prev.pomodoro.sessionCount + 1 : prev.pomodoro.sessionCount;
        
        return {
          ...prev,
          pomodoro: {
            ...prev.pomodoro,
            currentSession: isBreakTime ? 'break' : 'focus',
            timeRemaining: isBreakTime ? 5 * 60 : 25 * 60,
            sessionCount: newSessionCount,
            isActive: false // Auto-stop after each session
          }
        };
      });

      // Show subtle notification
      if (window.Notification && Notification.permission === 'granted') {
        new Notification('Focus Session Complete', {
          body: focusMode.pomodoro.currentSession === 'focus' 
            ? 'Time for a short break!' 
            : 'Ready for another focus session?',
          icon: '/favicon.ico',
          silent: true
        });
      }
    } else {
      if (pomodoroIntervalRef.current) {
        clearInterval(pomodoroIntervalRef.current);
        pomodoroIntervalRef.current = null;
      }
    }

    return () => {
      if (pomodoroIntervalRef.current) {
        clearInterval(pomodoroIntervalRef.current);
      }
    };
  }, [focusMode.pomodoro.isActive, focusMode.pomodoro.timeRemaining, focusMode.pomodoro.currentSession]);

  // Format time for display
  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape to exit focus mode
      if (event.key === 'Escape' && focusMode.isActive) {
        event.preventDefault();
        setFocusMode(prev => ({ ...prev, isActive: false }));
        return;
      }
      
      // Ctrl/Cmd + . to toggle focus mode
      if ((event.ctrlKey || event.metaKey) && event.key === '.') {
        event.preventDefault();
        toggleFocusMode();
        return;
      }
      
      // Ctrl/Cmd + Shift + F to toggle focus mode (alternative)
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'F') {
        event.preventDefault();
        toggleFocusMode();
        return;
      }
      
      // Ctrl/Cmd + T to toggle typewriter scrolling (only in focus mode)
      if ((event.ctrlKey || event.metaKey) && event.key === 't' && focusMode.isActive) {
        event.preventDefault();
        toggleFocusOption('typewriterScrolling');
        return;
      }
      
      // Ctrl/Cmd + H to toggle sentence highlighting (only in focus mode)
      if ((event.ctrlKey || event.metaKey) && event.key === 'h' && focusMode.isActive) {
        event.preventDefault();
        toggleFocusOption('sentenceHighlighting');
        return;
      }
      
      // Ctrl/Cmd + P to toggle Pomodoro timer (only in focus mode)
      if ((event.ctrlKey || event.metaKey) && event.key === 'p' && focusMode.isActive) {
        event.preventDefault();
        togglePomodoroTimer();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusMode.isActive, toggleFocusMode, toggleFocusOption, togglePomodoroTimer]);

  return {
    focusMode,
    toggleFocusMode,
    toggleFocusOption,
    togglePomodoroTimer,
    skipPomodoroSession,
    resetPomodoroTimer,
    formatTime
  };
}