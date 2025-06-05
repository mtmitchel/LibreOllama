import { AIChatScreen } from './screens/AIChatScreen';

/**
 * Demo component for the new AI Chat Screen
 * This showcases the modern design system implementation
 * while preserving all existing functionality from EnhancedChatInterface
 */
export function AIChatDemo() {
  return (
    <div className="h-screen w-full">
      <AIChatScreen />
    </div>
  );
}

export default AIChatDemo;