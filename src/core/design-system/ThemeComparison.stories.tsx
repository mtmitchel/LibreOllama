/**
 * Theme Comparison Stories
 * 
 * Demonstrates the refined theme improvements for LibreOllama,
 * showing how the new colors work across different content types and workflows.
 */
import type { Story } from '@ladle/react';
import React from 'react';
import { Card, Button, Badge, Input } from '../../components/ui';
import { FileText, CheckCircle, Clock, AlertTriangle, Settings, MessageSquare } from 'lucide-react';

// Mock content components to demonstrate theme improvements
const NoteCard: React.FC<{ title: string; content: string; tags: string[] }> = ({ title, content, tags }) => (
  <Card>
    <div style={{ marginBottom: 'var(--space-3)' }}>
      <h3 style={{ 
        fontSize: 'var(--font-size-lg)', 
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--text-primary)',
        marginBottom: 'var(--space-2)'
      }}>
        {title}
      </h3>
      <p style={{ 
        color: 'var(--text-secondary)',
        lineHeight: '1.6',
        marginBottom: 'var(--space-3)'
      }}>
        {content}
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary">{tag}</Badge>
        ))}
      </div>
    </div>
  </Card>
);

const TaskCard: React.FC<{ title: string; status: 'todo' | 'progress' | 'done'; priority: 'high' | 'medium' | 'low' }> = ({ title, status, priority }) => (
  <Card padding="default">
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
      <div style={{ flex: 1 }}>
        <h4 style={{ 
          fontSize: 'var(--font-size-base)', 
          fontWeight: 'var(--font-weight-medium)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-1)'
        }}>
          {title}
        </h4>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <Badge variant={status === 'done' ? 'success' : status === 'progress' ? 'accent' : 'secondary'}>
            {status === 'done' ? 'Done' : status === 'progress' ? 'In Progress' : 'To Do'}
          </Badge>
          <Badge variant={priority === 'high' ? 'error' : priority === 'medium' ? 'warning' : 'outline'}>
            {priority}
          </Badge>
        </div>
      </div>
      {status === 'done' ? <CheckCircle size={20} style={{ color: 'var(--success)' }} /> :
       status === 'progress' ? <Clock size={20} style={{ color: 'var(--accent-primary)' }} /> :
       <div style={{ width: '20px', height: '20px', border: '2px solid var(--border-default)', borderRadius: '50%' }} />}
    </div>
  </Card>
);

const ChatMessage: React.FC<{ message: string; sender: 'user' | 'ai'; timestamp: string }> = ({ message, sender, timestamp }) => (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column',
    alignItems: sender === 'user' ? 'flex-end' : 'flex-start',
    marginBottom: 'var(--space-4)'
  }}>
    <div style={{
      maxWidth: '70%',
      padding: 'var(--space-3)',
      borderRadius: 'var(--radius-lg)',
      background: sender === 'user' ? 'var(--accent-primary)' : 'var(--bg-surface)',
      color: sender === 'user' ? 'white' : 'var(--text-primary)',
      border: sender === 'ai' ? '1px solid var(--border-default)' : 'none'
    }}>
      <p style={{ margin: 0, lineHeight: '1.5' }}>{message}</p>
    </div>
    <span style={{ 
      fontSize: 'var(--font-size-xs)', 
      color: 'var(--text-muted)',
      marginTop: 'var(--space-1)'
    }}>
      {timestamp}
    </span>
  </div>
);

export const ContentReadability: Story = () => (
  <div style={{ 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: 'var(--space-6)',
    padding: 'var(--space-6)',
    background: 'var(--bg-primary)',
    minHeight: '100vh'
  }}>
    <div>
      <h2 style={{ 
        fontSize: 'var(--font-size-2xl)', 
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--text-primary)',
        marginBottom: 'var(--space-4)'
      }}>
        📝 Notes & Documentation
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <NoteCard 
          title="Design System Refinements"
          content="Updated the color palette to use warmer, more professional tones. The new light mode reduces eye strain with off-white backgrounds instead of harsh pure white. The accent colors are more sophisticated and calming for extended work sessions."
          tags={['design', 'ui-ux', 'accessibility']}
        />
        <NoteCard 
          title="User Research Findings"
          content="Interviews with 12 users revealed that the previous blue accent was too vibrant for professional workflows. Users preferred more muted, sophisticated colors that don't compete with content for attention."
          tags={['research', 'user-feedback', 'insights']}
        />
      </div>
    </div>

    <div>
      <h2 style={{ 
        fontSize: 'var(--font-size-2xl)', 
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--text-primary)',
        marginBottom: 'var(--space-4)'
      }}>
        ✅ Task Management
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <TaskCard title="Implement new color scheme" status="done" priority="high" />
        <TaskCard title="Update component library" status="progress" priority="medium" />
        <TaskCard title="Test across all pages" status="todo" priority="medium" />
        <TaskCard title="Gather user feedback" status="todo" priority="low" />
      </div>
    </div>
  </div>
);

ContentReadability.meta = {
  title: 'Design System/Theme/Content Readability',
  description: 'Demonstrates how the refined theme improves readability and reduces eye strain across different content types.',
};

