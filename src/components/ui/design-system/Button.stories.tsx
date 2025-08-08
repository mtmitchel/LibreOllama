import type { Story } from '@ladle/react';
import { Button } from './Button';
import { Plus, ArrowRight, Trash2, Download, Check, X } from 'lucide-react';

export default {
  title: 'Design System/Button',
};

/**
 * Primary Button
 * Used for main actions like "Save", "Submit", "Create"
 */
export const Primary: Story = () => (
  <div className="flex flex-wrap gap-4">
    <Button variant="primary" size="sm">Small Button</Button>
    <Button variant="primary">Default Button</Button>
    <Button variant="primary" size="lg">Large Button</Button>
  </div>
);

/**
 * Secondary Button
 * Used for secondary actions
 */
export const Secondary: Story = () => (
  <div className="flex flex-wrap gap-4">
    <Button variant="secondary" size="sm">Small Button</Button>
    <Button variant="secondary">Default Button</Button>
    <Button variant="secondary" size="lg">Large Button</Button>
  </div>
);

/**
 * Ghost Button
 * Used for tertiary actions with minimal visual weight
 */
export const Ghost: Story = () => (
  <div className="flex flex-wrap gap-4">
    <Button variant="ghost" size="sm">Small Button</Button>
    <Button variant="ghost">Default Button</Button>
    <Button variant="ghost" size="lg">Large Button</Button>
  </div>
);

/**
 * Outline Button
 * Used for actions that need emphasis but not primary status
 */
export const Outline: Story = () => (
  <div className="flex flex-wrap gap-4">
    <Button variant="outline" size="sm">Small Button</Button>
    <Button variant="outline">Default Button</Button>
    <Button variant="outline" size="lg">Large Button</Button>
  </div>
);

/**
 * Destructive Button
 * Used for dangerous actions like "Delete", "Remove"
 */
export const Destructive: Story = () => (
  <div className="flex flex-wrap gap-4">
    <Button variant="destructive" size="sm">Delete</Button>
    <Button variant="destructive">Remove Item</Button>
    <Button variant="destructive" size="lg">Delete Account</Button>
  </div>
);

/**
 * Button with Icons
 * Icons can be placed on either side of the text
 */
export const WithIcons: Story = () => (
  <div className="flex flex-col gap-4">
    <div className="flex flex-wrap gap-4">
      <Button leftIcon={<Plus size={16} />}>Add Item</Button>
      <Button rightIcon={<ArrowRight size={16} />}>Continue</Button>
      <Button leftIcon={<Download size={16} />} rightIcon={<ArrowRight size={16} />}>
        Download & Continue
      </Button>
    </div>
    <div className="flex flex-wrap gap-4">
      <Button variant="secondary" leftIcon={<Check size={16} />}>Approve</Button>
      <Button variant="ghost" leftIcon={<X size={16} />}>Cancel</Button>
      <Button variant="destructive" leftIcon={<Trash2 size={16} />}>Delete</Button>
    </div>
  </div>
);

/**
 * Icon-only Buttons
 * Used for compact actions in toolbars or tight spaces
 */
export const IconOnly: Story = () => (
  <div className="flex flex-wrap gap-4 items-center">
    <Button variant="primary" size="icon" aria-label="Add">
      <Plus size={18} />
    </Button>
    <Button variant="secondary" size="icon" aria-label="Download">
      <Download size={18} />
    </Button>
    <Button variant="ghost" size="icon" aria-label="Delete">
      <Trash2 size={18} />
    </Button>
    <Button variant="outline" size="icon" aria-label="Check">
      <Check size={18} />
    </Button>
    <Button variant="destructive" size="icon" aria-label="Close">
      <X size={18} />
    </Button>
  </div>
);

/**
 * Loading States
 * Shows loading spinner and optional loading text
 */
export const LoadingStates: Story = () => (
  <div className="flex flex-col gap-4">
    <div className="flex flex-wrap gap-4">
      <Button isLoading>Default Loading</Button>
      <Button isLoading loadingText="Saving...">With Loading Text</Button>
      <Button variant="secondary" isLoading loadingText="Processing...">
        Secondary Loading
      </Button>
    </div>
    <div className="flex flex-wrap gap-4">
      <Button size="sm" isLoading>Small</Button>
      <Button size="default" isLoading>Default</Button>
      <Button size="lg" isLoading>Large</Button>
      <Button size="icon" isLoading aria-label="Loading" />
    </div>
  </div>
);

