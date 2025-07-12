/**
 * LibreOllama Design System - Refined Design Tokens
 * 
 * Comprehensive showcase of the refined design tokens with muted blues,
 * warmer backgrounds, and improved typography hierarchy.
 */
import type { Story } from '@ladle/react';
import React from 'react';
import { 
  Palette, 
  Type, 
  Spacing, 
  Eye, 
  Layers, 
  Shadows,
  Moon,
  Sun,
  Zap,
  Heart
} from 'lucide-react';

// Enhanced Color Palette Component
const ColorPalette: React.FC = () => {
  const colorGroups = [
    {
      title: 'Primary Accent Colors',
      icon: <Zap size={20} />,
      colors: [
        { name: '--accent-primary', value: '#6366f1', description: 'Primary indigo - refined and professional' },
        { name: '--accent-secondary', value: '#4f46e5', description: 'Darker indigo for hover states' },
        { name: '--accent-text', value: '#818cf8', description: 'Lighter indigo for text accents' },
        { name: '--accent-bg', value: 'rgba(99, 102, 241, 0.2)', description: 'Accent background overlay' },
        { name: '--accent-soft', value: 'rgba(99, 102, 241, 0.12)', description: 'Subtle accent background' },
        { name: '--accent-ghost', value: 'rgba(99, 102, 241, 0.08)', description: 'Very subtle accent tint' },
      ]
    },
    {
      title: 'Semantic Colors',
      icon: <Heart size={20} />,
      colors: [
        { name: '--success', value: '#10b981', description: 'Success states and positive actions' },
        { name: '--warning', value: '#f59e0b', description: 'Warning states and caution' },
        { name: '--error', value: '#f87171', description: 'Error states and destructive actions' },
        { name: '--success-bg', value: 'rgba(16, 185, 129, 0.1)', description: 'Success background' },
        { name: '--warning-bg', value: 'rgba(245, 158, 11, 0.1)', description: 'Warning background' },
        { name: '--error-bg', value: 'rgba(248, 113, 113, 0.1)', description: 'Error background' },
      ]
    },
    {
      title: 'Text Hierarchy',
      icon: <Type size={20} />,
      colors: [
        { name: '--text-primary', value: '#f0f6fc', description: 'Primary text - highest contrast' },
        { name: '--text-secondary', value: '#c9d1d9', description: 'Secondary text - medium contrast' },
        { name: '--text-tertiary', value: '#b1bac4', description: 'Tertiary text - lower contrast' },
        { name: '--text-muted', value: '#8b949e', description: 'Muted text - lowest contrast' },
      ]
    },
    {
      title: 'Background System',
      icon: <Layers size={20} />,
      colors: [
        { name: '--bg-primary', value: '#0d1117', description: 'Primary background - main canvas' },
        { name: '--bg-secondary', value: '#1c2128', description: 'Secondary background - cards' },
        { name: '--bg-tertiary', value: '#262c36', description: 'Tertiary background - elevated elements' },
        { name: '--bg-surface', value: '#30363d', description: 'Surface background - interactive elements' },
        { name: '--bg-elevated', value: '#373e47', description: 'Elevated background - modals, dropdowns' },
        { name: '--bg-card', value: 'rgba(48, 54, 61, 0.5)', description: 'Card background with transparency' },
        { name: '--bg-glass', value: 'rgba(13, 17, 23, 0.4)', description: 'Glass morphism background' },
      ]
    },
    {
      title: 'Borders & Interaction',
      icon: <Eye size={20} />,
      colors: [
        { name: '--border-default', value: 'rgba(139, 148, 158, 0.18)', description: 'Default border color' },
        { name: '--border-subtle', value: 'rgba(139, 148, 158, 0.12)', description: 'Subtle border color' },
        { name: '--hover-bg', value: 'rgba(139, 148, 158, 0.1)', description: 'Hover background state' },
        { name: '--focus-ring', value: 'var(--accent-primary)', description: 'Focus ring color' },
      ]
    }
  ];

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 'var(--space-8)',
      padding: 'var(--space-6)',
      background: 'var(--bg-primary)',
      minHeight: '100vh'
    }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <h1 style={{ 
          fontSize: 'var(--font-size-4xl)', 
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-4)',
          lineHeight: 'var(--line-height-tight)',
          background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-text) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          🎨 Refined Design Tokens
        </h1>
        <p style={{ 
          color: 'var(--text-secondary)',
          fontSize: 'var(--font-size-lg)',
          lineHeight: 'var(--line-height-relaxed)',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          Professional color palette with muted blues, warmer backgrounds, and improved accessibility
        </p>
      </div>

      {colorGroups.map((group) => (
        <div key={group.title} style={{
          background: 'var(--bg-card)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-6)',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-6)'
          }}>
            <div style={{
              color: 'var(--accent-primary)',
              opacity: 0.8
            }}>
              {group.icon}
            </div>
            <h3 style={{ 
              fontSize: 'var(--font-size-2xl)', 
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              margin: 0
            }}>
              {group.title}
            </h3>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: 'var(--space-4)'
          }}>
            {group.colors.map((color) => (
              <div 
                key={color.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-4)',
                  padding: 'var(--space-4)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    background: color.value.includes('rgba') ? color.value : `var(${color.name})`,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    flexShrink: 0,
                    boxShadow: 'var(--shadow-sm)'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--space-1)'
                  }}>
                    {color.name}
                  </div>
                  <div style={{ 
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-secondary)',
                    lineHeight: 'var(--line-height-normal)'
                  }}>
                    {color.description}
                  </div>
                  {color.value && (
                    <div style={{ 
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--text-tertiary)',
                      fontFamily: 'var(--font-mono)',
                      marginTop: 'var(--space-1)'
                    }}>
                      {color.value}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Enhanced Typography Showcase
const TypographyShowcase: React.FC = () => {
  const typographyExamples = [
    { 
      element: 'h1', 
      size: 'var(--font-size-4xl)', 
      weight: 'var(--font-weight-bold)', 
      lineHeight: 'var(--line-height-tight)',
      usage: 'Page titles, major headings' 
    },
    { 
      element: 'h2', 
      size: 'var(--font-size-3xl)', 
      weight: 'var(--font-weight-bold)', 
      lineHeight: 'var(--line-height-tight)',
      usage: 'Section headings' 
    },
    { 
      element: 'h3', 
      size: 'var(--font-size-2xl)', 
      weight: 'var(--font-weight-semibold)', 
      lineHeight: 'var(--line-height-snug)',
      usage: 'Subsection headings' 
    },
    { 
      element: 'h4', 
      size: 'var(--font-size-xl)', 
      weight: 'var(--font-weight-semibold)', 
      lineHeight: 'var(--line-height-snug)',
      usage: 'Card titles, widget headings' 
    },
    { 
      element: 'body-lg', 
      size: 'var(--font-size-lg)', 
      weight: 'var(--font-weight-normal)', 
      lineHeight: 'var(--line-height-relaxed)',
      usage: 'Large body text, introductions' 
    },
    { 
      element: 'body', 
      size: 'var(--font-size-base)', 
      weight: 'var(--font-weight-normal)', 
      lineHeight: 'var(--line-height-normal)',
      usage: 'Standard body text' 
    },
    { 
      element: 'small', 
      size: 'var(--font-size-sm)', 
      weight: 'var(--font-weight-normal)', 
      lineHeight: 'var(--line-height-normal)',
      usage: 'Secondary text, labels' 
    },
    { 
      element: 'caption', 
      size: 'var(--font-size-xs)', 
      weight: 'var(--font-weight-normal)', 
      lineHeight: 'var(--line-height-normal)',
      usage: 'Captions, metadata, timestamps' 
    },
  ];

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 'var(--space-6)',
      padding: 'var(--space-6)',
      background: 'var(--bg-primary)',
      minHeight: '100vh'
    }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <h1 style={{ 
          fontSize: 'var(--font-size-4xl)', 
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-4)',
          lineHeight: 'var(--line-height-tight)'
        }}>
          📝 Typography System
        </h1>
        <p style={{ 
          color: 'var(--text-secondary)',
          fontSize: 'var(--font-size-lg)',
          lineHeight: 'var(--line-height-relaxed)',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          Refined typography scale with improved hierarchy and readability
        </p>
      </div>

      {typographyExamples.map((example) => (
        <div key={example.element} style={{
          padding: 'var(--space-6)',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-sm)',
          transition: 'all 0.2s ease'
        }}>
          <div style={{
            fontSize: example.size,
            fontWeight: example.weight,
            lineHeight: example.lineHeight,
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-4)',
            fontFamily: 'var(--font-sans)'
          }}>
            The refined design brings clarity and comfort to every interaction
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
            alignItems: 'center'
          }}>
            <div style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              padding: 'var(--space-2) var(--space-3)',
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)'
            }}>
              {example.element}
            </div>
            <div style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--text-tertiary)',
              fontFamily: 'var(--font-mono)'
            }}>
              {example.size} • {example.weight} • {example.lineHeight}
            </div>
            <div style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--text-secondary)',
              fontStyle: 'italic'
            }}>
              {example.usage}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Enhanced Spacing System
