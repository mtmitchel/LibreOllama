/**
 * Design Tokens Stories
 * 
 * This story showcases all the design tokens defined in your design system,
 * serving as both documentation and a visual reference for developers.
 */
import type { Story } from '@ladle/react';
import React from 'react';

// Color palette component
const ColorPalette: React.FC = () => {
  const colorGroups = [
    {
      title: 'Primary Colors',
      colors: [
        { name: '--accent-primary', description: 'Primary accent color for actions and highlights' },
        { name: '--accent-secondary', description: 'Darker shade for hover/pressed states' },
        { name: '--accent-soft', description: 'Subtle background for active/selected items' },
      ]
    },
    {
      title: 'Semantic Colors',
      colors: [
        { name: '--success', description: 'Success states and positive actions' },
        { name: '--warning', description: 'Warning states and caution' },
        { name: '--error', description: 'Error states and destructive actions' },
      ]
    },
    {
      title: 'Text Colors',
      colors: [
        { name: '--text-primary', description: 'Primary text color' },
        { name: '--text-secondary', description: 'Secondary text color' },
        { name: '--text-tertiary', description: 'Tertiary text color' },
        { name: '--text-muted', description: 'Muted text color' },
      ]
    },
    {
      title: 'Background Colors',
      colors: [
        { name: '--bg-primary', description: 'Primary background' },
        { name: '--bg-secondary', description: 'Secondary background' },
        { name: '--bg-tertiary', description: 'Tertiary background' },
        { name: '--bg-surface', description: 'Surface background for cards' },
        { name: '--bg-elevated', description: 'Elevated surface background' },
      ]
    },
    {
      title: 'Border Colors',
      colors: [
        { name: '--border-subtle', description: 'Subtle borders' },
        { name: '--border-default', description: 'Default borders' },
      ]
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      {colorGroups.map((group) => (
        <div key={group.title}>
          <h3 style={{ 
            fontSize: 'var(--font-size-xl)', 
            fontWeight: 'var(--font-weight-semibold)',
            marginBottom: 'var(--space-4)',
            color: 'var(--text-primary)'
          }}>
            {group.title}
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'var(--space-4)'
          }}>
            {group.colors.map((color) => (
              <div 
                key={color.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    background: `var(${color.name})`,
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--text-primary)'
                  }}>
                    {color.name}
                  </div>
                  <div style={{ 
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--text-secondary)',
                    marginTop: 'var(--space-1)'
                  }}>
                    {color.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Typography showcase component
const TypographyShowcase: React.FC = () => {
  const typographyExamples = [
    { element: 'h1', size: '32px', weight: '700', usage: 'Page titles (Dashboard, Settings)' },
    { element: 'h2', size: '24px', weight: '600', usage: 'Section headings' },
    { element: 'h3', size: '20px', weight: '600', usage: 'Widget titles, subsections' },
    { element: 'h4', size: '18px', weight: '600', usage: 'Card titles' },
    { element: 'body', size: '16px', weight: '400', usage: 'Standard body text' },
    { element: 'small', size: '14px', weight: '400', usage: 'Secondary text, labels' },
    { element: 'caption', size: '12px', weight: '400', usage: 'Captions, metadata' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {typographyExamples.map((example) => (
        <div key={example.element} style={{
          padding: 'var(--space-4)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
        }}>
          <div style={{
            fontSize: example.size,
            fontWeight: example.weight,
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-2)',
            fontFamily: 'var(--font-sans)'
          }}>
            The quick brown fox jumps over the lazy dog
          </div>
          <div style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)'
          }}>
            {example.element} • {example.size} • {example.weight} • {example.usage}
          </div>
        </div>
      ))}
    </div>
  );
};

// Spacing showcase component
const SpacingShowcase: React.FC = () => {
  const spacingValues = [
    { name: '--space-1', value: '4px' },
    { name: '--space-2', value: '8px' },
    { name: '--space-3', value: '12px' },
    { name: '--space-4', value: '16px' },
    { name: '--space-5', value: '20px' },
    { name: '--space-6', value: '24px' },
    { name: '--space-8', value: '32px' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {spacingValues.map((spacing) => (
        <div key={spacing.name} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-4)',
          padding: 'var(--space-3)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
        }}>
          <div
            style={{
              width: `var(${spacing.name})`,
              height: '24px',
              background: 'var(--accent-primary)',
              borderRadius: 'var(--radius-sm)',
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{ 
              fontFamily: 'var(--font-mono)', 
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--text-primary)'
            }}>
              {spacing.name}
            </div>
            <div style={{ 
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-secondary)'
            }}>
              {spacing.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Main stories
export const Colors: Story = () => <ColorPalette />;
Colors.meta = {
  title: 'Design System/Colors',
  description: 'Refined color palette optimized for professional workflows and extended reading sessions. Features warmer light mode backgrounds and sophisticated accent colors.',
};

export const Typography: Story = () => <TypographyShowcase />;
Typography.meta = {
  title: 'Design System/Typography',
  description: 'Typography scale and font usage guidelines.',
};

export const Spacing: Story = () => <SpacingShowcase />;
Spacing.meta = {
  title: 'Design System/Spacing',
  description: 'Spacing scale used throughout the application.',
};

export default {
  title: 'Design System/Foundation',
}; 