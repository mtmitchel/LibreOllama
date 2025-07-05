/**
 * Button Component Stories
 * 
 * Showcases all button variants, sizes, and states as defined in the LibreOllama design system.
 * These stories serve as both documentation and testing for the button component.
 */
import type { Story } from '@ladle/react';
import React from 'react';
import { Button } from './index';
import { Plus, Download, Settings, Heart, Search } from 'lucide-react';

// All variants showcase
export const AllVariants: Story = () => (
  <div style={{ display: 'flex', gap: '16px', padding: '16px' }}>
    <Button variant="primary">
      <Plus size={16} />
      Primary
    </Button>
    <Button variant="secondary">
      <Download size={16} />
      Secondary
    </Button>
    <Button variant="ghost">
      <Settings size={16} />
      Ghost
    </Button>
  </div>
);

AllVariants.meta = {
  title: 'Components/Button/All Variants',
  description: 'Overview of all button variants, sizes, and states available in the design system.',
};

// Individual variant stories with controls
export const Primary: Story = () => (
  <Button variant="primary">
    <Plus size={16} />
    Primary Button
  </Button>
);

Primary.args = {
  children: 'Primary Button',
  disabled: false,
  size: 'default',
};

Primary.argTypes = {
  children: {
    control: { type: 'text' },
    description: 'Button text content',
  },
  disabled: {
    control: { type: 'boolean' },
    description: 'Disable the button',
  },
  size: {
    control: { type: 'select' },
    options: ['sm', 'default', 'icon'],
    description: 'Button size variant',
  },
};

Primary.meta = {
  title: 'Components/Button/Primary',
  description: 'Primary button used for main call-to-action elements. Uses --accent-primary color.',
};

export const Secondary: Story = ({ children = 'Secondary Button', disabled = false, size = 'default' }) => (
  <Button variant="secondary" disabled={disabled} size={size}>
    <Download size={16} />
    {children}
  </Button>
);

Secondary.args = {
  children: 'Secondary Button',
  disabled: false,
  size: 'default',
};

Secondary.argTypes = {
  children: { control: { type: 'text' } },
  disabled: { control: { type: 'boolean' } },
  size: { control: { type: 'select' }, options: ['sm', 'default', 'icon'] },
};

Secondary.meta = {
  title: 'Components/Button/Secondary',
  description: 'Secondary button for less prominent actions. Uses --bg-tertiary background.',
};

export const Ghost: Story = ({ children = 'Ghost Button', disabled = false, size = 'default' }) => (
  <Button variant="ghost" disabled={disabled} size={size}>
    <Settings size={16} />
    {children}
  </Button>
);

Ghost.args = {
  children: 'Ghost Button',
  disabled: false,
  size: 'default',
};

Ghost.argTypes = {
  children: { control: { type: 'text' } },
  disabled: { control: { type: 'boolean' } },
  size: { control: { type: 'select' }, options: ['sm', 'default', 'icon'] },
};

Ghost.meta = {
  title: 'Components/Button/Ghost',
  description: 'Ghost button with transparent background, used for tertiary actions.',
};

export const WithIcons: Story = () => (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column', 
    gap: 'var(--space-4)',
    padding: 'var(--space-4)'
  }}>
    <h3 style={{ 
      color: 'var(--text-primary)',
      fontSize: 'var(--font-size-lg)',
      fontWeight: 'var(--font-weight-semibold)',
      marginBottom: 'var(--space-3)'
    }}>
      Buttons with Icons
    </h3>
    
    <div style={{ 
      display: 'flex', 
      gap: 'var(--space-3)', 
      flexWrap: 'wrap',
      alignItems: 'center'
    }}>
      <Button variant="primary">
        <Plus size={16} />
        Create New
      </Button>
      
      <Button variant="secondary">
        <Download size={16} />
        Download
      </Button>
      
      <Button variant="ghost">
        <Settings size={16} />
        Settings
      </Button>
      
      <Button variant="primary" size="icon">
        <Plus size={16} />
      </Button>
      
      <Button variant="secondary" size="icon">
        <Search size={16} />
      </Button>
    </div>
  </div>
);

WithIcons.meta = {
  title: 'Components/Button/With Icons',
  description: 'Examples of buttons with Lucide React icons, showing proper spacing and sizing.',
};

// Usage examples in context
export const UsageExamples: Story = () => (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column', 
    gap: 'var(--space-8)',
    padding: 'var(--space-4)'
  }}>
    <div>
      <h3 style={{ 
        color: 'var(--text-primary)',
        fontSize: 'var(--font-size-lg)',
        fontWeight: 'var(--font-weight-semibold)',
        marginBottom: 'var(--space-4)'
      }}>
        Dialog Actions
      </h3>
      <div style={{ 
        display: 'flex', 
        gap: 'var(--space-3)', 
        justifyContent: 'flex-end',
        padding: 'var(--space-4)',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)'
      }}>
        <Button variant="ghost">Cancel</Button>
        <Button variant="primary">Save Changes</Button>
      </div>
    </div>

    <div>
      <h3 style={{ 
        color: 'var(--text-primary)',
        fontSize: 'var(--font-size-lg)',
        fontWeight: 'var(--font-weight-semibold)',
        marginBottom: 'var(--space-4)'
      }}>
        Toolbar Actions
      </h3>
      <div style={{ 
        display: 'flex', 
        gap: 'var(--space-2)',
        padding: 'var(--space-3)',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)'
      }}>
        <Button variant="ghost" size="icon">
          <Plus size={16} />
        </Button>
        <Button variant="ghost" size="icon">
          <Download size={16} />
        </Button>
        <Button variant="ghost" size="icon">
          <Settings size={16} />
        </Button>
      </div>
    </div>

    <div>
      <h3 style={{ 
        color: 'var(--text-primary)',
        fontSize: 'var(--font-size-lg)',
        fontWeight: 'var(--font-weight-semibold)',
        marginBottom: 'var(--space-4)'
      }}>
        Quick Actions
      </h3>
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 'var(--space-3)',
        maxWidth: '400px'
      }}>
        <Button variant="secondary">
          <Plus size={16} />
          New Project
        </Button>
        <Button variant="secondary">
          <Download size={16} />
          Export Data
        </Button>
        <Button variant="secondary">
          <Settings size={16} />
          Settings
        </Button>
        <Button variant="secondary">
          <Heart size={16} />
          Favorites
        </Button>
      </div>
    </div>
  </div>
);

UsageExamples.meta = {
  title: 'Components/Button/Usage Examples',
  description: 'Real-world usage examples showing buttons in different contexts like dialogs, toolbars, and action grids.',
};

export default {
  title: 'Components/Button',
}; 