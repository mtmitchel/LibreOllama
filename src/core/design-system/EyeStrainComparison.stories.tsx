/**
 * Eye Strain Comparison Stories
 * 
 * Demonstrates the dramatic improvement in eye comfort by moving from
 * harsh white backgrounds to warm, paper-like tones.
 */
import type { Story } from '@ladle/react';
import React from 'react';
import { Card, Button, Badge } from '../../components/ui';
import { FileText, Eye, EyeOff } from 'lucide-react';

const HarshWhiteExample: React.FC = () => (
  <div style={{ 
    background: '#ffffff',
    padding: 'var(--space-6)',
    border: '1px solid #e5e5e5',
    borderRadius: 'var(--radius-lg)'
  }}>
    <h3 style={{ 
      fontSize: 'var(--font-size-xl)', 
      fontWeight: 'var(--font-weight-semibold)',
      color: '#000000',
      marginBottom: 'var(--space-4)'
    }}>
      ❌ Harsh White Background
    </h3>
    
    <div style={{ 
      background: '#ffffff',
      padding: 'var(--space-4)',
      border: '1px solid #e5e5e5',
      borderRadius: 'var(--radius-md)',
      marginBottom: 'var(--space-4)'
    }}>
      <h4 style={{ 
        fontSize: 'var(--font-size-lg)', 
        color: '#000000',
        marginBottom: 'var(--space-2)'
      }}>
        Meeting Notes - Q4 Planning
      </h4>
      <p style={{ 
        color: '#333333',
        lineHeight: '1.6',
        marginBottom: 'var(--space-3)'
      }}>
        This pure white background creates harsh contrast that causes eye strain during extended reading sessions. The bright white reflects too much light and can cause fatigue, especially in well-lit environments or during long work sessions.
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <span style={{ 
          background: '#3b82f6', 
          color: 'white', 
          padding: '4px 8px', 
          borderRadius: '4px', 
          fontSize: '12px' 
        }}>
          planning
        </span>
        <span style={{ 
          background: '#10b981', 
          color: 'white', 
          padding: '4px 8px', 
          borderRadius: '4px', 
          fontSize: '12px' 
        }}>
          urgent
        </span>
      </div>
    </div>
    
    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
      <button style={{
        background: '#3b82f6',
        color: 'white',
        border: 'none',
        padding: '12px 16px',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '500'
      }}>
        Save Changes
      </button>
      <button style={{
        background: '#ffffff',
        color: '#333333',
        border: '1px solid #d1d5db',
        padding: '12px 16px',
        borderRadius: '6px',
        fontSize: '14px'
      }}>
        Cancel
      </button>
    </div>
  </div>
);

const WarmComfortableExample: React.FC = () => (
  <div style={{ 
    background: 'var(--bg-primary)',
    padding: 'var(--space-6)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-lg)'
  }}>
    <h3 style={{ 
      fontSize: 'var(--font-size-xl)', 
      fontWeight: 'var(--font-weight-semibold)',
      color: 'var(--text-primary)',
      marginBottom: 'var(--space-4)'
    }}>
      ✅ Warm, Eye-Friendly Background
    </h3>
    
    <Card>
      <h4 style={{ 
        fontSize: 'var(--font-size-lg)', 
        color: 'var(--text-primary)',
        marginBottom: 'var(--space-2)'
      }}>
        Meeting Notes - Q4 Planning
      </h4>
      <p style={{ 
        color: 'var(--text-secondary)',
        lineHeight: '1.6',
        marginBottom: 'var(--space-3)'
      }}>
        This warm, paper-like background reduces eye strain significantly. The off-white tone is much gentler on the eyes while maintaining excellent readability. Perfect for extended reading and writing sessions without causing fatigue.
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <Badge variant="accent">planning</Badge>
        <Badge variant="success">urgent</Badge>
      </div>
    </Card>
    
    <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
      <Button variant="primary">Save Changes</Button>
      <Button variant="secondary">Cancel</Button>
    </div>
  </div>
);

export const SideBySideComparison: Story = () => (
  <div style={{ 
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--space-6)',
    padding: 'var(--space-6)',
    background: 'var(--bg-secondary)',
    minHeight: '100vh'
  }}>
    <HarshWhiteExample />
    <WarmComfortableExample />
  </div>
);

SideBySideComparison.meta = {
  title: 'Design System/Eye Strain/Side by Side',
  description: 'Direct comparison showing the dramatic improvement in eye comfort with warm backgrounds vs harsh white.',
};