const SpacingShowcase: React.FC = () => {
  const spacingValues = [
    { name: '--space-1', value: '4px', usage: 'Tight spacing, small gaps' },
    { name: '--space-2', value: '8px', usage: 'Small spacing, icon gaps' },
    { name: '--space-3', value: '12px', usage: 'Medium-small spacing' },
    { name: '--space-4', value: '16px', usage: 'Standard spacing unit' },
    { name: '--space-5', value: '20px', usage: 'Medium spacing' },
    { name: '--space-6', value: '24px', usage: 'Large spacing, card padding' },
    { name: '--space-8', value: '32px', usage: 'Extra large spacing' },
    { name: '--space-10', value: '40px', usage: 'Section spacing' },
    { name: '--space-12', value: '48px', usage: 'Large section spacing' },
    { name: '--space-16', value: '64px', usage: 'Major layout spacing' },
  ];

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 'var(--space-6)',
      padding: 'var(--space-6)',
      background: 'var(--bg-primary)',
      minHeight: '100vh'
    }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <h1 style={{ 
          fontSize: 'var(--font-size-4xl)', 
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-4)',
          lineHeight: 'var(--line-height-tight)'
        }}>
          📐 Spacing System
        </h1>
        <p style={{ 
          color: 'var(--text-secondary)',
          fontSize: 'var(--font-size-lg)',
          lineHeight: 'var(--line-height-relaxed)',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          Consistent spacing scale based on 4px increments for perfect alignment
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: 'var(--space-4)'
      }}>
        {spacingValues.map((spacing) => (
          <div key={spacing.name} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-4)',
            padding: 'var(--space-4)',
            background: 'var(--bg-card)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div
              style={{
                width: `var(${spacing.name})`,
                height: '32px',
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-text) 100%)',
                borderRadius: 'var(--radius-sm)',
                flexShrink: 0,
                boxShadow: 'var(--shadow-sm)'
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ 
                fontFamily: 'var(--font-mono)', 
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-1)'
              }}>
                {spacing.name}
              </div>
              <div style={{ 
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--space-1)'
              }}>
                {spacing.value}
              </div>
              <div style={{ 
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-tertiary)',
                fontStyle: 'italic'
              }}>
                {spacing.usage}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Shadow System Showcase