export const ProfessionalWorkflow: Story = () => (
  <div style={{ 
    display: 'grid', 
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--space-6)',
    padding: 'var(--space-6)',
    background: 'var(--bg-primary)',
    minHeight: '100vh'
  }}>
    <div>
      <h2 style={{ 
        fontSize: 'var(--font-size-2xl)', 
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--text-primary)',
        marginBottom: 'var(--space-4)'
      }}>
        💬 AI Conversations
      </h2>
      <div style={{ 
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4)',
        height: '400px',
        overflowY: 'auto'
      }}>
        <ChatMessage 
          sender="user"
          message="Can you help me analyze the performance metrics for our Q3 campaign?"
          timestamp="2:45 PM"
        />
        <ChatMessage 
          sender="ai"
          message="I'd be happy to help you analyze your Q3 campaign performance. Could you share the specific metrics you'd like me to focus on? For example, conversion rates, engagement metrics, or ROI data?"
          timestamp="2:45 PM"
        />
        <ChatMessage 
          sender="user"
          message="Let's focus on conversion rates and cost per acquisition. The data shows some interesting trends."
          timestamp="2:46 PM"
        />
      </div>
      <div style={{ 
        marginTop: 'var(--space-3)',
        display: 'flex',
        gap: 'var(--space-2)'
      }}>
        <Input placeholder="Type your message..." style={{ flex: 1 }} />
        <Button variant="primary">Send</Button>
      </div>
    </div>

    <div>
      <h2 style={{ 
        fontSize: 'var(--font-size-2xl)', 
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--text-primary)',
        marginBottom: 'var(--space-4)'
      }}>
        ⚙️ Settings & Configuration
      </h2>
      <Card>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <h3 style={{ 
            fontSize: 'var(--font-size-lg)', 
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-3)'
          }}>
            Appearance Preferences
          </h3>
          
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label style={{ 
              display: 'block',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-2)'
            }}>
              Theme
            </label>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button variant="outline" size="sm">Light</Button>
              <Button variant="secondary" size="sm">Dark</Button>
              <Button variant="ghost" size="sm">Auto</Button>
            </div>
          </div>

          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label style={{ 
              display: 'block',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-2)'
            }}>
              Font Size
            </label>
            <Input placeholder="14px" />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Button variant="primary">Save Changes</Button>
            <Button variant="ghost">Reset to Default</Button>
          </div>
        </div>
      </Card>
    </div>
  </div>
);

ProfessionalWorkflow.meta = {
  title: 'Design System/Theme/Professional Workflow',
  description: 'Shows how the refined theme supports professional workflows with better visual hierarchy and reduced cognitive load.',
};

export const ColorHarmony: Story = () => (
  <div style={{ 
    padding: 'var(--space-6)',
    background: 'var(--bg-primary)'
  }}>
    <h2 style={{ 
      fontSize: 'var(--font-size-2xl)', 
      fontWeight: 'var(--font-weight-semibold)',
      color: 'var(--text-primary)',
      marginBottom: 'var(--space-6)',
      textAlign: 'center'
    }}>
      🎨 Color Harmony Demonstration
    </h2>
    
    <div style={{ 
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: 'var(--space-6)'
    }}>
      <Card>
        <h3 style={{ 
          fontSize: 'var(--font-size-lg)', 
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-4)'
        }}>
          Background Hierarchy
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ 
            padding: 'var(--space-3)', 
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)'
          }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>Primary Background</span>
          </div>
          <div style={{ 
            padding: 'var(--space-3)', 
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)'
          }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>Secondary Background</span>
          </div>
          <div style={{ 
            padding: 'var(--space-3)', 
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)'
          }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>Tertiary Background</span>
          </div>
          <div style={{ 
            padding: 'var(--space-3)', 
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)'
          }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>Surface Background</span>
          </div>
        </div>
      </Card>

      <Card>
        <h3 style={{ 
          fontSize: 'var(--font-size-lg)', 
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-4)'
        }}>
          Text Contrast Levels
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <p style={{ color: 'var(--text-primary)', fontSize: 'var(--font-size-base)', margin: 0 }}>
            Primary text - High contrast for headings and important content
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-base)', margin: 0 }}>
            Secondary text - Medium contrast for body text and descriptions
          </p>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-base)', margin: 0 }}>
            Tertiary text - Lower contrast for metadata and timestamps
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-base)', margin: 0 }}>
            Muted text - Subtle contrast for placeholders and disabled states
          </p>
        </div>
      </Card>

      <Card>
        <h3 style={{ 
          fontSize: 'var(--font-size-lg)', 
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-4)'
        }}>
          Semantic Colors
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Badge variant="accent">Primary Action</Badge>
            <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>Sophisticated blue for key actions</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Badge variant="success">Success</Badge>
            <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>Calming green for positive feedback</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Badge variant="warning">Warning</Badge>
            <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>Warm orange for cautions</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Badge variant="error">Error</Badge>
            <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>Refined red for errors</span>
          </div>
        </div>
      </Card>
    </div>
  </div>
);

ColorHarmony.meta = {
  title: 'Design System/Theme/Color Harmony',
  description: 'Demonstrates the improved color relationships and contrast levels in the refined theme.',
};

export default {
  title: 'Design System/Theme Improvements',
}; 