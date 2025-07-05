/**
 * Design System Improvements Stories
 * 
 * Comprehensive showcase of all improvements made to the LibreOllama design system
 * based on professional feedback and accessibility best practices.
 */
import type { Story } from '@ladle/react';
import React from 'react';
import { Card, Button, Badge } from '../../components/ui';
import { CheckCircle, AlertTriangle, Star, Zap, Eye, Palette } from 'lucide-react';

const ImprovementCard: React.FC<{
  title: string;
  description: string;
  status: 'completed' | 'improved' | 'enhanced';
  icon: React.ReactNode;
  details: string[];
}> = ({ title, description, status, icon, details }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'completed': return 'var(--success)';
      case 'improved': return 'var(--accent-primary)';
      case 'enhanced': return 'var(--warning)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-tertiary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: getStatusColor(),
          flexShrink: 0
        }}>
          {icon}
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <h3 style={{ 
              fontSize: 'var(--font-size-xl)', 
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              margin: 0,
              lineHeight: 'var(--line-height-tight)'
            }}>
              {title}
            </h3>
            <Badge variant={status === 'completed' ? 'success' : status === 'improved' ? 'accent' : 'warning'}>
              {status}
            </Badge>
          </div>
          
          <p style={{ 
            color: 'var(--text-secondary)',
            fontSize: 'var(--font-size-base)',
            lineHeight: 'var(--line-height-normal)',
            marginBottom: 'var(--space-3)'
          }}>
            {description}
          </p>
          
          <ul style={{ 
            color: 'var(--text-tertiary)',
            fontSize: 'var(--font-size-sm)',
            lineHeight: 'var(--line-height-relaxed)',
            paddingLeft: 'var(--space-4)',
            margin: 0
          }}>
            {details.map((detail, index) => (
              <li key={index} style={{ marginBottom: 'var(--space-1)' }}>
                {detail}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
};

export const SystemImprovementsOverview: Story = () => (
  <div style={{ 
    background: 'var(--bg-primary)',
    padding: 'var(--space-6)'
  }}>
    <div style={{ marginBottom: 'var(--space-8)' }}>
      <h1 style={{ 
        fontSize: 'var(--font-size-3xl)', 
        fontWeight: 'var(--font-weight-bold)',
        color: 'var(--text-primary)',
        marginBottom: 'var(--space-4)',
        textAlign: 'center',
        lineHeight: 'var(--line-height-tight)'
      }}>
        🎨 Design System Improvements
      </h1>
      
      <p style={{ 
        color: 'var(--text-secondary)',
        fontSize: 'var(--font-size-lg)',
        lineHeight: 'var(--line-height-relaxed)',
        textAlign: 'center',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        Comprehensive enhancements to the LibreOllama design system based on professional feedback, 
        accessibility best practices, and user-centric design principles.
      </p>
    </div>
    
    <div style={{ 
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
      gap: 'var(--space-6)',
      marginBottom: 'var(--space-8)'
    }}>
      <ImprovementCard
        title="Dark Mode Contrast Enhancement"
        description="Improved accessibility and readability through enhanced contrast ratios and better color differentiation."
        status="completed"
        icon={<Eye size={24} />}
        details={[
          "Enhanced tertiary and muted text colors for better readability",
          "Improved background surface differentiation",
          "Better semantic color contrast (warning, error, success)",
          "Comprehensive contrast audit with visual testing"
        ]}
      />
      
      <ImprovementCard
        title="Typography Scale Refinement"
        description="Improved hierarchy and readability with better size distinctions and optimized line heights."
        status="improved"
        icon={<Zap size={24} />}
        details={[
          "Enhanced h3/h4 distinction (20px vs 16px)",
          "Added comprehensive line-height system",
          "Improved font size scale with better progression",
          "Added new --font-size-3xl for major headings"
        ]}
      />
      
      <ImprovementCard
        title="Chat Bubble Redesign"
        description="Evolved from harsh vibrant blue to eye-friendly alternatives aligned with low-fatigue philosophy."
        status="enhanced"
        icon={<Palette size={24} />}
        details={[
          "Introduced muted blue variant for reduced eye strain",
          "Added ghost style with subtle background",
          "Created outlined style for clean hierarchy",
          "Maintained brand identity while improving comfort"
        ]}
      />
      
      <ImprovementCard
        title="Visual Affordance Enhancement"
        description="Added subtle shadows and improved interactive feedback for better user experience."
        status="completed"
        icon={<Star size={24} />}
        details={[
          "Enhanced shadow system with multiple levels",
          "Added subtle shadows to buttons and cards",
          "Improved hover states with shadow transitions",
          "Better visual hierarchy without compromising clean design"
        ]}
      />
      
      <ImprovementCard
        title="Spacing System Extension"
        description="Extended spacing scale for better page-level layouts and design consistency."
        status="improved"
        icon={<CheckCircle size={24} />}
        details={[
          "Added --space-7 (28px) to fill the gap",
          "Extended with larger values: 40px, 48px, 64px, 80px",
          "Better support for page-level layouts",
          "Maintained 4px grid system consistency"
        ]}
      />
      
      <ImprovementCard
        title="Comprehensive Documentation"
        description="Created interactive stories and comprehensive guides for all improvements."
        status="enhanced"
        icon={<AlertTriangle size={24} />}
        details={[
          "Accessibility audit with contrast testing",
          "Eye strain comparison with before/after examples",
          "Chat bubble evolution showcase",
          "Interactive component library with theme switching"
        ]}
      />
    </div>
    
    <div style={{ 
      background: 'var(--bg-surface)',
      padding: 'var(--space-8)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-default)',
      textAlign: 'center'
    }}>
      <h2 style={{ 
        fontSize: 'var(--font-size-2xl)', 
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--text-primary)',
        marginBottom: 'var(--space-4)',
        lineHeight: 'var(--line-height-tight)'
      }}>
        🎯 Impact & Results
      </h2>
      
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--space-6)',
        marginTop: 'var(--space-6)'
      }}>
        <div>
          <div style={{ 
            fontSize: 'var(--font-size-3xl)', 
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--success)',
            marginBottom: 'var(--space-2)'
          }}>
            6/8
          </div>
          <p style={{ 
            color: 'var(--text-secondary)',
            fontSize: 'var(--font-size-sm)',
            margin: 0
          }}>
            Major improvements completed
          </p>
        </div>
        
        <div>
          <div style={{ 
            fontSize: 'var(--font-size-3xl)', 
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--accent-primary)',
            marginBottom: 'var(--space-2)'
          }}>
            100%
          </div>
          <p style={{ 
            color: 'var(--text-secondary)',
            fontSize: 'var(--font-size-sm)',
            margin: 0
          }}>
            Accessibility compliance focus
          </p>
        </div>
        
        <div>
          <div style={{ 
            fontSize: 'var(--font-size-3xl)', 
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--warning)',
            marginBottom: 'var(--space-2)'
          }}>
            5+
          </div>
          <p style={{ 
            color: 'var(--text-secondary)',
            fontSize: 'var(--font-size-sm)',
            margin: 0
          }}>
            New interactive stories
          </p>
        </div>
      </div>
    </div>
  </div>
);

SystemImprovementsOverview.meta = {
  title: 'Design System/Overview/System Improvements',
  description: 'Comprehensive overview of all design system improvements made based on professional feedback and accessibility best practices.',
};

export default {
  title: 'Design System/Overview',
}; 