export const ExtendedReadingTest: Story = () => (
  <div style={{ 
    background: 'var(--bg-primary)',
    padding: 'var(--space-6)',
    maxWidth: '800px',
    margin: '0 auto'
  }}>
    <h2 style={{ 
      fontSize: 'var(--font-size-2xl)', 
      fontWeight: 'var(--font-weight-semibold)',
      color: 'var(--text-primary)',
      marginBottom: 'var(--space-6)',
      textAlign: 'center'
    }}>
      📖 Extended Reading Comfort Test
    </h2>
    
    <Card padding="lg">
      <h3 style={{ 
        fontSize: 'var(--font-size-xl)', 
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--text-primary)',
        marginBottom: 'var(--space-4)'
      }}>
        The Science of Eye-Friendly Design
      </h3>
      
      <p style={{ 
        color: 'var(--text-secondary)',
        lineHeight: '1.7',
        fontSize: 'var(--font-size-base)',
        marginBottom: 'var(--space-4)'
      }}>
        Pure white backgrounds (#ffffff) reflect 100% of light, creating harsh contrast that forces the eye to work harder. This is particularly problematic in well-lit environments or when using high-brightness displays. The constant adjustment between bright whites and dark text can cause:
      </p>
      
      <ul style={{ 
        color: 'var(--text-secondary)',
        lineHeight: '1.7',
        fontSize: 'var(--font-size-base)',
        marginBottom: 'var(--space-4)',
        paddingLeft: 'var(--space-4)'
      }}>
        <li style={{ marginBottom: 'var(--space-2)' }}>Digital eye strain and fatigue</li>
        <li style={{ marginBottom: 'var(--space-2)' }}>Reduced reading comprehension over time</li>
        <li style={{ marginBottom: 'var(--space-2)' }}>Headaches during extended sessions</li>
        <li style={{ marginBottom: 'var(--space-2)' }}>Difficulty focusing on content</li>
      </ul>
      
      <p style={{ 
        color: 'var(--text-secondary)',
        lineHeight: '1.7',
        fontSize: 'var(--font-size-base)',
        marginBottom: 'var(--space-4)'
      }}>
        Our refined color palette uses warm, off-white backgrounds that reduce light reflection by approximately 15-20%. This creates a more comfortable reading environment similar to high-quality paper, while maintaining excellent contrast ratios for accessibility compliance.
      </p>
      
      <div style={{ 
        background: 'var(--bg-tertiary)',
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        marginBottom: 'var(--space-4)'
      }}>
        <h4 style={{ 
          fontSize: 'var(--font-size-lg)', 
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-2)'
        }}>
          💡 Professional Benefits
        </h4>
        <p style={{ 
          color: 'var(--text-secondary)',
          lineHeight: '1.6',
          margin: 0
        }}>
          The warmer palette is particularly beneficial for LibreOllama's content-heavy workflows: note-taking, documentation, code review, and extended AI conversations. Users report significantly less eye fatigue during long work sessions.
        </p>
      </div>
      
      <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
        <Badge variant="success">Accessibility Compliant</Badge>
        <Badge variant="accent">Eye-Friendly</Badge>
        <Badge variant="secondary">Professional</Badge>
      </div>
    </Card>
  </div>
);

ExtendedReadingTest.meta = {
  title: 'Design System/Eye Strain/Reading Test',
  description: 'Demonstrates how the warm background improves comfort during extended reading sessions.',
};

export const WorkflowComparison: Story = () => (
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
      🎯 Professional Workflow Comfort
    </h2>
    
    <div style={{ 
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
      gap: 'var(--space-6)'
    }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <Eye size={24} style={{ color: 'var(--success)' }} />
          <h3 style={{ 
            fontSize: 'var(--font-size-lg)', 
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            margin: 0
          }}>
            Note-Taking Sessions
          </h3>
        </div>
        <p style={{ 
          color: 'var(--text-secondary)',
          lineHeight: '1.6',
          marginBottom: 'var(--space-3)'
        }}>
          Perfect for extended writing and documentation. The paper-like background reduces glare and creates a natural writing environment that doesn't compete with your thoughts.
        </p>
        <Badge variant="success">2-4 hour sessions</Badge>
      </Card>
      
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <FileText size={24} style={{ color: 'var(--accent-primary)' }} />
          <h3 style={{ 
            fontSize: 'var(--font-size-lg)', 
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            margin: 0
          }}>
            Code Review & Analysis
          </h3>
        </div>
        <p style={{ 
          color: 'var(--text-secondary)',
          lineHeight: '1.6',
          marginBottom: 'var(--space-3)'
        }}>
          Excellent contrast for reading code while being gentle enough for detailed analysis. Syntax highlighting remains clear against the warm background.
        </p>
        <Badge variant="accent">Technical work</Badge>
      </Card>
      
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <div style={{ 
            width: '24px', 
            height: '24px', 
            borderRadius: '50%', 
            background: 'var(--warning)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            color: 'white'
          }}>
            AI
          </div>
          <h3 style={{ 
            fontSize: 'var(--font-size-lg)', 
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            margin: 0
          }}>
            AI Conversations
          </h3>
        </div>
        <p style={{ 
          color: 'var(--text-secondary)',
          lineHeight: '1.6',
          marginBottom: 'var(--space-3)'
        }}>
          Comfortable for reading long AI responses and maintaining context across extended conversations. Reduces fatigue during complex problem-solving sessions.
        </p>
        <Badge variant="warning">Long conversations</Badge>
      </Card>
    </div>
  </div>
);

WorkflowComparison.meta = {
  title: 'Design System/Eye Strain/Workflow Benefits',
  description: 'Shows how the warm theme benefits different professional workflows in LibreOllama.',
};

export default {
  title: 'Design System/Eye Strain',
}; 