const ShadowShowcase: React.FC = () => {
  const shadowLevels = [
    { name: '--shadow-xs', description: 'Minimal shadow for subtle depth' },
    { name: '--shadow-sm', description: 'Small shadow for cards' },
    { name: '--shadow-md', description: 'Medium shadow for elevated elements' },
    { name: '--shadow-lg', description: 'Large shadow for floating elements' },
    { name: '--shadow-xl', description: 'Extra large shadow for modals' },
    { name: '--shadow-2xl', description: 'Maximum shadow for overlays' },
  ];

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 'var(--space-8)',
      padding: 'var(--space-6)',
      background: 'var(--bg-primary)',
      minHeight: '100vh'
    }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <h1 style={{ 
          fontSize: 'var(--font-size-4xl)', 
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-4)',
          lineHeight: 'var(--line-height-tight)'
        }}>
          🌟 Shadow System
        </h1>
        <p style={{ 
          color: 'var(--text-secondary)',
          fontSize: 'var(--font-size-lg)',
          lineHeight: 'var(--line-height-relaxed)',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          Subtle shadows that create depth without overwhelming the interface
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 'var(--space-6)',
        padding: 'var(--space-6)'
      }}>
        {shadowLevels.map((shadow) => (
          <div key={shadow.name} style={{
            padding: 'var(--space-6)',
            background: 'var(--bg-card)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: `var(${shadow.name})`,
            textAlign: 'center',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-text) 100%)',
              borderRadius: 'var(--radius-lg)',
              margin: '0 auto var(--space-4)',
              boxShadow: `var(${shadow.name})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Shadows size={32} color="white" />
            </div>
            <div style={{ 
              fontFamily: 'var(--font-mono)', 
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-2)'
            }}>
              {shadow.name}
            </div>
            <div style={{ 
              fontSize: 'var(--font-size-xs)',
              color: 'var(--text-secondary)',
              lineHeight: 'var(--line-height-normal)'
            }}>
              {shadow.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Theme Comparison
const ThemeComparison: React.FC = () => {
  const [currentTheme, setCurrentTheme] = React.useState<'light' | 'dark'>('dark');

  React.useEffect(() => {
    document.documentElement.classList.toggle('light', currentTheme === 'light');
  }, [currentTheme]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 'var(--space-8)',
      padding: 'var(--space-6)',
      background: 'var(--bg-primary)',
      minHeight: '100vh'
    }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <h1 style={{ 
          fontSize: 'var(--font-size-4xl)', 
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-4)',
          lineHeight: 'var(--line-height-tight)'
        }}>
          🌙 Theme Comparison
        </h1>
        <p style={{ 
          color: 'var(--text-secondary)',
          fontSize: 'var(--font-size-lg)',
          lineHeight: 'var(--line-height-relaxed)',
          maxWidth: '600px',
          margin: '0 auto var(--space-6)'
        }}>
          Experience the refined dark and light themes with improved contrast and warmth
        </p>
        
        <button
          onClick={() => setCurrentTheme(currentTheme === 'dark' ? 'light' : 'dark')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-4) var(--space-6)',
            background: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          {currentTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          Switch to {currentTheme === 'dark' ? 'Light' : 'Dark'} Theme
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 'var(--space-6)'
      }}>
        <div style={{
          padding: 'var(--space-6)',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <h3 style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-4)'
          }}>
            Current Theme: {currentTheme === 'dark' ? 'Dark' : 'Light'}
          </h3>
          <div style={{
            padding: 'var(--space-4)',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            marginBottom: 'var(--space-4)'
          }}>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: 'var(--font-size-sm)',
              lineHeight: 'var(--line-height-relaxed)',
              margin: 0
            }}>
              This is how text appears in the current theme. Notice the refined contrast and comfortable reading experience.
            </p>
          </div>
          <div style={{
            display: 'flex',
            gap: 'var(--space-3)'
          }}>
            <div style={{
              padding: 'var(--space-2) var(--space-4)',
              background: 'var(--accent-primary)',
              color: 'white',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              Primary
            </div>
            <div style={{
              padding: 'var(--space-2) var(--space-4)',
              background: 'var(--success-bg)',
              color: 'var(--success)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              Success
            </div>
            <div style={{
              padding: 'var(--space-2) var(--space-4)',
              background: 'var(--warning-bg)',
              color: 'var(--warning)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              Warning
            </div>
          </div>
        </div>

        <div style={{
          padding: 'var(--space-6)',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <h3 style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-4)'
          }}>
            Chat Bubble Preview
          </h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)'
          }}>
            <div style={{
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--chat-bubble-bg)',
              border: '1px solid var(--chat-bubble-border)',
              borderRadius: 'var(--radius-lg)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--chat-bubble-text)'
            }}>
              System message with refined styling
            </div>
            <div style={{
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--accent-ghost)',
              border: '1px solid var(--accent-soft)',
              borderRadius: 'var(--radius-lg)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--accent-text)',
              alignSelf: 'flex-end',
              maxWidth: '80%'
            }}>
              User message with ghost styling
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Stories
export const Colors: Story = () => <ColorPalette />;
Colors.meta = {
  title: 'Design System/Colors',
  description: 'Refined color palette with muted indigo accents, warmer backgrounds, and improved semantic colors for professional workflows.',
};

export const Typography: Story = () => <TypographyShowcase />;
Typography.meta = {
  title: 'Design System/Typography',
  description: 'Enhanced typography scale with improved hierarchy, better line heights, and consistent font weights.',
};

export const Spacing: Story = () => <SpacingShowcase />;
Spacing.meta = {
  title: 'Design System/Spacing',
  description: 'Systematic spacing scale based on 4px increments for perfect alignment and consistency.',
};

export const Shadows: Story = () => <ShadowShowcase />;
Shadows.meta = {
  title: 'Design System/Shadows',
  description: 'Subtle shadow system that creates depth without overwhelming the interface.',
};

export const Themes: Story = () => <ThemeComparison />;
Themes.meta = {
  title: 'Design System/Themes',
  description: 'Interactive theme comparison showcasing the refined dark and light themes.',
};

export default {
  title: 'Design System/Foundation',
}; 