/**
 * Disabled States
 * Disabled buttons have reduced opacity and no interaction
 */
export const DisabledStates: Story = () => (
  <div className="flex flex-wrap gap-4">
    <Button disabled>Primary Disabled</Button>
    <Button variant="secondary" disabled>Secondary Disabled</Button>
    <Button variant="ghost" disabled>Ghost Disabled</Button>
    <Button variant="outline" disabled>Outline Disabled</Button>
    <Button variant="destructive" disabled>Destructive Disabled</Button>
  </div>
);

/**
 * All Variants Showcase
 * Complete showcase of all button variants and states
 */
export const AllVariants: Story = () => (
  <div className="space-y-8">
    <div>
      <h3 className="text-lg font-semibold mb-4">Primary Variant</h3>
      <div className="flex flex-wrap gap-4">
        <Button variant="primary" size="sm">Small</Button>
        <Button variant="primary">Default</Button>
        <Button variant="primary" size="lg">Large</Button>
        <Button variant="primary" disabled>Disabled</Button>
        <Button variant="primary" isLoading>Loading</Button>
      </div>
    </div>

    <div>
      <h3 className="text-lg font-semibold mb-4">Secondary Variant</h3>
      <div className="flex flex-wrap gap-4">
        <Button variant="secondary" size="sm">Small</Button>
        <Button variant="secondary">Default</Button>
        <Button variant="secondary" size="lg">Large</Button>
        <Button variant="secondary" disabled>Disabled</Button>
        <Button variant="secondary" isLoading>Loading</Button>
      </div>
    </div>

    <div>
      <h3 className="text-lg font-semibold mb-4">Ghost Variant</h3>
      <div className="flex flex-wrap gap-4">
        <Button variant="ghost" size="sm">Small</Button>
        <Button variant="ghost">Default</Button>
        <Button variant="ghost" size="lg">Large</Button>
        <Button variant="ghost" disabled>Disabled</Button>
        <Button variant="ghost" isLoading>Loading</Button>
      </div>
    </div>

    <div>
      <h3 className="text-lg font-semibold mb-4">Outline Variant</h3>
      <div className="flex flex-wrap gap-4">
        <Button variant="outline" size="sm">Small</Button>
        <Button variant="outline">Default</Button>
        <Button variant="outline" size="lg">Large</Button>
        <Button variant="outline" disabled>Disabled</Button>
        <Button variant="outline" isLoading>Loading</Button>
      </div>
    </div>

    <div>
      <h3 className="text-lg font-semibold mb-4">Destructive Variant</h3>
      <div className="flex flex-wrap gap-4">
        <Button variant="destructive" size="sm">Small</Button>
        <Button variant="destructive">Default</Button>
        <Button variant="destructive" size="lg">Large</Button>
        <Button variant="destructive" disabled>Disabled</Button>
        <Button variant="destructive" isLoading>Loading</Button>
      </div>
    </div>
  </div>
);

/**
 * Real-world Examples
 * Common button combinations used in the application
 */
export const RealWorldExamples: Story = () => (
  <div className="space-y-6">
    <div className="flex gap-3 justify-end p-4 border-t">
      <Button variant="ghost">Cancel</Button>
      <Button variant="primary">Save Changes</Button>
    </div>

    <div className="flex gap-3 justify-end p-4 border-t">
      <Button variant="ghost">Skip</Button>
      <Button variant="secondary">Save Draft</Button>
      <Button variant="primary" rightIcon={<ArrowRight size={16} />}>
        Continue
      </Button>
    </div>

    <div className="flex gap-3 justify-between p-4 border-t">
      <Button variant="destructive" leftIcon={<Trash2 size={16} />}>
        Delete Item
      </Button>
      <div className="flex gap-3">
        <Button variant="ghost">Cancel</Button>
        <Button variant="primary">Confirm</Button>
      </div>
    </div>

    <div className="flex gap-2 p-4">
      <Button variant="primary" leftIcon={<Plus size={16} />}>
        New Task
      </Button>
      <Button variant="secondary" leftIcon={<Download size={16} />}>
        Export
      </Button>
      <Button variant="ghost" size="icon" aria-label="More options">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="2" r="1.5" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="8" cy="14" r="1.5" />
        </svg>
      </Button>
    </div>
  </div>
);