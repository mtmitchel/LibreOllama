import React from 'react';
import { useFocusUtilities } from '@/lib/focus-utilities';

interface FocusDemoProps {
  className?: string;
}

export function FocusDemo({ className = '' }: FocusDemoProps) {
  const focusUtilities = useFocusUtilities({ autoApply: true });

  return (
    <div 
      ref={focusUtilities.ref as React.RefObject<HTMLDivElement>}
      className={`p-6 max-w-4xl mx-auto ${className}`}
      contentEditable
      suppressContentEditableWarning
    >
      <h1 className="text-2xl font-bold mb-4">Enhanced Focus Mode Demo</h1>
      
      <p>
        This is a demonstration of the enhanced focus mode for LibreOllama Desktop. 
        The focus mode includes several ADHD-friendly features designed to improve 
        concentration and reduce distractions during work sessions.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-3">Typewriter Scrolling</h2>
      <p>
        When typewriter scrolling is enabled, the current line or cursor position 
        automatically stays in the optimal reading position on the screen. This 
        reduces eye strain and helps maintain focus by keeping the active content 
        in a comfortable viewing area.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-3">Sentence Highlighting</h2>
      <p>
        Sentence highlighting provides visual feedback by subtly highlighting the 
        current sentence being read or edited. This feature helps users maintain 
        their place in the text and improves reading comprehension, especially 
        beneficial for users with ADHD.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-3">Distraction Elimination</h2>
      <p>
        Focus mode hides non-essential UI elements and creates a clean, minimal 
        workspace. This reduces visual clutter and helps users concentrate on 
        their current task without being distracted by peripheral interface elements.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-3">Pomodoro Integration</h2>
      <p>
        The optional Pomodoro timer encourages healthy work patterns with 
        structured focus sessions and breaks. The timer provides gentle visual 
        reminders without being intrusive or breaking concentration.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-3">Accessibility Features</h2>
      <p>
        The focus mode respects user preferences for reduced motion and high 
        contrast. It includes customizable density modes (compact, comfortable, 
        spacious) to accommodate different visual processing preferences.
      </p>

      <div className="mt-8 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
        <h3 className="font-semibold text-blue-900">Try It Out</h3>
        <p className="text-blue-800 mt-2">
          Click in this text area and start typing or moving your cursor around. 
          If focus mode features are enabled, you should see typewriter scrolling 
          and sentence highlighting in action. Use Ctrl+. (Cmd+. on Mac) to toggle 
          focus mode, or press Escape to exit.
        </p>
      </div>
    </div>
  );
}