/**
 * Chat Bubble Improvement Stories
 * 
 * Demonstrates the evolution from harsh vibrant blue to muted, 
 * eye-friendly chat bubble designs that align with the low-fatigue philosophy.
 */
import type { Story } from '@ladle/react';
import React from 'react';
import { Card } from '../../components/ui';
import { User, Bot } from 'lucide-react';

const ChatMessage: React.FC<{
  message: string;
  isUser: boolean;
  variant: 'original' | 'muted' | 'ghost' | 'outlined';
}> = ({ message, isUser, variant }) => {
  const getStyles = () => {
    if (!isUser) {
      return {
        background: 'var(--bg-surface)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-default)'
      };
    }

    switch (variant) {
      case 'original':
        return {
          background: '#3b82f6', // Harsh vibrant blue
          color: 'white',
          border: 'none'
        };
      case 'muted':
        return {
          background: 'var(--accent-muted)',
          color: 'white',
          border: 'none'
        };
      case 'ghost':
        return {
          background: 'var(--accent-ghost)',
          color: 'var(--accent-primary)',
          border: '1px solid var(--accent-soft)'
        };
      case 'outlined':
        return {
          background: 'var(--bg-surface)',
          color: 'var(--accent-primary)',
          border: '1px solid var(--accent-primary)'
        };
      default:
        return {};
    }
  };

  const styles = getStyles();

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 'var(--space-4)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--space-3)',
        maxWidth: '70%',
        flexDirection: isUser ? 'row-reverse' : 'row'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: isUser ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          {isUser ? 
            <User size={16} style={{ color: 'white' }} /> : 
            <Bot size={16} style={{ color: 'var(--text-secondary)' }} />
          }
        </div>
        
        <div style={{
          ...styles,
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-lg)',
          fontSize: 'var(--font-size-sm)',
          lineHeight: '1.5'
        }}>
          {message}
        </div>
      </div>
    </div>
  );
};

const ChatConversation: React.FC<{ variant: 'original' | 'muted' | 'ghost' | 'outlined' }> = ({ variant }) => (
  <div style={{
    background: 'var(--bg-primary)',
    padding: 'var(--space-6)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-default)',
    height: '400px',
    overflowY: 'auto'
  }}>
    <ChatMessage 
      message="Hi! I'm working on a design system for my app. Can you help me choose colors that won't cause eye strain during long work sessions?"
      isUser={true}
      variant={variant}
    />
    
    <ChatMessage 
      message="Absolutely! Eye strain is a crucial consideration for professional applications. I'd recommend moving away from pure whites and harsh blues toward warmer, more muted tones."
      isUser={false}
      variant={variant}
    />
    
    <ChatMessage 
      message="That makes sense. What about the chat bubbles themselves? The current blue feels quite intense."
      isUser={true}
      variant={variant}
    />
    
    <ChatMessage 
      message="Great observation! Vibrant blues can be jarring, especially in extended conversations. Consider using muted blues, outlined styles, or subtle background tints instead."
      isUser={false}
      variant={variant}
    />
    
    <ChatMessage 
      message="Perfect! This approach aligns much better with the low-fatigue philosophy. Thank you!"
      isUser={true}
      variant={variant}
    />
  </div>
);

export const ChatBubbleComparison: Story = () => (
  <div style={{ 
    background: 'var(--bg-primary)',
    padding: 'var(--space-6)'
  }}>
    <h2 style={{ 
      fontSize: 'var(--font-size-2xl)', 
      fontWeight: 'var(--font-weight-semibold)',
      color: 'var(--text-primary)',
      marginBottom: 'var(--space-6)',
      textAlign: 'center'
    }}>
      💬 Chat Bubble Evolution
    </h2>
    
    <div style={{ 
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 'var(--space-6)',
      marginBottom: 'var(--space-8)'
    }}>
      <div>
        <h3 style={{ 
          fontSize: 'var(--font-size-xl)', 
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-4)',
          textAlign: 'center'
        }}>
          ❌ Original (Harsh Blue)
        </h3>
        <ChatConversation variant="original" />
        <p style={{ 
          color: 'var(--text-secondary)',
          fontSize: 'var(--font-size-sm)',
          textAlign: 'center',
          marginTop: 'var(--space-3)'
        }}>
          Vibrant blue conflicts with low-fatigue goals
        </p>
      </div>
      
      <div>
        <h3 style={{ 
          fontSize: 'var(--font-size-xl)', 
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-4)',
          textAlign: 'center'
        }}>
          ✅ Improved (Muted Blue)
        </h3>
        <ChatConversation variant="muted" />
        <p style={{ 
          color: 'var(--text-secondary)',
          fontSize: 'var(--font-size-sm)',
          textAlign: 'center',
          marginTop: 'var(--space-3)'
        }}>
          Softer blue maintains identity while reducing strain
        </p>
      </div>
    </div>
    
    <div style={{ 
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 'var(--space-6)'
    }}>
      <div>
        <h3 style={{ 
          fontSize: 'var(--font-size-xl)', 
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-4)',
          textAlign: 'center'
        }}>
          🌟 Ghost Style
        </h3>
        <ChatConversation variant="ghost" />
        <p style={{ 
          color: 'var(--text-secondary)',
          fontSize: 'var(--font-size-sm)',
          textAlign: 'center',
          marginTop: 'var(--space-3)'
        }}>
          Subtle background with colored text
        </p>
      </div>
      
      <div>
        <h3 style={{ 
          fontSize: 'var(--font-size-xl)', 
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-4)',
          textAlign: 'center'
        }}>
          📝 Outlined Style
        </h3>
        <ChatConversation variant="outlined" />
        <p style={{ 
          color: 'var(--text-secondary)',
          fontSize: 'var(--font-size-sm)',
          textAlign: 'center',
          marginTop: 'var(--space-3)'
        }}>
          Clean outline maintains visual hierarchy
        </p>
      </div>
    </div>
  </div>
);

ChatBubbleComparison.meta = {
  title: 'Design System/Chat/Bubble Improvement',
  description: 'Evolution from harsh vibrant blue to eye-friendly chat bubble designs aligned with low-fatigue philosophy.',
};

export default {
  title: 'Design System/Chat',
}; 