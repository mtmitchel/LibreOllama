import type { Story } from '@ladle/react';
import React, { useState } from 'react';
import { Tooltip, TooltipTrigger, TruncatedText } from './Tooltip';
import { Button } from './index';
import { HelpCircle, Info, AlertTriangle, CheckCircle, Calendar, Mail, User, Settings } from 'lucide-react';

export const Tooltips: Story = () => {
  const [manualTooltipOpen, setManualTooltipOpen] = useState(false);
  const [clickTooltipOpen, setClickTooltipOpen] = useState(false);

  const longText = "This is a very long piece of text that demonstrates how the tooltip component handles truncation. It will be automatically truncated if it exceeds the specified maximum length and show the full text in a tooltip when you hover over it. This is particularly useful for displaying long descriptions, file names, or other content that might not fit in the available space.";

  return (
    <div className="space-y-12 bg-primary p-8">
      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Basic tooltips</h2>
        <div className="border-border-default rounded-lg border bg-surface p-6">
          <div className="flex flex-wrap gap-4">
            <Tooltip content="This is a basic tooltip">
              <Button variant="outline">Hover me</Button>
            </Tooltip>
            
            <Tooltip content="Tooltip with longer text that wraps to multiple lines">
              <Button variant="outline">Long content</Button>
            </Tooltip>
            
            <Tooltip content="Disabled tooltip" disabled>
              <Button variant="outline">Disabled tooltip</Button>
            </Tooltip>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Positions</h2>
        <div className="border-border-default rounded-lg border bg-surface p-12">
          <div className="grid grid-cols-3 place-items-center gap-8">
            <div></div>
            <Tooltip content="Top position" position="top">
              <Button variant="outline">Top</Button>
            </Tooltip>
            <div></div>
            
            <Tooltip content="Left position" position="left">
              <Button variant="outline">Left</Button>
            </Tooltip>
            
            <Tooltip content="Auto position (default)" position="auto">
              <Button variant="primary">Auto</Button>
            </Tooltip>
            
            <Tooltip content="Right position" position="right">
              <Button variant="outline">Right</Button>
            </Tooltip>
            
            <div></div>
            <Tooltip content="Bottom position" position="bottom">
              <Button variant="outline">Bottom</Button>
            </Tooltip>
            <div></div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Variants</h2>
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-3">
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Default</h3>
            <Tooltip content="Default tooltip style" variant="default">
              <Button variant="outline">Default</Button>
            </Tooltip>
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Dark</h3>
            <Tooltip content="Dark tooltip style" variant="dark">
              <Button variant="outline">Dark</Button>
            </Tooltip>
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Light</h3>
            <Tooltip content="Light tooltip style" variant="light">
              <Button variant="outline">Light</Button>
            </Tooltip>
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Warning</h3>
            <Tooltip content="Warning tooltip style" variant="warning">
              <Button variant="outline">Warning</Button>
            </Tooltip>
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Error</h3>
            <Tooltip content="Error tooltip style" variant="error">
              <Button variant="outline">Error</Button>
            </Tooltip>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Sizes</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Small</h3>
            <Tooltip content="Small tooltip with compact padding" size="sm">
              <Button variant="outline">Small tooltip</Button>
            </Tooltip>
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Medium</h3>
            <Tooltip content="Medium tooltip with standard padding" size="md">
              <Button variant="outline">Medium tooltip</Button>
            </Tooltip>
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Large</h3>
            <Tooltip content="Large tooltip with generous padding for more prominent display" size="lg">
              <Button variant="outline">Large tooltip</Button>
            </Tooltip>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Trigger types</h2>
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Hover (default)</h3>
            <Tooltip content="Triggered on hover" trigger="hover">
              <Button variant="outline">Hover me</Button>
            </Tooltip>
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Click</h3>
            <Tooltip 
              content="Triggered on click. Click outside to close." 
              trigger="click"
              isOpen={clickTooltipOpen}
              onOpenChange={setClickTooltipOpen}
            >
              <Button variant="outline">Click me</Button>
            </Tooltip>
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Focus</h3>
            <Tooltip content="Triggered on focus" trigger="focus">
              <Button variant="outline">Focus me</Button>
            </Tooltip>
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Manual</h3>
            <div className="space-y-2">
              <Tooltip 
                content="Manually controlled tooltip" 
                trigger="manual"
                isOpen={manualTooltipOpen}
              >
                <Button variant="outline">Target element</Button>
              </Tooltip>
              <button
                onClick={() => setManualTooltipOpen(!manualTooltipOpen)}
                className="rounded bg-accent-primary px-2 py-1 text-xs text-white"
              >
                Toggle
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Delay and animation</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">No delay</h3>
            <Tooltip content="Appears immediately" delay={0}>
              <Button variant="outline">Instant</Button>
            </Tooltip>
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Default delay (300ms)</h3>
            <Tooltip content="Appears after 300ms">
              <Button variant="outline">Default</Button>
            </Tooltip>
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Long delay (1000ms)</h3>
            <Tooltip content="Appears after 1 second" delay={1000}>
              <Button variant="outline">Slow</Button>
            </Tooltip>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Arrow variations</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">With arrow (default)</h3>
            <Tooltip content="Tooltip with arrow pointer" arrow={true}>
              <Button variant="outline">Arrow tooltip</Button>
            </Tooltip>
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Without arrow</h3>
            <Tooltip content="Tooltip without arrow pointer" arrow={false}>
              <Button variant="outline">No arrow</Button>
            </Tooltip>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Truncation features</h2>
        <div className="border-border-default space-y-6 rounded-lg border bg-surface p-6">
          <div>
            <h3 className="mb-4 font-medium text-primary">Built-in truncation</h3>
            <Tooltip 
              content={longText}
              truncate={true}
              truncateLength={50}
            >
              <Button variant="outline">Truncated tooltip</Button>
            </Tooltip>
          </div>
          
          <div>
            <h3 className="mb-4 font-medium text-primary">TruncatedText component</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-primary">File name: </span>
                <TruncatedText maxLength={30}>
                  very-long-filename-that-needs-truncation-example.pdf
                </TruncatedText>
              </div>
              
              <div>
                <span className="text-sm font-medium text-primary">Description: </span>
                <TruncatedText maxLength={60}>
                  {longText}
                </TruncatedText>
              </div>
              
              <div>
                <span className="text-sm font-medium text-primary">No tooltip: </span>
                <TruncatedText maxLength={30} tooltip={false}>
                  This text is truncated but has no tooltip
                </TruncatedText>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Rich content</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Complex content</h3>
            <Tooltip 
              content={
                <div className="space-y-2">
                  <div className="font-medium">User Information</div>
                  <div className="text-xs">
                    <div>Name: John Doe</div>
                    <div>Email: john@example.com</div>
                    <div>Role: Administrator</div>
                  </div>
                </div>
              }
              size="lg"
            >
              <Button variant="outline">Rich tooltip</Button>
            </Tooltip>
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Custom formatter</h3>
            <Tooltip 
              content={"Formatted: Raw tooltip content"}
            >
              <Button variant="outline">Custom format</Button>
            </Tooltip>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Use cases</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">UI elements with help</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-primary">API Key</label>
                <Tooltip content="Your unique identifier for API access. Keep this secret!" variant="dark">
                  <HelpCircle className="size-4 cursor-help text-secondary" />
                </Tooltip>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-primary">Auto-save</label>
                <Tooltip content="Automatically save your changes every 30 seconds" variant="default">
                  <Info className="size-4 cursor-help text-accent-primary" />
                </Tooltip>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-primary">Public profile</label>
                <Tooltip content="Warning: This will make your profile visible to everyone" variant="warning">
                  <AlertTriangle className="size-4 cursor-help text-warning" />
                </Tooltip>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-primary">Verified account</label>
                <Tooltip content="Your account has been verified" variant="default">
                  <CheckCircle className="size-4 cursor-help text-success" />
                </Tooltip>
              </div>
            </div>
          </div>
          
          <div className="border-border-default rounded-lg border bg-surface p-6">
            <h3 className="mb-4 font-medium text-primary">Navigation with tooltips</h3>
            <div className="space-y-3">
              <TooltipTrigger tooltip="View calendar events">
                <button className="flex w-full items-center gap-2 rounded p-2 text-left hover:bg-tertiary">
                  <Calendar className="size-4 text-accent-primary" />
                  <span className="text-sm text-primary">Calendar</span>
                </button>
              </TooltipTrigger>
              
              <TooltipTrigger tooltip="Check your messages">
                <button className="flex w-full items-center gap-2 rounded p-2 text-left hover:bg-tertiary">
                  <Mail className="size-4 text-accent-primary" />
                  <span className="text-sm text-primary">Messages</span>
                </button>
              </TooltipTrigger>
              
              <TooltipTrigger tooltip="Manage user accounts">
                <button className="flex w-full items-center gap-2 rounded p-2 text-left hover:bg-tertiary">
                  <User className="size-4 text-accent-primary" />
                  <span className="text-sm text-primary">Users</span>
                </button>
              </TooltipTrigger>
              
              <TooltipTrigger tooltip="Application settings">
                <button className="flex w-full items-center gap-2 rounded p-2 text-left hover:bg-tertiary">
                  <Settings className="size-4 text-accent-primary" />
                  <span className="text-sm text-primary">Settings</span>
                </button>
              </TooltipTrigger>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Calendar example</h2>
        <div className="border-border-default rounded-lg border bg-surface p-6">
          <h3 className="mb-4 font-medium text-primary">Event calendar with truncated titles</h3>
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-secondary">
                {day}
              </div>
            ))}
            
            {Array.from({ length: 35 }, (_, i) => {
              const events = [
                'Team standup meeting',
                'Client presentation - Q4 results',
                'Code review session',
                'Design workshop - User experience improvements',
                'Sprint planning meeting',
                'One-on-one with manager',
                'Product demo to stakeholders'
              ];
              
              const hasEvent = Math.random() > 0.7;
              const event = hasEvent ? events[Math.floor(Math.random() * events.length)] : null;
              
              return (
                <div key={i} className="border-border-subtle h-20 rounded border p-1">
                  <div className="text-xs text-secondary">{((i % 31) + 1)}</div>
                  {event && (
                    <TruncatedText 
                      maxLength={15} 
                      className="mt-1 block rounded bg-accent-soft p-1 text-xs text-accent-primary"
                    >
                      {event}
                    </TruncatedText>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-primary">Custom styling</h2>
        <div className="border-border-default rounded-lg border bg-surface p-6">
          <div className="flex flex-wrap gap-4">
            <Tooltip 
              content="Custom styled tooltip" 
              className="font-bold"
              contentClassName="!bg-accent-primary !text-white !border-accent-primary"
            >
              <Button variant="outline">Custom colors</Button>
            </Tooltip>
            
            <Tooltip 
              content="Wide tooltip with custom max width" 
              maxWidth="500px"
            >
              <Button variant="outline">Wide tooltip</Button>
            </Tooltip>
            
            <Tooltip 
              content="Narrow tooltip" 
              maxWidth="150px"
            >
              <Button variant="outline">Narrow tooltip</Button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
};

Tooltips.meta = {
  title: 'Design System/Components/Tooltip',
}; 