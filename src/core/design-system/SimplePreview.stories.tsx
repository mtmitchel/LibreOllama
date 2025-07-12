/**
 * Simple Design System Preview
 * 
 * Simplified showcase of the refined design system focusing on the core improvements:
 * muted blues, improved typography, and modern styling.
 */
import type { Story } from '@ladle/react';
import React, { useState } from 'react';
import { 
  MessageSquare, 
  Settings, 
  Search, 
  Star,
  Moon,
  Sun,
  Sparkles,
  Plus
} from 'lucide-react';

const SimpleDesignPreview: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  React.useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      padding: 'var(--space-6)',
      transition: 'all 0.3s ease'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'var(--space-8)',
        padding: 'var(--space-4)',
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-2xl)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-text) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <span style={{ color: 'white', fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-sm)' }}>L</span>
          </div>
          <h1 style={{ 
            fontWeight: 'var(--font-weight-semibold)', 
            fontSize: 'var(--font-size-2xl)', 
            color: 'var(--text-primary)',
            margin: 0
          }}>
            LibreOllama Design System
          </h1>
        </div>
        
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          style={{
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-xl)',
            background: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)',
            boxShadow: 'var(--shadow-md)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--accent-secondary)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--accent-primary)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          Switch to {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
      </div>

      {/* Color Palette Preview */}
      <div style={{
        marginBottom: 'var(--space-8)',
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-2xl)',
        padding: 'var(--space-6)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <h2 style={{
          fontSize: 'var(--font-size-3xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-6)',
          textAlign: 'center'
        }}>
          🎨 Refined Color Palette
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-4)'
        }}>
          <div style={{
            padding: 'var(--space-4)',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{
              width: '100%',
              height: '60px',
              background: 'var(--accent-primary)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: 'var(--space-3)',
              boxShadow: 'var(--shadow-sm)'
            }} />
            <h4 style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--text-primary)',
              margin: '0 0 var(--space-1) 0'
            }}>
              Primary Accent
            </h4>
            <p style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--text-secondary)',
              margin: 0,
              fontFamily: 'var(--font-mono)'
            }}>
              #6366f1
            </p>
          </div>

          <div style={{
            padding: 'var(--space-4)',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{
              width: '100%',
              height: '60px',
              background: 'var(--accent-ghost)',
              border: '1px solid var(--accent-soft)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: 'var(--space-3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{
                color: 'var(--accent-text)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)'
              }}>
                Ghost Style
              </span>
            </div>
            <h4 style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--text-primary)',
              margin: '0 0 var(--space-1) 0'
            }}>
              Accent Ghost
            </h4>
            <p style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--text-secondary)',
              margin: 0,
              fontFamily: 'var(--font-mono)'
            }}>
              rgba(99, 102, 241, 0.08)
            </p>
          </div>

          <div style={{
            padding: 'var(--space-4)',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{
              width: '100%',
              height: '60px',
              background: 'var(--success)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: 'var(--space-3)',
              boxShadow: 'var(--shadow-sm)'
            }} />
            <h4 style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--text-primary)',
              margin: '0 0 var(--space-1) 0'
            }}>
              Success
            </h4>
            <p style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--text-secondary)',
              margin: 0,
              fontFamily: 'var(--font-mono)'
            }}>
              #10b981
            </p>
          </div>
        </div>
      </div>

      {/* Typography Preview */}
      <div style={{
        marginBottom: 'var(--space-8)',
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-2xl)',
        padding: 'var(--space-6)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <h2 style={{
          fontSize: 'var(--font-size-3xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-6)',
          textAlign: 'center'
        }}>
          📝 Enhanced Typography
        </h2>
        
        <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: 'var(--font-size-4xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--text-primary)',
            lineHeight: 'var(--line-height-tight)',
            marginBottom: 'var(--space-4)'
          }}>
            Heading 1 - Page Titles
          </h1>
          
          <h2 style={{
            fontSize: 'var(--font-size-3xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--text-primary)',
            lineHeight: 'var(--line-height-tight)',
            marginBottom: 'var(--space-4)'
          }}>
            Heading 2 - Section Titles
          </h2>
          
          <h3 style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            lineHeight: 'var(--line-height-snug)',
            marginBottom: 'var(--space-4)'
          }}>
            Heading 3 - Subsections
          </h3>
          
          <p style={{
            fontSize: 'var(--font-size-lg)',
            color: 'var(--text-secondary)',
            lineHeight: 'var(--line-height-relaxed)',
            marginBottom: 'var(--space-4)'
          }}>
            Large body text for introductions and important content. This size provides excellent readability while establishing clear hierarchy.
          </p>
          
          <p style={{
            fontSize: 'var(--font-size-base)',
            color: 'var(--text-secondary)',
            lineHeight: 'var(--line-height-normal)',
            marginBottom: 'var(--space-4)'
          }}>
            Standard body text used throughout the interface. Optimized for comfortable reading during extended work sessions with improved line heights and spacing.
          </p>
          
          <p style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--text-tertiary)',
            lineHeight: 'var(--line-height-normal)'
          }}>
            Small text for secondary information, labels, and metadata.
          </p>
        </div>
      </div>

      {/* Component Examples */}
      <div style={{
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-2xl)',
        padding: 'var(--space-6)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <h2 style={{
          fontSize: 'var(--font-size-3xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-6)',
          textAlign: 'center'
        }}>
          🔧 Component Examples
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'var(--space-6)'
        }}>
          {/* Chat Message Example */}
          <div style={{
            padding: 'var(--space-4)',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)'
          }}>
            <h4 style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-4)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)'
            }}>
              <MessageSquare size={20} style={{ color: 'var(--accent-primary)' }} />
              Chat Messages
            </h4>
            
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--chat-bubble-bg)',
                border: '1px solid var(--chat-bubble-border)',
                borderRadius: 'var(--radius-2xl)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--chat-bubble-text)',
                marginBottom: 'var(--space-3)'
              }}>
                System message with refined styling
              </div>
              
              <div style={{
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--accent-ghost)',
                border: '1px solid var(--accent-soft)',
                borderRadius: 'var(--radius-2xl)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--accent-text)',
                marginLeft: 'var(--space-8)'
              }}>
                User message with ghost styling
              </div>
            </div>
          </div>

          {/* Navigation Example */}
          <div style={{
            padding: 'var(--space-4)',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)'
          }}>
            <h4 style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-4)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)'
            }}>
              <Settings size={20} style={{ color: 'var(--accent-primary)' }} />
              Navigation
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <button style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--accent-soft)',
                color: 'var(--accent-text)',
                border: 'none',
                borderRadius: 'var(--radius-xl)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left'
              }}>
                <Star size={16} />
                Active Item
              </button>
              
              <button style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-3) var(--space-4)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: 'none',
                borderRadius: 'var(--radius-xl)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--hover-bg)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
              >
                <Search size={16} />
                Hover Item
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DesignSystemPreview: Story = () => <SimpleDesignPreview />;
DesignSystemPreview.meta = {
  title: 'Design System/Simple Preview',
  description: 'Simplified preview of the refined LibreOllama design system showcasing colors, typography, and components.',
};

export default {
  title: 'Design System/Simple',
}; 